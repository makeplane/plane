# Spec Technique — analytics

| Champ         | Valeur              |
|---------------|---------------------|
| Module        | api/analytics       |
| Version       | 0.1.0               |
| Date          | 2026-06-30          |
| Source        | Rétro-ingénierie    |

---

## Architecture du module

Le module analytics est organisé en deux couches parallèles qui coexistent :

**Couche legacy** (`AnalyticsEndpoint`, `SavedAnalyticEndpoint`, `ExportAnalyticsEndpoint`) : utilise `build_graph_plot` avec des champs snake_case (`state_id`, `assignees__id`, etc.) correspondant directement aux champs ORM Django. Opère sur le périmètre workspace avec des filtres issues libres passés en query params.

**Couche avancée** (`AdvanceAnalytics*`, `ProjectAdvanceAnalytics*`, `DefaultAnalyticsEndpoint`, `ProjectStatsEndpoint`) : utilise `build_analytics_chart` avec des champs en SCREAMING_SNAKE_CASE (`STATES`, `ASSIGNEES`, etc.), un mapper intermédiaire, et des filtres de date normalisés via `get_analytics_filters`. Opère sur le périmètre workspace ou projet.

Les deux couches partagent le même modèle de données (`Issue.issue_objects`) et les mêmes règles de scoping (membership, projets actifs).

**Tâche asynchrone** (`analytic_plot_export.py`) : traitement CSV offline via Celery, envoi par email avec pièce jointe.

---

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `apps/api/plane/db/models/analytic.py` | Modèle `AnalyticView` (vues sauvegardables) | ~27 |
| `apps/api/plane/app/views/analytic/base.py` | Endpoints analytics legacy + stats projet + vues sauvegardées | ~456 |
| `apps/api/plane/app/views/analytic/advance.py` | Endpoints analytics avancées workspace | ~319 |
| `apps/api/plane/app/views/analytic/project_analytics.py` | Endpoints analytics avancées projet | ~368 |
| `apps/api/plane/bgtasks/analytic_plot_export.py` | Tâche Celery export CSV + email | ~436 |
| `apps/api/plane/utils/analytics_plot.py` | `build_graph_plot`, `burndown_plot`, `VALID_ANALYTICS_FIELDS`, `VALID_YAXIS` | ~266 |
| `apps/api/plane/utils/build_chart.py` | `build_analytics_chart`, `x_axis_mapper`, helpers de sérialisation | ~195 |
| `apps/api/plane/utils/date_utils.py` | `get_analytics_filters`, `get_analytics_date_range`, `get_chart_period_range` | ~192 |
| `apps/api/plane/app/urls/analytic.py` | Déclaration des 13 routes analytics | ~91 |

---

## Schéma BDD

### Table `analytic_views`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID PK | Hérité de `BaseModel` |
| `workspace_id` | UUID FK → `workspaces` | CASCADE |
| `name` | VARCHAR(255) | |
| `description` | TEXT | Nullable (blank=True) |
| `query` | JSONField | Filtres ORM Django serialisés (utilisé pour reconstruire le queryset) |
| `query_dict` | JSONField | Paramètres analytics (x_axis, y_axis) ; default `{}` |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| Ordering | | `-created_at` (plus récents en premier) |

Aucune autre table propre à ce module — les données analytics sont calculées à la volée sur les tables `issues`, `states`, `labels`, `users`, `cycles`, `modules`, etc.

---

## API / Endpoints

| Méthode | Route | Vue | Description | Auth niveau |
|---------|-------|-----|-------------|-------------|
| GET | `/workspaces/<slug>/analytics/` | `AnalyticsEndpoint` | Distribution issues avec axes x/y/segment (legacy) | ADMIN, MEMBER (workspace) |
| GET/POST/PATCH/DELETE | `/workspaces/<slug>/analytic-view/` | `AnalyticViewViewset` | CRUD des vues sauvegardées | ADMIN (workspace) uniquement |
| GET | `/workspaces/<slug>/analytic-view/<uuid>/` | `AnalyticViewViewset` | Détail/édition/suppression vue | ADMIN (workspace) |
| GET | `/workspaces/<slug>/saved-analytic-view/<uuid>/` | `SavedAnalyticEndpoint` | Rejouer une vue sauvegardée | ADMIN, MEMBER (workspace) |
| POST | `/workspaces/<slug>/export-analytics/` | `ExportAnalyticsEndpoint` | Déclencher export CSV asynchrone | ADMIN, MEMBER (workspace) |
| GET | `/workspaces/<slug>/default-analytics/` | `DefaultAnalyticsEndpoint` | Tableau de bord synthétique workspace | ADMIN, MEMBER, GUEST (workspace) |
| GET | `/workspaces/<slug>/project-stats/` | `ProjectStatsEndpoint` | Stats par projet (champs sélectionnables) | ADMIN, MEMBER, GUEST (workspace) |
| GET | `/workspaces/<slug>/advance-analytics/` | `AdvanceAnalyticsEndpoint` | Overview ou work-items stats (tab param) | ADMIN, MEMBER (workspace) |
| GET | `/workspaces/<slug>/advance-analytics-stats/` | `AdvanceAnalyticsStatsEndpoint` | Stats par projet avec breakdown état | ADMIN, MEMBER (workspace) |
| GET | `/workspaces/<slug>/advance-analytics-charts/` | `AdvanceAnalyticsChartEndpoint` | Graphiques avancés workspace (type param) | ADMIN, MEMBER (workspace) |
| GET | `/workspaces/<slug>/projects/<uuid>/advance-analytics/` | `ProjectAdvanceAnalyticsEndpoint` | Stats avancement projet/cycle/module | ADMIN, MEMBER (projet) |
| GET | `/workspaces/<slug>/projects/<uuid>/advance-analytics-stats/` | `ProjectAdvanceAnalyticsStatsEndpoint` | Stats par assignee avec breakdown état | ADMIN, MEMBER (projet) |
| GET | `/workspaces/<slug>/projects/<uuid>/advance-analytics-charts/` | `ProjectAdvanceAnalyticsChartEndpoint` | Graphiques projet/cycle/module | ADMIN, MEMBER, GUEST (projet) |

