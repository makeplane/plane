# Spec Technique — api/views

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | api/views           |
| Version       | 0.1.0               |
| Date          | 2026-06-30          |
| Source        | Rétro-ingénierie    |

---

## Architecture du module

Le module est organisé en deux ViewSets distincts selon le niveau (workspace vs projet), plus un ViewSet de favoris, tous héritant de `BaseViewSet` (DRF ModelViewSet).

```
plane/app/views/view/base.py
├── WorkspaceViewViewSet        — CRUD des vues workspace (project__isnull=True)
├── WorkspaceViewIssuesViewSet  — Lecture des issues agrégées par workspace
├── IssueViewViewSet            — CRUD des vues projet
└── IssueViewFavoriteViewSet    — Gestion des favoris (vues projet uniquement)
```

Le routage est défini dans `plane/app/urls/views.py` et branché sur le routeur principal Django.

Le modèle `IssueView` (table `issue_views`) hérite de `WorkspaceBaseModel` qui fournit `workspace` (FK) et `project` (FK nullable). La dualité workspace/projet repose sur la nullité de `project` :

- `project IS NULL` → vue workspace (GlobalView dans l'ancien code)
- `project IS NOT NULL` → vue projet

---

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `apps/api/plane/db/models/view.py` | Modèle IssueView + valeurs par défaut + logique save() | ~100 |
| `apps/api/plane/app/views/view/base.py` | 4 ViewSets (workspace, workspace-issues, project, favorites) | ~440 |
| `apps/api/plane/app/urls/views.py` | Routage des 6 endpoints | ~67 |
| `apps/api/plane/app/serializers/view.py` | IssueViewSerializer + ViewIssueListSerializer | ~87 |
| `apps/api/plane/utils/issue_filters.py` | Conversion filters → query ORM (25 fonctions de filtre) | ~464 |
| `apps/api/plane/utils/filters/converters.py` | LegacyToRichFiltersConverter (migration format filters) | — |
| `apps/api/plane/utils/filters/filterset.py` | IssueFilterSet (filterset Django Filter) | — |
| `apps/api/plane/utils/filters/filter_backend.py` | ComplexFilterBackend | — |

---

## Schéma BDD

### Table `issue_views`

| Colonne | Type | Contraintes | Notes |
|---------|------|-------------|-------|
| `id` | UUID | PK, default uuid4 | Hérité de BaseModel |
| `created_at` | DateTimeField | auto_now_add | Hérité de BaseModel |
| `updated_at` | DateTimeField | auto_now | Hérité de BaseModel |
| `created_by` | FK User | null | Hérité de BaseModel |
| `updated_by` | FK User | null | Hérité de BaseModel |
| `workspace` | FK Workspace | CASCADE | Hérité de WorkspaceBaseModel |
| `project` | FK Project | CASCADE, null | null = vue workspace |
| `name` | CharField(255) | — | Nom de la vue |
| `description` | TextField | blank | Description libre |
| `query` | JSONField | — | Query ORM calculée depuis `filters` (lecture seule API) |
| `filters` | JSONField | default=dict | Critères de filtrage en format dict |
| `display_filters` | JSONField | default=get_default_display_filters | group_by, order_by, layout, etc. |
| `display_properties` | JSONField | default=get_default_display_properties | Colonnes visibles |
| `rich_filters` | JSONField | default=dict | Format étendu (migration 0107) |
| `access` | PositiveSmallIntegerField | default=1 | 0=Private, 1=Public |
| `sort_order` | FloatField | default=65535 | Ordre d'affichage |
| `logo_props` | JSONField | default=dict | Propriétés visuelles (icône/couleur) |
| `owned_by` | FK User | CASCADE | Propriétaire de la vue |
| `is_locked` | BooleanField | default=False | Verrouillage modification |
| `archived_at` | DateTimeField | null | Archivage (non exposé dans les vues actuelles) |

**Ordre par défaut** : `-created_at`

### Relations

- `issue_views` → `workspaces` (FK CASCADE)
- `issue_views` → `projects` (FK CASCADE, nullable)
- `issue_views` → `users` via `owned_by` (FK CASCADE)
- `user_favorites` → `issue_views` via `entity_identifier` (UUID, relation logique non déclarée en FK)
- `user_recent_visits` → `issue_views` via `entity_identifier` / `entity_name="view"` (relation logique)

---

## Valeurs par défaut des filtres

```python
# filters (critères de filtrage)
{
    "priority": None, "state": None, "state_group": None,
    "assignees": None, "created_by": None, "labels": None,
    "start_date": None, "target_date": None, "subscriber": None
}

# display_filters (configuration affichage)
{
    "group_by": None, "order_by": "-created_at", "type": None,
    "sub_issue": True, "show_empty_groups": True,
    "layout": "list", "calendar_date_range": ""
}

# display_properties (colonnes visibles, toutes à True par défaut)
{
    "assignee": True, "attachment_count": True, "created_on": True,
    "due_date": True, "estimate": True, "key": True, "labels": True,
    "link": True, "priority": True, "start_date": True, "state": True,
    "sub_issue_count": True, "updated_on": True
}
```

---

## API / Endpoints

| Méthode | Route | ViewSet / Action | Auth | Rôles requis |
|---------|-------|-----------------|------|--------------|
| GET | `/workspaces/<slug>/views/` | WorkspaceViewViewSet.list | Oui | ADMIN, MEMBER, GUEST (workspace) |
| POST | `/workspaces/<slug>/views/` | WorkspaceViewViewSet.create | Oui | (non décoré explicitement — hérité BaseViewSet) |
| GET | `/workspaces/<slug>/views/<pk>/` | WorkspaceViewViewSet.retrieve | Oui | (filtre queryset implicite) |
| PUT/PATCH | `/workspaces/<slug>/views/<pk>/` | WorkspaceViewViewSet.partial_update | Oui | Propriétaire uniquement |
| DELETE | `/workspaces/<slug>/views/<pk>/` | WorkspaceViewViewSet.destroy | Oui | ADMIN workspace ou propriétaire |
| GET | `/workspaces/<slug>/issues/` | WorkspaceViewIssuesViewSet.list | Oui | ADMIN, MEMBER, GUEST (workspace) |
| GET | `/workspaces/<slug>/projects/<project_id>/views/` | IssueViewViewSet.list | Oui | ADMIN, MEMBER, GUEST (projet) |
| POST | `/workspaces/<slug>/projects/<project_id>/views/` | IssueViewViewSet.create | Oui | ADMIN, MEMBER, GUEST (projet) |
| GET | `/workspaces/<slug>/projects/<project_id>/views/<pk>/` | IssueViewViewSet.retrieve | Oui | ADMIN, MEMBER, GUEST (projet) |
| PUT/PATCH | `/workspaces/<slug>/projects/<project_id>/views/<pk>/` | IssueViewViewSet.partial_update | Oui | Propriétaire uniquement |
| DELETE | `/workspaces/<slug>/projects/<project_id>/views/<pk>/` | IssueViewViewSet.destroy | Oui | ADMIN projet ou propriétaire |
| POST | `/workspaces/<slug>/projects/<project_id>/user-favorite-views/` | IssueViewFavoriteViewSet.create | Oui | ADMIN, MEMBER |
| DELETE | `/workspaces/<slug>/projects/<project_id>/user-favorite-views/<view_id>/` | IssueViewFavoriteViewSet.destroy | Oui | ADMIN, MEMBER |

**Note** : le endpoint `GET /workspaces/<slug>/issues/` ne porte PAS d'identifiant de vue dans l'URL — les filtres sont passés en query params. Il s'agit d'un endpoint de lecture des issues agrégées au niveau workspace, pas d'un endpoint de vue nommée.

---

## Patterns identifiés

- **Dualité workspace/projet via project nullable** : un seul modèle `IssueView` gère les deux niveaux de vue. Le discriminant est `project IS NULL`. Cela évite une hiérarchie de modèles mais implique des filtrages explicites dans chaque ViewSet (`filter(project__isnull=True)` côté workspace).

- **Query calculée à la persistance** : le champ `query` est toujours recalculé à partir de `filters` lors du `save()` du modèle ET dans les méthodes `create`/`update` du sérialiseur. Double garantie : le champ `query` est cohérent même si le modèle est sauvegardé hors de l'API.

- **select_for_update sur partial_update** : les deux ViewSets utilisent `select_for_update()` dans une transaction atomique pour éviter les mises à jour concurrentes d'une même vue.

- **Annotations Subquery pour les favoris** : `IssueViewViewSet` injecte `is_favorite` via une `Subquery` (et non un JOIN), ce qui évite les doublons de résultats et permet un tri `ORDER BY -is_favorite`.

- **Filtrage en deux passes sur les issues workspace** : `WorkspaceViewIssuesViewSet` applique successivement (1) `ComplexFilterBackend`/`IssueFilterSet` et (2) les filtres legacy via `issue_filters()`. Les deux systèmes coexistent — la migration vers `rich_filters` est en cours (migration 0107).

- **Champ `rich_filters`** : ajouté via la migration 0107 (`migrate_filters_to_rich_filters`). La logique de conversion (classe `LegacyToRichFiltersConverter`) traduit les anciens filtres en un nouveau format. Ce champ est présent dans le modèle mais pas encore exposé distinctement dans les vues de l'API à ce stade.

- **Suppression hard des favoris et visites récentes** : `UserFavorite.delete(soft=False)` et `UserRecentVisit.delete(soft=False)` — utilisation du paramètre `soft=False` indiquant que le manager par défaut implémente le soft delete, mais que ces suppressions secondaires sont des suppressions physiques.

- **Historique d'évolution du modèle** : les migrations montrent une évolution significative — un ancien modèle `GlobalView` (migration 0081) et `IssueViewFavorite` ont été supprimés et remplacés par `IssueView` (avec `project=NULL` pour les vues workspace) et `UserFavorite` (modèle unifié des favoris). Cette consolidation a eu lieu autour d'octobre 2024.

---

## Filtres applicables aux issues (issue_filters.py)

25 critères de filtre sont supportés, organisés en catégories :

| Catégorie | Critères |
|-----------|----------|
| Statut | `state`, `state_group`, `type` (backlog/active/all) |
| Personnes | `assignees`, `created_by`, `mentions`, `subscriber`, `logged_by` |
| Dates | `start_date`, `target_date`, `created_at`, `updated_at`, `completed_at` |
| Taxonomie | `labels`, `priority`, `estimate_point` |
| Structure | `parent`, `sub_issue`, `start_target_date` |
| Contexte | `project`, `cycle`, `module` |
| Intake | `intake_status`, `inbox_status` |
| Texte | `name` (icontains) |

Les dates supportent un format relatif de type `2_weeks;after;fromnow` via la fonction `string_date_filter`.

---

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| (aucun trouvé) | Pas de test dédié à `IssueView` / `views` | Absent |

Les seuls tests trouvés relatifs aux vues sont dans `plane/tests/unit/views/test_base_dispatch.py` qui couvre le dispatching générique de `BaseViewSet`, pas les vues filtrées en particulier.

---

## Décisions techniques documentées ici (non promues en ADR)

- **Champ `query` en lecture seule API** : bien que calculé par `issue_filters()`, ce champ est exposé en réponse mais non modifiable depuis l'API (`read_only_fields` dans le sérialiseur). Le client ne peut influencer la query qu'en modifiant `filters`. Choix de style API → `spec-technique.md`.

- **`access` non modifiable post-création** : le champ `access` (Public/Private) est listé en `read_only_fields`. La visibilité d'une vue est donc figée à la création. Limitation potentielle — à valider avec les devs.

- **Tri workspace via `order_by` query param + allowlist** : l'ordre des vues workspace est dynamique et sécurisé via `VIEW_ORDER_BY_ALLOWLIST`. Heuristique d'implémentation → `spec-technique.md`.

- **Absence de `@allow_permission` sur `WorkspaceViewViewSet.retrieve`** : la méthode `retrieve` des vues workspace ne porte pas le décorateur de permission explicite. La protection repose sur le filtre du queryset. Comportement à valider — potentielle zone grise (un utilisateur non membre pourrait tenter un accès direct par UUID).
