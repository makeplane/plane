# Schéma base de données — Plane

> Fichier tenu à jour par `@update-writer-after-implement` après chaque migration.
> BDD : PostgreSQL 15 · ORM : Django 4.2 (migrations dans `apps/api/plane/db/migrations/`).
> Dernière mise à jour : 2026-07-08 (migration 0123).

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
