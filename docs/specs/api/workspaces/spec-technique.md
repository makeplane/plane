# Spec Technique — api/workspaces

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | api/workspaces      |
| Version       | 0.1.0               |
| Date          | 2026-06-30          |
| Source        | Rétro-ingénierie    |

---

## Architecture du module

Le module workspace est organisé en trois couches :

- **Modèles** (`plane/db/models/workspace.py`) : définissent le schéma BDD et les règles d'intégrité.
- **Vues** (`plane/app/views/workspace/`) : gèrent le routage HTTP, les permissions, et appellent les serializers.
- **Serializers** (`plane/app/serializers/workspace.py`) : transforment les modèles Django en JSON, valident les données entrantes.

Les vues s'appuient sur deux bases communes : `BaseAPIView` (vues simples) et `BaseViewSet` (CRUD complet via DRF ViewSet). Les permissions sont appliquées via des classes DRF (`WorkSpaceBasePermission`, `WorkSpaceAdminPermission`, etc.) et via le décorateur `@allow_permission` pour un contrôle granulaire par méthode.

---

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `apps/api/plane/db/models/workspace.py` | Modèles Workspace, WorkspaceMember, WorkspaceMemberInvite, Team, WorkspaceTheme, WorkspaceUserProperties, WorkspaceUserLink, WorkspaceHomePreference, WorkspaceUserPreference | ~456 |
| `apps/api/plane/app/views/workspace/base.py` | CRUD workspace, dashboard utilisateur, thèmes, export activité | ~421 |
| `apps/api/plane/app/views/workspace/member.py` | CRUD membres, leave, vues props, membres projet | ~267 |
| `apps/api/plane/app/views/workspace/invite.py` | Invitations workspace (création, annulation, acceptation) | ~325 |
| `apps/api/plane/app/views/workspace/home.py` | Préférences tableau de bord utilisateur | ~80 |
| `apps/api/plane/app/serializers/workspace.py` | Serializers pour tous les modèles workspace | ~369 |
| `apps/api/plane/app/urls/workspace.py` | Routage URL du module (42 patterns) | ~261 |
| `apps/api/plane/app/permissions/workspace.py` | Classes de permission DRF workspace | ~138 |
| `apps/api/plane/app/permissions/base.py` | Enum ROLE + décorateur @allow_permission | ~89 |
| `apps/api/plane/bgtasks/workspace_seed_task.py` | Tâche Celery de seed initial (projet exemple) | ~570 |
| `apps/api/plane/utils/constants.py` | RESTRICTED_WORKSPACE_SLUGS (~50 valeurs) | ~60 |

---

## Schéma BDD

### Table `workspaces`

| Colonne | Type | Contraintes | Notes |
|---------|------|-------------|-------|
| `id` | UUID | PK, default=uuid4 | Hérité de BaseModel |
| `name` | CharField(80) | NOT NULL | Nom affiché |
| `slug` | SlugField(48) | UNIQUE, db_index | Identifiant URL — suffixé `__<epoch>` au soft delete |
| `owner_id` | FK → User | CASCADE | Créateur du workspace |
| `logo` | TextField | NULL | URL image legacy |
| `logo_asset_id` | FK → FileAsset | SET_NULL, NULL | Logo via système FileAsset |
| `organization_size` | CharField(20) | NULL | Taille org (champ libre) |
| `timezone` | CharField(255) | default="UTC" | Choix parmi pytz.common_timezones |
| `background_color` | CharField(255) | default=get_random_color | Couleur générée aléatoirement à la création |
| `created_at` | DateTimeField | auto_now_add | Hérité de BaseModel |
| `updated_at` | DateTimeField | auto_now | Hérité de BaseModel |
| `deleted_at` | DateTimeField | NULL | Soft delete |

**Comportement spécial :** La méthode `delete()` est surchargée — après soft delete, le slug devient `<slug>__<deletion_timestamp>` (via `save(update_fields=["slug"])`). La propriété `logo_url` retourne l'URL du `logo_asset` si présent, sinon le champ `logo` legacy.

### Table `workspace_members`

