# Phase 4: Frontend Service Client & MobX Preview Store - Research

**Researched:** 2026-05-04
**Domain:** TypeScript / `@plane/{types,services,utils}` packages + MobX (apps/web/ce) frontend infrastructure
**Confidence:** HIGH

## Summary

Phase 4 wraps the Phase 3 `POST /api/workspaces/<slug>/projects/<uuid>/timeline-propagation/` endpoint behind a typed in-process API: (1) wire-contract types in `@plane/types`, (2) `TimelinePropagationService extends APIService` in `@plane/services`, (3) three pure preview / diff / apply helpers + first Vitest harness in `@plane/utils`, (4) a `TimelinePropagationStore` in `apps/web/ce/store/timeline/` exposing `beginPreview / updatePreview / commitWithServerResult / rollback` plus `previewById / lastError / lastResponse / unexpectedError / hiddenUpdateCount`. CONTEXT.md D-01..D-10 are binding; the planner must not revisit them.

All 10 binding decisions in CONTEXT.md cleanly intersect with the existing code: every needed seam (APIService, snake_case `TIssue` fields, MobX `makeObservable + runInAction + computedFn`, sibling Vitest precedents in `apps/live` + `packages/codemods`, `IssueStore.updateIssue(issueId, Partial<TIssue>)` as the canonical write-back) is already in the repo. Phase 4 is plumbing, not invention.

**Primary recommendation:** Implement in two waves. **Wave 1** ships the four typed-contract artifacts that Phase 5 imports from (types → service scaffold → Vitest harness in `@plane/utils` with a smoke test → preview helpers + 4 PRD tests). **Wave 2** ships the MobX store and CE root-store wiring on top of the now-GREEN helpers. Don't write the store before the helpers are GREEN — D-05c's dual-observable error path is the only subtle line of code in the phase and benefits from helpers being settled.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Wire-contract type definitions | `@plane/types` (shared package) | — | Snake_case wire shape mirrors Phase 3 serializers; reused across web/admin/space if needed [CITED: CONTEXT.md D-02 / D-09]. |
| HTTP service client (axios) | `@plane/services` (shared package) | — | Sibling pattern to `SitesIssueService`; extends `APIService` base [VERIFIED: `packages/services/src/issue/sites-issue.service.ts:19-22`]. |
| Pure preview / diff / apply algorithms | `@plane/utils` (shared package) | — | Pure functions — no MobX, no axios, no React. Testable harness lives where the helpers live [CITED: CONTEXT.md D-01]. |
| Drag-time preview state (observable) | `apps/web/ce/store/timeline/` | — | CE because `TimeLineStore` already lives there; `IssuesTimeLineStore` is the read-only graph supplier [VERIFIED: `apps/web/ce/store/timeline/index.ts:7-9`]. |
| Issues-map mutation (canonical write-back) | `apps/web/core/store/issue/issue.store.ts::IssueStore.updateIssue` | `apps/web/core/store/issue/helpers/base-issues.store.ts::issueUpdate` | Existing path used by `updateIssueDates` success route — Phase 4 store calls into the SAME `RootStore.issue.issues.updateIssue(issueId, Partial<TIssue>)` that Phase 5 will adapt [VERIFIED: `apps/web/core/store/issue/issue.store.ts:108-116` + `apps/web/core/store/issue/helpers/base-issues.store.ts:565`]. |
| Drag handler + UI rendering | (Phase 5 — explicitly out of scope here) | — | Phase 4 ships infrastructure only. |

## User Constraints (from CONTEXT.md)

### Locked Decisions

D-01..D-10 are summarized below; full text in `.planning/phases/04-frontend-service-client-mobx-preview-store/04-CONTEXT.md`.

