# Phase 6: End-to-End Coverage & Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 6-End-to-End Coverage & Polish
**Mode:** `--auto` (single-pass autonomous discuss; recommended option auto-selected for every gray area)
**Areas discussed:** Spec layout, Failure-code selection (TEST-24), Block-body drag mechanics, DOM assertion strategy, API helper additions, Fixture composition, Test-data isolation, Test execution mode, Concurrency, Lint/budget, Test naming, Known fragility

---

## Spec layout

| Option                                                                    | Description                                                                         | Selected |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| New file `timeline-dependency-propagation.spec.ts` with describe-per-file | Mirror existing `timeline-dependency-drag.spec.ts` convention; one feature per file | ✓        |
| Append to existing `timeline-dependency-drag.spec.ts`                     | Single file holding all timeline E2E specs                                          |          |
| One file per test (#1, #2 separate)                                       | Maximum isolation                                                                   |          |

**Auto-selected:** new file. Reason: matches existing `timeline-<feature>.spec.ts` precedent; keeps regression-guard (relation creation) and propagation-gate concerns separate.

---

## Failure-code selection for TEST-24

| Option                       | Description                                                                    | Selected |
| ---------------------------- | ------------------------------------------------------------------------------ | -------- |
| `INCOMPLETE_SCHEDULE`        | Clear `target_date` on successor via API → drag → server returns 422 with code | ✓        |
| `SCHEDULE_CHANGED`           | Race a parallel `updated_at` mutation between mousedown and mouseup            |          |
| `DEPENDENCY_CYCLE`           | Seed a 3-node cycle via API → drag any node                                    |          |
| `PROJECT_BOUNDARY_EXCEEDED`  | Requires a second project                                                      |          |
| `PROPAGATION_LIMIT_EXCEEDED` | Seed 100+ chained issues                                                       |          |
| `PERMISSION_DENIED`          | Requires guest-role session + second auth.setup                                |          |
| `INVALID_DATE_RANGE`         | UI normally prevents this; would need out-of-band submission                   |          |

**Auto-selected:** `INCOMPLETE_SCHEDULE`. Reason: ROADMAP.md §Risks/open questions explicitly recommends this code as easiest to trigger reliably; one-line API mutation between setup and drag; no timing race; no infra changes (single project, single auth.setup, no large seed).

---

## Block-body drag mechanics (POM additions)

| Option                                                                                    | Description                                                   | Selected |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------- |
| Add `dragBlockBy(issueId, deltaDays)` + `getBlockBox(issueId)` to existing `TimelinePage` | Additive, mirrors existing `dragRightTo` / `dragLeftTo` style | ✓        |
| New `GanttBlockPage` POM class                                                            | Separate POM per concern                                      |          |
| Pure helper functions (no POM)                                                            | Avoid POM bloat                                               |          |

**Auto-selected:** additive POM methods. Reason: keeps the POM cohesive; existing methods stay byte-identical; matches the documented test-environment patterns.

### Sub-decision: `dayWidth` source

| Option                                                        | Description                        | Selected |
| ------------------------------------------------------------- | ---------------------------------- | -------- |
| Read from DOM at test time (compute from a known-width block) | Decouples test from prod constants | ✓        |
| Import `chart-coords.ts` constants                            | ROADMAP.md hint                    |          |
| Hard-code based on default `dayWidth`                         | Brittle if defaults change         |          |

**Auto-selected:** DOM-derived. Reason: avoids `@/*` alias resolution headaches in `apps/web/e2e/tsconfig.json` scope; six lines of arithmetic; resilient to dayWidth defaults changing.

### Sub-decision: drag direction

| Option                                      | Description                | Selected |
| ------------------------------------------- | -------------------------- | -------- |
| Rightward only (forward boundary violation) | Canonical TEST-02 scenario | ✓        |
| Both rightward and leftward                 | Mirror coverage            |          |

**Auto-selected:** rightward only. Reason: backward propagation is unit-pinned (Phase 2 TEST-04); E2E adds noise without new coverage.

---

## DOM assertion strategy

| Option                                                                                                             | Description                                                          | Selected |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | -------- |
| Three-tier: network + DOM bounding box + API persistence (TEST-23) / network + toast text + DOM rollback (TEST-24) | Belt-and-suspenders coverage                                         | ✓        |
| Network-only                                                                                                       | Cheapest, but allows "DOM missed re-render but API persisted" desync |          |
| API-only                                                                                                           | Skips visible behavior verification                                  |          |
| Toast-only (TEST-24)                                                                                               | Doesn't verify rollback                                              |          |

**Auto-selected:** three-tier. Reason: TEST-23/24's whole point is end-to-end coverage; each tier catches a distinct failure mode (Phase 5 D-04 wiring break vs. Phase 4 D-05d write-back break vs. Phase 3 persistence break).

### Sub-decision: toast assertion mechanism

| Option                              | Description                                                    | Selected |
| ----------------------------------- | -------------------------------------------------------------- | -------- |
| `getByText` on i18n English strings | Matches `packages/propel/src/toast/toast.tsx` (no data-testid) | ✓        |
| Add `data-testid` to propel toast   | Drive-by prod change                                           |          |
| Class-name selector                 | Brittle, against `CONCERNS.md` "load-bearing CSS selectors"    |          |

**Auto-selected:** text-based. Reason: i18n strings are the contract surface; if Phase 5 changes them, the test correctly demands an update.

### Sub-decision: bounding-box tolerance

| Option                                                    | Description                   | Selected |
| --------------------------------------------------------- | ----------------------------- | -------- |
| `±2px` for "did not move", `≥ dayWidth - 2px` for "moved" | Matches existing quantization | ✓        |
| Strict (no tolerance)                                     | Sub-pixel jitter would flake  |          |
| Generous (`±5px`)                                         | Speculative widening          |          |

**Auto-selected:** `±2px`. Reason: matches Phase 5 D-09a `Math.round/dayWidth` quantization; widen later only if observed flake demands it.

---

## API helper additions

| Option                                                                  | Description                                  | Selected |
| ----------------------------------------------------------------------- | -------------------------------------------- | -------- |
| Three new methods (`createIssueRelation`, `clearIssueDate`, `getIssue`) | Minimal surface for TEST-23 + TEST-24        | ✓        |
| Larger surface (also `mutateUpdatedAt`, `setPermission`, etc.)          | Enable all 7 error-code variants             |          |
| Fewer (just `createIssueRelation`)                                      | Skip persistence assertion / failure trigger |          |

**Auto-selected:** three methods. Reason: covers the chosen E2E scope (TEST-23 + TEST-24 with INCOMPLETE_SCHEDULE); other helpers are deferred per their respective deferred-idea entries.

---

## Fixture composition

| Option                                                                                      | Description                                        | Selected |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------- |
| New `propagationPair` + `propagationTimeline` fixtures composed on `issuePair` + `timeline` | Reusable across both new tests                     | ✓        |
| Inline relation-creation in each test body                                                  | Smaller fixture surface                            |          |
| Mutate existing `issuePair` to include relation                                             | Would break the existing 3 relation-creation specs |          |

**Auto-selected:** new fixtures. Reason: existing 3 specs depend on `issuePair` having NO preexisting relation (relation creation IS the test); new fixture preserves both contracts.

### Sub-decision: day spacing

| Option                                               | Description                                          | Selected |
| ---------------------------------------------------- | ---------------------------------------------------- | -------- |
| `src` 0–3, `tgt` 5–8 (2-day gap, 4-day forward drag) | Definitive boundary violation, fits in loaded subset | ✓        |
| `src` 0–3, `tgt` 4–7 (1-day adjacency, smaller drag) | PRD-canonical adjacency case but visually smaller    |          |
| Larger spacing                                       | Slower test, no extra coverage                       |          |

**Auto-selected:** 2-day gap, 4-day drag. Reason: visible movement exceeds dayWidth tolerance; total propagation set fits in loaded subset (no hidden-update path); calendar-day arithmetic only (no weekend/holiday games).

---

## Test-data isolation & race conditions

| Option                                         | Description                               | Selected |
| ---------------------------------------------- | ----------------------------------------- | -------- |
| Per-test fixture creation + cascade-on-cleanup | Existing `issuePair` pattern              | ✓        |
| Shared seed (one relation reused across tests) | Faster but introduces cross-test coupling |          |

**Auto-selected:** per-test. Reason: cleanup is already cascade-safe via FK; suite stays `workers: 1` so per-test overhead is acceptable.

---

## Test execution mode

| Option                                 | Description                                        | Selected |
| -------------------------------------- | -------------------------------------------------- | -------- |
| Local-only execution (existing config) | Matches ROADMAP.md success criterion 5 + spec §4.5 | ✓        |
| Add CI integration                     | Out of milestone scope                             |          |

**Auto-selected:** local-only. Reason: explicitly excluded from milestone; future CI workstream picks it up.

### Sub-decision: locale assumption

| Option                                                                        | Description              | Selected |
| ----------------------------------------------------------------------------- | ------------------------ | -------- |
| Assume `en` (existing default Plane locale) + document precondition in README | Matches existing E2E env | ✓        |
| Assert in both `en` and `ja` via `expect.or`                                  | More resilient           |          |
| Pin workspace locale at setup time                                            | Most invasive            |          |

**Auto-selected:** assume `en`. Reason: simplest; flag as a known precondition; widen via deferred idea if a non-en dev hits it.

---

## Concurrency / parallelism

| Option                                                                   | Description                    | Selected |
| ------------------------------------------------------------------------ | ------------------------------ | -------- |
| Inherit existing `playwright.config.ts` (workers=1, fullyParallel=false) | No change needed               | ✓        |
| Increase workers                                                         | Would race on shared workspace |          |

**Auto-selected:** inherit. Reason: existing single-shared-workspace data model rules out parallelism.

---

## Lint, formatting, OxLint budget

| Option                           | Description                   | Selected |
| -------------------------------- | ----------------------------- | -------- |
| 0 new warnings, no budget change | Existing 3 specs already at 0 | ✓        |
| Bump budget for the new specs    | Against ratcheting rule       |          |

**Auto-selected:** 0 new warnings.

---

## Test naming / ID traceability

| Option                       | Description                                           | Selected |
| ---------------------------- | ----------------------------------------------------- | -------- |
| `#N [TEST-NN] description`   | Combines existing `#N` numbering + requirement-ID tag | ✓        |
| `[TEST-NN] description` only | Loses the `#N` precedent                              |          |
| `description` only           | No traceability                                       |          |

**Auto-selected:** combined. Reason: keeps existing `#N` style; adds tag for /gsd-verify-work to mark requirement complete.

---

## Known fragility & retry strategy

### Sub-decision: block-mousedown approach

| Option                                                                                     | Description                                             | Selected |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------- | -------- |
| Native `page.mouse.move` + `page.mouse.down` first; fall back to `dispatchEvent` if needed | Block body is not pointer-events-blocked                | ✓        |
| Always use `dispatchEvent("mousedown", ...)`                                               | Existing handle-drag pattern, more robust but synthetic |          |

**Auto-selected:** native first, dispatchEvent fallback. Reason: block body has live `onMouseDown` handler; dispatchEvent only needed when DOM is pointer-blocked (not the case here).

### Sub-decision: post-drag DOM assertion

| Option                                                               | Description                             | Selected |
| -------------------------------------------------------------------- | --------------------------------------- | -------- |
| `expect.poll(getBlockBox).toMatchObject(...)` with default 5s window | Tolerates MobX reactivity flush latency | ✓        |
| Immediate assertion + manual `page.waitForTimeout`                   | Fragile + adds explicit sleep           |          |

**Auto-selected:** `expect.poll`. Reason: idiomatic Playwright pattern; tolerates MobX `runInAction` per-issue write-back latency without arbitrary sleep.

---

## Test harness for Phase 6 itself

| Option                   | Description                                   | Selected |
| ------------------------ | --------------------------------------------- | -------- |
| Zero new harness         | Use existing Playwright + extend POM/fixtures | ✓        |
| Add Vitest in `apps/web` | Phase 4 D-01 already deferred this            |          |
| Add visual regression    | Out of scope                                  |          |

**Auto-selected:** zero new harness.

---

## Claude's Discretion

User accepted all auto-mode recommended options across every gray area. Specific items the user may want to revisit during plan-phase or before sign-off:

- **Failure-code choice (D-02):** `INCOMPLETE_SCHEDULE` is the lowest-flake / highest-coverage pick. Adding a `SCHEDULE_CHANGED` second case is straightforward (recipe in deferred ideas).
- **Block-mousedown pattern (D-12):** start native, fall back to dispatchEvent. Plan-phase locks one path after first smoke test.
- **Bounding-box tolerance (D-04c):** `±2px` is conservative; raise only on observed flake.
- **Locale assumption (D-04b / D-08a):** if dev's workspace runs `ja`, plan-phase MUST flag and either assert both locales or pin to `en` at setup.
- **Mid-drag visual preview E2E:** Phase 5 D-02 / D-02b ships the rendering; observation kept manual per Phase 5 D-11a; not promoted to E2E here.

---

## Deferred Ideas

Captured in `06-CONTEXT.md` `<deferred>` section. Headlines:

- `SCHEDULE_CHANGED` E2E variant (recipe documented for future close)
- `PROPAGATION_LIMIT_EXCEEDED` E2E variant (heavy seed cost)
- `DEPENDENCY_CYCLE` E2E variant (UI cycle-check.ts complications)
- Hidden-update notification E2E (Phase 4 helper-level coverage already pins it)
- Drag chain / branch / merge E2E (unit/Vitest already extensive)
- Mid-drag visual preview E2E (high flake)
- Backward / leftward drag E2E (unit-pinned)
- CI integration (explicit milestone-level out-of-scope)
- Visual regression / screenshot diff harness
- Performance / latency assertions
- Locale-aware toast assertion (`ja`)
- `@plane/propel/toast` `data-testid` addition (drive-by prod change rejected)
- Block-mousedown via `dispatchEvent` (D-12 fallback)
