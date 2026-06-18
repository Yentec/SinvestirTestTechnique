/**
 * GET /api/prices?coin=bitcoin&from=2024-01-01&to=2025-01-01
 *
 * Renvoie la série de prix journaliers d'une crypto supportée.
 * Stratégie : appel live CoinGecko, puis repli sur le dataset figé si l'API
 * échoue. L'en-tête `x-price-source` indique la source servie (live | fallback).
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  fetchMarketChart,
  isSupportedCoin,
  type CoinId,
} from '@/lib/coingecko';
import type { PricePoint } from '@/lib/simulate';

const LIVE_WINDOW_DAYS = 365;

/** Vrai si la plage [from, to] tient dans la fenêtre live (365 j glissants). */
function isWithinLiveWindow(fromTs: number, toTs: number): boolean {
  const nowTs = Math.floor(Date.now() / 1000);
  const earliestLive = nowTs - LIVE_WINDOW_DAYS * 86_400;
  return fromTs >= earliestLive && toTs <= nowTs;
}

/** Convertit une date ISO (YYYY-MM-DD) en timestamp Unix secondes (UTC). */
function isoToUnixSeconds(iso: string): number | null {
  const ms = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

async function readFallback(coinId: CoinId): Promise<PricePoint[]> {
  const path = join(process.cwd(), 'data', 'fallback', `${coinId}.json`);
  const raw = await readFile(path, 'utf-8');
  const parsed = JSON.parse(raw) as { prices: PricePoint[] };
  return parsed.prices;
}

/** Borne une série figée sur l'intervalle [from, to] demandé. */
function clampSeries(
  prices: PricePoint[],
  from: string,
  to: string,
): PricePoint[] {
  return prices.filter((p) => p.date >= from && p.date <= to);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const coin = searchParams.get('coin') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  // --- Validation des paramètres (→ 400, on n'appelle pas l'API) ---
  if (!isSupportedCoin(coin)) {
    return NextResponse.json(
      { error: 'Crypto non supportée.', code: 'INVALID_INPUT' },
      { status: 400 },
    );
  }
  const fromTs = isoToUnixSeconds(from);
  const toTs = isoToUnixSeconds(to);
  if (fromTs === null || toTs === null || fromTs >= toTs) {
    return NextResponse.json(
      { error: 'Intervalle de dates invalide.', code: 'INVALID_INPUT' },
      { status: 400 },
    );
  }

  // --- Sélection de la source ---
  // Plage dans les 365 derniers jours → live (avec fallback si l'API échoue).
  // Plage plus ancienne → fallback direct (au-delà du plan gratuit CoinGecko).
  if (isWithinLiveWindow(fromTs, toTs)) {
    try {
      const prices = await fetchMarketChart(coin, fromTs, toTs);
      return NextResponse.json(
        { coin, source: 'live', prices },
        { headers: { 'x-price-source': 'live' } },
      );
    } catch (liveError) {
      console.error('[prices] live failed, falling back:', liveError);
      // on retombe sur le fallback ci-dessous
    }
  }

  // --- Fallback (historique long ou échec live) ---
  try {
    const full = await readFallback(coin);
    const prices = clampSeries(full, from, to);
    if (prices.length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée pour cette période.', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { coin, source: 'fallback', prices },
      { headers: { 'x-price-source': 'fallback' } },
    );
  } catch (fallbackError) {
    console.error('[prices] fallback failed:', fallbackError);
    return NextResponse.json(
      { error: 'Données indisponibles.', code: 'UPSTREAM' },
      { status: 502 },
    );
  }
}
