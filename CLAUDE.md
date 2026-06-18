@AGENTS.md

# CLAUDE.md

Guide de référence pour toute assistance IA sur ce dépôt. Lis ce fichier avant de proposer ou d'écrire du code.

## Contexte du projet

Simulateur crypto rétrospectif, réalisé dans le cadre d'un test technique pour **S'investir**. Objectif : transposer la logique fonctionnelle du simulateur crypto de `sinvestir.fr/simulateur-crypto-monnaie/` à l'identité visuelle de la suite d'outils `simulateurs.sinvestir.fr`, et livrer une démo en ligne fonctionnelle.

L'outil calcule la performance passée d'un investissement crypto (one-shot ou DCA) sur une période donnée, à partir de données de marché historiques. Il est **rétrospectif et pédagogique** : il ne prédit rien et ne constitue pas un conseil en investissement.

Le simulateur est conçu pour être **autonome et intégrable** : il peut prendre la place de l'outil actuel dans la suite, ou être embarqué en iframe depuis un site tiers via la route `/embed`.

## Stack

- **Next.js 16** (App Router) — aligné sur la stack interne S'investir.
- **React 19**, **TypeScript** (strict).
- **Tailwind CSS v4** — configuration via `@theme` dans `app/globals.css`, pas de fichier `tailwind.config`.
- **Recharts** — graphe d'évolution de la valeur.
- **Vitest** — tests unitaires de la logique pure.
- **Vercel** — déploiement cible.

Pas de base de données, pas d'authentification : le simulateur est **stateless** (données historiques + calcul). C'est un choix de périmètre assumé ; Supabase serait l'extension naturelle si l'on ajoutait la sauvegarde de scénarios.

## Conventions de code

- **Fonctions, pas de classes.** Préférer les fonctions pures et les factories aux classes, y compris pour les erreurs métier.
- **Logique métier découplée de l'UI.** Tout le calcul vit dans `lib/`, sans dépendance React ni I/O. L'UI consomme ces fonctions.
- **TypeScript strict**, pas de `any`. Types et interfaces explicites pour les entrées/sorties de fonctions publiques.
- **Pas de sur-ingénierie.** Le périmètre est volontairement réduit ; ne pas introduire d'abstraction ou de dépendance non justifiée par le besoin.
- Composants en français côté texte UI ; code, identifiants et commentaires techniques peuvent mêler français et anglais selon l'usage habituel.

## Identité visuelle (tokens)

Extraite de `simulateurs.sinvestir.fr` (DevTools + capture de référence) :

- **Fond** : bleu nuit très sombre (`#0A0E2A` base, halos bleus diffus).
- **Typographie** : **Lexend** (chargée via `next/font/google`), `font-feature-settings: "ss01", "ss02"`.
- **Accent primaire** : bleu électrique (`#3B6EF6`) — CTA, liens, points de graphe.
- **Accent secondaire** : or (`#E8B964`) — highlights, valeurs clés, logo.
- **Sémantique résultats** : vert `#34D399` (plus-value), rouge `#F87171` (moins-value).

Source de vérité côté JS : `lib/design-tokens.ts`. Source côté CSS/Tailwind : le bloc `@theme` de `app/globals.css`. Garder les deux cohérents.

## Données

- Source live : **CoinGecko** (`/coins/{id}/market_chart/range`, `vs_currency=eur`), sans clé API.
- **Fallback** : datasets historiques figés en JSON dans `data/fallback/` (BTC, ETH, + quelques actifs), servis si l'API échoue (quota 429, timeout).
- La route API logue la source utilisée (live vs fallback) pour la démo.

## Architecture cible

```
sinvestir-crypto-simulator/
├── app/
│   ├── page.tsx                  # page simulateur (host de démo)
│   ├── embed/page.tsx            # version embeddable (iframe, sans header/footer)
│   ├── api/
│   │   └── prices/route.ts       # proxy CoinGecko + fallback JSON + cache
│   └── layout.tsx
├── components/
│   ├── Simulator.tsx             # composant racine RÉUTILISABLE (le livrable réel)
│   ├── SimulatorForm.tsx         # crypto / montant / fréquence / dates
│   ├── ResultsCard.tsx           # valeur finale, +/- value, %
│   └── PerformanceChart.tsx      # graphe d'évolution (Recharts)
├── lib/
│   ├── simulate.ts               # LOGIQUE PURE : one-shot + DCA (testable)
│   ├── coingecko.ts              # fetch + mapping
│   └── design-tokens.ts          # couleurs/typo S'investir
├── data/
│   └── fallback/                 # BTC.json, ETH.json, SOL.json (séries historiques)
├── tests/
│   └── simulate.test.ts          # Vitest sur la logique pure
├── README.md
```

## Logique de simulation — règle clé

En **DCA**, cumuler les **unités** de crypto (`units += montant / prix`) puis revaloriser à chaque point par `units × prixCourant`. Ne jamais additionner des valeurs : on suit la quantité physique détenue. C'est la seule méthode correcte.

En **one-shot**, tout le capital est investi au premier point de la période, puis la valeur du paquet d'unités suit l'évolution du prix.

Hypothèse assumée : les séries sont journalières et sans trous (cas des données CoinGecko sur les plages utilisées). Documentée dans le README.

## Commandes

```bash
npm run dev     # serveur de développement
npm run build   # build de production
npm test        # tests Vitest (un coup)
npm run test:watch
npm run lint
```

## Workflow Git

- Une branche par bloc fonctionnel (`feat/...`), fusionnée dans `main` validée.
- **Conventional Commits** : `feat:`, `fix:`, `test:`, `chore:`, `docs:`, `refactor:`.
- Versionnage sémantique.

## Contraintes & garde-fous

- Outil **pédagogique et rétrospectif** : aucun message ne doit suggérer une prédiction ou un conseil d'investissement. Le disclaimer réglementaire (cohérent avec le statut CIF de S'investir) doit accompagner le simulateur.
- Aucune donnée personnelle collectée, aucune persistance.
- Le composant `<Simulator />` ne doit dépendre ni du layout du site hôte ni de variables globales : il reste embarquable proprement avec peu de dépendances.
