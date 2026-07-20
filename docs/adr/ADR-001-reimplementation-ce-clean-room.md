# ADR-001 — Réimplémentation clean-room des fonctionnalités payantes dans le seam CE

| Champ     | Valeur                                                      |
| --------- | ----------------------------------------------------------- |
| Numéro    | ADR-001                                                     |
| Statut    | **Proposé** — brouillon à valider par le dev                |
| Date      | 2026-07-20                                                  |
| Auteur(s) | Brouillon assisté (Claude Code) — à reprendre au nom du dev |
| Owner     | Lucien Lin                                                  |
| Décideurs | Lucien Lin                                                  |
| Contexte  | Phase 2 — décision fondatrice, formalisée a posteriori      |
| Remplace  | —                                                           |
| Features  | \* (fondationnel)                                           |
| App       | \* (global)                                                 |

## Justification (politique ADR v2.3.0)

| Champ                                | Valeur                                                                                                                                                                                                                                                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catégorie                            | STACK                                                                                                                                                                                                                                                                                                            |
| Q1 — Coût de revert > 1j ?           | OUI — changer de mécanisme d'extension imposerait de déplacer les **265 fichiers** de `apps/web/ce/` et de reprendre les **212 fichiers** de `core/`+`app/` qui importent `@/plane-web`, dans les trois apps front, plus les modules Django ajoutés. C'est un chantier de plusieurs semaines, pas d'une journée. |
| Q2 — Non-déductible du code ?        | OUI — `apps/web/tsconfig.json` montre l'alias `"@/plane-web/*": ["./ce/*"]`, mais **rien dans le code ne dit pourquoi** : ni que ce dossier est le point d'extension délibéré plutôt qu'un reliquat, ni que la réimplémentation doit être **clean-room**, ni que copier `plane-ee` est juridiquement interdit.   |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — **les 33 modules** de `docs/specs/` en dépendent ; 24 specs portent déjà la mention « réimplémentée en CE (AGPL, aucun code plane-ee) ».                                                                                                                                                                   |
| Q4 — Casse un invariant si ignoré ?  | OUI — un dev qui recopierait du code de `makeplane/plane-ee` (dépôt **propriétaire**) placerait Zelian en violation de licence, sans que rien dans l'outillage ne le détecte. C'est un invariant **juridique**, silencieux et non testable.                                                                      |

> ✅ Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Plane Community Edition ne contient pas les fonctionnalités des plans payants : la ségrégation n'est **pas** un feature flag à l'exécution, mais une **substitution au niveau source**. Le dépôt fermé `makeplane/plane-ee` écrase les stubs de `apps/web/ce/` puis rebuild. En CE, ces 265 fichiers rendent `<></>`, exposent des types `never` ou des maps vides.

Zelian veut utiliser Plane en interne avec des fonctionnalités que l'upstream réserve à ses offres payantes. Trois voies existaient : payer les licences, forker sauvagement, ou réimplémenter dans le seam prévu. La question n'est pas seulement technique — la CE est sous **AGPL-3.0** (`package.json`), et `plane-ee` est propriétaire.

## Options considérées

| Option                           | Description                                                               | Effort estimé | Avantages                                                             | Inconvénients                                                                                |
| -------------------------------- | ------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A — Coder dans `apps/web/ce/`    | Remplir les stubs que le build CE résout déjà via l'alias `@/plane-web/*` | M             | Zéro configuration à changer ; le seam est celui prévu par l'upstream | Les rebases upstream touchent les mêmes fichiers                                             |
| B — Dupliquer `ce/` en `custom/` | Pointer l'alias vers `./custom/*` (1 ligne de `tsconfig.json`)            | M+            | Rebases upstream sans conflit sur les stubs                           | Divergence supplémentaire ; deux dossiers à comprendre                                       |
| C — Acheter les licences EE      | Souscrire aux plans Pro/Business                                          | —             | Aucun développement                                                   | Coût récurrent ; dépendances cloud (Silo, Pi) inutilisables en self-hosted ; aucune maîtrise |
| D — Copier le code `plane-ee`    | Récupérer l'implémentation propriétaire                                   | XS            | Immédiat                                                              | **Illicite** — violation de licence                                                          |

## Décision retenue

**Option choisie : A** — coder directement dans `apps/web/ce/`, en **réimplémentation clean-room**, sans jamais consulter ni copier `plane-ee`.

L'option D est exclue par le droit, pas par la technique. L'option C ne répond pas au besoin (les features cloud restent hors de portée en self-hosted). L'option B reste ouverte si les conflits de rebase deviennent douloureux : elle ne coûte qu'une ligne, et cet ADR ne l'interdit pas.

Côté backend, la même logique de superposition s'applique : exploiter le schéma dormant et ajouter du code **à côté** des vues CE plutôt que de les modifier en place (voir [ADR-002](ADR-002-schema-dormant-zero-migration.md)).

## Conséquences

### Positives

- Le build CE résout déjà `apps/web/ce/` : **aucune configuration à changer**.
- Chaque feature réimplémentée est notre code, sous AGPL, sans dépendance à une licence tierce.
- Les seams d'extension (`hooks/oauth/extended.tsx`, `TExtendedLoginMediums`, `flaggedExtensions`…) permettent d'ajouter sans toucher `core/` — plusieurs modules l'ont fait à **zéro modification de fichier core**.

### Négatives

- Les rebases upstream entrent en conflit sur les fichiers de `ce/` que nous avons remplis.
- Nous portons la maintenance de fonctionnalités que l'upstream fait évoluer de son côté.
- Aucun outil ne vérifie l'origine du code : l'invariant clean-room repose sur la discipline.

### Ce qu'on s'interdit désormais

- **Copier, adapter ou décompiler du code de `makeplane/plane-ee`**, ou tout build Commercial. La réimplémentation part de la documentation publique, de l'API observable et du SDK officiel.
- Utiliser la marque « Plane Pro / Business / Enterprise » pour désigner nos ajouts.
- Modifier les fichiers de `core/` quand un seam d'extension existe.

## Ressources / Références

- `NOTE-features-payantes-points-entree-ce.md` — inventaire des stubs et des points d'entrée (§1 mécanisme, §4 cadre légal).
- `apps/web/tsconfig.json` — l'alias `"@/plane-web/*": ["./ce/*"]`.
- Licence : `package.json` → `"license": "AGPL-3.0"`. ⚠️ L'AGPL impose de rendre les sources modifiées disponibles si l'instance est offerte en service réseau à des tiers.
- Décisions liées : [ADR-002](ADR-002-schema-dormant-zero-migration.md) (côté données), [ADR-003](ADR-003-is-zelian-enabled-bascule-interne-externe.md) (mode d'authentification).
