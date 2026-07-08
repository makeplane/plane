# Spec Technique — api/issues

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | api/issues          |
| Version       | 0.1.0               |
| Date          | 2026-06-30          |
| Source        | Rétro-ingénierie    |

---

## Architecture du module

Le module issues est structuré en trois couches :

1. **Modèles** (`plane/db/models/issue.py`, `description.py`) — entités Django ORM héritant de `ProjectBaseModel` (lui-même héritant de `BaseModel → AuditModel → SoftDeleteModel`).
2. **Vues DRF** (`plane/app/views/issue/`) — `BaseViewSet` et `BaseAPIView` avec décorateurs `@allow_permission`.
3. **Tâches Celery** (`plane/bgtasks/`) — activité, versioning description, versioning métadonnées, webhooks.

Les vues ne portent pas de logique métier complexe : elles délèguent la validation aux serializers et les effets de bord (activité, versions, webhooks, notifications) aux tâches Celery asynchrones.

---

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `apps/api/plane/db/models/issue.py` | Modèles Issue, IssueComment, IssueActivity, IssueRelation, IssueAssignee, IssueLabel, IssueLink, IssueAttachment, IssueSubscriber, IssueReaction, CommentReaction, IssueVote, IssueVersion, IssueDescriptionVersion, IssueMention, IssueSequence, IssueBlocker | ~823 |
| `apps/api/plane/db/models/description.py` | Description (model partagé avec pages), DescriptionVersion | ~57 |
| `apps/api/plane/db/models/base.py` | BaseModel (UUID PK, audit auto via crum) | ~48 |
| `apps/api/plane/db/mixins.py` | SoftDeletionManager, SoftDeletionQuerySet, AuditModel, ChangeTrackerMixin | ~222 |
| `apps/api/plane/app/views/issue/base.py` | IssueViewSet, IssueListEndpoint, IssuePaginatedViewSet, IssueDetailEndpoint, IssueDetailIdentifierEndpoint, IssueMetaEndpoint, BulkDeleteIssuesEndpoint, DeletedIssuesListViewSet, IssueBulkUpdateDateEndpoint, ProjectUserDisplayPropertyEndpoint | ~1356 |
| `apps/api/plane/app/views/issue/comment.py` | IssueCommentViewSet, CommentReactionViewSet | ~240 |
| `apps/api/plane/app/views/issue/relation.py` | IssueRelationViewSet | ~294 |
| `apps/api/plane/app/views/issue/activity.py` | IssueActivityEndpoint | ~87 |
| `apps/api/plane/bgtasks/issue_activities_task.py` | Tâche Celery de génération des IssueActivity (tracking de tous les champs) | ~800+ |
| `apps/api/plane/bgtasks/issue_description_version_task.py` | Tâche Celery de versioning des descriptions (déduplication 10 min) | ~79 |
| `apps/api/plane/bgtasks/issue_version_sync.py` | Tâche Celery de versioning des métadonnées + sync batch pour migration | ~237 |
| `apps/api/plane/bgtasks/issue_description_version_sync.py` | Tâche Celery de sync batch des versions de description | ~(à vérifier) |
| `apps/api/plane/bgtasks/issue_automation_task.py` | Tâche Celery d'automatisation (règles auto sur issues) | ~(à vérifier) |
| `apps/api/plane/utils/issue_relation_mapper.py` | Mapping relation forward/reverse (blocking→blocked_by) | ~(à vérifier) |
| `apps/api/plane/utils/filters.py` | ComplexFilterBackend, IssueFilterSet | ~(à vérifier) |
| `apps/api/plane/utils/grouper.py` | issue_group_values, issue_on_results, issue_queryset_grouper | ~(à vérifier) |
| `apps/api/plane/utils/order_queryset.py` | order_issue_queryset | ~(à vérifier) |
| `apps/api/plane/utils/paginator.py` | GroupedOffsetPaginator, SubGroupedOffsetPaginator | ~(à vérifier) |

---

## Schéma BDD

### Tables principales

