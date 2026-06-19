'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  usePlotArea,
  useYAxisScale,
  type TooltipContentProps,
} from 'recharts';
import type { TimelinePoint } from '@/lib/simulate';
import { tokens } from '@/lib/design-tokens';
import { niceAxisTicks } from '@/lib/chart-scale';
import { Crosshair } from '@/components/ChartCrosshair';
import { XAxisValueTag, YAxisValueTag } from '@/components/ChartAxisTooltip';
import { ChartLegend } from '@/components/ChartLegend';
import { formatEur, formatEurAxis, formatDate } from '@/lib/format';

interface GainsChartProps {
  timeline: TimelinePoint[];
  symbol: string;
}

// Référence stable : un objet recréé à chaque rendu ferait échouer la
// comparaison de props de Recharts et rejouerait l'animation des axes.
const AXIS_TICK_STYLE = { fill: tokens.color.textFaint, fontSize: 12 };
const CHART_MARGIN = { top: 8, right: 8, bottom: 8, left: 24 };
const SERIES_KEYS = ['gain', 'invested', 'value', 'price'];

/**
 * Dégradé vert/rouge de l'aire de gain, en coordonnées écran
 * (`gradientUnits="userSpaceOnUse"`) : sinon le point de bascule des couleurs
 * suit l'amplitude de la courbe au lieu du zéro réel de l'axe.
 */
function GainGradient() {
  const plotArea = usePlotArea();
  const yScale = useYAxisScale();

  const zeroYRaw = yScale?.(0);
  if (!plotArea || zeroYRaw === undefined) return null;

  const top = plotArea.y;
  const bottom = plotArea.y + plotArea.height;
  const zeroY = Math.min(Math.max(zeroYRaw, top), bottom);
  const zeroOffset = (zeroY - top) / plotArea.height;

  return (
    <defs>
      <linearGradient
        id="gainFill"
        gradientUnits="userSpaceOnUse"
        x1={0}
        y1={top}
        x2={0}
        y2={bottom}
      >
        <stop offset={0} stopColor={tokens.color.positive} stopOpacity={0.3} />
        <stop
          offset={zeroOffset}
          stopColor={tokens.color.positive}
          stopOpacity={0}
        />
        <stop
          offset={zeroOffset}
          stopColor={tokens.color.negative}
          stopOpacity={0}
        />
        <stop offset={1} stopColor={tokens.color.negative} stopOpacity={0.3} />
      </linearGradient>
      <linearGradient
        id="gainStroke"
        gradientUnits="userSpaceOnUse"
        x1={0}
        y1={top}
        x2={0}
        y2={bottom}
      >
        <stop offset={0} stopColor={tokens.color.positive} />
        <stop offset={zeroOffset} stopColor={tokens.color.positive} />
        <stop offset={zeroOffset} stopColor={tokens.color.negative} />
        <stop offset={1} stopColor={tokens.color.negative} />
      </linearGradient>
    </defs>
  );
}

