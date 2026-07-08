# Spec Fonctionnelle — analytics [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | api/analytics       |
| Version    | 0.1.0               |
| Date       | 2026-06-30          |
| Auteur     | retro-documenter    |
| Statut     | DRAFT               |
| Source     | Rétro-ingénierie    |

> **[DRAFT — à valider par le dev]** Cette spec a été générée par rétro-ingénierie
> à partir du code existant. Elle doit être relue et validée par un développeur
> qui connaît le contexte métier.

---

## ADRs

Aucun ADR RETRO n'a été créé pour ce module (voir rapport de rejets en bas de page).
Les décisions techniques observées sont documentées dans `spec-technique.md`.

ADR connexe à consulter :
- [RETRO-051 — Compute-on-read des statistiques (modules et cycles)](../../../adr/RETRO-051-compute-on-read-stats-modules-cycles.md) — le même pattern de calcul à la volée s'applique ici pour les statistiques d'avancement agrégées par workspace et par projet.

---

## Contexte et objectif

Le module analytics fournit aux membres d'un workspace des tableaux de bord et des graphiques permettant de visualiser l'avancement des issues. Il couvre deux niveaux : le workspace (vision transverse multi-projets) et le projet (vision focalisée sur un projet, un cycle ou un module). Un mécanisme d'export CSV asynchrone permet de récupérer les données par email.

---

## Règles métier (déduites du code)

1. **Accès ADMIN/MEMBER requis pour les analytics avancées** — les endpoints `AnalyticsEndpoint`, `ExportAnalyticsEndpoint`, `AdvanceAnalyticsEndpoint`, `AdvanceAnalyticsStatsEndpoint`, `AdvanceAnalyticsChartEndpoint` sont restreints aux rôles ADMIN et MEMBER au niveau workspace. GUEST en est exclu.

2. **Accès GUEST autorisé pour les analytics de base** — `DefaultAnalyticsEndpoint`, `ProjectStatsEndpoint` et `ProjectAdvanceAnalyticsChartEndpoint` acceptent également le rôle GUEST au niveau workspace ou projet.

3. **Les axes x et y sont obligatoires et validés** — `AnalyticsEndpoint` (analytics legacy) impose que `x_axis` appartienne à `VALID_ANALYTICS_FIELDS` et `y_axis` à `VALID_YAXIS`. Toute valeur invalide renvoie HTTP 400.

4. **Le segment ne peut pas être identique à l'axe x** — si un segment est fourni, il doit être distinct de l'axe x. Même contrainte dans l'export asynchrone.

5. **Les statistiques sont calculées à la volée (compute-on-read)** — aucune colonne pré-calculée n'existe en base. Toutes les agrégations (counts par groupe d'état, totaux) sont produites par des annotations Django ORM au moment de la requête. Voir RETRO-051 pour le pattern architectural.

6. **Les données analytics sont scoped au membership de l'utilisateur** — `get_analytics_filters` filtre systématiquement sur `project__project_projectmember__member = user` et `project__project_projectmember__is_active = True`, excluant les projets auxquels l'utilisateur n'appartient pas.

7. **Les projets archivés et supprimés sont exclus** — `get_analytics_filters` applique `project__deleted_at__isnull=True` et `project__archived_at__isnull=True`.

8. **L'export analytics est asynchrone et livré par email** — l'endpoint `ExportAnalyticsEndpoint` soumet une tâche Celery (`analytic_export_task`) et répond immédiatement avec un message indiquant que le CSV sera envoyé par email à l'adresse de l'utilisateur connecté.

9. **Les vues analytics sauvegardables ne sont accessibles qu'aux ADMIN du workspace** — `AnalyticViewViewset` utilise `WorkSpaceAdminPermission` (ADMIN uniquement), contrairement aux endpoints de consultation qui acceptent MEMBER.

10. **Les statistiques de complétion mensuelle partent de la date de création du workspace** — `AdvanceAnalyticsChartEndpoint.work_item_completion_chart` démarre la série temporelle à partir de `workspace.created_at.date().replace(day=1)` si aucune plage n'est précisée.

11. **Les statistiques par cycle/module démarrent à la date de début du cycle/module** — `ProjectAdvanceAnalyticsChartEndpoint.work_item_completion_chart` utilise `cycle.start_date` ou `module.start_date` comme borne inférieure et génère des données quotidiennes (vs mensuelles pour le niveau projet sans cycle/module).

12. **Les filtres de date sont normalisés** — le `date_filter` accepte les valeurs `yesterday`, `last_7_days`, `last_30_days`, `last_3_months` ou `custom` (avec `start_date`/`end_date`). Toute valeur non reconnue est ignorée (pas de filtrage temporel).

---

## Cas d'usage (déduits)