| Table | Modèle | Clé PK | Soft delete |
|-------|--------|--------|-------------|
| `issues` | `Issue` | UUID | Oui (`deleted_at`) |
| `issue_comments` | `IssueComment` | UUID | Oui (via `ProjectBaseModel`) |
| `issue_activities` | `IssueActivity` | UUID | Non (implicitement préservé) |
| `issue_relations` | `IssueRelation` | UUID | Oui — UniqueConstraint conditionnel |
| `issue_assignees` | `IssueAssignee` | UUID | Oui — UniqueConstraint conditionnel |
| `issue_labels` | `IssueLabel` | UUID | Non |
| `issue_links` | `IssueLink` | UUID | Non |
| `issue_attachments` | `IssueAttachment` | UUID | Non |
| `issue_subscribers` | `IssueSubscriber` | UUID | Oui — UniqueConstraint conditionnel |
| `issue_reactions` | `IssueReaction` | UUID | Oui — UniqueConstraint conditionnel |
| `comment_reactions` | `CommentReaction` | UUID | Oui — UniqueConstraint conditionnel |
| `issue_votes` | `IssueVote` | UUID | Oui — UniqueConstraint conditionnel |
| `issue_versions` | `IssueVersion` | UUID | Non |
| `issue_description_versions` | `IssueDescriptionVersion` | UUID | Non |
| `issue_sequences` | `IssueSequence` | UUID | Non (FK nullable vers Issue) |
| `issue_mentions` | `IssueMention` | UUID | Oui — UniqueConstraint conditionnel |
| `issue_blockers` | `IssueBlocker` | UUID | Non (legacy — supplanté par IssueRelation) |
| `descriptions` | `Description` | UUID | Non |
| `description_versions` | `DescriptionVersion` | UUID | Non |

### Champs description de Issue (triple format)

```
description_json     JSONField         ProseMirror AST (JSON)
description_html     TextField         HTML rendu (lecture rapide API)
description_binary   BinaryField       Document Y.js binaire (CRDT collab)
description_stripped TextField         Texte brut (strip_tags de description_html, fulltext)
```

### Contraintes d'unicité conditionnelles (soft delete)

Exemple sur `IssueRelation` :
```sql
UNIQUE (issue_id, related_issue_id) WHERE deleted_at IS NULL
```
La même contrainte existe sur `IssueAssignee`, `IssueSubscriber`, `IssueReaction`, `CommentReaction`, `IssueVote`, `IssueMention`.

### FK notables

- `IssueActivity.issue` : `on_delete=DO_NOTHING` — les activités survivent à la suppression de l'issue.
- `IssueSequence.issue` : `on_delete=SET_NULL` — la séquence survit à la suppression.
- `IssueVersion.activity` : `on_delete=SET_NULL`.
- `Issue.estimate_point` : `on_delete=SET_NULL`.
- `Issue.parent` : `on_delete=CASCADE` (les sous-issues sont supprimées avec le parent).
- `IssueComment.description` : `on_delete=CASCADE` (OneToOne vers `Description`).

---

## API / Endpoints

| Méthode | Route (sous `/api/v1/workspaces/{slug}/projects/{project_id}/`) | Description | Auth / Rôle |
|---------|------------------------------------------------------------------|-------------|-------------|
| GET | `issues/` | Liste paginée avec group_by, sub_group_by, filtres | ADMIN, MEMBER, GUEST |
| POST | `issues/` | Créer une issue | ADMIN, MEMBER |
| GET | `issues/{pk}/` | Détail issue (annotations complètes) | ADMIN, MEMBER, GUEST (+ règle GUEST) |
| PATCH | `issues/{pk}/` | Mise à jour partielle | ADMIN, MEMBER (ou créateur) |
| DELETE | `issues/{pk}/` | Soft delete | ADMIN (ou créateur) |
| GET | `issue-detail/` | Liste détaillée paginée avec expand | ADMIN, MEMBER, GUEST |
| GET | `list-issues/` | Liste légère par IDs | ADMIN, MEMBER, GUEST |
| GET | `issues-paginated/` | Pagination cursor (sync offline) | ADMIN, MEMBER, GUEST |
| GET | `issues/{pk}/identifier/` | Résolution sequence_id human-readable | Membre du projet |
| GET | `issues/{issue_id}/activities/` | Timeline activités + commentaires | ADMIN, MEMBER, GUEST |
| GET/POST/PATCH/DELETE | `issues/{issue_id}/comments/` | CRUD commentaires | ADMIN, MEMBER, GUEST |
| GET/POST | `issues/{issue_id}/relations/` | Liste / créer relations | ProjectEntityPermission |
| POST | `issues/{issue_id}/relations/remove/` | Supprimer une relation | ProjectEntityPermission |
| POST | `bulk-delete-issues/` | Soft delete multiple | ADMIN |
| POST | `bulk-update-issues/dates/` | Mise à jour bulk start_date/target_date | ADMIN, MEMBER |
| GET | `deleted-issues/` | Liste IDs des issues supprimées/archivées | ADMIN, MEMBER, GUEST |
| GET/PATCH | `user-properties/` | Propriétés d'affichage par utilisateur | ADMIN, MEMBER, GUEST |

---

## Patterns identifiés

