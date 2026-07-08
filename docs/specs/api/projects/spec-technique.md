# Spec Technique — api/projects

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | api/projects        |
| Version       | 0.1.0               |
| Date          | 2026-06-30          |
| Source        | Rétro-ingénierie    |

---

## Architecture du module

Le module `api/projects` suit l'architecture Django REST Framework standard de Plane :

- **Modèles** (`plane/db/models/project.py`, `state.py`) — définissent le schéma et la logique de bas niveau (validations, save hooks, managers).
- **Vues** (`plane/app/views/project/`, `plane/app/views/state/`) — ViewSets DRF pour les opérations CRUD, avec décorateur `@allow_permission` pour le RBAC.
- **Sérialiseurs** (`plane/app/serializers/`) — `ProjectSerializer`, `ProjectListSerializer`, `ProjectMemberSerializer`, etc.
- **Permissions** (`plane/app/permissions/base.py`) — décorateur `allow_permission` injecté directement sur les méthodes des ViewSets.
- **Tâches Celery** — tracé d'activité (`model_activity`), webhooks (`webhook_activity`), emails (`project_add_user_email`), visites récentes (`recent_visited_task`).

L'ensemble du module est scoped sous un slug de workspace (route : `/api/v1/workspaces/<slug>/projects/`).

---

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `apps/api/plane/db/models/project.py` | Modèles Project, ProjectMember, ProjectMemberInvite, ProjectDeployBoard (deprecated), ProjectPublicMember, ProjectUserProperty, ProjectIdentifier | ~374 |
| `apps/api/plane/db/models/state.py` | Modèles State, StateGroup, managers StateManager/TriageStateManager, DEFAULT_STATES | ~127 |
| `apps/api/plane/app/views/project/base.py` | ProjectViewSet, ProjectArchiveUnarchiveEndpoint, ProjectIdentifierEndpoint, ProjectUserViewsEndpoint, ProjectFavoritesViewSet, DeployBoardViewSet | ~577 |
| `apps/api/plane/app/views/project/member.py` | ProjectMemberViewSet, ProjectMemberUserEndpoint, UserProjectRolesEndpoint, ProjectMemberPreferenceEndpoint | ~390 |
| `apps/api/plane/app/views/state/base.py` | StateViewSet, IntakeStateEndpoint | ~147 |
| `apps/api/plane/app/permissions/base.py` | Décorateur `allow_permission`, enum ROLE | ~89 |
| `apps/api/plane/db/models/base.py` | BaseModel (UUID PK, audit auto via crum) | ~48 |

---

## Schéma BDD

### Table `projects`

| Colonne | Type | Contrainte |
|---------|------|------------|
| `id` | UUID | PK |
| `name` | VARCHAR(255) | Unique (workspace, non supprimé) |
| `description` | TEXT | nullable |
| `description_text` | JSONB | nullable |
| `description_html` | JSONB | nullable |
| `network` | SMALLINT | 0=Secret, 2=Public (défaut 2) |
| `workspace_id` | UUID FK | → `workspaces.id` CASCADE |
| `identifier` | VARCHAR(12) | Unique (workspace, non supprimé), indexed |
| `default_assignee_id` | UUID FK | → `users.id` CASCADE, nullable |
| `project_lead_id` | UUID FK | → `users.id` CASCADE, nullable |
| `emoji` | VARCHAR(255) | nullable |
| `icon_prop` | JSONB | nullable |
| `module_view` | BOOL | défaut False |
| `cycle_view` | BOOL | défaut False |
| `issue_views_view` | BOOL | défaut False |
| `page_view` | BOOL | défaut True |
| `intake_view` | BOOL | défaut False |
| `is_time_tracking_enabled` | BOOL | défaut False |
| `is_issue_type_enabled` | BOOL | défaut False |
| `guest_view_all_features` | BOOL | défaut False |
| `cover_image` | TEXT | nullable |
| `cover_image_asset_id` | UUID FK | → `file_assets.id` SET_NULL, nullable |
| `estimate_id` | UUID FK | → `estimates.id` SET_NULL, nullable |
| `archive_in` | INT | 0–12, défaut 0 |
| `close_in` | INT | 0–12, défaut 0 |
| `logo_props` | JSONB | défaut `{}` |
| `default_state_id` | UUID FK | → `states.id` SET_NULL, nullable |
| `archived_at` | TIMESTAMPTZ | nullable |
| `timezone` | VARCHAR(255) | défaut UTC |
| `external_source` | VARCHAR(255) | nullable |
| `external_id` | VARCHAR(255) | nullable |
| `created_at` | TIMESTAMPTZ | auto |
| `updated_at` | TIMESTAMPTZ | auto |
| `created_by_id` | UUID FK | nullable |
| `updated_by_id` | UUID FK | nullable |
| `deleted_at` | TIMESTAMPTZ | nullable (soft delete) |

