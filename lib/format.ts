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

/** Quantité de crypto pour un axe de graphique : 2 décimales maximum. */
export function formatUnitsAxis(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
  }).format(value);
}

/** Montant en EUR compacté pour un axe de graphique : "12k", "1,5k"… */
export function formatEurAxis(value: number): string {
  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1,
  }).format(value / 1000)}k`;
}

/** Mois abrégé ; précise l'année lorsqu'il s'agit de janvier (repère de changement d'année). */
export function formatMonthTick(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  const month = date.toLocaleDateString('fr-FR', {
    month: 'short',
    timeZone: 'UTC',
  });
  return date.getUTCMonth() === 0
    ? `${month} ${date.getUTCFullYear()}`
    : month;
}
