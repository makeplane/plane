# Spec Technique — Workspace Activity Log

| Champ   | Valeur                    |
|---------|---------------------------|
| Module  | api/workspace-activity-log |
| Version | 0.1.0                     |
| Date    | 2026-07-11                |
| Statut  | PLAN — à valider          |
| Source  | Cadrage 2026-07-11 (fichier:ligne vérifiés) |

> ⚠️ Garde ADR-001 bypassée (décision dev). **Zéro migration** (leaf `0126` intact) : lecture seule de `IssueActivity`. Module 2 surfaces : API Django (interne + v1/MCP) + web.

---

## Modèle — rien à créer, une source à lire

`IssueActivity` (`plane/db/models/issue.py:415-448`, table `issue_activities`) : `actor` FK User (le membre), `verb`, `field`, `old_value`/`new_value`, `old_identifier`/`new_identifier`, `issue` FK, `issue_comment` FK, `epoch`, + hérités `project`/`workspace` FK, `created_at`, soft delete. Produit exclusivement par la tâche Celery `issue_activity()` (`bgtasks/issue_activities_task.py:1604`, ACTIVITY_MAPPER ~30 types). **Non modifié par ce module.**

## Backend — API interne (app, session)

### Nouveau : `WorkspaceActivityEndpoint`

- Route : `GET /api/workspaces/<slug>/activity/` (`plane/app/urls/workspace.py`, à côté de `user-activity/` l.137).
- Vue : `plane/app/views/workspace/user.py` (à côté de `WorkspaceUserActivityEndpoint` l.380) — même squelette, **acteur optionnel** :
  - Queryset de base = celui du per-user existant SANS le filtre `actor=user_id` figé :
    `IssueActivity.objects.filter(workspace__slug=slug, project__project_projectmember__member=request.user, project__project_projectmember__is_active=True, project__archived_at__isnull=True)` + `.exclude(field__in=["comment","vote","reaction","draft"])` + `.select_related("actor","workspace","issue","project")`.
  - Query params :
    - `actor` (répétable, UUID) → `actor_id__in=[...]` ; invalide → 400.
    - `project` (répétable, UUID) → `project_id__in=[...]` (parité per-user existant).
    - `start_date` / `end_date` (ISO `YYYY-MM-DD`) → `created_at__date__gte/__lte` ; parsing strict (`datetime.strptime` ou DRF DateField), invalide → 400 ; `start_date > end_date` → 400.
    - `order_by` → `sanitize_order_by` + `ACTIVITY_ORDER_BY_ALLOWLIST` (`plane/utils/order_queryset.py:52`), défaut `-created_at`.
    - `cursor` / `per_page` → `self.paginate(... OffsetPaginator)` (même appel que le per-user, enveloppe standard `results/next_cursor/total_count/...`).
  - Serializer : `IssueActivitySerializer` app (`plane/app/serializers/issue.py:379` — `fields='__all__'` + `actor_detail`/`issue_detail`/`project_detail`/`workspace_detail`).
  - Permission : `WorkspaceEntityPermission` (`plane/app/permissions/workspace.py:74`) — GET = tout membre actif.

### Modifié : `WorkspaceUserActivityEndpoint` (additif)

- Ajout des mêmes `start_date`/`end_date` validés (`plane/app/views/workspace/user.py:380-407`). Aucun changement de défauts : sans les params, réponse **strictement identique** (tests de non-régression).

## Backend — API externe v1 (token, MCP)

### Nouveau : `WorkspaceActivityListAPIEndpoint`

- Route : `GET /api/v1/workspaces/<slug>/activities/` — nouveau fichier `plane/api/urls/activity.py` (ou ajout dans le registre existant `plane/api/urls/__init__.py`) ; convention slash final.
- Vue : nouveau `plane/api/views/activity.py`, hérite du `BaseAPIView` v1 (`plane/api/views/base.py` — APIKeyAuthentication + throttling intégrés) :
  - Mêmes filtres/validations que l'interne (`actor`, `project`, `start_date`, `end_date`, `order_by`, cursor). `per_page` ≤ 100 (convention v1).
  - Même scoping sécurité : projets où `request.user` (résolu par le token) est membre actif, workspace via slug, exclusions `comment/vote/reaction/draft`.
  - Serializer : `IssueActivitySerializer` **v1** (`plane/api/serializers/issue.py:759` — `exclude=[created_by,updated_by]`, support `fields`/`expand`).
  - Permission : membre actif du workspace (réutiliser `WorkspaceEntityPermission` — fonctionne avec `request.user` du token — ou équivalent v1 existant si présent dans `plane/api/`).
  - Enveloppe paginée v1 (`create_paginated_response`, parité `IssueActivityListAPIEndpoint` `plane/api/views/issue.py:1658`).
