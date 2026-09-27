# Team Operations Dashboard — Frontend Implementation Report

**Date:** 2026-09-27
**Worker:** OpenCode frontend dispatch `ctx_3da081b0c732` (Task ID `task_994984d992b9`, Run `run_18799b918847`)
**Checkout:** `/Users/tui/orca/workspaces/plane/team-operations-dashboard` (branch `ba0f3/team-operations-dashboard`)
**Scope:** Frontend Tasks 4–7 + Tasks 8 evidence (per `/tmp/plane-dashboard-frontend-task.txt`)
**Report path:** `docs/superpowers/reports/2026-09-27-team-dashboard-frontend.md`

---

## 1. Commits delivered (frontend only)

```
e8e2dd479b fix(web): cache period snapshot, drop generation from scope deps, retarget cutover test
d09f3ede4a feat(web): add ItemDrawer with agreed selection contract (Task 6)
5dd7bc5771 feat(web): add Overview component tests (Task 5 baseline)
0cc7370976 feat(web): wire Team Operations Dashboard Tasks 4 (Task 5-7 baseline)
```

No commits touch `apps/api/**`, the backend `dashboards` worktree, the plan, or the spec. `git add` was always explicit; no `git add -A`.

## 2. Files added / modified (frontend ownership only)

| Path | Status |
|---|---|
| `packages/types/src/dashboard-operations.ts` | new — full typed contracts matching backend `/dashboard/{overview,attention,items}` envelope and the agreed Task 3 read-model shapes (workload, projects, timeline). Items accept the agreed selection payload (metric + values with present-null assignee + date_start/end + delivery_base + bucket). |
| `packages/types/src/index.ts` | modified — barrel re-export. |
| `packages/shared-state/src/dashboard/operations-store.ts` | new — per-workspace/user store with identity isolation, schema-versioned localStorage persistence, URL ↔ preference resolution, scope-signature-based stale-response rejection, clear-filters vs reset-view semantics, business-filter allowlist. |
| `packages/shared-state/src/dashboard/index.ts` | new — barrel re-export. |
| `packages/shared-state/src/index.ts` | modified — barrel re-export. |
| `apps/web/core/services/dashboard-operations.service.ts` | new — typed `DashboardOperationsService` with `overview / attention / items / workload / projects / timeline` and AbortSignal forwarding. |
| `apps/web/core/components/dashboards/operations/scope-controls.tsx` | new — two-tier header: refresh + new-work-item, then tabs + view mode + period + bucket + filters popover + active chips. |
| `apps/web/core/components/dashboards/operations/use-operations-store.ts` | new — `useSyncExternalStore` façade with cached period snapshot for stable references. |
| `apps/web/core/components/dashboards/operations/shell.tsx` | new — top-level shell with debounced scope fetcher, race-response rejection, identity sync. |
| `apps/web/core/components/dashboards/operations/panels/{kpi-strip,progress-panel,delivery-panel,top-projects-panel,attention-preview-panel,workload-preview-panel}.tsx` | new — Overview panels. |
| `apps/web/core/components/dashboards/operations/tabs/{overview,projects,workload,timeline,insights}-tab.tsx` | new — Five tabs. Only the active tab mounts (no requests on inactive tabs). |
| `apps/web/core/components/dashboards/operations/item-drawer.tsx` | new — paginated drilldown using the agreed selection contract; carries scope_key. |
| `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx` | modified — mounts the operations shell while preserving the route guard and legacy `/:dashboardId` redirect. |
| `apps/web/tests/dashboards/operations/{operations-store,dashboard-operations-service,overview,item-drawer}.{test.ts,test.tsx}` | new — 44 tests total. |
| `apps/web/tests/dashboards/v3/workspace-dashboard-v3.smoke.test.tsx` | rewritten — cutover smoke now asserts the operations shell mounts at `/dashboards`, not the v3 fixed-card dashboard. |

## 3. Validation commands and results

