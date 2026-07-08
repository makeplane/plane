# Tech Design / Plan — api/work-item-properties

> V1 = types Text/Number/Boolean/Date/Dropdown/Member/URL. Formula/File/Email/Relation-issue = suite.

## Stages

### Stage 1 — Backend modèles + CRUD définitions/options
- 3 modèles (IssueProperty, IssuePropertyOption, IssuePropertyValue) + migration `0124` (manuelle) + exports.
- Util `plane/utils/issue_property.py` : mapping property_type → colonne de valeur + cast/validation.
- Serializers + CRUD propriétés/options : interne (app) + externe v1 (MCP).
- Permissions ADMIN, isolation projet stricte (scoping type/propriété/option par project_id).
- **Vérif** : ruff, py_compile.

### Stage 2 — Backend valeurs + validation + activité
- CRUD valeurs (set/get), validation typée + required + is_multi, isolation (membre projet pour RELATION user, option ∈ propriété).
- Intégration au flux create/update work item OU endpoints valeurs dédiés (trancher : endpoints dédiés = plus simple/MCP-aligné).
- Verbe d'activité `property_value`.
- Tests pytest (interne + v1).
- **Vérif** : ruff, py_compile.

### Stage 3 — Web : types + stores/services + provider
- `@plane/types` : IIssueProperty, IIssuePropertyOption, TIssuePropertyValues réel.
- services + stores issue-property / issue-property-value.
- `issue-modal/provider.tsx` : handlers réels (validation + persistance).
- **Vérif** : typecheck web, lint.

### Stage 4 — Web : rendu + gestion
- Champs par type dans modal-additional-properties / additional-properties (détail + layouts).
- UI de gestion propriétés/options dans les settings du type.
- Activité des valeurs.
- **Vérif** : typecheck web, lint.

### Stage 5 — Intégration + revue + doc
- Rebuild packages, typecheck web, ruff API.
- **Revue sécurité adversariale** : IDOR cross-tenant (propriété/option/valeur), validation typée contournable, required bypass, isolation membre RELATION.
- Doc sync (spec IMPLÉMENTÉ, schema.md 3 tables, VERSIONNING, CHANGELOG) + ADR eval (DATA-MODEL greenfield structurant → possible candidat ; appliquer politique 06).
- Commit sur `feat/work-item-properties` → PR #3.

## Décisions
- Stockage valeur **typé** (colonnes) et non JSON opaque → filtrable/requêtable.
- V1 : sous-ensemble de types ; Formula/File/etc. reportés.
- Isolation stricte partout (leçon IDOR `type_id` du module types).

## Découpage d'exécution (worktrees)
- Vu l'ampleur : possible split en 2 workflows séquentiels (backend d'abord = Stages 1-2, puis web = Stages 3-4) pour garder des agents ciblés et une revue par lot. Décision à l'exécution.

## Risques
- Élevé : plus gros modèle greenfield ; design du stockage valeur ; validation polymorphe ; large surface web (provider + rendu). Revue sécurité indispensable.
- Pas d'exécution pytest locale.
