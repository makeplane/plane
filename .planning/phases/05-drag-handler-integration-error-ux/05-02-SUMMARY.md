---
phase: 05-drag-handler-integration-error-ux
plan: 02
subsystem: ui
tags: [mobx, gantt, drag-handler, timeline-propagation, context-provider, observer-reactivity]

# Dependency graph
requires:
  - phase: 04-frontend-service-client-mobx-preview-store
    provides: ITimelinePropagationStore (timelinePropagationStore on TimeLineStore)
  - phase: 05-drag-handler-integration-error-ux
    plan: 01
    provides: useTimelinePropagationStore hook + showPropagationErrorToast/showHiddenUpdateToast helpers + 10 i18n keys (en+ja)
provides:
  - PropagationCallbacks interface exported from use-gantt-resizable.ts
  - PropagationCallbacksContext (React Context plumbing across the GanttChartRoot subtree without touching apps/web/ce/)
  - D-01 split of BaseGanttRoot.updateBlockDates routing move-only payloads to commitWithServerResult and resize/half-block payloads to issues.updateIssueDates verbatim
  - Sibling-block visual preview during drag via observer-driven previewById override of marginLeft/width in GanttChartBlock
affects: [06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React Context for cross-CE-boundary plumbing (Option B): PropagationCallbacksContext lets the Issue Gantt thread an opt-in callback object through ChartViewRoot → GanttChartMainContent → CE-owned GanttChartBlocksList → GanttChartBlock without modifying CE files (D-10a)."
    - "Pre-drag-state + payload-shape predicate (D-01a): updateBlockDates inspects updates.length === 1 + both dates present + pre-drag block had both dates to identify a move; expands cleanly to a flag-from-hook in the future without contract change."
    - "Mousedown snapshot of expected_updated_at (D-09): block.data.updated_at is captured INSIDE handleBlockDrag's drag-start branch BEFORE document.addEventListener calls — never re-read at mouseup, so concurrent socket-driven updates correctly trigger SCHEDULE_CHANGED on commit (Phase 3 TEST-13)."
    - "MobX-observer-driven sibling preview (D-02b): GanttChartBlock reads propagationStore.previewById.get(blockId) inside its existing observer wrapper; the rendered marginLeft/width fall through to a (preview-derived | block.position) overlay. Zero direct DOM manipulation outside the dragged-block's resize hook write path."
    - "Hook-stays-generic gate (D-03b): propagationCallbacks is optional + nullable on useGanttResizable; Module/Cycle/Project Gantt callers don't wrap in PropagationCallbacksContext.Provider, the context default null reaches the hook, and every propagation hook call is silently skipped."

key-files:
  created:
    - apps/web/core/components/gantt-chart/helpers/propagation/callbacks-context.ts
  modified:
    - apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts
    - apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx
    - apps/web/core/components/gantt-chart/blocks/block.tsx

key-decisions:
  - "Plumbing decision (Task 2 Option B chosen at execute-time): the chain BaseGanttRoot → GanttChartRoot → ChartViewRoot → GanttChartMainContent → GanttChartBlocksList → GanttChartBlock crosses apps/web/ce/components/gantt-chart/blocks/blocks-list.tsx, which Phase 5 D-10a forbids modifying. Threading a new prop through that file would violate the CE byte-identical guard, so a tiny PropagationCallbacksContext (created next to the toast resolver) carries the callbacks. BaseGanttRoot wraps <GanttChartRoot> in the provider; GanttChartBlock reads via useContext and passes to useGanttResizable as the optional 5th arg. Clean separation: hook stays generic, CE files stay byte-identical, Module/Cycle/Project Gantt roots default to null."
  - "Right-edge pixel formula for sibling preview (Task 3): getPositionFromDateOnGantt(target_date, dayWidth) — full dayWidth offset, not 1 pixel — so width = (right - left) matches getItemPositionWidth's canonical (daysDiff + 1) * dayWidth formula. Avoids visual drift between preview-rendered blocks and post-commit block.position-rendered blocks."
  - "Mousemove updatePreview args derivation (Task 1): startDate from getDateFromPositionOnGantt(marginLeft, 0); targetDate from getDateFromPositionOnGantt(marginLeft + width, -1). The -1 day offset matches getUpdatedPositionAfterDrag's target_date computation in base-timeline.store.ts:376, so the preview's requested_target_date stays aligned with what handleMouseUp ultimately submits."
  - "unexpectedError takes precedence over result.code in the failure branch (Task 2): Phase 4's commitWithServerResult returns a synthetic local-only INVALID_DATE_RANGE envelope when there's no active preview AND ALSO when network/5xx hits — but it sets unexpectedError in the second case. The toast routing inspects unexpectedError first to render the UNEXPECTED message instead of misleadingly claiming INVALID_DATE_RANGE."

patterns-established:
  - "Pattern: Cross-CE-boundary plumbing via React Context. Whenever a prop must reach a deep descendant whose ancestor chain includes a CE component (untouchable per D-10a), a small Context module co-located with the feature plus a Provider at the issue-layer entry point is the canonical answer. PropagationCallbacksContext + BaseGanttRoot wrapping demonstrates the pattern."
  - "Pattern: Optional-callback gate for path-divergence in shared hooks. useGanttResizable now demonstrates an optional 5th arg whose absence/null makes the new behavior a no-op without code changes at non-issue callers. Same pattern can absorb future opt-in features (e.g., relation auto-create on drag) without breaking existing modules/cycles/projects roots."

requirements-completed: [FE-03, FE-09, ERR-08]

# Metrics
duration: ~8m
completed: 2026-05-04
---

# Phase 5 Plan 02: Drag Handler Wiring Wave 2 Summary

**Wave 2 wires Phase 4's typed propagation seam into the existing Issue Gantt move drag path: D-01 split routes single-row date-only updates to commitWithServerResult, mousedown snapshots expected_updated_at and assembles the loaded-graph snapshot via a parent-owned closure, mousemove updates the preview at day-boundary quantization, and sibling blocks shift visually through MobX-observer reactivity on previewById without any direct DOM manipulation. Resize and dependency-creation drag paths are byte-identical (FE-09 / PROP-18); CE files unmodified (D-10a).**

## Performance

- **Duration:** ~8 min (7m 53s wall, 2026-05-04T05:42:32Z → 2026-05-04T05:50:25Z)
- **Started:** 2026-05-04T05:42:32Z
- **Completed:** 2026-05-04T05:50:25Z
- **Tasks:** 3
- **Files created/modified:** 4 (1 NEW context module + 3 UPDATE)

## Accomplishments

- `useGanttResizable` accepts an optional 5th param `propagationCallbacks?: PropagationCallbacks | null`; the move-only branch fires `beginPreview` at mousedown (snapshotting `block.data.updated_at` per D-09) and `updatePreview` per mousemove. Resize (`left`/`right` `dragDirection`) branches keep their existing behavior verbatim — only inner-shadow variable renames (`e` → `moveEvent`, `mouseX` → `moveMouseX`) for `oxlint --deny-warnings` compliance.
- `BaseGanttRoot.updateBlockDates` is now D-01-split: payload-shape predicate (`updates.length === 1 && updates[0].start_date && updates[0].target_date && pre-drag block had both dates`) routes the move case to `propagationStore.commitWithServerResult(...)`; everything else (resize, half-block, multi-row) falls through to the original `issues.updateIssueDates(...)` call **verbatim** including the existing fallback toast message.
- Loaded-graph snapshot assembled in BaseGanttRoot's `useMemo` via the parent-owned `getEdgesAndItems` closure — iterates `relation.relationMap[srcId]?.blocking ?? []` only (D-03a Pitfall 2: no double-counting via `blocked_by`), projects `issueTimelineStore.blocksMap` to snake_case `{ id, start_date, target_date }`, mirrors `dependency-paths.tsx`'s iteration pattern.
- Toast routing on commit completion: success + `hiddenUpdateCount > 0` → `showHiddenUpdateToast(count, t)`; failure with `unexpectedError` set → `showPropagationErrorToast("UNEXPECTED", t)`; otherwise `showPropagationErrorToast(result.code, t)`. Closes ERR-08 (failure surfaces a typed code) by composing the Wave 1 helpers.
- `GanttChartBlock` reads `propagationStore.previewById.get(blockId)` inside its existing observer wrapper and overrides the rendered `marginLeft` / `width` via `getPositionFromDateOnGantt(date, offset)` — `offset = 0` for `start_date`, `offset = dayWidth` for `target_date`'s right edge. Falls back to `block.position?.{marginLeft,width}` when the map has no entry, so non-drag rendering stays identical.
- `propagationCallbacks` reaches `GanttChartBlock` through a brand-new `PropagationCallbacksContext` (Option B at execute-time per the plan) — required because the prop chain to `useGanttResizable` crosses `apps/web/ce/components/gantt-chart/blocks/blocks-list.tsx` (5 levels deep, 1 CE component) which D-10a forbids modifying. Module/Cycle/Project Gantt roots don't provide the context, so the default null reaches the hook and propagation calls are silently no-op'd (D-03b honored).
- `pnpm --filter=web check:types` GREEN; `pnpm --filter=web check:lint` 995 warnings (down from 1001 on HEAD by 6 — drive-by fixes in `base-gantt-root.tsx`); well under the 11957 ratchet (D-12).
- `pnpm --filter=@plane/utils test` GREEN — 11/11 Vitest cases for Phase 4 helpers.
- All 4 CE dependency-drag files plus the Phase 4 store plus `apps/web/core/services/issue/issue.service.ts` show `git diff --stat` zero diff vs Plan 05-01's tip — byte-identical guards held (FE-09 / PROP-18 / Phase 4 D-03b).

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire propagation preview into use-gantt-resizable.ts move branch** — `2c2330c6dc` (feat)
2. **Task 2: Split base-gantt-root.tsx::updateBlockDates and assemble propagation callbacks** — `d647349e81` (feat)
3. **Task 3: Override block.tsx marginLeft/width from previewById for sibling blocks** — `c2e6281e79` (feat)

## Files Created/Modified

- **NEW** `apps/web/core/components/gantt-chart/helpers/propagation/callbacks-context.ts` — small React Context module (`PropagationCallbacksContext = createContext<PropagationCallbacks | null>(null)`) for cross-CE-boundary plumbing. Imports the `PropagationCallbacks` interface from the hook file (single source of truth).
- `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts` — exported `PropagationCallbacks` interface (3-method shape: `beginPreview`, `updatePreview`, `getEdgesAndItems`); added optional 5th param `propagationCallbacks?: PropagationCallbacks | null`; mousedown D-09 snapshot of `block.data.updated_at` + `beginPreview` call (move-only); mousemove `updatePreview` call deriving `requested_*` via `getDateFromPositionOnGantt + renderFormattedPayloadDate` (move-only); resize `left`/`right` branches kept their logic and quantization unchanged (only the shadowed inner `e`/`mouseX` were renamed for oxlint --deny-warnings compliance — no behavior change).
- `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx` — new imports for `useIssueDetail`, `useTimelinePropagationStore`, the toast resolvers, and the `PropagationCallbacksContext`; `useMemo`-built `propagationCallbacks` closure assembling edges + items_by_id from the loaded subset; D-01 split inside `updateBlockDates` (move → `commitWithServerResult` + toast routing on success/failure; non-move → existing `issues.updateIssueDates` verbatim); JSX wraps `<GanttChartRoot>` in `<PropagationCallbacksContext.Provider value={propagationCallbacks}>`. Drive-by lint fixes: `props` → `sidebarProps` (no-shadow), `updateIssue && (await ...)` → `if (updateIssue) await ...` (no-unused-expressions), `eslint-disable-next-line react-hooks/exhaustive-deps` on the on-mount `initGantt()` effect.
- `apps/web/core/components/gantt-chart/blocks/block.tsx` — new `useContext` import; pull `useTimelinePropagationStore` + `currentViewData` + `getPositionFromDateOnGantt` from existing chart-store hook; consume `PropagationCallbacksContext` and pass to `useGanttResizable` as the 5th arg; before render, compute `previewMarginLeft` / `previewMarginRight` / `previewWidth` from `previewById.get(blockId)` (with `block.position` fallback) and use them in the wrapping `<div>`'s `style={{ marginLeft, width }}`.

## Decisions Made

The plan locked everything except one element: the prop-chain plumbing between `BaseGanttRoot` and `useGanttResizable` (Option A vs Option B). I chose **Option B (React Context provider)** at execute-time because **Option A would have required modifying `apps/web/ce/components/gantt-chart/blocks/blocks-list.tsx`**, the CE-owned wrapper that renders `GanttChartBlock` inside `GanttChartMainContent`. D-10a explicitly forbids any edit to `apps/web/ce/`. Option B introduces one tiny new file (`callbacks-context.ts`, 12 lines) and keeps the hook's signature change limited to one optional param — exactly the constraint the plan asked for.

The other notable decisions are documented in `key-decisions` above:

- Right-edge pixel formula uses `dayWidth` (full day) as the `offSetWidth` so the rendered preview width matches `getItemPositionWidth`'s canonical formula.
- Mousemove `requested_target_date` uses `offsetDays = -1` to match `base-timeline.store.ts::getUpdatedPositionAfterDrag` — the preview's request is byte-identical to what mouseup eventually submits.
- The failure branch checks `propagationStore.unexpectedError` BEFORE `result.code` so a network/5xx (which sets a synthetic local-only `INVALID_DATE_RANGE` envelope per Phase 4 D-05a) renders the UNEXPECTED message instead of a misleading INVALID_DATE_RANGE message.

## Deviations from Plan

**[Rule 3 - Blocking issue] Renamed inner-scope shadowed variables in `use-gantt-resizable.ts`**

- **Found during:** Task 1, attempting to commit
- **Issue:** `lint-staged` runs `oxlint --fix --deny-warnings` on staged files. The file already had pre-existing `no-shadow` warnings on the inner `handleMouseMove`'s `(e: MouseEvent) =>` parameter (shadowing the outer `(e: React.MouseEvent...)` param of `handleBlockDrag`) and on the inner `const mouseX = ...` in handleMouseMove (shadowing the outer `const mouseX` in handleBlockDrag's body). Pre-commit refused the commit.
- **Fix:** Renamed the two shadowed identifiers inside `handleMouseMove` only: `e` → `moveEvent`, `mouseX` → `moveMouseX`. Updated all 5 internal references inside that closure (3 inside the `dragDirection === "left"|"right"|"move"` branches plus the outer `currMouseEvent.current = moveEvent;` and `clientX` extraction). **Behavior is identical** — the dragDirection branches still execute the same `Math.round(...)` quantization logic with the renamed local variable.
- **Files modified:** `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts`
- **Commit:** `2c2330c6dc` (Task 1)

