# Phase 4: Frontend Service Client & MobX Preview Store - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning
**Mode:** `--auto` (recommended option auto-selected for every gray area; no user prompts)

<domain>
## Phase Boundary

Wrap Phase 3's `POST /api/workspaces/<slug>/projects/<uuid>/timeline-propagation/` endpoint behind a typed frontend seam so Phase 5 (drag handler) and Phase 6 (E2E) become pure clients of a stable in-process API. Phase 4 delivers four artifacts and **nothing user-visible**:

1. **`@plane/types`** — request / success / error / `code` shape that mirrors Phase 3's serializers verbatim (single source of truth for the wire contract on the TS side).
2. **`@plane/services`** — `TimelinePropagationService.propagateMove(workspaceSlug, projectId, body)` extending `APIService`, axios call only, error → throw of `{code, message}` body.
3. **`@plane/utils/timeline-propagation/*`** — pure helpers: `computeLoadedPreview(graph, dragged, requested)`, `diffHiddenUpdate(serverWorkItems, previewIds)`, `applyServerWorkItems(...)`. Vitest harness.
4. **`apps/web/ce/store/timeline/timeline-propagation.store.ts`** — MobX store with the four-action surface `beginPreview / updatePreview / commitWithServerResult / rollback` plus a `hiddenUpdateCount` getter; consumes the helpers above and the existing `IssuesTimeLineStore` for read-only graph access.

Phase 4 introduces **no UI behavior**. Phase 5 will swap the drag handler to call this store, render previewing, and surface failure messages; Phase 6 covers it E2E.

**In scope (Phase 4 only):**

