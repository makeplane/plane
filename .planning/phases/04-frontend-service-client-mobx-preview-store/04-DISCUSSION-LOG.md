# Phase 4: Frontend Service Client & MobX Preview Store - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 4-Frontend Service Client & MobX Preview Store
**Mode:** `--auto` (no user prompts; recommended option auto-selected for every gray area)
**Areas discussed:** Test harness placement, TS wire-contract types, Service client placement & shape, Pure preview helpers, MobX store surface & state shape, CE root-store wiring, Loaded-graph data source, Concurrency & race conditions, snake/camel case, Lint/build

---

## Test harness placement

| Option | Description | Selected |
|--------|-------------|----------|
| Add Vitest to `@plane/utils` for pure helpers (TEST-19..22) | ROADMAP recommendation; `CONCERNS.md` lines 35–40 explicitly call this out as the lowest-friction frontend Vitest entry point. Aligns with existing `apps/live` and `packages/codemods` precedent. | ✓ |
| Skip Vitest entirely; cover TEST-19..22 transitively via Phase 6 E2E | Pushes 4 PRD-pinned tests onto the slowest layer; loses deterministic coverage of split / merge / hidden-update edge cases. | |
| Introduce Vitest to `apps/web` for direct store unit tests | Requires new harness in a previously untested app — explicit "do not invent test harnesses without asking" boundary in `CONCERNS.md`. | |

**Auto-selected:** Add Vitest to `@plane/utils` (recommended).
**Notes:** D-01 / D-01a / D-01b. Vitest version pinned to whatever `packages/codemods` currently uses (`^4.0.8`); plan-phase verifies catalog. Coverage provider not added — only need 4 PRD cases GREEN.

---

## TS wire-contract types (snake_case vs camelCase, throw vs return-union)

| Option | Description | Selected |
|--------|-------------|----------|
| Snake_case literal-union + interfaces in `@plane/types/src/issues/timeline-propagation.ts`; service throws on error | Matches existing `TIssue` snake_case (`start_date`, `target_date`, `updated_at`) and the existing `.catch((error) => { throw error?.response?.data })` convention in `apps/web/core/services/issue/issue.service.ts:248`. No new convention introduced. | ✓ |
| CamelCase types with a translation layer | New convention; would diverge from the rest of `@plane/types`. | |
| Discriminated `{ ok: true, ... } | { ok: false, ... }` union return | New convention; rest of the codebase uses thrown errors. | |

**Auto-selected:** Snake_case + throw on error (D-02 / D-02a / D-02b / D-09).

---

## Service client placement

| Option | Description | Selected |
|--------|-------------|----------|
| New file `packages/services/src/issue/timeline-propagation.service.ts` | ROADMAP-locked location; matches sibling service file shape (`sites-issue.service.ts`); barrel-exports cleanly. | ✓ |
| Extend `apps/web/core/services/issue/issue.service.ts::updateIssueDates` to also handle propagation | Mixes two contracts in one file; `updateIssueDates` predates the migration to `packages/services`; coupling unrelated callers to propagation regression risk. | |
| Inline the axios call in the MobX store | Bypasses `APIService` base class; loses centralized auth header / error normalization. | |

**Auto-selected:** Dedicated new file in `packages/services` (D-03 / D-03a). Existing `updateIssueDates` left untouched (D-03b).

---

## Pure preview helpers (algorithm & placement)

| Option | Description | Selected |
|--------|-------------|----------|
| Three pure functions in `packages/utils/src/timeline-propagation/preview.ts` (`computeLoadedPreview`, `diffHiddenUpdate`, `applyServerWorkItems`) | Plain JS in/out; testable in isolation; no MobX or axios imports. Mirrors Phase 2 algorithm shape but only walks LOADED adjacency (advisory). | ✓ |
| Embed preview logic inside the MobX store as private methods | Couples test harness to MobX; harder to keep purity invariants. | |
| Replicate the full Phase 2 algorithm on the client | Client doesn't have full graph; would mispredict and confuse users when server result diverges. | |

**Auto-selected:** Three pure functions, advisory loaded-graph walk only (D-04 / D-04a / D-04b / D-04c).

---

## MobX store surface

| Option | Description | Selected |
|--------|-------------|----------|
| Four-action surface (`beginPreview`, `updatePreview`, `commitWithServerResult`, `rollback`) + `previewById` / `lastError` / `lastResponse` / `hiddenUpdateCount` observables / computed | Mirrors drag-handler lifecycle (mousedown / mousemove / mouseup / cancel); state machine is small and obvious; survives stale calls. | ✓ |
| Single `applyMove(...)` action that does everything | Hides preview ↔ commit boundary the drag handler needs; harder to render a transient preview. | |
| Direct mutation of `IssuesTimeLineStore.blocksMap` for preview | Conflates preview state with canonical issues state; rollback becomes ambiguous; violates "server is authoritative" by letting client writes leak before commit. | |

**Auto-selected:** Four-action surface + separate preview map (D-05 / D-05a / D-05b / D-05c / D-05d / D-05e).

---

## Hidden-update count timing

