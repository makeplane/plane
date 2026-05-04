# Phase 3: Propagation API Endpoint, Persistence & Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 03-Propagation API Endpoint, Persistence & Contract
**Mode:** `--auto` (recommended options auto-selected; no user prompts)
**Areas discussed:** URL & routing, Permission strategy & code envelope, HTTP status mapping, Serializer responsibilities, Transaction boundary & locking, INCOMPLETE_SCHEDULE detection layer, Activity & webhook fan-out timing, Soft-delete / archive / draft filtering, Cross-project queryset annotation, Stable error code source, Unrelated DB exception handling, Test layout & fixtures, Lint-grep purity invariant scope

---

## URL & routing (D-01)

| Option                                                                            | Description                                                                                                                  | Selected |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| `/projects/<project_id>/timeline-propagation/`                                    | Project-scoped POST, dragged work-item id in the body. Project is the same-project propagation boundary (PROP-16).           | ✓        |
| `/projects/<project_id>/issues/<issue_id>/timeline-propagation/`                  | Nested under work-item id. Implies "drag this specific issue" but the project bounds the graph, not the issue.               |          |
| `/timeline-propagation/` (workspace-scoped)                                       | Skips project segment. Loses the same-project boundary in the URL — would need to re-derive it from the body.                |          |

**Auto-selected:** Option 1 (project-scoped). ROADMAP "Risks/open questions" already preferred this; locked here.
**URL `name`:** `project-timeline-propagation`.

---

## Permission strategy & code envelope (D-02)

| Option                                                                            | Description                                                                                                                  | Selected |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| Inline `ProjectMember` filter mirroring decorator logic; `_error(...)` envelope    | View does its own membership check, returns the standard `{code, message}` envelope. Touches no shared code.                 | ✓        |
| `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` decorator                          | Reuses standard idiom, but the decorator returns `{"error": "..."}` (incompatible with our wire contract).                   |          |
| Modify `allow_permission` to return new envelope when called with a flag         | Cleanest reuse, but touches a decorator used by dozens of unrelated views. High blast radius.                                |          |
| Add a sibling decorator `@allow_permission_with_envelope(...)` in `permissions/`  | New idiom for one endpoint. Premature abstraction.                                                                            |          |

**Auto-selected:** Option 1 (inline check). Keeps blast radius zero; the helper `_error(...)` is module-private.
**Sub-decision (D-02b):** Workspace-admin-without-project-member fallback NOT mirrored — least-privilege for write endpoint that touches up to 100 work items.

---

## HTTP status code mapping (D-03)

| Option                                                                            | Description                                                                                                                  | Selected |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| 403 / 409 / 422 split (PERMISSION_DENIED=403, SCHEDULE_CHANGED=409, rest=422)     | Mixed RFC 9110 mapping: 403 for authz, 409 for stale state, 422 for domain invariants. Industry standard.                    | ✓        |
| All failures 400                                                                  | Simpler, but loses the 403/409 vs 422 distinction the client uses to decide retry strategy.                                  |          |
| All domain failures 200 with `{code, message}` body                               | Avoids HTTP 4xx surprises in middleware; loses standard semantics.                                                            |          |
| 422 across the board including PERMISSION_DENIED and SCHEDULE_CHANGED             | Uniform but throws away the 403 / 409 affordances the client/UX layer needs.                                                  |          |

**Auto-selected:** Option 1 (split mapping). Pinned per error code in CONTEXT.md table; tested per code (D-14).

---

## Serializer responsibilities — structural vs semantic (D-04)

| Option                                                                            | Description                                                                                                                  | Selected |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| Serializer = structural only; algorithm owns INVALID_DATE_RANGE                   | Fields/types/required-ness on serializer; `target<start` / duration mismatch caught by `propagate_move`. One failure surface. | ✓        |
| Serializer also enforces `target>=start`, duration preservation                   | DRF idiomatic, but creates two failure surfaces (DRF 400 vs envelope 422) — wire contract becomes context-dependent.         |          |
| Skip serializer entirely; parse `request.data` manually                           | Minimal; loses DRF schema generation and field-level validation messages.                                                     |          |

**Auto-selected:** Option 1. Locks the wire contract: `{code, message}` envelope is THE failure shape for the 7 codes; DRF 400 only for parse errors.