- NEW: `packages/types/src/issues/timeline-propagation.ts` — typed request, success response, error response, error-code literal union.
- UPDATE: `packages/types/src/index.ts` — re-export the new module.
- NEW: `packages/services/src/issue/timeline-propagation.service.ts` — `TimelinePropagationService extends APIService` with single `propagateMove(...)` method.
- UPDATE: `packages/services/src/issue/index.ts` — barrel re-export. (Currently only `sites-issue.service`; this is the second file there.)
- NEW: `packages/utils/src/timeline-propagation/index.ts` and `preview.ts` — pure preview/rollback/diff helpers.
- NEW: `packages/utils/src/timeline-propagation/__tests__/preview.test.ts` — Vitest covering TEST-19, TEST-20, TEST-21, TEST-22 against the pure helpers.
- NEW: `packages/utils/vitest.config.ts` and `packages/utils/package.json` script `"test": "vitest run"` + `vitest` devDep — same precedent as `packages/codemods` (already in this repo) and `apps/live`.
- UPDATE: `packages/utils/src/index.ts` — `export * from "./timeline-propagation"`.
- NEW: `apps/web/ce/store/timeline/timeline-propagation.store.ts` — the MobX store described above.
- UPDATE: `apps/web/ce/store/timeline/index.ts` — extend `ITimelineStore` interface and `TimeLineStore` class to instantiate `timelinePropagationStore: ITimelinePropagationStore`.
- UPDATE: `turbo.json` if a new `test` task target is needed for `@plane/utils` (likely not — `pnpm --filter=@plane/utils test` will work via the package's local script without a turbo task; keep turbo untouched in Phase 4 unless a measurable need arises).

**Out of scope (deferred to later phases):**

- The drag handler swap and the wiring that calls `beginPreview / updatePreview / commitWithServerResult / rollback` — Phase 5 (FE-03, FE-09, ERR-01..ERR-08).
- `i18n` keys for the 7 error codes and the hidden-update notification — Phase 5 (ERR-01..ERR-07 + FE-06 user-readable string).
- Actually rendering the preview shapes against Gantt blocks (CSS / DOM updates) — Phase 5.
- Toast / notification rendering — Phase 5.
- Playwright E2E — Phase 6 (TEST-23, TEST-24).
- Touching the existing `apps/web/ce/components/gantt-chart/dependency/use-dependency-drag.ts`, `cycle-check.ts`, `date-check.ts`, `dependency-paths.tsx` — none of these change in Phase 4 (FE-08 / dependency-creation drag is left alone).
- Touching the existing `apps/web/core/services/issue/issue.service.ts::updateIssueDates` (Phase 3 left it alone too; API-11). Phase 4 does **not** migrate it into `packages/services`.
- Vitest in `apps/web` itself — explicitly NOT introduced. Pure helper tests live in `@plane/utils`; store coverage is transitive via Phase 6 E2E (consistent with `CONCERNS.md` "do not invent test harnesses without asking").
- Resize-handle propagation — out of scope at the milestone level (PROP-18 / FE-09).

</domain>

<decisions>
## Implementation Decisions

### Test harness placement (the headline decision flagged in ROADMAP)

- **D-01:** Add **Vitest to `@plane/utils`** as the test harness for TEST-19 / TEST-20 / TEST-21 / TEST-22. Pure preview / diff / rollback logic lives in `packages/utils/src/timeline-propagation/preview.ts` as plain functions; the store layer is a thin shell around them. Rationale:
  - ROADMAP §"Phase 4 Test strategy" recommends exactly this.
  - `CONCERNS.md` lines 35–40 also identify `packages/utils` as the lowest-friction starting point for introducing Vitest to the frontend tree (`packages/codemods` and `apps/live` already use Vitest — no novel toolchain).
  - Rejects the alternative "skip Vitest, cover via Phase 6 E2E only": that would push 4 PRD-pinned tests (TEST-19..22) onto the slowest test layer and lose deterministic coverage of split / merge / hidden-update edge cases.
  - **Does NOT** introduce Vitest to `apps/web` itself. The MobX store wraps the helpers; its surface is exercised by Phase 6 E2E. This stays inside the user's explicit "do not invent test harnesses without asking" boundary by adding the harness to a package the milestone roadmap already greenlit.
  - Coverage target for the new helpers: ~100% of the four PRD-pinned cases (simple / chain / branch / hidden-update). No global coverage gate raise.

- **D-01a:** `packages/utils/vitest.config.ts` mirrors `apps/live/vitest.config.ts` minimally:
  ```ts
  import { defineConfig } from "vitest/config";
  export default defineConfig({
    test: { environment: "node", globals: true, include: ["src/**/*.test.ts"] },
  });
  ```
  No coverage provider in this phase — we don't need a coverage number, we need the four PRD-pinned cases GREEN.

- **D-01b:** `packages/utils/package.json` gains `"test": "vitest run"` and a `vitest` devDependency aligned with the workspace catalog version (look up the same version `packages/codemods` uses; do **not** add a fresh major). The OxLint `max-warnings` budget stays at its current value `38`; new code targets 0 warnings.

### TypeScript wire-contract types

- **D-02:** `packages/types/src/issues/timeline-propagation.ts` defines the contract as **literal-union + interface**, mirroring Phase 3's serializer field-by-field. Names match the wire (snake_case JSON), not camelCase TS, because the API layer here is "transport"; camelCase normalization (if any) is the store's job, not the wire layer's. (Existing pattern: `TIssue` and friends use snake_case for fields like `start_date`, `target_date`, `updated_at`.)

  ```ts
  export type TTimelinePropagationErrorCode =
    | "DEPENDENCY_CYCLE"
    | "PROJECT_BOUNDARY_EXCEEDED"
    | "INCOMPLETE_SCHEDULE"
    | "PROPAGATION_LIMIT_EXCEEDED"
    | "SCHEDULE_CHANGED"
    | "PERMISSION_DENIED"
    | "INVALID_DATE_RANGE";

  export type TTimelinePropagationOperation = "move"; // PROP-18 — resize is not on the wire.

  export type TTimelinePropagationRequest = {
    work_item_id: string;
    original_start_date: string; // YYYY-MM-DD
    original_target_date: string;
    expected_updated_at: string; // ISO 8601 with microseconds (Phase 3 D-04)
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

- **D-02a:** No discriminated union (`{ ok: true, ... } | { ok: false, ... }`) at the type level. Reason: existing services in this codebase signal failure by **rejecting the promise** with the response body shape (e.g., `apps/web/core/services/issue/issue.service.ts:248–251` does `.catch((error) => { throw error?.response?.data })`). Stick to that convention so callers can `try / catch` with the same shape they use elsewhere; the thrown value is `TTimelinePropagationError`. The success path resolves to `TTimelinePropagationResponse` directly. Don't invent a new ok/error envelope on the TS side that the rest of the codebase doesn't use.

- **D-02b:** Re-export from `packages/types/src/index.ts` via `export * from "./issues/timeline-propagation";` (placed alongside the other `./issues/*` re-exports already there, lines 31–32 of the index).

### Service client placement & shape

- **D-03:** New file `packages/services/src/issue/timeline-propagation.service.ts` extending `APIService`. Single method:
  ```ts
  export class TimelinePropagationService extends APIService {
    constructor(BASE_URL?: string) { super(BASE_URL || API_BASE_URL); }

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
        .catch((error) => { throw error?.response?.data; });
    }
  }
  ```
  URL string is hardcoded at the call site (matches the convention of every other service in `packages/services/src/`). No `/api/v1/` prefix — Plan 03-01's correction note confirmed the urlconf is mounted at `/api/`, not `/api/v1/`.

- **D-03a:** Barrel re-export — UPDATE `packages/services/src/issue/index.ts` from:
  ```ts
  export * from "./sites-issue.service";
  ```
  to also include `export * from "./timeline-propagation.service";`. The package-level barrel `packages/services/src/index.ts` already does `export * from "./issue";` so no further edit needed there.

- **D-03b:** **Do NOT** move `apps/web/core/services/issue/issue.service.ts::updateIssueDates` into `packages/services` as part of this phase. That method predates the migration to `packages/services` and is consumed by code outside the propagation path. Touching it would invite Phase 5/6 regressions in unrelated callers. Leave it; the new service is additive.

- **D-03c:** Service is instantiated **inside the new MobX store** (`new TimelinePropagationService()`), not exported as a singleton. Matches `apps/web/core/store/issue/...` patterns (each store owns its services). No DI framework.

### Pure preview helpers (the testable seam)

- **D-04:** Three pure functions in `packages/utils/src/timeline-propagation/preview.ts`. None of them know MobX, axios, or React. All inputs and outputs are plain JS objects with the snake_case wire shape (so we can pass straight from the API response without re-mapping):

  ```ts
  // Type sketches (final names locked in plan-phase):
  export type LoadedGraphEdge = { predecessor_id: string; successor_id: string };
  export type LoadedWorkItem = { id: string; start_date: string; target_date: string };
  export type PreviewResult = Map<string, { start_date: string; target_date: string }>;

  /**
   * Given the loaded subset of the precedence graph (edges + dated items) and a
   * requested move on `dragged_id`, return the loaded-graph preview map: the
   * minimum set of work items whose dates would change under the loaded
   * adjacency, with their new start/target dates.
   *
   * Mirrors Phase 2's algorithm shape **for the loaded subset only** — server
   * remains authoritative and replaces this map on success. Hidden items
   * (server moves a work item not in the loaded subset) are intentionally NOT
   * predicted here; they surface via diffHiddenUpdate(...) after the response.
   */
  export function computeLoadedPreview(
    edges: LoadedGraphEdge[],
    items_by_id: Record<string, LoadedWorkItem>,
    dragged: { id: string; original_start_date: string; original_target_date: string; requested_start_date: string; requested_target_date: string },
  ): PreviewResult;

  /**
   * Given a server response and the loaded preview ids, returns the count of
   * server-updated work items NOT present in the preview map. Implements FE-06
   * (TEST-22).
   */
  export function diffHiddenUpdate(
    server_work_items: TTimelinePropagationWorkItem[],
    preview_ids: ReadonlySet<string>,
  ): number;

  /**
   * Pure projection: produce the next state of the issues map by applying the
   * server's work_items array on top of a current snapshot. Used by the store's
   * commit action; tested in isolation here.
   */
  export function applyServerWorkItems<T extends { id: string; start_date?: string | null; target_date?: string | null; updated_at?: string }>(
    current: Record<string, T>,
    server_work_items: TTimelinePropagationWorkItem[],
  ): Record<string, T>;
  ```

- **D-04a:** Algorithm boundary: `computeLoadedPreview` does NOT replicate Phase 2's full algorithm. It only walks **loaded** adjacency (the client doesn't have the full graph) and only for the visible direction (rightward → walk successors; leftward → walk predecessors). It is best-effort, advisory, and non-binding (FE-02). Edge cases handled: same-direction split (one move pushes two successors), chain (transitive walk one level deep through the loaded subset), branch (multiple predecessors of one successor — pick the most-restrictive boundary), incomplete loaded data (skip; the server will catch it). The function never returns a "failure" — failures are the server's job.

- **D-04b:** Date math uses **calendar-day arithmetic** consistent with Phase 2 (PROP-11). Use `date-fns` (already a `@plane/utils` dependency); no new dep. Adjacency rule mirrors PRD: `successor.start = predecessor.target + 1 calendar day` is the canonical zero-gap shape (matches Phase 2 D-06 step adjacency). When a successor's `start_date` is `predecessor.target + 1 day` exactly, no shift; when it's earlier, shift by `(predecessor.new_target + 1) - successor.start_date` days (preserving duration).

- **D-04c:** All three helpers are **immutable** — they never mutate inputs; they return new objects. Required so the MobX store can call them inside `runInAction(() => { ... })` without leaking writes through the input maps.

### MobX store surface & state shape

- **D-05:** `apps/web/ce/store/timeline/timeline-propagation.store.ts` exposes:

  ```ts
  export interface ITimelinePropagationStore {
    // observables
    previewById: Map<string, { start_date: string; target_date: string }>;
    isPreviewActive: boolean;
    lastError: TTimelinePropagationError | null;
    lastResponse: TTimelinePropagationResponse | null;

    // computeds
    hiddenUpdateCount: number; // computed from lastResponse + previewById

    // actions
    beginPreview(args: {
      dragged_id: string;
      original_start_date: string;
      original_target_date: string;
      expected_updated_at: string;
      edges: LoadedGraphEdge[];
      items_by_id: Record<string, LoadedWorkItem>;
    }): void;

    updatePreview(args: {
      requested_start_date: string;
      requested_target_date: string;
    }): void; // recomputes previewById against the snapshot taken at beginPreview

    /**
     * Calls TimelinePropagationService.propagateMove on the saved snapshot +
     * the latest requested dates. On success: replaces the canonical issues
     * map (via the issue-detail store action) with server work_items and
     * clears preview. On failure: clears preview (rollback) and stores
     * lastError. Throws nothing; consumers read lastError after awaiting.
     */
    commitWithServerResult(args: {
      workspaceSlug: string;
      projectId: string;
      requested_start_date: string;
      requested_target_date: string;
    }): Promise<TTimelinePropagationResponse | TTimelinePropagationError>;

    /** Discard preview without contacting the server. Used by Esc-cancel in Phase 5. */
    rollback(): void;
  }
  ```

- **D-05a:** State lifecycle is a small state machine:
  ```
  IDLE → (beginPreview) → PREVIEWING
  PREVIEWING → (updatePreview) → PREVIEWING
  PREVIEWING → (commitWithServerResult success) → IDLE (canonical issues replaced)
  PREVIEWING → (commitWithServerResult failure) → IDLE (preview discarded, lastError set)
  PREVIEWING → (rollback) → IDLE
  ```
  Consumers ignore stale calls — calling `updatePreview` before `beginPreview` is a no-op; calling `commitWithServerResult` outside PREVIEWING is a no-op that resolves to a synthetic local-only "no preview active" failure (NOT one of the 7 server codes).

- **D-05b:** `beginPreview` snapshots `edges` + `items_by_id` + `expected_updated_at` once. Subsequent `updatePreview` calls re-run `computeLoadedPreview` against that snapshot — they do **not** re-read the timeline store. Reason: while the user is dragging, an unrelated socket event mustn't redraw the preview against new positions. Snapshot freezes the view of the world at drag-start.

- **D-05c:** `commitWithServerResult` returns a union (not throws) so callers can `await store.commitWithServerResult(...)` and branch on `.code`. Internally it `try/catch`es the service call — convert thrown `{code, message}` into the union via reflection: if the thrown value has a `code` and `message`, treat as `TTimelinePropagationError`; if not (network error, 500), synthesize `{ code: "PERMISSION_DENIED", message: "..." }` as a fallback? **No** — synthesize `{ code: "PERMISSION_DENIED", message: "..." }` is wrong (it'd misinform the user). Instead: surface non-protocol errors via a synthetic local-only marker `{ code: "INVALID_DATE_RANGE", ... }`? Also wrong. **Decision:** non-protocol errors propagate as a special non-PRD code at the **store layer** only (not at the wire layer); store exposes a separate observable `unexpectedError: Error | null` distinct from `lastError: TTimelinePropagationError | null`. Phase 5 chooses to render either one. The 7 wire codes stay clean.

- **D-05d:** The store does **not** mutate `IssuesTimeLineStore.blocksMap` directly. On commit success, it calls a new method on the **issues map owner** (the `IIssueRootStore` / detail store hierarchy under `apps/web/core/store/issue/...`) to apply `applyServerWorkItems(currentIssues, response.work_items)`. The exact entry point is: **call the same path the existing `updateIssueDates`-success handler uses to write back updated dates** — locate it in plan-phase via `apps/web/core/store/issue/helpers/base-issues.store.ts` and the issues maps it owns (the file's "issuesMap" / "updateIssue" surface). This keeps Phase 4's store dependency-injected on the existing issues hierarchy without inventing a sibling map.

- **D-05e:** `hiddenUpdateCount` is a `computed`:
  ```ts
  get hiddenUpdateCount(): number {
    if (!this.lastResponse) return 0;
    return diffHiddenUpdate(this.lastResponse.work_items, new Set(this.previewById.keys()));
  }
  ```
  However, by the time `lastResponse` is set the success path has already cleared `previewById`. So we need to capture the preview ids snapshot **before** clearing. **Refinement:** store `lastPreviewIds: ReadonlySet<string> | null` alongside `lastResponse`; compute against that:
  ```ts
  get hiddenUpdateCount(): number {
    if (!this.lastResponse || !this.lastPreviewIds) return 0;
    return diffHiddenUpdate(this.lastResponse.work_items, this.lastPreviewIds);
  }
  ```
  Pinned by `TEST-22` against the pure `diffHiddenUpdate` helper, with the store's flow asserted by Phase 6 E2E.

### Wiring into the CE root store

- **D-06:** UPDATE `apps/web/ce/store/timeline/index.ts`:
  ```ts
  import { TimelinePropagationStore } from "./timeline-propagation.store";
  import type { ITimelinePropagationStore } from "./timeline-propagation.store";

  export interface ITimelineStore {
    issuesTimeLineStore: IIssuesTimeLineStore;
    modulesTimeLineStore: IModulesTimeLineStore;
    projectTimeLineStore: IBaseTimelineStore;
    groupedTimeLineStore: IBaseTimelineStore;
    timelinePropagationStore: ITimelinePropagationStore; // NEW
  }

  export class TimeLineStore implements ITimelineStore {
    // ... existing fields
    timelinePropagationStore: ITimelinePropagationStore;

    constructor(rootStore: RootStore) {
      this.issuesTimeLineStore = new IssuesTimeLineStore(rootStore);
      this.modulesTimeLineStore = new ModulesTimeLineStore(rootStore);
      this.projectTimeLineStore = new BaseTimeLineStore(rootStore);
      this.groupedTimeLineStore = new BaseTimeLineStore(rootStore);
      this.timelinePropagationStore = new TimelinePropagationStore(rootStore); // NEW
    }
  }
  ```
  No change to `apps/web/ce/store/root.store.ts` — `RootStore` already wires `TimeLineStore` as `this.timelineStore`.

- **D-06a:** The new store accepts `RootStore` for parity with siblings, but only reads the issues hierarchy from it (D-05d). Document the dependency in the constructor docstring.

### Loaded-graph data source (where the store reads from)

- **D-07:** The drag handler (Phase 5) is the supplier. It owns the timing of "which work items are loaded RIGHT NOW", "which adjacency edges are loaded RIGHT NOW", and the `expected_updated_at`. Phase 4's store does **not** inspect MobX trees on its own — Phase 5 hands them in via `beginPreview(...)` arguments. This makes the store testable as a black-box receiving plain JSON.

- **D-07a:** Reading from `IssuesTimeLineStore.blocksMap` and the IssueRelation store happens at the call site in Phase 5. Phase 4 documents the expected shape (`LoadedGraphEdge[]`, `Record<string, LoadedWorkItem>`) so Phase 5 has a typed contract to build against.

### Concurrency & race conditions

- **D-08:** Only one preview is active at a time. If `beginPreview` is called while one is already active, the previous preview is silently discarded and replaced (matches drag UX — letting go of the mouse always ends a drag, but if the implementation drops a mouseup, a new mousedown should never block on the old state). No queue, no debouncing in this phase.

- **D-08a:** `commitWithServerResult` is **not** re-entrant. If called twice in flight, the second call returns the in-flight promise (we cache it). Pinned by Phase 6 E2E if needed; no Phase 4 unit test for this.

### Type-on-wire vs type-in-store snake/camel

- **D-09:** Wire types stay snake_case (D-02). Store observables also use snake_case for the per-work-item preview entries (`{ start_date, target_date }`) — same shape as `TIssue` fields, no conversion. Reason: `apps/web/core/store/issue/...` consumes `TIssue` fields directly without camelCase translation; mirroring saves a translation layer that has no business value.

### Lint, formatting, build

- **D-10:** No new OxLint warnings in any touched file. Existing budgets (`@plane/utils=38`, `apps/web=11957`) remain unchanged. New code targets 0 warnings.
- **D-10a:** No new dependencies in the catalog except `vitest` for `@plane/utils` (matched to the version `packages/codemods` already pulls; do **not** introduce a fresh major). Lookup happens in plan-phase against `pnpm-lock.yaml`.
- **D-10b:** No turbo task additions in Phase 4. `pnpm --filter=@plane/utils test` works via the package-local script. Adding a `test` task to `turbo.json` is a milestone-level concern; defer.

### Claude's Discretion

The auto-mode chose recommended options for every gray area above. Specific call-outs the user may want to revisit during plan-phase:

- **Vitest version pinning** — auto-mode chose to match the version `packages/codemods` already uses (currently `^4.0.8`). If plan-phase finds the catalog has a newer pin, surface and decide explicitly. (D-01b / D-10a.)
- **Snake-case vs camelCase in types/store** — chose snake_case to match wire and existing `TIssue` fields. If a future style decision says "all in-app types are camelCase", we'd need a translation layer. Lock decision in plan-phase; default to snake.
- **Whether to expose `lastError` / `lastResponse` as observables** — chose yes (Phase 5 reads them to render UI). Alternative is fire-and-forget with callbacks. Observables match the rest of the codebase's MobX patterns.
- **`hiddenUpdateCount` snapshot timing** — chose to keep `lastPreviewIds` alongside `lastResponse` so the count survives the `previewById` clear. Alternative is leaving `previewById` non-empty after success until the next `beginPreview`. Rejected because Phase 5 will want to render previews and committed-state cleanly separate (preview = transient overlay, committed = canonical issues map).
- **Synthetic store-only error code for non-protocol errors (network 500, etc.)** — chose to keep them out of `lastError` (the 7-code observable) and instead expose `unexpectedError: Error | null`. Alternative is shoehorning into `lastError` with a synthetic 8th code. Rejected because the wire is 7 codes; the front-end's job is to render them faithfully, not invent codes the server would never send.
- **In-flight commit re-entrancy** — chose to share the in-flight promise instead of throwing. Alternative is to throw / cancel the prior request. Sharing matches "one drag = one network call" UX expectation.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Project-level direction

- `.planning/ROADMAP.md` §"Phase 4: Frontend Service Client & MobX Preview Store" — phase goal, success criteria, modules-to-change list, **risks/open questions** including the Vitest harness decision (locked here as D-01) and the type-duplication risk (locked as D-02).
- `.planning/REQUIREMENTS.md` — owns FE-01, FE-02, FE-04, FE-05, FE-06, FE-07, FE-08, TEST-19, TEST-20, TEST-21, TEST-22 (Phase 4 scope per the traceability table). FE-03 / FE-09 belong to Phase 5; ERR-01..ERR-08 also Phase 5.
- `.planning/PROJECT.md` — Core value, deep-module-first directive, frontend `ce/core` boundary (Phase 4 stays in `ce/store` because `IssuesTimeLineStore` is CE-located), and the "Vitest 導入の是非を Phase 4 で判断" line that this CONTEXT.md formally locks (D-01).
- `.planning/STATE.md` — Phase 3 PHASE COMPLETE. **Carries forward:** Vitest harness decision (resolved here, D-01); wire-contract HTTP status mapping (D-03 of Phase 3) — Phase 4 does NOT need to know status codes specifically because failure paths reject the promise with `{code, message}` regardless of whether the HTTP status was 403 / 409 / 422.
- `.planning/phases/03-propagation-api-endpoint-persistence-contract/03-CONTEXT.md` — **Phase 3 D-01..D-15.** Most relevant carry-overs:
  - **D-01:** URL `POST /api/workspaces/<slug>/projects/<uuid:project_id>/timeline-propagation/` (note: `/api/` not `/api/v1/` per Plan 03-01 correction).
  - **D-04:** Request body field names (snake_case) and `expected_updated_at` ISO 8601 with microseconds — Phase 4 D-02 mirrors verbatim.
  - **D-04 (response shape):** `{ requested_work_item_id, total_updated_count, client_preview_count: number | null, work_items: [{ id, start_date, target_date, updated_at }] }`.
  - **D-04 (error envelope):** `{ code: <one of 7>, message: <human-readable English> }`.
  - **D-04 (operation):** `move`-only (PROP-18). `resize` rejected at serializer with DRF 400 (NOT envelope). Phase 4's TS literal type encodes this.
  - **D-12:** `PropagationErrorCode` is the source of truth for the 7 codes; Phase 4 mirrors as a TS literal union (D-02) and accepts that adding a code on the server requires a TS update.
- `.planning/phases/03-propagation-api-endpoint-persistence-contract/03-VERIFICATION.md` — Phase 3 sign-off; pin GREEN counts (26 contract + 64 unit) so Phase 4 keeps them GREEN.

### Frontend domain & PRD (downstream agents read these for naming and UX intent)

- `CONTEXT.md` (repo root) — Ubiquitous Language. Use **Work Item / Precedence Dependency / Dependency Schedule Propagation / Precedence Boundary** in: type field docstrings, store action docstrings, helper function docstrings, test names. Avoid "issue" / "relation" in user-facing prose. (Phase 4's TS field names are constrained to wire snake_case so domain terms live in docstrings, not field names.)
- `docs/prd/timeline-dependency-date-range-propagation.md` — PRD. Phase 4 covers US-23 (loaded-graph preview), US-24 (server replaces preview), US-25 (hidden-update notification value), US-26 (rollback on failure), US-30 (no confirmation dialog inside safe limit — informs absence of confirmation flag in store).
- `docs/adr/0001-server-authoritative-dependency-schedule-propagation.md` — server is authoritative; client preview is advisory. Phase 4 D-04 / D-05 enforce this (preview = transient; canonical issues map only mutated by server response).
- `docs/adr/0002-working-calendar-with-japan-holiday-preset.md` (deferred milestone) — Phase 4 stays calendar-day (D-04b); when ADR 0002 ships, the helper's date arithmetic swaps without changing the store API.

### Existing code (read-only inputs)

- `apps/web/core/services/issue/issue.service.ts:242-252` — `updateIssueDates` precedent. Read-only reference. Phase 4 does **not** touch this; it sets the wire-error-handling pattern (`.catch((error) => { throw error?.response?.data })`) that Phase 4's new service mirrors (D-03).
- `packages/services/src/api.service.ts` — `APIService` base class. Phase 4's new service extends it (D-03). Read for `.post(...)` / `.get(...)` signatures and the axios-instance contract.
- `packages/services/src/issue/sites-issue.service.ts` — sibling service in the same directory; Phase 4's new file mirrors its file shape, copyright header, and constructor pattern.
- `packages/services/src/issue/index.ts` — barrel currently re-exports only `sites-issue.service`. Phase 4 adds `timeline-propagation.service` (D-03a).
- `packages/services/src/index.ts` — already does `export * from "./issue";` (line 21). No further edit.
- `packages/types/src/issues/issue.ts` — sibling types module. Phase 4's new `timeline-propagation.ts` mirrors file structure (copyright header, `export type T...`).
- `packages/types/src/index.ts:31-32` — barrel for `./issues`. Phase 4 adds the new module export (D-02b).
- `packages/utils/src/index.ts` — barrel. Phase 4 adds `export * from "./timeline-propagation"`.
- `packages/utils/package.json` — phase reference for `vitest` devDep + `"test"` script addition (D-01b).
- `apps/live/vitest.config.ts` and `packages/codemods/vitest.config.ts` — vitest config precedents in this monorepo. Phase 4 mirrors `apps/live`'s shape, dropped to bare minimum (D-01a).
- `packages/codemods/package.json` — current `vitest` version pin reference (`^4.0.8`). Phase 4 D-10a defers final version selection to plan-phase but defaults to whatever `packages/codemods` uses.
- `apps/web/ce/store/timeline/index.ts` — `TimeLineStore` class. Phase 4 adds `timelinePropagationStore` field + interface entry + constructor wiring (D-06).
- `apps/web/ce/store/timeline/base-timeline.store.ts:1-80` — sibling store reference for MobX patterns (`makeObservable`, `observable`, `action`, `runInAction`, `computedFn`). Phase 4's new store mirrors the conventions: copyright header, `import` ordering, `mobx-react`-friendly observability.
- `apps/web/ce/store/root.store.ts` — `RootStore` already instantiates `TimeLineStore`. Phase 4 needs no change here (the new store is a child of `TimeLineStore`).
- `apps/web/core/store/issue/helpers/base-issues.store.ts` — Phase 4 plan-phase MUST locate the issues-map mutation surface (the function the existing `updateIssueDates` success-path calls to write back updated dates) and document the call site BEFORE Phase 5 wires the drag handler. Action only; no helper invention.
- `apps/web/core/store/timeline/issues-timeline.store.ts` — `IssuesTimeLineStore` (CE-extension target via path alias `@/store/timeline/issues-timeline.store`). Read for `blocksMap` shape and how Phase 5 will hand `LoadedGraphEdge[]` / `LoadedWorkItem` to `beginPreview` (D-07).
- `apps/web/ce/components/gantt-chart/dependency/use-dependency-drag.ts` — relation-creation drag (NOT TOUCHED by Phase 4 or Phase 5; FE-08 explicit).
- `apps/web/ce/components/gantt-chart/dependency/cycle-check.ts` — relation-creation cycle guard (NOT TOUCHED).
- `apps/web/ce/components/gantt-chart/dependency/date-check.ts` — relation-creation date guard (NOT TOUCHED).
- `apps/web/core/components/gantt-chart/blocks/block.tsx` — already exposes `data-block-id`; Phase 4 doesn't render anything but Phase 5 / 6 will rely on this attribute. Listed for context only.

### Codebase maps (already-read context)

- `.planning/codebase/STACK.md` — Node 22.18.0 + pnpm 10.32.1 + Turborepo 2.9; OxLint 0.20+; tsdown for `@plane/*` builds. Workspace catalogs versions in `pnpm-workspace.yaml`.
- `.planning/codebase/STRUCTURE.md` — `apps/web/{core,ce}` aliases (`@/*` → `core/*`, `@/plane-web/*` → `ce/*`). Phase 4's store goes in `ce/store/timeline/` (CE because `TimeLineStore` already lives there).
- `.planning/codebase/TESTING.md` — only `apps/live` and `packages/codemods` have Vitest today. Phase 4 adds `@plane/utils` (D-01) — third Vitest harness, fully consistent with the existing precedent.
- `.planning/codebase/CONCERNS.md` lines 35–40 — explicitly recommends introducing Vitest to `packages/utils` first. Phase 4 D-01 closes this.
- `.planning/codebase/CONVENTIONS.md` — barrel re-exports, file headers, store conventions.
- `.planning/codebase/ARCHITECTURE.md` — frontend layered model: services → stores → components. Phase 4 ships service + store; Phase 5 wires components.
- `.planning/codebase/INTEGRATIONS.md` — axios + APIService boundary; React Router v7; MobX + mobx-react-lite.

### Prior phase cross-references

- `.planning/phases/01-precedence-graph-loader-normalization/01-CONTEXT.md` — Phase 1 D-01..D-10 (graph contract). Informs Phase 4's `LoadedGraphEdge` / `LoadedWorkItem` shapes (D-04).
- `.planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-CONTEXT.md` — Phase 2 D-01..D-14 (algorithm shape). Phase 4's `computeLoadedPreview` is a **simplified, advisory subset** that respects Phase 2's adjacency rule (D-04b) but does NOT replicate the full algorithm.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`APIService`** (`packages/services/src/api.service.ts`) — base class for the new service (D-03).
- **`API_BASE_URL`** (`@plane/constants`) — already imported by every sibling service in `packages/services/src/`; Phase 4 mirrors.
- **`apps/web/core/services/issue/issue.service.ts:242-252` (`updateIssueDates`)** — wire-error-handling pattern reference (`.catch((error) => { throw error?.response?.data })`). Don't touch; copy the convention into the new service.
- **`apps/live/vitest.config.ts`** and **`packages/codemods/vitest.config.ts`** — Vitest config precedents.
- **`packages/codemods/package.json`** — `vitest: "^4.0.8"` devDep precedent for version pinning (D-10a).
- **`apps/web/ce/store/timeline/base-timeline.store.ts`** — MobX store conventions reference (header, imports, `makeObservable`, `runInAction`, `computedFn`).
- **`apps/web/ce/store/timeline/index.ts`** — `TimeLineStore` class for the wiring extension (D-06).
- **`apps/web/core/store/issue/helpers/base-issues.store.ts`** — issues-map mutation surface; plan-phase MUST locate the exact write-back action used by `updateIssueDates`'s success path (D-05d).
- **`@plane/types`** existing snake_case field shape (`TIssue.start_date`, `target_date`, `updated_at`) — Phase 4's wire types match (D-02 / D-09).
- **`date-fns`** in `@plane/utils` deps — calendar-day arithmetic (D-04b). No new dep.

### Established Patterns

- **One file per service in `packages/services/src/<domain>/`** (intake, module, cycle, issue, etc.). Phase 4: new `packages/services/src/issue/timeline-propagation.service.ts`.
- **Wire types are snake_case in `@plane/types`** (matches Django's JSON output). Phase 4 follows.
- **Errors are thrown from service `.catch`** — never returned as part of the success type. Phase 4 follows (D-02a).
- **Stores own their service instances** — instantiated in the constructor; not exported singletons. Phase 4 follows (D-03c).
- **CE extension via `@/plane-web/*`** alias — the new store lives in `apps/web/ce/store/timeline/` so `TimeLineStore` (already CE) can compose it (D-06).
- **Vitest minimal config** (`{ test: { environment: "node" } }`) — Phase 4's `@plane/utils/vitest.config.ts` mirrors `apps/live`'s minimal shape (D-01a).
- **Pure helpers in `@plane/utils`** — already a thick library of date/string/array/etc. helpers. Phase 4 adds a `timeline-propagation/` subdir.
- **Barrel re-exports cascade** — package-local `index.ts` re-exports each module; the package's `src/index.ts` re-exports each subdir. Phase 4 follows at every level.

### Integration Points

- **Phase 5 (drag handler)** consumes:
  - `TimelinePropagationService.propagateMove(...)` — but only indirectly via `timelinePropagationStore.commitWithServerResult(...)`. Drag handler never calls the service directly.
  - `timelinePropagationStore.{beginPreview, updatePreview, commitWithServerResult, rollback}` — the four-action surface.
  - `timelinePropagationStore.{previewById, lastError, lastResponse, hiddenUpdateCount, unexpectedError}` — observables for rendering.
  - `TTimelinePropagationErrorCode` from `@plane/types` — Phase 5 maps each value to an i18n key (ERR-01..ERR-07).
- **Phase 6 (E2E)** consumes:
  - The wire URL `/api/workspaces/<slug>/projects/<id>/timeline-propagation/` as a `page.waitForResponse(...)` filter.
  - `data-block-id` attributes on Gantt blocks (already in place; Phase 4 doesn't add or remove any).
- **The existing `apps/web/core/store/issue/...` hierarchy** is read by Phase 4 for the issues-map write-back surface (D-05d). Plan-phase locates the exact entry point.
- **The existing `IssuesTimeLineStore.blocksMap`** is read by Phase 5 (NOT Phase 4) to assemble `LoadedWorkItem[]`. Phase 4's contract just types the input.

</code_context>

<specifics>
## Specific Ideas

- **First minimum task** (anchor for plan-phase): create `packages/types/src/issues/timeline-propagation.ts` with the literal-union + interfaces from D-02, re-export from `packages/types/src/index.ts`, and write a TypeScript-only "compiles" assertion (no runtime test needed — a stub `const _: TTimelinePropagationRequest = { ... }` literal that pins the field shape). This locks the wire-contract types so D-03 (service) and D-04 (helpers) can build on top without churn.
- **Second-minimum task**: scaffold `packages/services/src/issue/timeline-propagation.service.ts` with the `TimelinePropagationService` class and an empty `propagateMove(...)` returning a TODO stub; barrel-export. This locks the service shape Phase 5 imports from.
- **Third-minimum task**: introduce Vitest to `@plane/utils` (D-01a/b) with a single trivial GREEN smoke test (e.g., `expect(1 + 1).toBe(2)`) before touching propagation logic. Pinning the harness first keeps the propagation test additions one concern at a time.
- **The four PRD-pinned tests (TEST-19..22) are the acceptance contract for this phase.** Map each to a single test function in `preview.test.ts`:
  - `TEST-19` → `computeLoadedPreview` simple / chain / branch — three cases
  - `TEST-20` → store-level rollback — covered by a synthetic test in Phase 6 E2E (rollback is a single-line MobX action; the helper that supports it is already covered transitively). Plan-phase decides whether to add a thin store unit test or rely on E2E.
  - `TEST-21` → `applyServerWorkItems` replaces preview with server values — single helper test
  - `TEST-22` → `diffHiddenUpdate` — single helper test with a server response containing one preview-id and one non-preview-id
- **The MobX store's commit path (D-05c) is the trickiest line of code in the phase.** Plan-phase should write it last, after the helpers are GREEN. The risk is the dual observable (`lastError` for protocol errors, `unexpectedError` for non-protocol) — keep them strictly separate to avoid leaking synthetic codes into the wire-error observable.
- **`@plane/utils` already exports `date-fns`-based helpers** (`packages/utils/src/datetime.ts`); Phase 4's preview helper should reuse those rather than re-importing `date-fns` directly. Plan-phase verifies the available primitives (`addDays`, `differenceInCalendarDays`, etc.) and lists the ones used.

</specifics>

<deferred>
## Deferred Ideas

- **Migrating `apps/web/core/services/issue/issue.service.ts::updateIssueDates` into `packages/services`** — sensible cleanup, but unrelated to propagation. Defer to a separate refactor phase or backlog item; Phase 4 must not block on it (D-03b).
- **Vitest in `apps/web` itself** — would unlock direct unit tests of the MobX store. Out of Phase 4 scope; Phase 6 E2E covers the store transitively. Reopen if Phase 6 reveals coverage gaps.
- **`metadata: { cycle?: string[], boundary_edge?: [...] }` on the wire error** — Phase 3 deferred this (Phase 3 deferred-ideas). Phase 4 likewise sticks to `{code, message}`. If Phase 5 ERR-01 / ERR-02 want richer UI (e.g., highlighting the cycle nodes), reopen as a wire-contract amendment.
- **In-flight commit cancellation** (`AbortController` on `propagateMove`) — chose to share the in-flight promise (D-08a). If a future drag UX wants explicit cancel-on-Esc-during-network, add `AbortController` then.
- **A unified front-end error code → i18n key mapping table** — belongs in Phase 5 (ERR-01..ERR-07 i18n keys are Phase 5 scope).
- **Telemetry / analytics on propagation outcomes** — out of scope. If product later wants "how often does a drag fail with which code", instrument at Phase 5 store-call site or via the existing analytics layer; not Phase 4's concern.
- **`turbo.json` test pipeline integration** for `@plane/utils` — defer; `pnpm --filter=@plane/utils test` works locally and in any future CI without a turbo task. Add to turbo only when CI starts depending on it.
- **Snake → camel case translation layer** — chose snake throughout (D-09). If a future style decision says all in-app types are camelCase, add a translation in Phase 5 store-action arguments only; the wire stays snake.
- **Reviewing follow-up: `IssueBulkUpdateDateEndpoint` cleanup** — Phase 3 deferred; Phase 4 has no role in it.

</deferred>

---

*Phase: 04-Frontend Service Client & MobX Preview Store*
*Context gathered: 2026-05-04*
