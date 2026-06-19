import type { SimulationResult } from '@/lib/simulate';
import { formatEur, formatPct, formatUnits } from '@/lib/format';

interface ResultsCardProps {
  result: SimulationResult;
  symbol: string;
}

export function ResultsCard({ result, symbol }: ResultsCardProps) {
  const isGain = result.profit >= 0;
  const profitColor = isGain ? 'text-positive' : 'text-negative';

  // Prix moyen d'acquisition = total investi / unités (dérivé, pas de recalcul).
  const avgPrice =
    result.unitsAccumulated > 0
      ? result.totalInvested / result.unitsAccumulated
      : 0;

  const rows: { label: string; value: string; className?: string }[] = [
    { label: 'Investi', value: formatEur(result.totalInvested) },
    { label: `${symbol} acquis`, value: formatUnits(result.unitsAccumulated) },
    { label: "Prix moyen d'acquisition", value: formatEur(avgPrice) },
    { label: 'Capital final', value: formatEur(result.finalValue) },
    {
      label: 'Plus-value',
      value: formatEur(result.profit),
      className: profitColor,
    },
    {
      label: 'Performance',
      value: formatPct(result.profitPct),
      className: 'text-gold',
    },
  ];

  return (
    <div className="rounded-card border border-white/10 bg-bg-card p-6">
      <h3 className="mb-5 text-sm font-medium uppercase tracking-wide text-white/50">
        Chiffres clés
      </h3>
      <dl className="flex flex-col divide-y divide-white/5">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between py-2.5"
          >
            <dt className="text-sm text-white/50">{r.label}</dt>
            <dd
              className={`text-base font-semibold tabular-nums ${r.className ?? ''}`}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
