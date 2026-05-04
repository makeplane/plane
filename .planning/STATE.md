---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Phase 5 IN PROGRESS — 1/2 plans complete; 05-01 shipped i18n + hook + toast resolver typed seam; 05-02 (drag wiring) ready to execute
stopped_at: Phase 5 Wave 1 (05-01) COMPLETE — 4 atomic commits ship 10 timeline.propagation.* i18n keys en+ja (Ubiquitous Language honored), useTimelinePropagationStore hook (mirrors use-instance.ts pattern), and toast-resolver.ts pure-function module with MESSAGE_KEY_BY_CODE Record<TTimelinePropagationErrorCode, string> closed-set + showPropagationErrorToast(code | "UNEXPECTED", t) + showHiddenUpdateToast(count, t). pnpm --filter=web check:types GREEN; check:lint 1001/11957 (no new warnings); @plane/i18n build GREEN; @plane/utils Vitest 11/11 GREEN. Phase 4 store + 4 CE dependency-drag files byte-identical. Wave 2 (05-02) is the next executable unit and consumes 05-01's exports verbatim.
last_updated: "2026-05-04T05:36:25.000Z"
last_activity: 2026-05-04 -- /gsd-execute-phase 5 plan 01 complete: 4 task commits (831c261543 en i18n, 17c849606f ja i18n, 77b2c6a659 hook, 189f5faee4 toast resolver); SUMMARY.md created at .planning/phases/05-drag-handler-integration-error-ux/05-01-SUMMARY.md
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 11
  completed_plans: 11
  percent: 73
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-03)

**Core value:** ドラッグ移動が Precedence Boundary を超えても、サーバ権威で必要最小限の連鎖を all-or-nothing で再配置し、失敗時は明示的な reason code で UI に説明できる。
**Current focus:** Phase 5 — Drag Handler Integration & Error UX (plans complete, ready to execute)

## Current Position

Phase: 5 (Drag Handler Integration & Error UX) — IN PROGRESS
Plan: 1/2 (next: 05-02 drag-handler wiring)
Status: Wave 1 (05-01) shipped — typed seam in place: 10 i18n keys en+ja, useTimelinePropagationStore hook, MESSAGE_KEY_BY_CODE-driven toast resolver. ERR-01..ERR-07 marked complete in REQUIREMENTS.md. Wave 2 (05-02) covers FE-03, FE-09, ERR-08 (D-01 split + drag wiring + sibling-preview override). VERIFICATION PASSED.
Last activity: 2026-05-04 -- /gsd-execute-phase 5 plan 01 (4 task commits 831c261543/17c849606f/77b2c6a659/189f5faee4)

Progress: [██████████] 100% (11/11 plans completed; Phase 5 Wave 1 done; Wave 2 next)

