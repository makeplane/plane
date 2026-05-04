---
phase: 04-frontend-service-client-mobx-preview-store
plan: 01
subsystem: frontend-typescript
tags:
  - typescript
  - vitest
  - plane-types
  - plane-services
  - plane-utils
  - timeline-propagation
  - wire-contract
requirements:
  - FE-01
  - FE-02
  - FE-04
  - FE-06
  - TEST-19
  - TEST-21
  - TEST-22
nyquist_compliant: true
dependency_graph:
  requires:
    - 03-01 (TimelinePropagationView routing + URL `/api/workspaces/<slug>/projects/<uuid>/timeline-propagation/`)
    - 03-02 (TimelinePropagationView body + 7 PropagationErrorCode wire codes + STATUS_BY_CODE mapping + structural-only serializer)
    - 03-03 (transaction.on_commit fan-out — confirms updated_at semantics for the FE wire types)
  provides:
    - "Wire-contract TS types in @plane/types: TTimelinePropagationRequest /
      Response / Error / ErrorCode / Operation / WorkItem (snake_case)"
    - "TimelinePropagationService.propagateMove(workspaceSlug, projectId, body)
      in @plane/services — single axios POST that resolves with the success
      payload and rethrows error?.response?.data as TTimelinePropagationError"
    - "Pure preview helpers in @plane/utils/timeline-propagation:
      computeLoadedPreview / diffHiddenUpdate / applyServerWorkItems plus the
      LoadedGraphEdge / LoadedWorkItem / PreviewResult types"
    - "Vitest harness onboarded into @plane/utils as the third Vitest package
      in the monorepo (after apps/live and packages/codemods); local pin
      vitest@^4.0.8"
  affects:
    - "Wave 2 (04-02) MobX store can build against the typed wire contract,
      instantiate the service per D-03c, and consume the three pure helpers
      via @plane/utils"
    - "Phase 5 drag handler will hand snapshots typed as LoadedGraphEdge[] /
      Record<string, LoadedWorkItem> to the Wave 2 store's beginPreview"
tech-stack:
  added:
    - "vitest ^4.0.8 (local devDep on @plane/utils; matches packages/codemods
      pin exactly; NOT added to pnpm-workspace.yaml catalog per D-10a)"
  patterns:
    - "Wire-error throw convention: service .catch rethrows error?.response?.data
      (the response body) as TTimelinePropagationError — mirrors the canonical
      apps/web/core/services/issue/issue.service.ts:248-251 shape. NOT
      error?.response (the axios envelope sites-issue.service.ts uses)."
    - "Snake_case TS types matching the wire shape verbatim — same convention
      as TBaseIssue (start_date, target_date, updated_at). No oxlint-disable
      needed; @plane/types does not enable a camelcase rule."
    - "Pure-helper-first testing: pure preview/diff/apply functions in
      packages/utils/src/timeline-propagation/preview.ts cover TEST-19/21/22
      via Vitest; the MobX store (Wave 2) is a thin shell tested transitively
      by Phase 6 E2E. Aligns with CONCERNS.md §35-40 — do not invent test
      harnesses without asking; @plane/utils is the lowest-friction Vitest
      onboarding site."
    - "Calendar-day arithmetic via @plane/utils/datetime primitives
      (addDaysToDate, findTotalDaysInRange, renderFormattedPayloadDate). No
      direct date-fns import in preview.ts (D-04b) — keeps the future
      Working-Calendar swap (ADR 0002) confined to the datetime module."
    - "Immutability invariants pinned by tests: every helper returns a new
      Map / Object and every test snapshots inputs with JSON.parse(JSON.stringify(...))
      to assert no mutation (D-04c). Required so MobX runInAction blocks in
      the Wave 2 store can call helpers without leaking writes through the
      input maps."
key-files:
  created:
    - "packages/types/src/issues/timeline-propagation.ts (65 lines) — six wire
      type aliases mirroring Phase 3 D-04 verbatim"
    - "packages/services/src/issue/timeline-propagation.service.ts (45 lines)
      — TimelinePropagationService extends APIService; single propagateMove
      method"
    - "packages/utils/vitest.config.ts (9 lines) — node env, globals=true,
      include=src/**/*.test.ts"
    - "packages/utils/src/timeline-propagation/index.ts (8 lines) — barrel
      re-export"
    - "packages/utils/src/timeline-propagation/preview.ts (208 lines) —
      computeLoadedPreview / diffHiddenUpdate / applyServerWorkItems + their
      input/result types"
    - "packages/utils/src/timeline-propagation/__tests__/preview.test.ts (217
      lines) — 11 it() cases across 3 describe blocks (TEST-19/21/22)"
  modified:
    - 'packages/types/src/index.ts — +1 line (`export * from "./issues/timeline-propagation"`)'
    - 'packages/services/src/issue/index.ts — +1 line (`export * from "./timeline-propagation.service"`)'
    - 'packages/utils/src/index.ts — +1 line (`export * from "./timeline-propagation"`, alphabetical between theme-legacy and url)'
    - 'packages/utils/package.json — +2 lines (`"test": "vitest run"` script and `"vitest": "^4.0.8"` devDep)'
    - "pnpm-lock.yaml — refreshed for the new vitest devDep on @plane/utils"
