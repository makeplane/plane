# Spec Technique — Cycles

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | api/cycles          |
| Version       | 0.1.0               |
| Date          | 2026-06-30          |
| Source        | Rétro-ingénierie    |

---

## Architecture du module

Le module cycles suit le pattern **ViewSet DRF + BaseAPIView** du projet Plane. La logique est répartie en 4 couches :

1. **Modèles** (`plane/db/models/cycle.py`) — définition du schéma et logique de tri à la création.
2. **Sérialiseurs** (`plane/app/serializers/cycle.py`) — validation des données entrantes (`CycleWriteSerializer`) et sérialisation de lecture (`CycleSerializer`, `CycleIssueSerializer`, `CycleUserPropertiesSerializer`).
3. **Vues** (`plane/app/views/cycle/`) — logique métier des endpoints REST, permissions via décorateur `@allow_permission`.
4. **Utilitaires** — `transfer_cycle_issues` (logique de transfert externalisée), `burndown_plot` (calcul du burndown chart), `convert_to_utc` / `user_timezone_converter` (gestion des fuseaux).

Tous les endpoints du module sont protégés par `IsAuthenticated` (défaut DRF) + vérification d'appartenance projet via `project__project_projectmember__member`.

---

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `apps/api/plane/db/models/cycle.py` | Modèles Cycle, CycleIssue, CycleUserProperties | ~158 |
| `apps/api/plane/app/views/cycle/base.py` | CRUD cycle, favoris, date-check, transfert, user properties, progress, analytics | ~1050 |
| `apps/api/plane/app/views/cycle/issue.py` | CRUD issues dans un cycle, pagination groupée | ~335 |
| `apps/api/plane/app/views/cycle/archive.py` | Archivage / désarchivage, liste archivée | ~612 |
| `apps/api/plane/app/views/workspace/cycle.py` | Vue agrégée workspace-level | ~105 |
| `apps/api/plane/app/serializers/cycle.py` | Sérialiseurs Cycle, CycleIssue, CycleUserProperties, CycleWriteSerializer | ~107 |
| `apps/api/plane/app/urls/cycle.py` | Routage URL des endpoints cycles | ~107 |
| `apps/api/plane/utils/cycle_transfer_issues.py` | Logique de transfert issues cycle-à-cycle + snapshot | ~479 |
| `apps/api/plane/utils/analytics_plot.py` | Calcul burndown chart (partagé avec modules) | NC |
| `apps/api/plane/utils/timezone_converter.py` | Conversion UTC ↔ fuseau projet | NC |

---

## Schéma BDD

### Table `cycles`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identifiant unique (via `BaseModel`) |
| `name` | varchar(255) | NOT NULL | Nom du cycle |
| `description` | text | blank=True | Description |
| `start_date` | timestamptz | nullable | Date de début (stockée UTC) |
| `end_date` | timestamptz | nullable | Date de fin (stockée UTC) |
| `owned_by_id` | UUID | FK → User (CASCADE) | Créateur du cycle |
| `view_props` | jsonb | default `{}` | Props d'affichage (client-side) |
| `sort_order` | float | default 65535 | Ordre dans la liste |
| `external_source` | varchar(255) | nullable | Source d'import externe |
| `external_id` | varchar(255) | nullable | ID dans le système source |
| `progress_snapshot` | jsonb | default `{}` | Snapshot de progression post-transfert |
| `archived_at` | timestamptz | nullable | Date d'archivage (null = actif) |
| `logo_props` | jsonb | default `{}` | Propriétés du logo/avatar du cycle |
| `timezone` | varchar(255) | choices pytz | Fuseau horaire (default UTC) |
| `version` | integer | default 1 | Version interne (usage non documenté) |
| `project_id` | UUID | FK → Project | Projet parent |
| `workspace_id` | UUID | FK → Workspace | Workspace (dénormalisé via ProjectBaseModel) |
| `created_by_id` | UUID | FK → User | |
| `updated_by_id` | UUID | FK → User | |
| `created_at` | timestamptz | auto | |
| `updated_at` | timestamptz | auto | |
| `deleted_at` | timestamptz | nullable | Soft delete (hérité BaseModel, non utilisé en pratique) |

Ordering par défaut : `-created_at`.

### Table `cycle_issues`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | |
| `issue_id` | UUID | FK → Issue (CASCADE) | Issue associée |
| `cycle_id` | UUID | FK → Cycle (CASCADE) | Cycle parent |
| `project_id` | UUID | FK → Project | |
| `workspace_id` | UUID | FK → Workspace | |
| `created_by_id` | UUID | FK → User | |
| `updated_by_id` | UUID | FK → User | |
| `created_at` | timestamptz | auto | |
| `updated_at` | timestamptz | auto | |
| `deleted_at` | timestamptz | nullable | Soft delete |

Contraintes :
- `unique_together = ["issue", "cycle", "deleted_at"]`
- `UniqueConstraint(fields=["cycle", "issue"], condition=Q(deleted_at__isnull=True), name="cycle_issue_when_deleted_at_null")` — une issue ne peut être dans un seul cycle actif à la fois.