- **D-01:** Add Vitest to `@plane/utils`. Pure preview/diff/rollback helpers in `packages/utils/src/timeline-propagation/preview.ts`. Cover TEST-19/20/21/22. Do NOT add Vitest to `apps/web` itself. Coverage target: ~100% of the four PRD-pinned cases; no global gate raise.
- **D-01a:** `packages/utils/vitest.config.ts` minimal: `{ test: { environment: "node", globals: true, include: ["src/**/*.test.ts"] } }`. No coverage provider.
- **D-01b:** `packages/utils/package.json` gains `"test": "vitest run"` and `vitest` devDep matching the `packages/codemods` pin (`^4.0.8`). OxLint `max-warnings=38` budget unchanged; new code targets 0 warnings.
- **D-02:** Wire-contract types in `packages/types/src/issues/timeline-propagation.ts` as snake_case literal-union + interfaces, mirroring Phase 3 serializers. Field names exactly match wire (`work_item_id`, `original_start_date`, `original_target_date`, `expected_updated_at`, `requested_start_date`, `requested_target_date`, `operation`, `client_preview_count?`).
- **D-02a:** No `{ ok: true | false }` discriminated union. Service throws `TTimelinePropagationError` body on failure (matches `apps/web/core/services/issue/issue.service.ts:248-251` convention). Success resolves to `TTimelinePropagationResponse`.
- **D-02b:** Re-export from `packages/types/src/index.ts` via `export * from "./issues/timeline-propagation";`.
- **D-03:** New file `packages/services/src/issue/timeline-propagation.service.ts` with `class TimelinePropagationService extends APIService`. Single method `propagateMove(workspaceSlug, projectId, body)`. URL hardcoded at call site: `/api/workspaces/${workspaceSlug}/projects/${projectId}/timeline-propagation/` (NOT `/api/v1/`).
- **D-03a:** Update `packages/services/src/issue/index.ts` to add `export * from "./timeline-propagation.service";` (currently only re-exports `sites-issue.service`).
- **D-03b:** Do NOT migrate `apps/web/core/services/issue/issue.service.ts::updateIssueDates` into `packages/services`.
- **D-03c:** Service is instantiated INSIDE the new MobX store (`new TimelinePropagationService()`), not as an exported singleton.
- **D-04:** Three pure helpers in `packages/utils/src/timeline-propagation/preview.ts`: `computeLoadedPreview(...)`, `diffHiddenUpdate(...)`, `applyServerWorkItems(...)`. All inputs/outputs in snake_case wire shape. None of them know MobX, axios, or React.
- **D-04a:** `computeLoadedPreview` walks loaded adjacency only (advisory, non-binding). Edge cases: same-direction split, chain (one level deep through loaded subset), branch (multiple predecessors → most-restrictive boundary), incomplete loaded data (skip, server catches it). Never returns failure.
- **D-04b:** Calendar-day arithmetic. Reuse `@plane/utils/datetime.ts` primitives (`addDaysToDate`, `findTotalDaysInRange`, `getDate`, `renderFormattedPayloadDate` — already exported). No new `date-fns` direct import.
- **D-04c:** All three helpers immutable. No input mutation; new objects returned.
- **D-05:** `apps/web/ce/store/timeline/timeline-propagation.store.ts` exposes `ITimelinePropagationStore` with observables `previewById` / `isPreviewActive` / `lastError` / `lastResponse` / (D-05e) `lastPreviewIds` plus `unexpectedError` (D-05c); computed `hiddenUpdateCount`; actions `beginPreview` / `updatePreview` / `commitWithServerResult` / `rollback`.
- **D-05a:** State machine IDLE → PREVIEWING → IDLE. Stale calls (e.g., `updatePreview` before `beginPreview`) are no-ops.
- **D-05b:** `beginPreview` snapshots `edges` + `items_by_id` + `expected_updated_at` once. `updatePreview` re-runs `computeLoadedPreview` against that snapshot — does NOT re-read the timeline store mid-drag.
- **D-05c:** `commitWithServerResult` returns a union (NOT throws). Internally try/catches the service call. Non-protocol errors (network 500, no-`code` thrown value) go to `unexpectedError: Error | null`, kept SEPARATE from `lastError: TTimelinePropagationError | null`. The 7 wire codes stay clean — no synthetic 8th code.
- **D-05d:** Store does NOT mutate `IssuesTimeLineStore.blocksMap` directly. On commit success it calls into the existing issues-map write-back (`RootStore.issue.issues.updateIssue(workItem.id, { start_date, target_date, updated_at })`) once per `response.work_items` entry — same surface `updateIssueDates` already uses transitively.
- **D-05e:** `hiddenUpdateCount` computed against `lastPreviewIds: ReadonlySet<string> | null` snapshot taken BEFORE clearing `previewById` on success.
- **D-06:** Update `apps/web/ce/store/timeline/index.ts` — extend `ITimelineStore` interface and `TimeLineStore` class to instantiate `timelinePropagationStore: ITimelinePropagationStore`. NO change to `apps/web/ce/store/root.store.ts` (already wires `TimeLineStore`).
- **D-06a:** New store accepts `RootStore` for parity; reads only the issues hierarchy from it (D-05d).
- **D-07:** Phase 5 (drag handler) is the supplier of `edges` + `items_by_id` + `expected_updated_at`. Phase 4 store does NOT inspect MobX trees on its own.
- **D-07a:** Phase 5 reads `IssuesTimeLineStore.blocksMap` and IssueRelation store at the call site to build `LoadedGraphEdge[]` / `Record<string, LoadedWorkItem>`.
- **D-08:** One preview at a time. New `beginPreview` silently discards/replaces any active preview. No queue, no debounce.
- **D-08a:** `commitWithServerResult` is NOT re-entrant; second concurrent call returns the in-flight promise.
- **D-09:** Wire types and store observables both stay snake_case (`{ start_date, target_date, updated_at }`). No camelCase translation layer.
- **D-10:** No new OxLint warnings in any touched file. `@plane/utils=38` budget unchanged. `apps/web=11957` budget unchanged. New code targets 0 warnings.
- **D-10a:** No new catalog deps EXCEPT `vitest` for `@plane/utils` (matched to `packages/codemods`'s `^4.0.8` pin). No fresh major.
- **D-10b:** No `turbo.json` changes. `pnpm --filter=@plane/utils test` works via package-local script.

### Claude's Discretion

- Vitest version pinning — match `packages/codemods`'s `^4.0.8`. Plan-phase confirms.
- Snake-case vs camelCase — chose snake; default to snake.
- Expose `lastError` / `lastResponse` as observables — yes (Phase 5 reads them).
- `hiddenUpdateCount` snapshot timing — keep `lastPreviewIds` alongside `lastResponse` so count survives `previewById` clear.
- Synthetic store-only error code for non-protocol errors — keep them OUT of `lastError`; expose via separate `unexpectedError`.
- In-flight commit re-entrancy — share the in-flight promise.

### Deferred Ideas (OUT OF SCOPE)

- Migrating `apps/web/core/services/issue/issue.service.ts::updateIssueDates` into `packages/services`.
- Vitest in `apps/web` itself.
- `metadata: { cycle?, boundary_edge? }` on the wire error envelope.
- In-flight commit cancellation via `AbortController`.
- Front-end error code → i18n key mapping table (Phase 5 ERR-01..ERR-07).
- Telemetry / analytics on propagation outcomes.
- `turbo.json` test pipeline integration for `@plane/utils`.
- Snake → camel translation layer.
- `IssueBulkUpdateDateEndpoint` cleanup.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FE-01 | Drag-time preview for loaded Work Items (simple / chain / branch) (US-23) | `computeLoadedPreview` helper covered by TEST-19 (D-04 / D-04a). MobX store action `beginPreview`/`updatePreview` consume the helper. |
| FE-02 | Preview is visual affordance only, NOT a saved value | D-04a: `computeLoadedPreview` is non-binding, advisory. Server is authoritative. Store's `previewById` is observable but never written back to the issues map. |
| FE-04 | Success → server's `work_items` REPLACE preview (not local guess) (US-24) | D-05d + `applyServerWorkItems` helper. Store calls `RootStore.issue.issues.updateIssue(id, Partial<TIssue>)` per server entry. Pinned by TEST-21. |
| FE-05 | Failure → preview discarded entirely; original schedule restored; reason exposed (US-22 / US-26) | D-05a state machine PREVIEWING → IDLE on failure; `lastError` exposed. Pinned by TEST-20. Note: rollback in Phase 4 means "discard `previewById`" (preview state never wrote to issues map, so no rollback of the canonical map is needed). |
| FE-06 | When server updates Work Items not in preview → "N additional updated" notification value (US-25) | `diffHiddenUpdate` helper + `hiddenUpdateCount` computed (D-05e). Pinned by TEST-22. Phase 5 renders the notification; Phase 4 exposes the value. |
| FE-07 | Safe limit (≤100) → no confirmation dialog (US-30) | Store has no confirmation flag. The endpoint enforces limit server-side (Phase 3 PROP-13). Phase 4 simply doesn't add a confirmation seam. |
| FE-08 | Existing relation-creation cycle-check (UI immediate feedback) is NOT touched (US-28) | Phase 4 explicitly does NOT touch `apps/web/ce/components/gantt-chart/dependency/{use-dependency-drag.ts, cycle-check.ts, date-check.ts, dependency-paths.tsx}`. Documented as an inert constraint to verify in `/gsd-verify-work`. |
| TEST-19 | Frontend store test: loaded-graph preview (simple / chain / branch) | Three parameterized cases of `computeLoadedPreview` in `preview.test.ts`. |
| TEST-20 | Frontend store test: failure → preview rollback | Test that `applyServerWorkItems` is NOT called on failure; the store's rollback is a single-line MobX action (`runInAction(() => { this.previewById.clear() })`). Plan-phase decides: thin store unit (would need Vitest in `apps/web`, REJECTED by D-01) OR transitive coverage via Phase 6 E2E. **Recommendation: cover the helper-level invariant in `preview.test.ts` (rollback = no-op; helpers' immutability D-04c is the contract) + leave full store-flow coverage to Phase 6 E2E (TEST-24).** |
| TEST-21 | Frontend store test: server updates REPLACE preview | `applyServerWorkItems` test in `preview.test.ts` — pure projection, current snapshot + server `work_items[]` → next snapshot. |
| TEST-22 | Frontend store test: hidden-update notification (server count > preview count) | `diffHiddenUpdate` test in `preview.test.ts` — server response with 1 preview-id + 1 non-preview-id → returns 1. |

## Project Constraints (from CLAUDE.md)

Directives that any Phase 4 plan must honor (sourced from `./CLAUDE.md`):

