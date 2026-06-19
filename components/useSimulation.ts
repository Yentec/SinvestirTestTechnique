'use client';

import { useState, useCallback } from 'react';
import { simulate, type SimulationResult } from '@/lib/simulate';
import type { FormState } from '@/components/SimulatorForm';
import type { PricesResponse, PriceSource, ApiError } from '@/lib/api-types';

interface SimulationState {
  result: SimulationResult | null;
  source: PriceSource | null;
  symbol: string;
  loading: boolean;
  error: string | null;
}

const INITIAL: SimulationState = {
  result: null,
  source: null,
  symbol: '',
  loading: false,
  error: null,
};

/** Map coinId → symbole, pour l'affichage (évite un import circulaire). */
import { SUPPORTED_COINS } from '@/lib/coingecko';
function symbolOf(coinId: string): string {
  return SUPPORTED_COINS.find((c) => c.id === coinId)?.symbol ?? coinId;
}

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(INITIAL);

  const run = useCallback(async (form: FormState) => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const params = new URLSearchParams({
        coin: form.coin,
        from: form.from,
        to: form.to,
      });
      const res = await fetch(`/api/prices?${params}`);

      if (!res.ok) {
        const body = (await res.json()) as ApiError;
        throw new Error(
          body.error ?? 'Erreur lors de la récupération des prix.',
        );
      }

      const data = (await res.json()) as PricesResponse;

      if (data.prices.length === 0) {
        throw new Error('Aucune donnée disponible pour cette période.');
      }

      // Calcul local : la logique pure tourne côté client.
      const result = simulate({
        prices: data.prices,
        amount: form.amount,
        frequency: form.frequency,
      });

      setState({
        result,
        source: data.source,
        symbol: symbolOf(form.coin),
        loading: false,
        error: null,
      });
    } catch (e) {
      setState({
        ...INITIAL,
        error: e instanceof Error ? e.message : 'Une erreur est survenue.',
      });
    }
  }, []);

  return { ...state, run };
}
