# Tech Design / Plan — api/work-item-types

> V1 = types uniquement (custom properties = module suivant). Cadrage 2026-07-08.

## Stages

### Stage 1 — Backend types (API interne + externe)
- Ré-export `ProjectIssueType` dans `db/models/__init__.py`.
- `IssueTypeSerializer` (app + api v1).
- Vues + urls internes `issue-types/` (app) et externes `work-item-types/` (api v1) — CRUD + resolve.
- Exposer `type_id` dans les serializers/`.values()` issue web internes.
- Endpoint/action d'activation projet + fonction de **seeding** (default « Work Item » + « Epic »), idempotente.
- Invariants : un seul défaut (transaction), défaut non supprimable, is_epic immuable.
- Verbe d'activité « type ».
- Tests pytest (app + v1).
- **Vérif** : ruff, py_compile.

### Stage 2 — Web UI types
- `@plane/types` : `IIssueType` ; `packages/services/src/issue-type/`.
- Store MobX issue-type.
- Remplir les stubs CE : IssueTypeSelect, IssueTypeSwitcher, IssueTypeIdentifier, FilterIssueTypes + AppliedIssueTypeFilters, IssueTypeActivity.
- Toggle projet (settings features-list) avec confirmation irréversible.
- **Vérif** : `pnpm --filter web check:types`, oxlint/oxfmt.

### Stage 3 — Intégration + revue + doc
- Rebuild @plane/types/services, typecheck web, ruff API.
- Revue sécurité adversariale (permissions admin, isolation projet/workspace, un seul défaut, exposition type_id).
- Doc sync Zelian (spec IMPLÉMENTÉ, VERSIONNING, CHANGELOG, pas de schema.md car pas de table).
- Commit sur `feat/work-item-types`.

## Décisions
- **Pas de custom properties en V1** (greenfield → module `api/work-item-properties`).
- Pas de nouvelle table (schéma dormant réutilisé) → probablement pas d'ADR (à valider politique 06 : DATA-MODEL déductible du code existant).
- Alignement MCP : les 5 tools types (create/update/delete/list/resolve) mappés ; les tools properties viendront avec le module suivant.

## Risques
- Faible côté schéma (dormant). Attention au seeding idempotent et à l'invariant « un seul défaut ».
- Exposer `type_id` dans les `.values()` web : vérifier ne pas casser les requêtes de liste existantes.
- Pas d'exécution pytest locale (pas d'env BDD) → tests écrits, CI.
