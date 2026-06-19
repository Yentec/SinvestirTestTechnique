'use client';

import {
  useActiveTooltipCoordinate,
  useActiveTooltipLabel,
  useIsTooltipActive,
  usePlotArea,
  useYAxisInverseScale,
} from 'recharts';
import { tokens } from '@/lib/design-tokens';

const TAG_HEIGHT = 20;
const TAG_RADIUS = 4;

/**
 * Étiquette flottante sur l'axe des abscisses, alignée sous le point survolé,
 * pour lire la date sans devoir suivre la ligne du curseur jusqu'au tooltip.
 * Doit être rendu comme enfant JSX direct d'un chart Recharts.
 */
export function XAxisValueTag({
  formatter,
  width = 80,
}: {
  formatter: (label: string) => string;
  width?: number;
}) {
  const isActive = useIsTooltipActive();
  const coordinate = useActiveTooltipCoordinate();
  const plotArea = usePlotArea();
  const label = useActiveTooltipLabel();

  if (!isActive || !coordinate || !plotArea || label === undefined) {
    return null;
  }

  const y = plotArea.y + plotArea.height + 4;

  return (
    <g pointerEvents="none">
      <rect
        x={coordinate.x - width / 2}
        y={y}
        width={width}
        height={TAG_HEIGHT}
        rx={TAG_RADIUS}
        fill={tokens.color.bgCardAlt}
        stroke={tokens.color.border}
      />
      <text
        x={coordinate.x}
        y={y + TAG_HEIGHT / 2 + 4}
        textAnchor="middle"
        fontSize={11}
        fill={tokens.color.text}
      >
        {formatter(String(label))}
      </text>
    </g>
  );
}

/**
 * Étiquette flottante sur un axe Y, au niveau vertical du point survolé, pour
 * lire la valeur correspondante sans viser précisément la ligne pointillée.
 * Doit être rendu comme enfant JSX direct d'un chart Recharts.
 */
export function YAxisValueTag({
  yAxisId,
  side,
  formatter,
  width = 60,
}: {
  yAxisId?: string | number;
  side: 'left' | 'right';
  formatter: (value: number) => string;
  width?: number;
}) {
  const isActive = useIsTooltipActive();
  const coordinate = useActiveTooltipCoordinate();
  const plotArea = usePlotArea();
  const inverseScale = useYAxisInverseScale(yAxisId);

  if (!isActive || !coordinate || !plotArea) {
    return null;
  }

  const value = inverseScale?.(coordinate.y);
  if (typeof value !== 'number') {
    return null;
  }

  const x =
    side === 'left' ? plotArea.x - width - 6 : plotArea.x + plotArea.width + 6;

  return (
    <g pointerEvents="none">
      <rect
        x={x}
        y={coordinate.y - TAG_HEIGHT / 2}
        width={width}
        height={TAG_HEIGHT}
        rx={TAG_RADIUS}
        fill={tokens.color.bgCardAlt}
        stroke={tokens.color.border}
      />
      <text
        x={x + width / 2}
        y={coordinate.y + 4}
        textAnchor="middle"
        fontSize={11}
        fill={tokens.color.text}
      >
        {formatter(value)}
      </text>
    </g>
  );
}
