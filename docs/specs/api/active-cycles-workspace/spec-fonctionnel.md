# Spec Fonctionnelle — Active Cycles (vue workspace)

| Champ      | Valeur                                      |
|------------|---------------------------------------------|
| Module     | api/active-cycles-workspace                 |
| Version    | 0.1.0                                       |
| Date       | 2026-07-12                                  |
| Auteur     | session roadmap vague 1                     |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-12)              |
| Source     | NOTE-features-payantes-points-entree-ce.md (feature Pro « Active Cycles ») |

> ⚠️ Garde ADR-001 bypassée sur décision du dev. Feature équivalente au plan Pro de Plane, réimplémentée en CE (AGPL, aucun code plane-ee).

---

## ADRs

_Aucun ADR — réutilise les modèles existants (`Cycle`, `CycleIssue`, `ProjectMember`), zéro migration. RETRO-041 (cycles) en référence de contexte._

---

## Contexte et objectif

En CE, la route `/:workspaceSlug/active-cycles` affichait un paywall (`WorkspaceActiveCyclesUpgrade`, badge « Pro »). Objectif : une vraie page workspace qui agrège **tous les cycles actuellement actifs** (fenêtre `start_date <= maintenant <= end_date`, non archivés) **des seuls projets dont l'utilisateur est membre actif**, avec compteurs de progression par cycle.

## Personas

- **Membre workspace multi-projets** : voit d'un coup d'œil tous les sprints en cours de ses projets.
- **Guest projet** : voit uniquement les cycles actifs des projets où il est membre (parité avec la liste des cycles du projet).
- **Membre workspace sans projet** : liste vide (empty state), aucune fuite d'autres projets.

## Règles métier

1. Un cycle est « actif » ssi `start_date <= now <= end_date` (bornes stockées en UTC, comparaison sur l'instant) ET `archived_at IS NULL`.
2. Scoping strict par `ProjectMember(member=user, is_active=True)` — l'appartenance workspace ne suffit PAS à voir un cycle.
3. Les projets archivés (`project.archived_at`) sont exclus, ainsi que les projets dont la feature Cycles est désactivée (`project.cycle_view=False` — l'UI projet masque déjà les cycles dans ce cas).
4. Les compteurs (total/completed/cancelled/started/unstarted/backlog) excluent les work items archivés, drafts et soft-deleted, ainsi que les liens `CycleIssue` soft-deleted.
5. Les dates renvoyées sont converties au fuseau horaire du projet propriétaire de chaque cycle.
6. `status` vaut toujours `"CURRENT"` (la fenêtre active est déjà filtrée côté requête).

## User Stories

- En tant que membre, je vois les cycles actifs de tous mes projets triés du plus récent au plus ancien, avec % de complétion.
- En tant que guest, je ne vois jamais un cycle d'un projet dont je ne suis pas membre.
- En tant que membre d'un workspace sans cycle actif, je vois un empty state (pas d'erreur).

## Cas limites

- Cycle sans issues → compteurs à 0, la carte affiche 0 % (pas de division par zéro).
- Cycle avec des issues cancelled → elles sont exclues du % et de la barre de progression (même dénominateur), et affichées en compteur « N cancelled ».
- Cycle sans `start_date`/`end_date` (draft) → jamais « actif ».
- Utilisateur avec membership désactivée (`is_active=False`) → le projet disparaît de l'agrégat.
- Workspace > 100 cycles actifs → pagination cursor + bouton « Load more » sur la page.
- API injoignable (panne réseau) → état d'erreur (pas l'empty state).

## Interfaces

- Page `/:workspaceSlug/active-cycles` : grille responsive de cartes (nom du cycle, identifiant + nom du projet, plage de dates, barre + % de progression, compteurs), skeleton de chargement, état d'erreur, empty state réutilisé.
- Sidebar étendue et header : badge « Pro » retiré pour cette entrée.

## Dépendances

| Dépendance | Spec | État |
|------------|------|------|
| api/cycles | docs/specs/api/cycles/ | ✅ existe (DRAFT rétro, RETRO-041) |
| api/workspaces | docs/specs/api/workspaces/ | ✅ existe (DRAFT rétro) |

## Hors scope

- Widgets analytiques par cycle (burndown, analytics workspace) — la version Pro amont ajoute des graphes ; ici on livre la liste agrégée + stats de base.
- Exposition v1/MCP (le SDK officiel n'a pas de ressource « active cycles »).

## Critères d'acceptation

- [x] `GET /api/workspaces/:slug/active-cycles/` renvoie l'enveloppe cursor standard avec les seuls cycles actifs des projets du demandeur (vérifié E2E Docker + navigateur).
- [x] Compteurs corrects après ajout d'un work item au cycle (vérifié : total=1, started=1).
- [x] Zéro migration (`makemigrations --check` propre).
- [x] Page web réelle remplaçant le paywall, states loading/error/empty.
