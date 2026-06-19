'use client';

import {
  Cross,
  useActiveTooltipCoordinate,
  useIsTooltipActive,
  usePlotArea,
} from 'recharts';

/**
 * Croix verticale + horizontale au point survolé. Le `cursor` natif du
 * Tooltip ne sait dessiner qu'une ligne pour ce type de graphique (Composed) ;
 * on reconstruit donc la croix nous-mêmes via les hooks de contexte du chart.
 * Doit être rendu comme enfant JSX direct d'un chart Recharts.
 */
export function Crosshair() {
  const isActive = useIsTooltipActive();
  const coordinate = useActiveTooltipCoordinate();
  const plotArea = usePlotArea();

  if (!isActive || !coordinate || !plotArea) return null;

  return (
    <Cross
      x={coordinate.x}
      y={coordinate.y}
      top={plotArea.y}
      left={plotArea.x}
      width={plotArea.width}
      height={plotArea.height}
      stroke="rgba(255,255,255,0.25)"
      strokeDasharray="3 3"
      pointerEvents="none"
    />
  );
}
