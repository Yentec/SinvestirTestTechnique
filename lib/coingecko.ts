/**
 * Client CoinGecko + whitelist des cryptos supportées en démo.
 * Aucune clé API requise (endpoint public). La fonction renvoie une série
 * de prix journaliers normalisée, prête pour `simulate()`.
 */
import type { PricePoint } from '@/lib/simulate';

/** Cryptos supportées en démo. `id` = identifiant CoinGecko. */
export const SUPPORTED_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
] as const;

export type CoinId = (typeof SUPPORTED_COINS)[number]['id'];

export function isSupportedCoin(id: string): id is CoinId {
  return SUPPORTED_COINS.some((c) => c.id === id);
}

interface MarketChartResponse {
  // CoinGecko renvoie [timestampMs, price][]
  prices: [number, number][];
}

/** Erreur amont dédiée (échec de la source externe). Pas de classe. */
export function upstreamError(message: string): never {
  const error = new Error(message);
  error.name = 'UpstreamError';
  throw error;
}

/** Convertit un timestamp ms en date ISO (YYYY-MM-DD), en UTC. */
function toISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Récupère la série de prix journaliers d'une crypto sur [from, to].
 * @param from/to timestamps Unix en SECONDES.
 * @throws Error("UpstreamError") si l'appel échoue (le caller gère le fallback).
 */
export async function fetchMarketChart(
  coinId: CoinId,
  from: number,
  to: number,
): Promise<PricePoint[]> {
  const url =
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range` +
    `?vs_currency=eur&from=${from}&to=${to}&x_cg_demo_api_key=CG-GUGfd3d7cZdQRy4P7MUorYL5`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { accept: 'application/json' },
      // Cache Vercel : revalidation horaire pour limiter les appels CoinGecko.
      next: { revalidate: 3600 },
    });
  } catch (cause) {
    return upstreamError(`CoinGecko injoignable: ${String(cause)}`);
  }

  if (!res.ok) {
    return upstreamError(
      `CoinGecko a répondu ${res.status} (${res.statusText}).`,
    );
  }

  const data = (await res.json()) as MarketChartResponse;
  return normalizeToDaily(data.prices);
}

/**
 * CoinGecko peut renvoyer plusieurs points par jour (granularité horaire sur
 * les courtes plages). On garde le dernier prix de chaque jour pour obtenir
 * une série journalière propre, conforme à l'hypothèse de `simulate()`.
 */
export function normalizeToDaily(raw: [number, number][]): PricePoint[] {
  const byDay = new Map<string, number>();
  for (const [ms, price] of raw) {
    byDay.set(toISODate(ms), price); // écrase → dernier prix du jour conservé
  }
  return [...byDay.entries()]
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
