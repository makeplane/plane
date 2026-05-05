# Phase 1: Backend — Worklog Export Celery Task

## Context

- [ExporterHistory model](../../apps/api/plane/db/models/exporter.py) — reuse as-is
- [export_task.py](../../apps/api/plane/bgtasks/export_task.py) — pattern to follow
- [DataExporter](../../apps/api/plane/utils/porters/exporter.py) — reuse for CSV/XLSX
- [IssueWorkLogSerializer](../../apps/api/plane/app/serializers/worklog.py) — reuse for serialization

## Overview

- **Priority:** P2
- **Status:** done
- Create a new Celery task that queries `IssueWorkLog`, serializes data, creates zip, uploads to S3.

## Key Insights

- `DataExporter` already supports CSV/XLSX/JSON via `IssueWorkLogSerializer`
- `upload_to_s3` and `create_zip_file` already exist in `export_task.py` — extract to shared module
- `ExporterHistory` already has `type="issue_worklogs"` choice — no migration needed

## Requirements

### Functional

- Export worklogs for a single project with optional filters (member_id, date_from, date_to)
- Support CSV and XLSX formats
- Upload result to S3/MinIO, generate presigned URL

### Non-functional

- Task must handle large datasets without OOM (stream if needed)
- Task must update ExporterHistory status: queued → processing → completed/failed
- Empty queryset → create zip with headers-only file, status = completed (not failed)
<!-- Updated: Validation Session 1 - empty export creates headers-only file -->

## Architecture

```
POST /api/.../worklogs/export/
  → Create ExporterHistory(type="issue_worklogs")
  → worklog_export_task.delay(...)
      → Query IssueWorkLog with filters
      → DataExporter(IssueWorkLogSerializer, format_type=provider)
      → create_zip_file()
      → upload_to_s3()
      → Update ExporterHistory status + url
```

## Related Code Files

### Modify

- `apps/api/plane/bgtasks/export_task.py` — extract `create_zip_file` and `upload_to_s3` to shared util

### Create

- `apps/api/plane/bgtasks/worklog_export_task.py` — new Celery task

### Create (shared utils)

- `apps/api/plane/bgtasks/export_utils.py` — extracted `create_zip_file` + `upload_to_s3`

## Implementation Steps

1. **Extract shared utilities** from `export_task.py`:
   - Move `create_zip_file()` and `upload_to_s3()` to new `export_utils.py`
   - Update `export_task.py` imports to use `export_utils`

2. **Create `worklog_export_task.py`**:

   ```python
   @shared_task
   def worklog_export_task(
       provider: str,        # "csv" | "xlsx"
       workspace_id: UUID,
       project_id: str,
       token_id: str,
       slug: str,
       filters: dict = None, # {member_id, date_from, date_to}
   ):
   ```

   - Set status to "processing"
   - Query `IssueWorkLog` with filters (same logic as `ProjectWorkLogViewSet.list`)
   - Use `DataExporter(IssueWorkLogSerializer, format_type=provider)`
   - Create zip, upload to S3
   - Update ExporterHistory status/url

3. **Create export serializer for worklogs** (simplified, flat fields for export):
   - `WorklogExportSerializer` in `apps/api/plane/utils/porters/serializers/worklog.py`
   - Fields: Issue Identifier, Issue Name, Logged By, Duration (hours), Date, Description, Project

## Todo

- [ ] Extract `create_zip_file` + `upload_to_s3` to `export_utils.py`
- [ ] Update `export_task.py` to import from `export_utils`
- [ ] Create `WorklogExportSerializer` for flat export data
- [ ] Create `worklog_export_task` Celery task
- [ ] Test task locally with `celery -A plane call`

## Success Criteria

- Celery task creates zip file with correct CSV/XLSX content
- ExporterHistory record updated with presigned S3 URL
- Failed exports set status="failed" with reason

## Risk Assessment

- **OOM on large exports**: Unlikely for single-project worklogs; if needed, batch queryset
- **S3 connection failure**: Caught by try/except, sets status="failed"

## Security

- Task only queries worklogs for projects where user is active member (filter in queryset)
- Presigned URLs expire in 7 days

## Next Steps

- Phase 2: API endpoints to trigger this task and list export history