| Colonne | Type | Contraintes | Notes |
|---------|------|-------------|-------|
| `id` | UUID | PK | |
| `workspace_id` | FK → Workspace | CASCADE | |
| `member_id` | FK → User | CASCADE | |
| `role` | PositiveSmallInt | choices: (20,15,5) | ADMIN/MEMBER/GUEST |
| `company_role` | TextField | NULL | Rôle métier libre (ex: "CTO") |
| `view_props` | JSONField | default=get_default_props | Préférences vues sauvegardées |
| `default_props` | JSONField | default=get_default_props | Props par défaut |
| `issue_props` | JSONField | default=get_issue_props | Filtres issues |
| `is_active` | BooleanField | default=True | Soft deactivation |
| `getting_started_checklist` | JSONField | default=dict | Checklist onboarding |
| `tips` | JSONField | default=dict | Tips affichés |
| `explored_features` | JSONField | default=dict | Features déjà explorées |

**Contrainte unique :** `(workspace, member)` quand `deleted_at IS NULL`. Permet la réactivation d'un membre supprimé.

### Table `workspace_member_invites`

| Colonne | Type | Contraintes | Notes |
|---------|------|-------------|-------|
| `id` | UUID | PK | |
| `workspace_id` | FK → Workspace | CASCADE | |
| `email` | CharField(255) | NOT NULL | Email invité (normalisé lowercase) |
| `accepted` | BooleanField | default=False | Réponse |
| `token` | CharField(255) | NOT NULL | JWT signé avec SECRET_KEY (HS256) |
| `message` | TextField | NULL | Message personnalisé |
| `responded_at` | DateTimeField | NULL | Horodatage de réponse |
| `role` | PositiveSmallInt | choices: (20,15,5) | Rôle proposé |

**Contrainte unique :** `(email, workspace)` quand `deleted_at IS NULL`.

### Table `workspace_home_preferences`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID | PK |
| `workspace_id` | FK → Workspace | |
| `user_id` | FK → User | |
| `key` | CharField(255) | Valeurs : quick_links, recents, my_stickies, new_at_plane, quick_tutorial |
| `is_enabled` | BooleanField | default=True |
| `config` | JSONField | default=dict — configuration spécifique au widget |
| `sort_order` | FloatField | default=65535 |

**Contrainte unique :** `(workspace, user, key)` quand `deleted_at IS NULL`.

### Table `workspace_user_properties`

| Colonne | Type | Notes |
|---------|------|-------|
| `filters` | JSONField | Filtres issues actifs |
| `display_filters` | JSONField | Options d'affichage (group_by, order_by, layout) |
| `display_properties` | JSONField | Colonnes visibles |
| `rich_filters` | JSONField | Filtres avancés |
| `navigation_project_limit` | IntegerField | default=10 |
| `navigation_control_preference` | CharField | ACCORDION ou TABBED |

### Table `workspace_themes`

| Colonne | Type | Notes |
|---------|------|-------|
| `workspace_id` | FK | |
| `name` | CharField(300) | |
| `actor_id` | FK → User | Créateur du thème |
| `colors` | JSONField | Palette de couleurs |

**Contrainte unique :** `(workspace, name)` quand `deleted_at IS NULL`.

### Table `teams`

| Colonne | Type | Notes |
|---------|------|-------|
| `workspace_id` | FK | |
| `name` | CharField(255) | |
| `description` | TextField | |
| `logo_props` | JSONField | |

**Contrainte unique :** `(name, workspace)` quand `deleted_at IS NULL`.

### Table `workspace_user_links`

Hérite de `WorkspaceBaseModel` (workspace + project FKs). Stocke des liens URL personnels par utilisateur/workspace. La colonne `url` est préfixée `http://` si absente du protocole. Unicité vérifiée par le serializer (pas de contrainte BDD).

### Table `workspace_user_preferences`

| Colonne | Type | Notes |
|---------|------|-------|
| `key` | CharField(255) | Valeurs : views, active_cycles, analytics, drafts, your_work, archives, stickies |
| `is_pinned` | BooleanField | Épinglé dans la sidebar |
| `sort_order` | FloatField | Ordre d'affichage |

---

## API / Endpoints

### Workspace (CRUD)