---

## Transaction boundary, locking, and bulk_update mechanics (D-05)

| Option                                                                            | Description                                                                                                                  | Selected |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| `transaction.atomic()` + `select_for_update()` on dragged row + `bulk_update`     | Lock dragged row inside transaction, run algorithm, single `bulk_update`, post-commit fan-out via `on_commit`.               | ✓        |
| `transaction.atomic()` + `select_for_update()` on EVERY potentially-affected row  | Pre-locks the whole graph. Massive lock footprint; reduces concurrency for unrelated drags.                                  |          |
| No explicit lock; rely on Postgres READ COMMITTED + `bulk_update` atomicity       | Simpler, but exposes a race between `expected_versions` check and `bulk_update`.                                              |          |
| `select_for_update(skip_locked=True)` + synthetic `SCHEDULE_CHANGED` if locked    | Instant-fail on concurrent drag. UX edge case; defer.                                                                         |          |

**Auto-selected:** Option 1. Sub-decisions:
- `now = timezone.now()` captured once and used for every updated row's `updated_at` (D-05a) — deterministic test assertions.
- `Issue.DoesNotExist` on dragged row → `PERMISSION_DENIED` 403 (not 404) to avoid info-leak (D-05c).
- `bulk_update` fields: `["start_date", "target_date", "updated_at"]` (existing endpoints don't include `updated_at`; latent bug we don't replicate).

---

## INCOMPLETE_SCHEDULE detection layer (D-06)

| Option                                                                            | Description                                                                                                                  | Selected |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| Algorithm catches it (Phase 2 D-06 step 3); view does not pre-check                | Single failure surface. View trusts `ScheduledWorkItem(start_date=None, ...)` flowing in.                                    | ✓        |
| View pre-checks the dragged Issue's dates and returns 422 directly                | Duplicates Phase 2 D-06; can drift if Phase 2 changes detection rules.                                                        |          |

**Auto-selected:** Option 1. Honors deep-module discipline.

---

## Activity & webhook fan-out timing (D-07, D-08, D-09)

| Option                                                                            | Description                                                                                                                  | Selected |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| All `.delay(...)` calls inside `transaction.on_commit(lambda: ...)`               | New pattern in this codebase; audit + webhook fire only on successful commit. No leaks on rollback.                          | ✓        |
| `.delay(...)` immediately before `bulk_update` (existing `IssueBulkUpdateDateEndpoint` pattern) | Mirrors current code; can leak events when `bulk_update` fails.                                                  |          |
| `.delay(...)` immediately AFTER `bulk_update` (still inside transaction)          | Marginally better than before, but Celery worker can pick the task up before commit lands → reads pre-commit state.          |          |

**Auto-selected:** Option 1. Phase 3 establishes the pattern; existing endpoint left alone (API-11) but recorded in `<deferred>`.

---

## Soft-delete / archive / draft filtering (D-10)

| Option                                                                            | Description                                                                                                                  | Selected |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| Filter at view level: `Issue.issue_objects.filter(archived_at__isnull=True, is_draft=False)` + `IssueRelation.objects.filter(deleted_at__isnull=True)` | Honors Phase 1 D-05's caller-filters-it contract.    | ✓        |
| Push filtering into the loader                                                    | Would require the loader to JOIN onto Issue → couples loader to ORM model fields. Phase 1 D-05 explicitly rejects this.       |          |
| No filtering; let the algorithm process draft/archived rows                       | Wrong semantics — archived items shouldn't propagate dates.                                                                   |          |

**Auto-selected:** Option 1.

---

## Cross-project queryset annotation (D-11)

| Option                                                                            | Description                                                                                                                  | Selected |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| `.annotate(issue_project_id=F(...), related_project_id=F(...))`                   | Exposes both endpoints' project_id as cheap single-column reads. Phase 1 `_make_edge` prefers these names.                   | ✓        |
| Rely on `.select_related("issue", "related_issue")` only; loader reads `row.issue.project_id` | Works but reads the related Issue object attribute; Pitfall 2 (Phase 1) flagged this as fragile.                |          |
| Run two queries (relations, then issues by id)                                    | More round-trips; loses the JOIN efficiency.                                                                                  |          |

**Auto-selected:** Option 1.

---

## Error-code source (D-12)

