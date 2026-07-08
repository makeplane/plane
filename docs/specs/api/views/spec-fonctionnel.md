# Spec Fonctionnelle — views [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | api/views           |
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

Aucun ADR RETRO n'a été créé pour cette feature (tous les candidats ont été rejetés par la politique ADR v2.3.0 — voir le rapport de rejet en bas de ce document).

---

## Contexte et objectif

Le module `api/views` implémente un système de **vues filtrées sauvegardées** sur les issues. Une vue (IssueView) est un ensemble de critères de filtrage, de tri, de regroupement et de propriétés d'affichage, enregistré de façon persistante pour pouvoir être réutilisé.

Les vues existent à deux niveaux :
- **Vue workspace** : transversale à plusieurs projets, sans appartenance à un projet spécifique (`project__isnull=True`).
- **Vue projet** : rattachée à un projet précis.

Ce module répond au besoin de conserver et partager des configurations de recherche/filtrage sur les issues sans avoir à les reconfigurer à chaque visite.

---

## Règles métier (déduites du code)

1. **Une vue appartient à un propriétaire** (`owned_by`) : seul le propriétaire peut modifier ou supprimer sa vue. Un admin workspace (role=20) peut aussi supprimer les vues workspace.

2. **Contrôle d'accès en lecture par niveau de visibilité** : une vue est visible par son propriétaire OU par tous les membres du workspace/projet si `access = 1` (Public). Une vue avec `access = 0` (Private) n'est visible que de son propriétaire.

3. **Restriction GUEST** : un utilisateur avec le rôle GUEST (role=5) au niveau workspace ne voit que ses propres vues (`queryset.filter(owned_by=request.user)`). Au niveau projet, la restriction s'applique si `project.guest_view_all_features = False`.

4. **Verrouillage de vue** : une vue avec `is_locked = True` ne peut pas être modifiée (`partial_update` retourne HTTP 400 avec le message "view is locked").

5. **Seul le propriétaire peut modifier une vue** : même si l'utilisateur a des droits élevés, la modification est refusée avec HTTP 400 s'il n'est pas le propriétaire. Cette règle est distincte du contrôle d'accès en lecture.

6. **Suppression en cascade des favoris** : la suppression d'une vue (projet ou workspace) provoque la suppression des entrées `UserFavorite` associées. La suppression d'une vue projet provoque aussi la suppression de l'entrée `UserRecentVisit`.

7. **Ordre automatique par sort_order** : à la création d'une vue, le `sort_order` est calculé automatiquement comme `max(sort_order_existant) + 10000`. La valeur initiale est 65535. Les vues projet sont triées par `is_favorite DESC, name ASC` ; les vues workspace sont triées selon un paramètre `order_by` de la requête GET (valeur par défaut : `-created_at`).

8. **Le champ `query` est calculé à partir de `filters`** : le modèle recalcule automatiquement `query` à partir de `filters` à chaque sauvegarde (via `issue_filters()`). Le champ `query` est en lecture seule pour l'API.

9. **Enrichissement par annotations** : lors de la récupération des vues projet, une annotation `is_favorite` (booléen) est injectée dans le queryset via une sous-requête sur `UserFavorite`.

10. **Traçabilité de visite** : l'accès à une vue (retrieve) déclenche de façon asynchrone l'enregistrement dans `UserRecentVisit` via la tâche Celery `recent_visited_task`.

11. **Filtres applicables aux issues d'une vue workspace** : l'endpoint `GET /workspaces/<slug>/issues/` applique des filtres complexes (`ComplexFilterBackend` + `IssueFilterSet`) en tenant compte des permissions de projet pour les GUESTs (isolation : un GUEST ne voit les issues d'un projet que si `guest_view_all_features = True` ou s'il en est le créateur).

12. **Gestion des favoris par projet uniquement** : les favoris de vues (`IssueViewFavoriteViewSet`) ne s'appliquent qu'aux vues projet. Il n'existe pas d'endpoint de favori pour les vues workspace dans ce module (les favoris workspace passent par `UserFavorite` via un autre endpoint).

---

## Cas d'usage (déduits)

### CU-001 — Créer une vue workspace

Un membre ou admin du workspace crée une vue transversale en envoyant `POST /workspaces/<slug>/views/` avec un `name` et des `filters`. La vue est liée au workspace et non à un projet (`project__isnull=True`). Le `sort_order` est calculé automatiquement. Le champ `query` est dérivé de `filters`.