Progress (legacy bar — see Current Position above for current value): [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 9
- Average duration: ~9m
- Total execution time: ~81m

**By Phase:**

| Phase                                             | Plans | Total  | Avg/Plan |
| ------------------------------------------------- | ----- | ------ | -------- |
| 1. Precedence Graph Loader & Normalization        | 2/2   | 10m38s | 5m19s    |
| 2. Scheduling Helper & Propagation Algorithm Core | 3/3   | ~21m   | ~7m      |
| 3. Propagation API Endpoint & Contract            | 3/3   | ~40m   | ~13m     |
| 4. Frontend Service Client & MobX Preview Store   | 2/2   | ~12m   | ~6m      |
| 5. Drag Handler Integration & Error UX            | 1/2   | ~9m    | ~9m      |
| 6. End-to-End Coverage & Polish                   | 0     | —      | —        |

**Plan execution log:**

| Phase-Plan | Tasks | Files | Duration | Completed            |
| ---------- | ----- | ----- | -------- | -------------------- |
| 01-01      | 3     | 6     | 4m43s    | 2026-05-03T15:26:37Z |
| 01-02      | 2     | 3     | 5m55s    | 2026-05-03T15:37:28Z |
| 03-01      | 2     | 7     | ~10m     | 2026-05-04T00:00:00Z |
| 03-02      | 2     | 4     | ~18m     | 2026-05-04T01:30:00Z |
| 03-03      | 1     | 2     | ~12m     | 2026-05-04T02:00:00Z |
| 04-01      | 5     | 11    | ~8m      | 2026-05-04T03:55:00Z |
| 04-02      | 2     | 2     | ~4m      | 2026-05-04T04:06:09Z |
| 05-01      | 4     | 4     | ~9m      | 2026-05-04T05:36:25Z |

**Recent Trend:**

- Last 5 plans: 03-03 (~12m), 04-01 (~8m), 04-02 (~4m), 05-01 (~9m)
- Trend: Phase 5 Wave 1 ships in ~9m — 2 i18n updates + 2 small NEW files; pre-commit oxfmt/oxlint runs add ~1m per task. The typed seam is now in place; Wave 2 (05-02) is the larger 3-file UPDATE wiring layer and may take longer. Phase 6 (E2E) closes the milestone.

_Updated after each plan completion_

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Backend propagation service is implemented as a deep module (Ousterhout): graph traversal, direction normalization, date-range movement, limit enforcement, and error selection are encapsulated behind a small interface (`apps/api/plane/app/services/timeline_propagation/`).
- Sequential phase execution (`parallelization=false`): Phase 1→2→3 must lock the algorithm/API contract before Phase 4 (frontend client/store), Phase 5 (drag handler), or Phase 6 (E2E) begin.
- Date math is isolated in a calendar-day helper so the deferred Working Calendar milestone (ADR 0002) can swap arithmetic without breaking the API surface or graph traversal.
- Dedicated propagation endpoint, not an overload of the existing bulk date update endpoint — different validation, response, and failure semantics.
- (01-01) Timeline propagation value types use `@dataclass(frozen=True, slots=True)` — first instance of frozen+slots in apps/api/plane. Prevents field mutation (FrozenInstanceError) and runtime attribute injection (T-01-01-02 mitigation).
- (01-01) `Adjacency.successors_of` / `.predecessors_of` return empty frozenset for unknown ids — Phase 2 walks the graph from arbitrary moved nodes and relies on this no-KeyError contract (D-06).
- (01-01) PROP-18 move-only scope is declared at the public surface (both `types.py` and `__init__.py` module docstrings) — resize is not a concept in the timeline_propagation module.
- (01-01) Inter-plan RED handoff pattern: ship the failing pytest case in plan N so plan N+1 has an immediate GREEN target. `__init__.py` forward-references the not-yet-created `.graph` module by design.
- (01-02) Cross-project edge classification reads BOTH endpoints' `project_id` (issue + related_issue), not only the related_issue side as the plan's literal `_make_edge` skeleton showed. PROP-16 semantics ("paths reaching outside the project fail propagation") apply regardless of which side of the IssueRelation row the foreign Issue lives on; Pitfall 2 invariant (no `row.project_id` use) is preserved.
- (01-02) Cycle detection is iterative three-color DFS with explicit list-of-(node, iter) stack, deterministic sort order on roots and successors (Pitfall 4), self-edge guard before color tracking (D-05). No recursion; no `sys.setrecursionlimit`. Returns the closed cycle path as `tuple[UUID, ...]` (last element equals first); never throws across the module boundary.
- (01-02) D-08 / PROP-18 lint-grep test (`test_no_drf_or_http_imports_in_module`) walks `pathlib.Path.rglob("*.py")` under the package and asserts no `rest_framework`, `django.http`, `plane.app.views`, `plane.app.serializers` imports — locks isolation for future Phase 2 modules (`scheduling.py`, `propagation.py`, `errors.py`).
- (01-02) `RelationLike` Protocol is the loader's structural input contract — first `typing.Protocol` use in apps/api/plane/. Lets tests pass plain dataclasses if desired without import-time coupling to ORM rows; Phase 3 `IssueRelation` queryset rows satisfy it automatically.
- (03-01) URL canonical path is `/api/workspaces/<slug>/projects/<uuid>/timeline-propagation/` (not `/api/v1/...` as CONTEXT D-01 narrative implied). The URL **name** `project-timeline-propagation` is what's locked; tests use `reverse(...)` rather than hardcoded paths. CONTEXT D-01 narrative was an off-by-one description of the urlconf mount.
- (03-01) `IssueFactory` pins `state.project` to the issue's project via `factory.SubFactory(StateFactory, project=factory.SelfAttribute("..project"))` — the cross-FK invariant must be wired at the SubFactory level or callers passing `project=p` get a state with a different (auto-generated) project.
- (03-01) `TimelinePropagationView.post(...)` returns 501 in Plan 03-01 — Plan 03-02 replaces the body wholesale. Module docstring documents the `transaction.on_commit` Django 4.2 pattern even though Plan 03-03 owns the actual call site.
- (03-02) Permission check FIRST (before serializer parse) per Open Question 1 — mirrors @allow_permission so an unauthorized caller never sees a structural 400 (less info-leak). Inline `ProjectMember` filter `role__in=[ROLE.ADMIN.value, ROLE.MEMBER.value]`; GUEST excluded; no workspace-admin fallback (D-02b).
- (03-02) `STATUS_BY_CODE: dict[PropagationErrorCode, int]` is the single source of truth for the wire HTTP status mapping (D-03). The `_error(code, message)` helper looks up via the table; no inline `status=403/409/422` literals at call sites.
- (03-02) `select_for_update(of=("self",))` locks ONLY the Issue row, not the JOIN-side workspace/project/state rows that `IssueManager` pulls in. Avoids "FOR UPDATE cannot be applied to nullable side of OUTER JOIN" issues with the `state__group != TRIAGE` exclusion (Open Question 3 recommendation).
- (03-02) `Issue.objects.bulk_update(instances, ["start_date", "target_date", "updated_at"])` includes `"updated_at"` in the field list because `bulk_update` bypasses `auto_now` (RESEARCH Pitfall 1). The single captured `now = timezone.now()` is shared across every Issue instance and every `work_items[].updated_at` in the response — pinned by `test_success_payload_uses_single_now_for_updated_at`.
- (03-02) Project's `unique_together=(identifier, workspace, deleted_at)` forces tests with >1 project per workspace to set `identifier=` explicitly. Added `_unique_project(workspace, create_user, label)` test helper that pins both `name` AND `identifier` to UUID-derived values.
- (03-03) `transaction.on_commit(lambda inst=inst, pre=pre: ...)` is the wire pattern for audit + webhook fan-out from `TimelinePropagationView` — fires Celery `.delay(...)` ONLY on successful commit. Default-arg capture (`inst=inst, pre=pre`) is mandatory to avoid Python's late-binding loop-variable trap (RESEARCH Pitfall 4). First `transaction.on_commit` usage anywhere in `apps/api/plane`; sets the pattern for migrating `IssueBulkUpdateDateEndpoint`'s pre-commit `.delay` shape (RESEARCH Pitfall 7) in a follow-up.
- (03-03) `actor_id` type asymmetry between `issue_activity.delay` (string `str(request.user.id)`) and `model_activity.delay` (UUID `request.user.id`) is dictated by the existing endpoint patterns at `views/issue/base.py:1147` and `views/module/base.py:713` respectively. The two task signatures genuinely differ; the new view honors both.
- (03-03) Per-pair issue_activity events use `if inst.start_date != pre.start_date:` (and same for target_date) so propagated issues that only shift one field log only that one event — no "moved by 0" audit rows. The dragged item, which always moves both fields by the requested delta, typically logs both events.
- (03-03) Test patch path is the LOCAL view-module binding `plane.app.views.issue.timeline_propagation.transaction.on_commit` (NOT `django.db.transaction.on_commit`). After `from django.db import transaction`, the view's `transaction` name references the module object, so we patch `transaction.on_commit` ON the view module to redirect the lookup. Pinned by RESEARCH Pitfall 9 — pytest.mark.django_db never commits, so registrations would never fire without this patch.
- (04 discuss) Vitest harness placement decision (open since milestone start): introduce Vitest to `@plane/utils` as the third Vitest package in the monorepo (after `apps/live` and `packages/codemods`). Pure preview/diff helpers in `packages/utils/src/timeline-propagation/preview.ts` cover TEST-19/20/21/22; MobX store is a thin shell tested transitively by Phase 6 E2E. `apps/web` Vitest deferred. Aligns with `CONCERNS.md` lines 35–40 recommendation.
- (04 discuss) Wire-contract TS types live in `packages/types/src/issues/timeline-propagation.ts` as snake_case literal-union + interfaces, mirroring Phase 3's serializers verbatim. Service layer rejects promises with `TTimelinePropagationError` body (matches existing `apps/web/core/services/issue/issue.service.ts:248-251` convention); no `{ ok: true | false }` discriminated union. Adding a server-side error code requires a TS update at this single file.
- (04 discuss) MobX store at `apps/web/ce/store/timeline/timeline-propagation.store.ts` exposes a 4-action surface (`beginPreview`, `updatePreview`, `commitWithServerResult`, `rollback`) plus `previewById` / `lastError` / `lastResponse` / `hiddenUpdateCount` (computed) / `unexpectedError`. Non-protocol errors (network 500) are kept off `lastError` and exposed via separate `unexpectedError` observable so the 7-code wire-error observable stays clean. Phase 5 supplies `edges` + `items_by_id` snapshot to `beginPreview` — Phase 4 store does NOT inspect the MobX tree on its own.
- (04-01) Wire types live in `packages/types/src/issues/timeline-propagation.ts` as snake_case literal-union + interfaces; six exports (`TTimelinePropagationErrorCode`, `TTimelinePropagationOperation`, `TTimelinePropagationRequest`, `TTimelinePropagationWorkItem`, `TTimelinePropagationResponse`, `TTimelinePropagationError`). No `oxlint-disable` needed — `.oxlintrc.json` does not enable a `camelcase` rule, and `TBaseIssue` already ships snake_case without disables.
- (04-01) Service rethrows `error?.response?.data` (the response BODY) — NOT `error?.response` (the axios envelope shape that `sites-issue.service.ts:37` uses). The body is the `{code, message}` envelope Phase 3 emits; callers `try / catch` and inspect `code` directly (D-02a). Mirrors the canonical `apps/web/core/services/issue/issue.service.ts:248-251` pattern.
- (04-01) Vitest is a LOCAL devDep on `@plane/utils` pinned to `^4.0.8` (matching `packages/codemods/package.json:15` exactly). Did NOT add vitest to `pnpm-workspace.yaml` catalog (deferred per D-10a) and did NOT add a `test` task to `turbo.json` (deferred per D-10b). `pnpm --filter=@plane/utils test` runs via the package-local script.
- (04-01) `computeLoadedPreview` walks the loaded subset of the precedence graph as BFS from the dragged item; chain propagation arises naturally from re-enqueueing successors whose new dates were just computed; branch case picks the most-restrictive `predecessor.new_target+1` floor across ALL loaded predecessors (resolved by `_resolveSuccessorStart`). Missing successors in `items_by_id` are silently skipped — server is authoritative (D-04a).
- (04-01) Helpers reuse `@plane/utils/datetime` primitives (`addDaysToDate`, `findTotalDaysInRange`, `renderFormattedPayloadDate`); NO direct `date-fns` import in `preview.ts` (D-04b). Keeps the future Working-Calendar swap (ADR 0002) confined to the `datetime` module without touching propagation logic.
- (04-01) Immutability invariants pinned by 3 explicit `it("immutability ...")` test cases (one per helper) using `JSON.parse(JSON.stringify(...))` snapshot diff. Required so MobX `runInAction` blocks in the Wave 2 store can call helpers without leaking writes through the input maps (D-04c).
- (04-02) `TimelinePropagationStore` exposes the 4-action surface `beginPreview / updatePreview / commitWithServerResult / rollback` plus 6 observables (`previewById` deep `Map`, `isPreviewActive` / `lastError` / `lastResponse` / `lastPreviewIds` / `unexpectedError` all `.ref`) and `hiddenUpdateCount` `computed`. State machine: IDLE ↔ PREVIEWING; stale calls to `updatePreview` and `commitWithServerResult` no-op; the latter resolves to a synthetic local-only `INVALID_DATE_RANGE` envelope to keep Phase 5's branch surface uniform without claiming a real wire code (D-05a).
- (04-02) `lastError` carries one of the 7 wire codes ONLY — closed-set discriminator `_isProtocolError(value): value is TTimelinePropagationError` validates `code` against a `ReadonlySet<string>` of the 7 codes plus `message: string` shape. Non-protocol errors (network failure, 5xx, missing `code`) go to a separate `unexpectedError: Error | null` observable. The two stay strictly separate; Phase 5 chooses which to render (D-05c — no synthetic 8th code).
- (04-02) Canonical write-back surface on commit success is `this.rootStore.issue.issues.updateIssue(wi.id, { start_date, target_date, updated_at })` looped per server `work_items` entry. The store does NOT mutate `IssuesTimeLineStore.blocksMap` directly. The per-id loop sits inside ONE outer `runInAction` so MobX batches the N writes into a single reaction (D-05d / Pitfall 8).
- (04-02) `lastPreviewIds` snapshot is captured BEFORE the network call (`previewIdsAtSend = new Set(this.previewById.keys())`), then assigned BEFORE `previewById.clear()` inside the success `runInAction`. This survives both the success-path reset AND a concurrent `beginPreview` that lands during the in-flight window — `hiddenUpdateCount` works deterministically (D-05e / Pitfall 6).
- (04-02) In-flight commit sharing: `private inflightCommit: Promise<...> | null` cache. Second concurrent `commitWithServerResult` call returns the same promise (`if (this.inflightCommit) return this.inflightCommit;`); cleared in `finally`. Matches "one drag = one network call" UX (D-08a / Pitfall 7).
- (04-02) `previewById: observable` (deep) per Pitfall 3 — Map mutations via `.set()` / `.clear()` trigger MobX reactions correctly. The other observables use `observable.ref` to avoid unnecessary deep diffs (`isPreviewActive` / `lastError` / `lastResponse` / `lastPreviewIds` / `unexpectedError`). All four actions use `action.bound` for parity with `BaseTimeLineStore`'s drag actions.
- (04-02) `apps/web/ce/store/timeline/index.ts` extension is +5 lines: 2 imports, 1 `ITimelineStore` field, 1 `TimeLineStore` field, 1 constructor instantiation. `apps/web/ce/store/root.store.ts` UNCHANGED — `RootStore` already wires `TimeLineStore` and the new store is composed under it (D-06). Phase 5 reaches it via `rootStore.timelineStore.timelinePropagationStore`.
- (04-02) TEST-20 (failure → preview rollback) covered transitively: (1) Wave 1 helper-immutability invariants pinned by `preview.test.ts`; (2) `rollback()` is a single `runInAction` block that clears state without ever calling `updateIssue` — greppable: `rootStore.issue.issues.updateIssue` appears exactly once in the file inside the success branch; (3) Phase 6 E2E TEST-24 drives the full UI → store → server → store failure-path cycle. A dedicated Phase 4 Vitest test would require introducing Vitest in `apps/web` — REJECTED by D-01.
- (05-01) Toast resolver is a **pure-function module** (not a React hook): accepts the `t` translator as a parameter so any caller already holding `useTranslation()` in scope can compose it without a hook envelope. Avoids OxLint `import/no-cycle` triggers and keeps the resolver testable without React. `Translator` local type alias `(key, params?) => string` matches `@plane/i18n` exactly.
- (05-01) `showPropagationErrorToast` accepts `TTimelinePropagationErrorCode | "UNEXPECTED"` union extension. The `"UNEXPECTED"` literal maps to `timeline.propagation.error.unexpected` and matches Phase 4 D-04c's `unexpectedError` observable — the call site reads `lastError` (typed protocol error) vs `unexpectedError` (network/non-protocol Error) and decides which constant to pass. Single ERROR severity for all 8 cases (7 wire codes + UNEXPECTED).
- (05-01) `MESSAGE_KEY_BY_CODE: Record<TTimelinePropagationErrorCode, string>` enforces compile-time exhaustiveness — adding a server-side error code without updating this map and the i18n files will fail `pnpm --filter=web check:types`. Sole call surface for protocol-error i18n routing.
- (05-01) ja plural envelope keeps both `one` and `other` branches identical (Japanese has no grammatical plural). IntlMessageFormat still requires the envelope to interpolate the `#` count token — collapsing to a static string would break `count` substitution.
- (05-01) `useTimelinePropagationStore` accesses through `context.timelineStore.timelinePropagationStore` — a CHAINED access path through `RootStore.timelineStore` (TimeLineStore composite). First accessor hook in `apps/web/core/hooks/store/` to drill through a composite store; future Phase 5 / Phase 6 accessors for other `ITimelineStore` members can mirror this without adding a barrel.
- (05-01) Phase 3 backend regression suite (26 contract + 64 unit) cannot run locally because `apps/api`'s pytest harness imports `plane.celery` which calls `redis.Redis.from_url(REDIS_URL)` at module load time and `REDIS_URL` is `None` outside docker-compose-local. Pre-existing environment limitation — Phase 5 changes nothing in `apps/api/`, so cannot have caused regression. Will be re-confirmed at `/gsd-verify-work` time when the dev stack is up.

### Pending Todos

None yet.

### Blockers/Concerns

- **Vitest harness decision for `apps/web` / `@plane/utils`** (Phase 4): RESOLVED + SHIPPED in Plan 04-01 — Vitest 4.0.8 added to `@plane/utils` (third Vitest package after `apps/live` and `packages/codemods`); 11 GREEN cases cover TEST-19/21/22; `apps/web` Vitest still deferred; MobX store (Wave 2) covered transitively by Phase 6 E2E.
- **`expected_updated_at` precision and HTTP status mapping** (Phase 3): exact ISO format and 409 vs 422 selection per error code must be locked during Phase 3 plan-phase.
- **Adjacency definition** (Phase 2): confirm `successor.start = predecessor.target + 1 calendar day` is the canonical adjacent case (PRD says yes; nail down at plan-phase).
- **Pre-existing unit-suite failures** (logged in `.planning/phases/01-precedence-graph-loader-normalization/deferred-items.md`): 5 tests fail in `bg_tasks/test_copy_s3_objects.py`, `bg_tasks/test_work_item_link_task.py`, `utils/test_url.py`. They pre-date this milestone (verified by re-running on Plan 01-01's tip `c7df9b8d2d`). Not blocking Phase 2 — out of scope per SCOPE BOUNDARY. May need triage outside this milestone if any timeline_propagation work depends on those modules.

## Deferred Items

Items acknowledged and carried forward (see also `docs/timeline-dependency-follow-up-tasks.md`):

| Category   | Item                                                    | Status                                                | Deferred At |
| ---------- | ------------------------------------------------------- | ----------------------------------------------------- | ----------- |
| Scheduling | Working Calendar (workspace default + project override) | Deferred to follow-up milestone                       | 2026-05-03  |
| Scheduling | Japan public holiday preset (2024-2030)                 | Deferred to follow-up milestone                       | 2026-05-03  |
| Scheduling | `planned_duration_working_days` field                   | Deferred (estimate-model conflict unresolved)         | 2026-05-03  |
| Scheduling | Auto-calc `target_date = start_date + planned_duration` | Deferred                                              | 2026-05-03  |
| Scheduling | Working-day skip during propagation                     | Deferred (Working Calendar prereq)                    | 2026-05-03  |
| UI         | Resize-handle propagation                               | Out of scope (PRD: move-only)                         | 2026-05-03  |
| Scope      | Cross-project propagation                               | Out of scope (fails with `PROJECT_BOUNDARY_EXCEEDED`) | 2026-05-03  |

## Session Continuity

Last session: 2026-05-04T05:36:25.000Z
Stopped at: Phase 5 Wave 1 (05-01) COMPLETE — 4 atomic commits (831c261543 en i18n, 17c849606f ja i18n, 77b2c6a659 hook, 189f5faee4 toast resolver) ship the typed seam: 10 timeline.propagation.\* i18n keys en+ja with Ubiquitous Language ("作業項目"), useTimelinePropagationStore hook (use-instance.ts pattern verbatim), toast-resolver.ts pure-function module exposing MESSAGE_KEY_BY_CODE Record<TTimelinePropagationErrorCode, string> + showPropagationErrorToast + showHiddenUpdateToast. ERR-01..ERR-07 marked complete in REQUIREMENTS.md. pnpm --filter=web check:types GREEN; check:lint 1001/11957; @plane/i18n build GREEN; @plane/utils Vitest 11/11 GREEN. Wave 2 (05-02) is unblocked.
Resume file: 05-02-PLAN.md — drag handler wiring (D-01 split in updateBlockDates, beginPreview/updatePreview in use-gantt-resizable.ts move-only branch, previewById override in GanttChartBlock)
