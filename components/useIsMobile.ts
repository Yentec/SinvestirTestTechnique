'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 639px)'; // sous le breakpoint `sm` de Tailwind

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * Détecte un viewport mobile pour ajuster des valeurs qui ne peuvent pas
 * être pilotées en CSS (ex. la largeur numérique d'un axe Recharts).
 * `useSyncExternalStore` évite le mismatch d'hydratation : le serveur rend
 * toujours `false`, puis React se resynchronise sur la vraie valeur après
 * montage.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
