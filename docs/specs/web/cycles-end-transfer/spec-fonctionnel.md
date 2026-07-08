# Spec Fonctionnelle — Fin de cycle & auto-transfert [SCAFFOLD — à rédiger]

| Champ      | Valeur                                      |
|------------|---------------------------------------------|
| Module     | web/cycles-end-transfer                     |
| Version    | 0.1.0                                       |
| Date       | 2026-07-07                                  |
| Auteur     | scaffold /zelian:new-spec                   |
| Statut     | SCAFFOLD — à compléter via /zelian:spec-writer |
| Source     | NOTE-features-payantes-points-entree-ce.md (quick win n°1) |

> ⚠️ Garde ADR-001 bypassée sur décision du dev (Phase 2 non faite). Feature équivalente au plan Pro de Plane, réimplémentée en CE (AGPL, aucun code plane-ee).

---

## ADRs

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-041](../../../adr/RETRO-041-cycle-progress-snapshot.md) | Progress snapshot du cycle source lors d'un transfert d'issues | Documenté (rétro) |

---

## Contexte et objectif

À la fin d'un cycle, les work items non terminés restent orphelins : l'utilisateur doit les déplacer un par un. L'API CE expose **déjà** l'endpoint de transfert (`transfer-issues/`, avec snapshot de progression — cf. RETRO-041), mais l'UI web est un stub EE : `EndCycleModal` rend `<></>`. Objectif : fournir la modal de fin de cycle avec transfert groupé des items incomplets vers un cycle cible.

## Personas

_À compléter (spec-writer)._

## Règles métier

_À compléter (spec-writer). Pistes : quels états sont « incomplets » ? cycle cible obligatoirement futur/actif ? snapshot conservé sur le cycle source._

## User Stories

_À compléter (spec-writer)._

## Cas d'usage

_À compléter (spec-writer)._

## Cas limites

_À compléter (spec-writer). Pistes : cycle sans successeur, 0 item transférable, transferts en chaîne (hops)._

## Contraintes

- Aucune modification de l'endpoint API existant (comportement RETRO-041 préservé).
- UI dans `apps/web/ce/` (remplacement de stubs — pas de fork de `core/`).

## Interfaces

- Modal de fin de cycle (compte d'items transférables, sélection du cycle cible).
- Info « transfer hop » dans la sidebar de détail d'un work item.

## Dépendances

| Dépendance | Spec | État |
|------------|------|------|
| api/cycles | docs/specs/api/cycles/ | ✅ existe (DRAFT rétro) |

## Hors scope

- Auto-planification des cycles (feature Business).
- Active Cycles workspace.

## Critères d'acceptation

_À compléter (spec-writer)._
