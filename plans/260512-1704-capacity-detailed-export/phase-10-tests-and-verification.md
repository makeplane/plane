# Phase 10 — Tests & Verification

## Context Links

- All previous phases
- Test runner: `cd apps/api && python run_tests.py`

## Overview

- Priority: P1
- Status: pending
- Brief: BE unit + integration tests for model/endpoint/task; FE smoke (lint+typecheck+manual click); manual QA checklist covering happy path + edge cases.

## Key Insights

- BE: Django `TestCase` (db). Mock S3 + email; test task logic synchronously via `task.apply()` (no broker).
- FE: rely on TS strict + lint; manual click-through (component-level test infra is light in this repo).
- Manual QA must verify byte-identical CSV.

## Requirements

**BE Unit Tests**

- `CapacityExportJob` model: create, status transitions, ordering, indexes used by `EXPLAIN`.
- Endpoint POST: 202 happy path, 400 on cross_workspace, 400 on bad date range, 400 on foreign member_ids, 403 on guest.
- Endpoint GET: returns only own jobs, ordered desc, limit 50.
- Task: with mocked S3 + email — builds workbook, transitions status, sets file metadata, creates Notification, enqueues email task. Test sanitize_sheet_name edge cases (collisions, long names, illegal chars).
- Cleanup task: marks expired, calls S3 delete.

**FE Smoke**

- `pnpm check:lint` clean.
- `pnpm check:format` clean.
- TypeScript build no errors.
- Manual: split-button renders; both items clickable; cross-workspace tooltip; debounce; My Exports table renders; download works.

**Manual QA Checklist**

- [ ] Capacity summary CSV byte-identical to baseline (diff before/after)
- [ ] Detailed export queues → email arrives → download works
- [ ] XLSX opens in Excel + LibreOffice
- [ ] Summary sheet sums match detail sheet totals
- [ ] Per-member sheet has watermark row 1
- [ ] NULL categories render empty
- [ ] Sheet names sanitized (test member named `A/B\C:D*E[F]G`)
- [ ] Two members same display name → `Name`, `Name-2`
- [ ] Cross-workspace toggle disables detailed item with tooltip
- [ ] Double-click within 30s → second click blocked, tooltip shown
- [ ] My Exports page lists job, polling auto-refreshes
- [ ] Failure path: simulate exception → failed status, apology email
- [ ] Notification appears in bell sidebar
- [ ] Expired job: status flips to `expired`, download disabled
- [ ] Permissions: guest user gets 403 on POST

## Related Code Files

**Create**

- `apps/api/plane/tests/test_capacity_export_model.py`
- `apps/api/plane/tests/test_capacity_export_endpoint.py`
- `apps/api/plane/tests/test_capacity_export_task.py`
- `apps/api/plane/tests/test_capacity_export_helpers.py`

## Implementation Steps

1. Write helper tests first (pure functions: sanitize_sheet_name, build_worklog_queryset filters).
2. Model tests (CRUD, indexes).
3. Endpoint tests using `APIClient`, authenticated user.
4. Task tests: monkey-patch S3 client, capture buffer, parse with openpyxl read-only to assert content.
5. Run `python run_tests.py` and iterate until green.
6. FE: run `pnpm check:lint`, `pnpm check:format`, build.
7. Execute manual QA checklist above.

## Todo List

- [ ] Helper tests
- [ ] Model tests
- [ ] Endpoint tests
- [ ] Task tests (S3 mocked)
- [ ] Cleanup task test
- [ ] All BE tests green
- [ ] FE lint + format + build green
- [ ] Manual QA checklist 100% pass

## Success Criteria

- All BE tests pass; coverage of new code ≥80%.
- Lint+format+build clean.
- Manual QA checklist 100%.

## Risk Assessment

| Risk                     | Likelihood | Impact | Mitigation                                       |
| ------------------------ | ---------- | ------ | ------------------------------------------------ |
| Flaky task test (timing) | Low        | Low    | Use `apply()` not `delay()`; avoid sleep         |
| Mocking S3 wrong shape   | Med        | Low    | Patch boto3 client at module level; assert calls |

## Security Considerations

- Tests must not use real S3 / real SMTP.

## Next Steps

- Hand off for code review and merge.
