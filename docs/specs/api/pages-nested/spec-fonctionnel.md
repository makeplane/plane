# Spec Fonctionnelle — Pages imbriquées (nested pages) [SCAFFOLD — à rédiger]

| Champ      | Valeur                                      |
|------------|---------------------------------------------|
| Module     | api/pages-nested                            |
| Version    | 0.1.0                                       |
| Date       | 2026-07-07                                  |
| Auteur     | scaffold /zelian:new-spec                   |
| Statut     | SCAFFOLD — à compléter via /zelian:spec-writer |
| Source     | NOTE-features-payantes-points-entree-ce.md (quick win n°4) + investigation session précédente |

> ⚠️ Garde ADR-001 bypassée sur décision du dev. Feature équivalente au plan Business de Plane (« Nested Pages »), réimplémentée en CE (AGPL, aucun code plane-ee).

---

## ADRs

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-061](../../../adr/RETRO-061-pages-cross-project-many-to-many.md) | Pages cross-project en many-to-many | Documenté (rétro) — interaction avec le parent à clarifier |
| [RETRO-071](../../../adr/RETRO-071-live-dedicated-collab-server.md) | Serveur de collaboration dédié (live) | Documenté (rétro) |

---

## Contexte et objectif

Le schéma CE prévoit déjà l'imbrication : `Page.parent` (self-FK), cascade d'archivage/désarchivage en SQL récursif, détachement des enfants à la suppression, et `PageVersion.sub_pages_data` (JSONField). Mais la lecture de l'arbre est neutralisée : le list filtre `parent__isnull=True`, aucun endpoint ne liste les enfants d'une page, et `sub_pages_data` est figé à `{}` dans la tâche de versionnage. Objectif : activer les sous-pages de bout en bout (API + UI d'arbre).

## Personas

_À compléter (spec-writer)._

## Règles métier

_À compléter (spec-writer). Pistes : profondeur max ? héritage de l'accès (private/public) du parent ? comportement au déplacement d'un parent archivé ; interaction avec le M2M projets (RETRO-061) : l'enfant suit-il les projets du parent ?_

## User Stories

_À compléter (spec-writer)._

## Cas d'usage

_À compléter (spec-writer)._

## Cas limites

_À compléter (spec-writer). Pistes : cycle parent→enfant (A parent de B parent de A) ; déplacement vers une page d'un autre projet ; suppression du parent avec enfants publiés._

## Contraintes

- Ne pas casser le comportement actuel : les pages racines restent la vue par défaut.
- Cascade archive/unarchive existante à réutiliser telle quelle (`unarchive_archive_page_and_descendants`).
- Collaboration temps réel : les sous-pages restent des `project_page` pour live (pas de nouveau `TDocumentTypes` nécessaire en V1).

## Interfaces

- API : endpoint de liste des sous-pages + écriture `parent` (déjà acceptée en partial_update).
- Web : arbre de pages dans le navigation-pane/sidebar, action « créer une sous-page », breadcrumb parent.

## Dépendances

| Dépendance | Spec | État |
|------------|------|------|
| api/pages | docs/specs/api/pages/ | ✅ existe (DRAFT rétro) |
| live/realtime-collaboration | docs/specs/live/realtime-collaboration/ | ✅ existe (DRAFT rétro) |

## Hors scope

- Wiki workspace (pages hors projet) — dépend du seam live `TDocumentTypes`, chantier séparé.
- Déplacement de pages entre projets (move control EE).
- Collections wiki / commentaires de page (Business).

## Critères d'acceptation

_À compléter (spec-writer)._