### CU-001 — Visualiser la distribution des issues au niveau workspace

Un ADMIN ou MEMBER sélectionne un axe x (ex. : état, priorité, assignee) et un axe y (comptage ou estimation) pour obtenir un graphique de distribution des issues du workspace. Un troisième paramètre de segmentation peut être ajouté. Les détails des entités référencées (états, labels, assignees, cycles, modules) sont retournés dans `extras` pour l'affichage.

### CU-002 — Accéder au tableau de bord analytics par défaut

Un ADMIN, MEMBER ou GUEST consulte un tableau de bord synthétique du workspace : total d'issues, répartition par groupe d'état, complétion mensuelle de l'année courante, top 5 créateurs, top 5 clôtureurs, issues en attente par assignee, sommes d'estimations ouvertes et totales.

### CU-003 — Exporter les analytics en CSV

Un ADMIN ou MEMBER demande l'export des données d'un graphique analytics. L'API enregistre une tâche Celery et répond immédiatement. Le worker génère le CSV (avec résolution des libellés : noms d'états, d'assignees, de labels, etc.) et l'envoie en pièce jointe par email à l'utilisateur.

### CU-004 — Sauvegarder une vue analytics

Un ADMIN du workspace sauvegarde une configuration analytics (requête + paramètres d'axe) sous un nom donné dans une `AnalyticView`. La vue peut ensuite être rechargée pour rejouer l'analyse.

### CU-005 — Consulter les analytics avancées du workspace

Un ADMIN ou MEMBER accède à deux onglets :
- **overview** : compteurs globaux (utilisateurs par rôle, projets, issues, cycles, intake) avec filtre de date et de projet(s).
- **work-items** : répartition des issues par groupe d'état (démarré, backlog, non démarré, complété).

### CU-006 — Consulter les graphiques avancés du workspace

Un ADMIN ou MEMBER visualise :
- **projects** : compteurs transverses (issues, cycles, modules, intake, membres, pages, vues) sur une période.
- **work-items** : série mensuelle de création vs complétion d'issues depuis la date de création du workspace.
- **custom-work-items** : graphique personnalisé avec axe x paramétrable et regroupement optionnel.

### CU-007 — Consulter les analytics avancées d'un projet

Un ADMIN ou MEMBER consulte les stats d'avancement d'un projet, avec filtrage optionnel par cycle ou module. Les stats sont déclinées par assignee (avec avatar et totaux par groupe d'état).

### CU-008 — Obtenir les statistiques par projet pour le workspace

Un ADMIN, MEMBER ou GUEST obtient une liste de projets avec leurs compteurs (issues totales, complétées, membres, cycles, modules). Les champs retournés sont paramétrables via le query param `fields`.

---

## Dépendances

- `api/issues` — source de données principale (modèle `Issue` avec `issue_objects` manager qui exclut les soft-deleted)
- `api/projects` — `Project`, `ProjectMember` (scoping par membership et filtrage projets archivés/supprimés)
- `api/cycles` — `Cycle`, `CycleIssue` (filtrage par cycle dans les analytics projet)
- `api/modules` — `Module`, `ModuleIssue` (filtrage par module dans les analytics projet)
- `api/auth` — permission RBAC via `@allow_permission` et `WorkSpaceAdminPermission`
- `api/workspaces` — `Workspace`, `WorkspaceMember` (stats overview du workspace)
- `api/pages` — `ProjectPage` (compté dans `project_chart`)
- `api/views` — `IssueView` (compté dans `project_chart`)
- Celery + SMTP — pour l'export asynchrone par email

---

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- **Deux couches d'analytics coexistent** : une legacy (`AnalyticsEndpoint` + `build_graph_plot` + `VALID_ANALYTICS_FIELDS`) et une nouvelle (`AdvanceAnalyticsEndpoint` + `build_analytics_chart` + `x_axis_mapper`). La raison du maintien de la couche legacy et son éventuelle dépréciation ne sont pas documentées dans le code.
- **Champ `query` vs `query_dict` sur `AnalyticView`** : `AnalyticView` stocke à la fois un champ `query` (JSONField, utilisé pour filtrer les issues) et un `query_dict` (JSONField avec `default=dict`, utilisé pour les paramètres x/y). La distinction entre les deux et leur mode de population n'est pas clarifiée par le code seul.
- **Le commentaire `# TODO: Add description for reference`** dans `AdvanceAnalyticsEndpoint.get_overview_data` (filtrage intake sur statuts `"-2"` à `"2"`) indique une logique non documentée par les auteurs eux-mêmes.
- **Granulaire quotidien pour cycles/modules vs mensuel pour projets** — le choix de la granularité temporelle différente selon le contexte (quotidien pour cycles/modules, mensuel pour projets) paraît intentionnel mais n'est pas expliqué.
