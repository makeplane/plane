# Spec Technique — Modules

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | api/modules         |
| Version       | 0.1.0               |
| Date          | 2026-06-30          |
| Source        | Rétro-ingénierie    |

## Architecture du module

Le module `api/modules` suit l'architecture Django REST Framework standard du projet Plane :

- **Modèles** (`plane/db/models/module.py`) : 5 modèles héritant de `ProjectBaseModel` (lui-même héritant `BaseModel` avec UUID primaire, soft-delete, timestamps).
- **Vues** (`plane/app/views/module/`) : 3 fichiers de vues séparant CRUD principal, gestion des issues, et archivage.
- **Sérialiseurs** : `ModuleSerializer`, `ModuleWriteSerializer`, `ModuleDetailSerializer`, `ModuleLinkSerializer`, `ModuleUserPropertiesSerializer` (non lus dans ce périmètre — dans `plane/app/serializers/`).
- **Permissions** : décorateur `@allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])` injecté par action. `ProjectEntityPermission` pour `ModuleLinkViewSet` et `ModuleArchiveUnarchiveEndpoint`.

### Composants principaux

```
Module (ProjectBaseModel)
  ├── ModuleMember (ProjectBaseModel) — m2m User via through table
  ├── ModuleIssue (ProjectBaseModel) — association m2m avec Issue
  ├── ModuleLink (ProjectBaseModel) — liens externes
  └── ModuleUserProperties (ProjectBaseModel) — préférences par user

ModuleViewSet (BaseViewSet)
  ├── create()           — ADMIN, MEMBER
  ├── list()             — ADMIN, MEMBER, GUEST (modules non archivés)
  ├── retrieve()         — ADMIN, MEMBER (avec distributions + burndown)
  ├── partial_update()   — ADMIN, MEMBER (bloqué si archivé)
  └── destroy()          — ADMIN ou créateur

ModuleIssueViewSet (BaseViewSet)
  ├── list()                  — ADMIN, MEMBER (paginé, groupé)
  ├── create_module_issues()  — ADMIN, MEMBER (bulk add issues → module)
  ├── create_issue_modules()  — ADMIN, MEMBER (add/remove modules ← issue)
  └── destroy()               — ADMIN, MEMBER

ModuleArchiveUnarchiveEndpoint (BaseAPIView)
  ├── get()    — liste archivés ou détail archivé
  ├── post()   — archiver (completed/cancelled seulement)
  └── delete() — désarchiver

ModuleLinkViewSet (BaseViewSet)      — CRUD liens externes
ModuleFavoriteViewSet (BaseViewSet)  — Favoris (add/remove)
ModuleUserPropertiesEndpoint (BaseAPIView) — GET/PATCH préférences
```

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `apps/api/plane/db/models/module.py` | Modèles Django : Module, ModuleMember, ModuleIssue, ModuleLink, ModuleUserProperties | ~218 |
| `apps/api/plane/app/views/module/base.py` | CRUD module, favoris, liens, user properties | ~856 |
| `apps/api/plane/app/views/module/issue.py` | Gestion issues dans un module (list, bulk create, remove) | ~346 |
| `apps/api/plane/app/views/module/archive.py` | Archivage/désarchivage, liste et détail archivés | ~566 |

## Schéma BDD

### Table `modules`

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | uuid | PK | Identifiant UUID (hérité BaseModel) |
| `name` | varchar(255) | NOT NULL | Nom du module |
| `description` | text | blank | Description plain text |
| `description_text` | jsonb | nullable | Description Tiptap (JSON ProseMirror) |
| `description_html` | jsonb | nullable | Description Tiptap (HTML) |
| `start_date` | date | nullable | Date de début optionnelle |
| `target_date` | date | nullable | Date de fin optionnelle |
| `status` | varchar(20) | default `planned` | Statut parmi 6 valeurs |
| `lead_id` | uuid FK | nullable | Responsable du module (User) |
| `view_props` | jsonb | default `{}` | Propriétés d'affichage niveau module |
| `sort_order` | float | default 65535 | Ordre d'affichage (décroissant) |
| `external_source` | varchar(255) | nullable | Source externe (Jira, etc.) |
| `external_id` | varchar(255) | nullable | Identifiant dans la source externe |
| `archived_at` | datetime | nullable | Date d'archivage (null = actif) |
| `logo_props` | jsonb | default `{}` | Props du logo/emoji |
| `project_id` | uuid FK | NOT NULL | Projet parent |
| `workspace_id` | uuid FK | NOT NULL | Workspace (hérité ProjectBaseModel) |
| `created_by_id` | uuid FK | nullable | Créateur |
| `updated_by_id` | uuid FK | nullable | Dernier modificateur |
| `created_at` | datetime | auto | |
| `updated_at` | datetime | auto | |
| `deleted_at` | datetime | nullable | Soft delete |