| Option                                                                            | Description                                                                                                                  | Selected |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| Import `PropagationErrorCode` from `plane.app.services.timeline_propagation`      | Single source of truth. Renaming a code at Phase 2 fails the import (build-time signal, not runtime).                         | ✓        |
| Re-define wire codes as string literals in the view                               | Fast; defeats the point of having a typed enum and risks drift between algorithm and HTTP layer.                              |          |
| Define a separate `WireErrorCode` mapping that translates from `PropagationErrorCode` | Pre-introduces a translation seam for no current need.                                                                    |          |

**Auto-selected:** Option 1.

---

## Unrelated DB exception handling (D-13)

| Option                                                                            | Description                                                                                                                  | Selected |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| Let `BaseAPIView.handle_exception` produce its existing 4xx/500 envelope          | `IntegrityError`, `OperationalError`, etc. are operations problems and should surface as 500 to feed monitoring.             | ✓        |
| Catch and wrap into a synthetic `INTERNAL_ERROR` `{code, message}` envelope       | Hides the failure type from monitoring; the 7 wire codes are domain failures only.                                            |          |
| Catch only `IntegrityError`, surface as `SCHEDULE_CHANGED`                        | Conflates concurrency conflicts with the explicit stale check; misleading.                                                    |          |

**Auto-selected:** Option 1.

---

## Test layout & fixtures (D-14)

| Option                                                                            | Description                                                                                                                  | Selected |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| New `IssueFactory` + `IssueRelationFactory` in `tests/factories.py`               | Reusable across unit and contract suites; declarative chained factories.                                                     | ✓        |
| Inline `Issue.objects.create(...)` per test (Phase 1 unit pattern)                | Works for ~5 issues per test; gets noisy at 101 issues for the limit test.                                                    |          |
| Fixture-only (conftest); no factory_boy                                           | Couples conftest to specific shapes; less reusable than factory_boy.                                                          |          |

**Auto-selected:** Option 1. Required for the 101-issue PROPAGATION_LIMIT_EXCEEDED test.

---

## Lint-grep purity invariant scope (D-15)

| Option                                                                            | Description                                                                                                                  | Selected |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| Phase 2's purity test stays scoped to `services/timeline_propagation`             | View and serializer must import DRF; extending the test would falsely flag legitimate imports.                               | ✓        |
| Extend purity test to flag DRF imports in `services/` only                        | Unchanged in spirit; Phase 2's test already does this.                                                                       |          |
| Add a new "no business logic in views" test                                       | Hard to define structurally; defer until needed.                                                                              |          |

**Auto-selected:** Option 1 (no purity-test changes in Phase 3).

---

## Claude's Discretion

The auto-mode chose recommended options for every gray area above. Specific call-outs the user may want to revisit during plan-phase:

- **HTTP status for `INVALID_DATE_RANGE`** — chose 422 (uniform with the other 4 domain failures). Alternative is 400.
- **Whether to lock the dragged row blocking vs `skip_locked=True`** — chose blocking. Trade-off: predictable wait vs instant fail.
- **Whether `client_preview_count` is required** — chose optional.
- **Whether to expose `cycle` path / boundary-edge ids in the failure envelope** — chose `{code, message}` only; defer richer payload to Phase 4-5.
- **Whether to set `updated_at` explicitly in `bulk_update`** — chose yes (single SQL statement; one consistent value across the array).

## Deferred Ideas

- Retroactively fixing `IssueBulkUpdateDateEndpoint` to use `transaction.on_commit` (out of scope per API-11).
- Workspace-admin-without-project-member fallback (least-privilege today; revisit on product signal).
- Cycle path / boundary-edge ids in the failure envelope (additive Phase 4-5 enhancement).
- `select_for_update(skip_locked=True)` for instant-fail on concurrent drag.
- `drf-spectacular` schema annotation for the new endpoint (auto-picked-up if `ENABLE_DRF_SPECTACULAR=1`).
- Higher per-package coverage gate beyond the existing `--fail-under=90` (not needed in Phase 3).
- Optimistic concurrency via a dedicated `version` integer column on `Issue` (explicitly out of scope; reuse `updated_at`).
- Audit logging the propagation outcome itself as a `PropagationLog` row (defer until ops needs forensic trace).
