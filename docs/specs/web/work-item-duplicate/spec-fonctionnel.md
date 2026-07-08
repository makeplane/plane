# Spec Fonctionnelle — Duplication de work item [SCAFFOLD — à rédiger]

| Champ      | Valeur                                      |
|------------|---------------------------------------------|
| Module     | web/work-item-duplicate                     |
| Version    | 0.1.0                                       |
| Date       | 2026-07-07                                  |
| Auteur     | scaffold /zelian:new-spec                   |
| Statut     | SCAFFOLD — à compléter via /zelian:spec-writer |
| Source     | NOTE-features-payantes-points-entree-ce.md (quick win n°2) |

> ⚠️ Garde ADR-001 bypassée sur décision du dev. Feature équivalente au plan Pro de Plane, réimplémentée en CE (AGPL, aucun code plane-ee).

---

## ADRs

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-031](../../../adr/RETRO-031-triple-format-description-storage.md) | Triple format de stockage de la description | Documenté (rétro) — impacte le clonage de la description |
| [RETRO-032](../../../adr/RETRO-032-soft-delete-uuid-conditional-uniqueness.md) | Soft delete + unicité conditionnelle | Documenté (rétro) |

---

## Contexte et objectif

En CE, le menu contextuel « Copy » d'un work item ne copie que le lien ; la vraie duplication (clonage de l'item avec choix du projet de destination) est un stub EE : `createCopyMenuWithDuplication` retourne le menu de base et `DuplicateWorkItemModal` rend `<></>`. Objectif : permettre de dupliquer un work item (titre, description, propriétés, labels, assignés selon options) vers le même projet ou un autre.

## Personas

_À compléter (spec-writer)._

## Règles métier

_À compléter (spec-writer). Pistes : que clone-t-on exactement (sous-items ? liens ? pièces jointes ? commentaires — probablement non) ? mapping des états/labels inter-projets._

## User Stories

_À compléter (spec-writer)._

## Cas d'usage

_À compléter (spec-writer)._

## Cas limites

_À compléter (spec-writer). Pistes : duplication vers un projet où l'utilisateur est GUEST ; labels/états inexistants dans le projet cible ; item archivé._

## Contraintes

- Clonage réalisable côté client via les endpoints CRUD existants (pas de nouvel endpoint API en V1).
- UI dans `apps/web/ce/` uniquement.

## Interfaces

- Sous-menu « Duplicate » dans le menu contextuel des layouts.
- Modal de choix de destination (projet) + options de clonage.

## Dépendances

| Dépendance | Spec | État |
|------------|------|------|
| api/issues | docs/specs/api/issues/ | ✅ existe (DRAFT rétro) |
| api/projects | docs/specs/api/projects/ | ✅ existe (DRAFT rétro) |

## Hors scope

- Duplication en masse (bulk) — feature séparée.
- Templates de work items (feature Pro distincte).

## Critères d'acceptation

_À compléter (spec-writer)._