**Contrainte d'unicité** : `UNIQUE(name, project)` avec `WHERE deleted_at IS NULL`
**Ordre par défaut** : `-created_at`

### Table `module_members`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid PK | |
| `module_id` | uuid FK | → modules |
| `member_id` | uuid FK | → db_user |
| + colonnes ProjectBaseModel | | |

**Contrainte** : `UNIQUE(module, member) WHERE deleted_at IS NULL`

### Table `module_issues`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid PK | |
| `module_id` | uuid FK | → modules |
| `issue_id` | uuid FK | → issues |
| + colonnes ProjectBaseModel | | |

**Contrainte** : `UNIQUE(issue, module) WHERE deleted_at IS NULL`
Note : pas de contrainte d'exclusivité — une issue peut appartenir à plusieurs modules.

### Table `module_links`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid PK | |
| `title` | varchar(255) | nullable |
| `url` | URLField | NOT NULL |
| `module_id` | uuid FK | → modules |
| `metadata` | jsonb | default `{}` |
| + colonnes ProjectBaseModel | | |

### Table `module_user_properties`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid PK | |
| `module_id` | uuid FK | → modules |
| `user_id` | uuid FK | → db_user |
| `filters` | jsonb | Filtres actifs (priority, state, assignees, labels, dates...) |
| `display_filters` | jsonb | group_by, order_by, layout, sub_issue, show_empty_groups |
| `display_properties` | jsonb | Visibilité colonnes (assignee, due_date, estimate, labels...) |
| `rich_filters` | jsonb | default `{}` (filtres avancés) |
| + colonnes ProjectBaseModel | | |

**Contrainte** : `UNIQUE(module, user) WHERE deleted_at IS NULL`

## API / Endpoints (identifiés depuis les vues)

| Méthode | Route (pattern probable) | Vue | Description | Auth minimale |
|---------|--------------------------|-----|-------------|---------------|
| GET | `/workspaces/{slug}/projects/{project_id}/modules/` | `ModuleViewSet.list` | Liste modules actifs | GUEST |
| POST | `/workspaces/{slug}/projects/{project_id}/modules/` | `ModuleViewSet.create` | Créer un module | MEMBER |
| GET | `/workspaces/{slug}/projects/{project_id}/modules/{pk}/` | `ModuleViewSet.retrieve` | Détail + distributions + burndown | MEMBER |
| PATCH | `/workspaces/{slug}/projects/{project_id}/modules/{pk}/` | `ModuleViewSet.partial_update` | Modifier un module | MEMBER |
| DELETE | `/workspaces/{slug}/projects/{project_id}/modules/{pk}/` | `ModuleViewSet.destroy` | Supprimer (ADMIN ou créateur) | ADMIN/créateur |
| GET | `/workspaces/{slug}/projects/{project_id}/modules/{module_id}/issues/` | `ModuleIssueViewSet.list` | Issues du module (paginé, groupé) | MEMBER |
| POST | `/workspaces/{slug}/projects/{project_id}/modules/{module_id}/issues/` | `ModuleIssueViewSet.create_module_issues` | Ajouter issues au module (bulk) | MEMBER |
| POST | `/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/modules/` | `ModuleIssueViewSet.create_issue_modules` | Add/remove modules depuis une issue | MEMBER |
| DELETE | `/workspaces/{slug}/projects/{project_id}/modules/{module_id}/issues/{issue_id}/` | `ModuleIssueViewSet.destroy` | Retirer issue du module | MEMBER |
| GET | `/workspaces/{slug}/projects/{project_id}/modules/archive/` | `ModuleArchiveUnarchiveEndpoint.get` | Liste modules archivés | ProjectEntityPermission |
| GET | `/workspaces/{slug}/projects/{project_id}/modules/archive/{pk}/` | `ModuleArchiveUnarchiveEndpoint.get` | Détail module archivé | ProjectEntityPermission |
| POST | `/workspaces/{slug}/projects/{project_id}/modules/{module_id}/archive/` | `ModuleArchiveUnarchiveEndpoint.post` | Archiver | ProjectEntityPermission |
| DELETE | `/workspaces/{slug}/projects/{project_id}/modules/{module_id}/archive/` | `ModuleArchiveUnarchiveEndpoint.delete` | Désarchiver | ProjectEntityPermission |
| POST | `/workspaces/{slug}/projects/{project_id}/modules/{module_id}/favorite/` | `ModuleFavoriteViewSet.create` | Ajouter aux favoris | ProjectLitePermission |
| DELETE | `/workspaces/{slug}/projects/{project_id}/modules/{module_id}/favorite/` | `ModuleFavoriteViewSet.destroy` | Retirer des favoris | ProjectLitePermission |
| GET | `/workspaces/{slug}/projects/{project_id}/modules/{module_id}/module-links/` | `ModuleLinkViewSet` (list) | Lister les liens | ProjectEntityPermission |
| POST | `/workspaces/{slug}/projects/{project_id}/modules/{module_id}/module-links/` | `ModuleLinkViewSet` (create) | Ajouter un lien | ProjectEntityPermission |
| DELETE | `/workspaces/{slug}/projects/{project_id}/modules/{module_id}/module-links/{pk}/` | `ModuleLinkViewSet` (destroy) | Supprimer un lien | ProjectEntityPermission |
| GET | `/workspaces/{slug}/projects/{project_id}/modules/{module_id}/user-properties/` | `ModuleUserPropertiesEndpoint.get` | Lire préférences user | GUEST |
| PATCH | `/workspaces/{slug}/projects/{project_id}/modules/{module_id}/user-properties/` | `ModuleUserPropertiesEndpoint.patch` | Modifier préférences user | GUEST |