- **pnpm catalog convention** — external deps pinned via the catalog (`catalog:` in `package.json`, versions in `pnpm-workspace.yaml`). New shared deps go in the catalog. **Caveat:** `vitest` is currently NOT in the catalog; `packages/codemods` pins it locally as `"vitest": "^4.0.8"` [VERIFIED: `packages/codemods/package.json:15`]. Phase 4 follows the same local-pin pattern (D-01b / D-10a) — adding `vitest` to the catalog is a milestone-level concern that the planner can either accept (local pin per CONTEXT.md) or surface as a discrete cleanup task.
- **`workspace:*` for internal packages** — `@plane/types`, `@plane/services`, `@plane/utils`, `@plane/constants` are all consumed via `workspace:*` [VERIFIED: `packages/utils/package.json:26-28`].
- **OxLint + oxfmt (NOT ESLint/Prettier)** — config root is `.oxlintrc.json`. No `eslint-disable` comments in new code unless absolutely needed (CONTEXT.md D-10).
- **Pre-commit pipeline** — Husky + lint-staged runs `oxfmt` then `oxlint --fix --deny-warnings` on staged files. Plan tasks must run clean.
- **`apps/web` warnings budget** — `--max-warnings=11957` (per CLAUDE.md). Ratcheting; do not raise. Phase 4 store goes in `apps/web/ce/`; new code targets 0 warnings.
- **`@plane/utils` warnings budget** — `--max-warnings=38` [VERIFIED: `packages/utils/package.json:18`]. Same ratcheting rule.
- **`apps/api` is excluded from the pnpm workspace** — Phase 4 has zero touch points there [VERIFIED: `pnpm-workspace.yaml:4`].
- **CE/core split** — `@/*` → `apps/web/core/*`, `@/plane-web/*` → `apps/web/ce/*`. Phase 4's new store lives at `apps/web/ce/store/timeline/timeline-propagation.store.ts` and consumes types from `@plane/types`, helpers from `@plane/utils`, services from `@plane/services` (new), and the existing `RootStore` from `@/plane-web/store/root.store`.
- **Internal Plane convention** (not in CLAUDE.md but verified in code): every service file in `packages/services/src/` opens with the AGPL-3.0 copyright header [VERIFIED: `packages/services/src/issue/sites-issue.service.ts:1-5`]. Same for `packages/types/src/issues/issue.ts:1-5`, `packages/utils/src/datetime.ts:1-5`. New files Phase 4 creates must include this header.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@plane/types` (workspace) | `workspace:*` | Wire-contract TS types, shared across web/admin/space | Already the home of every wire type (TIssue, TIssueRelation, etc.) [VERIFIED: `packages/types/src/issues/issue.ts:45-80`] |
| `@plane/services` (workspace) | `workspace:*` | Service clients extending `APIService` (axios wrapper) | One file per domain (`intake`, `module`, `cycle`, `issue`); `APIService` provides `.get/.post/.put/.patch/.delete` [VERIFIED: `packages/services/src/api.service.ts:14-95`] |
| `@plane/utils` (workspace) | `workspace:*` | Pure helpers — array, string, datetime, etc. | Already has `date-fns` as a dep; existing `addDaysToDate`, `findTotalDaysInRange`, `getDate`, `renderFormattedPayloadDate` are reusable [VERIFIED: `packages/utils/src/datetime.ts:7, 64-74, 111-127, 135-146, 283-299`] |
| `@plane/constants` (workspace) | `workspace:*` | `API_BASE_URL` for service constructors | Resolved from `process.env.VITE_API_BASE_URL` (empty default = same-origin) [VERIFIED: `packages/constants/src/endpoints.ts:7`] |
| `mobx` | `6.12.0` (catalog) | Observable state | All existing stores use `makeObservable + observable + action + runInAction` [VERIFIED: `pnpm-workspace.yaml:28`, `apps/web/ce/store/timeline/base-timeline.store.ts:8`] |
| `mobx-utils` | `6.0.8` (catalog) | `computedFn` for parameterized computeds | Used by every existing store for memoized lookup-by-id [VERIFIED: `pnpm-workspace.yaml:27`, `apps/web/ce/store/timeline/base-timeline.store.ts:9`] |
| `axios` | `1.15.0` (catalog) | HTTP client (transitive via `APIService`) | Phase 4's new service touches axios only via `APIService.post(...)` — no direct import [VERIFIED: `pnpm-workspace.yaml:22`, `packages/services/src/api.service.ts:7`] |
| `vitest` | `^4.0.8` (local devDep, mirroring `packages/codemods`) | Test harness for `@plane/utils` | Per CONTEXT.md D-01b. No catalog entry needed (D-10a defers); match `packages/codemods/package.json:15` exactly [VERIFIED: `packages/codemods/package.json:15`]. |

**Version verification:** All catalog versions read directly from `pnpm-workspace.yaml`; verified 2026-05-04. The Vitest 4 line was published Sep-Oct 2025 (per `vitest@^4.0.8` published date — verifiable via `npm view vitest@4.0.8 time`); since `packages/codemods` is currently building GREEN against it [VERIFIED: `packages/codemods/package.json:6 "test": "vitest run"`], peer-dep compatibility with TypeScript 5.8.3 (catalog) and tsdown 0.16.0 (catalog) is established by precedent.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | `^4.1.0` (local @plane/utils dep) | Calendar-day arithmetic | Reuse via `@plane/utils` re-exports — `addDaysToDate`, `findTotalDaysInRange`, `getDate` [VERIFIED: `packages/utils/package.json:30`, `packages/utils/src/datetime.ts:7`] |
| `lodash-es` | `4.18.0` (catalog) | `set`, `clone`, `isEqual` | Existing stores use `set(map, [path], value)` pattern in `runInAction` [VERIFIED: `apps/web/ce/store/timeline/base-timeline.store.ts:7`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Snake_case wire types in `@plane/types` | Camel-case + translation layer | Rejected by D-09 — `TIssue` already snake_case, no translation cost in the codebase. |
| Throw `TTimelinePropagationError` from service | Discriminated `{ ok: true \| false }` union | Rejected by D-02a — every existing service in `apps/web/core/services/issue/issue.service.ts:248-251` throws `error.response.data` on failure. Consistency wins. |
| Vitest 4 in `@plane/utils` | Vitest 1/2/3 fresh major | Rejected by D-10a — match `packages/codemods`'s `^4.0.8` pin. |
| Service singleton in `packages/services/src/index.ts` | Per-store instantiation | Rejected by D-03c — `apps/web/core/store/issue/issue.store.ts:52` (`this.issueService = new IssueService()`) sets the per-store-owns-its-services pattern. |
| Mutate `IssuesTimeLineStore.blocksMap` on commit | Call `RootStore.issue.issues.updateIssue(...)` | Rejected by D-05d — Phase 5 will keep the gantt blocks reactive via the existing `IssueStore → BaseTimeLineStore.updateBlocks` flow; bypassing it forks the issues map. |
| Single observable for both protocol + non-protocol errors | Two observables (`lastError` + `unexpectedError`) | Rejected by D-05c — synthesizing an 8th `code` would lie to callers. |

**Installation:**

```bash
# from repo root
pnpm --filter=@plane/utils add -D vitest@^4.0.8
# (no other deps; everything else is workspace:* already wired)
```

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│  Phase 5 (out of scope here): drag handler                           │
│   reads IssuesTimeLineStore.blocksMap + relation store →             │
│   builds {edges, items_by_id, expected_updated_at} →                 │
│   calls beginPreview/updatePreview/commitWithServerResult/rollback   │
└────────────────────┬─────────────────────────────────────────────────┘
                     │ (Phase 5 supplier; Phase 4 typed input contract)
                     ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │ apps/web/ce/store/timeline/timeline-propagation.store.ts        │
   │   ────────────────────────────────────────────                  │
   │   observables: previewById, isPreviewActive,                    │
   │     lastError, lastResponse, lastPreviewIds, unexpectedError    │
   │   computed:    hiddenUpdateCount                                │
   │   actions:     beginPreview / updatePreview                     │
   │                  └─ calls computeLoadedPreview(snapshot)        │
   │                commitWithServerResult                           │
   │                  ├─ calls TimelinePropagationService.propagate  │
   │                  ├─ on success:                                 │
   │                  │    └─ for each work_items[] entry,           │
   │                  │       call RootStore.issue.issues            │
   │                  │              .updateIssue(id, Partial<TIssue>)│
   │                  ├─ on protocol failure: lastError = body       │
   │                  └─ on non-protocol failure: unexpectedError =  │
   │                                              caught Error       │
   │                rollback                                         │
   └────┬─────────────────────────────────┬──────────────────────────┘
        │ pure helper calls               │ HTTP                     │ canonical write
        ▼                                 ▼                          ▼
 ┌──────────────────────┐    ┌────────────────────────────┐  ┌────────────────────────┐
 │ @plane/utils/         │   │ @plane/services/issue/     │  │ apps/web/core/store/   │
 │ timeline-propagation/ │   │ timeline-propagation       │  │ issue/issue.store.ts   │
 │   computeLoadedPreview│   │ .service.ts                │  │   IssueStore.updateIssue│
 │   diffHiddenUpdate    │   │  TimelinePropagationService│  │   (already exists)     │
 │   applyServerWorkItems│   │   extends APIService       │  │                        │
 │                       │   │   .propagateMove(slug,     │  │                        │
 │ (pure, immutable;     │   │     projectId, body)       │  │ (write surface          │
 │  Vitest harness covers│   │   POST /api/workspaces/.../│  │  used by existing       │
 │  TEST-19/21/22)       │   │     timeline-propagation/  │  │  updateIssueDates       │
 └──────────────────────┘    └────────┬───────────────────┘  └────────────────────────┘
                                       │ throws TTimelinePropagationError
                                       │  (or non-protocol Error) on failure
                                       ▼
                              Phase 3 endpoint (DRF, already shipped)
```

**Component responsibilities:**

| Component | File | Responsibility |
|-----------|------|----------------|
| Wire types | `packages/types/src/issues/timeline-propagation.ts` (NEW) | TS literal-union + interfaces; snake_case |
| Types barrel | `packages/types/src/index.ts` (UPDATE: add 1 line) | Re-export new module |
| Service client | `packages/services/src/issue/timeline-propagation.service.ts` (NEW) | `class TimelinePropagationService extends APIService { propagateMove(...) }` |
| Service barrel | `packages/services/src/issue/index.ts` (UPDATE: add 1 line) | Add `export * from "./timeline-propagation.service";` |
| Pure helpers | `packages/utils/src/timeline-propagation/preview.ts` (NEW) | `computeLoadedPreview` / `diffHiddenUpdate` / `applyServerWorkItems` |
| Helpers barrel | `packages/utils/src/timeline-propagation/index.ts` (NEW) | `export * from "./preview";` |
| Utils barrel | `packages/utils/src/index.ts` (UPDATE: add 1 line) | `export * from "./timeline-propagation";` |
| Vitest config | `packages/utils/vitest.config.ts` (NEW) | Minimal node-env config (D-01a) |
| Vitest dep + script | `packages/utils/package.json` (UPDATE: 2 fields) | Add `"test": "vitest run"`; add `vitest` devDep |
| Helper tests | `packages/utils/src/timeline-propagation/__tests__/preview.test.ts` (NEW) | TEST-19/20/21/22 |
| MobX store | `apps/web/ce/store/timeline/timeline-propagation.store.ts` (NEW) | `ITimelinePropagationStore` interface + `TimelinePropagationStore` class |
| Timeline barrel | `apps/web/ce/store/timeline/index.ts` (UPDATE) | Extend `ITimelineStore` interface + `TimeLineStore` class |

### Recommended Project Structure

```
packages/
├── types/src/issues/
│   └── timeline-propagation.ts          # NEW
├── services/src/issue/
│   └── timeline-propagation.service.ts  # NEW
└── utils/
    ├── package.json                      # UPDATE (test script + vitest devDep)
    ├── vitest.config.ts                  # NEW
    └── src/timeline-propagation/         # NEW subdir
        ├── index.ts                      # NEW barrel
        ├── preview.ts                    # NEW pure helpers
        └── __tests__/
            └── preview.test.ts           # NEW Vitest

apps/web/ce/store/timeline/
├── index.ts                              # UPDATE (extend interface + class)
└── timeline-propagation.store.ts         # NEW MobX store
```

