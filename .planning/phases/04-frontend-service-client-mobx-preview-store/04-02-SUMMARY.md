---
phase: 04-frontend-service-client-mobx-preview-store
plan: 02
subsystem: frontend-mobx-store
tags:
  - frontend
  - mobx
  - plane-web
  - timeline-propagation
  - ce-store
requirements:
  - FE-05
  - FE-07
  - FE-08
  - TEST-20
nyquist_compliant: true
dependency_graph:
  requires:
    - 04-01 (TimelinePropagationService + computeLoadedPreview/diffHiddenUpdate/applyServerWorkItems + wire types)
    - 03-01..03-03 (Phase 3 endpoint + 7-code wire envelope + transaction.on_commit fan-out)
  provides:
    - "TimelinePropagationStore: 4-action MobX store at apps/web/ce/store/timeline/timeline-propagation.store.ts"
    - "ITimelinePropagationStore interface with 6 observables + 1 computed + 4 actions"
    - "Wired field timelinePropagationStore on ITimelineStore + TimeLineStore (apps/web/ce/store/timeline/index.ts)"
    - "Stable in-process API for Phase 5: rootStore.timelineStore.timelinePropagationStore.{beginPreview, updatePreview, commitWithServerResult, rollback}"
  affects:
    - "Phase 5 (drag handler) consumes the 4-action surface + 6 observables; supplies edges + items_by_id + expected_updated_at via beginPreview"
    - "Phase 6 (E2E) drives the full UI → store → server → store cycle; covers TEST-20 (rollback) + TEST-23 / TEST-24"
tech-stack:
  added: []
  patterns:
    - "MobX 6 makeObservable with mixed observable / observable.ref annotations: observable (deep) for Map containers per Pitfall 3; observable.ref for primitives + replaced refs"
    - "Single outer runInAction wrapping the per-id rootStore.issue.issues.updateIssue loop (Pitfall 8) — MobX batches N writes into one reaction"
    - "lastPreviewIds snapshot captured BEFORE network call (Pitfall 6) — survives both success-path previewById.clear() AND a concurrent beginPreview that lands during the in-flight window"
    - "Closed-set _isProtocolError(value): value is TTimelinePropagationError discriminator (D-05c) — only the 7 wire codes route to lastError; non-protocol errors (network, 5xx, missing code) go to a separate unexpectedError observable"
    - "In-flight commit promise cache (Pitfall 7 / D-08a) — second concurrent call returns the same promise so 'one drag = one network call'"
    - "Snake_case observables matching wire shape (D-09) — { start_date, target_date } with no camelCase translation; mirrors TIssue field names"
key-files:
  created:
    - "apps/web/ce/store/timeline/timeline-propagation.store.ts (~340 lines after oxfmt) — TimelinePropagationStore class + ITimelinePropagationStore interface + private _isProtocolError discriminator"
  modified:
    - "apps/web/ce/store/timeline/index.ts (+5 lines) — added 2 imports + 1 ITimelineStore field + 1 TimeLineStore field + 1 constructor instantiation"
decisions:
  - "D-05 / D-05a — Store ships the 4-action state machine (IDLE → PREVIEWING → IDLE on success | failure | rollback). Stale calls (updatePreview before beginPreview, commitWithServerResult outside PREVIEWING) are no-ops; the latter resolves to a synthetic local-only `INVALID_DATE_RANGE` envelope that signals 'no active preview' rather than misreporting one of the 7 server codes."
  - "D-05b — beginPreview snapshots edges + items_by_id + expected_updated_at into a private PropagationSnapshot once. updatePreview re-runs computeLoadedPreview against that frozen snapshot — never re-reads MobX trees mid-drag, so an unrelated socket event cannot redraw the preview against new positions."
  - "D-05c — Dual-observable error path. lastError carries one of the 7 wire codes (closed-set discriminated by _isProtocolError); unexpectedError holds raw Error instances for network/5xx/missing-code failures. The two observables stay strictly separate — Phase 5 chooses which to render."
  - "D-05d — Canonical write-back surface is rootStore.issue.issues.updateIssue(wi.id, { start_date, target_date, updated_at }). The store does NOT mutate IssuesTimeLineStore.blocksMap directly. The per-id loop sits inside ONE outer runInAction so MobX batches the writes (Pitfall 8)."
  - "D-05e — lastPreviewIds: ReadonlySet<string> | null is captured BEFORE clearing previewById on success (and even before the network call, so a concurrent beginPreview cannot erase it). hiddenUpdateCount computes against this snapshot via diffHiddenUpdate."
  - "D-06 — apps/web/ce/store/timeline/index.ts extended with ITimelinePropagationStore field + TimelinePropagationStore instantiation. apps/web/ce/store/root.store.ts UNCHANGED (RootStore already wires TimeLineStore)."
  - "D-06a — Constructor takes RootStore for parity with siblings (BaseTimeLineStore et al.). Only reads the rootStore.issue.issues.updateIssue write surface — kept narrow per D-07."
  - "D-08 — beginPreview silently replaces an active preview (no queue, no debounce). Drag UX: a new mousedown should never block on stale state from a dropped mouseup."
  - "D-08a — In-flight commit shares its promise via private inflightCommit field; second concurrent call returns the same promise, never double-POSTs. Cleared in finally so a subsequent commit after settle can run."
  - "D-09 — Wire types stay snake_case throughout the store: previewById values `{ start_date, target_date }` mirror TIssue's snake_case fields; no translation layer."
