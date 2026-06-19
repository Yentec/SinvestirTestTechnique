import type { PricePoint } from '@/lib/simulate';

export type PriceSource = 'live' | 'fallback';

export interface PricesResponse {
  coin: string;
  source: PriceSource;
  prices: PricePoint[];
}

export type ApiErrorCode = 'INVALID_INPUT' | 'NOT_FOUND' | 'UPSTREAM';

export interface ApiError {
  error: string;
  code: ApiErrorCode;
}