### Pattern 1: APIService extension (D-03)

**What:** Single class extending `APIService` from `@plane/services/api.service`.
**When to use:** Whenever a new domain endpoint needs a typed client.
**Example:**
```ts
// Source: packages/services/src/issue/sites-issue.service.ts:19-22 + apps/web/core/services/issue/issue.service.ts:242-252
import { API_BASE_URL } from "@plane/constants";
import type { TTimelinePropagationRequest, TTimelinePropagationResponse } from "@plane/types";
import { APIService } from "../api.service";

export class TimelinePropagationService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async propagateMove(
    workspaceSlug: string,
    projectId: string,
    body: TTimelinePropagationRequest,
  ): Promise<TTimelinePropagationResponse> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/timeline-propagation/`,
      body,
    )
      .then((response) => response?.data)
      .catch((error) => {
        // Phase 3 returns { code, message } on 4xx; pass it through to the store layer.
        throw error?.response?.data;
      });
  }
}
```

Note the `.response?.data` selector (matches `apps/web/core/services/issue/issue.service.ts:250`), NOT just `.response` (which `sites-issue.service.ts:37` uses). The `.data` form is the one consumers in this repo expect for `{code, message}` envelope handling.

### Pattern 2: MobX store with snake_case observables (D-05 / D-09)

**What:** MobX store using `makeObservable + observable + action + runInAction + computedFn`.
**When to use:** Frontend state that needs reactive subscribers.
**Example:**
```ts
// Source: apps/web/ce/store/timeline/base-timeline.store.ts:119-167 (pattern reference)
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type { RootStore } from "@/plane-web/store/root.store";

export class TimelinePropagationStore implements ITimelinePropagationStore {
  previewById: Map<string, { start_date: string; target_date: string }> = new Map();
  isPreviewActive = false;
  lastError: TTimelinePropagationError | null = null;
  lastResponse: TTimelinePropagationResponse | null = null;
  lastPreviewIds: ReadonlySet<string> | null = null;
  unexpectedError: Error | null = null;

  private rootStore: RootStore;
  private service: TimelinePropagationService;
  // snapshot captured at beginPreview (D-05b)
  private snapshot: { edges: LoadedGraphEdge[]; items_by_id: Record<string, LoadedWorkItem>; expected_updated_at: string; dragged: { id: string; original_start_date: string; original_target_date: string } } | null = null;
  // shared in-flight commit promise (D-08a)
  private inflightCommit: Promise<TTimelinePropagationResponse | TTimelinePropagationError> | null = null;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      previewById: observable,
      isPreviewActive: observable.ref,
      lastError: observable.ref,
      lastResponse: observable.ref,
      lastPreviewIds: observable.ref,
      unexpectedError: observable.ref,
      hiddenUpdateCount: computed,
      beginPreview: action.bound,
      updatePreview: action.bound,
      commitWithServerResult: action.bound,
      rollback: action.bound,
    });
    this.rootStore = rootStore;
    this.service = new TimelinePropagationService();
  }

  get hiddenUpdateCount(): number {
    if (!this.lastResponse || !this.lastPreviewIds) return 0;
    return diffHiddenUpdate(this.lastResponse.work_items, this.lastPreviewIds);
  }

  // beginPreview, updatePreview, commitWithServerResult, rollback...
}
```

Note `previewById` uses `observable` (deep) so MobX 6 tracks Map mutations correctly — see Pitfall 4 below for the trap.

### Pattern 3: Pure helpers module (D-04)

**What:** Plain TS functions, no MobX/axios/React imports, immutable inputs.
**When to use:** Whenever an algorithm has a clean input/output contract that can be tested in isolation.
**Example:**
```ts
// Source: pattern derived from existing @plane/utils helpers like findTotalDaysInRange
//   (packages/utils/src/datetime.ts:111-127) — same structure: typed input, typed output,
//   no side effects, reuses other @plane/utils helpers.
import { addDaysToDate, findTotalDaysInRange, getDate, renderFormattedPayloadDate } from "../datetime";
import type { TTimelinePropagationWorkItem } from "@plane/types";

export type LoadedGraphEdge = { predecessor_id: string; successor_id: string };
export type LoadedWorkItem = { id: string; start_date: string; target_date: string };
export type PreviewResult = Map<string, { start_date: string; target_date: string }>;

