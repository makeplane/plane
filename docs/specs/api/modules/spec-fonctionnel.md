# Spec Fonctionnelle — Modules [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | api/modules         |
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

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-032](../../../adr/RETRO-032-soft-delete-uuid-conditional-uniqueness.md) | Soft delete UUID-based avec UniqueConstraint conditionnel | Documenté (rétro) |
| [RETRO-051](../../../adr/RETRO-051-compute-on-read-stats-modules-cycles.md) | Compute-on-read des statistiques d'avancement (modules et cycles) | Documenté (rétro) |

> *Table auto-générée par adr-linker. Ne pas éditer manuellement.*

---

## Contexte et objectif

Un module est un regroupement **thématique** d'issues dans un projet Plane. Là où un cycle est limité dans le temps (sprint), un module est organisé par **sujet fonctionnel** (équivalent d'une "epic" ou d'une "milestone"). Un même projet peut avoir plusieurs modules actifs simultanément. Un module peut regrouper des issues qui appartiennent à plusieurs cycles différents.

Les modules permettent aux équipes de suivre la progression d'un thème transversal indépendamment des itérations temporelles.

## Règles métier (déduites du code)

1. **Nommage unique par projet** : un module ne peut pas avoir le même nom qu'un autre module actif dans le même projet. La contrainte est levée pour les modules soft-deletés (`condition=Q(deleted_at__isnull=True)`).

2. **Statuts d'avancement** : un module peut être dans l'un des 6 états : `backlog`, `planned` (défaut à la création), `in-progress`, `paused`, `completed`, `cancelled`. L'état est géré manuellement — il n'est pas calculé automatiquement depuis l'avancement des issues.

3. **Archivage conditionnel** : seuls les modules dont le statut est `completed` ou `cancelled` peuvent être archivés. Tenter d'archiver un module dans un autre état retourne une erreur 400.

4. **Modification des modules archivés interdite** : un module archivé ne peut pas être mis à jour (`partial_update`). La vue retourne une erreur 400 si `archived_at` est renseigné.

5. **Suppression réservée au créateur ou à l'admin** : le `destroy` utilise `creator=True` combiné à `ROLE.ADMIN`, ce qui signifie que seul l'ADMIN ou le créateur du module peut le supprimer.

6. **Compteurs d'avancement calculés à la lecture** : le total d'issues, les issues complétées, en cours, annulées, en backlog, non démarrées, ainsi que les points d'estimation équivalents, sont recalculés en temps réel via des sous-requêtes SQL à chaque appel de liste ou de détail. Aucun compteur n'est stocké en base.

7. **Les favoris sont nettoyés lors de l'archivage** : archiver un module supprime automatiquement les entrées `UserFavorite` pour ce module. Désarchiver ne les restaure pas.

8. **Les favoris et visites récentes sont nettoyés lors de la suppression** : supprimer un module supprime les favoris (`UserFavorite`) et les visites récentes (`UserRecentVisit`) associés.

9. **Activité tracée** : toute création, modification, et suppression d'un module génère une entrée d'activité via la tâche Celery `model_activity` (webhooks) et `issue_activity` pour les issues concernées.

10. **Tri par favori puis par date** : la liste des modules actifs est ordonnée `(-is_favorite, -created_at)` — les modules favoris de l'utilisateur apparaissent en premier.

11. **Tri visuel par sort_order** : chaque module a un `sort_order` flottant. À la création, le nouveau module reçoit la valeur `min(sort_order) - 10000` dans le projet, ce qui le place en tête de liste triée par sort_order.

