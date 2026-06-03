# Phase 02 — Backend: Endpoints, Serializer, URL Routing

## Context Links

- BE research §3, §4D, §10
- Pattern: `apps/api/plane/app/views/exporter/base.py` (ExportIssuesEndpoint)
- Filter source: `apps/api/plane/app/views/workspace/time_tracking/workspace_capacity.py`

## Overview

- Priority: P1
- Status: pending
- Brief: REST endpoints to enqueue + list capacity export jobs. Filter parity with capacity GET endpoint.

## Key Insights

- POST returns 202 + job_id (async).
- GET returns paginated list of own jobs (My Exports).
- Cross-workspace detailed export is blocked at API level too (defense in depth) — return 400 with i18n-able error code.
- Validate `date_from <= date_to` and member_ids belong to workspace.

## Requirements

**Functional**

- `POST /api/workspaces/<slug>/capacity/exports/`
  - Body: `{ date_from, date_to, member_ids?, cross_workspace, format: "xlsx" }`
  - Validates, creates `CapacityExportJob` (status=queued), `.delay()` Celery task, returns `{ job_id, message, status }` 202.
  - Rejects `cross_workspace=true` with 400 (`detailed_export_cross_workspace_not_supported`).
- `GET /api/workspaces/<slug>/capacity/exports/`
  - Returns own jobs, latest 50, ordered by `-created_at`.
  - Each item: id, status, date_from, date_to, member_count, file_url (if ready & not expired), file_size, expires_at, created_at, completed_at, error_message.

**Non-functional**

- Permission: `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`.
- Endpoint file <200 LOC.

## Architecture

```
HTTP POST → CapacityExportEndpoint.post
  → validate payload (serializer)
  → reject if cross_workspace
  → create CapacityExportJob(status="queued")
  → generate_capacity_xlsx_export.delay(job.id)
  → 202 { job_id, message }

HTTP GET → CapacityExportEndpoint.get
  → filter by request.user + workspace
  → serialize via CapacityExportJobSerializer
  → 200 [items...]
```

## Related Code Files

**Create**

- `apps/api/plane/app/views/workspace/time_tracking/capacity_export.py`
- `apps/api/plane/app/serializers/capacity_export.py`

**Modify**

- `apps/api/plane/app/views/__init__.py` — export `CapacityExportEndpoint`
- `apps/api/plane/app/serializers/__init__.py` — export serializer
- `apps/api/plane/app/urls/workspace/time_tracking.py` (or correct urls file) — add route

## Implementation Steps

1. Serializer `CapacityExportJobCreateSerializer`:
   - Fields: `date_from`, `date_to`, `member_ids` (ListField of UUID, optional), `cross_workspace` (Bool, default False).
   - Validators: `date_from <= date_to`, range ≤ 366 days, member UUIDs exist in workspace via `WorkspaceMember`.
2. Serializer `CapacityExportJobSerializer` (read): all job fields + derived `member_count`, `is_expired` (computed).
3. View `CapacityExportEndpoint(BaseAPIView)`:
   - `post(self, request, slug)` — guard cross_workspace → 400; **dedupe check** (Validation §): query `CapacityExportJob` for same user+workspace+date_from+date_to+member_ids set+status∈{queued,processing} created within last 30s → return `{job_id, duplicate: true}` 202 without enqueue; else create job; `.delay()`; return 202.
   - `get(self, request, slug)` — list user jobs in workspace (filter `requested_by=request.user`), paginated/limit 50.
4. URL: `path("workspaces/<str:slug>/capacity/exports/", CapacityExportEndpoint.as_view(), name="capacity-exports")`.
5. Wire imports into `views/__init__.py` and `serializers/__init__.py`.
6. Add OpenAPI/docstring comments.

## Todo List

- [ ] Create create-serializer with validators
- [ ] Create read-serializer
- [ ] Implement view (POST + GET)
- [ ] Register URL
- [ ] Smoke test via `curl` or Django REST browsable API
- [ ] Confirm 403 for unauthorized roles

## Success Criteria

- POST with valid body → 202 + job row exists with status=queued.
- POST with `cross_workspace=true` → 400 with clear error code.
- POST with invalid member_ids → 400 with field error.
- GET returns only requester's jobs in this workspace.

## Risk Assessment

| Risk                              | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                 |
| --------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Member validation N+1             | Low        | Low    | Single `WorkspaceMember.objects.filter(member_id__in=...).count() == len(...)`                                                                                                                                                                                             |
| Duplicate clicks → duplicate jobs | Med        | Low    | **BE dedupe (validated)**: within last 30s, if `CapacityExportJob` exists with same `requested_by` + `date_from` + `date_to` + same member_ids set + status in ("queued","processing") → return existing `job_id` (202 with `duplicate: true` flag); skip new task enqueue |
| Permission bypass                 | Low        | High   | Decorator + scope queries by `request.user`                                                                                                                                                                                                                                |

## Security Considerations

- Validate workspace membership before listing.
- Never expose other users' jobs (GET filtered by `requested_by=request.user`).
- Validate `member_ids` belong to workspace; prevent enumeration of foreign UUIDs.

## Next Steps

- Unblocks Phase 03 (task receives job_id), Phase 06 (FE service calls endpoint).
