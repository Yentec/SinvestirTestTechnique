import type { SimulationResult } from '@/lib/simulate';
import { formatEur, formatPct, formatUnits } from '@/lib/format';

interface ResultsCardProps {
  result: SimulationResult;
  symbol: string; // ex. "BTC"
}

export function ResultsCard({ result, symbol }: ResultsCardProps) {
  const isGain = result.profit >= 0;
  const profitColor = isGain ? 'text-positive' : 'text-negative';

  return (
    <div className="rounded-card border border-white/10 bg-bg-card p-6">
      <h3 className="mb-5 text-sm font-medium uppercase tracking-wide text-white/50">
        Vos résultats
      </h3>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Capital final */}
        <div>
          <p className="text-sm text-white/50">Capital final</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatEur(result.finalValue)}
          </p>
        </div>

        {/* Plus / moins-value */}
        <div>
          <p className="text-sm text-white/50">Plus-value</p>
          <p
            className={`mt-1 text-2xl font-semibold tabular-nums ${profitColor}`}
          >
            {formatEur(result.profit)}
          </p>
        </div>

        {/* Performance % — accent doré, comme le site de référence */}
        <div>
          <p className="text-sm text-white/50">Performance</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gold">
            {formatPct(result.profitPct)}
          </p>
        </div>
      </div>

      {/* Détail secondaire */}
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-sm text-white/50">
        <span>
          Total investi :{' '}
          <span className="text-white/80">
            {formatEur(result.totalInvested)}
          </span>
        </span>
        <span>
          {symbol} accumulés :{' '}
          <span className="text-white/80">
            {formatUnits(result.unitsAccumulated)}
          </span>
        </span>
      </div>
    </div>
  );
}