## Patterns identifiés

- **Compute-on-read des statistiques** : les compteurs d'issues et de points (total, cancelled, completed, started, unstarted, backlog) ne sont jamais persistés. Ils sont calculés à la lecture via 12 sous-requêtes SQL corrélées (`Subquery` + `Coalesce`) dans `get_queryset()`. Ce pattern est identique dans `api/cycles`. Voir également `spec-technique.md api/cycles` section « Statut compute-on-read ».

- **Archivage soft via `archived_at`** : l'archivage n'utilise pas le soft-delete standard (`deleted_at`) mais un champ `archived_at` distinct. Les modules archivés restent en base et restent consultables via un endpoint dédié. Le soft-delete (`deleted_at`) est réservé à la suppression logique.

- **Sort order flottant auto-décrémenté** : à chaque création, `sort_order = min(sort_order dans le projet) - 10000`, ce qui insère le nouveau module en première position dans un tri croissant. La valeur initiale est 65535. Ce pattern est également présent dans `api/cycles`.

- **Injection des annotations via `.values()`** : comme dans cycles, les vues retournent `queryset.values(...)` avec les champs annotés plutôt que des sérialiseurs complets pour les actions list et create. `ModuleDetailSerializer` est utilisé uniquement pour `retrieve`.

- **Vérification IDOR lors de l'ajout d'issues** : dans `create_module_issues`, les IDs d'issues fournis par le client sont re-filtrés par `workspace__slug` et `project_id` avant insertion, évitant une injection d'issues appartenant à d'autres projets/workspaces.

- **Bulk create avec `ignore_conflicts=True`** : l'ajout d'issues au module utilise `bulk_create(..., ignore_conflicts=True)`. Si une association existe déjà, elle est ignorée silencieusement (pas d'erreur 409).

- **Activité asynchrone Celery** : toute modification d'association module-issue déclenche `issue_activity.delay(type="module.activity.created"|"module.activity.deleted")`. Les modifications du module lui-même déclenchent `model_activity.delay(model_name="module")` pour les webhooks.

- **Gzip conditionnel sur la liste des issues** : `ModuleIssueViewSet.list` est décoré `@method_decorator(gzip_page)` pour comprimer la réponse lors de listes potentiellement volumineuses.

- **Tracé des visites récentes** : la vue `retrieve` déclenche `recent_visited_task.delay(entity_name="module")` pour alimenter l'historique de navigation de l'utilisateur.

- **`ModuleUserProperties` auto-créées** : le GET sur `ModuleUserPropertiesEndpoint` utilise `get_or_create`, garantissant qu'un enregistrement par défaut existe toujours sans nécessiter une initialisation explicite.

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| (aucun trouvé) | — | Absent |

Aucun test spécifique aux modules n'a été identifié dans `apps/api/plane/tests/`. Le dossier `tests/contract/` couvre `cycles`, `labels`, `projects`, `authentication` mais pas `modules`.

## Décisions techniques notables (non promues en ADR)

**Statut manuel non dérivé** : le statut d'un module (`backlog`, `planned`, `in-progress`, `paused`, `completed`, `cancelled`) est géré exclusivement manuellement par l'utilisateur. Contrairement au statut des cycles (qui est calculé à partir des dates), aucune logique ne met automatiquement le statut à `completed` même si toutes les issues sont terminées. Documenté ici car isolé à `api/modules` — impact transverse insuffisant pour un ADR.

**Pas de `progress_snapshot`** : contrairement aux cycles, les modules n'ont pas de mécanisme de snapshot de progression. Quand des issues sont retirées d'un module, les compteurs reflètent immédiatement l'état actuel. L'ADR RETRO-041 (cycles) mentionnait `api/modules` comme concerné — cette assertion est incorrecte : aucun `progress_snapshot` ni `transfer_module_issues` n'existe dans les vues modules.
