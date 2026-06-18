'use client';

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TimelinePoint } from '@/lib/simulate';
import { tokens } from '@/lib/design-tokens';
import { formatEur, formatDate } from '@/lib/format';

interface PerformanceChartProps {
  timeline: TimelinePoint[];
}

export function PerformanceChart({ timeline }: PerformanceChartProps) {
  return (
    <div className="rounded-card border border-white/10 bg-bg-card p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-white/50">
        Évolution
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={timeline}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <defs>
              <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={tokens.color.primary}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={tokens.color.primary}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              minTickGap={48}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `${Math.round(v)} €`}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              width={64}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: tokens.color.bgCardAlt,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: 10,
                color: '#fff',
              }}
              labelFormatter={(label) => formatDate(String(label))}
              formatter={(value, name) => [
                formatEur(Number(value)),
                name === 'value' ? 'Valeur' : 'Investi',
              ]}
            />

            {/* Valeur du portefeuille — aire bleue */}
            <Area
              type="monotone"
              dataKey="value"
              stroke={tokens.color.primary}
              strokeWidth={2}
              fill="url(#valueFill)"
            />
            {/* Montant investi — ligne grise de référence */}
            <Line
              type="monotone"
              dataKey="invested"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