decisions:
  - "D-01 / D-01a / D-01b / D-10a — Vitest onboarded into @plane/utils with a
    bare-minimum config (node env, globals=true, include glob), local pin
    `^4.0.8` matching packages/codemods exactly. Did NOT add vitest to the
    pnpm-workspace.yaml catalog (deferred to milestone-level cleanup) and did
    NOT add a `test` task to turbo.json (deferred per D-10b)."
  - "D-02 / D-02a / D-02b / D-09 — Wire types stay snake_case throughout (no
    camelCase translation). Service throws on failure (no `{ ok: true | false }`
    discriminated union); the thrown value IS the response body so callers
    can `try / catch` with the same shape they use elsewhere in the
    codebase."
  - "D-03 / D-03a / D-03b / D-03c — TimelinePropagationService is per-store
    instantiation (NOT a singleton); URL `/api/workspaces/<slug>/projects/<uuid>/timeline-propagation/`
    has NO `/api/v1/` prefix (matches Plan 03-01 STATE.md correction note);
    apps/web/core/services/issue/issue.service.ts::updateIssueDates LEFT
    UNTOUCHED per D-03b / API-11 regression guard."
  - "D-04 / D-04a / D-04b / D-04c — computeLoadedPreview is the loaded-subset
    advisory companion to Phase 2's algorithm (server is authoritative).
    Chain propagation arises naturally from BFS over loaded edges; branch
    cases pick the most-restrictive predecessor.new_target+1 floor; missing
    successors in items_by_id are silently skipped (server catches them).
    All three helpers are pure and never mutate inputs."
metrics:
  duration_seconds: ~480
  completed_at: 2026-05-04
---

# Phase 4 Plan 01: @plane/types + @plane/services + @plane/utils + Vitest Harness Summary

Wave 1 of Phase 4 settles the typed wire contract that Wave 2's MobX store and
Phase 5's drag handler will both consume.

## One-liner

Wire-contract TS types, a single `TimelinePropagationService.propagateMove`
method, three pure preview/diff/apply helpers, and a Vitest harness — all
GREEN with zero new UI behavior.

## What shipped

### Files created (6)

- `packages/types/src/issues/timeline-propagation.ts` — six wire type
  aliases:
  - `TTimelinePropagationErrorCode` (literal-union of the 7 wire codes)
  - `TTimelinePropagationOperation` (literal `"move"` per PROP-18)
  - `TTimelinePropagationRequest` (8 snake_case fields)
  - `TTimelinePropagationWorkItem` (id + start_date + target_date + updated_at)
  - `TTimelinePropagationResponse` (requested_work_item_id, total_updated_count,
    client_preview_count: number | null, work_items: [...])
  - `TTimelinePropagationError` ({ code, message })
- `packages/services/src/issue/timeline-propagation.service.ts` —
  `TimelinePropagationService extends APIService`. Single
  `propagateMove(workspaceSlug, projectId, body)` method that POSTs to
  `/api/workspaces/${workspaceSlug}/projects/${projectId}/timeline-propagation/`,
  resolves to the typed response on success, and rethrows
  `error?.response?.data` as `TTimelinePropagationError` on failure
  (canonical wire-error pattern from
  `apps/web/core/services/issue/issue.service.ts:248-251`).
- `packages/utils/vitest.config.ts` — bare-minimum analog of
  `packages/codemods/vitest.config.ts`, plus an explicit `include` glob.
- `packages/utils/src/timeline-propagation/index.ts` — barrel re-export.
- `packages/utils/src/timeline-propagation/preview.ts` — three pure helpers:
  - `computeLoadedPreview(edges, items_by_id, dragged) → PreviewResult` —
    BFS over the loaded subset of the precedence graph; rightward direction
    walks successors, leftward walks predecessors; branch case picks the
    most-restrictive `predecessor.new_target+1` floor; missing successors
    are silently skipped (server is authoritative).
  - `diffHiddenUpdate(server_work_items, preview_ids) → number` — counts
    server-included Work Items absent from the preview ids.
  - `applyServerWorkItems(current, server_work_items) → next` — projects
    server dates+updated_at onto the existing snapshot; ids that don't
    already exist in `current` are NOT inserted (hidden updates surface via
    `diffHiddenUpdate`).
