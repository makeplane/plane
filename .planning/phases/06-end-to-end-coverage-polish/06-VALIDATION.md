---
phase: 6
slug: end-to-end-coverage-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-04
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Phase 6 is **pure E2E coverage** — the test framework IS the validation surface.

---

## Test Infrastructure

| Property               | Value                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| **Framework**          | Playwright (`@playwright/test` ^1.48, already in `apps/web` devDeps)                            |
| **Config file**        | `apps/web/e2e/playwright.config.ts` (existing — Phase 6 makes zero changes per CONTEXT.md D-09) |
| **Quick run command**  | `pnpm --filter=web exec playwright test --config=e2e/playwright.config.ts --grep "<test-id>"`   |
| **Full suite command** | `pnpm --filter=web test:e2e`                                                                    |
| **Estimated runtime**  | ~30–60s (setup project ~10s + 5 specs at ~5–10s each)                                           |

**Preconditions** (developer-side, documented in `apps/web/e2e/README.md`):

- `docker compose -f docker-compose-local.yml up` running (Postgres + Django api + Celery + redis + minio)
- `pnpm dev` running (web:3000)
- `apps/web/e2e/.env.e2e` populated
- Workspace UI locale = `en` (D-04b precondition)
- Project's Issue layout = Gantt

---

## Sampling Rate

- **After every task commit (quick):** Run the spec(s) the task touches via `--grep`. Examples:
  - After implementing TEST-23: `pnpm --filter=web exec playwright test --config=e2e/playwright.config.ts --grep "TEST-23"`
  - After implementing TEST-24: `pnpm --filter=web exec playwright test --config=e2e/playwright.config.ts --grep "TEST-24"`
  - After fixture/POM changes (smoke): `pnpm --filter=web exec playwright test --config=e2e/playwright.config.ts --grep "smoke"` (the placeholder smoke spec from D-13a)
- **After every plan wave:** Run `pnpm --filter=web test:e2e` — full suite (5 tests: existing 3 relation-creation + new 2 propagation).
- **Before `/gsd-verify-work`:** Full suite GREEN twice consecutively (idempotency check per CONTEXT.md "Sixth task" + Plan-phase Task 14 in `docs/timeline-e2e-test-environment-plan.md`).
- **Max feedback latency:** ~60s (full suite); ~5–10s (single test via --grep).

---

## Per-Task Verification Map

> Concrete tasks finalized during plan-phase. The map below pre-stages the requirement / threat / file-exists axes for the **expected** Wave 1 + Wave 2 tasks per Research §"Plan Decomposition Recommendation". Plan-phase confirms / adjusts.