**Contraintes d'unicité conditionnelles** (sur `deleted_at IS NULL`) :
- `project_unique_identifier_workspace_when_deleted_at_null`
- `project_unique_name_workspace_when_deleted_at_null`

**Ordering** : `-created_at`

---

### Table `project_members`

| Colonne | Type | Contrainte |
|---------|------|------------|
| `id` | UUID | PK |
| `project_id` | UUID FK | → `projects.id` CASCADE |
| `workspace_id` | UUID FK | → `workspaces.id` CASCADE |
| `member_id` | UUID FK | → `users.id` CASCADE, nullable |
| `role` | SMALLINT | 5=Guest, 15=Member, 20=Admin |
| `comment` | TEXT | nullable |
| `view_props` | JSONB | défaut `get_default_props()` |
| `default_props` | JSONB | défaut `get_default_props()` |
| `preferences` | JSONB | défaut `get_default_preferences()` |
| `sort_order` | FLOAT | défaut 65535 |
| `is_active` | BOOL | défaut True |
| `deleted_at` | TIMESTAMPTZ | nullable |

**Contrainte** : `project_member_unique_project_member_when_deleted_at_null` (unicité `project + member` si non supprimé).

**Hook save** : à la création, un `ProjectUserProperty` est créé automatiquement avec un `sort_order = min_sort_order - 10 000`.

---

### Table `project_member_invites`

| Colonne | Type | Contrainte |
|---------|------|------------|
| `id` | UUID | PK |
| `project_id` | UUID FK | CASCADE |
| `workspace_id` | UUID FK | CASCADE |
| `email` | VARCHAR(255) | |
| `accepted` | BOOL | défaut False |
| `token` | VARCHAR(255) | |
| `message` | TEXT | nullable |
| `responded_at` | TIMESTAMPTZ | nullable |
| `role` | SMALLINT | défaut 5 |

---

### Table `project_identifiers`

| Colonne | Type | Contrainte |
|---------|------|------------|
| `id` | UUID | PK |
| `workspace_id` | UUID FK | CASCADE |
| `project_id` | UUID | OneToOne → `projects.id` CASCADE |
| `name` | VARCHAR(12) | indexed |
| `deleted_at` | TIMESTAMPTZ | nullable |

Note : commentaire `# TODO: Remove workspace relation later` dans le code.

---

### Table `project_user_properties`

| Colonne | Type | Contrainte |
|---------|------|------------|
| `id` | UUID | PK |
| `project_id` | UUID FK | CASCADE |
| `workspace_id` | UUID FK | CASCADE |
| `user_id` | UUID FK | CASCADE |
| `filters` | JSONB | défaut `get_default_filters()` |
| `display_filters` | JSONB | défaut `get_default_display_filters()` |
| `display_properties` | JSONB | défaut `get_default_display_properties()` |
| `rich_filters` | JSONB | défaut `{}` |
| `preferences` | JSONB | défaut `get_default_preferences()` |
| `sort_order` | FLOAT | défaut 65535 |

**Contrainte** : unicité `user + project` si `deleted_at IS NULL`.

---

### Table `project_deploy_boards` (DEPRECATED)

| Colonne | Type | Contrainte |
|---------|------|------------|
| `id` | UUID | PK |
| `project_id` | UUID FK | CASCADE |
| `workspace_id` | UUID FK | CASCADE |
| `anchor` | VARCHAR(255) | unique, indexed, défaut `uuid4().hex` |
| `comments` | BOOL | défaut False |
| `reactions` | BOOL | défaut False |
| `votes` | BOOL | défaut False |
| `views` | JSONB | défaut `{list, kanban, calendar, gantt, spreadsheet: True}` |
| `intake_id` | UUID FK | → `intakes.id` SET_NULL, nullable |

Marqué `# DEPRECATED TODO` dans le code. Le système actif utilise le modèle générique `DeployBoard` (`deploy_board.py`).

---

### Table `states`

| Colonne | Type | Contrainte |
|---------|------|------------|
| `id` | UUID | PK |
| `project_id` | UUID FK | CASCADE |
| `workspace_id` | UUID FK | CASCADE |
| `name` | VARCHAR(255) | Unique (project, non supprimé) |
| `description` | TEXT | nullable |
| `color` | VARCHAR(255) | |
| `slug` | SlugField(100) | auto-généré depuis `name` |
| `sequence` | FLOAT | défaut 65535, auto `max + 15000` à la création |
| `group` | VARCHAR(20) | choices: backlog/unstarted/started/completed/cancelled/triage |
| `is_triage` | BOOL | défaut False |
| `default` | BOOL | défaut False |
| `external_source` | VARCHAR(255) | nullable |
| `external_id` | VARCHAR(255) | nullable |
| `deleted_at` | TIMESTAMPTZ | nullable |

