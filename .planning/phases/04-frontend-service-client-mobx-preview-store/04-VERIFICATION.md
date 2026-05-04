---
phase: 04-frontend-service-client-mobx-preview-store
verified: 2026-05-04T04:15:18Z
status: passed
score: 13/13 hard checks verified
overrides_applied: 0
resolved: 2026-05-04T04:25:00Z (REQUIREMENTS.md traceability updated inline — no code change required; gap was Plan 04-02 doc-drift only)
gaps:
  - truth: "Every Phase 4 requirement ID is marked Done in .planning/REQUIREMENTS.md"
    status: failed
    reason: |
      Plan 04-02 SUMMARY explicitly claims to clear FE-05, FE-07, FE-08, TEST-20
      ("Phase requirement IDs cleared"), and Hard Check 12 in the verification
      brief mandates that those four IDs MUST be marked
      `Done (Plan 04-XX, 2026-05-04)` (or for TEST-20, "Done … covered
      transitively …"). The traceability table in REQUIREMENTS.md was last
      touched by commit 98b54424a0 ("docs(04-01): complete Wave 1 …") — it was
      never updated after the Plan 04-02 wave landed. As a result the four IDs
      below remain `Pending` even though their implementation has shipped and
      passes verification on every other hard check (1–11, 13).
    artifacts:
      - path: ".planning/REQUIREMENTS.md"
        issue: "FE-05 line 180 still 'Pending (helper-side immutability shipped; store rollback Plan 04-02)' — must be 'Done (Plan 04-02, 2026-05-04 — TimelinePropagationStore failure path discards previewById and stores lastError; original schedule never touched on failure)'"
      - path: ".planning/REQUIREMENTS.md"
        issue: "FE-07 line 182 still 'Pending' — must be 'Done (Plan 04-02, 2026-05-04 — no confirmation flag / dialog seam; safe limit ≤100 enforced server-side per Phase 3 PROP-13)'"
      - path: ".planning/REQUIREMENTS.md"
        issue: "FE-08 line 183 still 'Pending' — must be 'Done (Plan 04-02, 2026-05-04 — dependency-creation drag files explicitly NOT touched; verified by git diff --exit-code on use-dependency-drag.ts / cycle-check.ts / date-check.ts / dependency-paths.tsx)'"
      - path: ".planning/REQUIREMENTS.md"
        issue: "TEST-20 line 212 still 'Pending (covered transitively by helper immutability + Plan 04-02 store rollback + Phase 6 E2E)' — must be 'Done (Plan 04-02, 2026-05-04 — covered transitively via D-04c immutability invariant + store rollback semantics + Phase 6 E2E TEST-24)'"
    missing:
      - "Update FE-05 row in .planning/REQUIREMENTS.md traceability table from 'Pending …' to 'Done (Plan 04-02, 2026-05-04 — …)'"
      - "Update FE-07 row from 'Pending' to 'Done (Plan 04-02, 2026-05-04 — no dialog seam; ≤100 limit server-side)'"
      - "Update FE-08 row from 'Pending' to 'Done (Plan 04-02, 2026-05-04 — inert dependency files unchanged)'"
      - "Update TEST-20 row from 'Pending …' to 'Done (Plan 04-02, 2026-05-04 — covered transitively via D-04c + store rollback + Phase 6 E2E TEST-24)'"
      - "Optionally adjust the Coverage summary block immediately below the table if it cites a specific Done count."
---

# Phase 4: Frontend Service Client & MobX Preview Store — Verification Report

**Phase Goal:** Add a typed `@plane/services` client method for the new endpoint, plus a MobX store layer that holds an advisory preview during drag, replaces preview state with the server response on success, fully rolls back on failure, and computes a hidden-update count when the server moved more work items than the loaded graph contained. Vitest harness decision is finalized in this phase: pure helper logic goes into `@plane/utils`. Full MobX store unit tests inside `apps/web` are deferred unless we introduce Vitest to web (NOT required by PRD).
**Verified:** 2026-05-04T04:15:18Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## 観測されたサマリー (Japanese narrative)

Phase 4 のコード成果物は、計画通り完全に実装されています。Hard Check 1〜11 および 13 — 型契約 `@plane/types`、サービスクライアント `@plane/services`、純粋ヘルパ `@plane/utils/timeline-propagation`、Vitest ハーネス、MobX ストア `TimelinePropagationStore`、CE ルート配線、inert 制約 (`use-dependency-drag.ts` 他 7 ファイル無変更)、Phase 3 バックエンド退行ガード (26 contract + 64 unit GREEN)、`apps/web` への Vitest 不導入 (D-01)、`/api/v1/` 接頭辞の不在、snake_case 一貫性、OxLint 予算 (38 / 11957) — 全て条件を満たしています。

唯一の不整合は **Hard Check 12: トレーサビリティ表の同期漏れ** です。`04-02-SUMMARY.md` は FE-05 / FE-07 / FE-08 / TEST-20 を「Phase requirement IDs cleared」と明記していますが、`.planning/REQUIREMENTS.md` の表はこの 4 行が `Pending` のまま残っています。最後の表更新コミット (`98b54424a0`) は Plan 04-01 完了時点であり、Plan 04-02 の commit (`d810b92105` / `888ff6c32b` / `0d63a964df`) では `REQUIREMENTS.md` に手が入っていません。

これは実装ギャップではなくドキュメントのドリフトですが、検証ブリーフの「every Phase 4 ID MUST be marked Done」要件に違反するため `gaps_found` 判定とします。修正は表の 4 行だけで完了します。

## Goal Achievement

### Observable Truths (per Hard Checks 1–13)

| #   | Hard Check                                                                                               | Status     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `packages/types/src/issues/timeline-propagation.ts` defines all 6 wire types verbatim per spec           | ✓ VERIFIED | File exists; lines 17–24 declare 7-element `TTimelinePropagationErrorCode` literal union exactly matching `DEPENDENCY_CYCLE \| PROJECT_BOUNDARY_EXCEEDED \| INCOMPLETE_SCHEDULE \| PROPAGATION_LIMIT_EXCEEDED \| SCHEDULE_CHANGED \| PERMISSION_DENIED \| INVALID_DATE_RANGE`; line 30 `TTimelinePropagationOperation = "move"`; lines 32–44 request has 8 snake_case fields; lines 54–59 response has the 4 required fields; lines 61–64 error has `code` + `message`. Re-export at `packages/types/src/index.ts:34`. `pnpm check:types` GREEN (cached). |
| 2   | `TimelinePropagationService` extends APIService, single `propagateMove`, correct URL & throw shape       | ✓ VERIFIED | File exists; line 24 `class TimelinePropagationService extends APIService`; lines 34–44 single `propagateMove` returning `Promise<TTimelinePropagationResponse>`; line 39 URL `/api/workspaces/${workspaceSlug}/projects/${projectId}/timeline-propagation/` — no `/v1/`; line 42 `throw error?.response?.data` (the body, not the envelope). Re-exported at `packages/services/src/issue/index.ts:8`.                                                                                                                                                    |
| 3   | Three pure helpers in `packages/utils/src/timeline-propagation/preview.ts`                               | ✓ VERIFIED | `computeLoadedPreview` (line 57, returns `Map`), `applyServerWorkItems` (line 194, returns new `Record<string, T>` via spread, immutable), `diffHiddenUpdate` (line 176, returns `number`). Barrel: `packages/utils/src/timeline-propagation/index.ts:7` exports `* from "./preview"`; `packages/utils/src/index.ts:38` exports `* from "./timeline-propagation"`.                                                                                                                                                                                        |
| 4   | Vitest harness installed in `@plane/utils`; ≥11 GREEN cases covering TEST-19 / 21 / 22                   | ✓ VERIFIED | `packages/utils/vitest.config.ts` (9 lines, node env, globals, include glob); `packages/utils/package.json` line 24 `"test": "vitest run"`, line 58 `"vitest": "^4.0.8"`. Test count: `grep -c "^  it("` returns 11 across 3 `describe` blocks. `pnpm --filter=@plane/utils test` → "11 passed (11)" in 793 ms (Vitest 4.0.15). TEST-19 covered by 5 cases (simple/chain/branch/incomplete/immutability — exceeds ≥3); TEST-21 by 3 cases; TEST-22 by 3 cases.                                                                                            |
| 5   | `TimelinePropagationStore` MobX surface complete                                                         | ✓ VERIFIED | All 6 observables, 1 computed, 4 actions, `_isProtocolError` discriminator on closed 7-code set (lines 329–344), in-flight promise cache (line 104), `rootStore.issue.issues.updateIssue` per server work_item inside outer `runInAction` (lines 280–284). `! grep "blocksMap\["` returns no matches → blocksMap NOT mutated directly.                                                                                                                                                                                                                    |
| 6   | `apps/web/ce/store/timeline/index.ts` extended; imports + 2 fields + 1 instantiation present             | ✓ VERIFIED | Lines 14–15 import `{ TimelinePropagationStore }` and `type { ITimelinePropagationStore }`; line 22 interface field; line 30 class field; line 38 `this.timelinePropagationStore = new TimelinePropagationStore(rootStore);`. Constructor sibling-store count = 5 (`grep -c '^    this\\.'` = 5).                                                                                                                                                                                                                                                         |
| 7   | `apps/web/ce/store/root.store.ts` UNCHANGED (D-06)                                                       | ✓ VERIFIED | `git log --oneline HEAD~10..HEAD -- apps/web/ce/store/root.store.ts` returns empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 8   | Inert constraint files (FE-08 / D-03b / D-05d / D-06) UNCHANGED across last 10 commits                   | ✓ VERIFIED | `git log --oneline HEAD~10..HEAD -- <7 paths>` returns empty for all of: `use-dependency-drag.ts`, `cycle-check.ts`, `date-check.ts`, `dependency-paths.tsx`, `core/services/issue/issue.service.ts`, `core/store/issue/helpers/base-issues.store.ts`, `ce/store/root.store.ts`.                                                                                                                                                                                                                                                                          |
| 9   | No Vitest in `apps/web` (D-01)                                                                           | ✓ VERIFIED | `find apps/web -maxdepth 2 -name vitest.config.ts` returns empty (exit 0, no output).                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 10  | Phase 3 backend regression: 26 contract + 64 unit tests GREEN                                            | ✓ VERIFIED | `pytest plane/tests/contract/app/test_timeline_propagation.py` → "26 passed, 26 warnings in 3.94s"; `pytest plane/tests/unit/services/timeline_propagation/` → "64 passed, 3 warnings in 1.30s" (in container `plane-api-1`).                                                                                                                                                                                                                                                                                                                             |
| 11  | Frontend tests + types + lint GREEN within budget                                                        | ✓ VERIFIED | `pnpm --filter=@plane/utils test` → 11/11 passed; `pnpm check:types --filter=@plane/types --filter=@plane/services --filter=@plane/utils --filter=web` → 14 successful, FULL TURBO; `pnpm check:lint --filter=...` → 4 successful, FULL TURBO, 1001 warnings (web) within budget 11957.                                                                                                                                                                                                                                                                   |
| 12  | Requirement traceability — FE-01/02/04/05/06/07/08 + TEST-19/20/21/22 all marked Done in REQUIREMENTS.md | ✗ FAILED   | Lines 180/182/183 still `Pending`/`Pending (…)` for FE-05/FE-07/FE-08; line 212 `TEST-20` still `Pending (…)`. The other Phase 4 IDs (FE-01/02/04/06, TEST-19/21/22) are correctly marked `Done (Plan 04-01, 2026-05-04)`. Phase 5 IDs (FE-03/09, ERR-01..08) and Phase 6 IDs (TEST-23/24) correctly remain `Pending`.                                                                                                                                                                                                                                    |
| 13  | OxLint budgets unchanged: `@plane/utils=38`, `apps/web=11957`                                            | ✓ VERIFIED | `grep "max-warnings" packages/utils/package.json apps/web/package.json` → `--max-warnings=38` and `--max-warnings=11957`. No raise.                                                                                                                                                                                                                                                                                                                                                                                                                       |

**Score:** 12/13 hard checks verified. The single FAILED truth is documentation drift, not implementation.

### Required Artifacts

| Artifact                                                            | Expected                                                                                      | Status     | Details                                                                                                                                            |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/types/src/issues/timeline-propagation.ts`                 | 6 wire type aliases, AGPL header, snake_case verbatim                                         | ✓ VERIFIED | 65 lines (≥25 min). All 6 type aliases present, doc-comments cite Phase 3 D-04. No camelCase.                                                      |
| `packages/services/src/issue/timeline-propagation.service.ts`       | Service class extending APIService, single method, correct URL, `error?.response?.data` throw | ✓ VERIFIED | 46 lines (≥25 min). URL string verified; throw shape verified; barrel-exported.                                                                    |
| `packages/utils/vitest.config.ts`                                   | Vitest harness file present                                                                   | ✓ VERIFIED | 9 lines (≥7 min). `node` env + `globals: true` + include glob.                                                                                     |
| `packages/utils/src/timeline-propagation/preview.ts`                | Three pure helpers, immutable, no direct date-fns imports                                     | ✓ VERIFIED | 209 lines (≥60 min). Uses `addDaysToDate` / `findTotalDaysInRange` / `renderFormattedPayloadDate` from `../datetime`; no `from "date-fns"` import. |
| `packages/utils/src/timeline-propagation/__tests__/preview.test.ts` | 11 tests covering TEST-19/21/22 ≥3/≥1/≥1                                                      | ✓ VERIFIED | 240 lines (≥60 min). 5 + 3 + 3 = 11 cases, all GREEN.                                                                                              |
| `packages/utils/src/timeline-propagation/index.ts`                  | Barrel re-export                                                                              | ✓ VERIFIED | 7 lines (≥5 min). Re-exports `./preview`.                                                                                                          |
| `apps/web/ce/store/timeline/timeline-propagation.store.ts`          | TimelinePropagationStore with full surface                                                    | ✓ VERIFIED | 345 lines (≥130 min). Class + interface + private discriminator. All MobX annotations correct.                                                     |
| `apps/web/ce/store/timeline/index.ts`                               | ITimelineStore + TimeLineStore extended with `timelinePropagationStore`                       | ✓ VERIFIED | 41 lines (≥36 min). 2 imports + 1 interface field + 1 class field + 1 instantiation = +5 lines.                                                    |

### Key Link Verification

| From                                                          | To                                                       | Via                                    | Status  | Details                                                                                                                                                                                                                              |
| ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/types/src/index.ts`                                 | `./issues/timeline-propagation`                          | `export *`                             | ✓ WIRED | Line 34: `export * from "./issues/timeline-propagation";`.                                                                                                                                                                           |
| `packages/services/src/issue/index.ts`                        | `./timeline-propagation.service`                         | `export *`                             | ✓ WIRED | Line 8: `export * from "./timeline-propagation.service";`.                                                                                                                                                                           |
| `packages/utils/src/index.ts`                                 | `./timeline-propagation`                                 | `export *`                             | ✓ WIRED | Line 38: `export * from "./timeline-propagation";`.                                                                                                                                                                                  |
| `packages/services/src/issue/timeline-propagation.service.ts` | `/api/workspaces/.../projects/.../timeline-propagation/` | `this.post(...)`                       | ✓ WIRED | Line 39 contains the exact template string per spec; no `/v1/` segment.                                                                                                                                                              |
| `apps/web/ce/store/timeline/timeline-propagation.store.ts`    | `@plane/services::TimelinePropagationService`            | named import                           | ✓ WIRED | Line 10: `import { TimelinePropagationService } from "@plane/services";` — used as service instance at line 125.                                                                                                                     |
| `apps/web/ce/store/timeline/timeline-propagation.store.ts`    | `@plane/utils` helpers                                   | named import                           | ✓ WIRED | Line 16: `import { computeLoadedPreview, diffHiddenUpdate, type LoadedGraphEdge, type LoadedWorkItem } from "@plane/utils";`. Note: only 2 of the 3 helpers (`computeLoadedPreview`, `diffHiddenUpdate`) are imported — see "Notes". |
| `apps/web/ce/store/timeline/timeline-propagation.store.ts`    | `rootStore.issue.issues.updateIssue`                     | per-id call inside outer `runInAction` | ✓ WIRED | Line 280: `this.rootStore.issue.issues.updateIssue(wi.id, { start_date, target_date, updated_at })` inside the success-path `runInAction` block (lines 271–286).                                                                     |
| `apps/web/ce/store/timeline/index.ts`                         | `./timeline-propagation.store`                           | named imports + instantiation          | ✓ WIRED | Lines 14–15 imports; line 38 instantiation.                                                                                                                                                                                          |

### Data-Flow Trace (Level 4)

| Artifact                                                 | Data Variable                             | Source                                                                                                                                     | Produces Real Data | Status    |
| -------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | --------- |
| `TimelinePropagationStore.previewById`                   | `previewById: Map`                        | `updatePreview` → `computeLoadedPreview(snap.edges, snap.items_by_id, ...)` → real `Map` produced from snapshot input                      | Yes                | ✓ FLOWING |
| `TimelinePropagationStore.lastResponse / lastPreviewIds` | observables                               | `_doCommit` success branch: `await this.service.propagateMove(...)` returns `TTimelinePropagationResponse` → assigned in outer runInAction | Yes                | ✓ FLOWING |
| `TimelinePropagationStore.hiddenUpdateCount`             | computed                                  | `diffHiddenUpdate(lastResponse.work_items, lastPreviewIds)` — guarded by null check, returns 0 only when not yet committed (correct)       | Yes                | ✓ FLOWING |
| Issues map (canonical write target)                      | `rootStore.issue.issues.issuesMap[wi.id]` | per-id `rootStore.issue.issues.updateIssue(wi.id, { start_date, target_date, updated_at })` driven by server `work_items[]`                | Yes                | ✓ FLOWING |

(Phase 4 has no UI rendering by design — Phase 5 owns rendering. Data-flow verification confirms the store's wired pipes carry real server data, not stubs.)

### Behavioral Spot-Checks

| Behavior                          | Command                                                                                              | Result                                                         | Status |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------ |
| `@plane/utils` Vitest suite runs  | `pnpm --filter=@plane/utils test`                                                                    | "Test Files 1 passed (1) / Tests 11 passed (11)"               | ✓ PASS |
| Cross-package types compile       | `pnpm check:types --filter=@plane/types --filter=@plane/services --filter=@plane/utils --filter=web` | "14 successful, FULL TURBO"                                    | ✓ PASS |
| Cross-package lint within budgets | `pnpm check:lint --filter=@plane/types --filter=@plane/services --filter=@plane/utils --filter=web`  | "4 successful, FULL TURBO" (1001 warnings web vs 11957 budget) | ✓ PASS |
| Phase 3 contract regression       | `pytest plane/tests/contract/app/test_timeline_propagation.py --reuse-db --nomigrations`             | "26 passed, 26 warnings in 3.94s"                              | ✓ PASS |
| Phase 3 unit regression           | `pytest plane/tests/unit/services/timeline_propagation/ --reuse-db --nomigrations`                   | "64 passed, 3 warnings in 1.30s"                               | ✓ PASS |
| Inert files stayed inert          | `git log --oneline HEAD~10..HEAD -- <7 forbidden paths>`                                             | empty output                                                   | ✓ PASS |
| No Vitest leaked into `apps/web`  | `find apps/web -maxdepth 2 -name vitest.config.ts`                                                   | empty output                                                   | ✓ PASS |

### Requirements Coverage (Phase 4 IDs)

| Requirement | Source Plan | Description                                                                 | Status                                      | Evidence                                                                                                                                                                                                                                    |
| ----------- | ----------- | --------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FE-01       | 04-01       | Loaded-graph preview computed for dragged work item + loaded successors     | ✓ SATISFIED (table: Done)                   | `computeLoadedPreview` in `preview.ts`; pinned by 5 Vitest cases.                                                                                                                                                                           |
| FE-02       | 04-01       | Preview is advisory, non-binding — server is authoritative                  | ✓ SATISFIED (table: Done)                   | Helpers immutable (3 immutability tests); store discards previewById on commit/failure.                                                                                                                                                     |
| FE-04       | 04-01       | On success, store applies server work_items to issues map                   | ✓ SATISFIED (table: Done)                   | `applyServerWorkItems` helper + store success branch calls `rootStore.issue.issues.updateIssue` per work_item.                                                                                                                              |
| FE-05       | 04-02       | On failure, store discards preview entirely; original schedule untouched    | ⚠️ IMPLEMENTED, table: Pending              | Store `_doCommit` catch branch clears `previewById`, sets `isPreviewActive=false`, snapshot=null, sets `lastError` or `unexpectedError` — and crucially does NOT call `updateIssue`. **REQUIREMENTS.md row 180 still 'Pending' — see GAP**. |
| FE-06       | 04-01       | Hidden-update notification value exposed when server moved more than loaded | ✓ SATISFIED (table: Done)                   | `diffHiddenUpdate` helper + computed `hiddenUpdateCount`; pinned by 3 TEST-22 cases.                                                                                                                                                        |
| FE-07       | 04-02       | No confirmation dialog inside safe limit                                    | ⚠️ IMPLEMENTED, table: Pending              | Store has no confirmation flag/dialog seam; commit fires unconditionally; ≤100 limit enforced server-side per Phase 3 PROP-13. **REQUIREMENTS.md row 182 still 'Pending' — see GAP**.                                                       |
| FE-08       | 04-02       | Dependency-creation drag handlers + cycle/date checks NOT touched           | ⚠️ IMPLEMENTED, table: Pending              | `git log` confirms 4 dependency files unchanged in last 10 commits. **REQUIREMENTS.md row 183 still 'Pending' — see GAP**.                                                                                                                  |
| TEST-19     | 04-01       | Loaded-graph preview helper covered by simple/chain/branch tests            | ✓ SATISFIED (table: Done)                   | 5 cases in `preview.test.ts`; described as "5 GREEN cases: simple, chain, branch, incomplete, immutability".                                                                                                                                |
| TEST-20     | 04-02       | Failure → preview rollback covered                                          | ⚠️ IMPLEMENTED transitively, table: Pending | Per 04-02 SUMMARY: helper-immutability invariants + store `rollback()`+failure branch by inspection + Phase 6 E2E TEST-24. **REQUIREMENTS.md row 212 still 'Pending' — see GAP**.                                                           |
| TEST-21     | 04-01       | Server-replace preview covered                                              | ✓ SATISFIED (table: Done)                   | 3 cases in `preview.test.ts` for `applyServerWorkItems`.                                                                                                                                                                                    |
| TEST-22     | 04-01       | Hidden-update count covered                                                 | ✓ SATISFIED (table: Done)                   | 3 cases in `preview.test.ts` for `diffHiddenUpdate`.                                                                                                                                                                                        |

### Phase 5 / Phase 6 Requirements (must remain Pending)

| Requirement      | Phase | Table Status | Note                                              |
| ---------------- | ----- | ------------ | ------------------------------------------------- |
| FE-03, FE-09     | 5     | Pending ✓    | Correctly Pending — Phase 5 drag handler swap.    |
| ERR-01..ERR-08   | 5     | Pending ✓    | Correctly Pending — Phase 5 i18n + toast surface. |
| TEST-23, TEST-24 | 6     | Pending ✓    | Correctly Pending — Phase 6 Playwright E2E.       |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |

(None. Targeted greps for `TODO`, `FIXME`, `placeholder`, `not implemented`, `console.log`, hardcoded empty `=\s*\[\]`, `oxlint-disable`, `/api/v1/`, camelCase wire fields all returned no matches in the 8 Phase 4 artifact files. The Vitest suite shows no `.skip` / `.todo` markers.)

### Notes

- The store imports only **two** of the three `@plane/utils` helpers (`computeLoadedPreview`, `diffHiddenUpdate`); `applyServerWorkItems` is intentionally NOT used because the store writes through `rootStore.issue.issues.updateIssue` per row (D-05d) instead of replacing the issues map wholesale. This matches the plan's design — `applyServerWorkItems` exists as a pure projection for tests + future use, but the canonical write surface is the existing per-issue mutator. The Plan 04-02 frontmatter's `key_links` regex `(applyServerWorkItems|computeLoadedPreview|diffHiddenUpdate)` only requires one of the three; satisfied.
- The closed-set `_isProtocolError` discriminator (lines 329–344 of the store) validates the thrown object's `code` against exactly the same 7-element set as the type literal-union, mitigating spoofing of fake protocol codes (T-04-02-02 in the threat model).
- Inert constraints honored via `git log` rather than `git diff --exit-code HEAD~N HEAD` because the working tree contains uncommitted changes outside Phase 4 scope (e.g. `CONTEXT.md`, `docs/`, supplementary E2E plans). The `git log` query confirms none of the 7 forbidden files were touched by any of the 5 Phase 4 commits.

### Human Verification Required

None. Phase 4 ships zero UI behavior; all observable behavior is testable via Vitest, type-check, lint, and backend regression — all run automatically and GREEN.

### Gaps Summary

**One gap, documentation-only:** REQUIREMENTS.md traceability table was not updated after Plan 04-02 landed. Four IDs (FE-05, FE-07, FE-08, TEST-20) that the SUMMARY explicitly claims to clear remain marked `Pending`. Implementation passes all behavioral and structural checks; the gap is purely a missing table edit. Closing this gap requires changing 4 lines (table rows 180, 182, 183, 212) — no code changes, no re-test required.

After the table edit, Phase 4 will be fully `passed`. Phase 5 (drag handler integration + ERR-01..08 + FE-03 + FE-09) and Phase 6 (E2E TEST-23/24) remain correctly scoped and unblocked.

---

_Verified: 2026-05-04T04:15:18Z_
_Verifier: Claude (gsd-verifier, Opus 4.7 1M context)_
