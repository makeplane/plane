# Tech Design — Intake par email

> Intention technique avant implémentation. À valider avant /superpowers:write-plan.

## Approche pressentie

1. **Migration** : `SourceType.EMAIL` + génération d'un token d'adresse par projet (réglage intake).
2. **Webhook** : endpoint public `POST /api/intake/email/webhook/` vérifiant la signature du provider (HMAC — même rigueur que RETRO-121), qui enfile une tâche Celery.
3. **Tâche Celery** : résolution du projet par token, parsing (sujet → nom, corps HTML sanitizé → description, from → `source_email`), création `IntakeIssue` avec `source=EMAIL` en état triage (RETRO-102).
4. **Web** : `InboxSourcePill` (icône email + tooltip expéditeur) et affichage de l'adresse dédiée dans les réglages intake du projet.

## Points ouverts

- Choix du provider entrant (Mailgun routes / SES+SNS / Postmark inbound / IMAP polling self-hosted) — **candidat ADR** (impact transverse infra + sécurité, à passer par la politique 06).
- Threading : un reply crée-t-il un commentaire sur l'item existant (V2 ?) ou toujours un nouvel item (V1) ?
- Throttling anti-spam : réutiliser AnonRateThrottle ou dédié ?

## Risques

- Moyen/élevé : surface d'entrée non authentifiée → signature obligatoire, sanitization stricte, limites de taille (middleware body size limit existant).
