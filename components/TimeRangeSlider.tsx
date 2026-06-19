'use client';

import { useState } from 'react';

interface TimeRangeSliderProps {
  /** Nombre de points dans la série complète (indices valides : 0..length-1). */
  length: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  /** Libellé affiché sous chaque poignée (ex. la date au format court). */
  formatLabel: (index: number) => string;
  /**
   * Décalages horizontaux (px) pour aligner la piste sur la zone de tracé du
   * graphe plutôt que sur la largeur totale de la carte — sans ça, le
   * curseur ne correspond pas visuellement à l'axe du temps situé sous les
   * axes Y.
   */
  insetLeft?: number;
  insetRight?: number;
}

// `pointer-events-none` sur le champ entier + `pointer-events-auto` sur le
// seul pseudo-élément du curseur : deux <input type="range"> superposés
// restent chacun saisissables uniquement à l'endroit de leur poignée, sans
// script de drag personnalisé. Poignées à 20px (et non 14px) pour rester
// attrapables au doigt sur mobile.
const THUMB_CLASS =
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 ' +
  '[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full ' +
  '[&::-webkit-slider-thumb]:bg-brand ' +
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 ' +
  '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer ' +
  '[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full ' +
  '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand';

/** Double curseur restreignant la période affichée sur l'axe du temps d'un graphe. */
export function TimeRangeSlider({
  length,
  value,
  onChange,
  formatLabel,
  insetLeft = 0,
  insetRight = 0,
}: TimeRangeSliderProps) {
  // Aperçu local pendant le glissement : déplacer les poignées met seulement
  // à jour cet état local (immédiat, pas de recalcul du graphe). La valeur
  // réelle n'est propagée qu'au relâchement (`commit`), pour éviter de
  // redessiner courbes et axes à chaque pixel parcouru.
  const [prevValue, setPrevValue] = useState(value);
  const [local, setLocal] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setLocal(value);
  }

  const max = length - 1;
  if (max <= 0) return null;

  // Toujours retomber dans [0, max] : si `value` arrive momentanément
  // désynchronisé de `length` (ex. nouvelle simulation pendant un drag en
  // cours), on évite d'indexer une série plus courte hors limites plutôt que
  // de propager un crash jusqu'à `formatLabel`.
  const start = Math.min(Math.max(local[0], 0), max);
  const end = Math.min(Math.max(local[1], 0), max);
  const commit = () => onChange([start, end]);
  const startPct = (start / max) * 100;
  const endPct = (end / max) * 100;

  return (
    <div
      className="relative mb-3"
      style={{ marginLeft: insetLeft, marginRight: insetRight }}
      onPointerUp={commit}
      onKeyUp={commit}
    >
      {/* Dates des deux bornes, positionnées au-dessus de leur poignée. */}
      <div className="relative mb-1 h-3.5 text-[11px] text-white/50">
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap"
          style={{ left: `${startPct}%` }}
        >
          {formatLabel(start)}
        </span>
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap"
          style={{ left: `${endPct}%` }}
        >
          {formatLabel(end)}
        </span>
      </div>
      <div className="relative flex h-6 items-center">
        <div className="absolute inset-x-0 h-1 rounded-full bg-white/10" />
        <div
          className="absolute h-1 rounded-full bg-brand"
          style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
        />
        <input
          type="range"
          aria-label="Début de la période affichée"
          min={0}
          max={max}
          value={start}
          onChange={(e) =>
            setLocal([Math.min(Number(e.target.value), end), end])
          }
          className={`pointer-events-none absolute h-6 w-full cursor-pointer appearance-none bg-transparent ${THUMB_CLASS}`}
        />
        <input
          type="range"
          aria-label="Fin de la période affichée"
          min={0}
          max={max}
          value={end}
          onChange={(e) =>
            setLocal([start, Math.max(Number(e.target.value), start)])
          }
          className={`pointer-events-none absolute h-6 w-full cursor-pointer appearance-none bg-transparent ${THUMB_CLASS}`}
        />
      </div>
    </div>
  );
}