metrics:
  duration_seconds: ~240
  completed_at: 2026-05-04
  tasks_executed: 2
  files_created: 1
  files_modified: 1
  commits: 2
---

# Phase 4 Plan 02: TimelinePropagationStore + CE TimeLineStore Wiring Summary

Wave 2 of Phase 4 ships the in-process API Phase 5's drag handler will consume:
a MobX store at `apps/web/ce/store/timeline/timeline-propagation.store.ts` plus
a 5-line surgical extension to the CE timeline barrel.

## One-liner

4-action MobX preview store with dual-observable error split (`lastError` for
the 7 wire codes; `unexpectedError` for network/5xx), in-flight commit promise
cache, snapshot-driven re-preview, and `lastPreviewIds`-pre-clear so
`hiddenUpdateCount` survives the success-path reset — built on top of Wave 1's
typed wire contract and pure helpers.

## What shipped

### Files created (1)

- `apps/web/ce/store/timeline/timeline-propagation.store.ts` — exports
  `interface ITimelinePropagationStore` and `class TimelinePropagationStore
implements ITimelinePropagationStore`. Private `_isProtocolError(value):
value is TTimelinePropagationError` shape-discriminator at module scope
  validates the closed set of 7 wire codes (D-05c).

### Files modified (1)

- `apps/web/ce/store/timeline/index.ts` — +5 lines:
  1. `import { TimelinePropagationStore } from "./timeline-propagation.store";`
  2. `import type { ITimelinePropagationStore } from "./timeline-propagation.store";`
  3. `timelinePropagationStore: ITimelinePropagationStore;` field on
     `ITimelineStore` interface.
  4. `timelinePropagationStore: ITimelinePropagationStore;` field on
     `TimeLineStore` class.
  5. `this.timelinePropagationStore = new TimelinePropagationStore(rootStore);`
     in the constructor (after `groupedTimeLineStore`).

  No change to `apps/web/ce/store/root.store.ts` — `RootStore` already wires
  `TimeLineStore` (D-06).

### Store surface

| Member                         | Type                                                                 | Notes                                                                                                                                                                                                                                                                               |
| ------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `previewById`                  | `Map<string, { start_date: string; target_date: string }>`           | Deep observable (Pitfall 3). Snake_case wire shape (D-09).                                                                                                                                                                                                                          |
| `isPreviewActive`              | `boolean`                                                            | `observable.ref`                                                                                                                                                                                                                                                                    |
| `lastError`                    | `TTimelinePropagationError \| null`                                  | `observable.ref`. Only the 7 wire codes (D-05c).                                                                                                                                                                                                                                    |
| `lastResponse`                 | `TTimelinePropagationResponse \| null`                               | `observable.ref`                                                                                                                                                                                                                                                                    |
| `lastPreviewIds`               | `ReadonlySet<string> \| null`                                        | `observable.ref`. Captured BEFORE network call so `hiddenUpdateCount` survives `previewById.clear()` (Pitfall 6 / D-05e).                                                                                                                                                           |
| `unexpectedError`              | `Error \| null`                                                      | `observable.ref`. Non-protocol failures only (D-05c).                                                                                                                                                                                                                               |
| `hiddenUpdateCount`            | `number`                                                             | `computed`. `diffHiddenUpdate(lastResponse.work_items, lastPreviewIds)`; returns 0 when either is null.                                                                                                                                                                             |
| `beginPreview(args)`           | `void`                                                               | `action.bound`. Snapshots `edges` / `items_by_id` / `expected_updated_at`. Replaces any active preview silently (D-08).                                                                                                                                                             |
| `updatePreview(args)`          | `void`                                                               | `action.bound`. Re-runs `computeLoadedPreview` against the snapshot (D-05b). No-op when not PREVIEWING.                                                                                                                                                                             |
| `commitWithServerResult(args)` | `Promise<TTimelinePropagationResponse \| TTimelinePropagationError>` | `action.bound`. Returns a UNION (never throws). Re-entrant calls share `inflightCommit` (D-08a / Pitfall 7). On success: per-id `rootStore.issue.issues.updateIssue` loop in single outer `runInAction` (D-05d / Pitfall 8). Stale-call returns synthetic local-only error (D-05a). |
| `rollback()`                   | `void`                                                               | `action.bound`. Clears `previewById` + `snapshot`; flips `isPreviewActive = false`. Idempotent. Does NOT clear `lastError` / `lastResponse` (Phase 5 may still want to render previous-commit outcomes).                                                                            |