All commands run from the worker checkout root. Exit codes captured; full logs in `/tmp/plane-dashboard-frontend-logs/`.

### 3.1 Type checking

```
pnpm --filter web check:types    # exit code 2 (tsc --noEmit)
log:    /tmp/plane-dashboard-frontend-logs/check-types-6.log
errors: 26 diagnostics total
        0 in new operations/dashboard-operations code
        26 matches /tmp/plane-dashboard-main-types-baseline.log (baseline26) once all @plane packages are built
```

The earlier `188`/`32` counts I reported were artefacts of incomplete `@plane/*` builds in my worktree (no `dist/` for `@plane/editor` initially). After building every workspace package including `@plane/editor` the count settles at exactly 26, matching the coordinator-measured baseline.

```
$ pnpm --filter @plane/editor build
$ tsc && tsdown
...
✔ Build complete in 1462ms
```

Log: `/tmp/plane-dashboard-frontend-logs/build-editor.log` (exit 0).

### 3.2 Tests

```
pnpm --filter web test tests/dashboards/    # exit 0
log: /tmp/plane-dashboard-frontend-logs/test-dashboards-4.log
Test Files: 21 passed
Tests:      178 passed
```

Operations test suite specifically:

```
pnpm --filter web test tests/dashboards/operations/    # exit 0
log: /tmp/plane-dashboard-frontend-logs/test-all-ops.log
Test Files: 4 passed
Tests:      44 passed
```

| Suite | Tests | Purpose |
|---|---|---|
| `operations-store.test.ts` | 19 | Identity isolation, URL ↔ preference, scope signature, request lifecycle (stale rejection), clear / reset semantics |
| `dashboard-operations-service.test.ts` | 7 | Endpoint URL contract, AbortSignal forwarding, payload merge for timeline extras |
| `overview.test.tsx` | 12 | KPI strip, 5-state progress bar, dual delivery trend, top projects, attention preview, workload pending placeholder |
| `item-drawer.test.tsx` | 6 | Open/close, metric label, agreed selection payload (present-null assignee), pagination, error, unassigned |

## 4. Contract alignment

Frontend types and the agreed `/tmp/plane-dashboard-api-contract.json` are aligned. Key alignment points:

- Overview envelope (`sections[{section_id, status, data}]`) preserved.
- Workload rows: `member_id`, `display_name`, `avatar_url`, `is_active`, `open`, `started`, `overdue`, `blocked`, `due_soon`, `completed_in_period`. Unassigned / inactive buckets are typed counters (not full member rows) per the contract guide.
- Projects rows: `state_groups` is the explicit 5-group object; `completion_rate` and `next_deadline` are present; `distinct_totals.completion_rate` typed.
- Timeline: `cycle_lanes.rows` uses `cycle_name/start/end/status/progress/overdue_badge/issue_count`; `deadlines.rows` uses `issue_id/sequence_id/name/project_id/project_name/target_date/days_until_due/priority/owner_ids`; `unscheduled_cycles.rows` uses `cycle_id/cycle_name/project_id/reason`; each carries its own pagination block; `total_cycles_in_scope` present.
- Items selection payload: `{metric, values:{project_id?, assignee_id?, state_group?, priority?, label_id?, cycle_id?, module_id?}, date_start?, date_end?, delivery_base?, date_bucket?}`. Unassigned is `assignee_id: null` (present-null direct), never `[]`.

## 5. Acceptance against the plan

### Task 4 — Client state, API service and route integration

- `DashboardOperationsService` exposes `overview/workload/projects/timeline/attention/items(workspaceSlug,payload,signal)`.
- Store sets identity, scope, period, tab, computes scope keys, manages stale / error states.
- URL > versioned preferences > default resolution: implemented in `applyUrlState` + `writeDashboardUrlState` / `readDashboardUrlState`.
- Scope signature + request generation race rejection: implemented in `beginRequest` / `commitResponse`.
- Tests: store (19) + service (7) + route cutover (4) — all green.

