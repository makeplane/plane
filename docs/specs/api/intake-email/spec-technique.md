# Spec Technique — Intake par email

| Champ      | Valeur           |
|------------|-------------------|
| Module     | api/intake-email |
| Version    | 0.1.0            |
| Date       | 2026-07-07       |
| Statut     | IMPLÉMENTÉ v0.1.0 (2026-07-07) |

---

## Architecture

Activation d'un schéma dormant CE (`source`/`source_email`) + nouveau point d'entrée webhook email. Traitement asynchrone via Celery (parsing du mail hors requête).

## Fichiers concernés

### API (apps/api)

| Fichier | Rôle | État CE actuel |
|---------|------|----------------|
| `plane/db/models/intake.py` | `SourceType` (l.38-39), `source`/`source_email` (l.70-71) | enum limité à `IN_APP` ; `source_email` jamais écrit |
| `plane/app/views/intake/base.py` | Création intake in-app | `source=SourceType.IN_APP` en dur (l.277) — ne pas modifier |
| `plane/api/views/intake.py` | API externe | idem (l.209) |
| nouveau : `plane/app/views/intake/email.py` (ou app dédiée) | Webhook entrant | à créer |
| nouveau : `plane/bgtasks/intake_email_task.py` | Parsing + création asynchrone | à créer |

### Web (apps/web)

| Fichier | Rôle | État CE actuel |
|---------|------|----------------|
| `apps/web/ce/components/inbox/source-pill.tsx` | Badge de provenance | stub `<></>` (type `EInboxIssueSource` déjà dans @plane/types) |
| `apps/web/ce/components/projects/settings/intake/header.tsx` | Réglages intake | header basique sans config email |

## Schéma BDD

- Migration : ajout de `EMAIL` à `SourceType` (TextChoices — vérifier si contrainte DB ou applicative seulement).
- Éventuel : table/colonne pour le token d'adresse email par projet (à trancher au tech design).

## API

- Nouveau : `POST /api/intake/email/` (`intake-email-webhook`) — authentification par signature (pattern HMAC type RETRO-121), payload provider-agnostique.
- Existant : listing intake expose déjà `source` via serializers — vérifier l'exposition de `source_email`.

## Tests

- pytest : webhook (signature valide/invalide), parsing (sujet/corps/expéditeur), sanitization XSS, throttling, projet avec intake désactivé.
- Web : rendu du source pill.

---

## État d'implémentation (2026-07-07)

Implémenté (API + web), vérifié statiquement (ruff, py_compile ; typecheck web OK). Tests `tests/contract/app/test_intake_email_app.py` + `tests/unit/bg_tasks/test_intake_email_task.py` écrits — **non exécutés** (pas d'env BDD/Redis).

Fichiers : `plane/app/views/intake/base.py` (endpoint webhook), `plane/app/urls/intake.py`, `plane/bgtasks/intake_email_task.py`, `plane/db/models/intake.py` + migration `0122_alter_intakeissue_source`, `plane/settings/common.py`, `apps/web/ce/components/inbox/source-pill.tsx`, `apps/web/core/{components/inbox/sidebar/inbox-list-item.tsx, store/inbox/inbox-issue.store.ts}`, `packages/types/src/inbox.ts`.

### Décision de sécurité (spec-technique, hors ADR — mécanisme confiné au module intake, cf. politique 06)

**Webhook entrant agnostique du provider, signé HMAC-SHA256, fail-closed.** `POST /api/intake/email/` : `permission_classes=[AllowAny]` mais signature `X-Plane-Signature` = HMAC-SHA256 hex du corps **brut** (`request.body`) avec `settings.INTAKE_EMAIL_WEBHOOK_SECRET`, comparée par `hmac.compare_digest`. Secret vide ⇒ **403** (endpoint désactivé). Throttle sur scope dédié `intake_email` (120/min) au lieu du bucket anon global. Résolution du projet par UUID d'intake dans le local-part du `recipient` ; intake inconnu ou `intake_view=False` ⇒ 404. Traitement asynchrone (Celery), HTML sanitizé par le validateur existant (RETRO-101), arrivée en état triage (RETRO-102).
> Le choix du **provider entrant** (Mailgun/SES/IMAP…) reste ouvert et hors périmètre : ce webhook est générique. S'il devient structurant (infra transverse), il pourra être promu en ADR SECURITY/STACK à ce moment.

**Idempotence.** Champ optionnel `message_id` du payload → dédup sur `external_source="EMAIL"` + `external_id=message_id` : un rejeu (retry provider ou requête capturée) ne crée pas de doublon.

**Parité intake in-app.** À la création, émission de `issue_activity` (type created, `actor_id=None` = système, `notification=True`) et `issue_description_version_task` (version initiale).

### Reste à faire / points ouverts
- Exécuter pytest (nécessite Redis pour le throttle).
- Valider la migration `0122` en no-op (`makemigrations --check`).
- V1 sans exposition de l'adresse email dédiée dans les réglages projet ; sans acteur bot dédié (actor système `None`).