### Table `cycle_user_properties`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK | |
| `cycle_id` | UUID | FK → Cycle (CASCADE) | Cycle concerné |
| `user_id` | UUID | FK → User (CASCADE) | Utilisateur |
| `filters` | jsonb | default `get_default_filters` | Filtres actifs (priority, state, assignees, labels...) |
| `display_filters` | jsonb | default `get_default_display_filters` | Groupement, tri, layout, sub_issue... |
| `display_properties` | jsonb | default `get_default_display_properties` | Colonnes visibles |
| `rich_filters` | jsonb | default `{}` | Filtres avancés (format non documenté) |
| `project_id`, `workspace_id`, `created_by_id`, `updated_by_id`, `created_at`, `updated_at`, `deleted_at` | (hérité) | | |

Contrainte d'unicité : `(cycle, user)` quand `deleted_at IS NULL`.

---

## Valeurs par défaut JSON (fonctions dans `models/cycle.py`)

```python
# get_default_filters() — champs filtrables, tous null par défaut
# get_default_display_filters() — group_by: None, order_by: "-created_at", layout: "list", sub_issue: True
# get_default_display_properties() — 13 propriétés booléennes, toutes True par défaut
```

---

## API / Endpoints

### Endpoints projet-scoped

| Méthode | Route | Vue | Description | Auth |
|---------|-------|-----|-------------|------|
| GET | `/workspaces/{slug}/projects/{project_id}/cycles/` | `CycleViewSet.list` | Liste des cycles actifs (non archivés). `?cycle_view=current` filtre les cycles en cours | ADMIN, MEMBER, GUEST |
| POST | `/workspaces/{slug}/projects/{project_id}/cycles/` | `CycleViewSet.create` | Créer un cycle | ADMIN, MEMBER |
| GET | `/workspaces/{slug}/projects/{project_id}/cycles/{pk}/` | `CycleViewSet.retrieve` | Détail d'un cycle avec `sub_issues` | ADMIN, MEMBER, GUEST |
| PATCH | `/workspaces/{slug}/projects/{project_id}/cycles/{pk}/` | `CycleViewSet.partial_update` | Modifier un cycle (refusé si terminé, sauf sort_order) | ADMIN, MEMBER |
| DELETE | `/workspaces/{slug}/projects/{project_id}/cycles/{pk}/` | `CycleViewSet.destroy` | Supprimer un cycle (hard delete, ADMIN créateur) | ADMIN (créateur) |
| GET | `/workspaces/{slug}/projects/{project_id}/cycles/{cycle_id}/cycle-issues/` | `CycleIssueViewSet.list` | Issues d'un cycle (paginées, groupables, filtrables) | ADMIN, MEMBER |
| POST | `/workspaces/{slug}/projects/{project_id}/cycles/{cycle_id}/cycle-issues/` | `CycleIssueViewSet.create` | Ajouter des issues à un cycle (bulk, `{"issues": [...]}`) | ADMIN, MEMBER |
| DELETE | `/workspaces/{slug}/projects/{project_id}/cycles/{cycle_id}/cycle-issues/{issue_id}/` | `CycleIssueViewSet.destroy` | Retirer une issue d'un cycle | ADMIN, MEMBER |
| POST | `/workspaces/{slug}/projects/{project_id}/cycles/date-check/` | `CycleDateCheckEndpoint.post` | Vérifier la disponibilité de dates (non-chevauchement) | ADMIN, MEMBER |
| GET/POST | `/workspaces/{slug}/projects/{project_id}/user-favorite-cycles/` | `CycleFavoriteViewSet` | Lister / ajouter aux favoris | ADMIN, MEMBER |
| DELETE | `/workspaces/{slug}/projects/{project_id}/user-favorite-cycles/{cycle_id}/` | `CycleFavoriteViewSet.destroy` | Retirer des favoris | ADMIN, MEMBER |
| POST | `/workspaces/{slug}/projects/{project_id}/cycles/{cycle_id}/transfer-issues/` | `TransferCycleIssueEndpoint.post` | Transférer les issues incomplètes vers un autre cycle | ADMIN, MEMBER |
| GET/PATCH | `/workspaces/{slug}/projects/{project_id}/cycles/{cycle_id}/user-properties/` | `CycleUserPropertiesEndpoint` | Lire / mettre à jour les préférences utilisateur | ADMIN, MEMBER, GUEST |
| POST | `/workspaces/{slug}/projects/{project_id}/cycles/{cycle_id}/archive/` | `CycleArchiveUnarchiveEndpoint.post` | Archiver un cycle terminé | ADMIN, MEMBER |
| DELETE | `/workspaces/{slug}/projects/{project_id}/cycles/{cycle_id}/archive/` | `CycleArchiveUnarchiveEndpoint.delete` | Désarchiver un cycle | ADMIN, MEMBER |
| GET | `/workspaces/{slug}/projects/{project_id}/archived-cycles/` | `CycleArchiveUnarchiveEndpoint.get` | Liste des cycles archivés | ADMIN, MEMBER |
| GET | `/workspaces/{slug}/projects/{project_id}/archived-cycles/{pk}/` | `CycleArchiveUnarchiveEndpoint.get` | Détail d'un cycle archivé (avec distribution et burndown) | ADMIN, MEMBER |
| GET | `/workspaces/{slug}/projects/{project_id}/cycles/{cycle_id}/progress/` | `CycleProgressEndpoint.get` | Progression du cycle (compteurs + points) | ADMIN, MEMBER, GUEST |
| GET | `/workspaces/{slug}/projects/{project_id}/cycles/{cycle_id}/analytics/` | `CycleAnalyticsEndpoint.get` | Analytics (distribution + burndown). `?type=issues` (défaut) ou `?type=points` | ADMIN, MEMBER, GUEST |

