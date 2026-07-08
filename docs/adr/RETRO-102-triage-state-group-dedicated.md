# RETRO-102 — État TRIAGE dédié, exclu du backlog et auto-créé à la soumission intake

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-30          |
| Source     | Rétro-ingénierie    |
| Features   | intake, issues |
| App        | api                 |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | DATA-MODEL |
| Q1 — Coût de revert > 1j ? | OUI — supprimer le groupe TRIAGE nécessite de modifier : le modèle `State` (enum `StateGroup`), le `StateManager` (qui exclut explicitement TRIAGE de tous les querysets standards), le `TriageStateManager`, les deux vues de création intake (app + space) qui auto-créent cet état, le sérialiseur `IntakeIssueSerializer.validate()` et `.update()` qui réalisent la transition TRIAGE→default, et potentiellement les filtres front qui excluent les issues TRIAGE des tableaux de bord. Refactoring transverse multi-feature, estimé à plusieurs jours. |
| Q2 — Non-déductible du code ? | OUI — le choix de représenter "en attente de triage" comme un state group à part entière (et non un simple flag booléen `is_in_intake` sur l'Issue, ou un statut distinct sur IntakeIssue seul) n'est pas lisible dans `requirements/base.txt`. La décision d'exclure systématiquement TRIAGE du `StateManager` par défaut (rendant ces issues invisibles dans le backlog standard) est une règle architecturale non triviale, tout comme l'auto-création de l'état si absent. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — `api/intake` (création d'issues en TRIAGE, transition TRIAGE→default à l'acceptation) et `api/issues` (le `StateManager` exclut TRIAGE de tous les querysets d'issues normaux, le `IssueManager.issue_objects` exclut également TRIAGE). |
| Q4 — Casse un invariant si ignoré ? | OUI — un dev qui retire l'exclusion TRIAGE du `StateManager` verrait les issues en cours de triage apparaître dans le backlog normal et dans tous les calculs de progression (cycles, modules). Un dev qui crée une issue intake sans forcer l'état TRIAGE court-circuite le funnel de triage et injecte une issue non triée directement dans le backlog. |

> Validé contre la politique `.claude/rules/06-adr-policy.md`.

## Contexte

Plane différencie les issues "normales" (dans le backlog, assignées à des états métier comme Backlog, In Progress, Done) des issues "en attente de triage" (soumises via l'intake, pas encore validées par l'équipe). Cette distinction doit être structurelle : une issue en triage ne doit pas apparaître dans les tableaux de bord, les compteurs de progression des cycles/modules, ni dans les vues filtrées standards.

Le modèle `Issue` est partagé entre l'intake et le backlog (il n'existe pas un modèle `IntakeIssue` autonome — l'`IntakeIssue` est un wrapper autour d'une vraie `Issue`). La différenciation se fait donc par l'état (`State`) de l'issue.

## Décision identifiée

**Groupe d'état TRIAGE distinct** (`StateGroup.TRIAGE = "triage"`) avec les caractéristiques suivantes :

1. **Manager exclusif** : `StateManager` (manager par défaut de `State`) exclut systématiquement le groupe TRIAGE via `.exclude(group=StateGroup.TRIAGE.value)`. `TriageStateManager` expose uniquement les états TRIAGE. Les vues standards n'accèdent donc jamais aux états TRIAGE par inadvertance.

2. **Exclusion des issues** : `IssueManager.issue_objects` (manager standard pour les listes d'issues) exclut les issues en état TRIAGE. `Issue.objects` (soft-deletion manager) les inclut pour permettre les opérations de triage interne.

3. **Auto-création à la soumission** : lors de la création d'une IntakeIssue (voie authentifiée et voie publique), si aucun état TRIAGE n'existe dans le projet, il est créé automatiquement avec les attributs par défaut suivants :
   - `name = "Triage"`
   - `color = "#4E5355"`
   - `sequence = 65000`
   - `default = False`
   - `group = StateGroup.TRIAGE`

4. **Transition automatique à l'acceptation** : lorsqu'une IntakeIssue passe au statut ACCEPTED (1), `IntakeIssueSerializer.update()` bascule l'issue sous-jacente de l'état TRIAGE vers le premier état `default=True` du projet. Si aucun état par défaut n'existe, l'acceptation est bloquée avec une `ValidationError` explicite.

5. **État séquentiellement dernier** : la séquence 65000 positionne TRIAGE après tous les états métier standards (Backlog=15000, Todo=25000, In Progress=35000, Done=45000, Cancelled=55000), ce qui évite toute confusion dans les UIs triées par séquence.

## Conséquences observées

### Positives

- Isolation complète des issues en triage du backlog normal : aucun risque de pollution des tableaux de bord par des issues non triées.
- Modèle unifié : `IntakeIssue` s'appuie sur `Issue` (partage l'historique d'activité, les labels, les assignees), sans duplication de modèle.
- Auto-création de l'état TRIAGE garantit que la fonctionnalité intake est toujours opérationnelle même sur des projets créés avant l'introduction de l'intake.
- Transition TRIAGE→default à l'acceptation est atomique et validée (état par défaut requis).

### Négatives / Dette

- **Couplage fort intake/issues** : la logique de transition est dans `IntakeIssueSerializer` (couche sérialisation), pas dans un service dédié — difficile à tester unitairement et à réutiliser.
- **Auto-création implicite** : la création silencieuse d'un état TRIAGE lors d'une soumission peut surprendre les admins projet qui ne s'attendent pas à voir cet état apparaître dans leur liste d'états.
- **Couleur codée en dur** : `#4E5355` est une constante magic string dupliquée dans deux endroits du code (les deux vues de création).
- **Un seul état TRIAGE possible par projet** : le design présuppose un unique état TRIAGE. Si un projet voulait des sous-catégories de triage, le modèle actuel ne le supporte pas sans modification architecturale.
- **`is_triage` booléen redondant** : le modèle `State` dispose d'un champ `is_triage = BooleanField(default=False)` en plus du groupe TRIAGE — sa relation avec `StateGroup.TRIAGE` n'est pas clairement définie dans le code observé (potentielle redondance ou futur usage non implémenté).

## Recommandation

**Garder.** Le groupe TRIAGE dédié est la décision la plus cohérente pour isoler le flux intake sans créer un modèle `Issue` parallèle. Envisager à terme :
1. Centraliser la couleur `#4E5355` et la séquence 65000 dans les constantes `DEFAULT_STATES` (déjà présent dans `state.py`).
2. Clarifier l'usage de `State.is_triage` vs `StateGroup.TRIAGE` et supprimer la redondance.
3. Extraire la logique de transition TRIAGE→default dans un service métier testé indépendamment du sérialiseur.