- **Manager personnalisé** : `IssueManager` hérite de `SoftDeletionManager` et filtre systématiquement les issues TRIAGE, archivées, brouillons et issues de projets archivés. Deux managers coexistent : `Issue.issue_objects` (standard filtré) et `Issue.all_objects` (manager Django brut, accès à toutes les issues).
- **SoftDelete généralisé** : `SoftDeleteModel` (dans `mixins.py`) fournit `deleted_at`, deux managers (`objects` = filtré, `all_objects` = tout), et délègue la suppression en cascade soft aux objets liés via Celery (`soft_delete_related_objects`).
- **ChangeTrackerMixin** : mixin de tracking de changements entre `__init__` et `save()`. Utilisé par `Issue` (track `state_id`) et `IssueComment` (track `comment_stripped`, `comment_json`, `comment_html`). Permet de détecter si `completed_at` doit être mis à jour et de propager les changements vers `Description`.
- **Annotations compute-on-read** : `cycle_id`, `link_count`, `attachment_count`, `sub_issues_count`, `label_ids`, `assignee_ids`, `module_ids` sont des sous-requêtes annotées à chaque lecture — ils ne sont pas matérialisés dans la table `issues`.
- **Double pagination** : `GroupedOffsetPaginator` et `SubGroupedOffsetPaginator` pour le mode groupé ; pagination cursor (`paginate()`) dans `IssuePaginatedViewSet` pour la synchronisation offline.
- **Compression gzip** : les endpoints list et activité utilisent `@method_decorator(gzip_page)`.
- **Advisory lock PostgreSQL** : à la création d'une issue, `pg_advisory_xact_lock(uuid_to_int(project.id))` garantit l'unicité du `sequence_id` par projet sans deadlock.
- **Relation bidirectionnelle normalisée** : le type de relation est normalisé en base via `get_actual_relation()`. La lecture reconstruit les deux sens (ex : `blocking` = issues qui ont `blocked_by` pointant vers l'issue courante).
- **Déduplication de versions (10 min)** : si le même utilisateur modifie une issue moins de 10 minutes après la dernière version (`last_saved_at`), la version existante est mise à jour plutôt qu'une nouvelle créée. Applicable séparément pour `IssueVersion` et `IssueDescriptionVersion`.

## Versioning de la description — flux technique

```
PATCH /issues/{pk}/
  → serializer.save()
  → issue_description_version_task.delay(current_instance, issue_id, user_id)
      → si description_html identique → no-op
      → sinon → latest_version = IssueDescriptionVersion.last()
          → si même user & < 10min → update_existing_version(latest_version, issue)
          → sinon → IssueDescriptionVersion.log_issue_description_version(issue, user)
```

## Versioning des métadonnées — flux technique

```
PATCH /issues/{pk}/
  → issue_activity.delay()  [bgtask]
      → ... track_xxx() pour chaque champ changé
      → IssueVersion.log_issue_version(issue, user) ou update existing
```

## Décisions documentées en spec-technique (non promues ADR)

- **Versioning split description vs métadonnées** : `IssueVersion` capture les métadonnées (état, priorité, assignees, labels, cycle, modules) ; `IssueDescriptionVersion` capture les 4 champs de description. Ce split est interne au module — un seul refactor toucherait 2 tables et 2 tâches Celery mais reste confiné à api/issues.

- **Advisory lock PostgreSQL pour sequence_id** : `pg_advisory_xact_lock(convert_uuid_to_integer(project.id))` utilisé dans `Issue.save()` pour garantir l'atomicité sans race condition sur le `sequence_id`. Localement limité au modèle Issue.

- **completed_at automatisé via ChangeTrackerMixin** : `_sync_completed_at()` ne s'exécute que si `state_id` a changé (détection via `has_changed`). Évite les écritures inutiles sur `completed_at`.

- **IssueBlocker (legacy)** : la table `issue_blockers` existe en parallèle d'`IssueRelation`. `IssueBlocker` semble être l'ancienne implémentation des relations bloquant/bloqué — non utilisée par les vues actuelles.

- **Annotations plutôt que matérialisation** : `sub_issues_count`, `link_count`, `attachment_count`, `cycle_id` sont calculés par sous-requête SQL à chaque lecture. Cela évite la désynchronisation mais peut peser sur les performances avec de grands volumes.

---

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| `apps/api/tests/` | Contrats d'API issues (création, listing, filtres, permissions) | Existant (à localiser précisément) |
| Tests unitaires modèles | Non identifiés de façon certaine | Inconnu |
| Tests front | Aucun test Vitest pour `apps/web` (issues) | Absent |