## Verification gates (all GREEN)

| Gate                             | Command                                                                                                 | Result                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Wave 1 Vitest (regression guard) | `pnpm --filter=@plane/utils test`                                                                       | 1 file, 11 passed (4ms)                            |
| Phase 3 contract regression      | `pytest plane/tests/contract/app/test_timeline_propagation.py --reuse-db --nomigrations` (in-container) | 26 passed in 3.91s                                 |
| Phase 3 unit regression          | `pytest plane/tests/unit/services/timeline_propagation/ --reuse-db --nomigrations` (in-container)       | 64 passed in 1.30s                                 |
| Cross-package types              | `pnpm check:types --filter=@plane/types --filter=@plane/services --filter=@plane/utils --filter=web`    | 14 successful, FULL TURBO                          |
| Cross-package lint               | `pnpm check:lint --filter=@plane/types --filter=@plane/services --filter=@plane/utils --filter=web`     | 4 successful, FULL TURBO (warnings within budgets) |
| Web lint after Task 1            | `pnpm check:lint --filter=web`                                                                          | 1001 warnings (budget 11957)                       |
| FE-08 inert files                | `git diff --exit-code HEAD~2 HEAD -- apps/web/ce/components/gantt-chart/dependency/`                    | clean                                              |
| D-03b inert file                 | `git diff --exit-code HEAD~2 HEAD -- apps/web/core/services/issue/issue.service.ts`                     | clean                                              |
| D-05d inert file                 | `git diff --exit-code HEAD~2 HEAD -- apps/web/core/store/issue/helpers/base-issues.store.ts`            | clean                                              |
| D-06 inert file                  | `git diff --exit-code HEAD~2 HEAD -- apps/web/ce/store/root.store.ts`                                   | clean                                              |

## TEST-20 coverage rationale

TEST-20 ("failure → preview rollback") is covered transitively by three layers,
none of which require introducing Vitest in `apps/web` (D-01 rejects that):

1. **Helper-immutability invariant** (Wave 1, D-04c): `preview.test.ts` already
   ships 3 explicit `it("immutability ...")` cases asserting `JSON.parse(JSON.stringify(...))`
   snapshot equality on inputs after each helper runs. So no failure path can
   leak writes through the snapshot the store re-uses.
2. **Store rollback semantics by inspection**: the `rollback()` action is a
   single `runInAction` block (`previewById.clear()` + `isPreviewActive =
false` + `snapshot = null`). The failure branch of `_doCommit` runs the
   identical reset (plus `lastError` or `unexpectedError` set), and crucially
   does NOT call `rootStore.issue.issues.updateIssue` — the canonical issues
   map is never touched on failure. This is greppable: `rootStore.issue.issues.updateIssue`
   appears exactly once in the file, inside the success branch.
3. **Phase 6 E2E TEST-24** (already scoped in ROADMAP §"Phase 6"): drives the
   full UI → store → server → store flow under a forced failure code
   (recommended: `INCOMPLETE_SCHEDULE`).

