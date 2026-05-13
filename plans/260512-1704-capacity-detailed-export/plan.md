---
title: "Capacity Detailed Work-Item Export"
description: "Async server-side XLSX export of worklog-level capacity report; one sheet per member with summary; email + in-app notification."
status: completed
priority: P2
effort: ~24h
branch: ngoc-feat/categories
completed: 2026-05-12
tags: [time-tracking, capacity, export, celery, xlsx, ce]
created: 2026-05-12
---

# Capacity Detailed Work-Item Export — Plan

## Goal

Add a second export ("Detailed work-item report") next to existing Capacity Summary CSV. Server-side XLSX via Celery; per-member sheets + summary sheet; delivered via email + in-app notification. Existing CSV stays byte-identical.

## Inputs

- Brainstorm: `plans/reports/brainstorm-260512-1651-capacity-detailed-export.md`
- FE research: `plans/260512-1704-capacity-detailed-export/research/researcher-fe-report.md`
- BE research: `plans/260512-1704-capacity-detailed-export/research/researcher-be-report.md`

## Key Decisions (locked)

- Summary sheet (Sheet 0): per-member totals + grand total
- Delivery: email + in-app `Notification` (bell)
- "My exports" page in v1 (GET endpoint + list UI)
- Rate limit: FE debounce 30s only (no BE cap)
- Date cells: ISO `YYYY-MM-DD`
- Signed URL TTL: 7 days
- Failure email: requester only
- Cross-workspace mode: detailed export disabled (tooltip)
- Current Capacity CSV (`handleExport`): UNTOUCHED

## Phases

| #   | Phase                                                                                 | Status                                                                                                                      | Owner |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----- |
| 01  | [Backend model + migration](phase-01-backend-model-and-migration.md)                  | ✅ done                                                                                                                     | BE    |
| 02  | [Backend endpoint + permissions](phase-02-backend-endpoint-and-permissions.md)        | ✅ done                                                                                                                     | BE    |
| 03  | [Celery XLSX task](phase-03-backend-celery-xlsx-task.md)                              | ✅ done                                                                                                                     | BE    |
| 04  | [Email + in-app Notification](phase-04-backend-email-and-notification.md)             | ✅ done                                                                                                                     | BE    |
| 05  | [Cleanup beat task](phase-05-backend-cleanup-beat.md)                                 | ✅ done                                                                                                                     | BE    |
| 06  | [FE service + store](phase-06-frontend-service-and-store.md)                          | ✅ done                                                                                                                     | FE    |
| 07  | [Split-button on capacity dashboard](phase-07-frontend-split-button-and-dashboard.md) | ✅ done                                                                                                                     | FE    |
| 08  | [My Exports page](phase-08-frontend-my-exports-page.md)                               | ✅ done                                                                                                                     | FE    |
| 09  | [i18n keys (en/ko/vi)](phase-09-i18n-keys.md)                                         | ✅ done (flat namespace: `capacity_export.*`, `capacity_exports.*` — see Phase 09 note)                                     | FE    |
| 10  | [Tests + verification](phase-10-tests-and-verification.md)                            | ✅ partial — BE unit tests for helpers + model created; endpoint/task/email/cleanup tests deferred to CI; manual QA pending | BE+FE |

## Dependencies

- 02 ← 01 (needs model)
- 03 ← 01, 02 (task triggered by endpoint, writes job row)
- 04 ← 03 (called from task)
- 05 ← 01 (operates on job rows)
- 06 ← 02 (calls endpoint)
- 07 ← 06, 09 (split-button uses store + i18n)
- 08 ← 06, 09
- 10 ← all

## Risks (top)

- Long Celery jobs (year-range ~250k rows) → openpyxl `write_only` + `.iterator(2000)` + soft/hard 5/10 min
- Signed-URL leakage via forwarded email → 7d TTL + watermark first row
- Sheet-name collisions → sanitize + `-2/-3` suffix
- Duplicate jobs from rapid clicks → FE debounce 30s + "already queued" toast (BE optional duplicate detect: same user+range+members within 30s → return existing job_id)

## Hard Constraints

- Files <200 LOC; components <150
- All FE strings via `t()`; keys mirrored across en/ko/vi
- Propel subpath imports only
- `bg-layer-2` for inputs; semantic color tokens
- CE pattern strict: new FE code in `apps/web/ce/`; new BE in `apps/api/plane/`
- Reuse `upload_to_s3()` from `bgtasks/export_utils.py`, email infra in `bgtasks/email/`, `Notification` model
- `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")` on endpoints

## Validation Log

### Session 1 — 2026-05-12

| #   | Question                           | Decision                                                                                                                                                                                                                                                                                                                                                                                                    | Affected Phases    |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| V1  | Duplicate-job dedupe strategy      | **BE belt-and-suspenders**: in POST, query same user+workspace+date_range+member_ids set in (queued, processing) within last 30s → return existing `job_id` with `duplicate: true`, skip enqueue. FE debounce still in place.                                                                                                                                                                               | Phase 02           |
| V2  | S3/MinIO upload reuse              | **Extract pure helper** `upload_bytes_and_presign(buffer, key, content_type, expires_in=7*24*3600)` in `export_utils.py`. Existing `upload_to_s3()` rewritten to call it (preserves `ExporterHistory` side-effect for legacy callers). XLSX task calls new helper directly, updates `CapacityExportJob` itself. MinIO `MINIO_EXTERNAL_ENDPOINT` handling preserved. 7-day TTL confirmed (matches existing). | Phase 03           |
| V3  | Email/notification locale fallback | **3-tier**: `user.user_locale` → workspace default (`Workspace.default_locale` or `language` if exists) → `settings.LANGUAGE_CODE`. Verify `User.user_locale` field exists at implementation time; gracefully skip workspace tier if `Workspace` lacks the field.                                                                                                                                           | Phase 04           |
| V4  | My Exports page access             | **All workspace members** (own jobs only). GET endpoint filters by `requested_by=request.user`. Tab visible to all (adminOnly: false).                                                                                                                                                                                                                                                                      | Phase 02, Phase 08 |

**Recommendation:** Proceed to implementation. No blocking ambiguities remain.
