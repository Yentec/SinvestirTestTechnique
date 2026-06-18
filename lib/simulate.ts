/**
 * Logique de simulation rétrospective d'un investissement crypto.
 *
 * Volontairement pure : aucune dépendance externe, aucun I/O, aucun React.
 * Entrée = série de prix historiques + paramètres. Sortie = résultat + timeline.
 * Cette pureté rend la logique testable en isolation (voir simulate.test.ts)
 * et réutilisable côté serveur comme client.
 */

export type Frequency = 'once' | 'daily' | 'weekly' | 'monthly';

/** Un point de prix historique. `date` au format ISO (YYYY-MM-DD), `price` en EUR. */
export interface PricePoint {
  date: string;
  price: number;
}

export interface SimulationInput {
  /** Série de prix triée par date croissante, déjà bornée sur [start, end]. */
  prices: PricePoint[];
  /**
   * Montant en EUR.
   * - "once"  : montant total investi au premier point.
   * - DCA     : montant investi à CHAQUE échéance.
   */
  amount: number;
  frequency: Frequency;
}

export interface TimelinePoint {
  date: string;
  /** Cumul investi jusqu'à cette date (incluse). */
  invested: number;
  /** Valeur du portefeuille à cette date (unités cumulées × prix du jour). */
  value: number;
}

export interface SimulationResult {
  totalInvested: number;
  finalValue: number;
  /** finalValue - totalInvested (négatif = moins-value). */
  profit: number;
  /** Performance en % par rapport au capital investi. */
  profitPct: number;
  /** Quantité totale de crypto accumulée. */
  unitsAccumulated: number;
  timeline: TimelinePoint[];
}

/** Erreur métier dédiée pour distinguer les entrées invalides des bugs. */
export function simulationError(message: string): never {
  const error = new Error(message);
  error.name = 'SimulationError';
  throw error;
}

/**
 * Détermine si, à un index donné de la série, un achat DCA doit avoir lieu.
 * Le premier point (index 0) est toujours un achat. Ensuite, on déclenche
 * quand la frontière de période (semaine/mois) change par rapport au dernier achat.
 */
function shouldBuy(
  frequency: Frequency,
  current: Date,
  lastBuy: Date | null,
): boolean {
  if (lastBuy === null) return true; // premier achat systématique

  switch (frequency) {
    case 'daily':
      // Un point par jour dans nos séries : chaque point est un achat.
      return true;
    case 'weekly': {
      const diffDays = Math.floor(
        (current.getTime() - lastBuy.getTime()) / 86_400_000,
      );
      return diffDays >= 7;
    }
    case 'monthly':
      return (
        current.getUTCFullYear() !== lastBuy.getUTCFullYear() ||
        current.getUTCMonth() !== lastBuy.getUTCMonth()
      );
    case 'once':
      return false; // géré en amont, jamais d'achat après le premier
    default:
      return false;
  }
}

export function simulate(input: SimulationInput): SimulationResult {
  const { prices, amount, frequency } = input;

  // --- Validation des entrées ---
  if (!Array.isArray(prices) || prices.length === 0) {
    return simulationError('La série de prix est vide.');
  }
  if (amount <= 0 || !Number.isFinite(amount)) {
    return simulationError('Le montant doit être un nombre positif.');
  }
  if (prices.some((p) => p.price <= 0 || !Number.isFinite(p.price))) {
    return simulationError('La série contient un prix invalide (≤ 0).');
  }

  let units = 0; // unités de crypto cumulées
  let totalInvested = 0;
  let lastBuy: Date | null = null;
  const timeline: TimelinePoint[] = [];

  for (let i = 0; i < prices.length; i++) {
    const point = prices[i]!;
    const currentDate = new Date(`${point.date}T00:00:00Z`);

    let buyThisPoint = false;

    if (frequency === 'once') {
      // Tout le capital au premier point uniquement.
      buyThisPoint = i === 0;
    } else {
      buyThisPoint = shouldBuy(frequency, currentDate, lastBuy);
    }

    if (buyThisPoint) {
      units += amount / point.price; // achat au prix du jour
      totalInvested += amount;
      lastBuy = currentDate;
    }

    // Revalorisation : unités cumulées × prix courant (clé du calcul DCA).
    timeline.push({
      date: point.date,
      invested: round2(totalInvested),
      value: round2(units * point.price),
    });
  }

  const finalValue = units * prices[prices.length - 1]!.price;
  const profit = finalValue - totalInvested;
  const profitPct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  return {
    totalInvested: round2(totalInvested),
    finalValue: round2(finalValue),
    profit: round2(profit),
    profitPct: round2(profitPct),
    unitsAccumulated: units,
    timeline,
  };
}

/** Arrondi monétaire à 2 décimales, sans risque de -0. */
function round2(n: number): number {
  const r = Math.round((n + Number.EPSILON) * 100) / 100;
  return r === 0 ? 0 : r;
}