A dedicated Phase 4 unit test for `rollback()` would require Vitest in
`apps/web` — REJECTED by D-01 (the user-explicit "do not invent test harnesses
without asking" boundary, recorded in `CONCERNS.md`).

## Decisions exercised

| Decision | Implementation                                                             | Verification                                                                                                                                                                                                   |
| -------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ----------------------------------------------------------------------------------------------------------------------- |
| D-05     | 4-action surface + 6 observables + 1 computed                              | grep returns 4 `action.bound`, 5 `.ref`, `previewById: observable,`, `hiddenUpdateCount: computed`                                                                                                             |
| D-05a    | State machine IDLE ↔ PREVIEWING; stale calls no-op                         | `if (!this.isPreviewActive                                                                                                                                                                                     |     | !this.snapshot) return;`guards on`updatePreview`; synthetic local-only error envelope on stale `commitWithServerResult` |
| D-05b    | Snapshot taken at `beginPreview`; `updatePreview` re-runs against snapshot | Private `snapshot: PropagationSnapshot \| null` field; `updatePreview` never reads `this.rootStore`                                                                                                            |
| D-05c    | Dual-observable error split; closed-set discriminator                      | `_isProtocolError` validates `code` against the 7-element ReadonlySet; `unexpectedError: Error \| null` is a separate observable                                                                               |
| D-05d    | `rootStore.issue.issues.updateIssue` per-row in single outer `runInAction` | `grep -q "this\\.rootStore\\.issue\\.issues\\.updateIssue"` returns one match, inside the success runInAction                                                                                                  |
| D-05e    | `lastPreviewIds` captured BEFORE clearing `previewById`                    | `previewIdsAtSend = new Set(this.previewById.keys())` runs BEFORE the network call (line ~270); `this.lastPreviewIds = previewIdsAtSend` runs BEFORE `this.previewById.clear()` inside the success runInAction |
| D-06     | `ITimelineStore` + `TimeLineStore` extended; root unchanged                | `grep -c "timelinePropagationStore: ITimelinePropagationStore"` returns 2; `git diff --exit-code HEAD~2 HEAD -- apps/web/ce/store/root.store.ts` empty                                                         |
| D-06a    | Constructor takes `RootStore` parity                                       | `constructor(rootStore: RootStore)` matches `BaseTimeLineStore`; only reads `rootStore.issue.issues.updateIssue`                                                                                               |
| D-08     | New `beginPreview` silently replaces previous preview                      | `previewById.clear()` runs first thing in `beginPreview`'s `runInAction`                                                                                                                                       |
| D-08a    | `inflightCommit` shared promise                                            | `private inflightCommit` field; `if (this.inflightCommit) return this.inflightCommit;` guard; `finally { this.inflightCommit = null; }`                                                                        |
| D-09     | snake_case throughout                                                      | `! grep -qE "(startDate\|targetDate\|updatedAt\|workItemId\|expectedUpdatedAt)"` returns success                                                                                                               |

## Pitfalls averted

| Pitfall                                                     | Mitigation                                                                                                                     | Verification                                                                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pitfall 3 — Map reactivity                                  | `previewById` declared as `observable` (deep), not `.ref`. Mutations via `.set()` / `.clear()` trigger reactions.              | `grep -q "previewById: observable,"` returns success                                                                                               |
| Pitfall 6 — `hiddenUpdateCount` after `previewById.clear()` | `previewIdsAtSend` snapshot captured BEFORE network call; `lastPreviewIds = previewIdsAtSend` set BEFORE `previewById.clear()` | grep ordering: `this.lastPreviewIds = previewIdsAtSend` (line 277) precedes `this.previewById.clear()` (line 281) inside the success `runInAction` |
| Pitfall 7 — Re-entrant commit                               | `inflightCommit` promise cache; `try { return await ... } finally { ... = null; }`                                             | `grep -qE "private inflightCommit"` returns success                                                                                                |
| Pitfall 8 — Reactive write storm                            | Per-id `rootStore.issue.issues.updateIssue` loop wrapped in ONE outer `runInAction` so MobX batches into a single reaction     | The success `runInAction` block contains the `for (const wi of response.work_items) { … updateIssue(wi.id, {...}) }` loop directly                 |

## Inert constraints honored

- `apps/web/ce/components/gantt-chart/dependency/{use-dependency-drag.ts, cycle-check.ts, date-check.ts, dependency-paths.tsx}` — UNCHANGED (FE-08).
- `apps/web/core/services/issue/issue.service.ts` — UNCHANGED (D-03b / API-11).
- `apps/web/core/store/issue/helpers/base-issues.store.ts` — UNCHANGED (D-05d; the store calls `updateIssue` on the issue store directly, NOT the higher-level `issueUpdate` helper).
- `apps/web/ce/store/root.store.ts` — UNCHANGED (D-06; RootStore already wires TimeLineStore).
- `turbo.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` — UNCHANGED (no new deps added by this plan).

All verified by `git diff --exit-code HEAD~2 HEAD -- <path>` returning clean.

## Inputs Phase 5 will consume

- **Store handle:** `rootStore.timelineStore.timelinePropagationStore`
- **Action signatures:**
  - `beginPreview({ dragged_id, original_start_date, original_target_date, expected_updated_at, edges, items_by_id })`
  - `updatePreview({ requested_start_date, requested_target_date })`
  - `commitWithServerResult({ workspaceSlug, projectId, requested_start_date, requested_target_date }) → Promise<TTimelinePropagationResponse | TTimelinePropagationError>`
  - `rollback() → void`
- **Observables to render:** `previewById`, `isPreviewActive`, `lastError`,
  `lastResponse`, `lastPreviewIds`, `unexpectedError`, `hiddenUpdateCount`
- **Wire-error code → i18n key mapping (Phase 5 owns ERR-01..ERR-07):**
  - `DEPENDENCY_CYCLE` → ERR-01
  - `PROJECT_BOUNDARY_EXCEEDED` → ERR-02
  - `INCOMPLETE_SCHEDULE` → ERR-03
  - `PROPAGATION_LIMIT_EXCEEDED` → ERR-04
  - `SCHEDULE_CHANGED` → ERR-05
  - `PERMISSION_DENIED` → ERR-06
  - `INVALID_DATE_RANGE` → ERR-07
- **Non-protocol error path (ERR-08 candidate):** Phase 5 renders
  `unexpectedError.message` directly, or maps to a generic "network or server
  error" i18n key — the choice belongs in Phase 5, NOT here.
- **Helper types Phase 5 supplies via `beginPreview`:**
  - `LoadedGraphEdge[]` (from `IssueRelation` store + `blocking`/`blocked_by` direction normalize)
  - `Record<string, LoadedWorkItem>` (assembled from `IssuesTimeLineStore.blocksMap`)

## Phase requirement IDs cleared

- **FE-05** — failure path discards `previewById` and stores `lastError` (or `unexpectedError`); original schedule never touched on failure (no `updateIssue` calls).
- **FE-07** — no confirmation flag / dialog seam in the store; safe limit (≤100) is enforced server-side per Phase 3 PROP-13.
- **FE-08** — dependency-creation drag files explicitly NOT touched (verified by `git diff --exit-code` on the four CE files).
- **TEST-20** — covered transitively per the rationale above (helper immutability + store inspection + Phase 6 E2E TEST-24).

## Deviations from Plan

None — both tasks executed exactly as written. Auto-fix Rules 1–3 were not
triggered. No checkpoint was hit. Auto mode (`--auto`) ran end-to-end without
human input.

The only mechanical change between the plan's reference snippet and the
committed file is that `oxfmt` collapsed the multi-line `@plane/utils` import
into a single line:

```ts
// before oxfmt:
import { computeLoadedPreview, diffHiddenUpdate, type LoadedGraphEdge, type LoadedWorkItem } from "@plane/utils";

// after oxfmt:
import { computeLoadedPreview, diffHiddenUpdate, type LoadedGraphEdge, type LoadedWorkItem } from "@plane/utils";
```

Semantics identical; this is the project's standard `oxfmt` pre-commit
behavior.

## Self-Check: PASSED

**Files exist:**

- `apps/web/ce/store/timeline/timeline-propagation.store.ts` ✓
- `apps/web/ce/store/timeline/index.ts` ✓ (modified)

**Commits resolve in `git log`:**

- `d810b92105` — `feat(04-02): add TimelinePropagationStore MobX store` ✓
- `888ff6c32b` — `feat(04-02): wire TimelinePropagationStore into TimeLineStore` ✓

**All Wave-2 success criteria (1–9 in PLAN.md `<success_criteria>`) hold:**

1. Store ships with all required exports — ✓
2. CE wiring ships in `index.ts` — ✓
3. MobX patterns correct (deep `previewById` + `.ref` for primitives + `computed` for `hiddenUpdateCount` + `action.bound` for all 4) — ✓
4. Pitfalls 3, 6, 7, 8 + D-05c handled — ✓
5. Wave 1 Vitest still GREEN (11/11) — ✓
6. Cross-package types + lint GREEN within budgets — ✓
7. Phase 3 backend regression GREEN (26 contract + 64 unit) — ✓
8. Inert constraints honored — ✓
9. Phase 5 unblocked — all seams documented above — ✓
