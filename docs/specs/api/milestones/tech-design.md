# Tech Design — Milestones

> Intention technique (cadrage wb4intfet, session 2026-07-12 — CONTRAT SDK extrait du serveur MCP officiel installé).

## Constat du cadrage

Backend : absence totale. Front : accroches dormantes (fetch-key, enum collapsible, i18n toggle). Contrat imposé par le SDK officiel : 8 endpoints REST + 7 outils MCP ; **champ `title` obligatoire dans les réponses** (Pydantic strict) ; work-items add/remove sur la MÊME URL collection (POST/DELETE avec body).

## Décisions

1. Champ modèle `name` (convention Plane, comme Cycle/Module) + mapping `title=CharField(source="name")` sur la couche v1 — l'interne/web reste en `name`.
2. `target_date` DateTimeField (parité Cycle ; le SDK envoie une string ISO compatible).
3. Toggle `Project.is_milestone_enabled` inclus (l'i18n du toggle était déjà livrée) — gate d'écriture pattern time-tracking, PAS de flag licence.
4. Pont `MilestoneIssue` calqué CycleIssue (UniqueConstraint conditionnelle) ; pas de `MilestoneUserProperties` en v1.
5. Deux couches (v1 + app) dès la v1 — le front ne consomme jamais la v1 token.
6. UI : page dédiée + section (pas de page overview projet existante en CE pour monter la section collapsible — l'ancre store reste utilisée par la section).

## Risques identifiés au cadrage

- Validation Pydantic du SDK : `name` au lieu de `title` = échec silencieux des outils MCP → testé EN DIRECT après implémentation.
- DELETE avec body : vérifier que DRF lit `request.data` sur DELETE (confirmé).
- Enveloppe cursor complète exigée par `PaginatedResponse` du SDK (confirmé via BasePaginator).
