# Simulateur Crypto — S'investir

![CI](https://github.com/Yentec/SinvestirTestTechnique/actions/workflows/ci.yml/badge.svg)

Simulateur d'investissement crypto **rétrospectif**, transposant la logique fonctionnelle du [simulateur crypto S'investir](https://sinvestir.fr/simulateur-crypto-monnaie/) à l'identité visuelle de la suite [`simulateurs.sinvestir.fr`](https://simulateurs.sinvestir.fr/).

L'outil calcule ce qu'aurait donné un investissement passé (en une fois ou en DCA) sur une crypto-monnaie, à partir de données de marché historiques.

**Démo en ligne : https://sinvestir-test-technique.vercel.app/**
**Version intégrable (embed) : https://sinvestir-test-technique.vercel.app/embed**

---

## Sommaire

- [Aperçu fonctionnel](#aperçu-fonctionnel)
- [Stack technique](#stack-technique)
- [Démarrage](#démarrage)
- [Architecture](#architecture)
- [Stratégie de données (live + fallback)](#stratégie-de-données-live--fallback)
- [Intégrabilité (embed)](#intégrabilité-embed)
- [Partis pris & hypothèses assumées](#partis-pris--hypothèses-assumées)
- [Tests & CI](#tests--ci)
- [Pistes d'amélioration](#pistes-damélioration)

---

## Aperçu fonctionnel

L'utilisateur choisit une crypto, un montant, une fréquence d'investissement et
une période. Le simulateur affiche :

- **Chiffres clés** : total investi, unités acquises, prix moyen d'acquisition,
  capital final, plus/moins-value, performance (%).
- **Graphe « Historique »** : évolution de la valeur du portefeuille, du montant
  investi et du prix de l'actif sur la période.
- **Graphe « Gains / Pertes »** : évolution de la plus-value dans le temps.

Deux stratégies d'investissement :

- **Une fois (one-shot)** : tout le capital investi au premier jour de la période.
- **DCA** (quotidien / hebdomadaire / mensuel) : un montant fixe investi à chaque
  échéance.

## Stack technique

| Choix                            | Justification                                                            |
| -------------------------------- | ------------------------------------------------------------------------ |
| **Next.js 16** (App Router)      | Aligné sur la stack interne S'investir.                                  |
| **React 19 / TypeScript strict** | Typage de bout en bout, contrat API partagé entre la route et le client. |
| **Tailwind CSS v4**              | Configuration CSS-first via `@theme`, sans fichier de config JS.         |
| **Recharts**                     | Graphes déclaratifs, légers, suffisants pour le besoin.                  |
| **Vitest**                       | Tests unitaires de la logique pure.                                      |
| **Vercel**                       | Déploiement cible mentionné par le test.                                 |

**Aucune base de données, aucune authentification, aucune variable d'environnement.** Le simulateur est _stateless_ (données historiques + calcul).

Le déploiement est donc reproductible sans configuration secrète.

## Démarrage

```bash
npm install
npm run dev      # http://localhost:3000
```

Autres scripts :

```bash
npm test         # tests unitaires (Vitest)
npm run lint     # ESLint
npm run build    # build de production
```

### Régénérer les données de fallback (optionnel)

Les datasets historiques sont committés dans `data/fallback/`. Pour les
régénérer à partir des sources :

```bash
npx tsx scripts/fetch-fallback.ts
```

## Architecture

```
app/
├─page.tsx              # page hôte de démo
├─embed/page.tsx        # version embeddable (iframe, sans en-tête)
├─api/prices/route.ts   # proxy CoinGecko + fallback + cache
├─layout.tsx            # Lexend (next/font) + métadonnées
└─globals.css           # thème Tailwind v4 (@theme) + styles de base
components/
├─Simulator.tsx         # composant racine réutilisable (le livrable)
├─SimulatorForm.tsx     # formulaire contrôlé
├─ResultsCard.tsx       # chiffres clés
├─PerformanceChart.tsx  # graphe Historique
├─GainsChart.tsx        # graphe Gains / Pertes
├─TimeRangeSlider.tsx   # slider de filtrage de la période affichée
├─ChartAxisTooltip.tsx  # tooltip partagé des graphes Recharts
├─ChartCrosshair.tsx    # curseur vertical synchronisé entre les graphes
├─ChartLegend.tsx       # légende custom des graphes
├─useSimulation.ts      # hook : fetch /api/prices + appel à simulate()
└─useIsMobile.ts        # hook de détection de breakpoint (responsive)
lib/
├─simulate.ts           # logique pure : one-shot + DCA (testable)
├─coingecko.ts          # client API + whitelist des cryptos
├─fallback.ts           # datasets figés importés en statique
├─format.ts             # formatage fr-FR (€, %, dates)
├─design-tokens.ts      # tokens couleur/typo (source JS)
├─chart-scale.ts        # calcul des échelles/domaines des graphes
└─api-types.ts          # contrat de réponse API partagé
data/fallback/          # séries historiques JSON
tests/                  # tests Vitest de la logique pure
scripts/                # génération des datasets de fallback
```

**Principe directeur : la logique métier est totalement découplée de l'UI.**
Tout le calcul vit dans `lib/simulate.ts`, sans dépendance React ni I/O. Cette pureté la rend testable en isolation et réutilisable côté serveur comme client.

### La règle clé du calcul DCA

En DCA, on cumule les **unités** de crypto (`units += montant / prix`) puis on revalorise à chaque point par `units × prixCourant`. On ne somme jamais des valeurs : on suit la quantité physique détenue. C'est la seule méthode correcte pour un backtest, et c'est ce que verrouillent les tests.

## Stratégie de données (live + fallback)

Le plan public de CoinGecko ne permet d'interroger que les **365 derniers jours**. La couche de données est donc hybride, et la route choisit automatiquement la bonne source :

- **Plage ≤ 365 jours** → **API CoinGecko en direct** (`/market_chart/range`, en EUR, sans clé), avec cache Vercel (revalidation horaire) pour limiter les appels.
- **Plage plus ancienne** → **dataset historique figé** (`data/fallback/`), qui porte l'historique long au-delà de la limite du plan gratuit.
- **Échec live** (quota, timeout) → repli silencieux sur le fallback.

La source servie est exposée dans l'en-tête HTTP `x-price-source` (`live` | `fallback`), ce qui permet de prouver le mécanisme en conditions réelles.

Les datasets de fallback sont **importés en statique** (et non lus sur le disque), pour garantir leur disponibilité en environnement serverless Vercel.

### Frontières d'erreur

| Code HTTP | Cas                                                                                       |
| --------- | ----------------------------------------------------------------------------------------- |
| `400`     | Paramètres invalides (crypto non supportée, dates incohérentes). L'API n'est pas appelée. |
| `404`     | Aucune donnée figée pour la période demandée.                                             |
| `200`     | Données servies (live ou fallback).                                                       |

## Intégrabilité (embed)

Le composant `<Simulator />` est **autonome** : il ne dépend ni du layout du site hôte, ni de variable globale. La route `/embed` le rend nu, prêt à être embarqué en iframe :

```html
<iframe
  src="https://sinvestir-test-technique.vercel.app/embed"
  width="100%"
  height="900"
  style="border:0;border-radius:16px"
  title="Simulateur Crypto S'investir"
></iframe>
```

Le **disclaimer réglementaire** est porté par le composant lui-même : où qu'il soit intégré, l'avertissement le suit. C'est un choix volontaire, cohérent avec le contexte réglementé de S'investir.

## Partis pris & hypothèses assumées

- **Liste figée de 5 cryptos** (BTC, ETH, SOL, BNB, XRP) plutôt que les 7000+ de CoinGecko : périmètre maîtrisé et fallback garanti pour chaque actif proposé. L'extension est triviale (retirer la whitelist) mais perdrait la garantie de fallback.
- **Séries journalières supposées sans trous.** `simulate()` traite un point par jour ; la normalisation (`normalizeToDaily`) garantit cette hypothèse côté CoinGecko en ne gardant que le dernier prix de chaque jour.
- **Conversion USDT ≈ USD** dans le script de génération des fallback (les prix Binance sont en USDT, convertis en EUR via le taux BCE quotidien). Le peg tient à ~0,1 % près : approximation acceptable pour un outil pédagogique.
- **Pas de tests end-to-end (Playwright).** Le périmètre (demi-journée) justifie de concentrer l'effort de test sur la logique métier pure, là où se situe le risque réel de régression.

## Tests & CI

La logique de simulation est couverte par des tests unitaires Vitest : one-shot, DCA (quotidien / hebdomadaire / mensuel), validation des entrées, cas limites, et exposition du prix dans la timeline.

```bash
npm test
```

Une **CI GitHub Actions** exécute à chaque push et PR sur `main` : lint, vérification de types, tests et build de production.

## Pistes d'amélioration

Quelques directions envisagées pour aller plus loin (voir aussi le formulaire de rendu) :

- **Comparaison de scénarios** côte à côte (one-shot vs DCA sur le même graphe).
- **Lien profond partageable** : encoder les paramètres dans l'URL pour partager une simulation et faciliter l'embed pré-configuré.
- **Sauvegarde de scénarios** (le cas d'usage où Supabase deviendrait pertinent).
- **Extension multi-actifs** au-delà de la whitelist, avec génération de fallback à la demande.