### CU-002 — Créer une vue projet

Un membre du projet (ADMIN, MEMBER ou GUEST autorisé) crée une vue sur `POST /workspaces/<slug>/projects/<project_id>/views/`. La vue est liée au projet. Les GUESTs avec `guest_view_all_features = False` ne voient ensuite que leurs propres vues.

### CU-003 — Lister les vues visibles

`GET /workspaces/<slug>/views/` retourne les vues workspace visibles par l'utilisateur courant (les siennes + les vues publiques). Un GUEST ne voit que les siennes. Un tri dynamique est possible via le paramètre `order_by`.

### CU-004 — Modifier une vue (propriétaire uniquement)

`PATCH /workspaces/<slug>/views/<pk>/` ou `PATCH /workspaces/<slug>/projects/<project_id>/views/<pk>/`. La vue est verrouillée en écriture (`select_for_update`) pour éviter les modifications concurrentes. Seul le propriétaire peut modifier. Une vue verrouillée (`is_locked = True`) est refusée.

### CU-005 — Supprimer une vue

`DELETE` sur une vue. Accessible au propriétaire ou à un admin workspace (role=20). La suppression cascade sur les favoris et les visites récentes associés.

### CU-006 — Récupérer les issues d'une vue workspace

`GET /workspaces/<slug>/issues/` liste les issues du workspace filtrées selon les paramètres de la requête (filtres complexes + filtres legacy + permissions de projet). La réponse est paginée et compressée (gzip). Les issues sont annotées avec `cycle_id`, `link_count`, `attachment_count`, `sub_issues_count`, `assignee_ids`, `label_ids`, `module_ids`.

### CU-007 — Ajouter une vue projet en favori

`POST /workspaces/<slug>/projects/<project_id>/user-favorite-views/` crée une entrée `UserFavorite` pour la vue et l'utilisateur courant. Accessible aux rôles ADMIN et MEMBER uniquement.

### CU-008 — Consulter une vue (traçabilité)

`GET /workspaces/<slug>/views/<pk>/` ou `GET /workspaces/<slug>/projects/<project_id>/views/<pk>/` retourne les données de la vue et déclenche de façon asynchrone l'enregistrement dans `UserRecentVisit`.

---

## Dépendances

- `plane.db.models.IssueView` — modèle central
- `plane.db.models.UserFavorite` — favoris (cascade à la suppression)
- `plane.db.models.UserRecentVisit` — historique de navigation (cascade à la suppression de vue projet)
- `plane.db.models.WorkspaceMember` — vérification du rôle GUEST workspace
- `plane.db.models.ProjectMember` — vérification du rôle GUEST projet + accès admin
- `plane.db.models.Project` — vérification de `guest_view_all_features`
- `plane.utils.issue_filters.issue_filters` — conversion des `filters` en `query` Django ORM
- `plane.utils.order_queryset` — tri des issues (allowlist sécurisée)
- `plane.utils.filters.ComplexFilterBackend` / `IssueFilterSet` — filtrage avancé des issues
- `plane.bgtasks.recent_visited_task` — traçabilité asynchrone des visites
- `plane.app.permissions.allow_permission` / `ROLE` — contrôle d'accès RBAC

---

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- **Signification exacte de `rich_filters`** : le modèle dispose d'un champ `rich_filters` (JSONField) migré depuis les `filters` classiques (migration 0107). La distinction fonctionnelle entre `filters`, `rich_filters` et `query` n'est pas documentée. La migration `LegacyToRichFiltersConverter` suggère un format plus expressif (conditions imbriquées ?), mais le détail n'est pas exposé dans les vues.
- **Accès en lecture sans `@allow_permission` explicite sur `retrieve` (workspace)** : la méthode `WorkspaceViewViewSet.retrieve` ne porte pas le décorateur `@allow_permission`. Elle s'appuie implicitement sur le filtre du queryset (`owned_by` ou `access=1`). Confirmer si c'est intentionnel ou un oubli.
- **Gestion du `access` depuis l'API** : le champ `access` est listé en `read_only_fields` dans le sérialiseur, mais le modèle l'expose avec deux valeurs (0=Private, 1=Public). Il n'est donc pas modifiable après création via l'API. Confirmer si ce choix est délibéré.
- **Portée des favoris workspace** : les favoris de vues workspace semblent gérés par un autre endpoint (non présent dans `views.py`). Confirmer l'architecture réelle.
