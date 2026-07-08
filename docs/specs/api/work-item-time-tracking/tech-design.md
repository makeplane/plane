# Tech Design / Plan — api/work-item-time-tracking

> V1 = worklogs CRUD (interne + externe MCP) + gate toggle + « Tracked time » + feed WORKLOG + toggle settings. Approbations/timesheet/export = suite.

## Stages

### Stage 1 — Backend modèle + API interne
- Modèle `IssueWorkLog` (`plane/db/models/worklog.py`) + export `__init__.py` + migration **0125_issue_worklogs** (manuelle, chaînée sur `0124_issue_properties`).
- Serializer interne (`plane/app/serializers/worklog.py`) : fields explicites, `read_only_fields` (workspace, project, logged_by, created_by…), `logged_by` imposé par la vue.
- Vues internes (`plane/app/views/worklog/base.py`) : list/create + partial_update/destroy + total-worklogs ; `@allow_permission` (GET tous rôles, POST ADMIN/MEMBER, PATCH/DELETE auteur-ou-admin en garde explicite) ; gates toggle + intake.
- URLs internes (`plane/app/urls/worklog.py`) + registres `__init__.py`.
- **Vérif** : ruff, py_compile.

### Stage 2 — Backend API externe v1 (contrat MCP) + tests
- Serializer externe (`plane/api/serializers/worklog.py`) : clés `project_id`/`workspace_id` alignées sur le pydantic `WorkItemWorkLog` du SDK.
- Vues externes (`plane/api/views/worklog.py`, BaseAPIView) : mêmes gates/permissions ; URLs **exactes SDK** : `work-items/:issue_id/worklogs/`, `total-worklogs/` (`plane/api/urls/worklog.py` + registres).
- Tests pytest : contract interne (`tests/contract/app/test_worklog.py`) + externe (`tests/contract/api/test_worklog_v1.py`) — CRUD, gates, permissions, isolation, summary (~25 tests).
- **Vérif** : ruff, py_compile (tests exécutés à l'intégration, Docker).

### Stage 3 — Web : types + constantes + service + stores
- `packages/types` : `TIssueWorklog`, `TIssueWorklogSummary`, `is_time_tracking_enabled` sur `IProject` → rebuild.
- `packages/constants` : `EActivityFilterType.WORKLOG` + `ACTIVITY_FILTER_TYPE_OPTIONS` + défauts (+ fusion localStorage).
- `worklog.service.ts` + store worklog (fetch/create/update/delete par issue, computed somme) + enregistrement RootStore (2 constructeurs) + shim ce/store.
- Extension `IssueActivityStore.buildActivityAndCommentItems` → items WORKLOG.
- **Vérif** : typecheck web, oxlint.

### Stage 4 — Web : composants + toggle
- 4 stubs CE : create-button (modal h/min/description), activity root (entrée + menu Edit/Delete), filter-root (option Worklogs), property root (Tracked time sidebar/peek).
- Entrée Time Tracking dans `PROJECT_FEATURES_LIST`.
- Nouvelles clés i18n × 19 locales (skill translate).
- **Vérif** : typecheck web, oxlint, oxfmt.

### Stage 5 — Intégration + tests réels + revue + doc
- Intégration patchs (`git apply`, conflits registres `__init__.py` : garder les deux), renumérotation migration si le leaf a bougé.
- **Tests réels Docker** : `makemigrations --check --dry-run` (« No changes detected »), `migrate`, `pytest` fichiers worklog.
- **Revue sécurité adversariale** (2 reviewers + double vérif) : IDOR cross-projet (worklog_id/issue_id), bypass gate toggle/intake, `logged_by` forgeable, duration négative/overflow, guests.
- Doc sync : spec IMPLÉMENTÉ, VERSIONNING, `schema.md` (+1 table), CHANGELOG.
- Commits `feat(api)`/`feat(web)` (--no-verify après vérif manuelle) → PR module vers `preview`.

## Décisions
- Minutes entières (PositiveIntegerField) — pas de decimal/secondes ; summary en minutes (docstring SDK « seconds » jugé erroné vs doc).
- `logged_by` SET_NULL (rétention facturation) et imposé serveur.
- Pas d'`IssueActivity` worklog : le feed lit le store worklog (`activity_type: "WORKLOG"`).
- Chemins externes = SDK plane-python-sdk (pas d'alias `/issues/` du vieux MCP npm).
- Pas d'ADR : aucune décision ne passe la politique 06 (modèle mono-table conforme aux conventions existantes → spec-technique).

## Découpage d'exécution (worktrees)
- Workflow backend (Stages 1-2) → intégration + tests réels → workflow web (Stages 3-4) contre le contrat réel → Stage 5.

## Risques
- Contrat MCP strict (pydantic SDK) : nommage `project_id`/`workspace_id` et chemins à tester contre le vrai serveur MCP connecté.
- Soft delete : sommes sur manager filtré ; cascade Celery différée dans les tests (utiliser delete(soft=False) si besoin).
- localStorage filtres : WORKLOG absent chez les utilisateurs existants (fusion à la lecture).
- Web : RootStore 2 constructeurs ; `filter-root.tsx` à étendre, pas remplacer ; property NU (ligne complète).
