# VERSIONNING — api/work-item-pages

| Version | Date | Type | Description | Fichiers touchés |
|---------|------|------|-------------|------------------|
| 0.1.0 | 2026-07-08 | feat | Implémentation initiale : modèle IssuePage, migration 0123, serializer IssuePageSerializer, helper page_access, endpoints internes (app) et externes (api v1/MCP), activité issue, web store + widget | `apps/api/plane/db/models/page.py`, `db/models/__init__.py`, `db/migrations/0123_issue_pages.py`, `app/serializers/page.py`, `utils/page_access.py`, `app/views/issue/page.py`, `app/urls/issue.py`, `api/views/page_link.py`, `api/urls/page_link.py`, `bgtasks/issue_activities_task.py`, `apps/web/core/services/issue/issue.service.ts`, `core/store/issue/issue-details/issue-page.store.ts`, `core/store/issue/issue-details/root.store.ts`, `core/components/issues/issue-detail-widgets/pages/*`, `packages/types/src/issues/issue.ts` |

> Table mise à jour par @update-writer-after-implement après chaque implémentation.
