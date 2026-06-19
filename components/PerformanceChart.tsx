'use client';

import { useMemo, useState } from 'react';
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
import { niceAxisTicks } from '@/lib/chart-scale';
import { Crosshair } from '@/components/ChartCrosshair';
import { XAxisValueTag, YAxisValueTag } from '@/components/ChartAxisTooltip';
import { ChartLegend } from '@/components/ChartLegend';
import { TimeRangeSlider } from '@/components/TimeRangeSlider';
import { useIsMobile } from '@/components/useIsMobile';
import {
  formatEur,
  formatEurAxis,
  formatUnits,
  formatUnitsAxis,
  formatDate,
  formatMonthTick,
} from '@/lib/format';

interface PerformanceChartProps {
  timeline: TimelinePoint[];
  symbol: string;
}

// Référence stable : un objet recréé à chaque rendu ferait échouer la
// comparaison de props de Recharts et rejouerait l'animation des axes.
const AXIS_TICK_STYLE = { fill: tokens.color.textFaint, fontSize: 12 };
const CHART_MARGIN = { top: 8, right: 8, bottom: 8, left: 24 };
const SERIES_KEYS = ['value', 'invested', 'units', 'price'];

export function PerformanceChart({ timeline, symbol }: PerformanceChartProps) {
  // Largeur d'axe réduite sur mobile : sur un écran étroit, la largeur fixe
  // des deux axes Y grignote une part disproportionnée de la zone de tracé.
  const isMobile = useIsMobile();
  const axisWidth = isMobile ? 44 : 64;
  // Toutes les courbes sont visibles par défaut, sauf le prix (orange).
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(['price']));
  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

  // Période affichée (indices dans `timeline`), pilotée par le double
  // curseur. Réinitialisée à la série complète quand une nouvelle simulation
  // arrive (sinon les indices pointeraient sur une série différente).
  const [range, setRange] = useState<[number, number]>([
    0,
    Math.max(0, timeline.length - 1),
  ]);
  const [prevTimelineForRange, setPrevTimelineForRange] = useState(timeline);
  if (prevTimelineForRange !== timeline) {
    setPrevTimelineForRange(timeline);
    setRange([0, Math.max(0, timeline.length - 1)]);
  }
  const visibleTimeline = useMemo(
    () => timeline.slice(range[0], range[1] + 1),
    [timeline, range],
  );

  // Une courbe ne se ré-anime que si elle vient d'apparaître ou si la
  // période affichée a changé (nouvelle simulation ou déplacement du
  // curseur) — sinon un changement de domaine d'axe causé par une courbe
  // sœur masquée/affichée rejouerait son tracé. `animatingKeys` doit être un
  // state : une variable locale serait recalculée après le re-rendu
  // déclenché par `setState` et retomberait toujours à "rien à animer" au
  // moment du rendu réellement affiché.
  const [prevVisible, setPrevVisible] = useState(visibleTimeline);
  const [prevHidden, setPrevHidden] = useState(hidden);
  const [animatingKeys, setAnimatingKeys] = useState<Set<string> | 'all'>(
    'all',
  );
  if (prevVisible !== visibleTimeline) {
    setPrevVisible(visibleTimeline);
    setAnimatingKeys('all');
  } else if (prevHidden !== hidden) {
    const justShown = new Set(
      SERIES_KEYS.filter((key) => prevHidden.has(key) && !hidden.has(key)),
    );
    setPrevHidden(hidden);
    setAnimatingKeys(justShown);
  }
  const shouldAnimate = (key: string) =>
    animatingKeys === 'all' || animatingKeys.has(key);

  const legendItems = [
    { key: 'value', label: 'Valeur', color: tokens.color.primary },
    { key: 'invested', label: 'Investi', color: tokens.color.chart.invested },
    {
      key: 'units',
      label: `${symbol} acquis`,
      color: tokens.color.chart.secondary,
    },
    { key: 'price', label: `Prix ${symbol}`, color: tokens.color.chart.price },
  ];

  // Booléens précis (et non l'objet `hidden` entier) pour que basculer une
  // courbe sans rapport (ex. le prix) ne recalcule pas l'échelle. Le
  // rétrécissement de l'axe quand on masque une courbe sœur ne casse plus
  // l'animation grâce à `shouldAnimate` ci-dessus.
  const investedHidden = hidden.has('invested');
  const valueHidden = hidden.has('value');

  const eurTicks = useMemo(() => {
    const visibleKeys = (['invested', 'value'] as const).filter(
      (key) => !(key === 'invested' ? investedHidden : valueHidden),
    );
    // Si les deux courbes sont masquées, on garde "Investi" comme repère
    // plutôt que d'effondrer l'axe à [0, 0] — ça évite un saut d'échelle
    // quand une courbe redevient visible.
    const keysForDomain = visibleKeys.length > 0 ? visibleKeys : ['invested' as const];
    // Le bas de l'axe suit le minimum réel de la période affichée (pas de
    // plancher à 0) : zoomer sur une plage qui ne descend jamais bas évite
    // de garder un axe inutilement étiré vers le bas.
    const minValue = Math.min(
      ...visibleTimeline.map((p) => Math.min(...keysForDomain.map((key) => p[key]))),
    );
    const maxValue = Math.max(
      ...visibleTimeline.map((p) => Math.max(...keysForDomain.map((key) => p[key]))),
    );
    return niceAxisTicks(minValue, maxValue, 1000);
  }, [visibleTimeline, investedHidden, valueHidden]);

  // "units" est seule sur son axe : la masquer ne libère de place pour aucune
  // autre courbe, donc l'échelle reste pleine plutôt que de s'effondrer à 0.
  // Même principe de bas d'axe non plafonné à 0 que `eurTicks` ci-dessus.
  const unitTicks = useMemo(() => {
    const minValue = Math.min(...visibleTimeline.map((p) => p.units));
    const maxValue = Math.max(...visibleTimeline.map((p) => p.units));
    return niceAxisTicks(minValue, maxValue, 1, 14);
  }, [visibleTimeline]);

  const fullRange: [number, number] = [0, Math.max(0, timeline.length - 1)];
  const isZoomed = range[0] !== fullRange[0] || range[1] !== fullRange[1];

  return (
    <div className="rounded-card border border-white/10 bg-bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wide text-white/50">
          Historique
        </h3>
        {isZoomed && (
          <button
            type="button"
            onClick={() => setRange(fullRange)}
            className="text-xs text-white/50 hover:text-white/80 hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>
      <TimeRangeSlider
        length={timeline.length}
        value={range}
        onChange={setRange}
        formatLabel={(i) => formatDate(timeline[i]!.date)}
        insetLeft={CHART_MARGIN.left + axisWidth}
        insetRight={CHART_MARGIN.right + axisWidth}
      />
      <div className="h-72 w-full sm:h-96 lg:h-128">
        {/* `initialDimension` évite l'avertissement Recharts sur le premier
            rendu, avant que le ResizeObserver n'ait mesuré le conteneur réel. */}
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 800, height: 512 }}
        >
          <ComposedChart
            data={visibleTimeline}
            margin={CHART_MARGIN}
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
              yAxisId="units"
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatMonthTick}
              tick={AXIS_TICK_STYLE}
              minTickGap={48}
              axisLine={false}
              tickLine={false}
            />
            {/* Axe gauche : quantité de crypto accumulée (paliers ronds) */}
            <YAxis
              yAxisId="units"
              includeHidden
              allowDataOverflow
              domain={[unitTicks[0]!, unitTicks[unitTicks.length - 1]!]}
              ticks={unitTicks}
              tickFormatter={formatUnitsAxis}
              tick={AXIS_TICK_STYLE}
              width={axisWidth}
              axisLine={false}
              tickLine={false}
            />
            {/* Axe droit : montants en euros (compactés en k€, paliers ronds) */}
            <YAxis
              yAxisId="invested"
              orientation="right"
              includeHidden
              allowDataOverflow
              domain={[eurTicks[0]!, eurTicks[eurTicks.length - 1]!]}
              ticks={eurTicks}
              tickFormatter={formatEurAxis}
              tick={AXIS_TICK_STYLE}
              width={axisWidth}
              axisLine={false}
              tickLine={false}
            />
            {/* Axe caché : prix de la crypto, échelle propre sans influencer les autres courbes */}
            <YAxis
              yAxisId="price"
              orientation="right"
              domain={['auto', 'auto']}
              hide
            />
            <Tooltip
              contentStyle={{
                background: tokens.color.bgCardAlt,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: 10,
                color: tokens.color.text,
              }}
              cursor={false}
              labelFormatter={(label) => formatDate(String(label))}
              formatter={(value, name) => {
                if (name === 'units') {
                  return [formatUnits(Number(value)), `${symbol} cumulés`];
                }
                const labels: Record<string, string> = {
                  invested: 'Investi',
                  value: 'Valeur',
                  price: `Prix ${symbol}`,
                };
                return [
                  formatEur(Number(value)),
                  labels[name as string] ?? name,
                ];
              }}
            />

            <Area
              yAxisId="invested"
              type="monotone"
              dataKey="value"
              stroke={tokens.color.primary}
              strokeWidth={2}
              fill="url(#valueFill)"
              hide={hidden.has('value')}
              isAnimationActive={shouldAnimate('value')}
            />
            {/* Area (fill="none") plutôt que Line : l'animation de Line se
                base sur une longueur de tracé mesurée, fragile dès que les
                points changent ; Area interpole les positions et reste stable
                quand l'axe se redimensionne. */}
            <Area
              yAxisId="invested"
              type="monotone"
              dataKey="invested"
              stroke={tokens.color.chart.invested}
              strokeWidth={1.5}
              fill="none"
              dot={false}
              hide={hidden.has('invested')}
              isAnimationActive={shouldAnimate('invested')}
            />
            <Line
              yAxisId="units"
              type="monotone"
              dataKey="units"
              stroke={tokens.color.chart.secondary}
              strokeWidth={1.5}
              dot={false}
              hide={hidden.has('units')}
              isAnimationActive={shouldAnimate('units')}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke={tokens.color.chart.price}
              strokeWidth={1.5}
              dot={false}
              hide={hidden.has('price')}
              isAnimationActive={shouldAnimate('price')}
            />
            <Crosshair />
            <XAxisValueTag formatter={formatDate} />
            <YAxisValueTag
              yAxisId="units"
              side="left"
              formatter={formatUnitsAxis}
            />
            <YAxisValueTag
              yAxisId="invested"
              side="right"
              formatter={formatEurAxis}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend items={legendItems} hidden={hidden} onToggle={toggle} />
    </div>
  );
}
