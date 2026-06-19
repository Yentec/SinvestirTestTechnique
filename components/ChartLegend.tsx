'use client';

export interface ChartLegendItem {
  key: string;
  label: string;
  color: string;
}

interface ChartLegendProps {
  items: ChartLegendItem[];
  hidden: Set<string>;
  onToggle: (key: string) => void;
}

/**
 * Légende cliquable sous un graphique : chaque entrée bascule l'affichage de
 * la courbe correspondante (via la prop `hide` de Recharts, gérée par le
 * composant parent qui détient l'état `hidden`).
 */
export function ChartLegend({ items, hidden, onToggle }: ChartLegendProps) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
      {items.map((item) => {
        const isHidden = hidden.has(item.key);
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onToggle(item.key)}
            className="flex items-center gap-2 text-xs transition-opacity"
            style={{ opacity: isHidden ? 0.35 : 1 }}
            aria-pressed={!isHidden}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: item.color }}
            />
            <span className="text-white/70">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