| Task ID  | Plan | Wave | Requirement       | Threat Ref | Secure Behavior              | Test Type                   | Automated Command                                               | File Exists                                                                  | Status     |
| -------- | ---- | ---- | ----------------- | ---------- | ---------------------------- | --------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------- |
| 06-01-01 | 01   | 1    | (infra)           | —          | N/A                          | smoke                       | `pnpm --filter=web test:e2e --grep "placeholder"`               | ❌ W0 (creates `06-end-to-end-coverage-polish/...spec.ts`)                   | ⬜ pending |
| 06-01-02 | 01   | 1    | (infra)           | —          | N/A                          | unit (lint+type)            | `pnpm --filter=web check:lint && pnpm --filter=web check:types` | ✅                                                                           | ⬜ pending |
| 06-01-03 | 01   | 1    | (helper)          | —          | CSRF + storageState reuse    | smoke                       | `pnpm --filter=web test:e2e --grep "smoke: relation seed"`      | ❌ W0 (modifies `apps/web/e2e/fixtures/api.ts`)                              | ⬜ pending |
| 06-01-04 | 01   | 1    | (helper)          | —          | CSRF + idempotent cleanup    | smoke                       | `pnpm --filter=web test:e2e --grep "smoke: clearIssueDate"`     | ❌ W0 (modifies `apps/web/e2e/fixtures/api.ts`)                              | ⬜ pending |
| 06-01-05 | 01   | 1    | (helper)          | —          | session-cookie auth          | smoke                       | `pnpm --filter=web test:e2e --grep "smoke: getIssue"`           | ❌ W0 (modifies `apps/web/e2e/fixtures/api.ts`)                              | ⬜ pending |
| 06-01-06 | 01   | 1    | (POM)             | —          | DOM-derived dayWidth         | smoke                       | `pnpm --filter=web test:e2e --grep "smoke: dragBlockBy"`        | ❌ W0 (modifies `apps/web/e2e/pages/timeline.page.ts`)                       | ⬜ pending |
| 06-01-07 | 01   | 1    | (fixture)         | —          | cascade cleanup              | unit (lint+type)            | `pnpm --filter=web check:types`                                 | ❌ W0 (modifies `apps/web/e2e/fixtures/test-fixtures.ts`)                    | ⬜ pending |
| 06-02-01 | 02   | 2    | TEST-23           | —          | wire URL match + persistence | E2E                         | `pnpm --filter=web test:e2e --grep "TEST-23"`                   | ❌ W0 (creates `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts`) | ⬜ pending |
| 06-02-02 | 02   | 2    | TEST-24           | —          | rollback + i18n message      | E2E                         | `pnpm --filter=web test:e2e --grep "TEST-24"`                   | ❌ W0 (modifies the spec file)                                               | ⬜ pending |
| 06-02-03 | 02   | 2    | TEST-23 + TEST-24 | —          | regression                   | E2E (full + 2x idempotency) | `pnpm --filter=web test:e2e && pnpm --filter=web test:e2e`      | ✅                                                                           | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Phase 6 has NO Wave 0 framework-install tasks — Playwright is already installed (Phase 1's E2E plan task 1 added `@playwright/test`). The "Wave 0 file creation" rows above mark NEW or MODIFIED files that don't exist yet at planning time but will be authored as the FIRST step of each task.

- [ ] `apps/web/e2e/specs/timeline-dependency-propagation.spec.ts` — NEW spec file (created by Task 06-01-01 with placeholder, populated by Tasks 06-02-01 / 06-02-02)
- [ ] `apps/web/e2e/fixtures/api.ts` — MODIFY (additive: `createIssueRelation`, `clearIssueDate`, `getIssue`)
- [ ] `apps/web/e2e/fixtures/test-fixtures.ts` — MODIFY (additive: `propagationPair`, `propagationTimeline`)
- [ ] `apps/web/e2e/pages/timeline.page.ts` — MODIFY (additive: `dragBlockBy`, `getBlockBox`)

_Existing infrastructure (Playwright config, auth.setup, env.ts) covers all other needs._

---

## Manual-Only Verifications

| Behavior                                                                  | Requirement                | Why Manual                                                                                                                                                                                                         | Test Instructions                                                                                                                                 |
| ------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12 of the 14 Phase 5 D-11a smoke scenarios that are NOT TEST-23 / TEST-24 | (manual smoke per Phase 5) | E2E for chain/branch/merge/limit/cycle/cross-project/permission/invalid-range/schedule-changed/hidden-update/backward-drag/mid-drag-preview is heavy seed cost or timing-fragile (CONTEXT.md `<deferred>` section) | Phase 5 D-11a checklist — run against docker-compose-local during /gsd-verify-work                                                                |
| UI locale = `en` precondition check                                       | TEST-24 D-04b              | The toast text assertion is locale-specific; a non-en workspace causes false-fail                                                                                                                                  | Before running `pnpm --filter=web test:e2e`, open `http://localhost:3000` and confirm UI is English. If not: switch via user profile preferences. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (every task above has a per-task `--grep` smoke or full-suite gate)
- [ ] Wave 0 covers all MISSING references (4 file creations / modifications listed above)
- [ ] No watch-mode flags (`pnpm --filter=web test:e2e` uses default non-watch run)
- [ ] Feedback latency < 60s (single-test --grep is ~5–10s; full suite ~30–60s)
- [ ] `nyquist_compliant: true` set in frontmatter (after plan-phase verification)

**Approval:** pending — to be set on plan-phase completion.

---

## Notes for the planner

- **No new test framework.** Playwright + the existing fixture/POM patterns are the entire validation surface. Do NOT propose Vitest, Jest, or any other harness for Phase 6.
- **Smoke tests serve as TDD red-rungs.** Tasks 06-01-03 / 06-01-04 / 06-01-05 / 06-01-06 each ship a self-contained smoke `test()` that fails until the helper/POM works. These are deleted (or kept under `test.skip(...)`) after the consumer test (TEST-23 / TEST-24) passes — locked during plan-phase.
- **Idempotency check is mandatory.** The final task runs the full suite TWICE. Cleanup leakage (un-deleted issues / orphan IssueRelation rows) would fail the second run.
- **TEST-24's failure-trigger ordering is critical** (Research §10): seed propagationPair → goto Gantt → waitForBlock both → THEN `clearIssueDate(tgt, "target_date")` → drag. Reversing the order means the UI never hydrates `tgt` with `target_date`, and `isBlockComplete` becomes false → drag won't fire (D-12a guard). Plan-phase locks the test body order.
