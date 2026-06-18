import { describe, it, expect } from 'vitest';
import { simulate, type PricePoint } from '@/lib/simulate';

/** Série simple : le prix double sur 4 jours (100 → 200). */
const doublingSeries: PricePoint[] = [
  { date: '2024-01-01', price: 100 },
  { date: '2024-01-02', price: 125 },
  { date: '2024-01-03', price: 150 },
  { date: '2024-01-04', price: 200 },
];

describe('simulate — investissement one-shot', () => {
  it('calcule une plus-value correcte quand le prix double', () => {
    const r = simulate({
      prices: doublingSeries,
      amount: 1000,
      frequency: 'once',
    });

    // 1000 € au prix 100 → 10 unités. Au prix final 200 → 2000 €.
    expect(r.totalInvested).toBe(1000);
    expect(r.unitsAccumulated).toBeCloseTo(10, 6);
    expect(r.finalValue).toBe(2000);
    expect(r.profit).toBe(1000);
    expect(r.profitPct).toBe(100);
  });

  it("n'investit qu'une seule fois (le cumul investi reste constant)", () => {
    const r = simulate({
      prices: doublingSeries,
      amount: 1000,
      frequency: 'once',
    });
    expect(r.timeline.every((p) => p.invested === 1000)).toBe(true);
  });

  it('calcule une moins-value quand le prix baisse', () => {
    const falling: PricePoint[] = [
      { date: '2024-01-01', price: 200 },
      { date: '2024-01-02', price: 100 },
    ];
    const r = simulate({ prices: falling, amount: 1000, frequency: 'once' });
    expect(r.finalValue).toBe(500);
    expect(r.profit).toBe(-500);
    expect(r.profitPct).toBe(-50);
  });
});

describe('simulate — DCA', () => {
  it('cumule les unités à chaque échéance quotidienne', () => {
    const r = simulate({
      prices: doublingSeries,
      amount: 100,
      frequency: 'daily',
    });

    // 4 achats de 100 € : 100/100 + 100/125 + 100/150 + 100/200
    // = 1 + 0.8 + 0.6667 + 0.5 = 2.9667 unités
    expect(r.totalInvested).toBe(400);
    expect(r.unitsAccumulated).toBeCloseTo(2.96667, 4);
    // Valeur finale = unités × prix final (200) ≈ 593.33
    expect(r.finalValue).toBeCloseTo(593.33, 2);
  });

  it('achat hebdomadaire : ne rachète pas avant 7 jours', () => {
    // 8 jours, prix constant à 100 → achats à J1 et J8 uniquement.
    const eightDays: PricePoint[] = Array.from({ length: 8 }, (_, i) => ({
      date: `2024-01-0${i + 1}`,
      price: 100,
    }));
    const r = simulate({
      prices: eightDays,
      amount: 50,
      frequency: 'weekly',
    });
    expect(r.totalInvested).toBe(100); // 2 achats de 50 €
  });

  it('achat mensuel : un achat par mois civil', () => {
    const acrossMonths: PricePoint[] = [
      { date: '2024-01-15', price: 100 },
      { date: '2024-01-31', price: 100 },
      { date: '2024-02-01', price: 100 },
      { date: '2024-03-10', price: 100 },
    ];
    const r = simulate({
      prices: acrossMonths,
      amount: 100,
      frequency: 'monthly',
    });
    expect(r.totalInvested).toBe(300); // janvier, février, mars
  });
});

function expectSimulationError(fn: () => unknown): void {
  expect(fn).toThrow();
  try {
    fn();
  } catch (error) {
    expect((error as Error).name).toBe('SimulationError');
  }
}

describe('simulate — validation des entrées', () => {
  it('rejette une série vide', () => {
    expectSimulationError(() =>
      simulate({ prices: [], amount: 100, frequency: 'once' }),
    );
  });

  it('rejette un montant négatif ou nul', () => {
    expectSimulationError(() =>
      simulate({ prices: doublingSeries, amount: 0, frequency: 'once' }),
    );
  });

  it('rejette un prix invalide dans la série', () => {
    const bad: PricePoint[] = [{ date: '2024-01-01', price: 0 }];
    expectSimulationError(() =>
      simulate({ prices: bad, amount: 100, frequency: 'once' }),
    );
  });
});

describe('simulate — robustesse', () => {
  it('gère une série à un seul point (one-shot)', () => {
    const single: PricePoint[] = [{ date: '2024-01-01', price: 100 }];
    const r = simulate({ prices: single, amount: 1000, frequency: 'once' });
    expect(r.finalValue).toBe(1000); // pas de variation de prix
    expect(r.profit).toBe(0);
  });
});
