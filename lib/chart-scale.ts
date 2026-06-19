/**
 * Calcul de graduations "rondes" (1, 2, 5, 10, 20, 50…) pour les axes de
 * graphiques Recharts, partagé entre les composants du dossier `components/`
 * pour garantir des échelles cohérentes d'un graphique à l'autre.
 */

/**
 * Graduations rondes couvrant [min, max], multiples de `scale` (1000 pour
 * raisonner en milliers d'euros, 1 pour des unités brutes). `min` doit être
 * ≤ 0 si l'axe doit inclure le zéro (cas des graphiques gains/pertes).
 */
export function niceAxisTicks(
  min: number,
  max: number,
  scale = 1,
  targetCount = 8,
): number[] {
  if (max <= min) return [0];

  const span = max - min;
  const rawStep = span / scale / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const residual = rawStep / magnitude;
  const niceResidual =
    residual >= 5 ? 10 : residual >= 2 ? 5 : residual >= 1 ? 2 : 1;
  const step = niceResidual * magnitude * scale;

  const bottom = Math.floor(min / step) * step;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = bottom; v <= top + step * 1e-6; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6); // évite la dérive en virgule flottante
  }
  return ticks;
}