**Ordering** : `sequence` (croissant).

**Managers** :
- `objects` = `StateManager` (exclut `group=triage`) — manager par défaut
- `all_state_objects` = `Manager()` — tous les états
- `triage_objects` = `TriageStateManager` (filtre `group=triage` uniquement)

**États par défaut** créés à la création d'un projet :

| Nom | Groupe | Séquence |
|-----|--------|----------|
| Backlog | backlog | 15000 |
| Todo | unstarted | 25000 |
| In Progress | started | 35000 |
| Done | completed | 45000 |
| Cancelled | cancelled | 55000 |
| Triage | triage | 65000 |

---

## API / Endpoints

| Méthode | Route | Vue | Description | Auth |
|---------|-------|-----|-------------|------|
| GET | `/workspaces/:slug/projects/` | `ProjectViewSet.list` | Liste light (sidebar) | MEMBER+ workspace |
| GET | `/workspaces/:slug/projects/list-detail/` | `ProjectViewSet.list_detail` | Liste avec détails complets | MEMBER+ workspace |
| POST | `/workspaces/:slug/projects/` | `ProjectViewSet.create` | Créer un projet | MEMBER+ workspace |
| GET | `/workspaces/:slug/projects/:pk/` | `ProjectViewSet.retrieve` | Détail projet | MEMBER+ workspace |
| PATCH | `/workspaces/:slug/projects/:pk/` | `ProjectViewSet.partial_update` | Modifier projet | ADMIN workspace ou ADMIN projet |
| DELETE | `/workspaces/:slug/projects/:pk/` | `ProjectViewSet.destroy` | Supprimer projet | ADMIN workspace ou ADMIN projet |
| POST | `/workspaces/:slug/projects/:project_id/archive/` | `ProjectArchiveUnarchiveEndpoint.post` | Archiver projet | ADMIN ou MEMBER |
| DELETE | `/workspaces/:slug/projects/:project_id/archive/` | `ProjectArchiveUnarchiveEndpoint.delete` | Désarchiver projet | ADMIN ou MEMBER |
| GET | `/workspaces/:slug/project-identifiers/` | `ProjectIdentifierEndpoint.get` | Vérifier disponibilité identifiant | MEMBER+ workspace |
| DELETE | `/workspaces/:slug/project-identifiers/` | `ProjectIdentifierEndpoint.delete` | Supprimer un identifiant libre | MEMBER+ workspace |
| POST | `/workspaces/:slug/projects/:project_id/project-views/` | `ProjectUserViewsEndpoint.post` | Sauvegarder préférences d'affichage | Membre actif du projet |
| GET | `/workspaces/:slug/projects/:project_id/members/` | `ProjectMemberViewSet.list` | Liste membres actifs | Tout membre |
| POST | `/workspaces/:slug/projects/:project_id/members/` | `ProjectMemberViewSet.create` | Ajouter membres (bulk) | ADMIN projet |
| GET | `/workspaces/:slug/projects/:project_id/members/:pk/` | `ProjectMemberViewSet.retrieve` | Détail membre | Tout membre |
| PATCH | `/workspaces/:slug/projects/:project_id/members/:pk/` | `ProjectMemberViewSet.partial_update` | Modifier rôle membre | ADMIN projet |
| DELETE | `/workspaces/:slug/projects/:project_id/members/:pk/` | `ProjectMemberViewSet.destroy` | Retirer membre (soft) | ADMIN projet |
| POST | `/workspaces/:slug/projects/:project_id/members/leave/` | `ProjectMemberViewSet.leave` | Quitter le projet | Tout membre actif |
| GET | `/workspaces/:slug/projects/:project_id/members/me/` | `ProjectMemberUserEndpoint.get` | Mon profil membre | Membre actif |
| GET | `/workspaces/:slug/user-project-roles/` | `UserProjectRolesEndpoint.get` | Rôles de l'utilisateur courant sur tous les projets | Membre workspace |
| GET | `/workspaces/:slug/projects/:project_id/members/:member_id/preferences/` | `ProjectMemberPreferenceEndpoint.get` | Préférences membre | Tout membre |
| PATCH | `/workspaces/:slug/projects/:project_id/members/:member_id/preferences/` | `ProjectMemberPreferenceEndpoint.patch` | Modifier préférences membre | Tout membre |
| GET | `/workspaces/:slug/projects/:project_id/states/` | `StateViewSet.list` | Liste des états (avec option grouped=true) | Tout membre |
| POST | `/workspaces/:slug/projects/:project_id/states/` | `StateViewSet.create` | Créer un état | ADMIN projet |
| PATCH | `/workspaces/:slug/projects/:project_id/states/:pk/` | `StateViewSet.partial_update` | Modifier un état | Tout membre |
| DELETE | `/workspaces/:slug/projects/:project_id/states/:pk/` | `StateViewSet.destroy` | Supprimer un état | ADMIN projet |
| POST | `/workspaces/:slug/projects/:project_id/states/:pk/default/` | `StateViewSet.mark_as_default` | Définir état par défaut | ADMIN projet |
| GET | `/workspaces/:slug/projects/:project_id/states/triage/` | `IntakeStateEndpoint.get` | État triage du projet | Tout membre |
| GET | `/workspaces/:slug/projects/:project_id/deploy-boards/` | `DeployBoardViewSet.list` | Configuration deploy board | ProjectMemberPermission |
| POST | `/workspaces/:slug/projects/:project_id/deploy-boards/` | `DeployBoardViewSet.create` | Créer/mettre à jour deploy board | ProjectMemberPermission |