export function diffHiddenUpdate(
  server_work_items: readonly TTimelinePropagationWorkItem[],
  preview_ids: ReadonlySet<string>,
): number {
  let hidden = 0;
  for (const wi of server_work_items) {
    if (!preview_ids.has(wi.id)) hidden += 1;
  }
  return hidden;
}
```

### Pattern 4: Vitest harness in `@plane/utils` (D-01a/b)

**What:** Minimal Vitest config and one `__tests__/*.test.ts` file per source module.
**When to use:** Pure-helper modules where deterministic unit tests are valuable.
**Example:**
```ts
// Source: apps/live/vitest.config.ts:1-7 (mirrored exactly per D-01a)
// packages/utils/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
  },
});
```

### Anti-Patterns to Avoid

- **Don't import axios directly in the new service.** Use `APIService.post(...)` only — preserves the auth/withCredentials wrapper [VERIFIED: `packages/services/src/api.service.ts:24-28`].
- **Don't create a `singleton` export of `TimelinePropagationService`.** Per-store instantiation matches `IssueStore`'s `this.issueService = new IssueService()` [VERIFIED: `apps/web/core/store/issue/issue.store.ts:52`].
- **Don't camelCase wire fields in TS interfaces.** D-09; would require a translation layer that contradicts every other `@plane/types` definition.
- **Don't include `tests` in tsdown's emitted `dist/`.** See Pitfall 5.
- **Don't mutate `IssuesTimeLineStore.blocksMap` from the new store.** D-05d; call `RootStore.issue.issues.updateIssue(id, partialIssue)` instead.
- **Don't synthesize a fake `code` for non-protocol errors.** D-05c; `unexpectedError` is the channel for those.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP client w/ cookie auth | Custom fetch wrapper | `APIService` from `@plane/services` | Already configures `withCredentials: true` and shared base URL [VERIFIED: `packages/services/src/api.service.ts:24-28`] |
| Calendar-day arithmetic | Inline `new Date()` math | `addDaysToDate`, `findTotalDaysInRange`, `getDate` from `@plane/utils/datetime` | Existing helpers handle TZ pitfalls and string-vs-Date inputs [VERIFIED: `packages/utils/src/datetime.ts:135-146, 111-127, 283-299`] |
| Date string formatting (`YYYY-MM-DD`) | Manual `.toISOString().slice(0,10)` | `renderFormattedPayloadDate` from `@plane/utils/datetime` | Handles undefined/null/invalid inputs and is the existing payload-date contract [VERIFIED: `packages/utils/src/datetime.ts:64-74`] |
| Vitest harness | Custom test runner | Vitest 4 (matched to `packages/codemods`) | One harness in the monorepo means one mental model [VERIFIED: `packages/codemods/package.json:6,15`] |
| Issues-map mutation | `set(timelineStore.blocksMap, ...)` | `RootStore.issue.issues.updateIssue(id, Partial<TIssue>)` | Existing canonical write that updates `issuesMap` and bumps `updated_at` [VERIFIED: `apps/web/core/store/issue/issue.store.ts:108-116`] |
| Discriminated union envelope on TS side | `{ ok: true, ... } \| { ok: false, ... }` | Throw `TTimelinePropagationError` from service `.catch` | Matches `apps/web/core/services/issue/issue.service.ts:248-251` and CONTEXT.md D-02a |
| Separate axios mock layer | jest.mock / msw | None — service is exercised by Phase 6 E2E only | Phase 4 has no `axios` mocking convention; CONCERNS.md "do not invent test harnesses without asking" honored |

**Key insight:** Every primitive Phase 4 needs already exists. The phase is type-pinning + 4 small new files (1 service, 1 type module, 1 helper module + tests, 1 store) + 4 one-line barrel updates + 1 timeline-store interface extension. Resist the urge to introduce abstractions.

## Common Pitfalls

### Pitfall 1: tsdown emits `__tests__/*.test.ts` into `dist/`

**What goes wrong:** Adding `src/timeline-propagation/__tests__/preview.test.ts` will be picked up by tsdown's default entry walk and emitted into `dist/`, breaking consumers (importing test code into the production bundle).
**Why it happens:** `packages/utils/tsdown.config.ts` declares `entry: ["src/index.ts"]` — but tsdown still emits any module reachable via re-export from that entry. The `index.ts → timeline-propagation/index.ts` chain does NOT re-export `__tests__/*`, so reachability is limited to `preview.ts`.
**How to avoid:** Per `packages/utils/tsdown.config.ts:1-9` — only `src/index.ts` is the declared entry, and our barrel chain only re-exports `preview.ts`. Tests sitting under `__tests__/` are NOT in the import graph from `src/index.ts`. **Verify in plan-phase by running `pnpm --filter=@plane/utils build` and grepping `dist/` for `*.test.*` after adding the file** — confirm none emitted.
**Warning signs:** Builds slower than expected, or `dist/timeline-propagation/__tests__/` exists post-build.

### Pitfall 2: Snake_case TS interface members tripping OxLint

**What goes wrong:** New `TTimelinePropagationRequest = { work_item_id: string; ... }` interface might tick a `camelcase` warning depending on OxLint rules.
**Why it happens:** OxLint's default `correctness/suspicious/perf` categories don't include a hard `camelcase` rule, but project-specific configs can add it.
**How to avoid:** [VERIFIED: `.oxlintrc.json:36-52`] — the project's OxLint config does NOT enable a `camelcase` rule. Existing `TBaseIssue.start_date / target_date / updated_at / created_by / sub_issues_count` declarations [VERIFIED: `packages/types/src/issues/issue.ts:47-78`] confirm snake_case interface fields ship without `oxlint-disable` comments today. **No suppression needed.** Plan-phase still runs `pnpm --filter=@plane/types check:lint` after adding the file to confirm.
**Warning signs:** Lint warnings on the new file when running `pnpm check:lint`.

### Pitfall 3: MobX 6 `Map` reactivity quirks

**What goes wrong:** Declaring `previewById: Map<string, ...>` as `observable.ref` instead of `observable` (deep) means mutations like `this.previewById.set(...)` won't trigger reactions.
**Why it happens:** MobX 6 treats Map as an observable container only when `observable` (deep) is used; `observable.ref` snapshots the reference and only fires on whole-Map replacement.
**How to avoid:** In `makeObservable({ previewById: observable, ... })` use bare `observable` (NOT `.ref`). For `lastError` / `lastResponse` / `lastPreviewIds` / `unexpectedError` `.ref` is correct (whole-object replacement). [VERIFIED: same pattern in `apps/web/ce/store/timeline/base-timeline.store.ts:144-145` — `blocksMap: observable` (deep) vs `currentView: observable.ref`].
**Warning signs:** UI doesn't re-render when `previewById.set(id, {...})` runs inside `runInAction`.

### Pitfall 4: Late-binding closures in promise callbacks

**What goes wrong:** `commitWithServerResult` calls `.then((response) => { this.lastResponse = response; ... })`. If the action body uses `forEach((item) => this.x = ...)` inside, late-binding can capture the wrong reference (Phase 3 RESEARCH Pitfall 4 surfaced the Python equivalent).
**Why it happens:** TS arrow functions capture `this` lexically, but `for..of` + `runInAction` + multiple async hops can still surprise.
**How to avoid:** Wrap **every** mutation block in `runInAction(() => { ... })` AFTER `await`. Promise callbacks must re-enter MobX action context — without `runInAction`, the writes happen outside an action and either log warnings (`enforceActions`) or silently fail to batch.
**Warning signs:** MobX warning "Since strict-mode is enabled, changing observed observable values outside actions is not allowed", or partial state updates.

### Pitfall 5: `dist/` not refreshing after adding new exports

**What goes wrong:** Adding `export * from "./timeline-propagation"` to `packages/utils/src/index.ts` but consumers (`apps/web`) still see "module not found" because they read from `dist/index.d.ts`.
**Why it happens:** `packages/utils/package.json:9-13` declares `"main": "./dist/index.js"` and `"types": "./dist/index.d.ts"` — consumers import the built artifact, not source.
**How to avoid:** Either run `pnpm --filter=@plane/utils build` after barrel changes OR use `pnpm dev` (which runs `tsdown --watch` for utils). The plan-phase task graph should sequence: write source → build utils → consumer-side imports work.
**Warning signs:** TypeScript "Cannot find module '@plane/utils'" or missing-export errors on the new helpers, despite source being correct.

### Pitfall 6: Pre-clearing `previewById` before computing `hiddenUpdateCount`

**What goes wrong:** On commit success, the natural order is "set lastResponse → clear previewById → compute hiddenUpdateCount". But by the time `hiddenUpdateCount` runs, `previewById` is empty, returning 0.
**Why it happens:** Naive implementation reuses `previewById.keys()` as the preview-id set in the computed.
**How to avoid:** D-05e is explicit — `lastPreviewIds: ReadonlySet<string> | null` is captured BEFORE clearing `previewById`:
```ts
runInAction(() => {
  this.lastPreviewIds = new Set(this.previewById.keys()); // CAPTURE FIRST
  this.lastResponse = response;
  this.previewById.clear();
  this.isPreviewActive = false;
  // applyServerWorkItems write-back via this.rootStore.issue.issues.updateIssue(...)
});
```
**Warning signs:** TEST-22 passes the helper test (because `diffHiddenUpdate` is pure) but a Phase 5 integration shows hidden-update count = 0.

### Pitfall 7: Re-entrant `commitWithServerResult` (D-08a)

**What goes wrong:** Two rapid Esc-then-mouseup sequences fire `commitWithServerResult` twice; the second call kicks off a second axios POST and the success ordering becomes nondeterministic (which response wins the issues-map write?).
**Why it happens:** Drag UX races; the first call hasn't resolved before the second begins.
**How to avoid:** D-08a — cache the in-flight promise. Pseudo:
```ts
async commitWithServerResult(args) {
  if (this.inflightCommit) return this.inflightCommit;
  this.inflightCommit = this._doCommit(args);
  try { return await this.inflightCommit; }
  finally { this.inflightCommit = null; }
}
```
**Warning signs:** Phase 6 E2E flakes on rapid drag-cancel-drag sequences; double POST in network tab.

### Pitfall 8: Calling `IssueStore.updateIssue` outside an action

**What goes wrong:** `RootStore.issue.issues.updateIssue(id, ...)` already wraps in `runInAction` internally [VERIFIED: `apps/web/core/store/issue/issue.store.ts:110`], so calling it from a promise `.then` should be fine. BUT looping over `response.work_items[]` calling it once per id triggers N reactions instead of 1.
**Why it happens:** Each `updateIssue` opens its own `runInAction` block.
**How to avoid:** Wrap the loop in an outer `runInAction` so MobX batches all N writes into a single transaction:
```ts
runInAction(() => {
  for (const wi of response.work_items) {
    this.rootStore.issue.issues.updateIssue(wi.id, {
      start_date: wi.start_date,
      target_date: wi.target_date,
      updated_at: wi.updated_at,
    });
  }
});
```
**Warning signs:** Gantt re-renders N times instead of once on large propagation; perf concern at the 100-item limit.

### Pitfall 9: `apps/web/core/services/issue/issue.service.ts::updateIssueDates` is the canonical existing bulk-date writer

**What goes wrong:** Plan tries to "modernize" `updateIssueDates` by routing it through the new propagation service.
**Why it happens:** Both methods touch dates; superficial similarity.
**How to avoid:** D-03b is explicit: `updateIssueDates` stays untouched. It's the legacy bulk endpoint; new code uses `TimelinePropagationService.propagateMove`. Verify in `/gsd-verify-work` that `updateIssueDates` and its callers (`base-issues.store.ts:755-798`, `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx`) are unchanged.
**Warning signs:** Diff in `apps/web/core/services/issue/issue.service.ts:242-252` or `apps/web/core/store/issue/helpers/base-issues.store.ts:755-798` after Phase 4 plans land.

### Pitfall 10: Vitest 4 + tsdown peer-dep silent breakage

**What goes wrong:** Adding `vitest@^4.0.8` to `packages/utils` works in isolation but breaks `pnpm install` due to peer-dep conflicts with `tsdown` (catalog 0.16.0) or TypeScript (catalog 5.8.3).
**Why it happens:** Vitest 4 has its own `vite` peer; the catalog already pins `vite: 7.3.2`. If Vitest 4 wants Vite 5 or 6, install fails.
**How to avoid:** [VERIFIED: `packages/codemods/package.json:15`] — `packages/codemods` already runs `vitest@^4.0.8` GREEN in this same workspace with the same catalog. Risk = LOW. Plan-phase runs `pnpm install --frozen-lockfile=false` after edit and expects clean output. Fallback: pin to whatever exact version `pnpm-lock.yaml` resolves `^4.0.8` to in `packages/codemods/node_modules/vitest/package.json` (deterministic).
**Warning signs:** `pnpm install` errors mentioning peer deps for `vite`, `@vitest/*`, or `vitest`.

## Code Examples

Verified patterns from official sources:

### Wire types module (D-02 / D-09)

```ts
// Source: D-02 verbatim (CONTEXT.md), with snake_case verified against TBaseIssue
// (packages/types/src/issues/issue.ts:45-80) which already ships these field names.
// File: packages/types/src/issues/timeline-propagation.ts (NEW)
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TTimelinePropagationErrorCode =
  | "DEPENDENCY_CYCLE"
  | "PROJECT_BOUNDARY_EXCEEDED"
  | "INCOMPLETE_SCHEDULE"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "SCHEDULE_CHANGED"
  | "PERMISSION_DENIED"
  | "INVALID_DATE_RANGE";

/**
 * PROP-18 — propagation is move-only on the wire. Resize is rejected at the
 * Phase 3 serializer with DRF 400 (NOT this envelope).
 */
