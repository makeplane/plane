# VERSIONNING — api/intake-email

| Version | Date | Type | Description | Fichiers touchés |
|---------|------|------|-------------|------------------|
| 0.1.0 | 2026-07-07 | feat | Webhook email signé HMAC + tâche Celery de création d'intake (source=EMAIL), badge de provenance | apps/api/plane/app/views/intake/base.py, app/urls/intake.py, app/serializers/intake.py, bgtasks/intake_email_task.py, db/models/intake.py, db/migrations/0122_alter_intakeissue_source.py, settings/common.py, .env.example, tests/contract/app/test_intake_email_app.py, tests/unit/bg_tasks/test_intake_email_task.py, apps/web/ce/components/inbox/source-pill.tsx, core/components/inbox/sidebar/inbox-list-item.tsx, core/store/inbox/inbox-issue.store.ts, packages/types/src/inbox.ts |

> Table mise à jour par @update-writer-after-implement après chaque implémentation.
