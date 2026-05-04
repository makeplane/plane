# Phase 6: End-to-End Coverage & Polish - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning
**Mode:** `--auto` (all gray areas auto-resolved with recommended defaults; user can revisit any D-NN during plan-phase or before sign-off)

<domain>
## Phase Boundary

Lock the milestone-final E2E gate for the Plane Timeline propagation feature: extend the **existing** Playwright suite at `apps/web/e2e/` with a new `timeline-dependency-propagation.spec.ts` containing **TEST-23** (happy path: drag predecessor → loaded successor moves → schedule persists end-to-end) and **TEST-24** (failure path: drag triggers a known protocol error → UI snaps back to original schedule + the user-readable error toast appears). Reuse `auth.setup.ts`, `fixtures/api.ts`, `fixtures/test-fixtures.ts`, `pages/timeline.page.ts` patterns verbatim; add only the helpers Phase 6 actually needs. Suite passes locally against `docker-compose-local.yml` + `pnpm dev`.

This is the **last** milestone phase. After this phase ships, the milestone is complete (Phases 1–5 already shipped — see ROADMAP.md and STATE.md).

**In scope (Phase 6 only):**

- NEW: `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` — `test.describe("timeline dependency propagation")` with at least the two PRD-required cases (TEST-23, TEST-24).
- UPDATE: `apps/web/e2e/pages/timeline.page.ts` — add block-body move-drag helpers (`dragBlockBy(issueId, deltaDays)`, `getBlockBox(issueId)`). The existing `dragRightTo` / `dragLeftTo` (handle drag, used by Phase 1's relation-creation specs) stay byte-identical.
- UPDATE: `apps/web/e2e/fixtures/api.ts` — add the helpers Phase 6 needs:
  - `createIssueRelation(srcId, tgtId, type = "blocking")` — TEST-23 setup. (Deliberately omitted in the prior dependency-creation E2E because relation creation **was** the test target; here it's only setup so creating it via API is correct.)
  - `clearIssueDate(issueId, field: "start_date" | "target_date")` — TEST-24 trigger for `INCOMPLETE_SCHEDULE`.
  - `getIssue(issueId)` — TEST-23 persistence assertion via API re-fetch (cited in the original Task 7 helper list as "for debug"; Phase 6 promotes it from debug to spec asset).
- UPDATE: `apps/web/e2e/fixtures/test-fixtures.ts` (small) — add an optional `propagationPair` fixture that builds on top of `issuePair` and creates a `blocking` relation between `src → tgt` before handing the pair to the test, with cascade-on-cleanup. **OR** keep relation creation inline in each spec body. D-06 below picks one and locks it.
- DO NOT TOUCH: `apps/web/e2e/specs/timeline-dependency-drag.spec.ts` (the existing relation-creation #1/#2/#3 specs — regression guard). They MUST keep passing.
- DO NOT TOUCH: `playwright.config.ts`, `auth.setup.ts`, the existing `dragRightTo` / `dragLeftTo` POM methods, or any prod code in `apps/web/core/` / `apps/web/ce/`. Phase 5 already shipped the production-side wiring; Phase 6 is **pure E2E coverage**.
- DO NOT TOUCH: any `.env.e2e.example` change beyond what already ships. Phase 6 introduces zero new env vars (the existing workspace/project config is sufficient).

**Out of scope (deferred to backlog or other workstreams):**

- CI integration (GitHub Actions, etc.) — explicitly deferred per `docs/timeline-e2e-test-environment.md` §4.5 and ROADMAP.md Phase 6 success criterion 5.
- Coverage of the remaining 6 error codes beyond the one chosen for TEST-24 (D-04 picks one primary code; the rest stay manually smoke-tested per Phase 5 D-11a).
- Drag chain / branch / merge propagation E2E coverage (TEST-02..TEST-09 are already pinned at the Python unit / Vitest helper level in Phases 1–4; the E2E gate observes the simplest representative chain, not the full algorithmic surface).
- Resize-handle propagation regression — out of milestone scope (PROP-18: move-only).
- Module / Cycle / Project Gantt E2E — Phase 5 D-01c / D-03b kept those on the bulk-update path; Phase 6 likewise tests only the Issue Gantt route.
- Hidden-update notification E2E coverage — Phase 4 TEST-22 already proves it at the helper layer; running it E2E would require pre-loading 100+ items past the loaded subset, expensive to seed and brittle. Captured as deferred idea.
- Visual regression / screenshot diff — Plane has no screenshot harness; not introducing one here.
- Performance / latency assertions — no SLA in PRD; `page.waitForResponse` timeout (10s default in existing specs) is the only timing guard.
- New i18n keys / new toast surfaces — Phase 5 shipped the message catalog; Phase 6 only **reads** the en text already in `packages/i18n/src/locales/en/translations.ts:2766-2783`.

</domain>

<decisions>
## Implementation Decisions

### Spec layout (the headline decision)

- **D-01:** Add a **single new spec file** `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` with **`test.describe("timeline dependency propagation")`** holding both TEST-23 (happy) and TEST-24 (failure) tests. Do **NOT** add them to `timeline-dependency-drag.spec.ts` — that file is scoped to relation-creation regression. Two file = two concerns; the existing 3 specs are the regression guard, the new 2 specs are the propagation gate.
- **D-01a:** File naming follows the existing convention `timeline-<feature>.spec.ts` (matches `timeline-dependency-drag.spec.ts`). The describe-block label `"timeline dependency propagation"` matches Phase 5's domain language ("Dependency Schedule Propagation" — keep `propagation` in the test ID for searchability).
- **D-01b:** Test naming `#1 happy path: ...` / `#2 failure path: ...` mirrors `#1`/`#2`/`#3` numbering already used in `timeline-dependency-drag.spec.ts`. The spec-file scoping (one describe per file) means the numbering restarts at #1; this is consistent with how the existing file numbered its 3 tests.

### Failure-code selection for TEST-24

- **D-02:** **Use `INCOMPLETE_SCHEDULE` as the primary failure code for TEST-24** (recommended in ROADMAP.md Phase 6 §Risks/open questions). Trigger: clear `target_date` on the successor (`tgt`) via API immediately before the drag, so the server's queryset sees a successor missing `target_date` when propagation tries to walk it. The server's Phase 2 algorithm returns `INCOMPLETE_SCHEDULE` (per `errors.py` + Phase 3 `STATUS_BY_CODE` → HTTP 422), the failure envelope `{code: "INCOMPLETE_SCHEDULE", message: "..."}` flows back, Phase 4's store routes it to `lastError`, Phase 5's `BaseGanttRoot.updateBlockDates` failure branch fires `showPropagationErrorToast("INCOMPLETE_SCHEDULE", t)`, and the preview rolls back via `previewById.clear()`. The toast text matches `packages/i18n/src/locales/en/translations.ts:2772` ("A dependent work item is missing start or target dates.").
- **D-02a:** **Why this code, not the alternatives:**
  - `DEPENDENCY_CYCLE` requires creating a 3-way cycle via API, which the deliberately-symmetric `IssueRelation` mirror logic makes brittle to seed (need src→tgt + tgt→src + an existing third node to close the loop).
  - `PROJECT_BOUNDARY_EXCEEDED` requires a second project, conflicts with the `E2E_PROJECT_ID` single-project assumption (env.ts) and with same-project setup expectations.
  - `PROPAGATION_LIMIT_EXCEEDED` needs 100+ chained issues (slow to seed, slow to render, slow to drag in CI/dev).
  - `SCHEDULE_CHANGED` requires racing a parallel `updated_at` mutation between mousedown-snapshot and mouseup-commit. Possible (D-04b documents the recipe) but timing-sensitive and prone to flake without a careful `Promise` barrier — keep as a **secondary deferred idea** (see §Deferred Ideas).
  - `PERMISSION_DENIED` requires a guest-role session, which means a second auth.setup project + second storageState — bigger infra change than this milestone wants.
  - `INVALID_DATE_RANGE` is normally **client-side prevented** (the drag UI quantizes to dayWidth and won't ever submit a target_date earlier than start_date through normal interaction), so triggering it via E2E requires bypassing the UI to submit reversed dates — out of band, doesn't represent a real user flow.
  - `INCOMPLETE_SCHEDULE` is the **only** code reliably triggerable from a single drag on a single same-project blocking pair via a one-line API mutation between setup and drag. Locking it.
- **D-02b:** TEST-24 asserts on **the wire code** (intercepted via `page.waitForResponse`), the toast message text (i18n string from `packages/i18n/src/locales/en/translations.ts:2769,2772`), and the **DOM position rollback** of both blocks (src + tgt return to their pre-drag bounding boxes — see D-05 for the geometry contract). Three assertions; if any fail, the test fails.

### Block-body drag mechanics (POM additions)

- **D-03:** **Add `dragBlockBy(issueId, deltaDays)` and `getBlockBox(issueId)` to `apps/web/e2e/pages/timeline.page.ts`.** The existing `startDragFromEdge` / `dropOnEdge` handle-drag path stays byte-identical; the new methods are **additive**. Implementation contract:
  - `getBlockBox(issueId)` — returns the block's `boundingBox()` after `block(issueId).hover()` has settled (consistent with the existing `startDragFromEdge`).
  - `dragBlockBy(issueId, deltaDays)`:
    1. `block(issueId).hover()` (mirrors handle-drag pre-step; ensures the block is interactable).
    2. `await block(issueId).dispatchEvent("mousedown", { button: 0, buttons: 1, clientX, clientY, bubbles, cancelable })` at block center, **THEN** `page.mouse.move(clientX, clientY)` to anchor the document mousemove listener (mirrors the dispatchEvent + page.mouse.move bridge already in `startDragFromEdge` to bypass `pointer-events:none` / hidden-handle visibility issues — the block body itself is always pointer-receiving, but the dispatchEvent pattern keeps the call symmetric and works around any accidental overlay).
    3. Compute `pixelDelta = deltaDays * dayWidth`. **Read `dayWidth` from the DOM** (see D-03a) at the time of the drag — do not hard-code.
    4. `page.mouse.move(clientX + pixelDelta, clientY, { steps: 20 })` — same `steps: 20` as the existing handle-drag (matches `DRAG_STEPS` constant).
    5. `page.mouse.up()`.
- **D-03a:** **Read `dayWidth` from the rendered Gantt** rather than importing `chart-coords.ts` constants. Reasoning: importing prod constants from a test file couples the spec to internal helper module paths and risks circular `@/*` alias resolution surprises in the `apps/web/e2e/tsconfig.json` scope. The Gantt renders blocks at the canonical `(daysDiff + 1) * dayWidth` formula, and the `data-block-id` element's `boundingBox().width` divided by the issue's `(target_date - start_date) + 1` day count yields `dayWidth` directly. Compute it once per test from a known-width block (the unmoved `tgt`) and cache it.
- **D-03b:** **No `chart-coords.ts` import.** D-03a explicitly avoids it; ROADMAP.md §Risks/open questions hinted at "reuse `chart-coords.ts` constants" but the cost (test→prod coupling, resolver headaches) outweighs the benefit (six lines of arithmetic).
- **D-03c:** **Drag direction = rightward only.** Both TEST-23 and TEST-24 drag the predecessor (`src`) **forward in time** (positive `deltaDays`) past the successor's start. This is the canonical "violating boundary, pushing successor right" scenario from PRD `TEST-02` (forward propagation). Backward-drag coverage is at the algorithm/helper level (TEST-04 / Phase 4 chain helper); reproducing it E2E adds noise without unlocking new coverage.

### DOM position assertion strategy

- **D-04:** **TEST-23 (happy path) asserts on three things, in order:**
  1. **Network:** `page.waitForResponse(r => r.url().includes("/timeline-propagation/") && r.request().method() === "POST")` resolves to `status === 200` (per Phase 3 D-03 / `STATUS_BY_CODE`) with body containing `requested_work_item_id === src.id` and `total_updated_count >= 2` (server moved at least src + tgt).
  2. **DOM:** the **dragged** `src` block's bounding box has shifted by `dragDeltaPx ± dayWidth/2` rightward; the **successor** `tgt` block's bounding box has **also** shifted rightward by some non-zero amount (≥ 1 dayWidth) — this is the visible propagation. Use `expect.poll` with a short retry window so MobX-driven re-render after `commitWithServerResult` settles before the assertion.
  3. **Persistence:** `api.getIssue(tgt.id)` returns `{ start_date, target_date }` matching the server-returned values from step 1's response body. This catches any "DOM moved but persistence rolled back" desync.
- **D-04a:** **TEST-24 (failure path) asserts on three things, in order:**
  1. **Network:** `page.waitForResponse(r => r.url().includes("/timeline-propagation/") && r.request().method() === "POST")` resolves to `status === 422` (per Phase 3 `STATUS_BY_CODE.INCOMPLETE_SCHEDULE`) with body `{ code: "INCOMPLETE_SCHEDULE", message: ... }`.
  2. **Toast:** `expect(page.getByText("Schedule update failed")).toBeVisible()` (matches `timeline.propagation.error.title`) AND `expect(page.getByText("A dependent work item is missing start or target dates.")).toBeVisible()` (matches `timeline.propagation.error.incomplete_schedule`). The propel toast doesn't expose a `data-testid` (verified by reading `packages/propel/src/toast/toast.tsx`), so text-based assertion is the chosen seam. **The strings are the i18n contract** — if Phase 5's translations change, this test correctly demands an update.
  3. **DOM rollback:** both `src` and `tgt` blocks return to their **pre-drag** bounding boxes (within `dayWidth/2` tolerance for sub-pixel rendering jitter). Capture pre-drag boxes with `getBlockBox` BEFORE the drag; re-poll after the response.
- **D-04b:** **Locale assumption: `en`.** The toast message assertions in D-04a use English strings. ROADMAP.md and `apps/web/e2e/README.md` already assume the test workspace runs in `en` (default Plane locale). If the dev's session has `ja`, the assertion fails — call this out in D-08 below as a known precondition; do not introduce a UI-language switcher in this phase.
- **D-04c:** **Tolerance for bounding-box assertions:** `±2px` for "did not move" (rollback) and `≥ dayWidth - 2px` for "moved by at least one day". Sub-pixel drift comes from MobX reactivity timing + browser sub-pixel layout; these tolerances match the existing `dragLeftTo` / `dragRightTo` quantization (`Math.round(mouseX/dayWidth)*dayWidth` from Phase 5 D-09a).

### API helper additions

- **D-05:** **Add three methods to `apps/web/e2e/fixtures/api.ts`'s `Api` class**, each with the same CSRF + storageState + base-URL conventions as `createIssue`:
  - `async createIssueRelation(srcIssueId: string, targetIssueId: string, relationType: "blocking" | "blocked_by" | "relates_to" | "duplicate" = "blocking"): Promise<void>` → `POST /api/workspaces/<slug>/projects/<id>/issues/<srcId>/issue-relation/` with body `{ relation_type, issues: [targetIssueId] }`. Same endpoint Phase 1's E2E specs hit; Phase 6 just calls it from Node-side instead of from the UI. Status check: `expect 201`.
  - `async clearIssueDate(issueId: string, field: "start_date" | "target_date"): Promise<void>` → `PATCH /api/workspaces/<slug>/projects/<id>/issues/<id>/` with `{ [field]: null }`. Used by TEST-24 to trigger `INCOMPLETE_SCHEDULE`. Status check: `expect 200` or `204` (whichever the existing endpoint returns; lock during plan-phase).
  - `async getIssue(issueId: string): Promise<CreatedIssue>` → `GET /api/workspaces/<slug>/projects/<id>/issues/<id>/`. Used by TEST-23 for persistence assertion. Returns the same `CreatedIssue` shape `createIssue` already returns.
- **D-05a:** **No `mutateUpdatedAt` helper** — that belongs to the `SCHEDULE_CHANGED` E2E variant which D-02 deferred. If a future commit adds the SCHEDULE_CHANGED E2E case, **then** add the helper.
- **D-05b:** **Cleanup is identical to existing pattern.** `issuePair` fixture already cascade-deletes both issues; `IssueRelation` rows have FK `ON DELETE CASCADE` to `Issue` (Plane DB convention; verified in Phase 1 by `dependency-paths.tsx` reading from `relationMap` post-delete). No new teardown logic needed.

### Fixture composition

- **D-06:** **Add a `propagationPair` fixture** (NEW) on top of `issuePair` rather than duplicating relation-setup logic across the 2 specs. Shape:
  ```ts
  type Fixtures = {
    api: Api; // existing
    issuePair: { src: CreatedIssue; tgt: CreatedIssue }; // existing
    propagationPair: { src: CreatedIssue; tgt: CreatedIssue }; // NEW — same shape, but src→tgt blocking relation already created
    timeline: TimelinePage; // existing — `timeline` keeps depending on `issuePair`, NOT `propagationPair`, so existing specs are unaffected
    propagationTimeline: TimelinePage; // NEW — depends on `propagationPair`; reuses TimelinePage but waits for both blocks to render with the relation
  };
  ```

  - `propagationPair` builds on `api` + `issuePair` semantics (creates `src` start +0/end +3, `tgt` start +5/end +8 — note the **gap**: PRD-canonical "successor.start = predecessor.target + 1" minimum-adjacency case requires `tgt.start = src.target + 1`; we use a wider gap so the rightward drag definitively crosses the boundary), then `await api.createIssueRelation(src.id, tgt.id, "blocking")`, then hands `{ src, tgt }` to the test.
  - `propagationTimeline` waits for both `src` and `tgt` blocks to render (`waitForBlock(src.id)` + `waitForBlock(tgt.id)`), the same pattern existing `timeline` uses.
- **D-06a:** **Why a new `propagationPair` rather than mutating `issuePair`:** the existing 3 relation-creation specs depend on `issuePair` containing **no** preexisting relation (the test IS relation creation). Mutating `issuePair` to always include a blocking relation would break those 3 specs. Two fixtures, one for each spec file's seeding contract.
- **D-06b:** **Day spacing:** `src` start +0 / target +3, `tgt` start +5 / target +8 (3-day duration each, 2-day gap). The drag pushes `src` rightward by 4 days, which moves `src.target` from +3 to +7, violating `tgt.start = +5` boundary, forcing `tgt` to shift right by 2 days (`tgt.start = +8`, `tgt.target = +11`). Numbers chosen so:
  - The visible movement is large enough to exceed `dayWidth` tolerance (≥ 2 dayWidths shift).
  - The total propagation set fits in the loaded subset (no hidden-update path at the seeding scale).
  - No weekend/holiday boundary games (calendar-day arithmetic per Phase 2 D-03 — Working Calendar deferred).

### Test-data isolation & race conditions

- **D-07:** **Each test creates and tears down its own `propagationPair`.** No cross-test data sharing. `Promise.allSettled(deleteIssue(src), deleteIssue(tgt))` is the existing teardown; it cascades to the relation row. Suite remains `fullyParallel: false` / `workers: 1` (existing config — D-09 below confirms no change needed).
- **D-07a:** **TEST-24's `clearIssueDate` happens AFTER `propagationTimeline` finishes goto + waitForBlock**, so the UI has already hydrated `tgt` with `target_date` populated, then the API mutation clears it server-side. The drag then triggers propagation against a server state where `tgt.target_date IS NULL`, producing `INCOMPLETE_SCHEDULE`. The UI's local `IssuesTimeLineStore.blocksMap` still has the stale (full) `tgt`, which is **fine** — the UI's preview is loaded-graph-best-effort (Phase 4 D-04a), and the failure response triggers rollback (Phase 5 D-04 → `previewById.clear()`).
- **D-07b:** **No socket-driven UI reactivity to worry about.** The existing E2E auth setup uses HTTP only; there's no WebSocket subscription that would push `tgt.target_date = null` to the UI mid-test. `clearIssueDate` is invisible to the browser until the next refetch, which is exactly what D-07a needs.

### Test execution mode

- **D-08:** **Local-only execution. No CI integration.** Matches ROADMAP.md Phase 6 success criterion 5 and `docs/timeline-e2e-test-environment.md` §4.5. Run via `pnpm --filter=web test:e2e` against an active `docker-compose-local.yml` + `pnpm dev`. The `apps/web/e2e/README.md` already documents the bootstrap; Phase 6 plan-phase MAY add a one-line note about the new spec but does not need to rewrite the README.
- **D-08a:** **Locale precondition:** the test workspace must run in `en` (D-04b). Add a single line to README and to the README's "前提" section if missing. **Do NOT** add a runtime locale switcher (out of scope).
- **D-08b:** **Browser:** Chromium only. Inherits existing `playwright.config.ts` projects matrix; no `firefox` / `webkit` additions.

### Concurrency / parallelism

- **D-09:** **No change to `playwright.config.ts`.** `fullyParallel: false`, `workers: 1` already match the suite's "single shared workspace/project" data model. Adding 2 new tests doesn't change that.
- **D-09a:** **Retries:** inherit existing config (`retries: process.env.CI ? 2 : 0`). Local runs get no retry (fail fast → fix). CI is out of scope so the `2` only matters for future enabling.

### Lint, formatting, OxLint budget

- **D-10:** **No new OxLint warnings in `apps/web/e2e/`.** The existing `apps/web` budget `11957` is ratcheting per CLAUDE.md; new test code lands at 0 warnings. The existing 3 specs ship at 0 warnings, so the bar is achievable.
- **D-10a:** **No new external dependencies.** `@playwright/test` is already on `apps/web` devDeps; `dotenv` already on the catalog. Phase 6 introduces zero `package.json` edits.
- **D-10b:** **No `turbo.json` edits.** `test:e2e` is intentionally outside Turbo (existing decision per the e2e environment plan §4.5).
- **D-10c:** **No `.gitignore` edits.** All Phase 6 paths are under `apps/web/e2e/specs/` (the spec) + `apps/web/e2e/{pages,fixtures}/` (the helpers, **modifying** existing files). Nothing new to ignore.

### Test naming / ID traceability

- **D-11:** **Each test name carries a `[TEST-NN]` tag** matching `.planning/REQUIREMENTS.md` IDs:
  - `"#1 [TEST-23] happy path: drag predecessor moves successor and persists"`
  - `"#2 [TEST-24] failure path: incomplete-schedule rejects drag and rolls back UI"`
    This matches the existing 3 specs' `#N` numbering and adds a requirement-ID tag for traceability (used at /gsd-verify-work to mark the requirement complete).
- **D-11a:** **Spec file header:** add a one-paragraph banner comment naming the requirements covered, matching the in-existing-spec convention of inline Japanese comments referencing implementation files.

### Known fragility & retry strategy

- **D-12:** **Block-body mousedown event simulation** (D-03 step 2) is the **highest-risk** part of the spec. The block element has its own `onMouseDown={(e) => enableBlockMove && handleBlockDrag(e, "move")}` (`apps/web/core/components/gantt-chart/helpers/draggable.tsx:61`). Direct `page.mouse.down()` on the block center should fire it without any dispatchEvent gymnastics — but the existing `dragRightTo` uses `dispatchEvent` because the **handle** elements are `pointer-events:none` until hover. The block body is **not** `pointer-events:none`, so try `page.mouse.move(x, y)` + `page.mouse.down()` first; **only** if smoke testing reveals a missed mousedown, fall back to `dispatchEvent("mousedown", ...)` (the existing pattern). Plan-phase decides; both paths are valid.
- **D-12a:** **`enableBlockMove` is a render-time prop**; it depends on `isBlockComplete && enableBlockMove` (`apps/web/core/components/gantt-chart/blocks/block.tsx:146`). The seeded `propagationPair` issues both have `start_date` and `target_date` populated at creation, so `isBlockComplete` is `true` for both; this is safe for the happy path. For the failure path, **the failing issue's `target_date` is cleared via API but the local store hasn't refetched** (D-07a — no socket push) so `isBlockComplete` remains `true` in the browser's snapshot. The drag still fires; the server rejects. This is the deliberate test design.
- **D-12b:** **Wait for `commitWithServerResult` resolution before asserting DOM.** After `mouse.up()` in D-03, do **NOT** assert DOM positions immediately. Use `expect.poll(getBlockBox).toMatchObject(...)` with a default 5-second poll window so MobX reactivity has time to flush (Phase 4 D-05d's per-issue `updateIssue` writes inside `runInAction`). Polling is the existing Playwright idiom for "eventually settles".

### Test harness for Phase 6 itself

- **D-13:** **Phase 6 ships zero new test infrastructure.** No new fixtures (D-06 reuses the `Api` + `TimelinePage` already present), no new spec libraries, no new env vars (D-08), no Vitest / Jest additions. The whole milestone wraps with the same harness it started with.
- **D-13a:** **Self-test:** the FIRST plan-phase task is to run `pnpm --filter=web test:e2e --grep "[TEST-23]"` against the failing-by-default placeholder spec to confirm the harness still works before any prod-touching code. This catches infra rot (chromium binary missing, .env.e2e malformed, storageState expired) early, separate from spec logic bugs.

### Claude's Discretion

The user accepted all auto-mode recommended options. Specific call-outs the user may want to revisit during plan-phase:

- **Failure-code choice (D-02):** `INCOMPLETE_SCHEDULE` is the lowest-flake / highest-coverage pick. If the user wants `SCHEDULE_CHANGED` instead (or both), see D-04b alternative below; the recipe is documented but deferred.
- **Block-mousedown pattern (D-12):** start with native `page.mouse.down()`; fall back to `dispatchEvent` if smoke testing fails. Plan-phase locks one path.
- **Bounding-box tolerance (D-04c):** `±2px` is conservative. If sub-pixel layout produces consistent drift > 2px on the dev's machine, raise to `±3px` — but only based on observed flake, not speculative widening.
- **`propagationPair` fixture vs. inline (D-06):** the new fixture is the simpler call-site; if it adds cognitive load (4 fixtures instead of 2), inline relation creation in each spec is the alternative. **Default = fixture**.
- **Locale assumption `en` (D-04b / D-08a):** the test asserts on English toast strings. If the dev's workspace runs in `ja`, plan-phase MUST flag this; the cheapest fix is to also assert the `ja` translation OR pin the workspace's locale at setup time.
- **`SCHEDULE_CHANGED` E2E variant (deferred):** captured below; trivial to add later if product wants the second case before milestone close.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Project-level direction

- `.planning/ROADMAP.md` §"Phase 6: End-to-End Coverage & Polish" — phase goal, success criteria 1–5, modules-to-change list, **Risks/open questions** including the `INCOMPLETE_SCHEDULE` recommendation (locked here as D-02), the `chart-coords.ts` reuse hint (rejected here as D-03b in favor of DOM-derived `dayWidth`), and the per-developer `.env.e2e` reminder (no change needed per D-10c).
- `.planning/REQUIREMENTS.md` — owns **TEST-23** and **TEST-24** (the two requirements Phase 6 closes). All other requirements are already done; Phase 6 has no other requirement deltas.
- `.planning/PROJECT.md` — Core value (visible Gantt + dependency graph integrity) is what TEST-23 visually demonstrates and TEST-24 negatively confirms; ce/core boundary is moot here (Phase 6 changes only `apps/web/e2e/`); `mousedown`/`mousemove`/`mouseup` native drag fact is critical for D-03's `dragBlockBy` pattern; OxLint budget = 11957 (D-10).
- `.planning/STATE.md` — Phase 5 PHASE COMPLETE; 12/12 plans done; UI is wired and live. Phase 6 sits on top of a fully-shipped stack — its only blockers are seeding correctness and assertion stability.
- `.planning/phases/05-drag-handler-integration-error-ux/05-CONTEXT.md` — **Phase 5 D-01..D-12c.** Most relevant carry-overs:
  - **D-01 / D-01a (`base-gantt-root.tsx::updateBlockDates` predicate):** the move path is what TEST-23 / TEST-24 invoke. Phase 6 doesn't touch this code; it observes its outcome.
  - **D-02 / D-02b (preview rendering during drag):** TEST-23's mid-drag visual would be an ideal mid-drag E2E assertion, but it's high-flake (timing-sensitive) — Phase 6 asserts on **post-drag** state (commit success / failure), not mid-drag preview. Mid-drag preview correctness is observed by manual smoke (Phase 5 D-11a).
  - **D-04 / D-04c (per-code error toast):** TEST-24's toast assertion targets `MESSAGE_KEY_BY_CODE.INCOMPLETE_SCHEDULE` → "A dependent work item is missing start or target dates."
  - **D-09 (`expected_updated_at` snapshot at mousedown):** TEST-24's failure-via-incomplete-schedule does NOT depend on stale `updated_at` (D-07a / D-07b) — that path uses `SCHEDULE_CHANGED` and is deferred.
  - **D-11 / D-11a (no Phase 5 automated tests; manual smoke before Phase 6):** Phase 6 is the automated closure of those 14 manual scenarios — the smoke checklist becomes the test plan inspiration, but only TEST-23 / TEST-24 (the PRD-required pair) ship as automated specs.
- `.planning/phases/05-drag-handler-integration-error-ux/05-VERIFICATION.md` — Phase 5 sign-off; pin GREEN counts (11 Vitest + 26 contract + 64 unit + Phase 5 manual smoke pending /gsd-verify-work) so Phase 6 keeps them GREEN throughout.
- `.planning/phases/04-frontend-service-client-mobx-preview-store/04-CONTEXT.md` — Phase 4 D-04 / D-04a (helpers preserve duration; loaded-subset only — TEST-23's seeded scenario fits inside the loaded subset, so the preview is exact, not approximate); D-05 (4-action store API).
- `.planning/phases/03-propagation-api-endpoint-persistence-contract/03-CONTEXT.md` — D-01 (URL `POST /api/workspaces/<slug>/projects/<uuid:project_id>/timeline-propagation/`); D-04 (envelope shape that TEST-23 / TEST-24 intercept); STATUS_BY_CODE map (D-03 of Phase 3) — `INCOMPLETE_SCHEDULE` returns HTTP 422.
- `.planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-CONTEXT.md` — Phase 2 algorithm shape; relevant for understanding what TEST-23 expects ("forward boundary violation pushes successor by minimum required delta, preserving duration").

### Frontend domain & PRD (downstream agents read these for naming and UX intent)

- `CONTEXT.md` (repo root) — Ubiquitous Language. Use **Work Item / Precedence Dependency / Dependency Schedule Propagation / Precedence Boundary** in test names, comments, and assertion messages where useful. Avoid "issue" / "relation" outside of API helper method names (where the wire-level term is correct).
- `docs/prd/timeline-dependency-date-range-propagation.md` — PRD. Phase 6 closes TEST-23 (US level: "drag and dependent work item moves and persists") and TEST-24 (US level: "drag fails cleanly with reason and UI returns to original state"). PRD §145–147 explicitly cites Playwright as the E2E framework and frames E2E as the smaller-count complement to unit tests at the algorithm level.
- `docs/adr/0001-server-authoritative-dependency-schedule-propagation.md` — server is authoritative; failure must include reason code. TEST-24 directly observes both at the wire and the UI surface.
- `docs/timeline-dependency-follow-up-tasks.md` — out-of-milestone deferred items; Phase 6 doesn't reference them but the test seeding intentionally avoids weekend/holiday math (calendar-day only, per Phase 2 D-03).
- `docs/timeline-e2e-test-environment.md` — **the existing E2E environment design.** §1.3 (interaction list) gives the conceptual basis for the new `dragBlockBy`. §3 (directory structure) is what Phase 6 inherits unchanged. §4.1 (CSRF handling) is what `createIssueRelation` / `clearIssueDate` reuse. §4.5 explicitly defers CI integration (D-08 confirms).
- `docs/timeline-e2e-test-environment-plan.md` — the Phase 1 E2E implementation plan. Tasks 7 (`api.ts`), 8 (`test-fixtures.ts`), 9 (`timeline.page.ts`), 10–12 (specs) are the **patterns** Phase 6 extends. Phase 6 does NOT re-execute these tasks; it adds to their outputs.
- `CLAUDE.md` (repo root) — pnpm catalog convention (Phase 6 adds nothing); OxLint ratcheting budget rule (D-10); i18n format (the failure-toast assertion in D-04a relies on the literal en strings, which use plain text, not ICU plural — only the hidden-update notification uses ICU plural and TEST-23 doesn't trigger it at the seeding scale per D-06b).

### Existing code (read-only inputs, plus the 3 e2e files Phase 6 modifies)

- `apps/web/e2e/specs/timeline-dependency-drag.spec.ts` — **READ-ONLY for Phase 6.** The 3 relation-creation specs are the **regression guard**. They MUST keep passing; Phase 6 must not change their behavior, fixture surface, or POM contract.
- `apps/web/e2e/pages/timeline.page.ts` — **MODIFY (additive).** Add `dragBlockBy` and `getBlockBox` per D-03. Existing `dragRightTo` / `dragLeftTo` / `startDragFromEdge` / `dropOnEdge` / `clickPickerOption` stay byte-identical.
- `apps/web/e2e/fixtures/api.ts` — **MODIFY (additive).** Add `createIssueRelation`, `clearIssueDate`, `getIssue` per D-05. Existing `createIssue` / `deleteIssue` / `dispose` stay byte-identical.
- `apps/web/e2e/fixtures/test-fixtures.ts` — **MODIFY (additive).** Add `propagationPair` and `propagationTimeline` fixtures per D-06. Existing `api` / `issuePair` / `timeline` fixtures stay byte-identical.
- `apps/web/e2e/auth/auth.setup.ts` — **READ-ONLY.** Storage state setup is reusable as-is.
- `apps/web/e2e/playwright.config.ts` — **READ-ONLY.** Existing config (workers=1, fullyParallel=false, retries from CI env) suits Phase 6 as-is (D-09).
- `apps/web/e2e/fixtures/env.ts` — **READ-ONLY.** Existing env vars cover Phase 6's needs (no new vars per D-10c).
- `apps/web/e2e/README.md` — MAY MODIFY one line in §"前提" to call out the locale precondition (D-08a). Plan-phase locks the exact edit.
- `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx` — **READ-ONLY.** Phase 5's D-01 split is what TEST-23 / TEST-24 exercise. Phase 6 references it for understanding only; never edits.
- `apps/web/core/components/gantt-chart/helpers/blockResizables/use-gantt-resizable.ts` — **READ-ONLY.** The drag entry point. Phase 6's `dragBlockBy` POM dispatches mousedown such that this hook receives a `dragDirection === "move"` event.
- `apps/web/core/components/gantt-chart/blocks/block.tsx` — **READ-ONLY.** `data-block-id={block.id}` (line 117) is the assertion seam for `getBlockBox`. `enableBlockMove && isBlockComplete` guard (line 146) gates the mousedown — D-12a confirms it's true at TEST-24's drag time.
- `apps/web/core/components/gantt-chart/helpers/draggable.tsx` — **READ-ONLY.** `onMouseDown={(e) => enableBlockMove && handleBlockDrag(e, "move")}` (line 61) is the wire from DOM to hook; Phase 6's `dragBlockBy` hits this.
- `apps/web/core/components/gantt-chart/helpers/propagation/toast-resolver.ts` — **READ-ONLY.** Phase 5 ships this; Phase 6 verifies it via the toast text assertion (D-04a).
- `apps/web/core/components/gantt-chart/helpers/propagation/callbacks-context.ts` — **READ-ONLY.** Phase 5 ships this; Phase 6 doesn't reference it directly (the propagation flows through it transparently).
- `apps/web/ce/store/timeline/timeline-propagation.store.ts` — **READ-ONLY.** Phase 4's store. TEST-24's failure → `previewById.clear()` is the production-side rollback Phase 6 observes via DOM bounding-box rollback.
- `apps/web/core/services/issue/issue.service.ts` — **READ-ONLY.** The legacy resize / bulk-update path. Phase 6 doesn't trigger it — drags are routed to `commitWithServerResult` per Phase 5 D-01.
- `packages/services/src/issue/timeline-propagation.service.ts` — **READ-ONLY.** Phase 4's service. Phase 6's `waitForResponse` URL filter (`/timeline-propagation/`) catches its `propagateMove` call.
- `packages/i18n/src/locales/en/translations.ts:2766–2783` — **READ-ONLY.** TEST-24's toast text assertion uses `propagation.error.title` and `propagation.error.incomplete_schedule` literally; if these strings change, the test correctly demands updating.
- `packages/propel/src/toast/toast.tsx` — **READ-ONLY.** Confirms no `data-testid` on the toast root (D-04a uses text-based assertion as the consequence). The toast is rendered via `BaseToast.Title` / `BaseToast.Description` from Sonner — both are findable via `getByText`.

### Codebase maps (already-read context)

- `.planning/codebase/STACK.md` — Node 22.18.0 + pnpm 10.32.1 + Turborepo 2.9. Phase 6 adds zero toolchain.
- `.planning/codebase/STRUCTURE.md` — `apps/web/e2e/` is the canonical Playwright location; CE/core boundary doesn't apply (no prod code touched).
- `.planning/codebase/TESTING.md` — Playwright section (lines 39–58) describes the existing harness in detail. Phase 6's additions extend §3 (config, project structure) without changing it.
- `.planning/codebase/CONCERNS.md` — "do not invent test harnesses without asking" — D-13 confirms zero new harness. "load-bearing CSS selectors" — D-04 uses only `data-block-id` + i18n text (both are stable / contract-level).
- `.planning/codebase/CONVENTIONS.md` — file headers, MobX `observer` discipline (irrelevant for tests), barrel re-exports (irrelevant for tests).
- `.planning/codebase/ARCHITECTURE.md` — frontend layered model. Phase 6 is end-to-end across all three layers.
- `.planning/codebase/INTEGRATIONS.md` — axios + APIService boundary; React Router v7 routing; MobX. Phase 6's E2E sits at the user-visible surface and observes integration via the browser.

### Prior phase cross-references

- `.planning/phases/01-precedence-graph-loader-normalization/01-CONTEXT.md` — Phase 1 contract (graph normalization). TEST-23's seeded relation produces a 1-edge precedence graph — well within Phase 1's tested surface.
- `.planning/phases/02-date-range-scheduling-helper-propagation-algorithm-core/02-CONTEXT.md` — Phase 2 D-01..D-14 (algorithm). TEST-23's 4-day forward drag with a 2-day gap matches D-04 (forward boundary violation, minimum-delta propagation). TEST-24's `INCOMPLETE_SCHEDULE` matches D-07 (lazy validation: discovered at the successor walk).
- `.planning/phases/03-propagation-api-endpoint-persistence-contract/03-VERIFICATION.md` — Phase 3 sign-off (26 contract + 64 unit GREEN). Phase 6 must keep these GREEN — backend code is untouched.
- `.planning/phases/04-frontend-service-client-mobx-preview-store/04-VERIFICATION.md` — Phase 4 sign-off (11 Vitest GREEN). Phase 6 must keep these GREEN — Phase 4 helpers are untouched.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`apps/web/e2e/fixtures/api.ts::Api`** — already wraps storageState + CSRF. Phase 6 adds three methods (D-05) reusing the same axios-via-Playwright-request idiom and the same `expect()` status-check style.
- **`apps/web/e2e/pages/timeline.page.ts::TimelinePage`** — already provides `block(issueId)`, `waitForBlock(issueId)`, `gotoIssueGantt()`. Phase 6 adds `dragBlockBy` + `getBlockBox` (D-03) reusing the same `page.locator` patterns.
- **`apps/web/e2e/fixtures/test-fixtures.ts::test`** — already extended with `api`, `issuePair`, `timeline`. Phase 6 adds `propagationPair`, `propagationTimeline` (D-06) following the same `base.extend<Fixtures>({...})` shape and `Promise.allSettled` teardown idiom.
- **`apps/web/e2e/auth/auth.setup.ts`** — UI login + storageState already in place; Phase 6 reuses verbatim.
- **`apps/web/e2e/playwright.config.ts`** — workers/retries/reporter already configured; D-09 confirms no change.
- **The propagation production stack (Phases 1–5)** — fully wired and live; Phase 6 is a passive observer.

### Established Patterns

- **One spec file per feature**, `test.describe("<feature>")` per file, `#N` numbering per test (`timeline-dependency-drag.spec.ts` is the precedent — Phase 6's new file mirrors).
- **`page.waitForResponse(...)` BEFORE the action** that triggers the request — race-free network-assertion idiom (existing 3 specs all use it; Phase 6 follows).
- **DOM assertions via `data-block-id` + bounding-box geometry** — established in `dependency-paths.tsx` (Phase 1 added `data-dependency-key`). Phase 6 uses `data-block-id` only; no new attributes.
- **Japanese inline comments are common** in `apps/web/e2e/`. Phase 6 may continue this style for any non-obvious assertion (preserving the existing voice).
- **`dispatchEvent("mousedown", ...)` to bypass `pointer-events:none`** — used by handle-drag; D-12 makes it a fallback (not default) for block-body drag because the block is NOT pointer-events-blocked.
- **`Promise.allSettled` for teardown** — guarantees cleanup runs even when the prior step throws. Phase 6's `propagationPair` teardown follows.
- **Spec files import `{ test, expect } from "../fixtures/test-fixtures"`**, never directly from `@playwright/test`. Phase 6 follows.

### Integration Points

- **Phase 6 spec ←→ Phase 5 production drag handler:** `dragBlockBy` triggers `useGanttResizable.handleBlockDrag(e, "move")`, which Phase 5 wired to `propagationStore.beginPreview` → `updatePreview` → `BaseGanttRoot.updateBlockDates(D-01)` → `commitWithServerResult`.
- **Phase 6 spec ←→ Phase 4 store:** `commitWithServerResult` returns success → `applyServerWorkItems` → `rootStore.issue.issues.updateIssue` → `IssuesTimeLineStore.blocksMap` re-render → block bounding-box update — what TEST-23 asserts.
- **Phase 6 spec ←→ Phase 4 store (failure path):** `commitWithServerResult` returns failure → `previewById.clear()` → block bounding-box returns to `block.position` — what TEST-24 asserts.
- **Phase 6 spec ←→ Phase 3 endpoint:** `page.waitForResponse` filter on `/timeline-propagation/` catches the POST; status code (200 vs 422) and body shape (`requested_work_item_id` / `total_updated_count` / `work_items[]` for success; `{code, message}` for failure) come from Phase 3's `STATUS_BY_CODE` and serializers.
- **Phase 6 spec ←→ Phase 5 toast resolver:** `showPropagationErrorToast(code, t)` renders via `@plane/propel/toast`; TEST-24 finds the toast via `getByText` on the i18n English strings.
- **Phase 6 spec ←→ Phase 1 IssueRelation API:** `createIssueRelation` POSTs to `/issues/<srcId>/issue-relation/` (same endpoint Phase 1's E2E specs hit via UI drag); Phase 6 hits it via Node-side request to skip the relation-creation drag and go straight to propagation seeding.

</code_context>

<specifics>

## Specific Ideas

- **First minimum task** (anchor for plan-phase): add `getIssue(issueId)` to `apps/web/e2e/fixtures/api.ts` and a placeholder spec file `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` containing a single skipped test (`test.skip("placeholder", ...)`) to confirm the harness still runs (`pnpm --filter=web test:e2e --grep "placeholder"` produces 0 failures, 1 skipped). This is D-13a's self-test.
- **Second-minimum task**: add `createIssueRelation` to `Api` and the `propagationPair` fixture to `test-fixtures.ts`. Smoke-test by running a single `test("smoke: relation seed survives deletion cascade", ...)` that creates the pair, asserts via API that the relation row exists, and lets fixture teardown delete the issues. Confirms cascade behavior before TEST-23 depends on it.
- **Third-minimum task**: add `dragBlockBy(issueId, deltaDays)` + `getBlockBox(issueId)` to `TimelinePage`. Smoke-test by running a single `test("smoke: dragBlockBy moves the dragged block visually", ...)` that drags the issue without a relation in place and asserts the block's bounding box has shifted by ~`deltaDays * dayWidth` after `mouse.up`. Confirms the POM mechanic before TEST-23 / TEST-24 depend on it.
- **Fourth task**: implement TEST-23 (happy path). Three assertions per D-04: network → DOM movement → API persistence.
- **Fifth task**: add `clearIssueDate` to `Api`, then implement TEST-24 (failure path). Three assertions per D-04a: network → toast text → DOM rollback.
- **Sixth task**: full-suite smoke. `pnpm --filter=web test:e2e` runs all 5 tests (existing 3 + new 2) and all pass. Two consecutive runs (D-14 in the plan) confirm cleanup idempotency.
- **Refactor restraint**: DO NOT migrate any logic out of `apps/web/e2e/`. DO NOT add Vitest. DO NOT introduce a screenshot-diff harness. DO NOT change `playwright.config.ts`. DO NOT touch `auth.setup.ts`. DO NOT touch any prod code under `apps/web/core/` or `apps/web/ce/` (the only "drive-by" candidate is the propel toast adding a `data-testid` for E2E ergonomics — explicitly rejected here; the i18n text is the contract).

</specifics>

<deferred>

## Deferred Ideas

- **`SCHEDULE_CHANGED` E2E variant** (D-02 alternative). Recipe: open one Playwright APIRequestContext on workspace W, take a snapshot of `tgt.updated_at`, start a drag in the browser, in parallel mutate `tgt.updated_at` server-side via `ctx.patch(... /issues/<tgt>/, { name: "race-marker" })` (any non-date field bumps `updated_at`), then complete the drag. Server returns `SCHEDULE_CHANGED`. Cost: cross-context timing barrier; benefit: covers Phase 3's TEST-13 / Phase 4's `lastError` path at the E2E level. Add post-milestone if QA wants the second case.
- **`PROPAGATION_LIMIT_EXCEEDED` E2E variant.** Seed 100+ chained issues via API helper, drag the head; server returns `PROPAGATION_LIMIT_EXCEEDED`. Heavy seed cost; defer to a perf-test workstream rather than the milestone closer.
- **`DEPENDENCY_CYCLE` E2E variant.** Seed a 3-node cycle (A→B→C→A) via API; drag any node; server returns `DEPENDENCY_CYCLE`. Conceptually simple but fights the UI's existing immediate-feedback cycle guard (Phase 5 doesn't block server-side cycles from happening; the UI's cycle-check.ts only catches relation-creation cycles, not propagation-time cycles). Defer.
- **Hidden-update notification E2E coverage.** Seed a propagation set larger than the loaded subset, drag, assert the INFO toast appears with `# additional work items updated` plural copy. Requires either filtering the Gantt view to a partial subset or seeding 100+ items. Phase 4 D-04a's helper-level TEST-22 already covers the count math; the toast rendering is observed manually per Phase 5 D-11a. Defer.
- **Drag chain / branch / merge propagation E2E.** Algorithm-level coverage at the unit / Vitest layer is extensive (Phase 1+2+4 ship 64 unit + 11 Vitest GREEN). E2E adds a redundant slow path. Defer; close at unit level.
- **Mid-drag visual preview E2E assertion.** The successor block visibly shifts during mousemove (Phase 5 D-02 / D-02b). Asserting this E2E means timing the drag-mid-flight assertion between two `page.mouse.move` calls — high flake. Defer; observe manually per Phase 5 D-11a.
- **Backward / leftward drag E2E coverage.** TEST-23 / TEST-24 both drag rightward. Backward-direction algorithm pinning is at unit level (Phase 2). Defer.
- **CI integration.** `docs/timeline-e2e-test-environment.md` §4.5 explicitly defers it; ROADMAP.md Phase 6 success criterion 5 explicitly excludes it. Add via a follow-up workstream when the GitHub Actions Postgres/Redis service-container budget is approved.
- **Visual regression / screenshot diff harness.** No precedent in the repo; would be a fresh harness invention. Defer indefinitely unless QA has a regression-by-pixels concern.
- **Performance / latency assertions in E2E.** No SLA in PRD. Defer.
- **Locale-aware toast assertion (`ja`).** D-04b assumes `en`. If the dev's workspace runs in `ja`, the assertion fails. Trivial follow-up: assert on either locale via `expect.or` pattern OR pin the workspace locale at setup. Defer until a non-en dev hits it.
- **`@plane/propel/toast` `data-testid` addition.** Would let TEST-24 use `[data-testid="propagation-error-toast"]` instead of text matching. Drive-by prod change rejected here (D-13 / scope guard). Add only if text-based assertion proves flaky in practice.
- **Block-mousedown via `dispatchEvent` (D-12 fallback).** If smoke testing reveals `page.mouse.down()` over the block body misses the React `onMouseDown` handler (synthetic event timing), fall back to the existing handle-drag pattern. Captured here so plan-phase doesn't have to re-derive it.

</deferred>

---

_Phase: 06-End-to-End Coverage & Polish_
_Context gathered: 2026-05-04_
