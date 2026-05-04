---
phase: 06-end-to-end-coverage-polish
verified: 2026-05-04T12:30:00Z
status: human_needed
score: 8/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "pnpm --filter=web exec playwright test --config=e2e/playwright.config.ts --grep 'TEST-23'"
    expected: "1 passed, 0 failed (network 200 + DOM tgt-shift + DB persistence all assert)"
    why_human: "Requires docker-compose-local.yml + pnpm dev running; not executable in static CI"
  - test: "pnpm --filter=web exec playwright test --config=e2e/playwright.config.ts --grep 'TEST-24'"
    expected: "1 passed, 0 failed (422 INCOMPLETE_SCHEDULE + toast text + DOM rollback ±2px)"
    why_human: "Browser runtime with live API stack required; toast assertion fails if UI locale != en"
  - test: "pnpm --filter=web test:e2e (run twice consecutively)"
    expected: ">=5 passed, 0 failed on both runs (idempotency guard)"
    why_human: "Full suite requires live stack; teardown cascade-delete verification needs DB"
  - test: "Confirm REQUIREMENTS.md TEST-23 and TEST-24 are updated to [x] with commit references"
    expected: "Both lines show [x] with Plan 06-02 + commit hashes 73e537c84c / 42655f4c7e"
    why_human: "Plan 06-02 explicitly deferred REQUIREMENTS.md update to /gsd-verify-work — requires human to edit and commit"
---

# Phase 6: End-to-End Coverage & Polish Verification Report

**Phase Goal:** Extend the existing Playwright suite with a happy-path test (drag -> dependent work item moves -> schedule persists) and a failure-path test (drag -> server rejects with a known code -> UI returns to original schedule + message visible). Done = `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` exists with at least the two PRD-required cases (TEST-23, TEST-24), reuses existing fixtures, and the suite passes locally against `docker-compose-local.yml` + `pnpm dev`.
**Verified:** 2026-05-04T12:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                            | Status      | Evidence                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | `timeline-dependency-propagation.spec.ts` exists with `test.describe("timeline dependency propagation")`         | VERIFIED    | File at `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` line 16; grep returns 1                                |
| 2   | TEST-23 test is active (not skipped) and tagged `[TEST-23]`                                                      | VERIFIED    | `grep -c '^  test.*\[TEST-23\]'` returns 2 occurrences (tag in test name); 2 active `test(` calls confirmed                 |
| 3   | TEST-24 test is active (not skipped) and tagged `[TEST-24]`                                                      | VERIFIED    | `grep -c '\[TEST-24\]'` returns 1; active `test("#2 [TEST-24]...")` confirmed at line 86                                    |
| 4   | TEST-23 contains `waitForResponse` on `/timeline-propagation/` + status 200 + `total_updated_count`              | VERIFIED    | Lines 36-39: `waitForResponse` filter on `/timeline-propagation/`; `toBe(200)` at line 48; `total_updated_count >= 2` at 55 |
| 5   | TEST-23 contains `api.getIssue(tgt.id)` for persistence assertion                                                | VERIFIED    | Line 81: `const persisted = await api.getIssue(tgt.id);` followed by `start_date`/`target_date` assertions                  |
| 6   | TEST-23 contains `expect.poll` for MobX reactivity flush (DOM assertion)                                         | VERIFIED    | Lines 66-73: two `expect.poll` blocks for src and tgt block position assertions                                             |
| 7   | TEST-24 uses `api.clearIssueDate(tgt.id, "target_date")` AFTER `propagationTimeline` setup                       | VERIFIED    | Line 98: `await api.clearIssueDate(tgt.id, "target_date")` appears inside test body after fixture injection                 |
| 8   | TEST-24 asserts status 422 and `code === "INCOMPLETE_SCHEDULE"`                                                  | VERIFIED    | Lines 119-121: `toBe(422)` and `toMatchObject({ code: "INCOMPLETE_SCHEDULE" })`                                             |
| 9   | TEST-24 asserts toast `"Schedule update failed"` and `"A dependent work item is missing start or target dates."` | VERIFIED    | Lines 127-128: both `getByText` assertions with literal en i18n strings                                                     |
| 10  | TEST-24 asserts ±2px rollback for both src and tgt blocks via `expect.poll`                                      | VERIFIED    | Lines 133-144: 4 `expect.poll` calls (2 per block: `>=lower`, `<=upper`); `preDragBoxTgt` referenced 5 times                |
| 11  | Wave 1 smoke tests converted to `test.skip`                                                                      | VERIFIED    | `grep -c 'test\.skip'` returns 5; no active smoke tests remain                                                              |
| 12  | TEST-23 / TEST-24 pass locally with live stack (runtime)                                                         | ? UNCERTAIN | Docker stack not running at verification time; deferred to human verification (per Phase 5/6 D-11a approval)                |
| 13  | REQUIREMENTS.md TEST-23 and TEST-24 marked `[x]`                                                                 | FAILED      | Both still show `[ ]` Pending; Plan 06-02 explicitly deferred to `/gsd-verify-work` — not yet updated                       |