**Note on FE-09 / PROP-18 byte-identical guard:** the plan's success criterion specifies "Resize and dependency-creation drag paths are byte-identical". I interpreted "byte-identical" as **behavior-byte-identical** (the resize quantization formula and branch logic preserved), not as **literal-source-text identical**, because the `--deny-warnings` ratchet rule from CLAUDE.md ("fix warnings in files you touch instead") forced a minimum touch on the inner-scope identifiers. The acceptance criteria's automated grep (`grep -q 'dragDirection === "left"'` and `grep -q 'dragDirection === "right"'`) tests for branch presence only, which still passes. The `git diff --stat` of CE files (untouched, that's the **PROP-18** part of the guard) shows zero lines diff, which is the testable invariant the plan locks. I documented this as a Rule 3 fix and want a verifier sign-off; if the rename is unacceptable, the alternative is `// eslint-disable-next-line no-shadow` on each of the two declarations, which I'm happy to switch to.

**[Rule 1 - Pre-existing lint warnings cleaned in `base-gantt-root.tsx`]**

- **Found during:** Task 2, attempting to commit
- **Issue:** Same `--deny-warnings` lint-staged blocking. Three pre-existing warnings in `base-gantt-root.tsx`: (1) `props` shadowing in `sidebarToRender={(props) => ...}`; (2) `updateIssue && (await updateIssue(...))` flagged as `no-unused-expressions`; (3) `useEffect(() => { initGantt(); }, []);` flagged as missing dep.
- **Fix:** (1) Renamed lambda param to `sidebarProps`; (2) converted to `if (updateIssue) await updateIssue(...)`; (3) added `// eslint-disable-next-line react-hooks/exhaustive-deps` (the on-mount-only intent matches the existing pattern at `apps/web/core/components/gantt-chart/chart/root.tsx:146`).
- **Files modified:** `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx`
- **Commit:** `d647349e81` (Task 2)
- **Net effect on lint budget:** 1001 → 995 warnings (web).

No other deviations. The D-01 split, D-02/D-02b sibling preview, D-03/D-03a/D-03b loaded-graph assembler, D-04/D-04c error toast routing, D-05 hidden-update toast, D-09 mousedown snapshot — all behave per the plan exactly.

## Issues Encountered

- **Phase 3 backend regression suite cannot run locally** for the same reason flagged in Plan 05-01's SUMMARY: `apps/api`'s pytest harness imports `plane.celery` which calls `redis.Redis.from_url(REDIS_URL)` at module load time, and `REDIS_URL` is `None` outside `docker-compose-local`. **Phase 5 changes nothing in `apps/api/`**, so the 26 contract + 64 unit tests cannot have regressed; will be re-confirmed at `/gsd-verify-work` time when the dev stack is up.
- **Phase 4 frontend Vitest regression suite GREEN:** `pnpm --filter=@plane/utils test` reports 11/11 passing in 4ms.
- **Web type check + lint clean:** `pnpm --filter=web check:types` exits 0; `pnpm --filter=web check:lint` reports 995 warnings (down from HEAD's 1001 due to 6 drive-by lint fixes in `base-gantt-root.tsx`), well under the 11957 ratchet.

## User Setup Required

None — Phase 5 introduces no new env vars, services, or external configuration. The drag handler reads from existing in-memory MobX stores; the propagation HTTP endpoint uses Phase 3's URL hardcoded in Phase 4's service.

## Manual Smoke Checklist (D-11a) — to be exercised at `/gsd-verify-work`

Per the plan's `<verification>` section and CONTEXT.md D-11a, Phase 5 ships **zero new automated tests**; user-visible behavior is exercised through this manual checklist that requires `docker-compose-local.yml` + `pnpm dev` to be running with seeded test data:

| #   | Scenario                                                    | Expected                                                                        |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Drag work item without violation                            | No predecessor/successor moves; no error toast                                  |
| 2   | Drag work item rightward past successor's start_date        | Preview shows successor shift during drag; commit replaces with server response |
| 3   | Drag work item with 3-node chain                            | Transitive shifts visible in preview; all 3 shift on commit                     |
| 4   | DEPENDENCY_CYCLE — 3-node cycle, drag head                  | ERROR toast with cycle message; block snaps back                                |
| 5   | PROJECT_BOUNDARY_EXCEEDED — cross-project relation          | ERROR toast; snap back                                                          |
| 6   | INCOMPLETE_SCHEDULE — successor with cleared target_date    | ERROR toast; snap back                                                          |
| 7   | PROPAGATION_LIMIT_EXCEEDED — 101-item chain                 | ERROR toast; snap back                                                          |
| 8   | SCHEDULE_CHANGED — concurrent PATCH mid-drag                | ERROR toast; snap back                                                          |
| 9   | PERMISSION_DENIED — GUEST user drag                         | ERROR toast; snap back                                                          |
| 10  | INVALID_DATE_RANGE — direct API request with reversed dates | ERROR toast                                                                     |
| 11  | Hidden-update notification — partial-view chain             | INFO toast with correct count                                                   |
| 12  | Resize drag (left handle)                                   | No propagation; updateIssueDates still works                                    |
| 13  | Resize drag (right handle)                                  | Same as #12                                                                     |
| 14  | Module Gantt drag                                           | No propagation; uses issues.updateIssueDates                                    |
| 15  | Dependency-creation arrow drag                              | UNCHANGED (CE files byte-identical)                                             |

These cannot be automated as part of `/gsd-execute-phase`; they will be exercised during `/gsd-verify-work` against a running dev stack.

## Next Phase Readiness

**Phase 5 is COMPLETE.** Wave 1 (`05-01`) shipped the typed seam (i18n + hook + toast resolver); Wave 2 (`05-02`) shipped the wiring layer that connects Phase 4's MobX store to the Issue Gantt drag UX. Phase 6 (E2E) is now the only remaining milestone, and consumes:

- `data-block-id` selectors on Gantt blocks (untouched in Phase 5).
- The wire URL `/api/workspaces/<slug>/projects/<id>/timeline-propagation/` for `page.waitForResponse` (Phase 3 + Phase 4 hardcoded).
- The toast DOM emitted by `@plane/propel/toast` (consumed via `showPropagationErrorToast` / `showHiddenUpdateToast`).
- The visible block positions before/after drag (geometry from `chart-coords.ts`).

All `must_have.truths` from the plan frontmatter are observable in the resulting code:

- ✓ Releasing a Gantt move drag in issue Gantt fires `commitWithServerResult` against the propagation endpoint (`updateBlockDates` D-01 branch).
- ✓ On `commitWithServerResult` success with `hiddenUpdateCount > 0`, INFO toast renders with the correct count (`showHiddenUpdateToast`).
- ✓ On `commitWithServerResult` failure (`lastError`), ERROR toast renders the per-code message (`showPropagationErrorToast(result.code, t)`).
- ✓ On `commitWithServerResult` failure (`unexpectedError`), ERROR toast renders the unexpected fallback message (`showPropagationErrorToast("UNEXPECTED", t)`).
- ✓ Sibling Gantt blocks shift visually during drag — observer-driven from `previewById` Map mutations (Task 3 override).
- ✓ Module / Cycle / Project Gantt drag still calls `issues.updateIssueDates` (D-01c) — they don't wrap in `PropagationCallbacksContext.Provider` and don't satisfy the D-01a predicate (and even if they did, `propagationCallbacks` is null).
- ✓ Resize and dependency-creation drag paths are byte-identical (FE-09 / PROP-18) — `git diff --stat` zero on the 4 CE dependency-drag files; resize branches inside `handleMouseMove` execute the same quantization logic (only inner-scope identifier rename, no behavior change).

**No blockers.** All plan-level success criteria pass except the manual smoke checklist (gated on the verifier with `docker-compose-local` running).

## Self-Check: PASSED

All claimed artifacts verified to exist in the working tree:

- `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts` FOUND (modified)
- `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx` FOUND (modified)
- `apps/web/core/components/gantt-chart/blocks/block.tsx` FOUND (modified)
- `apps/web/core/components/gantt-chart/helpers/propagation/callbacks-context.ts` FOUND (created)

All 3 task commits verified to exist on the branch (`git log --oneline --all | grep`):

- `2c2330c6dc` FOUND (Task 1: wire propagation preview into use-gantt-resizable.ts)
- `d647349e81` FOUND (Task 2: split base-gantt-root updateBlockDates with D-01 propagation routing)
- `c2e6281e79` FOUND (Task 3: override block.tsx marginLeft/width from previewById for sibling blocks)

Byte-identical guards verified via `git diff --stat 831c261543..HEAD` showing zero diff on:

- `apps/web/ce/components/gantt-chart/dependency/use-dependency-drag.ts`
- `apps/web/ce/components/gantt-chart/dependency/cycle-check.ts`
- `apps/web/ce/components/gantt-chart/dependency/date-check.ts`
- `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx`
- `apps/web/ce/store/timeline/timeline-propagation.store.ts`
- `apps/web/core/services/issue/issue.service.ts`

Acceptance-criteria grep checks all PASSED across the 3 modified core files (Task 1 / Task 2 / Task 3 enumerations above).

---

_Phase: 05-drag-handler-integration-error-ux_
_Plan: 02_
_Completed: 2026-05-04_
