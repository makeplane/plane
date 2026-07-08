# RETRO-032 — Soft delete UUID-based avec UniqueConstraint conditionnel

| Champ      | Valeur                                                          |
|------------|-----------------------------------------------------------------|
| Statut     | Documenté (rétro)                                               |
| Date       | 2026-06-30                                                      |
| Source     | Rétro-ingénierie                                                |
| Features   | issues, cycles, modules, intake, notifications                  |
| App        | api                                                             |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | DB-STRATEGY |
| Q1 — Coût de revert > 1j ? | OUI — migrer vers un hard delete nécessite de revoir toutes les FK `on_delete=DO_NOTHING` (IssueActivity) et `on_delete=SET_NULL` (IssueSequence, IssueVersion.activity), de supprimer toutes les `UniqueConstraint` conditionnelles sur `deleted_at IS NULL` présentes sur au moins 6 tables (IssueRelation, IssueAssignee, IssueSubscriber, IssueReaction, CommentReaction, IssueVote, IssueMention), et de modifier le `SoftDeletionManager` et le `SoftDeleteModel` qui sont partagés par tous les modèles du projet. Refactoring transverse multi-feature, multi-semaines. |
| Q2 — Non-déductible du code ? | OUI — le choix de conserver les entrées supprimées pour préserver l'intégrité des `IssueActivity` (auditing) et des `IssueSequence` (non-réutilisation de numéros) n'est pas lisible depuis `requirements/base.txt` ou les migrations seules. L'intention — permettre des contraintes d'unicité qui tolèrent les suppressions sans rompre le log d'activité — est une décision architecturale documentée ici. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — le pattern `SoftDeleteModel + SoftDeletionManager` est appliqué à `api/issues`, `api/cycles` (CycleIssue), `api/modules` (ModuleIssue), `api/intake` (IntakeIssue, IntakeIssueStatus), `api/notifications` (Notification), `api/workspaces`, `api/projects` — l'ensemble du codebase backend repose sur ce contrat. |
| Q4 — Casse un invariant si ignoré ? | OUI — un dev qui exécuterait un hard delete sur une `Issue` (via `issue.delete(soft=False)` ou SQL direct) laisserait des `IssueActivity` avec une FK `DO_NOTHING` pointant vers un UUID inexistant, rendant le log d'activité incohérent. Il créerait aussi un trou dans la séquence des `sequence_id` récupérable (IssueSequence FK SET_NULL survivrait mais la trace de la séquence utilisée serait perdue si l'IssueSequence est aussi supprimée). |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Plane est un outil de gestion de travail nécessitant un audit trail complet et une traçabilité des modifications. La suppression physique (hard delete) d'une issue détruirait son historique d'activité (`IssueActivity`) et ses références dans les logs de webhooks, ce qui est incompatible avec les exigences d'audit.

Par ailleurs, les numéros de séquence human-readable (`sequence_id`, ex : `PRJ-42`) ne doivent pas être réutilisés après suppression d'une issue, pour éviter toute confusion pour les utilisateurs (un lien vers `PRJ-42` ne doit pas pointer vers une nouvelle issue différente).

Enfin, les relations many-to-many (assignees, labels, abonnés, réactions) doivent pouvoir être recréées après une suppression — ce que les contraintes d'unicité classiques rendraient impossible si elles bloquaient sur la ligne "supprimée".

## Décision identifiée

**Soft delete généralisé** via le mixin `SoftDeleteModel` (dans `plane/db/mixins.py`) :

- Champ `deleted_at = DateTimeField(null=True)` sur tous les modèles.
- `SoftDeletionManager` : filtre automatiquement `deleted_at__isnull=True` sur tous les querysets standards.
- `all_objects = models.Manager()` : manager brut sans filtre pour accès aux suppressions.
- `delete(soft=True)` : positionne `deleted_at = now()` et déclenche `soft_delete_related_objects.delay()` (tâche Celery pour la propagation en cascade).
- `delete(soft=False)` : hard delete disponible explicitement (ex : `UserRecentVisit`).

**UniqueConstraint conditionnel** sur les tables de relations many-to-many :

```python
UniqueConstraint(
    fields=["issue", "assignee"],
    condition=Q(deleted_at__isnull=True),
    name="issue_assignee_unique_issue_assignee_when_deleted_at_null",
)
```

Ce pattern est appliqué sur : `IssueRelation`, `IssueAssignee`, `IssueSubscriber`, `IssueReaction`, `CommentReaction`, `IssueVote`, `IssueMention`.

**FK survivantes** :

- `IssueActivity.issue` : `on_delete=DO_NOTHING` — les activités existent indépendamment de la vie de l'issue.
- `IssueSequence.issue` : `on_delete=SET_NULL` — la séquence survit pour préserver la non-réutilisation du numéro.

**Endpoints spécialisés** :

- `Issue.issue_objects` (manager IssueManager) : exclut soft-deleted + archivées + brouillons + TRIAGE.
- `Issue.objects` (SoftDeletionManager) : exclut soft-deleted uniquement.
- `Issue.all_objects` : accès complet (utilisé par `DeletedIssuesListViewSet`).

## Conséquences observées

### Positives

- Audit trail complet : toutes les `IssueActivity` survivent à la suppression de l'issue.
- Séquences non réutilisées : `IssueSequence` préserve les numéros consommés.
- Restauration possible : une issue soft-deleted peut être restaurée en effaçant `deleted_at`.
- Contraintes d'unicité tolérantes : une assignation ou réaction peut être recrée après suppression.

### Négatives / Dette

- Volume de données : les lignes supprimées s'accumulent dans toutes les tables. Pas de TTL ni de purge automatique visible dans le code pour les issues supprimées.
- Requêtes plus complexes : chaque queryset doit filtrer sur `deleted_at__isnull=True` (géré par les managers, mais risque d'oubli lors de requêtes manuelles).
- `soft_delete_related_objects` (tâche Celery de cascade) : si la tâche échoue, des objets liés peuvent rester "visibles" alors que leur parent est soft-deleted.
- Confusion `Issue.objects` vs `Issue.issue_objects` : `objects` est le `SoftDeletionManager` (filtre deleted_at) mais pas les autres exclusions (TRIAGE, archived, draft). Risque d'utiliser le mauvais manager.

## Recommandation

**Garder.** Le soft delete est une contrainte fondamentale liée à l'audit trail et à la non-réutilisation des séquences. Envisager d'ajouter une tâche de nettoyage périodique (purge des issues soft-deleted depuis plus de N jours) pour contrôler le volume de données, en veillant à préserver les `IssueActivity` correspondantes.
