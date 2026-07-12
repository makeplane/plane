# Spec Technique — Active Cycles (vue workspace)

| Champ      | Valeur              |
|------------|----------------------|
| Module     | api/active-cycles-workspace |
| Version    | 0.1.0               |
| Date       | 2026-07-12          |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-12) |

---

## Architecture

Endpoint interne d'agrégation cross-projet en lecture seule sur les modèles existants (`Cycle`, `CycleIssue`, `ProjectMember`) — **zéro migration**. Front CE : remplacement du stub paywall par la vraie page (résolution `@/plane-web/*` → `apps/web/ce/*`), service front dormant réutilisé.

## Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `apps/api/plane/app/views/workspace/cycle.py` | `WorkspaceActiveCyclesEndpoint` (nouvel endpoint, à côté du `WorkspaceCyclesEndpoint` existant) |
| `apps/api/plane/app/urls/workspace.py` | Route `workspaces/<str:slug>/active-cycles/` |
| `apps/api/plane/app/views/__init__.py` | Export du endpoint |
| `apps/web/ce/components/active-cycles/root.tsx` | Page réelle (SWR + grille de cartes) — remplaçait `WorkspaceActiveCyclesUpgrade` |
| `apps/web/app/(all)/[workspaceSlug]/(projects)/active-cycles/header.tsx` | Badge Pro retiré |
| `apps/web/ce/components/workspace/sidebar/extended-sidebar-item.tsx` | Badge Pro retiré |
| `apps/api/plane/tests/test_workspace_active_cycles.py` | Tests pytest du endpoint |

## API

### `GET /api/workspaces/:slug/active-cycles/`

- **Auth** : session (interne). **Permission** : `WorkspaceEntityPermission` (membre du workspace) ; le scoping par projet est porté par le queryset.
- **Queryset** : `Cycle` filtré `workspace__slug`, `project__project_projectmember__member=request.user` + `is_active=True` (les deux conditions dans le MÊME `.filter()` → même jointure ProjectMember), `archived_at IS NULL`, `project__archived_at IS NULL`, `project__cycle_view=True` (parité avec l'UI projet qui masque les cycles quand la feature est désactivée — revue COR-4), `start_date <= now <= end_date` (`timezone.now()` UTC aware — les bornes sont stockées en UTC, `astimezone` préserve l'instant donc la sémantique est identique au round-trip tz du `CycleViewSet`).
- **Annotations** : 6 × `Count("issue_cycle__issue__id", distinct=True, filter=…)` (total + 5 groupes d'état) excluant archived/draft/soft-deleted (issue ET lien CycleIssue) ; `assignee_ids = Coalesce(ArrayAgg(distinct, hors IssueAssignee soft-deleted), [])`. `.order_by("-created_at").distinct()`.
- **Pagination** : cursor `BasePaginator` (`self.paginate`), enveloppe standard (`results`, `total_count`, `next_cursor`…). Le front envoie `per_page=100&cursor=100:0:0`.
- **Sérialisation** (`_process_active_cycles`) : dicts explicites (id, workspace_id, project_id, name, description, start/end convertis au tz du projet — map `project_id → timezone` en 1 requête —, owned_by_id, view_props, sort_order, external_source/id, progress_snapshot, logo_props, version, archived_at, created_at, created_by, 6 compteurs, assignee_ids, `status: "CURRENT"`).
- **Erreurs** : 401 non authentifié, 403 non-membre workspace, 400 « Invalid cursor parameter. » si cursor malformé.

## Front

- `root.tsx` : `useSWRInfinite` (une clé par cursor `WORKSPACE_ACTIVE_CYCLES_{slug}_{cursor}`) → `cycleService.workspaceActiveCycles(slug, cursor, 100)` (service dormant pré-existant), bouton « Load more » (`common.load_more`) quand `next_page_results` (revue COR-6). Cartes : nom, identifiant + nom projet, plage de dates, `LinearProgressIndicator` + % complétion — **les cancelled sont exclus du dénominateur** (`completed/(total-cancelled)`, même périmètre que la barre qui n'empile pas cancelled ; compteur « N cancelled » affiché quand > 0 — revue COR-1), compteurs. Skeleton, état d'erreur, empty state réutilisés.
- `cycle.service.ts#workspaceActiveCycles` : le catch rethrow `err?.response?.data ?? err` — sans ça, une panne réseau (pas de réponse HTTP) faisait rejeter `undefined` et SWR rendait l'empty state au lieu de l'état d'erreur (revue COR-3).
- i18n : uniquement des clés existantes (`active_cycles`, `active_cycles_description`, `workspace_empty_state.active_cycles.*`, `something_went_wrong`, `workspace_projects.state.{completed,started,cancelled}`, `common.pending`, `common.load_more` — vérifiées présentes dans les 19 locales) — aucune clé ajoutée (revue COR-2 : les libellés des compteurs étaient en dur).

## Schéma BDD

Aucune modification.

## Tests

- pytest Docker : `apps/api/plane/tests/test_workspace_active_cycles.py` — fenêtre active, scoping membre/guest/non-membre, exclusions (archivé, draft, soft-delete), compteurs, pagination, 401/403.
- E2E : navigateur (page réelle, compteurs après ajout d'un work item via MCP local) + `makemigrations --check` propre.

## Pièges connus

- La jointure `project__project_projectmember` est multi-valuée : les DEUX conditions (member, is_active) doivent rester dans le même `.filter()` — les séparer changerait la sémantique (deux jointures distinctes). Pattern voisin : `Exists` corrélées (cf. `plane/utils/activity_filters.py`).
- `Count(distinct=True)` obligatoire : la jointure ProjectMember + les jointures issues multiplient les lignes avant GROUP BY.
- `status` est hardcodé `"CURRENT"` — ne pas réutiliser ce sérialiseur pour des cycles non filtrés sur la fenêtre active.