- `packages/utils/src/timeline-propagation/__tests__/preview.test.ts` — 11
  `it()` cases across 3 `describe` blocks.

### Files modified (5)

- `packages/types/src/index.ts` — added the `./issues/timeline-propagation`
  re-export adjacent to the other `./issues/*` re-exports.
- `packages/services/src/issue/index.ts` — added the
  `./timeline-propagation.service` re-export.
- `packages/utils/src/index.ts` — added the `./timeline-propagation`
  re-export alphabetically between `theme-legacy` and `url`.
- `packages/utils/package.json` — added `"test": "vitest run"` script and
  `"vitest": "^4.0.8"` devDep.
- `pnpm-lock.yaml` — refreshed by `pnpm install` for the new devDep.

## Vitest test count

Final Vitest run reports **11 tests passed across 3 describe blocks**:

```
✓ src/timeline-propagation/__tests__/preview.test.ts (11 tests) 4 ms
  ✓ computeLoadedPreview (TEST-19 / FE-01 / FE-02)        — 5 cases
    ✓ simple: rightward move pushes a single loaded successor
    ✓ chain: transitive walk pushes A → B → C through the loaded subset
    ✓ branch: most-restrictive boundary wins when a successor has multiple loaded predecessors
    ✓ incomplete loaded data: silently skips successors not in items_by_id
    ✓ immutability (D-04c): inputs are not mutated
  ✓ applyServerWorkItems (TEST-21 / FE-04)                — 3 cases
    ✓ server work_items REPLACE existing dates+updated_at on every matched id
    ✓ server work_items not present in current map are NOT inserted
    ✓ immutability (D-04c): does not mutate the input current snapshot or server array
  ✓ diffHiddenUpdate (TEST-22 / FE-06)                    — 3 cases
    ✓ counts server work_items not present in preview ids
    ✓ returns 0 when every server work_item is in the preview
    ✓ returns server.length when preview is empty

Test Files  1 passed (1)
Tests       11 passed (11)
```

TEST-20 (rollback) is intentionally NOT in this file; per RESEARCH §"Phase
Requirements → Test Map" it is covered transitively by the immutability
invariants above (D-04c) plus Phase 6 E2E TEST-24, since the MobX store's
rollback is a single `runInAction(() => this.previewById.clear())` line in
Wave 2.

## Phase 3 backend regression guard

Both Phase 3 contract and Phase 1+2 unit suites for `timeline_propagation`
remain GREEN under the project's container-based test runner:

```
$ docker exec plane-api-1 sh -c "cd /code && DJANGO_SETTINGS_MODULE=plane.settings.test \
    pytest plane/tests/contract/app/test_timeline_propagation.py --reuse-db --nomigrations"
26 passed, 26 warnings in 3.75s

$ docker exec plane-api-1 sh -c "cd /code && DJANGO_SETTINGS_MODULE=plane.settings.test \
    pytest plane/tests/unit/services/timeline_propagation/ --reuse-db --nomigrations"
64 passed, 3 warnings in 1.30s
```

13 magic-link auth tests in `plane/tests/contract/app/test_authentication.py`
fail in the container (pre-existing — see Phase 1+2 deferred-items log; not
caused by Phase 4 changes; out of scope per SCOPE BOUNDARY).

## Decisions exercised

| Decision             | Implementation                                                                               | Verification                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| D-01 / D-01a / D-01b | Vitest harness in `@plane/utils` with `node env`, `globals=true`, `include=src/**/*.test.ts` | `pnpm --filter=@plane/utils test` returns 11 passed                               |
| D-02 / D-02a / D-02b | snake_case TS types; service throws on failure; barrel re-export                             | grep'd field names + literal codes in source; `grep -c "ok:"` returns 0           |
| D-03                 | URL `/api/workspaces/<slug>/projects/<uuid>/timeline-propagation/` (NO `/v1/`)               | `! grep -q "/api/v1/"` in service file                                            |
| D-03b                | `apps/web/core/services/issue/issue.service.ts` UNCHANGED                                    | `git diff --exit-code HEAD~5 HEAD --` empty for that file                         |
| D-03c                | Service is NOT exported as a singleton (Wave 2 store will instantiate per-store)             | `! grep -q "export const timelinePropagationService"`                             |
| D-04 / D-04a / D-04c | Three pure helpers; never mutate inputs                                                      | 3 immutability `it()` cases pin via JSON snapshot diff                            |
| D-04b                | Helpers reuse `@plane/utils/datetime`, NOT direct `date-fns`                                 | `! grep -q "from \"date-fns\""` in preview.ts                                     |
| D-09                 | Snake_case throughout (wire + helper inputs)                                                 | All wire field names + helper signatures verified                                 |
| D-10                 | OxLint `--max-warnings=38` budget unchanged                                                  | grep returns the 38 budget; `pnpm check:lint` reports 36 warnings (within budget) |
| D-10a                | vitest is a local devDep, NOT in pnpm catalog                                                | `! grep -qE "^\\s+vitest:" pnpm-workspace.yaml`                                   |
| D-10b                | `turbo.json` UNCHANGED                                                                       | `git diff --exit-code HEAD~5 HEAD -- turbo.json` empty                            |

