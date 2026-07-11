# Tech Design / Plan — api/bulk-operations

> Bulk edit multi-champs sur N work items (feature Pro) — **zéro migration**, réutilise les modèles issue + l'infra de sélection web déjà construite. 2 surfaces : Django (interne + v1/MCP) → web. Sémantique **SET/remplacer** ; **tous** les champs `TBulkIssueProperties` en V1.

## Stage 1 — Backend (worktree)

- Helper partagé `plane/utils/bulk_issue.py` : parsing/validation du payload (issue_ids ⊂ projet ; state/label/assignee/module/cycle/estimate ⊂ projet ; dates) + application (scalaires `update`/`bulk_update` ; M2M SET via soft-delete + `bulk_create` façon `IssueCreateSerializer.update`) + émission `issue_activity.delay` par item (capturer `current_instance` avant).
- `BulkIssueOperationEndpoint` (interne, `plane/app/views/issue/base.py` + route `plane/app/urls/issue.py`).
- `BulkIssueOperationAPIEndpoint` (v1, `plane/api/views/issue.py` + route `plane/api/urls/work_item.py`), même helper.
- Tests pytest contract (~25-30) : `apps/api/plane/tests/contract/{app,api}/test_bulk_operations*.py`.
- **Vérif worktree** : ruff + py_compile.

## Stage 2 — Intégration + tests réels Docker

- Appliquer le patch sur `feat/bulk-operations` (basé `preview`).
- `makemigrations --check --dry-run` → « No changes detected ».
- pytest Docker (nouveaux + rejeu suites issue/bulk existantes).
- E2E API vivante (client in-process + APIToken pour la v1).

## Stage 3 — Web (worktree)

- Lever le gate (`use-bulk-operation-status.ts` → true).
- Remplir `IssueBulkOperationsRoot` (toolbar) + sous-composants (dropdowns réutilisés, accumulation `properties`, Update, archive/delete/clear), gatés par features projet.
- i18n (réutilise `bulk_operations.*` + ajouts, 19 locales).
- **Vérif** : `pnpm --filter web check:types`, oxlint, i18n sync.

## Stage 4 — Vérif visuelle locale

- `plane-web` : layout Spreadsheet + List → sélectionner N work items → toolbar → changer state/priority/assignés/labels/dates → Update → vérifier l'application + le fil d'activité. Archive/delete. Compte `gestiontodolist@gmail.com`.

## Stage 5 — Revue + doc + PR

- Revue sécurité adversariale (2 auditeurs + double vérif) : isolation projet (issue_id/valeurs cross-projet), permissions (guest/viewer), atomicité, intégrité M2M (UniqueConstraint deleted_at), activité correcte, v1 token.
- Corrections `fix(...)`.
- Doc-sync : spec IMPLÉMENTÉ, VERSIONNING, CHANGELOG (pas de schema.md — zéro migration).
- PR `feat/bulk-operations` → `preview`.

## Décisions

- **SET/remplacer** pour les multi-valeurs (décision dev) — parité `IssueCreateSerializer.update`, backend simple ; ADD/REMOVE = futur.
- **Tous** les champs du payload en V1, chacun gaté par la dispo feature projet côté UI.
- Gate CE = **toujours activé** (self-hosted) via `useBulkOperationStatus → true` ; pas de feature flag projet en V1.
- Réutilisation de l'infra de sélection existante (aucune reconstruction) — le travail = endpoint backend + toolbar.
- v1 = édition de propriétés seulement (archive/delete restent interne app) pour aligner le MCP sans sur-scope.
- Pas d'ADR : aucune décision hors politique 06 (pas de nouveau modèle ; endpoint + convention = spec-technique / AP-6).

## Risques

- **Intégrité M2M** : l'`UniqueConstraint` (deleted_at null) sur `IssueAssignee`/`IssueLabel` — la soft-delete de l'ancien AVANT `bulk_create` est obligatoire (piège déjà vu module worklog). Réutiliser le pattern serializer exact.
- **Activité** : capturer `current_instance` avant la modif, sinon old/new faux (le flux unitaire le fait via `IssueSerializer(issue).data` pré-update).
- **Atomicité vs volume** : transaction sur N issues + N activités async — borner le nombre d'issue_ids (ex. ≤ 100 comme upstream ?) à confirmer au cadrage d'implémentation.
- **Contrat front** : lire `issue.service.ts#bulkOperations` (retour attendu) pour aligner la réponse de la vue.
- Worktrees basés sur `preview` → fournir contrats/chemins exacts dans les prompts.