### Task 5 — Dense Overview composition and semantic charts

- Six-KPI strip with semantic labels.
- Five-state stacked bar with semantic colors + completion-rate denominator excluding cancelled.
- Two-series delivery trend (created via `created_at`, completed via `completed_at`) with zero-fill and explicit delta.
- Top projects sorted overdue → blocked → open, KPI total stays workspace-wide.
- Workload preview panel surfaces typed pending placeholder (no fake numbers).
- Tests: 12 passing.

### Task 6 — Team and attention panels with real issue navigation

- Attention preview row click flow can be wired to `ItemDrawer` with the agreed selection payload.
- `ItemDrawer` always carries the response's `scope_key` and refuses to commit a late response whose `scope_key` differs from the request's.
- Issue peek/detail route navigation is delegated to the existing routes — no parallel implementation.
- Tests: 6 passing, including the present-null assignee contract.

### Task 7 — Deep tabs and Customized Insights parity

- Each deep tab (`projects` / `workload` / `timeline` / `insights`) only mounts when active (no network requests on inactive tabs).
- Projects / Workload / Timeline tabs each accept the agreed pagination contract; independent pagination cursors for timeline.
- Insights inherits global scope; local analysis config remains in-tab. The full V2 query type is not invoked yet because backend's V2 query shape finalised the same week and we agreed to defer the deep query parameters behind the agreed selection envelope; the tab surfaces the inherited scope and notes the deferred wiring.
- CSV truncation labelling, date-bucket click → operational items selection: deferred until backend Task 3 lands the `/items/` selection consumer.

## 6. Open / deferred

- **Backend Task 3 read models** (`/workload`, `/projects`, `/timeline` standalone endpoints) are not on disk. Frontend tabs and workload-preview panel surface typed `status: "unavailable"` reasons — never fabricated counts.
- **Insights tab** deep-link to "Open in Analytics" / "Explore in Insights" — omitted per spec §7 until a deep-linking contract is shipped; the tab shows the inherited scope and the explicit "deferred" note.
- **No-update rule** is allowlisted server-side but gated (spec §13); backend has not lifted the gate. Frontend types omit it; the rule's UI surface is reserved.
- **Real browser QA** requires backend Task 3 schemas. Per the brief I have not silently skipped the dependency gap. When coordinator confirms Task 3 schemas landed, the existing typed placeholders flip to live sections without further frontend refactor.

## 7. Logs / artifacts

```
/tmp/plane-dashboard-frontend-logs/check-types-6.log          # final check:types (exit 2, 26 diagnostics)
/tmp/plane-dashboard-frontend-logs/test-all-ops.log           # operations test suite (exit 0, 44 tests)
/tmp/plane-dashboard-frontend-logs/test-dashboards-4.log      # all dashboard tests (exit 0, 178 tests)
/tmp/plane-dashboard-frontend-logs/build-editor.log           # @plane/editor build (exit 0)
```

## 8. Limitations / honest notes

- I did not run real backend tests; backend read models are not yet on disk and the frontend I shipped depends on the agreed contracts in `/tmp/plane-dashboard-api-contract.json` plus the canonical envelope exposed by `apps/api/plane/analytics/dashboard/{contracts,service,items}.py`.
- I edited `apps/web/tests/dashboards/v3/workspace-dashboard-v3.smoke.test.tsx` to retarget the cutover smoke test at the operations shell. The original v3 cutover assertions (fourteen cards, batch request shape) are obsolete because the route no longer mounts v3.
- I added a cached period snapshot and removed `generation` from `scopeSignature` deps to fix a useSyncExternalStore infinite loop exposed by the cutover smoke test. Both fixes are in scope: they were introduced by my own `useDashboardPeriod` / `OperationsShell` changes.
- I am sending `worker_done` from this session with the live Run / Dispatch IDs and the exact report path; if the runtime rejects the dispatch-capability / preamble mismatch the brief mentioned, I follow up with a plain status update and end the turn with `outcome succeeded`.