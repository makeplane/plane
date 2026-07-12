# Spec Fonctionnelle — Milestones (jalons projet)

| Champ      | Valeur                                      |
|------------|---------------------------------------------|
| Module     | api/milestones                              |
| Version    | 0.1.0                                       |
| Date       | 2026-07-12                                  |
| Auteur     | session roadmap vague 2                     |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-12)              |
| Source     | NOTE-features-payantes-points-entree-ce.md · contrat = SDK/MCP officiel (plane-mcp-server 0.2.19) |

> ⚠️ Garde ADR-001 bypassée sur décision du dev. Feature équivalente aux plans payants de Plane, réimplémentée en CE (AGPL, aucun code plane-ee). **La source de vérité du contrat v1 est le SDK officiel** (`plane/api/milestones.py`, `plane/models/milestones.py`, `plane_mcp/tools/milestones.py`).

---

## Contexte et objectif

Aucune trace de milestones dans le backend CE (0 occurrence) ; côté front, seulement des accroches dormantes (fetch-key `PROJECT_MILESTONES`, type collapsible, i18n du toggle). Objectif : jalons de projet complets — CRUD + rattachement de work items — consommables par le SDK/MCP officiel (7 outils) ET par l'UI web.

## Règles métier

1. Un milestone appartient à UN projet (`ProjectBaseModel`) ; champ modèle `name` mais **la v1 expose `title`** (exigence stricte du SDK Pydantic — renvoyer `name` casse `model_validate`).
2. `target_date` optionnelle (ISO 8601). Ni `start_date`, ni `status` dans le contrat (ne pas sur-modéliser).
3. Rattachement N↔N via `MilestoneIssue` (unicité conditionnelle `(issue, milestone)` hors soft-delete, calque `CycleIssue`). Un work item ne peut être attaché qu'à des milestones de SON projet (400 sinon).
4. **Toggle projet** `is_milestone_enabled` (défaut False) : toutes les ÉCRITURES milestones sont refusées 400 quand il est off (lectures autorisées) — pattern time-tracking. Le toggle s'active dans Project Settings → Features.
5. Import externe : `(external_source, external_id)` déjà présents → 409 avec l'id existant (create et update).
6. Permissions : écritures ADMIN+MEMBER projet ; lecture tous membres projet (guest inclus) ; aucune visibilité hors projet/workspace.

## User Stories

- En tant qu'intégrateur MCP, je crée un jalon (`create_milestone(project_id, title, target_date)`), j'y attache des work items (`manage_milestone_work_items`), je liste (`list_milestones`) avec compteurs.
- En tant que membre, j'active Milestones dans les settings, je crée des jalons depuis la page projet, j'attache des work items et je suis l'avancement (X/Y).
- En tant que guest, je consulte les jalons sans pouvoir les modifier.

## Cas limites

- `issues` vide, non-liste, UUID malformé → 400 ; issues d'un autre projet → 400 avec `invalid_ids` (v1).
- Work items déjà attachés re-POSTés → ignorés (v1 renvoie la liste des seuls liens créés, `[]` si tous existants).
- DELETE work-items AVEC BODY `{"issues":[...]}` (spécificité SDK — pas d'URL détail).
- Suppression d'un milestone → liens supprimés en cascade, work items intacts.
- Toggle désactivé après création → jalons visibles en lecture, écritures bloquées, page web affiche l'état « disabled » avec CTA Manage features (admin).

## Interfaces

- **v1/MCP** : 8 endpoints sous `/api/v1/workspaces/:slug/projects/:pid/milestones/…` (slash final), enveloppe cursor `BasePaginator` sur les listes — validés EN DIRECT avec les outils MCP (`create/update/list_milestones`, `manage/list_milestone_work_items`).
- **Interne** : `/api/workspaces/:slug/projects/:pid/milestones/[…]` + `/milestone-issues/` (couche app pour le web).
- **Web** : page `/:ws/projects/:pid/milestones` (nav gatée), toggle Features, section liste + modal create/edit + delete + attach (ExistingIssuesListModal), compteurs `completed/total`.

## Hors scope

- Propriété milestone sur le peek/détail des work items, filtres/spreadsheet/gantt par milestone.
- Activité (`issue_activity`) et webhooks milestones.
- `MilestoneUserProperties` (préférences de vue par utilisateur).

## Critères d'acceptation

- [x] Chaîne MCP validée en direct : `create_milestone` → `title` ✓, add/list work items ✓, `update_milestone` ✓, `list_milestones` avec `total_issues` ✓.
- [x] 18 tests pytest Docker (contrat v1 + couche app).
- [x] Migration `0128_milestones` + `makemigrations --check` clean.
- [x] UI vérifiée navigateur (page, nav gatée, jalon MCP affiché 0/1).
- [x] i18n ×19 locales (`sync:check` OK).
