'use client';

import { SUPPORTED_COINS } from '@/lib/coingecko';
import type { Frequency } from '@/lib/simulate';

export interface FormState {
  coin: string;
  amount: number;
  frequency: Frequency;
  from: string; // ISO YYYY-MM-DD
  to: string;
}

interface SimulatorFormProps {
  value: FormState;
  onChange: (next: FormState) => void;
  loading: boolean;
}

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'once', label: 'Une fois' },
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
];

const TODAY = new Date().toISOString().slice(0, 10);

export function SimulatorForm({ value, onChange, loading }: SimulatorFormProps) {
  function update<K extends keyof FormState>(key: K, v: FormState[K]) {
    onChange({ ...value, [key]: v });
  }

  const labelCls = 'block text-sm font-medium text-white/70 mb-1.5';
  const fieldCls =
    'w-full rounded-input border border-white/10 bg-bg-card-alt px-3 py-2.5 ' +
    'text-white outline-none transition-colors focus:border-brand ' +
    'focus:ring-1 focus:ring-brand';

  return (
    <div className="rounded-card border border-white/10 bg-bg-card p-6">
      <div className="">
        {/* Crypto */}
        <h3 className="mb-5 text-sm font-medium uppercase tracking-wide text-white/50">
          Simulation
        </h3>
        <div>
          <label htmlFor="coin" className={labelCls}>
            Actif numérique
          </label>
          <select
            id="coin"
            className={fieldCls}
            value={value.coin}
            onChange={(e) => update('coin', e.target.value)}
          >
            {SUPPORTED_COINS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Montant */}
        <div>
          <label htmlFor="amount" className={labelCls}>
            Montant investi (€)
          </label>
          <input
            id="amount"
            type="number"
            min={1}
            step={10}
            className={fieldCls}
            value={value.amount}
            onChange={(e) => update('amount', Number(e.target.value))}
          />
        </div>

        {/* Fréquence */}
        <div>
          <label htmlFor="frequency" className={labelCls}>
            Fréquence d&apos;investissement
          </label>
          <select
            id="frequency"
            className={fieldCls}
            value={value.frequency}
            onChange={(e) => update('frequency', e.target.value as Frequency)}
          >
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="">
          <div>
            <label htmlFor="from" className={labelCls}>
              Du
            </label>
            <input
              id="from"
              type="date"
              max={value.to || TODAY}
              className={fieldCls}
              value={value.from}
              onChange={(e) => update('from', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="to" className={labelCls}>
              Au
            </label>
            <input
              id="to"
              type="date"
              max={TODAY}
              className={fieldCls}
              value={value.to}
              onChange={(e) => update('to', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* La simulation se relance seule après un temps d'inactivité (voir
          Simulator.tsx) : pas de bouton, juste un indicateur discret. */}
      <p
        className="mt-6 text-center text-sm text-white/40"
        aria-live="polite"
      >
        {loading ? 'Calcul en cours…' : ''}
      </p>
    </div>
  );
}
