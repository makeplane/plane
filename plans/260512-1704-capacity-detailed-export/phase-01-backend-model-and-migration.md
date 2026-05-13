# Phase 01 — Backend: CapacityExportJob Model + Migration

## Context Links

- BE research §1, §4C: `plans/260512-1704-capacity-detailed-export/research/researcher-be-report.md`
- Reference model: `apps/api/plane/db/models/exporter.py` (ExporterHistory)

## Overview

- Priority: P1 (foundation)
- Status: pending
- Brief: Add Django model to track each capacity export request: filters, status lifecycle, file location, expiry.

## Key Insights

- Mirror `ExporterHistory` (don't extend — own table, simpler schema).
- `member_ids` stored as JSON (UUID list) — preserves filter snapshot for audit.
- Status lifecycle: `queued → processing → ready → failed | expired`.
- `expires_at` populated by Celery task after S3 upload (now + 7d).

## Requirements

**Functional**

- Persist: workspace, requester, date range, member filter, cross_workspace flag, status, file metadata, expiry, error message.
- Indexable by: requester+created_at (My Exports list), expires_at (cleanup).

**Non-functional**

- Soft-deletion compatible (`SoftDeletionManager` if inheriting `BaseModel` pattern).
- File <200 LOC.

## Architecture

```
CapacityExportJob (BaseModel)
├── workspace FK→Workspace (CASCADE)
├── requested_by FK→User (CASCADE)
├── date_from DateField
├── date_to DateField
├── member_ids JSONField (list[str], default=[])
├── cross_workspace BooleanField (default=False)
├── status CharField (queued/processing/ready/failed/expired)
├── file_key CharField(max=800, null) — S3 object key
├── file_url TextField(null) — presigned URL
├── file_size BigIntegerField(default=0)
├── row_count IntegerField(default=0)
├── error_message TextField(blank, default="")
├── expires_at DateTimeField(null)
├── completed_at DateTimeField(null)
└── (created_at, updated_at from BaseModel)
```

**Indexes**

- `(requested_by, -created_at)` — My Exports list
- `(workspace, status)` — admin queries
- `(expires_at)` — cleanup scan

## Related Code Files

**Create**

- `apps/api/plane/db/models/capacity_export.py`
- `apps/api/plane/db/migrations/00XX_capacity_export_job.py` (autogen via makemigrations)

**Modify**

- `apps/api/plane/db/models/__init__.py` — export `CapacityExportJob`

## Implementation Steps

1. Create `capacity_export.py` with model class shape above.
2. `STATUS_CHOICES = [("queued",...), ("processing",...), ("ready",...), ("failed",...), ("expired",...)]`.
3. Set `class Meta`: `db_table = "capacity_export_jobs"`, indexes list, `ordering = ["-created_at"]`.
4. Add to `db/models/__init__.py`: `from .capacity_export import CapacityExportJob`.
5. `cd apps/api && python manage.py makemigrations db --name capacity_export_job`.
6. Inspect generated migration; confirm no FK collisions; commit.
7. `python manage.py migrate db` locally to verify.

## Todo List

- [ ] Write `capacity_export.py` (<150 LOC)
- [ ] Register in `__init__.py`
- [ ] Generate migration
- [ ] Apply migration locally
- [ ] Sanity-check via Django shell (`CapacityExportJob.objects.create(...)` then delete)

## Success Criteria

- Migration applies clean on fresh DB.
- Model importable: `from plane.db.models import CapacityExportJob`.
- Indexes present in `\d capacity_export_jobs`.

## Risk Assessment

| Risk                            | Likelihood | Impact | Mitigation                                                                |
| ------------------------------- | ---------- | ------ | ------------------------------------------------------------------------- |
| `member_ids` JSON not queryable | Low        | Low    | Only need exact-set filter for dup detection; JSON `@>` works on Postgres |
| Schema change later             | Med        | Low    | Add fields via new migration; no public API yet                           |

## Security Considerations

- `file_url` may contain presigned signature — treat as semi-secret; only serialize for owner.
- No PII beyond user FK.

## Next Steps

- Unblocks Phase 02 (endpoint creates this row) and Phase 03 (Celery task updates it).