| Méthode | Route | Vue | Auth requise | Rôle minimum |
|---------|-------|-----|--------------|--------------|
| GET | `/api/workspaces/` | WorkSpaceViewSet.list | Oui | Tout membre actif |
| POST | `/api/workspaces/` | WorkSpaceViewSet.create | Oui | Tout utilisateur |
| GET | `/api/workspaces/<slug>/` | WorkSpaceViewSet.retrieve | Oui | Tout membre actif |
| PATCH | `/api/workspaces/<slug>/` | WorkSpaceViewSet.partial_update | Oui | ADMIN |
| DELETE | `/api/workspaces/<slug>/` | WorkSpaceViewSet.destroy | Oui | ADMIN |
| GET | `/api/workspace-slug-check/?slug=<s>` | WorkSpaceAvailabilityCheckEndpoint | Non | Aucun |

### Membres

| Méthode | Route | Vue | Rôle minimum |
|---------|-------|-----|--------------|
| GET | `/api/workspaces/<slug>/members/` | WorkSpaceMemberViewSet.list | GUEST |
| GET | `/api/workspaces/<slug>/members/<pk>/` | WorkSpaceMemberViewSet.retrieve | GUEST |
| PATCH | `/api/workspaces/<slug>/members/<pk>/` | WorkSpaceMemberViewSet.partial_update | ADMIN |
| DELETE | `/api/workspaces/<slug>/members/<pk>/` | WorkSpaceMemberViewSet.destroy | ADMIN |
| POST | `/api/workspaces/<slug>/members/leave/` | WorkSpaceMemberViewSet.leave | GUEST |
| GET | `/api/workspaces/<slug>/workspace-members/me/` | WorkspaceMemberUserEndpoint | Tout membre |
| POST | `/api/workspaces/<slug>/workspace-views/` | WorkspaceMemberUserViewsEndpoint | Tout membre |
| GET | `/api/workspaces/<slug>/project-members/` | WorkspaceProjectMemberEndpoint | Tout membre |

### Invitations

| Méthode | Route | Vue | Rôle minimum |
|---------|-------|-----|--------------|
| GET | `/api/workspaces/<slug>/invitations/` | WorkspaceInvitationsViewset.list | ADMIN/MEMBER |
| POST | `/api/workspaces/<slug>/invitations/` | WorkspaceInvitationsViewset.create | ADMIN/MEMBER |
| DELETE | `/api/workspaces/<slug>/invitations/<pk>/` | WorkspaceInvitationsViewset.destroy | ADMIN/MEMBER |
| GET | `/api/workspaces/<slug>/invitations/<pk>/join/` | WorkspaceJoinEndpoint.get | Aucun (public) |
| POST | `/api/workspaces/<slug>/invitations/<pk>/join/` | WorkspaceJoinEndpoint.post | Authentifié + email match |
| GET | `/api/users/me/workspaces/invitations/` | UserWorkspaceInvitationsViewSet.list | Authentifié |
| POST | `/api/users/me/workspaces/invitations/` | UserWorkspaceInvitationsViewSet.create | Authentifié |

### Thèmes et préférences

| Méthode | Route | Vue | Rôle minimum |
|---------|-------|-----|--------------|
| GET/POST | `/api/workspaces/<slug>/workspace-themes/` | WorkspaceThemeViewSet | ADMIN/MEMBER |
| GET/PATCH/DELETE | `/api/workspaces/<slug>/workspace-themes/<pk>/` | WorkspaceThemeViewSet | ADMIN/MEMBER |
| GET/PATCH | `/api/workspaces/<slug>/home-preferences/` | WorkspaceHomePreferenceViewSet | GUEST |
| PATCH | `/api/workspaces/<slug>/home-preferences/<key>/` | WorkspaceHomePreferenceViewSet | GUEST |
| GET/PATCH | `/api/workspaces/<slug>/user-properties/` | WorkspaceUserPropertiesEndpoint | Tout membre |
| GET/POST/PATCH/DELETE | `/api/workspaces/<slug>/sidebar-preferences/` | WorkspaceUserPreferenceViewSet | Tout membre |

### Dashboard et analytics

| Méthode | Route | Vue |
|---------|-------|-----|
| GET | `/api/workspaces/<slug>/user-stats/<user_id>/` | WorkspaceUserProfileStatsEndpoint |
| GET | `/api/workspaces/<slug>/user-activity/<user_id>/` | WorkspaceUserActivityEndpoint |
| POST | `/api/workspaces/<slug>/user-activity/<user_id>/export/` | ExportWorkspaceUserActivityEndpoint (CSV) |
| GET | `/api/workspaces/<slug>/user-profile/<user_id>/` | WorkspaceUserProfileEndpoint |
| GET | `/api/workspaces/<slug>/user-issues/<user_id>/` | WorkspaceUserProfileIssuesEndpoint |

