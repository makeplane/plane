# Backend retry plan — Team Operations Dashboard

Owner: backend worker (ctx_b53d3bda88a4)
Branch: ba0f3/team-operations-dashboard
Starting HEAD: e35561b6e1
Frontend owner: ctx_3fd621777db4 (apps/web/** + packages/** — NOT my files)

## Defects to fix (apps/api/\*\*)

| #   | File                                                           | Defect                                                                                                           |
| --- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | `plane/analytics/dashboard/snapshot.py`                        | Uses SAVEPOINT outside atomic + swallows all exceptions. Real RR semantics false.                                |
| 1b  | `plane/app/views/dashboard.py`                                 | Only workload/projects/timeline wrap `with dashboard_snapshot():`. Overview/attention/items do NOT.              |
| 2   | `plane/app/views/dashboard.py::DashboardItemsEndpoint`         | `metric=payload.get('metric')` ignores agreed `selection.metric`.                                                |
| 3   | `plane/analytics/dashboard/items.py::list_items`               | Always filters `completed_at` regardless of `request.delivery_base`. Clicking Created series returns wrong rows. |
| 3b  | `plane/analytics/dashboard/items.py::_apply_selection_filters` | Joins may duplicate rows; counts use `.distinct()` but rows qs not distinct.                                     |
| 4   | `plane/analytics/dashboard/projects.py`                        | `next_deadline` Min(target_date) uses `_open_q()` (includes overdue). Contract says nearest UPCOMING.            |

## Deferred-but-required additions (per brief)

- Add real RR snapshot proof with `django_db(transaction=True)` + concurrent write OR real standalone runtime harness.
- SQL section failure must not poison all sections — confirm or harden.
- Workload regression fixtures previously deferred:
  - multi-project member appearing once in roster
  - zero-work active member
  - inactive/former-member with retained assignment
  - account_active vs membership_active separation
  - unassigned/completed-in-period actual (not fake 0)
- Projects: 5 state_group counts + total distinct, business filters consistent, timeline ACL matches dashboard not joined-only, real date rows no fake history.
- Audit `no_update` activity writers; if deferred per spec, document actual coverage gap.
- Canonical contract shared by overview previews + dedicated endpoints.

## Infrastructure (per brief §8)

- Run real backend port 8100 isolated dedicated data (main :8000/DB and web :3000 untouched).
- Existing compose test project `plane-dashboard-ops-test` (no published ports).
- Dedicated persistent QA API/database for frontend :3100.
- Seed useful team/projects/cycles/issues fixture.
- Share endpoint/readiness and local QA login with coordinator in local file (avoid secret logs).
- Auth/CSRF/CORS for :3100 configured local only.
- Don't wait until final — frontend needs API now.

## Benchmark (per brief §9)

- 10k issues / 20 projects / 50 members.
- Cold + warm metrics, request query count, p50/p95, payload size.
- Target: warm ≤1.5s, cold ≤3s.
- Fix gross N+1 if fails.
- No unstated perf claims.

## Test + evidence (per brief §10)

- Run all focused tests + AnalyticsV2 appcontracts + legacy dashboard regressions full log real exit.
- Existing 237 pass worker log alone NOT final proof.
- Baseline vs new failures precise.
- Final backendreport exact commands/evidence/new commits, no required deferrals.

## Constraints

- No `git add -A` / no reverting others' files.
- No production deploy / push / merge.
- No nested workers.
- Only orchestration ask if truly blocked.
- Read coordinator messages checkpoints and BEFORE done.

## Execution sequence

1. Fix `snapshot.py` (proper txn, real RR proof, swallow no exceptions silently).
2. Wire snapshot into overview/attention/items endpoints.
3. Fix `DashboardItemsEndpoint` to use `selection.metric`.
4. Fix `list_items` to honor `delivery_base`; ensure distinct rows.
5. Fix `projects.py` `next_deadline` to filter `target_date__gte=scope.today`.
6. Add workload regression fixtures for multi-project / zero-work / inactive / completed-in-period / unassigned.
7. Audit `no_update` activity writers.
8. Stand up isolated API on :8100 with dedicated DB + seed fixture.
9. Configure Auth/CSRF/CORS for frontend :3100.
10. Share endpoint+login with coordinator via local file.
11. Benchmark 10k/20p/50m, measure query count/p50/p95/payload size.
12. Run full regression suite; capture log; compare baseline vs new.
13. Update `docs/superpowers/reports/2026-09-27-team-dashboard-backend.md` with evidence.
14. `worker_done` via `orca orchestration send`.