**Score:** 10/13 truths verified statically (items 12 and 13 require human action; items 1-11 are VERIFIED)

---

### Required Artifacts

| Artifact                                                     | Expected                                             | Status   | Details                                                                                |
| ------------------------------------------------------------ | ---------------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` | TEST-23 + TEST-24 active; smokes skipped             | VERIFIED | 2 active tests, 5 skipped (test.skip), proper describe block                           |
| `apps/web/e2e/fixtures/api.ts`                               | `createIssueRelation`, `clearIssueDate`, `getIssue`  | VERIFIED | All 3 methods present; typed, no `any`; existing `createIssue`/`deleteIssue` untouched |
| `apps/web/e2e/fixtures/test-fixtures.ts`                     | `propagationPair`, `propagationTimeline` fixtures    | VERIFIED | Both fixtures registered in `Fixtures` type and `base.extend`                          |
| `apps/web/e2e/pages/timeline.page.ts`                        | `dragBlockBy`, `getBlockBox`, `getDayWidthFromBlock` | VERIFIED | All 3 methods present; existing `dragRightTo`/`dragLeftTo` byte-identical              |
| `apps/web/e2e/README.md`                                     | `en` locale precondition note (D-08a)                | VERIFIED | Line 50 contains the note referencing TEST-24 and D-04b/D-08a                          |

---

### Key Link Verification

| From                                                          | To                                              | Via                                                                        | Status   | Details                                                                                    |
| ------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| propagation spec → test-fixtures.ts                           | `propagationPair` / `propagationTimeline`       | `import { test } from '../fixtures/test-fixtures'` + fixture destructuring | VERIFIED | Import at line 1; `propagationPair`/`propagationTimeline` in test signature                |
| TEST-23 network assertion → `/timeline-propagation/` endpoint | Phase 3 view                                    | `page.waitForResponse` URL filter                                          | VERIFIED | Filter string `"/timeline-propagation/"` at lines 37, 109                                  |
| TEST-23 persistence → `api.getIssue`                          | `apps/web/e2e/fixtures/api.ts (getIssue)`       | direct call                                                                | VERIFIED | `api.getIssue(tgt.id)` at line 81; fixture destructures `api`                              |
| TEST-24 toast → i18n strings                                  | `packages/i18n/src/locales/en/translations.ts`  | literal `getByText` strings                                                | VERIFIED | `"Schedule update failed"` and `"A dependent work item is missing start or target dates."` |
| TEST-24 setup → `api.clearIssueDate`                          | `apps/web/e2e/fixtures/api.ts (clearIssueDate)` | AFTER propagationTimeline render                                           | VERIFIED | Call at line 98; fixture renders at test setup before test body executes                   |
| `propagationPair` fixture → `api.createIssueRelation`         | blocking relation seeding                       | fixture seeding hook                                                       | VERIFIED | `api.createIssueRelation(src.id, tgt.id, "blocking")` at test-fixtures.ts line 65          |

---

### Data-Flow Trace (Level 4)

Level 4 data-flow tracing is deferred: E2E spec tests require a live browser + API stack. The static structure demonstrates correct wiring:

- TEST-23: `dragBlockBy` -> `waitForResponse(/timeline-propagation/)` -> response body -> `api.getIssue(tgt.id)` (DB read)
- TEST-24: `clearIssueDate(tgt.id)` -> `dragBlockBy` -> `waitForResponse` 422 -> `getByText(toast)` -> `expect.poll(blockBox rollback)`

Both data flows are complete in code. Runtime verification requires the live stack (human_verification items 1 and 2).

---

### Behavioral Spot-Checks

Step 7b SKIPPED — Playwright tests require a running browser + `docker-compose-local.yml` + `pnpm dev`. No runnable entry points available for static spot-check. This is the expected and approved gap per Phase 5 / Phase 6 D-11a.

---

### Requirements Coverage

| Requirement | Source Plan | Description                                            | Status      | Evidence                                                              |
| ----------- | ----------- | ------------------------------------------------------ | ----------- | --------------------------------------------------------------------- |
| TEST-23     | 06-02       | E2E happy path: drag -> dependent WI moves -> persists | ? UNCERTAIN | Spec file contains the test; runtime result awaits human verification |
| TEST-24     | 06-02       | E2E failure path: drag -> reject -> UI rolls back      | ? UNCERTAIN | Spec file contains the test; runtime result awaits human verification |

**REQUIREMENTS.md status:** Both TEST-23 and TEST-24 remain `[ ]` Pending in REQUIREMENTS.md. Plan 06-02 explicitly deferred this update to `/gsd-verify-work`. This is a documentation gap, not an implementation gap — the code is complete.

---

### Anti-Patterns Found

| File                                                         | Line | Pattern                          | Severity | Impact                                                                                                                               |
| ------------------------------------------------------------ | ---- | -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` | 146  | `void dayWidth` to suppress lint | INFO     | Intentional; `dayWidth` computed for diagnostic value but unused in TEST-24 rollback assertions. Not a stub — documented in SUMMARY. |

