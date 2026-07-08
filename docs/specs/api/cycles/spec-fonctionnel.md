# Spec Fonctionnelle — Cycles [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | api/cycles          |
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
| [RETRO-021](../../../adr/RETRO-021-rbac-trois-niveaux-projet-workspace.md) | RBAC à 3 niveaux (ADMIN/MEMBER/GUEST) avec bypass ADMIN workspace et plafonnement de rôle projet | Documenté (rétro) |
| [RETRO-041](../../../adr/RETRO-041-cycle-progress-snapshot.md) | Progress snapshot du cycle source lors d'un transfert d'issues | Documenté (rétro) |

> *Table auto-générée par adr-linker. Ne pas éditer manuellement.*

---

## Contexte et objectif

Un **cycle** est un regroupement temporel d'issues au sein d'un projet Plane — l'équivalent fonctionnel d'un sprint ou d'une itération agile. Il permet à une équipe de délimiter une période de travail (date de début, date de fin), d'y associer des issues, et de suivre l'avancement via des indicateurs de progression (burndown chart, distribution par assignee et label).

Les cycles sont scopés à un projet. Un agrégat workspace-level permet de consulter l'ensemble des cycles d'un workspace depuis une vue consolidée.

---

## Règles métier (déduites du code)

1. **Dates : tout ou rien.** Un cycle doit avoir soit les deux dates (début et fin), soit aucune. Fournir une seule date est une erreur. Un cycle sans dates est considéré comme un brouillon ("DRAFT").

2. **Start date ne peut pas dépasser end date.** Validé dans `CycleWriteSerializer.validate()`.

3. **Non-chevauchement des cycles.** Deux cycles actifs (avec dates) d'un même projet ne peuvent pas se chevaucher sur la dimension temporelle. Un endpoint dédié (`/date-check/`) vérifie les intersections avant création ou modification.

4. **Statut calculé à la lecture (compute-on-read).** Le statut d'un cycle est dérivé dynamiquement à partir de `start_date`, `end_date` et de l'heure courante dans le fuseau horaire du projet : CURRENT (en cours), UPCOMING (à venir), COMPLETED (terminé), DRAFT (sans dates).

5. **Un cycle terminé est immuable.** Si `end_date < now()`, les modifications sont refusées, à l'exception du `sort_order`. De même, aucune nouvelle issue ne peut être ajoutée à un cycle terminé.

6. **Seul un cycle terminé peut être archivé.** L'archivage (`archived_at = now()`) n'est autorisé que si `end_date < now()`. L'archivage supprime automatiquement les favoris utilisateurs pointant vers ce cycle.

7. **Tri des cycles par favori puis par nom.** La liste des cycles est ordonnée : favoris en tête, puis ordre alphabétique par nom. À la récupération, le tri passe en `-is_favorite`, `-created_at`.