---

## Patterns identifiés

- **BaseModel + soft delete universel :** Tous les modèles héritent de `BaseModel` (UUID PK, `created_at`, `updated_at`, `deleted_at`). Les `UniqueConstraint` avec `condition=Q(deleted_at__isnull=True)` permettent la réutilisation d'un même slug/email après suppression.

- **Décorateur `@allow_permission` :** Appliqué par méthode de vue pour un contrôle granulaire du RBAC. Accepte une liste de rôles `ROLE` enum et un `level` ("WORKSPACE" ou "PROJECT"). Distinct des classes de permission DRF appliquées au niveau `permission_classes`.

- **Double validation :** Certaines validations sont présentes à la fois dans la vue (ex. : longueur nom/slug dans `WorkSpaceViewSet.create`) et dans le serializer (ex. : `validate_name`, `validate_slug`). Redondance intentionnelle pour défense en profondeur.

- **Invalidation de cache Redis par décorateur :** Le décorateur `@invalidate_cache` sur `leave` et `WorkspaceJoinEndpoint.post` invalide plusieurs endpoints de liste simultanément (workspaces, settings, membres).

- **Sérialiseur public vs admin :** `WorkSpaceMemberInvitePublicSerializer` exclut délibérément les champs `token` et `invite_link` pour les appels GET non authentifiés (voir ADR RETRO-012). `WorkspaceMemberAdminSerializer` expose des champs supplémentaires aux ADMIN/MEMBER par rapport à `WorkSpaceMemberSerializer` pour les GUEST.

- **Read replica :** `UserWorkSpacesEndpoint` et `WorkspaceMemberUserEndpoint` utilisent `use_read_replica = True` pour les lectures coûteuses.

- **WorkspaceBaseModel (abstrait) :** Modèle abstrait qui ajoute les FK `workspace` et `project` automatiquement. La méthode `save()` auto-synchronise `workspace` depuis `project.workspace` si un projet est associé.

- **Tâche Celery de seed :** À la création de chaque workspace, `workspace_seed.delay(workspace_id)` crée un projet démo complet (states, labels, issues, pages, cycles, modules) depuis des données JSON de seed.

- **Sérialisation dynamique :** `WorkSpaceSerializer` et `WorkspaceMemberAdminSerializer` héritent de `DynamicBaseSerializer`, permettant la sélection de champs via le paramètre `?fields=` en GET.

---

## Décisions techniques documentées (non-ADR)

- **Valeurs numériques des rôles (20/15/5)** : les gaps entre les valeurs permettent potentiellement l'insertion de rôles intermédiaires futurs sans migration. Documenté en `ROLE_CHOICES` et en enum `ROLE`.

- **Slug suffixé au soft delete** : `Workspace.delete()` ajoute `__<epoch>` au slug après soft delete. Cela libère le slug pour réutilisation sans hard delete. Pattern visible directement dans le code — pas de justification architecturale distincte documentée.

- **Logo dual-track** : deux champs coexistent — `logo` (URL texte, legacy) et `logo_asset` (FK vers FileAsset, système actuel). La propriété `logo_url` retourne `logo_asset.asset_url` en priorité, puis `logo` si absent. Indique une migration en cours ou incomplète.

- **Validation de slug côté modèle ET serializer** : `slug_validator` est défini sur le champ modèle et `validate_slug` est redéfini dans le serializer. Redondance de défense.

- **Export CSV d'activité** : l'export utilise `sanitize_csv_row` pour protéger contre l'injection CSV (formules commençant par `=`, `+`, `-`, `@`). Limité à 10 000 lignes par export.

---

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| `apps/api/tests/workspace/` | CRUD workspace, permissions, invitations | A vérifier — non exploré dans ce scope |
| Tests unitaires serializer | Validation des champs workspace | Probablement inclus dans les 47 fichiers pytest |

> Les tests spécifiques au module workspace n'ont pas été explorés en détail. La couverture exacte est à valider.
