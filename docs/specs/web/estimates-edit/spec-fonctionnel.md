# Spec Fonctionnelle — Édition des estimations (points & système TIME) [SCAFFOLD — à rédiger]

| Champ      | Valeur                                      |
|------------|---------------------------------------------|
| Module     | web/estimates-edit                          |
| Version    | 0.1.0                                       |
| Date       | 2026-07-07                                  |
| Auteur     | scaffold /zelian:new-spec                   |
| Statut     | SCAFFOLD — à compléter via /zelian:spec-writer |
| Source     | NOTE-features-payantes-points-entree-ce.md (quick win n°3) |

> ⚠️ Garde ADR-001 bypassée sur décision du dev. Feature équivalente au plan Pro de Plane, réimplémentée en CE (AGPL, aucun code plane-ee).

---

## ADRs

_Aucun ADR existant ne couvre les estimates (module non documenté en rétro — cf. CLAUDE.md « Non documentés : api/estimates »)._

---

## Contexte et objectif

En CE on peut créer une estimation (POINTS ou CATEGORIES) mais pas la faire évoluer : `UpdateEstimateModal` et `EstimatePointDelete` rendent `<></>` (impossible d'éditer/supprimer un point avec re-mapping des issues), et le système TIME est masqué (`isEstimateSystemEnabled` → `false` pour TIME, option grisée avec badge Pro). Objectif : édition complète des estimations en CE + (optionnel) activer le système TIME.

## Personas

_À compléter (spec-writer)._

## Règles métier

_À compléter (spec-writer). Pistes : suppression d'un point utilisé par des issues → re-mapping obligatoire vers un autre point ; passage POINTS→TIME interdit ou avec conversion ?_

## User Stories

_À compléter (spec-writer)._

## Cas d'usage

_À compléter (spec-writer)._

## Cas limites

_À compléter (spec-writer). Pistes : suppression du dernier point ; estimation désactivée sur le projet pendant l'édition._

## Contraintes

- Volet TIME : nécessite d'ajouter la valeur à l'enum `EstimateType` côté API (elle n'existe pas en CE) → migration + volet api.
- Volet points (édition/suppression/re-mapping) : l'API CRUD estimates CE est déjà fonctionnelle — vérifier la couverture du re-mapping.

## Interfaces

- Modal d'édition d'une estimation existante (renommage, ajout/édition/suppression de points).
- Flow de re-mapping lors d'une suppression de point utilisé.
- (Optionnel) input TIME dans la création.

## Dépendances

| Dépendance | Spec | État |
|------------|------|------|
| api/estimates | — | ⚠️ absente (module non documenté en rétro) — warning non bloquant |
| api/projects | docs/specs/api/projects/ | ✅ existe (DRAFT rétro) |

## Hors scope

- Rollups de temps sur cycles/modules (dépend de time tracking, gros chantier séparé).

## Critères d'acceptation

_À compléter (spec-writer)._
