# Phase 03 — Backend: Celery XLSX Generation Task

## Context Links

- BE research §1, §2, §4A, §4B, §5, §8, §9
- Refactor source: `apps/api/plane/bgtasks/export_utils.py::upload_to_s3` (extract pure upload+presign helper)
- Pattern: `apps/api/plane/bgtasks/worklog_export_task.py`

<!-- Updated: Validation Session 1 - S3 upload strategy clarified -->

**S3 helper decision (validation):** Existing `upload_to_s3()` already handles MinIO + 7-day presigned URL, but is hardcoded to:

- `ExporterHistory.objects.get(token=token_id)` (wrong model — we have `CapacityExportJob`)
- ContentType `application/zip` + `.zip` filename
- Public-read ACL

**Action:** Extract a generic helper `upload_bytes_and_presign(buffer, key, content_type, expires_in=7*24*3600) -> str` in `export_utils.py` that returns the presigned URL only. Leave `upload_to_s3()` intact (rewrite its body to call the new helper, preserving its ExporterHistory side-effect for backwards compatibility). The new XLSX task calls the new helper directly and updates `CapacityExportJob` itself. MinIO `MINIO_EXTERNAL_ENDPOINT` handling preserved verbatim.

## Overview

- Priority: P1
- Status: pending
- Brief: Celery task generates per-member XLSX with summary sheet, uploads to S3, presigns 7d URL, updates job row, triggers email + notification.

## Key Insights

- `openpyxl write_only=True` is **mandatory** — bounded memory; cannot revisit cells.
- Stream worklogs with `.iterator(chunk_size=2000)` per member to keep memory flat.
- Summary sheet MUST be created and headers written **before** per-member sheets (write_only is forward-only).
  - Strategy: write summary headers first; collect per-member totals **while iterating** per-member sheets; append summary rows at end.
  - Alternative (simpler, lower memory ceiling fine for summary which is small): pre-compute totals via one aggregation query, then write summary sheet first, then per-member detail sheets.
  - **Choose alternative** — totals aggregation is cheap (`.values("logged_by").annotate(Sum)`), summary written first.
- Sheet name sanitization: ≤31 chars, strip `: \ / ? * [ ]`, dedupe `-2/-3`.
- NULL categories → empty cell (not "None").
- Watermark row: row 1 of each member sheet (before header) — "Generated for {email} on {ts}" — single cell merged optional; simpler to write as plain row 1, headers row 2.

## Requirements

**Functional**

- Task signature: `generate_capacity_xlsx_export(job_id: str)`.
- Updates `CapacityExportJob.status`: `queued → processing → ready` (or `failed`).
- Generates workbook:
  - Sheet 0 "Summary": columns `Member | Total Hours | Entry Count` + grand total row.
  - Sheets 1..N "{Member Display Name}": `Date | Main Category | Sub Category | Work Item | Time Spent (h)`.
  - Filename: `{workspaceSlug}-worklog-detailed-{from}_{to}.xlsx`.
- Uploads to S3, generates 7d presigned URL.
- Sets `file_key`, `file_url`, `file_size`, `row_count`, `expires_at = now + 7d`, `completed_at`.
- On success → calls Phase 04 email task + creates Notification.
- On failure → status=failed, error_message set, failure email enqueued.

**Non-functional**

- `@shared_task(soft_time_limit=300, time_limit=600)`.
- Memory ceiling: <200 MB for 250k rows (write_only + iterator).
- File <200 LOC; split helpers into `capacity_export_helpers.py`.

## Architecture

```
generate_capacity_xlsx_export(job_id)
├─ load job; set status=processing
├─ build base queryset (mirror workspace_capacity.py filter logic)
│    .select_related("issue__main_task_category", "issue__sub_task_category", "logged_by")
│    .filter(workspace__slug=..., logged_at__range=(from,to))
│    .filter(logged_by_id__in=member_ids) if provided
│    .order_by("logged_by_id", "logged_at", "issue_id")
├─ derive ordered member list (distinct logged_by ids in result)
├─ wb = Workbook(write_only=True)
├─ write Summary sheet (totals aggregated separately)
├─ for each member:
│    ws = wb.create_sheet(sanitize_name(display_name))
│    write watermark + header rows
│    stream worklogs.filter(logged_by_id=member).iterator(2000)
│    append rows; accumulate row_count
├─ save to BytesIO buffer
├─ upload buffer to S3 (reuse upload_to_s3 OR direct boto3 if signature differs)
├─ generate presigned URL (7d)
├─ update job: ready, file_url, file_key, file_size, row_count, expires_at, completed_at
├─ enqueue capacity_export_email_task.delay(job_id)
└─ create Notification(receiver=requested_by, entity_name="capacity_export", entity_identifier=job.id, message_html=download_link)
```

