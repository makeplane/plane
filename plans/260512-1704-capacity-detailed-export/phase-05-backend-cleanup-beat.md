# Phase 05 — Backend: Cleanup Beat Task

## Context Links

- BE research §8 (Celery beat schedule)
- Reference: `plane/bgtasks/exporter_expired_task.py`

## Overview

- Priority: P2
- Status: pending
- Brief: Daily Celery beat task deletes expired XLSX files from S3 and marks `CapacityExportJob` rows as `expired`.

## Key Insights

- Only operate on rows where `expires_at < now()` AND `status = 'ready'`.
- Deletion is best-effort; if S3 delete fails, still mark expired and log.
- Idempotent — safe to re-run.

## Requirements

**Functional**

- Task `cleanup_expired_capacity_exports()`:
  - Queries jobs with `status='ready'` and `expires_at__lt=now()`.
  - For each: deletes S3 object by `file_key`, sets `status='expired'`, clears `file_url`.
- Scheduled daily via Celery beat (UTC 04:00).

**Non-functional**

- Batch with `.iterator(chunk_size=500)` to avoid memory issues.
- File <100 LOC.

## Architecture

```
cleanup_expired_capacity_exports()
├─ qs = CapacityExportJob.objects.filter(status="ready", expires_at__lt=now())
├─ s3 = build_s3_client()  # reuse export_utils pattern
├─ for job in qs.iterator(500):
│    try: s3.delete_object(Bucket=..., Key=job.file_key)
│    except: log_exception(...)
│    job.status = "expired"; job.file_url = ""; job.save(update_fields=...)
```

## Related Code Files

**Create**

- `apps/api/plane/bgtasks/capacity_export_cleanup_task.py`

**Modify**

- `apps/api/plane/celery.py` — add entry to `app.conf.beat_schedule`

## Implementation Steps

1. Implement task with `@shared_task` decorator.
2. Build S3 client (MinIO vs AWS detection mirrors `export_utils.py`).
3. Bulk-update jobs in chunks; per-job S3 delete in try/except.
4. Register in `celery.py`:
   ```python
   "cleanup-expired-capacity-exports": {
       "task": "plane.bgtasks.capacity_export_cleanup_task.cleanup_expired_capacity_exports",
       "schedule": crontab(hour=4, minute=0),
   },
   ```
5. Add log line summary: `processed=N, deleted=M, failed=K`.

## Todo List

- [ ] Cleanup task
- [ ] Beat schedule entry
- [ ] Manual test: create job with `expires_at=now()-1m`, run task, verify expired

## Success Criteria

- After run, no ready jobs with `expires_at < now()`.
- S3 objects no longer accessible.
- Job rows transitioned to `expired`.

## Risk Assessment

| Risk                                | Likelihood | Impact | Mitigation                              |
| ----------------------------------- | ---------- | ------ | --------------------------------------- |
| S3 partial delete (object orphaned) | Low        | Low    | Log + alarm; manual sweep tool optional |
| Task overlap (long run + next tick) | Low        | Low    | Beat at 04:00; expected runtime <1 min  |

## Security Considerations

- Removing presigned URLs prevents reuse after deletion.

## Next Steps

- None.
