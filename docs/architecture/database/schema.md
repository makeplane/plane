# Schéma base de données — Plane

> Fichier tenu à jour par `@update-writer-after-implement` après chaque migration.
> BDD : PostgreSQL 15 · ORM : Django 4.2 (migrations dans `apps/api/plane/db/migrations/`).
> Dernière mise à jour : 2026-07-08 (migration 0124).

---

## Conventions

- Toutes les tables héritant de `BaseModel` (`AuditModel > SoftDeleteModel`) portent les colonnes socles suivantes :

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | UUID | NO | PK, défaut `uuid4`, indexé |
| `created_at` | timestamptz | NO | auto_now_add |
| `updated_at` | timestamptz | NO | auto_now |
| `deleted_at` | timestamptz | YES | Soft-delete — NULL = actif |
| `created_by_id` | UUID (FK → users) | YES | SET NULL |
| `updated_by_id` | UUID (FK → users) | YES | SET NULL |

Le manager par défaut `objects` filtre `deleted_at IS NULL`. `all_objects` retourne tous les enregistrements.

---

## Tables documentées

> Cette liste est incrémentale. Seules les tables créées ou modifiées en Phase 2 (post-rétro) sont décrites ici. Pour les tables héritées, consulter le code source des modèles dans `apps/api/plane/db/models/`.

---

### `issue_pages`

> Créée par la migration `0123_issue_pages.py` (2026-07-08).
> Relation many-to-many entre `issues` et `pages`, gérée manuellement (table de jointure pure).

| Colonne | Type | Nullable | Contraintes | Description |
|---------|------|----------|-------------|-------------|
| `id` | UUID | NO | PK | Hérité de BaseModel |
| `created_at` | timestamptz | NO | | Hérité de BaseModel |
| `updated_at` | timestamptz | NO | | Hérité de BaseModel |
| `deleted_at` | timestamptz | YES | | Soft-delete (NULL = lien actif) |
| `created_by_id` | UUID | YES | FK → `users(id)` SET NULL | Utilisateur ayant créé le lien |
| `updated_by_id` | UUID | YES | FK → `users(id)` SET NULL | Utilisateur ayant modifié le lien |
| `workspace_id` | UUID | NO | FK → `workspaces(id)` CASCADE | Workspace du work item et de la page |
| `project_id` | UUID | NO | FK → `projects(id)` CASCADE | Projet du work item |
| `issue_id` | UUID | NO | FK → `issues(id)` CASCADE | Work item lié |
| `page_id` | UUID | NO | FK → `pages(id)` CASCADE | Page liée |

#### Contraintes d'unicité

| Nom | Champs | Condition | Description |
|-----|--------|-----------|-------------|
| `issue_pages_issuepage_issue_id_page_id_deleted_at_uniq` | `(issue_id, page_id, deleted_at)` | — | Unicité composite (tolère N soft-deletes + 1 actif) |
| `issue_page_unique_issue_page_when_deleted_at_null` | `(issue_id, page_id)` | `WHERE deleted_at IS NULL` | Unicité partielle — un seul lien actif par paire (issue, page) |

#### Index

| Nom | Champ(s) | Type |
|-----|---------|------|
| `issue_pages_page_id_idx` | `page_id` | BTree |
| `issue_pages_issue_id_idx` | `issue_id` | BTree |

#### Notes

- Aucune colonne de permission sur la table elle-même. L'accès en lecture est filtré par ligne via le helper `plane/utils/page_access.py`.
- Invariant applicatif (non contraint en DB) : `issue.workspace_id == page.workspace_id`.
- Le `delete()` est un soft-delete (pose `deleted_at`). Permet le ré-attachement d'une page précédemment détachée.
- Ordering par défaut : `-created_at`.

---

## Table `issue_properties` (custom property definition — module work-item-properties, migration 0124)

Définition d'une propriété custom rattachée à un type de work item.

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID PK | |
| `workspace_id` | FK workspaces | dérivé du projet |
| `project_id` | FK projects | |
| `issue_type_id` | FK issue_types | related_name `properties` |
| `display_name` | varchar(255) | |
| `description` | text | |
| `property_type` | varchar | TEXT/DECIMAL/BOOLEAN/DATETIME/OPTION/RELATION/URL (EMAIL/FILE/FORMULA réservés) |
| `relation_type` | varchar null | USER/ISSUE (si RELATION) |
| `is_required` / `is_multi` / `is_active` | bool | |
| `default_value` | text null | |
| `settings` | jsonb | ex. format texte |
| `sort_order` | float | |
| `external_source` / `external_id` | varchar null | |
| `created_at`/`updated_at`/`deleted_at`/`created_by`/`updated_by` | BaseModel | soft-delete |

Index : `(issue_type, project)`. **Immuables après création** : `property_type`, `relation_type`.

## Table `issue_property_options` (choix d'une propriété OPTION)

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID PK | |
| `workspace_id` / `project_id` | FK | |
| `property_id` | FK issue_properties | related_name `options` |
| `name` | varchar(255) | |
| `description` | text | |
| `is_active` / `is_default` | bool | |
| `sort_order` | float | |
| `logo_props` | jsonb | |
| `external_source` / `external_id` | varchar null | |

Index : `issue_prop_opt_prop_proj_idx` sur `(property, project)`.

## Table `issue_property_values` (valeur par work item — stockage typé)

Une ligne par valeur ; `is_multi` ⇒ plusieurs lignes par (issue, property).

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID PK | |
| `workspace_id` / `project_id` | FK | |
| `issue_id` | FK issues | related_name `property_values` |
| `property_id` | FK issue_properties | related_name `values` |
| `value_text` | text null | TEXT/URL |
| `value_boolean` | bool null | BOOLEAN |
| `value_decimal` | numeric null | DECIMAL (NaN/Inf rejetés) |
| `value_datetime` | timestamptz null | DATETIME |
| `value_uuid` | uuid null | RELATION (user/issue) |
| `value_option_id` | FK issue_property_options null | OPTION |
| `external_source` / `external_id` | varchar null | |

Index : `(issue, property)`.

#### Notes (properties)

- Aucune permission stockée sur les lignes ; l'accès est résolu dynamiquement (mutations de définition = ADMIN projet ; valeurs = droit d'édition du work item).
- Isolation projet stricte : `type∈projet`, `option∈property`, RELATION-user ∈ membres actifs du projet, RELATION-issue ∈ projet.
- Cast/validation centralisés dans `plane/utils/issue_property.py` (une colonne par type).