12. **Une issue peut appartenir à plusieurs modules simultanément** : la relation est many-to-many via `ModuleIssue`. Il n'existe pas de contrainte d'exclusivité (différent des cycles où une issue ne peut appartenir qu'à un seul cycle actif).

13. **Préférences d'affichage par utilisateur** : chaque utilisateur stocke ses filtres et propriétés d'affichage pour chaque module dans `ModuleUserProperties`. La ressource est créée à la demande (get_or_create) lors du premier accès.

14. **Burndown chart conditionnel** : le burndown chart de détail (courbe d'avancement) n'est calculé et retourné que si le module a `start_date`, `target_date` et au moins une issue (`total_issues > 0`).

15. **Distributions par assignee et label** : la vue de détail retourne deux distributions (par assignee et par label) comptant les issues totales, complétées et en attente — et si le projet utilise les estimations en "points", également les distributions d'estimation.

## Cas d'usage (déduits)

### CU-001 — Créer un module thématique

Un ADMIN ou MEMBER crée un module dans un projet. Il lui donne un nom unique dans le projet, optionnellement un statut, une date de début et de fin, un lead, et des membres. Le module est créé avec le statut `planned` par défaut et apparaît en tête de la liste.

### CU-002 — Associer des issues à un module

Un ADMIN ou MEMBER ajoute une ou plusieurs issues à un module via `create_module_issues` (ajout en masse depuis la vue module) ou via `create_issue_modules` (depuis la vue issue, qui permet aussi la suppression simultanée d'associations). Chaque association déclenche une entrée d'activité sur l'issue concernée.

### CU-003 — Suivre la progression d'un module

Tout membre (ADMIN, MEMBER, GUEST) consulte la liste des modules actifs. Chaque module affiche ses compteurs d'issues par état (calculés en temps réel). La vue de détail expose en plus un burndown chart et les distributions par assignee/label.

### CU-004 — Archiver un module terminé

Un ADMIN ou MEMBER avec permission `ProjectEntityPermission` archive un module dont le statut est `completed` ou `cancelled`. Le module disparaît de la liste active mais reste accessible via la liste des modules archivés. Les favoris associés sont supprimés.

### CU-005 — Désarchiver un module

Un ADMIN ou MEMBER restaure un module archivé en supprimant son `archived_at`. Le module réapparaît dans la liste active (sans les anciens favoris).

### CU-006 — Supprimer un module

Seul un ADMIN ou le créateur du module peut le supprimer. La suppression supprime également les associations `ModuleIssue`, les favoris et les visites récentes. Une activité est tracée sur chaque issue concernée.

### CU-007 — Gérer ses préférences d'affichage

Chaque utilisateur peut lire et mettre à jour ses filtres, filtres riches, propriétés d'affichage et groupements pour un module donné. La ressource `ModuleUserProperties` est auto-créée au premier accès GET.

### CU-008 — Ajouter un lien externe à un module

Un ADMIN ou MEMBER avec `ProjectEntityPermission` ajoute des liens externes (URL + titre) au module. Ces liens apparaissent dans le détail du module.

## Dépendances

- `api/projects` — un module appartient à un projet (`ProjectBaseModel`). Archivage d'un projet non géré ici.
- `api/issues` — les issues sont liées aux modules via `ModuleIssue`. Les compteurs de progression dépendent du modèle `Issue` et de `Issue.issue_objects` (manager avec soft-delete).
- `api/auth` / RBAC — les permissions ADMIN/MEMBER/GUEST sont vérifiées via `@allow_permission`.
- `UserFavorite` — les modules peuvent être mis en favoris (feature transversale web/favorites-stickies).
- `UserRecentVisit` — les accès détail tracent des visites récentes.
- Celery / `issue_activity` — chaque création/suppression d'association module-issue déclenche une tâche asynchrone.
- Celery / `model_activity` — création, modification et suppression du module déclenchent des webhooks.
- `burndown_plot` — fonction utilitaire dans `plane/utils/analytics_plot.py` pour le burndown chart.

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- **Signification métier de `external_source` et `external_id`** : ces champs existent sur `Module` mais aucune logique ne les exploite dans les vues lues. Probablement destinés à l'intégration avec des outils externes (Jira, GitHub Projects) — à confirmer.
- **Déclenchement automatique du statut** : le statut du module est géré manuellement. Il n'y a pas de logique qui passe le statut à `completed` quand 100% des issues sont complétées. Était-ce intentionnel ou prévu mais non implémenté ?
- **Droit de modifier un module archivé** : les membres ne peuvent pas modifier un module archivé, mais le code ne vérifie pas cela côté archive — uniquement côté `partial_update`. Est-ce que d'autres champs sont modifiables via d'autres endpoints ?
- **Politique de logo** : le champ `logo_props` (JSONField) existe mais aucune logique de validation ou de traitement spécifique n'est visible dans le périmètre lu.
- **`view_props`** : JSONField sur le Module, distinct de `ModuleUserProperties`. Stocke probablement des préférences d'affichage au niveau module (vs utilisateur). Confirmation nécessaire.