| Option | Description | Selected |
|--------|-------------|----------|
| Snapshot `lastPreviewIds` at commit-success time, alongside `lastResponse`; `hiddenUpdateCount` is a `computed` over both | Survives the `previewById` clear; deterministic; testable via pure helper. | ✓ |
| Leave `previewById` non-empty after success | Preview overlay would persist into committed-state rendering — Phase 5 would need to manually clear; bug-prone. | |
| Store `hiddenUpdateCount` as a plain field set during commit | Loses the MobX-observable derivation; harder to reason about staleness. | |

**Auto-selected:** Snapshot + `computed` (D-05e).

---

## CE root-store wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Add `timelinePropagationStore` to `ITimelineStore` and instantiate in `TimeLineStore` constructor | Mirrors how `issuesTimeLineStore` and `modulesTimeLineStore` are already wired (`apps/web/ce/store/timeline/index.ts`). | ✓ |
| Wire on `RootStore` directly (sibling of `timelineStore`) | Inconsistent with sibling timeline stores; harder to find for future contributors. | |

**Auto-selected:** Compose under `TimeLineStore` (D-06 / D-06a).

---

## Loaded-graph data source

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 5 hands `edges` + `items_by_id` + `expected_updated_at` to `beginPreview(...)` as plain JSON | Keeps Phase 4 store testable as a black-box; isolates preview from MobX-tree timing. | ✓ |
| Phase 4 store reads `IssuesTimeLineStore.blocksMap` and the relation store directly | Couples Phase 4 testing to MobX hierarchy; harder to mock; harder to freeze the snapshot. | |

**Auto-selected:** Phase 5 supplies the snapshot (D-07 / D-07a).

---

## Concurrency & in-flight commits

| Option | Description | Selected |
|--------|-------------|----------|
| Share the in-flight promise on duplicate `commitWithServerResult` calls | Matches "one drag = one network call" UX; simple to implement. | ✓ |
| Throw on duplicate calls | Surprises consumers; would require try/catch in Phase 5 for an edge case. | |
| `AbortController`-based cancel-and-retry | Adds cancellation surface no consumer asked for; defer until needed. | |

**Auto-selected:** Share in-flight promise (D-08 / D-08a).

---

## Non-protocol errors (network 500, parse failures)

| Option | Description | Selected |
|--------|-------------|----------|
| Separate `unexpectedError: Error | null` observable, distinct from `lastError: TTimelinePropagationError | null` (the 7-code observable) | Keeps the wire-error observable clean; Phase 5 can render either with different UX. | ✓ |
| Synthesize a synthetic 8th code (e.g., `UNKNOWN`) and put it in `lastError` | Lies on the wire — server never sends `UNKNOWN`; misleads consumers reading the error code. | |
| Conflate with one of the 7 codes (e.g., `PERMISSION_DENIED`) | Misinforms the user. | |

**Auto-selected:** Separate observable (D-05c).

---

## Lint, build, deps

| Option | Description | Selected |
|--------|-------------|----------|
| No new OxLint warnings; match `vitest` version to `packages/codemods`; no turbo task addition | Stays inside ratcheting budgets; uses existing toolchain; minimum surface change. | ✓ |
| Bump `vitest` to a fresh major | Introduces churn unrelated to propagation. | |
| Add `test` task to `turbo.json` | Defer until CI needs it; package-local script suffices. | |

**Auto-selected:** Conservative defaults (D-10 / D-10a / D-10b).

---

## Claude's Discretion

The auto-mode chose the recommended option for every gray area above. Specific call-outs the user may want to revisit during plan-phase (also surfaced in CONTEXT.md "Claude's Discretion"):

- Vitest version pinning — match `packages/codemods` (`^4.0.8`) unless catalog differs.
- snake_case throughout types & store — matches existing `TIssue`; flag if a future style decision changes this.
- `lastError` / `lastResponse` as observables — chose yes for MobX consistency.
- `hiddenUpdateCount` snapshot timing — chose `lastPreviewIds` snapshot + computed.
- Synthetic store-only error code for non-protocol errors — chose separate `unexpectedError` observable, NOT a synthetic 8th code.
- In-flight commit re-entrancy — chose to share the promise.

## Deferred Ideas

(Captured in CONTEXT.md `<deferred>`. Highlights:)

- Migrating `apps/web/core/services/issue/issue.service.ts::updateIssueDates` into `packages/services` — out of phase scope.
- Vitest in `apps/web` itself — out of phase scope; rely on Phase 6 E2E for store coverage.
- `metadata: { cycle?, boundary_edge? }` on the wire error envelope — Phase 3 deferred; Phase 4 sticks to `{code, message}`.
- `AbortController`-based commit cancellation — defer until UX needs explicit cancel.
- Front-end `code → i18n key` mapping table — Phase 5 owns ERR-01..ERR-07.
- Telemetry on propagation outcomes — out of scope.
- `turbo.json` test pipeline integration for `@plane/utils` — defer until CI depends on it.
- Snake → camel translation layer — defer until a milestone-level style decision changes the convention.
- `IssueBulkUpdateDateEndpoint` cleanup follow-up — Phase 3 deferred; Phase 4 has no role.