8. **Sort order décroissant à la création.** Chaque nouveau cycle reçoit un `sort_order` calculé à partir du minimum existant dans le projet moins 10 000 (permet d'insérer en tête sans ré-ordonner les autres).

9. **Transfert des issues incomplètes uniquement.** Le transfert d'un cycle vers un autre ne déplace que les issues dans les états "backlog", "unstarted" ou "started". Les issues complétées et annulées restent dans le cycle source. Un snapshot de progression est créé sur le cycle source avant le transfert.

10. **Snapshot de progression.** Lors d'un transfert, un `progress_snapshot` (JSON) est enregistré sur le cycle source. Ce snapshot capture les compteurs et la distribution (labels, assignees, burndown chart) au moment du transfert. Les endpoints d'analytics et de progression utilisent ce snapshot en priorité si les issues ont été transférées.

11. **Ajout d'une issue déjà dans un autre cycle.** L'ajout réassigne l'issue à ce cycle (mise à jour du `cycle_id` sur le `CycleIssue` existant) plutôt que de créer un doublon. Une issue ne peut appartenir qu'à un seul cycle actif à la fois (contrainte d'unicité `cycle_issue_when_deleted_at_null`).

12. **Propriétés utilisateur par cycle.** Chaque utilisateur peut personnaliser pour chaque cycle ses filtres, l'ordre d'affichage, le groupement et les propriétés visibles (`CycleUserProperties`). Ces préférences sont créées à la demande (get_or_create).

13. **Fuseau horaire du projet.** Les dates `start_date` et `end_date` sont stockées en UTC. La conversion vers/depuis le fuseau horaire du projet est effectuée à l'écriture (via `convert_to_utc`) et à la lecture (via `user_timezone_converter`) pour afficher les dates correctement à l'utilisateur.

14. **Suppression dure des cycles.** Contrairement aux issues, les cycles sont supprimés physiquement (pas de soft delete). Un TODO dans le code signale que ce comportement est en tension avec la relation `CycleIssue`.

15. **Suppression d'un cycle : nettoyage des favoris et visites récentes.** La suppression d'un cycle supprime automatiquement les entrées `UserFavorite` et `UserRecentVisit` associées.

16. **Intégration source externe.** Les champs `external_source` et `external_id` permettent de lier un cycle à une entité d'un système tiers (ex : import depuis Jira).

17. **Activité et webhooks.** Toute création, modification ou suppression de cycle, et tout ajout/retrait d'issue d'un cycle, déclenche une tâche Celery asynchrone (`issue_activity`, `model_activity`) pour enregistrer l'activité et notifier les webhooks abonnés.

---

## Cas d'usage (déduits)

### CU-001 — Créer un cycle (sprint planifié)

Un ADMIN ou MEMBER crée un cycle avec un nom, une date de début et une date de fin. Le système vérifie que les dates ne chevauchent pas un cycle existant. Le cycle est créé et reçoit un `sort_order` le plaçant en tête de liste. Il prend le statut UPCOMING (si les dates sont dans le futur) ou CURRENT (si les dates incluent la date actuelle).

### CU-002 — Créer un cycle brouillon

Un ADMIN ou MEMBER crée un cycle sans dates. Le cycle est en statut DRAFT et peut recevoir des issues. Il peut être complété ultérieurement en ajoutant des dates (sous réserve de non-chevauchement).

### CU-003 — Ajouter des issues à un cycle

Un ADMIN ou MEMBER ajoute une liste d'issues à un cycle actif (non terminé). Les issues déjà présentes dans un autre cycle sont réassignées à ce cycle. Les issues nouvelles génèrent des enregistrements `CycleIssue`. Une activité est enregistrée.

### CU-004 — Retirer une issue d'un cycle

Un ADMIN ou MEMBER retire une issue d'un cycle. L'enregistrement `CycleIssue` est supprimé. Une activité est enregistrée.

### CU-005 — Consulter la progression d'un cycle

Tout membre (ADMIN, MEMBER, GUEST) consulte la progression d'un cycle via l'endpoint `/progress/`. Si un snapshot est présent (issues transférées), les compteurs du snapshot sont utilisés. Sinon, les compteurs sont calculés en temps réel sur les issues actives du cycle.

### CU-006 — Transférer les issues vers un nouveau cycle

Un ADMIN ou MEMBER transfère les issues incomplètes d'un cycle terminé vers un nouveau cycle. Le système : (1) génère un snapshot sur le cycle source, (2) réassigne les issues backlog/unstarted/started vers le nouveau cycle, (3) enregistre les activités. Le cycle destination ne doit pas être déjà terminé.

### CU-007 — Archiver un cycle terminé

Un ADMIN ou MEMBER archive un cycle dont `end_date` est dépassée. Le cycle est marqué `archived_at = now()`. Les favoris sont supprimés. Le cycle n'apparaît plus dans la liste principale mais est consultable via la liste des cycles archivés.

### CU-008 — Désarchiver un cycle

Un ADMIN ou MEMBER restaure un cycle archivé. Le champ `archived_at` est remis à NULL.

### CU-009 — Supprimer un cycle

Un ADMIN (créateur du cycle) supprime un cycle. La suppression est physique (hard delete). Les `UserFavorite` et `UserRecentVisit` associés sont supprimés.

### CU-010 — Vérifier la disponibilité de dates

Avant de créer ou modifier un cycle avec dates, le frontend interroge `/date-check/` pour vérifier l'absence de chevauchement avec les cycles existants du projet.

### CU-011 — Consulter les analytics d'un cycle

Tout membre consulte les analytiques d'un cycle : distribution par assignee, par label, et burndown chart. Deux modes : par nombre d'issues ou par points d'estimation (si le projet utilise les estimations de type "points").

### CU-012 — Vue workspace des cycles

Un utilisateur disposant du rôle `WorkspaceViewerPermission` consulte tous les cycles actifs de son workspace en une seule requête, avec les compteurs d'issues par état.

---

## Dépendances

- **api/projects** : un cycle appartient à un projet (`ProjectBaseModel`). Le fuseau horaire du projet est utilisé pour les conversions de dates. La feature "cycles" doit être activée sur le projet.
- **api/issues** : les issues sont la substance d'un cycle. Le modèle `Issue` fournit les états (state groups), assignees, labels, et estimations.
- **api/estimates** : les analytics en mode "points" nécessitent que le projet ait une estimation de type "points" configurée.
- **api/workspaces** : scope de la vue workspace-level des cycles.
- **api/notifications** : l'activité cycle déclenche des notifications via `issue_activity` Celery.
- **api/webhooks** : les événements cycle (`webhook_event = "cycle"`, `"cycle_issue"`) sont publiés via `model_activity` Celery.
- **web/favorites-stickies** : `UserFavorite` est utilisé pour marquer les cycles favoris.
- `plane.utils.analytics_plot.burndown_plot` : génère les burndown charts.
- `plane.utils.cycle_transfer_issues.transfer_cycle_issues` : logique de transfert externalisée.
- `plane.utils.timezone_converter` : conversion UTC ↔ fuseau projet.

---

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- **Règle de non-chevauchement : intention métier exacte.** Le code interdit le chevauchement de cycles avec dates, mais un projet peut-il avoir plusieurs cycles DRAFT simultanément sans restriction ? La règle semble s'appliquer uniquement aux cycles avec dates, mais la sémantique "un seul cycle CURRENT à la fois" n'est pas explicitée.
- **Hard delete vs soft delete.** Un TODO dans `destroy()` signale la tension entre la suppression physique du cycle et la relation `CycleIssue`. L'intention finale (passer au soft delete ?) n'est pas documentée.
- **`version` field.** Le modèle `Cycle` a un champ `version = IntegerField(default=1)`. Son usage n'est pas visible dans le code analysé — est-il incrémenté quelque part ? Est-ce un versioning optimiste ?
- **Fuseau horaire : le statut compute-on-read dans `CycleArchiveUnarchiveEndpoint`.** Le statut est calculé sans conversion de fuseau dans `archive.py` (utilise `timezone.now()` direct, sans conversion projet), contrairement à `base.py`. Ce comportement est-il intentionnel ?
- **`logo_props`.** Ce champ JSON est présent mais aucune logique de validation ou de traitement n'est visible. Son format exact et ses contraintes ne sont pas documentés.
- **Permissions de suppression (`creator=True, model=Cycle`).** Le décorateur `@allow_permission([ROLE.ADMIN], creator=True, model=Cycle)` restreint la suppression aux ADMIN créateurs du cycle. Un ADMIN non créateur peut-il supprimer ? La logique du paramètre `creator=True` nécessite vérification dans `allow_permission`.