export type TTimelinePropagationOperation = "move";

export type TTimelinePropagationRequest = {
  work_item_id: string;
  original_start_date: string;
  original_target_date: string;
  /** ISO 8601 with microseconds (Phase 3 D-04). */
  expected_updated_at: string;
  requested_start_date: string;
  requested_target_date: string;
  operation: TTimelinePropagationOperation;
  client_preview_count?: number;
};

export type TTimelinePropagationWorkItem = {
  id: string;
  start_date: string;
  target_date: string;
  updated_at: string;
};

export type TTimelinePropagationResponse = {
  requested_work_item_id: string;
  total_updated_count: number;
  client_preview_count: number | null;
  work_items: TTimelinePropagationWorkItem[];
};

export type TTimelinePropagationError = {
  code: TTimelinePropagationErrorCode;
  message: string;
};
```

### `applyServerWorkItems` helper (TEST-21 contract)

```ts
// Source: D-04 sketch + immutability invariant D-04c.
// File: packages/utils/src/timeline-propagation/preview.ts (NEW; partial)
import type { TTimelinePropagationWorkItem } from "@plane/types";

export function applyServerWorkItems<
  T extends { id: string; start_date?: string | null; target_date?: string | null; updated_at?: string }
>(
  current: Readonly<Record<string, T>>,
  server_work_items: readonly TTimelinePropagationWorkItem[],
): Record<string, T> {
  const next = { ...current };
  for (const wi of server_work_items) {
    const existing = next[wi.id];
    if (!existing) continue; // server returned a work item we don't know about — server is authoritative,
                              // but the issues map only updates rows it already has. (Hidden updates surface
                              // via diffHiddenUpdate — see TEST-22.)
    next[wi.id] = {
      ...existing,
      start_date: wi.start_date,
      target_date: wi.target_date,
      updated_at: wi.updated_at,
    };
  }
  return next;
}
```

Note: this returns a new object (D-04c). The store wraps the call in `runInAction` and writes per-id via `IssueStore.updateIssue` rather than replacing the whole `issuesMap` reference (Pitfall 8).

### Vitest harness file (D-01a)

```ts
// Source: apps/live/vitest.config.ts:1-7 (mirrored exactly)
// File: packages/utils/vitest.config.ts (NEW)
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
  },
});
```

```jsonc
// Source: D-01b
// File: packages/utils/package.json (UPDATE — partial diff)
"scripts": {
  // ... existing ...
  "test": "vitest run"
},
"devDependencies": {
  // ... existing ...
  "vitest": "^4.0.8"
}
```

## Reusable Code Map

Exact file:line citations for the assets the plan can lean on:

| Asset | File:Line | Use |
|-------|-----------|-----|
| `APIService` base class | `packages/services/src/api.service.ts:14-95` | New service extends this; `.post(url, body)` returns axios `Response` |
| `API_BASE_URL` constant | `packages/constants/src/endpoints.ts:7` | Service constructor default; resolves from `VITE_API_BASE_URL` |
| Sibling service file pattern (`SitesIssueService`) | `packages/services/src/issue/sites-issue.service.ts:19-22, 31-39` | File header + constructor + `.then((r) => r?.data).catch((e) => { throw e?.response })` |
| Wire-error throw pattern (with `.data`) | `apps/web/core/services/issue/issue.service.ts:242-252` | `.catch((e) => { throw e?.response?.data })` — what Phase 4 mirrors |
| Snake_case TS field precedent | `packages/types/src/issues/issue.ts:47-78` | Confirms `start_date / target_date / updated_at / created_by` ship without `oxlint-disable` |
| `@plane/utils` date helpers (calendar-day) | `packages/utils/src/datetime.ts:64-74, 111-127, 135-146, 283-299` | `renderFormattedPayloadDate`, `findTotalDaysInRange`, `addDaysToDate`, `getDate` |
| MobX store conventions (`makeObservable`, `runInAction`, `computedFn`) | `apps/web/ce/store/timeline/base-timeline.store.ts:119-167` | Pattern reference; observable.ref vs observable; bound actions |
| Timeline barrel to extend | `apps/web/ce/store/timeline/index.ts:15-35` | Add `timelinePropagationStore: ITimelinePropagationStore` field |
| RootStore (CE) | `apps/web/ce/store/root.store.ts:1-21` | Already wires `TimeLineStore`; NO change needed (D-06) |
| Canonical issues-map write surface | `apps/web/core/store/issue/issue.store.ts:108-116` (`IssueStore.updateIssue`) | What `commitWithServerResult` calls per server `work_items[]` entry |
| Issues hierarchy entrypoint from RootStore | `apps/web/core/store/root.store.ts:84, 120` (`this.issue: IIssueRootStore = new IssueRootStore(...)`) → `IIssueRootStore.issues: IIssueStore` (`apps/web/core/store/issue/root.store.ts:77`) | Resolves D-05d "find the exact path" — the chain is `rootStore.issue.issues.updateIssue(id, partial)` |
| Existing `updateIssueDates` flow (read-only reference) | `apps/web/core/services/issue/issue.service.ts:242-252` (service) + `apps/web/core/store/issue/helpers/base-issues.store.ts:755-798` (store action calling `issueUpdate` → `IssueStore.updateIssue`) | Confirms D-05d — the new propagation store calls `IssueStore.updateIssue` directly (skipping `issueUpdate`'s extra "updateIssueList" + parent-stats logic, which is irrelevant for date-only updates) |
| Vitest precedent — `packages/codemods` | `packages/codemods/package.json:6, 15` + `packages/codemods/vitest.config.ts:1-22` | `"test": "vitest run"`, `"vitest": "^4.0.8"` — version pin to mirror |
| Vitest precedent — `apps/live` | `apps/live/vitest.config.ts:1-7` | Minimal config shape (D-01a mirrors this exactly) |
| `pnpm-workspace.yaml` catalog | `pnpm-workspace.yaml:7-37` | mobx 6.12.0, mobx-utils 6.0.8, lodash-es 4.18.0, axios 1.15.0, typescript 5.8.3 |
| `tsdown` config for `@plane/utils` | `packages/utils/tsdown.config.ts:1-9` | Confirms only `src/index.ts` is the build entry; tests under `__tests__/` are NOT in the build graph (Pitfall 1 averted) |
| OxLint config | `.oxlintrc.json:36-52` | Confirms NO `camelcase` rule — snake_case interfaces are fine without `oxlint-disable` (Pitfall 2 averted) |
| `turbo.json` test task | `turbo.json:88-91` | A `test` task already exists in turbo; `pnpm --filter=@plane/utils test` works without further config (D-10b confirmed). No `cache: false` set — output cached but Vitest produces no `outputs` (turbo just memoizes "did this task succeed for these inputs"), so safe. |
| State machine + decision lock-in | `.planning/phases/04-frontend-service-client-mobx-preview-store/04-CONTEXT.md` D-01..D-10 | All 10 binding decisions |

## Implementation Order

The phase decomposes naturally into **two waves** because the MobX store depends on the helpers being GREEN:

### Wave 1 — Typed contract + pure helpers + harness (5 tasks)

Each task is independently committable; later tasks consume earlier tasks' types/helpers.

1. **Wire types** — Create `packages/types/src/issues/timeline-propagation.ts` with the literal-union + 4 interfaces from D-02. Add the re-export line to `packages/types/src/index.ts`. Run `pnpm --filter=@plane/types check:types check:lint` GREEN. *(First minimum task per CONTEXT.md `<specifics>`.)*
2. **Service scaffold** — Create `packages/services/src/issue/timeline-propagation.service.ts` per D-03. Update barrel `packages/services/src/issue/index.ts`. Run `pnpm --filter=@plane/services check:types check:lint` GREEN. The service consumes types from task 1.
3. **Vitest harness onboarding** — Add `packages/utils/vitest.config.ts` (D-01a), update `packages/utils/package.json` with `"test": "vitest run"` and `vitest: "^4.0.8"` devDep. Run `pnpm install` (expect clean — Pitfall 10 averted by precedent). Add a smoke test (`packages/utils/src/timeline-propagation/__tests__/smoke.test.ts` with `expect(1+1).toBe(2)`) and run `pnpm --filter=@plane/utils test` GREEN to prove the harness boots before touching propagation logic.
4. **Pure helpers** — Create `packages/utils/src/timeline-propagation/preview.ts` with `computeLoadedPreview`, `diffHiddenUpdate`, `applyServerWorkItems` per D-04. Create barrel `packages/utils/src/timeline-propagation/index.ts`. Add `export * from "./timeline-propagation"` to `packages/utils/src/index.ts`. Run `pnpm --filter=@plane/utils build check:types check:lint` GREEN.
5. **PRD-pinned tests** — In `packages/utils/src/timeline-propagation/__tests__/preview.test.ts` write four tests (TEST-19 chain/branch/simple parameterized; TEST-20 helper-level rollback invariant; TEST-21 `applyServerWorkItems` replace; TEST-22 `diffHiddenUpdate` count). Replace the smoke test with these. Run `pnpm --filter=@plane/utils test` GREEN.

End of Wave 1: types compile, service scaffold imports cleanly into Phase 5 (NOT YET in this phase), helpers tested, harness proven.

### Wave 2 — MobX store + CE wiring (2 tasks)

6. **MobX store** — Create `apps/web/ce/store/timeline/timeline-propagation.store.ts` per D-05. Implement the 4-action surface, the dual-observable error split (D-05c), the `lastPreviewIds`-pre-clear pattern (D-05e / Pitfall 6), the in-flight promise cache (D-08a / Pitfall 7), and the `RootStore.issue.issues.updateIssue` write-back loop wrapped in a single `runInAction` (D-05d / Pitfall 8). Run `pnpm --filter=web check:types check:lint` GREEN; warnings budget unchanged (D-10).
7. **CE root-store wiring** — Update `apps/web/ce/store/timeline/index.ts` to extend `ITimelineStore` interface and `TimeLineStore` class to instantiate `timelinePropagationStore: ITimelinePropagationStore` (D-06). Run `pnpm --filter=web check:types check:lint` GREEN.

End of Wave 2: Phase 5 has every seam it needs.

### Phase gate — final commit-coverage check

After Wave 2, run from repo root:

```bash
pnpm check                         # check:format check:lint check:types across the workspace
pnpm --filter=@plane/utils test    # 4 PRD-pinned tests GREEN
pnpm --filter=web check:types     # Confirm warnings budget at 11957 unchanged
```

All GREEN → phase ready for `/gsd-verify-work`. Phase 5 unblocks (drag handler + UI rendering).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Bulk date writes via `updateIssueDates` (`/api/.../issue-dates/`) | Dedicated propagation endpoint via `propagateMove` (`/api/.../timeline-propagation/`) | Phase 3 (2026-05-04) | Phase 4 wraps the new endpoint; old endpoint stays for non-propagation date-edit paths (D-03b) |
| MobX 5 (decorator syntax) | MobX 6 (`makeObservable` API) | repo-wide; ongoing | Phase 4 store uses `makeObservable + observable + action.bound` like every existing store [VERIFIED: `apps/web/ce/store/timeline/base-timeline.store.ts:143-167`] |
| ESLint + Prettier | OxLint + oxfmt | docs/linting.md | New code targets 0 warnings; no eslint-disable comments unless absolutely required |
| jest / mocha test harnesses | Vitest 4 | per-package adoption | `apps/live`, `packages/codemods` use Vitest; Phase 4 adds `@plane/utils` as the third |

**Deprecated/outdated:**

- Phase 4 does NOT add Vitest to `apps/web` (CONCERNS.md "do not invent test harnesses without asking" still applies; D-01 explicitly leaves it out).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^4.0.8` (matches `packages/codemods` pin) |
| Config file | `packages/utils/vitest.config.ts` (NEW per D-01a) |
| Quick run command | `pnpm --filter=@plane/utils test` |
| Full suite command | `pnpm --filter=@plane/utils test` (only `@plane/utils` is in scope; running phase-wide tests means the same command) |
| Pre-flight build | `pnpm --filter=@plane/utils build` (after barrel changes — Pitfall 5) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| FE-01 / TEST-19 | Loaded-graph preview — simple case (one move, one successor) | unit (Vitest) | `pnpm --filter=@plane/utils test -t "computeLoadedPreview simple"` | ❌ Wave 1 task 5 |
| FE-01 / TEST-19 | Loaded-graph preview — chain case (A→B→C, drag A) | unit (Vitest) | `pnpm --filter=@plane/utils test -t "computeLoadedPreview chain"` | ❌ Wave 1 task 5 |
| FE-01 / TEST-19 | Loaded-graph preview — branch case (multiple predecessors → most-restrictive boundary) | unit (Vitest) | `pnpm --filter=@plane/utils test -t "computeLoadedPreview branch"` | ❌ Wave 1 task 5 |
| FE-02 | Preview is advisory (helpers immutable; never mutate inputs) | unit (Vitest) | `pnpm --filter=@plane/utils test -t "preview helpers do not mutate"` | ❌ Wave 1 task 5 (D-04c invariant test) |
| FE-04 / TEST-21 | Server work_items REPLACE preview (`applyServerWorkItems`) | unit (Vitest) | `pnpm --filter=@plane/utils test -t "applyServerWorkItems replaces dates"` | ❌ Wave 1 task 5 |
| FE-05 / TEST-20 | Failure → preview rollback (helper-level: rollback is no-op against helpers; full store flow covered transitively by Phase 6 E2E TEST-24) | unit (Vitest) + transitive E2E | `pnpm --filter=@plane/utils test -t "applyServerWorkItems is not invoked when no work_items"` | ❌ Wave 1 task 5 |
| FE-06 / TEST-22 | Hidden-update count (`diffHiddenUpdate` returns count of server-only ids) | unit (Vitest) | `pnpm --filter=@plane/utils test -t "diffHiddenUpdate"` | ❌ Wave 1 task 5 |
| FE-07 | Safe-limit-no-dialog (no confirmation flag in store surface) | structural (compile-time + lint) | `pnpm --filter=web check:types` (interface inspection) | structural — no test file; pinned by D-05 interface |
| FE-08 | Existing dependency drag files NOT modified | repo-shape assertion | `git diff --stat HEAD~ apps/web/ce/components/gantt-chart/dependency/` returns empty | manual / `/gsd-verify-work` check |