---

## Patterns identifiés

- **RBAC à 3 niveaux (ADMIN=20, MEMBER=15, GUEST=5)** : appliqué via le décorateur `@allow_permission` injecté directement sur les méthodes des ViewSets. Deux scopes : `level="WORKSPACE"` et `level="PROJECT"` (défaut). Un ADMIN workspace bypass les restrictions projet s'il est membre actif du projet.
- **Soft delete** : `ProjectMember.is_active = False` (comportemental, pas via `deleted_at`). Les modèles partagent le pattern `deleted_at` de `BaseModel` pour l'unicité conditionnelle.
- **UUID primaires** : tous les modèles héritent de `BaseModel` (UUID v4 par défaut).
- **Audit automatique** : `created_by` / `updated_by` gérés automatiquement via `crum.get_current_user()` dans `BaseModel.save`.
- **Mixins d'héritage** : `ProjectBaseModel` (abstract) centralise les FK `project` et `workspace` et duplique automatiquement le workspace depuis le projet au `save`.
- **Double liste projet** : `ProjectViewSet` expose deux actions de liste — `list` (version légère pour la sidebar, `.values()`) et `list_detail` (sérialiseur complet, pour les vues détaillées). Les deux appliquent le filtre de visibilité par rôle workspace.
- **Invalidation de cache** : `@invalidate_cache` sur les actions ADMIN de `StateViewSet` (create, destroy, mark_as_default) invalide le cache workspace des états.
- **Tâches Celery** : `model_activity`, `webhook_activity`, `project_add_user_email`, `recent_visited_task` — toutes déclenchées en `.delay()` (asynchrone).
- **Bulk create avec ignore_conflicts** : l'ajout de membres utilise `bulk_create(..., ignore_conflicts=True)` pour gérer les doublons silencieusement.
- **use_read_replica** : `ProjectViewSet` et `UserProjectRolesEndpoint` activent la réplique de lecture pour les opérations de liste.

---

## Décisions techniques notables (documentées ici, non promues en ADR)

- **Visibilité filtrée selon rôle workspace** : la logique de filtrage (GUEST → membres seulement, MEMBER → membres + PUBLIC, ADMIN → tout) est implémentée dans chaque action `list` de la vue, pas dans un middleware global. Ce n'est pas un ADR (impact mono-module, AP-6 style API).
- **`list` vs `list_detail`** : deux actions de liste coexistent avec des niveaux de détail différents. Optimisation de performance (`.values()` vs sérialiseur complet). Documenté ici car confus mais pas architectural.
- **ProjectDeployBoard deprecated** : le modèle existe uniquement pour la compatibilité des anciens anchors. Le système actif utilise `DeployBoard` (deploy_board.py) avec `entity_name="project"`.
- **Sort order basé sur float décroissant** : le tri des projets par utilisateur utilise un float qui décroît (min - 10 000) à chaque ajout. Risque de collision à terme si la valeur descend trop bas — détail d'implémentation.
- **États triage exclus du manager par défaut** : `StateManager` exclut automatiquement le groupe `triage`. Cette décision est locale au module states et ne croise pas d'autre spec de manière architecturale.
- **Slug auto-calculé sur les états** : le slug est recalculé à chaque sauvegarde depuis le nom (`slugify`). Il n'est pas exposé comme identifiant métier clé.

---

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| Non identifié dans les fichiers consultés | Tests unitaires/d'intégration sur les projets | À vérifier dans `apps/api/tests/` |

> Note : le projet dispose de 47 fichiers pytest selon `discovery.md`. La couverture spécifique au module `api/projects` n'a pas été inventoriée dans cette session.
