# Spec Fonctionnelle — Intake par email [SCAFFOLD — à rédiger]

| Champ      | Valeur                                      |
|------------|---------------------------------------------|
| Module     | api/intake-email                            |
| Version    | 0.1.0                                       |
| Date       | 2026-07-07                                  |
| Auteur     | scaffold /zelian:new-spec                   |
| Statut     | SCAFFOLD — à compléter via /zelian:spec-writer |
| Source     | NOTE-features-payantes-points-entree-ce.md (quick win n°6) |

> ⚠️ Garde ADR-001 bypassée sur décision du dev. Feature équivalente au plan Business de Plane (« Emails for Intake »), réimplémentée en CE (AGPL, aucun code plane-ee).

---

## ADRs

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-101](../../../adr/RETRO-101-intake-deploy-board-xss-sanitization.md) | Intake deploy board + sanitization XSS | Documenté (rétro) — sanitizer à réutiliser pour le corps des emails |
| [RETRO-102](../../../adr/RETRO-102-triage-state-group-dedicated.md) | State group « triage » dédié | Documenté (rétro) |

---

## Contexte et objectif

Le schéma intake CE prévoit déjà la provenance : `IntakeIssue.source` + `source_email`, mais l'enum `SourceType` ne contient que `IN_APP` et toutes les créations le codent en dur — `source_email` est toujours NULL. Côté web, le badge de provenance (`InboxSourcePill`) est un stub. Objectif : créer des work items d'intake depuis un email entrant (adresse dédiée par projet), avec traçabilité de l'expéditeur.

## Personas

_À compléter (spec-writer)._

## Règles métier

_À compléter (spec-writer). Pistes : format d'adresse (`intake+<token-projet>@domaine`) ; expéditeur inconnu accepté ou filtré ; pièces jointes ; sujet → titre, corps → description sanitizée (RETRO-101) ; arrivée en état triage (RETRO-102)._

## User Stories

_À compléter (spec-writer)._

## Cas d'usage

_À compléter (spec-writer)._

## Cas limites

_À compléter (spec-writer). Pistes : email vide/HTML-only ; spam/flood (throttling) ; token de projet invalide ; intake désactivé sur le projet ; réponse dans un thread existant._

## Contraintes

- Infrastructure email entrante à choisir (webhook d'un provider type Mailgun/SES/Postmark, ou polling IMAP) — décision potentiellement ADR (catégorie STACK/SECURITY) à instruire via la politique 06.
- Sanitization du HTML entrant obligatoire (réutiliser le sanitizer RETRO-101).
- Ne pas modifier le flux intake in-app existant (spec active api/intake).

## Interfaces

- API : endpoint webhook entrant (non authentifié par session — secret/signature) + enum `SourceType.EMAIL`.
- Web : `InboxSourcePill` (badge email + expéditeur), réglages projet intake (adresse dédiée, activation).

## Dépendances

| Dépendance | Spec | État |
|------------|------|------|
| api/intake | docs/specs/api/intake/ | ✅ existe (DRAFT rétro — spec active) |
| api/webhooks | docs/specs/api/webhooks/ | ✅ existe (DRAFT rétro — patterns signature HMAC réutilisables, RETRO-121) |

## Hors scope

- Formulaires d'intake publics (Intake Forms — feature distincte, volet space).
- Réponses par email aux commentaires (email out).

## Critères d'acceptation

_À compléter (spec-writer)._