---

## Patterns identifiés

### Compute-on-read systématique

Toutes les statistiques (counts par groupe d'état, totaux, répartitions) sont calculées via des annotations Django ORM (`Count`, `Sum`, `F`, `Case/When`) au moment de la requête HTTP. Aucune colonne pré-agrégée n'existe. Même pattern que RETRO-051 (modules/cycles) étendu au niveau workspace.

### Double couche analytics (legacy vs avancée)

Deux sous-systèmes coexistent avec des conventions différentes :
- **Legacy** : champs ORM directs (`state_id`, `assignees__id`) dans `build_graph_plot`, whitelist `VALID_ANALYTICS_FIELDS`
- **Avancée** : champs métier en majuscules (`STATES`, `ASSIGNEES`) dans `build_analytics_chart`, mapper `x_axis_mapper`

La couche legacy supporte le segment (troisième dimension) ; la couche avancée supporte le `group_by`. Elles ne sont pas interchangeables.

### Scoping utilisateur systématique dans get_analytics_filters

`get_analytics_filters` injecte systématiquement `project__project_projectmember__member = user` dans le filtre de base, garantissant que les données retournées sont scoped au membership de l'utilisateur courant, indépendamment du niveau de permission vérifié par `@allow_permission`.

### Résolution d'avatar avec fallback

La logique de résolution d'URL d'avatar (asset S3 si disponible, sinon URL directe) est dupliquée dans `base.py`, `advance.py`, `project_analytics.py` et `analytic_plot_export.py` via le même pattern `Case/When/Concat` Django ORM. Pas de factorisation centralisée.

### Export CSV avec résolution des libellés

La tâche `analytic_export_task` résout les UUIDs (assignee, label, état, cycle, module) en libellés lisibles avant de sérialiser en CSV. Elle réutilise `build_graph_plot` (couche legacy) pour produire la distribution, puis injecte les libellés ligne par ligne.

### Granularité temporelle contextuelle

- Analytics **workspace sans filtre de date** : série mensuelle depuis la création du workspace jusqu'à aujourd'hui, avec mois à 0 remplis.
- Analytics **projet sans cycle/module** : même logique mensuelle depuis la création du projet.
- Analytics **cycle/module** : série **quotidienne** entre les dates de début et de fin du cycle/module.

### Burndown chart (analytics_plot.py)

La fonction `burndown_plot` calcule le nombre d'issues ou de points d'estimation restants jour par jour pour un cycle ou un module. Elle est présente dans `analytics_plot.py` mais n'est référencée par aucun endpoint analytics — elle est consommée par les views de cycles et de modules (cf. `api/cycles` et `api/modules`).

---

## Décisions techniques locales (non promues en ADR)

### Double couche analytics legacy / avancée

La coexistence de deux sous-systèmes est visible dans les URLs (endpoint `analytics` legacy et `advance-analytics*`). La raison de la migration incomplète n'est pas documentée dans le code. Le système legacy reste nécessaire pour `AnalyticViewViewset` (sauvegarde de vues) et l'export CSV.

### Champs `query` / `query_dict` sur AnalyticView

`AnalyticView` stocke deux JSONField distincts : `query` (filtres ORM Django serialisés, rechargés directement comme `**filter` dans un queryset) et `query_dict` (paramètres d'affichage x_axis/y_axis). La séparation est fonctionnelle mais fragile — un changement de champ ORM rendrait `query` invalide sans migration.

### Tâche Celery générique pour l'export

`analytic_export_task` (et `export_analytics_to_csv_email`, seconde tâche dans le même fichier) utilisent le mécanisme Celery standard du projet (`@shared_task`). Aucune file dédiée, pas de retry configuré. L'usage de Celery est une décision d'infrastructure transverse documentée dans `discovery.md` (décision #6) et dans la stack.

### Filtres de date normalisés côté serveur

Les valeurs `last_7_days`, `last_30_days`, `last_3_months` sont calculées dynamiquement au moment de la requête (pas de cache). Cela garantit la fraîcheur mais peut produire des résultats légèrement différents entre deux requêtes consécutives à minuit.

### Filtre `issue_intake__status__in=["-2", "-1", "0", "1", "2"]` non documenté

Dans `AdvanceAnalyticsEndpoint.get_overview_data`, le filtre des issues liées à l'intake utilise une liste de statuts numériques sous forme de chaînes avec un commentaire `# TODO: Add description for reference` — la sémantique de ces valeurs n'est pas documentée dans ce fichier.

---

## Tests existants

| Fichier | Ce qu'il teste | Statut |
|---------|---------------|--------|
| Aucun trouvé | — | Absent |

Aucun fichier de test pytest lié au module analytics n'a été trouvé dans `apps/api/`. Les endpoints analytics ne sont pas couverts par la suite de tests existante.