No blockers. No stub implementations. No hardcoded mock returns. No empty handlers.

---

### Human Verification Required

#### 1. TEST-23 Runtime Pass

**Test:** Run `pnpm --filter=web exec playwright test --config=e2e/playwright.config.ts --grep "TEST-23"` against a live `docker-compose-local.yml + pnpm dev` stack with `en` UI locale.
**Expected:** 1 passed — network assertion `status=200 + total_updated_count>=2`, DOM assertion `tgt.x shifts rightward by >= dayWidth-2px`, persistence `api.getIssue(tgt.id).start_date === serverTgt.start_date`.
**Why human:** Requires running Chromium browser + live Django API + live pnpm dev server.

#### 2. TEST-24 Runtime Pass

**Test:** Run `pnpm --filter=web exec playwright test --config=e2e/playwright.config.ts --grep "TEST-24"` with `en` UI locale set in the test workspace.
**Expected:** 1 passed — network assertion `status=422, body.code="INCOMPLETE_SCHEDULE"`, toast `getByText("Schedule update failed")` and `getByText("A dependent work item is missing start or target dates.")` visible, DOM rollback both blocks within ±2px.
**Why human:** Browser runtime; toast assertion is locale-sensitive (`ja` will fail with wrong strings).

#### 3. Full Suite Idempotency (Regression Guard)

**Test:** Run `pnpm --filter=web test:e2e` twice consecutively.
**Expected:** Both runs: >=5 passed (3 existing + TEST-23 + TEST-24), 0 failed, same count on run 2.
**Why human:** Full browser suite; teardown cascade-delete correctness requires live DB.

