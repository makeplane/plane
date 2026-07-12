# Spec Fonctionnelle — Vues publiques/privées (views-access)

| Champ      | Valeur                                      |
|------------|---------------------------------------------|
| Module     | api/views-access                            |
| Version    | 0.1.0                                       |
| Date       | 2026-07-12                                  |
| Auteur     | session roadmap vague 2                     |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-12)              |
| Source     | NOTE-features-payantes-points-entree-ce.md (feature Pro « private views ») |

> ⚠️ Garde ADR-001 bypassée sur décision du dev. Feature équivalente au plan Pro de Plane, réimplémentée en CE (AGPL, aucun code plane-ee).

---

## Contexte et objectif

Le modèle `IssueView` porte depuis toujours un champ `access` (0=Private, 1=Public, défaut Public) et le backend cache DÉJÀ les vues privées aux non-propriétaires (`Q(owned_by=user) | Q(access=1)`). Mais en CE, `access` était en `read_only_fields` du serializer : impossible d'écrire la valeur → toutes les vues étaient publiques de fait, et les 2 composants CE (sélecteur d'accès du formulaire, facette de filtre) étaient des stubs vides. Objectif : rendre le cycle complet fonctionnel (création/édition d'une vue privée + filtre).

## Règles métier

1. `access` ∈ {0=Private, 1=Public} — **attention, mapping inversé par rapport à l'intuition** (0=Private). Défaut : Public.
2. Une vue privée n'est visible que par son propriétaire (`owned_by`) — déjà appliqué par le queryset (listes ET détail), pour les vues projet et workspace.
3. Seul le propriétaire modifie une vue (garde préexistante : 400 côté workspace, 403 côté projet) — donc seul lui peut basculer l'accès.
4. Toute valeur `access` hors {0,1} → 400 (ChoiceField dérivé des choices du modèle).
5. `is_locked` reste NON inscriptible (aucun write path — sous-feature verrouillage hors scope).
6. « Shared » (partage nominatif) n'existe pas dans le modèle CE — hors scope.

## User Stories

- En tant que membre, je crée une vue privée (icône cadenas dans le formulaire) que mes collègues ne voient pas.
- En tant que propriétaire, je bascule une vue Public ↔ Private.
- En tant que membre, je filtre la liste des vues par accès (facette Private/Public).

## Cas limites

- PATCH `access` par un non-propriétaire → refusé (400/403), valeur inchangée.
- `access` non fourni à la création → Public (défaut formulaire ET modèle).
- `access=5` → 400.
- Vue verrouillée (`is_locked`) → aucune modification possible (garde préexistante).

## Interfaces

- Formulaire de vue (projet et workspace) : sélecteur segmenté Public (globe) / Private (cadenas) — composant upstream `AccessField` réutilisé.
- Panneau de filtres des vues : facette « Access » avec options Private/Public.

## Hors scope

- Tier « Shared » (nécessiterait migration + table de partage).
- Verrouillage de vue (`is_locked` write path).
- « Additional layouts » workspace (stubs `helper.tsx` — feature distincte).
- Exposition v1/MCP (pas de ressource views dans le SDK officiel).

## Critères d'acceptation

- [x] POST vue avec `access=0` → persisté (navigateur : « Vue privee test » créée `access:0`).
- [x] Vue privée invisible pour un autre membre (pytest, projet + workspace).
- [x] PATCH access par le propriétaire OK, par un autre → refus (pytest).
- [x] `access` invalide → 400 ; `is_locked` toujours non inscriptible (pytest).
- [x] Facette de filtre rendue (navigateur : « Access | Private | Public »).
