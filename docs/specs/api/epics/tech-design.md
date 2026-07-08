# Tech Design / Plan — api/epics

> Epic = Issue avec type.is_epic (aucun modèle/migration). Backend = routes internes `/epics/…` miroir des viewsets issues + guards transverses. Web = stores réels + route liste + sidebar + modal.

## Stages

### Stage 1 — Backend routes epics + guards (worktree)
- Relever d'abord les chemins EXACTS générés par les services front (`issue.service.ts`, `issue_activity/comment/reaction/attachment.service.ts` avec `serviceType=EPICS`) — la source de vérité du contrat.
- Vues epics (`plane/app/views/epic/` ou paramétrage des viewsets issues) : CRUD + enfants (`/epics/:id/issues/`, state_distribution, POST bulk) + links + comments (+ réactions commentaire) + history + réactions. URLs (`plane/app/urls/epic.py`) + registres.
- Guards : exclusion epics des listes standards internes (pattern `archive.py:99`), hiérarchie (parent sur epic strippé/400, epic jamais enfant), cycles/modules 400, archive 400, `is_epic` strippé au POST /issue-types (2 surfaces), `is_epic` exposé lecture v1.
- **Vérif** : ruff, py_compile.

### Stage 2 — Tests backend + exécution Docker
- `tests/contract/app/test_epic*.py` (~30 tests, matrice de la spec) + non-régression v1.
- Intégration patch, **tests réels** : `makemigrations --check` (« No changes detected » — pas de migration attendue), pytest suite epics + suites issues existantes touchées par les guards.

### Stage 3 — Web stores + routes + navigation (worktree)
- Stores réels `ce/store/issue/epic/*` (serviceType EPICS, clé filtres distincte), vérif root store.
- Route `/projects/:projectId/epics` (page liste, layouts EIssuesStoreType.EPIC) ; gestion des liens `/epics/:epicId` → browse.
- Sidebar « Epics » (additionalNavigationItems), empty state réel.
- **Vérif** : typecheck web, oxlint.

### Stage 4 — Web modal + finitions
- `CreateUpdateEpicModal` réelle (type forcé, sans parent) ; boutons « + » des group headers déjà branchés ; quick-actions/palette : liens réparés.
- i18n manquant ×19 locales.
- **Vérif** : typecheck web, oxlint, smoke test manuel si dev server dispo.

### Stage 5 — Revue + doc + PR
- Revue sécurité adversariale (2 reviewers + double vérif) : IDOR routes epics, bypass guards (hiérarchie/cycles/archive), fuite epics dans les listes, escalade permissions.
- Doc-sync : spec IMPLÉMENTÉ, VERSIONNING, CHANGELOG (pas de schema.md — pas de BDD).
- PR `feat/epics` → `preview`.

## Décisions
- Réutilisation des viewsets issues (sous-classes paramétrées) plutôt que duplication — le contrat est défini par les URLs que le front génère déjà.
- Epics exclus des listes internes, PAS de la v1 (non-breaking, parité upstream moderne).
- Pas d'ADR : aucun nouveau modèle ni décision hors module (politique 06 → spec-technique).

## Risques
- Surface large de guards transverses (régressions possibles sur les suites issues existantes → les rejouer).
- Chemins front à confirmer un par un (epics-detail/, v2/epics/) — risque de 404 silencieux si un chemin est deviné.
- PR #15 (worklogs) non mergée : zéro migration ici donc pas de conflit de leaf attendu ; re-vérifier au merge.
