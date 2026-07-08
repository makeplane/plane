# RETRO-051 — Compute-on-read des statistiques d'avancement (modules et cycles)

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-30          |
| Source     | Rétro-ingénierie    |
| Features   | modules, cycles |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | DB-STRATEGY |
| Q1 — Coût de revert > 1j ? | OUI — Passer à un modèle de compteurs matérialisés exigerait : (1) des migrations pour ajouter des colonnes `total_issues`, `completed_issues`, etc. sur `modules` et `cycles` ; (2) des triggers ou tâches Celery pour maintenir la cohérence à chaque ajout/suppression d'issue ou changement d'état ; (3) la réécriture des `get_queryset()` dans `base.py` des deux modules (plus de 12 sous-requêtes chacun) ; (4) une stratégie de backfill pour les données existantes. Refactoring transverse estimé à plusieurs jours. |
| Q2 — Non-déductible du code ? | OUI — Les modèles `Module` et `Cycle` n'ont aucune colonne de compteur. La décision de ne jamais matérialiser ces statistiques est une intention architecturale qui n'apparaît pas dans `models.py` ni dans les configs. Un dev qui lit le modèle seul ne comprend pas pourquoi il n'y a pas de colonne `total_issues` et pourrait être tenté d'en ajouter une "pour optimiser". |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — Le pattern est identique et dupliqué dans `api/modules` (12 sous-requêtes dans `ModuleViewSet.get_queryset()` et dans `ModuleArchiveUnarchiveEndpoint.get_queryset()`) et dans `api/cycles` (`CycleViewSet.get_queryset()`). Tout changement de stratégie affecte au minimum ces deux specs. |
| Q4 — Casse un invariant si ignoré ? | OUI — Un dev qui ajoute une colonne `total_issues` persistée sur `Module` sans mécanisme de synchronisation crée une désynchronisation silencieuse : la colonne devient périmée dès qu'une issue est ajoutée, retirée, ou change d'état. Les tableaux de bord et le burndown chart afficheraient des chiffres incorrects sans aucune erreur visible. |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Les modules et les cycles exposent des statistiques d'avancement (nombre d'issues par état, points d'estimation par état) dans leurs réponses API. Ces données changent fréquemment : à chaque ajout ou suppression d'une issue, à chaque changement d'état d'une issue, et à chaque modification d'estimation.

Deux approches sont possibles :
1. **Matérialiser** les compteurs sur le modèle (colonnes en base, mise à jour synchrone ou asynchrone).
2. **Calculer à la lecture** via des sous-requêtes SQL (compute-on-read).

Plane a choisi la seconde approche.

## Décision identifiée

Les compteurs d'avancement des modules et cycles ne sont jamais stockés en base de données. À chaque requête `list`, `retrieve`, ou liste archivée, les statistiques suivantes sont recalculées via des sous-requêtes SQL corrélées (pattern `Subquery` + `Coalesce`) :

- `total_issues` — nombre total d'issues actives dans le module/cycle
- `completed_issues` — issues dont `state__group = "completed"`
- `cancelled_issues` — issues dont `state__group = "cancelled"`
- `started_issues` — issues dont `state__group = "started"`
- `unstarted_issues` — issues dont `state__group = "unstarted"`
- `backlog_issues` — issues dont `state__group = "backlog"`
- `total_estimate_points` — somme des `estimate_point__value` (si estimation en points activée)
- `completed_estimate_points`, `cancelled_estimate_points`, etc. — mêmes ventilations pour les points

Chaque compteur est une sous-requête indépendante annotée sur le queryset principal. Le filtre `issue_module__deleted_at__isnull=True` (resp. `cycle_issue__deleted_at__isnull=True`) exclut les associations soft-deletées.

## Conséquences observées

### Positives
- Toujours à jour : les compteurs reflètent exactement l'état de la base au moment de la requête, sans lag dû à une tâche de synchronisation.
- Pas de migration nécessaire pour ajouter un nouveau type de compteur.
- Pas de risque de désynchronisation entre le compteur stocké et les issues réelles.

### Négatives / Dette
- Performance : chaque requête de liste déclenche 10 à 12 sous-requêtes corrélées en base. Sur des projets avec beaucoup de modules/cycles et d'issues, cela peut devenir un goulot d'étranglement.
- Code dupliqué : la même structure de sous-requêtes est répétée dans `ModuleViewSet.get_queryset()`, `ModuleArchiveUnarchiveEndpoint.get_queryset()`, et les vues équivalentes des cycles. Il n'existe pas de fonction utilitaire partagée.
- Pas de cache : les compteurs sont recalculés à chaque appel, sans mise en cache Redis ou autre.

## Recommandation

Garder l'approche compute-on-read à court terme — elle garantit la fraicheur des données et simplifie le modèle. Si des problèmes de performance sont observés, envisager :

1. Extraire les sous-requêtes en fonctions utilitaires partagées entre modules et cycles (réduire la duplication sans changer la stratégie).
2. Ajouter un cache Redis court-durée (30 secondes) sur les compteurs par module/cycle.
3. Évaluer des vues matérialisées PostgreSQL rafraichies sur événement comme alternative à la matérialisation applicative.
