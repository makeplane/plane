---
title: "Worklog Export & Pagination"
description: "Add async CSV/Excel export, pagination, and download history to project worklog settings"
status: pending
priority: P2
effort: 6h
branch: develop
tags: [worklog, export, celery, pagination]
created: 2026-03-04
---

# Worklog Export & Pagination

## Overview

Replace client-side CSV blob export + "Load more" with: (1) standard pagination, (2) async Celery-based CSV/Excel export via S3, (3) previous downloads accordion.

## Key Decisions

- **Reuse `ExporterHistory` model** — already has `type="issue_worklogs"`, `provider` choices, S3 fields
- **Reuse `DataExporter` + `upload_to_s3`** from `export_task.py` — extract shared utils
- **New Celery task** `worklog_export_task` — queries `IssueWorkLog`, serializes via `DataExporter`
- **New API endpoints** on `ProjectWorkLogViewSet` — `export` (POST) + `export-history` (GET)
- **Frontend pagination** — offset-based "1-X of Y" footer with `Prev` and `Next` buttons for Worklogs list
- **Frontend export history** — Collapsible accordion with polling, including "1-X of Y" footer and `Prev`/`Next` pagination

## Phases

| #   | Phase                                                                   | Effort | Status  |
| --- | ----------------------------------------------------------------------- | ------ | ------- |
| 1   | [Backend: Worklog Export Task](phase-01-backend-worklog-export-task.md) | 1.5h   | pending |
| 2   | [Backend: API Endpoints](phase-02-backend-api-endpoints.md)             | 1h     | pending |
| 3   | [Frontend: Pagination](phase-03-frontend-pagination.md)                 | 1h     | pending |
| 4   | [Frontend: Async Export](phase-04-frontend-async-export.md)             | 1h     | pending |
| 5   | [Frontend: Previous Downloads](phase-05-frontend-previous-downloads.md) | 1.5h   | pending |

## Dependencies

- Phases 1-2 (backend) can be done in parallel
- Phases 3-5 (frontend) depend on phase 2
- Phases 3, 4, 5 can be done in parallel after backend is ready

## Risk

- S3/MinIO config must be available in dev environment for upload testing
- Presigned URL expiry (7 days) — acceptable for worklog exports
- Large worklog datasets — Celery task handles async, zip compression mitigates size