#### 4. REQUIREMENTS.md TEST-23 + TEST-24 Checkbox Update

**Test:** Edit `.planning/REQUIREMENTS.md` to flip TEST-23 and TEST-24 from `[ ]` to `[x]` with Plan 06-02 + commit references (`73e537c84c` for TEST-23, `42655f4c7e` for TEST-24). Then commit.
**Expected:** Both checkboxes show `[x]` with phase/commit references matching the traceability table.
**Why human:** Plan 06-02 explicitly documented this as `/gsd-verify-work` responsibility. One edit + commit required.

---

### Dimension Scores

| Dimension                                                   | Score    | Notes                                                                                                               |
| ----------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| 1. Goal achievement (spec structure + test content)         | 9/10     | Spec exists with proper 3-tier assertions; runtime pass deferred                                                    |
| 2. Requirement coverage (TEST-23/24 tags + REQUIREMENTS.md) | 6/10     | Tags in test names verified; REQUIREMENTS.md still `Pending` (known gap)                                            |
| 3. Spec implementation correctness (grep audit)             | 10/10    | All 15 content patterns verified present                                                                            |
| 4. Fixture / POM / Helper additions (typed, non-any)        | 10/10    | All 3 api helpers + 2 fixtures + 3 POM methods present; no `any` injections                                         |
| 5. Production code untouched                                | 10/10    | `git diff ebb774c986..HEAD -- apps/web/core apps/web/ce apps/api packages` = 0 lines                                |
| 6. Regression guard intact                                  | 10/10    | 0 diff on `timeline-dependency-drag.spec.ts`, `playwright.config.ts`, `auth.setup.ts`, `env.ts`                     |
| 7. Static gates pass                                        | 10/10    | OxLint 995/11957; TypeScript 0 errors                                                                               |
| 8. Documentation correctness                                | 8/10     | ROADMAP `[x]` + progress table correct; STATE.md `verifying`; REQUIREMENTS.md TEST-23/24 still `Pending` (deferred) |
| 9. Playwright tests can be RUN (deferred)                   | DEFERRED | Approved gap per D-11a; human items 1-3 above                                                                       |
| 10. Smoke tests handled                                     | 10/10    | 5 `test.skip` confirmed; 0 active smoke tests; no suite count confusion                                             |

---

### Gaps Summary

**Gap: REQUIREMENTS.md TEST-23 and TEST-24 not updated**

Plan 06-02 explicitly documented: "REQUIREMENTS.md TEST-23 + TEST-24 ready to flip to checkmark at `/gsd-verify-work` (Plan 06-02 does NOT modify REQUIREMENTS.md — that is the verify command's responsibility)." This is a planned deferred action, not an implementation failure. Both test implementations are complete and correctly structured. Human action required: edit REQUIREMENTS.md to mark `[x]` and commit.

---

## Summary

**Phase 6 goal is achieved at the static / structural level.** The deliverable `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` exists with both TEST-23 (3-tier happy-path: network 200 + DOM shift + DB persistence) and TEST-24 (3-tier failure-path: 422 + toast + DOM rollback ±2px) as active, fully wired tests. All fixture additions (`createIssueRelation`, `clearIssueDate`, `getIssue`, `propagationPair`, `propagationTimeline`, `dragBlockBy`, `getBlockBox`, `getDayWidthFromBlock`) are present and typed. Zero production code changed. Regression guard files byte-identical. OxLint 995/11957 (budget 11957). TypeScript clean.

**Two items require human action before final PASSED status:**

1. Run the Playwright suite against the live stack to confirm TEST-23 and TEST-24 pass at runtime.
2. Update REQUIREMENTS.md TEST-23 and TEST-24 from `[ ]` to `[x]` with commit references.

---

_Verified: 2026-05-04T12:30:00Z_
_Verifier: Claude (gsd-verifier)_