## Related Code Files

**Create**

- `apps/api/plane/bgtasks/capacity_export_task.py` (main task)
- `apps/api/plane/bgtasks/capacity_export_helpers.py` (sanitize_sheet_name, build_queryset, write_summary_sheet, write_member_sheet)

**Modify**

- (none — Celery auto-discovers `bgtasks/*.py`)

## Implementation Steps

1. Helpers module first:
   - `sanitize_sheet_name(name, used: set) -> str`: strip illegal chars, truncate 31, dedupe with `-2`, `-3`.
   - `build_worklog_queryset(job) -> QuerySet`: scoped + ordered.
   - `compute_member_totals(qs) -> list[dict]`: `.values("logged_by_id","logged_by__display_name").annotate(total=Sum("duration_minutes"), entries=Count("id"))`.
   - `write_summary_sheet(wb, totals, t_strings)`: appends header + member rows + grand total.
   - `write_member_sheet(wb, member, qs, used_names, requester_email, t_strings) -> int` (returns row count).
2. Main task in `capacity_export_task.py`:
   - `@shared_task(bind=True, soft_time_limit=300, time_limit=600)`.
   - Try/except wrapping; on `SoftTimeLimitExceeded` → status=failed with reason "timeout".
   - Use `io.BytesIO()`; `wb.save(buffer)`; `buffer.seek(0)`.
   - S3 upload: call new `upload_bytes_and_presign(buffer, key, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")` from `export_utils.py`.
   - Presigned URL (`ExpiresIn=7*24*3600`) returned by helper; MinIO `MINIO_EXTERNAL_ENDPOINT` handled inside.
   - Update job row in single `save(update_fields=...)`.
   - Create Notification (workspace_id=job.workspace_id, receiver=job.requested_by).
   - Enqueue email task.
3. Logging: `from plane.utils.exception_logger import log_exception` on failure.
4. Failure email path: enqueue with `is_failure=True` flag (handled in Phase 04).

## Todo List

- [ ] Helpers module with sanitize + queryset builders
- [ ] Main task with status transitions
- [ ] S3 upload + presigned URL (7d)
- [ ] Notification creation
- [ ] Email task enqueue (success + failure)
- [ ] Manual test: small range (1 day, 2 members)
- [ ] Manual test: large range (full year, all members) — verify memory + time

## Success Criteria

- Job transitions queued → processing → ready (happy path).
- XLSX opens in Excel/LibreOffice without warnings.
- Summary sheet totals = sum of member sheet rows.
- NULL categories render as empty cells.
- Sheet names sanitized + deduped.
- 250k-row job completes <5 min, file ≤80 MB.
- On failure: status=failed, error_message populated, failure email sent.

## Risk Assessment

| Risk                 | Likelihood | Impact | Mitigation                                                      |
| -------------------- | ---------- | ------ | --------------------------------------------------------------- |
| Soft time limit hit  | Med        | Med    | Tune queryset, monitor; raise to 600s only if justified         |
| Memory blowup        | Low        | High   | write_only + iterator; do NOT pre-materialize lists             |
| S3 upload fails      | Low        | High   | Try/except; failure path sets failed + email                    |
| Sheet name collision | Med        | Low    | sanitize+dedupe utility, unit tested                            |
| Worklog count = 0    | Med        | Low    | Still produce workbook with Summary "No data" row; user clarity |

## Security Considerations

- Watermark every member sheet row 1: `Generated for {requester.email} on {iso_ts}` — discourages forwarding.
- Presigned URL has 7d TTL; not extendable.
- Cross-workspace path: job creation already blocked in endpoint (Phase 02); task additionally asserts to be safe.

## Next Steps

- Triggers Phase 04 (email + notification).
- Cleanup handled by Phase 05.