## Pitfalls averted (from RESEARCH)

| Pitfall                                                        | Mitigation                                                                                                 | Verification                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Pitfall 1 — Vitest tests leaking into `dist/`                  | tsdown.config.ts entry is `src/index.ts` only; tests live in `__tests__/` subdir                           | `find packages/utils/dist -name '*.test.*' \| wc -l` returns `0`             |
| Pitfall 2 — unnecessary `oxlint-disable` for snake_case fields | `.oxlintrc.json` does NOT enable a `camelcase` rule; existing TBaseIssue ships snake_case without disables | `grep -c "oxlint-disable"` in new files returns `0`; `pnpm check:lint` GREEN |
| Pitfall 3 — `/api/v1/` URL prefix                              | Plan 03-01 correction note in STATE.md; URL is `/api/...` only                                             | `! grep -q "/api/v1/"` across all new files                                  |
| Pitfall 10 — Vitest 4 + Vite/TS catalog peer-dep clash         | matched `packages/codemods` pin exactly (`^4.0.8`); no catalog change                                      | `pnpm install` clean; smoke test then preview test both GREEN                |

## Inputs Wave 2 (04-02) consumes

- **Service:** `TimelinePropagationService` from `@plane/services` —
  instantiated as `new TimelinePropagationService()` inside the new
  `TimelinePropagationStore` constructor (D-03c).
- **Helpers:** `computeLoadedPreview`, `applyServerWorkItems`,
  `diffHiddenUpdate` from `@plane/utils` — used inside store actions and
  the `hiddenUpdateCount` computed.
- **Helper types:** `LoadedGraphEdge`, `LoadedWorkItem`, `PreviewResult`
  from `@plane/utils` — typed inputs for `beginPreview`/`updatePreview`
  args; Phase 5 drag handler will assemble these from
  `IssuesTimeLineStore.blocksMap` + the IssueRelation store.
- **Wire types:** all six `TTimelinePropagation*` from `@plane/types` —
  store observables `lastError: TTimelinePropagationError | null` and
  `lastResponse: TTimelinePropagationResponse | null` use these directly.

## Deviations from Plan

None — every task executed exactly as written. Auto-fix Rules 1–3 were not
triggered. No checkpoint was hit.

## Self-Check: PASSED

- All 6 created files exist on disk:
  - `packages/types/src/issues/timeline-propagation.ts` ✓
  - `packages/services/src/issue/timeline-propagation.service.ts` ✓
  - `packages/utils/vitest.config.ts` ✓
  - `packages/utils/src/timeline-propagation/index.ts` ✓
  - `packages/utils/src/timeline-propagation/preview.ts` ✓
  - `packages/utils/src/timeline-propagation/__tests__/preview.test.ts` ✓
- All 5 commit hashes resolve in `git log`:
  - `6db219631d` (Task 1) ✓
  - `a126b6fbf6` (Task 2) ✓
  - `3326239c1c` (Task 3) ✓
  - `fa300e3efb` (Task 4) ✓
  - `e16d19dc56` (Task 5) ✓
- All Wave-1 success criteria (1–10 in PLAN.md `<success_criteria>`) hold:
  - Wire types ship + barrel-exported
  - Service ships with the canonical URL + wire-error throw
  - Vitest harness onboarded with the matching version pin
  - 3 pure helpers ship + barrel-exported via `@plane/utils`
  - 11 tests GREEN; no `failed` count
  - `find packages/utils/dist -name "*.test.*" | wc -l` returns `0`
  - Cross-package types + lint GREEN
  - Phase 3 contract (26) + unit (64) suites still GREEN
  - FE-08 inert files unchanged (verified via `git diff --stat HEAD~4 HEAD`)
  - D-03b inert file unchanged (verified via `git diff --stat HEAD~4 HEAD`)