### Endpoint workspace-scoped

| Méthode | Route | Vue | Description | Auth |
|---------|-------|-----|-------------|------|
| GET | `/workspaces/{slug}/cycles/` | `WorkspaceCyclesEndpoint.get` | Tous les cycles actifs du workspace (non archivés) | WorkspaceViewerPermission |

---

## Patterns identifiés

- **Compute-on-read pour le statut.** Le statut (`CURRENT`, `UPCOMING`, `COMPLETED`, `DRAFT`) n'est pas stocké en BDD ; il est calculé via un `Case/When` Django ORM à chaque requête, en prenant en compte le fuseau horaire du projet.
- **Progress snapshot pour la reproductibilité historique.** Lors d'un transfert d'issues, un snapshot JSON est écrit sur le cycle source. Les endpoints d'analytics et de progression lisent ce snapshot en priorité si présent, garantissant que l'état final du cycle source est consultable après le transfert.
- **Unicité soft-delete-aware.** La contrainte d'unicité `(cycle, issue)` sur `cycle_issues` est conditionnelle : `deleted_at IS NULL`. Même pattern sur `cycle_user_properties`. Cela permet le soft delete sans lever de contrainte.
- **Bulk create/update des issues.** `CycleIssue.objects.bulk_create` (batch_size=10) et `bulk_update` (batch_size=100) sont utilisés pour les opérations en masse.
- **Injection des annotations via `.values()`.** Les vues retournent directement des `QuerySet.values()` annotés plutôt que des sérialiseurs complets, pour optimiser les performances sur les champs calculés (total_issues, status, assignee_ids...).
- **Activité asynchrone Celery.** Toutes les mutations (créer, modifier, supprimer un cycle, ajouter/retirer une issue) déclenchent des tâches Celery (`issue_activity.delay`, `model_activity.delay`) pour la traçabilité et les webhooks.
- **Visite récente trackée.** La consultation du détail d'un cycle déclenche `recent_visited_task.delay` pour alimenter l'historique de navigation de l'utilisateur.
- **Pagination groupée.** `CycleIssueViewSet.list` supporte la pagination par `group_by` et `sub_group_by` via `GroupedOffsetPaginator` / `SubGroupedOffsetPaginator`.
- **Gzip.** La liste des issues d'un cycle est compressée gzip côté serveur (`@method_decorator(gzip_page)`).

---

## Décisions techniques documentées ici (rejetées comme ADR)

### Statut compute-on-read (pas de colonne `status`)

Le statut du cycle n'est jamais persisté. Il est recalculé à chaque requête via `Case/When` Django ORM en comparant `start_date`/`end_date` à l'heure courante dans le fuseau du projet. Avantage : pas de migration ni de tâche de mise à jour nécessaire. Inconvénient : la valeur du statut varie selon l'heure de la requête — impossible de requêter "tous les cycles qui ont été CURRENT hier".

### Non-chevauchement des cycles

La contrainte de non-chevauchement est vérifiée à la demande via un endpoint dédié `/date-check/`, pas via une contrainte BDD. Aucun `unique_together` ni trigger SQL ne garantit l'invariant côté base. La race condition est théoriquement possible entre la vérification et la création.

### Hard delete des cycles

Les cycles sont supprimés physiquement (`cycle.delete()`). Un TODO dans le code signale la tension avec les `CycleIssue` liés. Si un cycle est supprimé, les `CycleIssue` sont supprimés en cascade (FK CASCADE). Contrairement aux issues (soft delete), il n'y a pas d'archivage automatique avant suppression.

### Sort order décroissant par soustraction de 10 000

À chaque création, le cycle reçoit `sort_order = min_actuel - 10000`. Ce mécanisme positionne les nouveaux cycles en tête sans ré-ordonner les existants. Il n'y a pas de normalisation périodique — la valeur de `sort_order` peut devenir négative au fil du temps.

---

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| (aucun fichier de test spécifique aux cycles identifié) | — | Absent |

> Un scan dans `apps/api/` n'a pas permis d'identifier de fichiers pytest dédiés à la feature cycles. La couverture de test de ce module est à évaluer.