**Sampling rate:**

- **Per task commit:** `pnpm --filter=@plane/utils test` (4 tests, ~sub-second)
- **Per wave merge:** above + `pnpm --filter=@plane/types check:types` + `pnpm --filter=@plane/services check:types` + `pnpm --filter=web check:types` (the last enforces the 11957 warnings budget)
- **Phase gate:** `pnpm check` from repo root (format + lint + types across all packages) + `pnpm --filter=@plane/utils test` GREEN before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `packages/utils/vitest.config.ts` — Vitest config (D-01a) — Wave 1 task 3
- [ ] `packages/utils/package.json` — `"test": "vitest run"` script + `vitest: "^4.0.8"` devDep (D-01b) — Wave 1 task 3
- [ ] `packages/utils/src/timeline-propagation/__tests__/preview.test.ts` — covers TEST-19/20/21/22 — Wave 1 task 5
- [ ] No new framework install command needed (catalog already pins all deps; `vitest` is added as a local devDep matching `packages/codemods`'s precedent)

### Fixture Shapes

For TEST-19 / TEST-21 / TEST-22, parameterize on these shared fixture shapes:

```ts
// Loaded subset — 4 work items, 3 edges (A→B, B→C, A→C — branch test case)
const items_by_id = {
  "wi-A": { id: "wi-A", start_date: "2026-05-04", target_date: "2026-05-08" },
  "wi-B": { id: "wi-B", start_date: "2026-05-09", target_date: "2026-05-13" },
  "wi-C": { id: "wi-C", start_date: "2026-05-14", target_date: "2026-05-18" },
  "wi-D": { id: "wi-D", start_date: "2026-05-09", target_date: "2026-05-15" }, // branch leaf
};
const edges = [
  { predecessor_id: "wi-A", successor_id: "wi-B" }, // chain
  { predecessor_id: "wi-B", successor_id: "wi-C" }, // chain
  { predecessor_id: "wi-A", successor_id: "wi-D" }, // branch
];
// Drag A 5 days right → simple/chain/branch all exercised in one fixture
```

For TEST-22, the fixture pairs `previewById` (3 ids) with a server response (4 work_items[] including 1 hidden id) → expected `diffHiddenUpdate = 1`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vitest 4 is the Vitest 4.x line (released ~2025); pinning `^4.0.8` will resolve to a 4.x release that's compatible with TypeScript 5.8.3 / vite 7.3.2 (catalog) | Standard Stack — Core | LOW. `packages/codemods` is currently building GREEN with the same pin in this same workspace [VERIFIED: `packages/codemods/package.json:15`]. If `pnpm install` complains about peers, fall back to whatever exact version `packages/codemods/node_modules/vitest/package.json` resolves to (deterministic). [ASSUMED] |
| A2 | Adding `__tests__/preview.test.ts` to `packages/utils/src/timeline-propagation/` will NOT be emitted into `dist/` because `tsdown` only follows the import graph from `src/index.ts`, and the barrel chain only re-exports `preview.ts` (not its tests) | Pitfall 1 | LOW. tsdown's behavior matches Rollup's; `entry: ["src/index.ts"]` + reachability is the documented contract. Plan-phase verifies post-build [ASSUMED]. |
| A3 | OxLint's project config does NOT enforce `camelcase` on TS interface members (snake_case wire fields will pass lint without `oxlint-disable`) | Pitfall 2 | NONE — verified directly: `.oxlintrc.json:36-52` lists no camelcase rule; existing `TBaseIssue` ships snake_case without disables [VERIFIED]. |
| A4 | The `RootStore.issue.issues.updateIssue(id, Partial<TIssue>)` call from inside the propagation store's `runInAction` will reach the SAME `IssueStore.issuesMap` that `apps/web/core/store/issue/helpers/base-issues.store.ts::issueUpdate` (line 565) writes to | Reusable Code Map | LOW. The chain `RootStore.issue: IIssueRootStore` → `.issues: IIssueStore` → `.updateIssue` is the canonical mutation path; both `issueUpdate` (base-issues store) and downstream `issuesMap` consumers route through it [VERIFIED: `apps/web/core/store/issue/issue.store.ts:108-116`]. |
| A5 | `commitWithServerResult` returning a union (NOT throwing) is what Phase 5 expects to consume — i.e., Phase 5 will write `const result = await store.commitWithServerResult(...); if ("code" in result) renderError(result.code); else renderSuccess(result);` | D-05c interpretation | LOW. CONTEXT.md D-05c locks the union return at the store layer specifically so Phase 5 doesn't need try/catch. [VERIFIED: CONTEXT.md D-05c verbatim]. |

**If this table is empty:** _(non-empty above; 5 assumptions, all LOW risk; A3 is fully verified)._

## Open Questions

1. **`hiddenUpdateCount` semantic for hidden REMOVALS** — D-05e's `diffHiddenUpdate` counts server-included ids that are NOT in the preview. But what about ids that WERE in the preview but the server's response did NOT include? The current spec says `total_updated_count` is the server's count, which matches `work_items[].length`; preview-only entries that weren't actually updated server-side are silently dropped. **Status:** Out of scope for Phase 4 — `diffHiddenUpdate` is one-directional (server-side hidden additions only). If Phase 5 / 6 surface a UX gap ("preview said 3, server said 2"), revisit then.
2. **`computeLoadedPreview` D-04a "most-restrictive boundary" branch case** — the algorithm says "for a successor with multiple predecessors, pick the most-restrictive boundary". The plan-phase implementation needs to spell out: most-restrictive = max over predecessors' new `target_date + 1`, vs. any other interpretation (e.g., earliest non-violating). **Recommendation:** plan-phase implements `max(...predecessors.map(p => p.new_target_date + 1 day))` matching Phase 2's adjacency rule (PROP-10).

These are micro-details for plan-phase, not user-blocking decisions.

## Environment Availability

> Phase 4 has no external runtime dependencies (code-only — adds 4 source files + 4 barrel updates + 1 Vitest config + 1 package.json edit). All toolchain prerequisites already required by repo: Node 22.18.0 (`.mise.toml`), pnpm 10.32.1, Turborepo 2.9. No new services, runtimes, or CLIs.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | All packages | ✓ (per repo) | 22.18.0 | — |
| pnpm | All packages | ✓ (per repo) | 10.32.1 | — |
| Turborepo | Workspace orchestration | ✓ (per repo) | 2.9 | — |
| Vitest 4 | `@plane/utils` test harness | ✓ (will install via `packages/utils/package.json` devDep — same exact version as `packages/codemods`) | `^4.0.8` | None needed; precedent established |

**Missing dependencies with no fallback:** None — the new `vitest` devDep is the only addition and resolves cleanly per existing `packages/codemods` precedent.

## Sources

### Primary (HIGH confidence)

- `./CLAUDE.md` — pnpm catalog, OxLint, workspace:* convention, ce/core boundary, warnings budgets [VERIFIED]
- `.planning/phases/04-frontend-service-client-mobx-preview-store/04-CONTEXT.md` — 10 binding decisions D-01..D-10 [VERIFIED]
- `.planning/phases/03-propagation-api-endpoint-persistence-contract/03-CONTEXT.md` — Phase 3 wire contract that Phase 4 mirrors [VERIFIED]
- `.planning/REQUIREMENTS.md` — FE-01/02/04/05/06/07/08, TEST-19/20/21/22 mapped to Phase 4 [VERIFIED]
- `.planning/STATE.md` — Phase 3 PHASE COMPLETE, Phase 4 unblocked [VERIFIED]
- `.planning/ROADMAP.md` — phase boundaries and inter-phase contracts [VERIFIED]
- `CONTEXT.md` (repo root) — Ubiquitous Language [VERIFIED]
- `packages/services/src/api.service.ts:14-95` — `APIService` base class [VERIFIED]
- `packages/services/src/issue/sites-issue.service.ts:1-22, 31-39` — sibling service pattern [VERIFIED]
- `packages/services/src/issue/index.ts:1-7` — barrel currently only re-exports `sites-issue.service` [VERIFIED]
- `apps/web/core/services/issue/issue.service.ts:242-252` — wire-error throw pattern with `.data` [VERIFIED]
- `packages/types/src/index.ts:31-32` — barrel for `./issues` [VERIFIED]
- `packages/types/src/issues/issue.ts:45-80` — `TBaseIssue` snake_case fields proves no oxlint-disable needed [VERIFIED]
- `packages/utils/src/datetime.ts` — existing date helpers to reuse [VERIFIED]
- `packages/utils/src/index.ts:7-43` — barrel to extend [VERIFIED]
- `packages/utils/package.json:1-58` — current state; OxLint budget 38; tsdown build [VERIFIED]
- `packages/utils/tsdown.config.ts:1-9` — only `src/index.ts` is the build entry [VERIFIED]
- `packages/codemods/package.json:6, 15` — `"test": "vitest run"` + `vitest: "^4.0.8"` precedent [VERIFIED]
- `packages/codemods/vitest.config.ts:1-22` — Vitest config precedent [VERIFIED]
- `apps/live/vitest.config.ts:1-7` — minimal Vitest config (D-01a mirrors) [VERIFIED]
- `apps/web/ce/store/timeline/index.ts:1-35` — `TimeLineStore` to extend (D-06) [VERIFIED]
- `apps/web/ce/store/timeline/base-timeline.store.ts:1-449` — MobX patterns (`makeObservable`, `runInAction`, `computedFn`, `observable.ref` vs `observable`) [VERIFIED]
- `apps/web/ce/store/root.store.ts:1-21` — `RootStore` already wires `TimeLineStore`; no change needed [VERIFIED]
- `apps/web/core/store/issue/issue.store.ts:18-128` — `IssueStore.updateIssue` is the canonical write surface [VERIFIED]
- `apps/web/core/store/issue/root.store.ts:54-77, 122-145` — `IIssueRootStore.issues: IIssueStore` exposed via `RootStore.issue` [VERIFIED]
- `apps/web/core/store/issue/helpers/base-issues.store.ts:112, 234, 554-571, 755-798` — `updateIssueDates` flow (read-only reference; D-03b/D-05d basis) [VERIFIED]
- `pnpm-workspace.yaml:1-37` — workspace + catalog + onlyBuiltDependencies [VERIFIED]
- `.oxlintrc.json:1-53` — confirms no `camelcase` rule [VERIFIED]
- `turbo.json:88-91` — `test` task already exists [VERIFIED]
- `packages/constants/src/endpoints.ts:7` — `API_BASE_URL` [VERIFIED]

### Secondary (MEDIUM confidence)

- (None for this phase — every claim was verified by direct code inspection or CONTEXT.md citation.)

### Tertiary (LOW confidence)

- (None — Phase 4 is contained entirely within already-shipped repo code + locked CONTEXT.md decisions.)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries already in repo at known versions; Vitest precedent in two sibling packages
- Architecture: HIGH — every pattern verified against existing files; CONTEXT.md decisions are binding
- Pitfalls: HIGH — 9 of 10 verified by code inspection; #10 (Vitest peer-dep) is LOW-risk by precedent
- Reusable Code Map: HIGH — all citations are file:line verified
- Validation Architecture: HIGH — Vitest harness is standard, tests map 1:1 to PRD-pinned IDs

**Research date:** 2026-05-04
**Valid until:** 2026-06-03 (~30 days; Phase 4 stack is stable and fully internal — no fast-moving external dependencies)

## RESEARCH COMPLETE
