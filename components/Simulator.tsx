'use client';

import { useEffect, useState } from 'react';
import { SimulatorForm, type FormState } from '@/components/SimulatorForm';
import { ResultsCard } from '@/components/ResultsCard';
import { PerformanceChart } from '@/components/PerformanceChart';
import { GainsChart } from '@/components/GainsChart';
import { useSimulation } from '@/components/useSimulation';

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

const DEFAULT_FORM: FormState = {
  coin: 'bitcoin',
  amount: 1000,
  frequency: 'monthly',
  ...defaultRange(),
};

interface SimulatorProps {
  embedded?: boolean;
}

// Délai d'inactivité avant de relancer la simulation automatiquement.
const AUTO_RUN_DELAY_MS = 2000;

export function Simulator({ embedded = false }: SimulatorProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const { result, source, symbol, loading, error, run } = useSimulation();

  // Relance la simulation après une pause dans la saisie (debounce), y
  // compris au montage pour le formulaire par défaut : plus besoin de bouton.
  useEffect(() => {
    const timer = setTimeout(() => run(form), AUTO_RUN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [form, run]);

  return (
    <div className="flex flex-col gap-5">
      {/* Ligne 1 : formulaire + chiffres clés côte à côte (desktop) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SimulatorForm value={form} onChange={setForm} loading={loading} />
        {result ? (
          <ResultsCard result={result} symbol={symbol} />
        ) : (
          <div className="flex items-center justify-center rounded-card border border-dashed border-white/10 bg-bg-card/40 p-6 text-center text-sm text-white/40">
            Renseignez les paramètres et lancez la simulation pour voir les
            résultats.
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-input border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative"
        >
          {error}
        </div>
      )}

      {/* Ligne 2 : graphes pleine largeur */}
      {result && (
        <>
          <PerformanceChart timeline={result.timeline} symbol={symbol} />
          <GainsChart timeline={result.timeline} symbol={symbol} />

          {source === 'fallback' && (
            <p className="text-xs text-white/40">
              Données issues d&apos;un historique figé (période antérieure à la
              fenêtre temps réel).
            </p>
          )}
        </>
      )}

      {!embedded && (
        <p className="text-xs leading-relaxed text-white/40">
          Simulation rétrospective fournie à titre informatif et pédagogique.
          Les performances passées ne préjugent pas des performances futures.
          Ceci ne constitue pas un conseil en investissement.
        </p>
      )}
    </div>
  );
}
