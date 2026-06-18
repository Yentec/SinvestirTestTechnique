/**
 * Génère les datasets de fallback (prix journaliers EUR) pour les cryptos
 * supportées, de l'origine de chaque paire jusqu'à aujourd'hui.
 *
 * Sources :
 *  - Binance /api/v3/klines : prix journaliers en USDT (historique long, gratuit, sans clé).
 *  - Frankfurter (BCE)       : taux USD→EUR journalier pour conversion (USDT ≈ USD).
 *
 * Usage : npx tsx scripts/fetch-fallback.ts
 * Écrit  : data/fallback/{coinId}.json
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

// Map coinId (CoinGecko) → symbole de paire Binance.
const COINS = [
  { coinId: 'bitcoin', symbol: 'BTC', binance: 'BTCUSDT' },
  { coinId: 'ethereum', symbol: 'ETH', binance: 'ETHUSDT' },
  { coinId: 'solana', symbol: 'SOL', binance: 'SOLUSDT' },
  { coinId: 'binancecoin', symbol: 'BNB', binance: 'BNBUSDT' },
  { coinId: 'ripple', symbol: 'XRP', binance: 'XRPUSDT' },
] as const;

const BINANCE = 'https://api.binance.com/api/v3/klines';
const FRANKFURTER = 'https://api.frankfurter.dev/v1';
const DAY_MS = 86_400_000;

interface PricePoint {
  date: string;
  price: number;
}

function toISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Récupère toutes les bougies journalières d'une paire Binance, en paginant
 * (limite 1000 bougies par appel). Renvoie [dateISO, closeUSDT][].
 */
async function fetchBinanceDaily(
  pair: string,
): Promise<{ date: string; usdt: number }[]> {
  const out: { date: string; usdt: number }[] = [];
  let startTime = Date.parse('2017-01-01T00:00:00Z');
  const now = Date.now();

  while (startTime < now) {
    const url = `${BINANCE}?symbol=${pair}&interval=1d&limit=1000&startTime=${startTime}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Binance ${pair} → ${res.status} ${res.statusText}`);
    }
    const klines = (await res.json()) as unknown[][];
    if (klines.length === 0) break;

    for (const k of klines) {
      const openTime = k[0] as number;
      const close = parseFloat(k[4] as string); // close price
      out.push({ date: toISODate(openTime), usdt: close });
    }

    const lastOpen = klines[klines.length - 1]![0] as number;
    startTime = lastOpen + DAY_MS; // page suivante
    if (klines.length < 1000) break; // dernière page
    await sleep(250); // courtoisie : on évite de marteler l'API
  }
  return out;
}

/**
 * Taux USD→EUR journalier sur une plage, via Frankfurter (BCE).
 * Renvoie une Map dateISO → taux. Les week-ends/fériés BCE n'ont pas de taux ;
 * on comblera par report du dernier taux connu.
 */
async function fetchUsdEurRates(
  startISO: string,
  endISO: string,
): Promise<Map<string, number>> {
  const url = `${FRANKFURTER}/${startISO}..${endISO}?base=USD&symbols=EUR`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Frankfurter → ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as {
    rates: Record<string, { EUR: number }>;
  };
  const map = new Map<string, number>();
  for (const [date, r] of Object.entries(data.rates)) {
    map.set(date, r.EUR);
  }
  return map;
}

/** Comble les dates sans taux (week-ends) par report du dernier taux connu. */
function fillRates(
  dates: string[],
  rates: Map<string, number>,
): Map<string, number> {
  const filled = new Map<string, number>();
  let last = 0;
  for (const d of dates) {
    if (rates.has(d)) last = rates.get(d)!;
    if (last > 0) filled.set(d, last);
  }
  return filled;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const outDir = join(process.cwd(), 'data', 'fallback');
  await mkdir(outDir, { recursive: true });

  for (const coin of COINS) {
    process.stdout.write(`→ ${coin.symbol} … `);

    const daily = await fetchBinanceDaily(coin.binance);
    if (daily.length === 0) {
      console.warn(`aucune donnée Binance pour ${coin.binance}, ignoré.`);
      continue;
    }

    const startISO = daily[0]!.date;
    const endISO = daily[daily.length - 1]!.date;
    const rawRates = await fetchUsdEurRates(startISO, endISO);
    const rates = fillRates(
      daily.map((d) => d.date),
      rawRates,
    );

    const prices: PricePoint[] = daily
      .filter((d) => rates.has(d.date))
      .map((d) => ({
        date: d.date,
        price: Math.round(d.usdt * rates.get(d.date)! * 100) / 100,
      }));

    const payload = {
      coinId: coin.coinId,
      symbol: coin.symbol,
      currency: 'EUR',
      source:
        'Binance klines (USDT) × taux USD→EUR BCE (Frankfurter), snapshot de génération',
      generatedAt: new Date().toISOString(),
      prices,
    };

    await writeFile(
      join(outDir, `${coin.coinId}.json`),
      JSON.stringify(payload, null, 2),
      'utf-8',
    );
    console.log(`${prices.length} points (${startISO} → ${endISO})`);
  }

  console.log('Terminé.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