function GainsTooltipContent({
  active,
  payload,
  label,
  labels,
}: TooltipContentProps & { labels: Record<string, string> }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: tokens.color.bgCardAlt,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 10,
        color: tokens.color.text,
        padding: '8px 12px',
        fontSize: 13,
      }}
    >
      <div style={{ marginBottom: 4, opacity: 0.6, fontSize: 12 }}>
        {formatDate(String(label))}
      </div>
      {payload.map((entry) => {
        const key = String(entry.dataKey);
        const value = Number(entry.value);
        const isGain = key === 'gain';
        const color = isGain
          ? value >= 0
            ? tokens.color.positive
            : tokens.color.negative
          : entry.color;
        return (
          <div
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              color,
            }}
          >
            <span>{labels[key] ?? key}</span>
            <span className="tabular-nums">{formatEur(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function GainsChart({ timeline, symbol }: GainsChartProps) {
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

  const legendItems = [
    { key: 'gain', label: 'Gains / Pertes', color: tokens.color.positive },
    { key: 'invested', label: 'Investi', color: tokens.color.chart.invested },
    { key: 'value', label: 'Valeur', color: tokens.color.chart.secondary },
    { key: 'price', label: `Prix ${symbol}`, color: tokens.color.chart.price },
  ];

  // Mémoïsé pour garder une référence stable : sans ça, un re-rendu sans
  // rapport (ex. toggle d'une courbe) recréait le tableau et rejouait
  // l'animation des courbes.
  const data = useMemo(
    () =>
      timeline.map((p) => ({
        date: p.date,
        gain: Math.round((p.value - p.invested) * 100) / 100,
        invested: p.invested,
        value: p.value,
        price: p.price,
      })),
    [timeline],
  );

  // Une courbe ne se ré-anime que si elle vient d'apparaître ou si la
  // simulation a changé — sinon un changement de domaine d'axe causé par une
  // courbe sœur masquée/affichée rejouerait son tracé. `animatingKeys` doit
  // être un state : une variable locale serait recalculée après le re-rendu
  // déclenché par `setState` et retomberait toujours à "rien à animer" au
  // moment du rendu réellement affiché.
  const [prevData, setPrevData] = useState(data);
  const [prevHidden, setPrevHidden] = useState(hidden);
  const [animatingKeys, setAnimatingKeys] = useState<Set<string> | 'all'>(
    'all',
  );
  if (prevData !== data) {
    setPrevData(data);
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

  // Même échelle (k€, paliers ronds) que l'axe droit de PerformanceChart, mais
  // en autorisant les valeurs négatives (pertes) et en ne tenant compte que
  // des courbes affichées (le rétrécissement de l'axe ne casse plus
  // l'animation grâce à `shouldAnimate` ci-dessus).
  const gainHidden = hidden.has('gain');
  const investedHidden = hidden.has('invested');
  const valueHidden = hidden.has('value');

  const ticks = useMemo(() => {
    const visibleKeys = (['gain', 'invested', 'value'] as const).filter(
      (key) =>
        !(key === 'gain'
          ? gainHidden
          : key === 'invested'
            ? investedHidden
            : valueHidden),
    );
    // Si aucune courbe n'est affichée, on garde "Investi" comme repère
    // plutôt que d'effondrer l'axe à [0, 0] — ça évite un saut d'échelle
    // quand une courbe redevient visible.
    const keysForDomain =
      visibleKeys.length > 0 ? visibleKeys : ['invested' as const];
    const minValue = Math.min(
      0,
      ...data.map((d) => (keysForDomain.includes('gain') ? d.gain : 0)),
    );
    const maxValue = Math.max(
      0,
      ...data.map((d) => Math.max(...keysForDomain.map((key) => d[key]))),
    );
    // 14 graduations (vs 8 par défaut) : ça n'affecte que leur densité, pas
    // l'amplitude ni le pas de l'échelle, donc l'axe reste cohérent avec celui
    // de PerformanceChart pour la courbe "Investi" commune.
    return niceAxisTicks(minValue, maxValue, 1000, 14);
  }, [data, gainHidden, investedHidden, valueHidden]);
  const domainMin = ticks[0]!;
  const domainMax = ticks[ticks.length - 1]!;

  const labels = useMemo(
    () => ({
      gain: 'Gains / Pertes',
      invested: 'Investi',
      value: 'Valeur',
      price: `Prix ${symbol}`,
    }),
    [symbol],
  );

  return (
    <div className="rounded-card border border-white/10 bg-bg-card p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-white/50">
        Gains / Pertes
      </h3>
      <div className="h-128 w-full">
        {/* `initialDimension` évite l'avertissement Recharts sur le premier
            rendu, avant que le ResizeObserver n'ait mesuré le conteneur réel. */}
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 800, height: 512 }}
        >
          <ComposedChart
            data={data}
            margin={CHART_MARGIN}
          >
            <GainGradient />

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={AXIS_TICK_STYLE}
              minTickGap={48}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              includeHidden
              allowDataOverflow
              domain={[domainMin, domainMax]}
              ticks={ticks}
              tickFormatter={formatEurAxis}
              tick={AXIS_TICK_STYLE}
              width={64}
              axisLine={false}
              tickLine={false}
            />
            {/* Axe caché : prix de la crypto, échelle propre sans influencer les autres courbes */}
            <YAxis yAxisId="price" domain={['auto', 'auto']} hide />
            {/* Axe droit factice : un axe avec `hide` n'occupe aucune
                largeur, donc on le garde visible mais vide pour réserver les
                mêmes 64px que l'axe "Investi" de PerformanceChart et aligner
                les deux graphiques une fois empilés. */}
            <YAxis
              yAxisId="alignment"
              orientation="right"
              domain={[0, 1]}
              width={64}
              axisLine={false}
              tickLine={false}
              tick={false}
            />
            <Tooltip
              cursor={false}
              content={(props) => (
                <GainsTooltipContent {...props} labels={labels} />
              )}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
            <Area
              type="monotone"
              dataKey="gain"
              stroke="url(#gainStroke)"
              strokeWidth={2}
              fill="url(#gainFill)"
              hide={hidden.has('gain')}
              isAnimationActive={shouldAnimate('gain')}
            />
            {/* Area (fill="none") plutôt que Line, ici et pour "value" :
                l'animation de Line se base sur une longueur de tracé mesurée,
                fragile dès que les points changent ; Area interpole les
                positions et reste stable quand l'axe se redimensionne. */}
            <Area
              type="monotone"
              dataKey="invested"
              stroke={tokens.color.chart.invested}
              strokeWidth={1.5}
              fill="none"
              dot={false}
              hide={hidden.has('invested')}
              isAnimationActive={shouldAnimate('invested')}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={tokens.color.chart.secondary}
              strokeWidth={1.5}
              fill="none"
              dot={false}
              hide={hidden.has('value')}
              isAnimationActive={shouldAnimate('value')}
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
            <YAxisValueTag side="left" formatter={formatEurAxis} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend items={legendItems} hidden={hidden} onToggle={toggle} />
    </div>
  );
}