- **Alignement MCP** : URL et forme pensées pour un futur outil `list_member_activities` (workspace-scoped) ; contrat vérifiable via `docker exec plane-api-1 python manage.py shell` + APIToken local (le MCP configuré pointe sur la prod distante — mémoire `mcp-plane-remote-config`).

## Web (apps/web)

| Fichier | Action |
|---|---|
| `ce/components/workspace/members/members-activity-button.tsx` | REMPLIR : bouton (icône `History` Lucide, libellé i18n `common.activity`), gate `allowPermissions([ADMIN, MEMBER], WORKSPACE)`, `useState` local → ouvre le drawer |
| `ce/components/workspace/members/activity/` (nouveau dossier) | `activity-drawer.tsx` (panneau latéral — même patron que les drawers existants du codebase), `activity-filters.tsx` (sélecteur membre « All members »+liste via `useMember().workspace.workspaceMemberIds`, sélecteur projet, présets période), `activity-list.tsx` (wrapper SWR paginé cursor — patron `profile/activity/workspace-activity-list.tsx` — rendant les items via les briques `core/components/profile/activity/activity-list.tsx` / `common/activity/*`) |
| `ce/components/workspace/members/index.ts` | Exporter les nouveaux composants |
| `core/services/workspace.service.ts` | + `getWorkspaceActivity(workspaceSlug, params: {actor?, project?, start_date?, end_date?, cursor?, per_page?}): Promise<IUserActivityResponse>` → `GET /api/workspaces/<slug>/activity/` |
| `ce/store/workspace/index.ts` | Implémenter `mutateWorkspaceMembersActivity` : `mutate` SWR des clés d'activité du workspace courant (pas de nouvel observable — l'état vit dans SWR ; gotcha MobX : ne pas redéfinir un champ `action` de la base) |
| `packages/constants/src/fetch-keys.ts` | + `WORKSPACE_ACTIVITY(workspaceSlug, params)` |
| `packages/types/src/users.ts` | Réutiliser `IUserActivityResponse` / `IIssueActivity` (aucun nouveau type attendu ; en ajouter uniquement si les filtres l'exigent) |
| `packages/i18n/src/locales/*` | Nouvelles clés (titre drawer, filtres, présets, empty state, load more) — **19 locales via le skill translate** |

## Sécurité (checklist revue adversariale)

1. **Scoping demandeur** : jamais d'activité d'un projet où `request.user` n'est pas membre actif — sur les DEUX surfaces (interne + v1). Test : membre A requête, projet P sans A → 0 résultat même avec `project=P` explicite.
2. **Isolation workspace** : slug étranger → 404/403 ; un `actor` d'un autre workspace ne fuit rien (le scoping projet prime).
3. **Validation des entrées** : UUIDs (`actor`, `project`) et dates malformés → 400, jamais 500 ; `order_by` hors allowlist → fallback sanitizé (comportement existant).
4. **v1** : throttling hérité (60/min), `fields`/`expand` sans injection (mécanique existante), pas d'exposition de `created_by`/`updated_by`.
5. Aucune écriture — pas de CSRF/side-effect à couvrir.

## Tests (pytest, Docker, ~22-28 tests)

- **Interne feed** : nominal (multi-acteurs, tri décroissant), filtre `actor` (1 et N), filtre `project`, `start_date`/`end_date` (bornes incluses, plage vide, invalides → 400, start>end → 400), exclusions field, pagination cursor, scoping projets du demandeur (le test anti-fuite clé), guest borné, cross-workspace, non-membre → 403.
- **Per-user modifié** : non-régression sans params (réponse identique), avec plage de dates.
- **v1** : auth token OK / absente → 401, mêmes filtres, `fields`/`expand`, enveloppe paginée, scoping identique, non-membre → 403.
- `makemigrations --check --dry-run` = « No changes detected ».
