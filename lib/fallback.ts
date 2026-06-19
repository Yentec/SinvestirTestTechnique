/**
 * Datasets de fallback importés en statique (bundlés au build).
 * Remplace toute lecture disque : fiable en environnement serverless.
 */
import type { PricePoint } from '@/lib/simulate';
import type { CoinId } from '@/lib/coingecko';

import bitcoin from '@/data/fallback/bitcoin.json';
import ethereum from '@/data/fallback/ethereum.json';
import solana from '@/data/fallback/solana.json';
import binancecoin from '@/data/fallback/binancecoin.json';
import ripple from '@/data/fallback/ripple.json';

interface FallbackDataset {
  coinId: string;
  symbol: string;
  currency: string;
  source: string;
  generatedAt?: string;
  prices: PricePoint[];
}

const DATASETS: Record<CoinId, FallbackDataset> = {
  bitcoin: bitcoin as FallbackDataset,
  ethereum: ethereum as FallbackDataset,
  solana: solana as FallbackDataset,
  binancecoin: binancecoin as FallbackDataset,
  ripple: ripple as FallbackDataset,
};

/** Renvoie la série de prix figée d'une crypto supportée. */
export function getFallbackPrices(coinId: CoinId): PricePoint[] {
  return DATASETS[coinId].prices;
}
