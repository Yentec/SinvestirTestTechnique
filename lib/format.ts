/**
 * Formatage localisé (fr-FR) pour l'affichage des résultats.
 * Fonctions pures, sans dépendance UI.
 */

const EUR = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

const PCT = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
});

const DATE = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatEur(value: number): string {
  return EUR.format(value);
}

/** Reçoit un pourcentage déjà exprimé sur 100 (ex. 68.46) → "+68,46 %". */
export function formatPct(value: number): string {
  return PCT.format(value / 100);
}

/** Date ISO (YYYY-MM-DD) → "01 janv. 2024". */
export function formatDate(iso: string): string {
  return DATE.format(new Date(`${iso}T00:00:00Z`));
}

/** Quantité de crypto : assez de décimales pour les petits montants. */
export function formatUnits(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 6,
  }).format(value);
}
