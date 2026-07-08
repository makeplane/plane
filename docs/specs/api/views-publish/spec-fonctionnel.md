# Spec Fonctionnelle — Publication de vues (public views) [SCAFFOLD — à rédiger]

| Champ      | Valeur                                      |
|------------|---------------------------------------------|
| Module     | api/views-publish                           |
| Version    | 0.1.0                                       |
| Date       | 2026-07-07                                  |
| Auteur     | scaffold /zelian:new-spec                   |
| Statut     | SCAFFOLD — à compléter via /zelian:spec-writer |
| Source     | NOTE-features-payantes-points-entree-ce.md (quick win n°5) |

> ⚠️ Garde ADR-001 bypassée sur décision du dev. Feature équivalente au plan Pro de Plane (« Publish Views »), réimplémentée en CE (AGPL, aucun code plane-ee).

---

## ADRs

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-101](../../../adr/RETRO-101-intake-deploy-board-xss-sanitization.md) | Deploy board + sanitization XSS | Documenté (rétro) — même pipeline anchor/publication |

---

## Contexte et objectif

Plane CE sait déjà publier un board de projet consultable anonymement via `apps/space` (pipeline anchor/deploy board). La publication d'une **vue** (view) est en revanche un stub EE : `PublishViewModal` rend `<></>` et le hook `use-view-publish` renvoie des constantes désactivées. Objectif : publier/dépublier une vue (URL publique par anchor) rendue par space, en réutilisant le pipeline existant.

## Personas

_À compléter (spec-writer)._

## Règles métier

_À compléter (spec-writer). Pistes : qui peut publier (ADMIN projet ?) ; que voit l'anonyme (filtres de la vue figés ? commentaires ? votes ?) ; révocation d'anchor._

## User Stories

_À compléter (spec-writer)._

## Cas d'usage

_À compléter (spec-writer)._

## Cas limites

_À compléter (spec-writer). Pistes : vue supprimée alors que publiée ; vue filtrée sur des données privées (assignés, labels) ; re-publication après révocation (nouvel anchor ?)._

## Contraintes

- Réutiliser le mécanisme anchor/publish existant (DeployBoard) — pas de nouveau système.
- Sanitization XSS identique à RETRO-101 pour tout contenu rendu côté space.

## Interfaces

- Web : entrée « Publish » dans le menu contextuel des vues + modal (toggle, copie d'URL).
- Space : nouvelle route SSR de rendu d'une vue publiée par anchor.
- API : endpoints publish/unpublish/metadata d'une vue.

## Dépendances

| Dépendance | Spec | État |
|------------|------|------|
| api/views | docs/specs/api/views/ | ✅ existe (DRAFT rétro) |
| space (public-board) | — | ⚠️ absente (hors périmètre rétro) — warning non bloquant |

## Hors scope

- Contrôle d'accès privé/public interne des vues (AccessController — feature distincte).
- Publication de pages (feature distincte).

## Critères d'acceptation

_À compléter (spec-writer)._
