/**
 * Design tokens extraits de simulateurs.sinvestir.fr
 * (relevés via DevTools + screenshot de référence, 18/06/2026)
 *
 * Identité : dark navy + bleu électrique (primaire) + or (secondaire/highlight).
 * Typographie : Lexend, font-features ss01 + ss02.
 *
 * Ces tokens sont dupliqués dans globals.css (@theme) pour l'usage Tailwind.
 * Source unique côté JS pour les composants qui ont besoin des valeurs brutes
 * (ex. couleurs passées en props à Recharts).
 */
export const tokens = {
  color: {
    bgDeep: '#060818',
    bgBase: '#0A0E2A',
    bgCard: '#111634',
    bgCardAlt: '#161B3D',

    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',

    primary: '#3B6EF6',
    primaryHover: '#2D5BFF',
    primarySoft: 'rgba(59, 110, 246, 0.16)',

    gold: '#E8B964',
    goldSoft: 'rgba(232, 185, 100, 0.16)',

    text: '#FFFFFF',
    textMuted: 'rgba(255, 255, 255, 0.64)',
    textFaint: 'rgba(255, 255, 255, 0.40)',

    positive: '#34D399',
    negative: '#F87171',

    // Couleurs catégorielles des courbes secondaires (PerformanceChart, GainsChart).
    chart: {
      invested: '#A78BFA',
      secondary: '#FACC15',
      price: '#FB923C',
    },
  },
  radius: {
    pill: '9999px',
    card: '16px',
    input: '10px',
  },
} as const;

export type Tokens = typeof tokens;
