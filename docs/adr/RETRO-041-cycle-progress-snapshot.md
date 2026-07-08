# RETRO-041 — Progress snapshot du cycle source lors d'un transfert d'issues

| Champ      | Valeur                          |
|------------|---------------------------------|
| Statut     | Documenté (rétro)               |
| Date       | 2026-06-30                      |
| Source     | Rétro-ingénierie                |
| Features   | api/cycles                      |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | REPRODUCIBILITY |
| Q1 — Coût de revert > 1j ? | OUI — Supprimer ce mécanisme exigerait de réécrire les endpoints `/progress/` et `/analytics/` (qui lisent `progress_snapshot` en priorité), de concevoir une stratégie alternative pour conserver l'état historique post-transfert, et de migrer les snapshots existants en BDD. Refactoring transverse sur au minimum 3 fichiers clés. |
| Q2 — Non-déductible du code ? | OUI — La sémantique "le snapshot sert de source de vérité historique après transfert" n'apparaît pas dans `models.py` ni dans les configs. Elle est codée dans la logique conditionnelle de `CycleProgressEndpoint.get()` et `CycleAnalyticsEndpoint.get()` : `if cycle.progress_snapshot: return snapshot_data`. Un dev lisant uniquement le modèle ne comprendrait pas pourquoi `progress_snapshot` existe. |
| Q3 — Impact transverse (≥ 2 specs) ? | ⚠️ À REVALIDER — La justification initiale invoquait `api/modules` comme second module partageant le pattern `progress_snapshot`. **Vérification post-retro (grep sur `apps/api`) : `progress_snapshot` n'existe QUE dans les fichiers `api/cycles`** (`cycle.py`, `cycle_transfer_issues.py`, `views/cycle/base.py`, `views/cycle/archive.py`, `serializers/cycle.py`). `api/modules` n'a aucun mécanisme de snapshot. L'impact réel est confiné à `api/cycles` (endpoints progress, analytics et archive du cycle + utilitaire de transfert) → le critère « ≥ 2 specs indépendantes » n'est PAS strictement satisfait. **Décision de conservation à trancher par le dev lors de la validation des DRAFT** : soit garder cet ADR au titre de l'invariant de reproductibilité (Q1/Q2/Q4 = OUI), soit le rétrograder en `docs/specs/api/cycles/spec-technique.md`. |
| Q4 — Casse un invariant si ignoré ? | OUI — Un dev qui réécrit `transfer_cycle_issues` sans sauvegarder le snapshot détruit définitivement l'état historique du cycle source. Après transfert, les issues sont déplacées dans le nouveau cycle : sans snapshot, le cycle source afficherait 0 issues — perte irréversible des métriques de sprint. |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Lorsqu'un cycle (sprint) se termine et que des issues incomplètes sont transférées vers un nouveau cycle, les issues du cycle source disparaissent de facto : elles appartiennent désormais au nouveau cycle. Si l'on interroge le cycle source, les compteurs d'issues (total, completed, backlog, etc.) seraient tous à zéro, rendant le cycle historiquement illisible.

La décision a été prise de capturer un snapshot de l'état complet du cycle — compteurs par état, distribution par assignee et label, burndown chart — au moment exact du transfert, et de le persister en base dans le champ `progress_snapshot` (JSONB).

## Décision identifiée

Au moment du transfert (`transfer_cycle_issues`), avant de déplacer les `CycleIssue` vers le nouveau cycle, le système :

1. Calcule les compteurs d'issues par état (backlog, unstarted, started, cancelled, completed, total).
2. Génère les distributions par assignee et par label (issues et, si applicable, points d'estimation).
3. Génère le burndown chart (`burndown_plot`).
4. Sérialise l'ensemble dans un dictionnaire JSON et le sauvegarde dans `current_cycle.progress_snapshot` via `save(update_fields=["progress_snapshot"])`.

Les endpoints `CycleProgressEndpoint.get()` et `CycleAnalyticsEndpoint.get()` vérifient en premier `if cycle.progress_snapshot:` avant de recalculer les métriques en temps réel. Si un snapshot est présent, il est retourné tel quel.

## Conséquences observées

### Positives
- Lecture historique rapide : pas de requête complexe sur les issues transférées — un seul accès JSONB.
- Le cycle source reste consultable après transfert avec ses vraies métriques de fin de sprint.
- Compatible avec la contrainte de non-duplication des issues entre cycles (une issue ne peut appartenir qu'à un seul cycle actif).

### Négatives / Dette
- Le snapshot est figé au moment du transfert : toute modification ultérieure des issues restées dans le cycle source (annulation, etc.) n'est pas reflétée dans le snapshot.
- Le format JSONB du snapshot n'est pas validé par un schéma — changements de structure risquent de créer des incompatibilités silencieuses.
- Un cycle peut avoir un `progress_snapshot` sans avoir eu de transfert (cas anormal non gardé).

## Recommandation

Garder ce mécanisme — il répond à un besoin réel de reproductibilité historique (consultation d'un sprint terminé). Améliorations à envisager :

1. Documenter (et idéalement valider via un schéma Pydantic) le format JSON attendu dans `progress_snapshot`.
2. Trancher le statut ADR vs spec-technique (cf. note Q3 ci-dessus) lors de la validation des DRAFT.
