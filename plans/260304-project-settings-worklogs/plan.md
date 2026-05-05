---
title: "Worklog Export & Pagination"
description: "Add async CSV/Excel export, pagination, and download history to project worklog settings"
status: done
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
- **New API endpoints** via separate `ProjectWorklogExportView(BaseAPIView)` — nested under project URL
- **Frontend pagination** — offset-based "1-X of Y" footer with `Prev` and `Next` buttons for Worklogs list
- **Frontend export history** — Collapsible accordion with polling, including "1-X of Y" footer and `Prev`/`Next` pagination

## Phases

| #   | Phase                                                                   | Effort | Status |
| --- | ----------------------------------------------------------------------- | ------ | ------ |
| 1   | [Backend: Worklog Export Task](phase-01-backend-worklog-export-task.md) | 1.5h   | done   |
| 2   | [Backend: API Endpoints](phase-02-backend-api-endpoints.md)             | 1h     | done   |
| 3   | [Frontend: Pagination](phase-03-frontend-pagination.md)                 | 1h     | done   |
| 4   | [Frontend: Async Export](phase-04-frontend-async-export.md)             | 1h     | done   |
| 5   | [Frontend: Previous Downloads](phase-05-frontend-previous-downloads.md) | 1.5h   | done   |

## Dependencies

- Phases 1-2 (backend) can be done in parallel
- Phases 3-5 (frontend) depend on phase 2
- Phases 3, 4, 5 can be done in parallel after backend is ready

## Risk

- S3/MinIO config must be available in dev environment for upload testing
- Presigned URL expiry (7 days) — acceptable for worklog exports
- Large worklog datasets — Celery task handles async, zip compression mitigates size

## Validation Log

### Session 1 — 2026-03-04

**Trigger:** Initial plan validation before implementation
**Questions asked:** 6

#### Questions & Answers

1. **[Architecture]** Phase 2 defines the export URL as `POST /api/workspaces/<slug>/export-worklogs/?project=<id>` but Phase 5's service code uses `/api/workspaces/<slug>/projects/<id>/worklogs/export/`. Which URL pattern should we use?
   - Options: Workspace-level with query param | Nested under project
   - **Answer:** Nested under project
   - **Rationale:** RESTful nesting `/projects/<id>/worklogs/export/` is consistent with existing worklog CRUD routes. Phase 2 and Phase 5 service code must be aligned to this pattern.

2. **[Architecture]** Phase 2 suggests creating a separate `ProjectWorklogExportView(BaseAPIView)` rather than adding actions to `ProjectWorkLogViewSet`. Which approach?
   - Options: Separate BaseAPIView | Extend ProjectWorkLogViewSet
   - **Answer:** Separate BaseAPIView
   - **Rationale:** Clean separation following ExportIssuesEndpoint pattern. Easier to test independently. Fewer side effects on existing ViewSet.

3. **[UX]** When user triggers an export, should the Previous Downloads section auto-expand to show progress, or just show a toast?
   - Options: Toast only | Toast + auto-expand | Toast + auto-expand + poll
   - **Answer:** Toast + auto-expand
   - **Rationale:** User gets immediate visual feedback that export is queued without needing to manually open the section. Polling starts when section is open.

4. **[Scope]** When a backend export produces zero matching worklogs, what should happen?
   - Options: Create empty file | Fail with message | Block at API level
   - **Answer:** Create empty file
   - **Rationale:** Consistent behavior — always creates a zip with headers-only CSV/XLSX. Status = completed. No special error handling needed.

5. **[Architecture]** The plan extracts `create_zip_file` + `upload_to_s3` from `export_task.py` into `export_utils.py`. Proceed with extraction or duplicate?
   - Options: Extract to shared utils | Duplicate in worklog task
   - **Answer:** Extract to shared utils
   - **Rationale:** DRY approach. Modifies export_task.py imports but reduces duplication. Must verify existing export still works after refactor.

6. **[Architecture]** Phase 3 replaces 'Load more' with Prev/Next. Backend uses cursor pagination but UI shows offset-style '1-25 of 142'. Track page number client-side or switch to offset?
   - Options: Client-side page tracking | Switch to offset pagination
   - **Answer:** Client-side page tracking
   - **Rationale:** Keep cursor pagination on backend (already implemented). Track page number in MobX store, derive display range from `(page-1)*pageSize+1`.

#### Confirmed Decisions

- **API URL pattern**: Nested under project `/projects/<id>/worklogs/export/` — consistent with CRUD routes
- **View design**: Separate `ProjectWorklogExportView(BaseAPIView)` — clean separation
- **Export UX**: Toast + auto-expand Previous Downloads section
- **Empty export**: Create empty file with headers only, status = completed
- **Shared utils**: Extract `create_zip_file` + `upload_to_s3` to `export_utils.py`
- **Pagination**: Client-side page tracking with cursor-based backend

#### Action Items

- [ ] Update Phase 2 URL pattern from workspace-level to nested project URL
- [ ] Update Phase 5 service URL to match Phase 2
- [ ] Add auto-expand behavior to Phase 4 (export trigger) and Phase 5 (previous downloads)
- [ ] Add empty export handling to Phase 1 (Celery task)

#### Impact on Phases

- Phase 2: URL must change to `/api/workspaces/<slug>/projects/<id>/worklogs/export/`
- Phase 4: Add auto-expand of Previous Downloads section after export trigger
- Phase 5: Align service URL with Phase 2; ensure Collapsible supports programmatic open
- Phase 1: Handle empty queryset — create zip with headers-only file
