# Team Operations Dashboard Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans task-by-task. The user explicitly selected supervised OpenCode implementation via Orca orchestration; do not substitute a non-Orca agent or ask again about execution mode. Steps use checkboxes for tracking.

**Goal:** Replace the weak fixed-card dashboard with the real-data Team Operations Overview in the approved task scope, including Projects, Workload, Timeline and Insights, and independently verify the completed result.

**Architecture:** Add an ACL-safe operational read service alongside Analytics V2; share predicates for counts and item drilldown. Build a new composed dashboard with semantic panels and a typed client/store; reuse chart primitives, issue peek, filters and Customized Insights. Keep existing Analytics and route/capability guards compatible.

**Tech Stack:** Django/DRF/PostgreSQL, React/TypeScript, MobX, React Router, existing Plane tokens/components, Vitest/RTL, isolated Docker pytest.

**Spec:** `docs/superpowers/specs/2026-09-27-workspace-dashboard-redesign.md` including its image asset. This plan supersedes execution of the older `2026-09-27-workspace-dashboard-redesign.md` plan.

**Authorization:** User requested on 2026-09-27: plan, delegate to OpenCode, then verify its work while user is away. Implementation and local verification are authorized. Do not deploy, alter production data, or push/merge without a separate existing authorization.

## Global constraints

- Read repository instructions, the rewritten spec, source evidence and the supplied reference image before coding. `RTK.md` was not found at repository root or checked parent locations; do not pretend to have read it. Follow it if found in the worker environment.
- Isolate implementation from the existing dirty main checkout. OpenCode owns implementation only in its assigned worktree; it is not alone in the repository and must not revert another actor's edits.
- Never stage all main-checkout changes, reset, stash or overwrite user's Wiki/Gantt/token work. Copy only explicitly listed planning artifacts into the worker checkout.
- Distinct issue counts; same predicates for counts/list; timezone = workspace timezone; date windows half-open. Keep pending_work_items legacy semantics intact.
- Current-state panels ignore reporting period; clearly label current vs period. Six main KPI values are current snapshot. Completed-in-period is separately labelled.
- Team is the default, regardless of role. ACL is evaluated server-side for all rows, counts, names, filter options, exports and blockers.
- Snapshot statuses partition; blocked/overdue overlap. No fake numbers, made-up capacity, fake burndown, placeholder controls, hardcoded mock success, or new dashboard builder.
- New generic UI primitives live in @plane/ui with Storybook. Use existing @plane/propel primitives where applicable; product composition stays in web. Use semantic design tokens, typed props, accessible keyboard controls and localized strings.
- Keep legacy builder endpoints removed. New operational API uses singular `/dashboard/`, separate from retired `/dashboards/` CRUD.
- P0 includes spec phases A–C. P1 pinning/cycle burndown is not required. No-update activity rule may be withheld only if the coverage gate is documented with evidence, as allowed in the spec.
- Complete focused RED/GREEN tests, backend contracts, type/lint checks and real UI acceptance. Passing a mocked component test does not establish API correctness or visual quality.
- Worker's final report must list commits, exact commands/results, screenshots/runtime URL, benchmark evidence, remaining limitations and spec coverage. No claims based on process existence.

## Ownership and file structure

One OpenCode implementer owns all feature edits sequentially. Coordinator owns this plan and independent review reports. No concurrent editor shares the worker checkout during implementation. File names below are proposed new modules; if repository patterns require a different name, document the mapping in the report before finishing.

Backend additions:

- `apps/api/plane/analytics/dashboard/contracts.py`: validated scope/period/selection contracts.
- `apps/api/plane/analytics/dashboard/predicates.py`: shared operational issue predicates and activity rule.
- `apps/api/plane/analytics/dashboard/service.py`: overview orchestration, read snapshot, exact summaries.
- `apps/api/plane/analytics/dashboard/workload.py`: roster, full-credit aggregates, pagination.
- `apps/api/plane/analytics/dashboard/projects.py`: project summaries.
- `apps/api/plane/analytics/dashboard/timeline.py`: project-cycle lanes, deadlines and missing dates.
- `apps/api/plane/analytics/dashboard/items.py`: attention union and metric/date/cell drilldown.
- `apps/api/plane/app/views/dashboard.py`: thin authenticated endpoints.
- `apps/api/plane/app/urls/analytic.py`: additive singular dashboard routes.
- `apps/api/plane/tests/unit/dashboard/` and `.../tests/contract/app/test_dashboard_operations_app.py`: tests and reusable fixtures.

Frontend additions:

- `packages/types/src/dashboard-operations.ts`, exported through existing type barrel: request/response union types.
- `apps/web/core/services/dashboard-operations.service.ts`: API boundary.
- `packages/shared-state/src/dashboard/operations-store.ts`, exported through existing package barrel: scoped preferences/request lifecycle. Follow existing store injection conventions when wiring web.
- `apps/web/core/components/dashboards/operations/`: shell, scope controls, KPI/progress/delivery/project panels, workload/attention panels, cycle/deadline panels, projects/workload/timeline/insights tabs and item drawer.
- `apps/web/tests/dashboards/operations/`: behavior, contract, scope and rendering tests.
- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`: mount new shell while preserving guards/legacy redirects.
- Existing `packages/i18n/src/locales/*/common.json`: new copy using existing ICU conventions.

## Validation commands and baseline

Run from worker repository root, with unique Compose project name `plane-dashboard-ops-test`:

```bash
pnpm --filter web test tests/dashboards tests/analytics/customized-insights-v2.test.tsx
pnpm --filter web check:types
docker compose -p plane-dashboard-ops-test -f docker-compose-test.yml run --rm --build api-tests pytest plane/tests/unit/analytics_v2 plane/tests/contract/app/test_analytics_v2_app.py plane/tests/contract/app/test_dashboard_app.py -q
```

Read `apps/api/tests/RUNNING_TESTS.md` and `TESTING_GUIDE.md`. Generate missing env files with repository setup in the isolated checkout; do not overwrite existing env or copy secrets into reports. Read setup hooks before executing. Backend failures due to environment must be isolated and resolved where reversible; never replace PostgreSQL validation with a SQLite success claim. Record pre-existing type/lint/test failures separately and prove changed scope is clean.

For every implementation task below: first add the stated behavioral test, run it and record the expected failure, implement, rerun the focused suite, then commit only that task's files. Do not commit a failing implementation. Use `git diff --check` before commits.

## Task 1 — Scope and shared operational predicates

**Files:** contracts.py, predicates.py, `__init__.py`, tests/unit/dashboard/test_predicates.py, test_scope.py.

**Interfaces:** `resolve_dashboard_scope(workspace, principal, payload) -> DashboardScope`; `operational_queryset(scope, selection) -> QuerySet[Issue]`. Scope owns normalized period, today, base ACL queryset and filter identity. Selection accepts named metric/rule plus supported dimensions/date bucket, never arbitrary ORM fields.

- [ ] Add tests around the 12-issue fixture defined in spec §12; reuse repository model factories. The core assertion must be equivalent to:

```python
assert count("total") == 12
assert count("open") == 9
assert count("not_started") == 5
assert count("started") == 4
assert count("completed") == 2
assert count("overdue") == 2
assert count("blocked") == 3
assert count_union(["overdue", "blocked"]) == 4
```

Here `count`/`count_union` are test helpers wrapping the new queryset selectors, not production magic functions. Create fixtures with real relations, including multi-assignee/label joins.

- [ ] Run `docker compose -p plane-dashboard-ops-test -f docker-compose-test.yml run --rm api-tests pytest plane/tests/unit/dashboard/test_predicates.py plane/tests/unit/dashboard/test_scope.py -q`; expect failures for missing predicates.
- [ ] Implement selectors using the ACL-safe base queryset and `Exists`/distinct where relations multiply rows. Open is backlog/unstarted/started; Due soon is date >=today and <today+7. Blocked uses `IssueBlocker.block` as target and `blocked_by` as blocker, filtered to readable active unresolved blockers.
- [ ] Cover half-open ranges, workspace timezone, closed/deleted blockers, unassigned active relations, invalid filters, public/private scope and no match. Audit IssueActivity writers and explicitly record whether No update can be shipped truthfully.
- [ ] Green focused tests; commit `feat(api): define dashboard operational scope and predicates`.

## Task 2 — Typed operational APIs and count/list parity

**Files:** service.py, items.py, views/dashboard.py, urls/analytic.py, types/dashboard-operations.ts + type exports, test_dashboard_operations_app.py.

**Interfaces:** `POST /api/workspaces/{slug}/dashboard/overview/`, `attention/`, `items/`. Envelope `{version:1, generated_at, scope_key, resolved_scope, resolved_period, timezone, sections}`. Sections discriminate ok/error/unavailable. Items include actual issue identifiers/title/project/assignees/state/target_date/reasons, total and pagination.

- [ ] Contract tests POST overview and each KPI selection to items using real authenticated clients. Assert item total equals KPI count in unchanged read state; unauthorized workspace rejected; private issue names/counts absent. Attention union does not duplicate issue rows.
- [ ] Run the new contract file and observe missing-route failures.
- [ ] Implement exact totals independent of truncated groups, same shared selectors before pagination, stable sorting and bounded page_size (default25/max100). Use server-validated selection rather than client-provided totals. Reject unknown versions/fields/metric/date bucket combinations with explicit validation errors.
- [ ] Implement dual delivery queries by their actual created_at/completed_at bases; zero-fill buckets. Comparison uses equally sized elapsed windows; previous zero yields absolute delta.
- [ ] Provide consistent snapshot strategy and section errors, not blanket 0 fallback. Add contract test showing a failed optional section does not erase successful summary sections.
- [ ] Green new contracts and Analytics V2/removed builder regression tests; commit `feat(api): expose operational dashboard summaries and drilldown`.

## Task 3 — Workload, projects and timeline read models

**Files:** workload.py, projects.py, timeline.py, service.py, views/dashboard.py, urls/analytic.py, contract tests and unit tests per module.

**Interfaces:** singular dashboard workload/projects/timeline endpoints use the same scope envelope. Preview results include rows + total_count + has_more. Overview composes bounded previews with shared request-level visibility resolution.

- [ ] Tests: zero-work roster member, inactive assigned member, unassigned row, two-assignee full-credit cells, distinct project totals, multi-cycle project, empty/unscheduled cycles, filters excluding non-matching cycles, top N not affecting global totals.
- [ ] Run focused tests to RED.
- [ ] Implement grouped SQL aggregates and paginated roster/project/cycle joins; no loop of per-person HTTP queries or per-row ORM requests. Reconcile cycle visibility to dashboard ACL rather than copying joined-only endpoint semantics.
- [ ] Timeline intersections use cycle start/end vs reporting period; missing dates grouped separately. Deadline issues use current 7-day window; upcoming cycles next30 days with explicit metadata.
- [ ] Use stable deterministic default sort defined by spec. Add `assertNumQueries` or captured-query comparison with 5 versus 50 visible roster members to catch N+1 (allow constant setup queries; report counts).
- [ ] Green and commit `feat(api): add team project and cycle dashboard read models`.

## Task 4 — Client state, API service and route integration

**Files:** dashboard-operations service, operations-store.ts, operations/scope.ts, operations/shell.tsx, route page, tests scope/store/service.

**Interfaces:** typed `DashboardOperationsService.overview/workload/projects/timeline/attention/items(workspaceSlug,payload,signal)`; store sets identity/scope/period/tab, resolves URL > versioned preferences > default, computes scope keys and manages stale/error states. Reuse MobX injection patterns.

- [ ] Write tests for identity isolation, Team default regardless of role, explicit My work, Clear vs Reset, URL restoration, obsolete V3 preference migration and late-response rejection. Test response race with controlled promises:

```ts
const first = deferred<OverviewResponse>();
const second = deferred<OverviewResponse>();
// Change scope A -> B, resolve B first, then A.
// Assert rendered/selected scope and every displayed section still belong to B.
```

Define `deferred` locally in the test or use existing helpers. Do not assert only request count.

- [ ] Run `pnpm --filter web test tests/dashboards/operations/scope.test.ts tests/dashboards/operations/store.test.ts`; expect missing implementation failures.
- [ ] Implement 250ms filter debounce, no overlapping refresh, visible-tab 60s refresh, focus stale refresh and mutation invalidation. First load skeleton vs refresh stale data must differ; old-scope data cannot display under new filters.
- [ ] Mount operations shell only after identity/route guard resolved. Preserve kill-switch, access checks and legacy redirect behavior; no old builder routes.
- [ ] Green tests and `pnpm --filter web check:types`; commit `feat(web): wire scoped dashboard operations state and service`.

## Task 5 — Dense Overview composition and semantic charts

**Files:** operations/{shell,kpi-strip,progress-panel,delivery-panel,project-status-panel,scope-controls}.tsx; reusable primitives in packages/ui only if needed; locales; overview component tests.

**Interfaces:** components accept typed section results and `onSelect(selection)`; no component derives backend metric predicates from labels. Charts use semantic color map and actual numeric unit/denominator metadata.

- [ ] Tests assert six snapshot KPI values, labelled period completed subvalue, zero vs error states, overlapping risk labels, two independent trend series/date bases, click selection payload and accessible keyboard interactions.
- [ ] RED with `pnpm --filter web test tests/dashboards/operations/overview.test.tsx`.
- [ ] Implement 12-column desktop layout with compact 88–104px KPI row and 210–240px chart row, responsive content-aware breakpoints; no welcome hero, card download clutter, or giant no-data art. Match reference density while keeping 12–14px body typography and theme tokens.
- [ ] Add real scope controls from existing workspace stores; every selection visibly labelled. Semantic stacked bar, compact KPI ring only where denominator valid, accessible chart table fallback. Apply dark/light themes and reduced motion.
- [ ] Test long text, zero denominator, error retry, filter no matches, keyboard selection. Replace obsolete card-count/class assertions with product behavior tests while retaining compatible renderer tests.
- [ ] Green focused tests/types; commit `feat(web): build compact operational dashboard overview`.

## Task 6 — Team and attention panels with real issue navigation

**Files:** operations/{workload-panel,attention-panel,item-drawer,cycle-panel,deadline-panel,project-breakdown}.tsx; drawer tests and overview integration tests.

**Interfaces:** use typed preview results; drawer `selection + scope + pagination` calls items/attention endpoint. Issue row navigation uses existing issue peek/detail route/store APIs discovered in source; mutations continue using existing authorization.

- [ ] Test overdue+blocked issue is one row with two badges, member count full credit has explanation, Unassigned distinct, no-data messages truthful, View all targets correct tab/drawer, list count consistent with clicked KPI.
- [ ] RED component/integration tests.
- [ ] Build workload beside attention above fold; show avatar/name/Open/Started/Overdue/Completed-in-period, and real attention issue rows with owner/due/reasons. WIP threshold warning explicitly rule-based, never productivity/capacity inference.
- [ ] Wire actual drawer row to existing issue detail, preserve filter/scroll/back/focus, invalidate summaries after successful mutation, retain prior data on mutation failure. No fabricated success toast.
- [ ] Render cycle lanes/today marker/unscheduled group, upcoming issue/cycle switch and project breakdown. Zero preview does not hide available controls.
- [ ] Green tests and commit `feat(web): connect team attention and deadline workflows`.

## Task 7 — Deep tabs and Customized Insights parity

**Files:** operations/{projects-tab,workload-tab,timeline-tab,insights-tab}.tsx; existing Analytics query/renderer components only for reusable additions; tab tests.

**Interfaces:** tab query params preserve shared scope; each deep tab lazily requests paginated endpoint. Insights inherits global scope and keeps analysis config local; supports Customized Insights dimension/metric/breakdown/grouping/display/normalization/allocation and chart/table/CSV/drilldown.

- [ ] Test deep tab pagination/search/sort, state retained through back/reload, no network requests for inactive tabs, scope reaching Insights query, invalid query controls blocked and CSV truncation labelled.
- [ ] RED focused tab tests.
- [ ] Implement full Projects table and detail links, Workload member/project matrix and WIP threshold, Timeline week/month/quarter and deadline list. Every visible action works; omit only P1 features explicitly excluded by plan.
- [ ] Reuse Customized Insights query builder/resolver/renderers. Add useful presets and Explore in Insights selection mapping. Show Open in Analytics only after working import/deep-link contract exists; otherwise omit that optional action and record it.
- [ ] Date-bucket click must use operational items selection correctly; existing categorical Analytics drilldown remains compatible. Do not silently route custom insights to unrelated all-issues list.
- [ ] Green dashboard and Customized Insights regression suites/types; commit `feat(web): add projects workload timeline and insights views`.

## Task 8 — Runtime verification, performance and review handoff

**Files:** `docs/superpowers/reports/2026-09-27-dashboard-operations-implementation.md`, screenshot/benchmark evidence under adjacent dashboard-operations directory; tests or fixes required by evidence.

- [ ] Run focused frontend suite, backend dashboard/Analytics contracts and unit suites, web types, changed-file lint/format, and `git diff --check`. Record exact successful/failed commands and inherited failures; fix feature regressions before claiming success.
- [ ] Start isolated local dev/test runtime on non-conflicting ports with unique compose project. Do not stop/restart shared dev or production services. Seed representative test workspace with real records; no production data writes.
- [ ] Use browser tooling to execute spec §12 workflows. Capture 1440×900,1280×800,1024×768,390×844 dark/light screenshots and 200% zoom evidence. Screenshot request-mocked fixture rendering may supplement but cannot replace a real backend drilldown/mutation workflow.
- [ ] Benchmark 10k issues/20 projects/50 members and record hardware/container limits, cold/warm p95, request count, SQL count, payload bytes and query plans for slow paths. If targets fail, report actual values and optimize measured bottlenecks.
- [ ] Self-review spec §1–13 coverage; identify every deferred optional feature, any blockers, data semantics decisions and remaining visual discrepancy. No silent scope reduction.
- [ ] Commit verified feature changes and report. Send coordinator a valid Orca worker_done using injected Task/Dispatch authority, with report path and truthful outcome. Await coordinator review; do not merge/push/deploy or continue after settlement.

## Coordinator verification and fix loop

Coordinator re-reads immutable worker diff and test/runtime artifacts, reruns focused checks from worker checkout and manually inspects screenshots/real UI. Any correctness, ACL, fake-data, missing workflow or material visual issue goes back to OpenCode as a fresh supervised fix task. Completion requires accepted implementation evidence, independent verification report and settled/released worker ownership. Keep implementation worktree/commits discoverable; a release must not delete unmerged work.

Spec coverage map: §§1–4 → tasks1/4/7; §5 → tasks5/6/8; §6 → tasks2/3/5/6; §7 → task7; §8 → tasks1/2/3; §9 → tasks2/3/4; §10 → tasks4/5/6/7; §§11–13 → task8 + coordinator verification. P1/P2 remain explicitly excluded, not silently marked done.
