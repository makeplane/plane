---
phase: 5
slug: drag-handler-integration-error-ux
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-04
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> **Phase 5 is wiring-only.** Per CONTEXT.md D-11 / D-11a / D-11b and RESEARCH.md §Validation Architecture, Phase 5 ships **zero new automated tests**. Validation is delegated to:
>
> - **Regression guard** — Phase 1+2 unit (64) + Phase 3 contract (26) + Phase 4 Vitest (11) suites must remain GREEN.
> - **Manual smoke checklist** — D-11a in CONTEXT.md (the 13 manual scenarios listed below).
> - **Phase 6** — Playwright TEST-23 / TEST-24 close the automation loop.

---

## Test Infrastructure

| Property                                    | Value                                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Framework (regression only)**             | pytest 7.x (`apps/api`), Vitest 4.x (`@plane/utils`)                                          |
| **Config files**                            | `apps/api/pytest.ini`, `packages/utils/vitest.config.ts`                                      |
| **Quick run command (frontend regression)** | `pnpm check` (oxlint + format + types)                                                        |
| **Quick run command (Vitest helpers)**      | `pnpm --filter @plane/utils test`                                                             |
| **Quick run command (API contract)**        | `cd apps/api && python run_tests.py -c`                                                       |
| **Full suite command**                      | `pnpm check && pnpm --filter @plane/utils test && (cd apps/api && python run_tests.py -u -c)` |
| **Estimated runtime**                       | ~120 s (lint+types ≈ 60 s; Vitest ≈ 5 s; pytest -u -c ≈ 60 s)                                 |

---

## Sampling Rate

- **After every task commit:** `pnpm check` (oxlint + types) for the touched package(s).
- **After Wave 1 (i18n keys + types):** `pnpm --filter @plane/i18n build` (if used) and `pnpm --filter @plane/types build`.
- **After Wave 2 (drag wiring + UI changes):** `pnpm --filter web type-check` and full `pnpm check`.
- **Before `/gsd-verify-work`:** Full regression suite (frontend + Vitest + pytest -u -c) must be green; manual D-11a smoke checklist completed.
- **Max feedback latency:** ≈ 120 s for full regression; ≈ 30 s for per-package check.

---

## Per-Task Verification Map

> Phase 5 has **no automated tests for new code.** Every task's verification is regression-only (existing suites remain green) plus manual smoke per D-11a. Plan-phase fills exact task IDs once plans are written.

| Task ID             | Plan | Wave | Requirement                  | Threat Ref | Secure Behavior                                | Test Type           | Automated Command                                                                          | File Exists | Status     |
| ------------------- | ---- | ---- | ---------------------------- | ---------- | ---------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------ | ----------- | ---------- |
| (filled by planner) | —    | —    | FE-03, FE-09, ERR-01..ERR-08 | —          | server-authoritative; XSS-safe toast text node | regression + manual | `pnpm check` ; `pnpm --filter @plane/utils test` ; `cd apps/api && python run_tests.py -c` | ✅ existing | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

_Existing infrastructure covers all regression checks. No new framework install needed for Phase 5._

- [x] Vitest already installed in `@plane/utils` (Phase 4 04-01 PLAN).
- [x] pytest already installed in `apps/api`.
- [x] OxLint configured at repo root (`.oxlintrc.json`).
- [x] No new dependencies (CONTEXT.md D-12a).

---

## Manual-Only Verifications

| Behavior                                                                                          | Requirement                   | Why Manual                                         | Test Instructions                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drag without violation — no error toast, no sibling shift                                         | FE-03                         | Wiring layer; visual outcome                       | Drag any unrelated work item rightward by 2 days; verify only that block moves; no toast appears; commit success.                                                                                                    |
| Drag with one-step propagation — successor preview shifts during drag, server replaces on success | FE-03, ERR-08 (negative form) | Visual + reactive                                  | Create `A blocking B` with adjacent dates; drag A right past B's start; observe B's preview shift during mousemove; on mouseup verify both blocks land at server-returned positions.                                 |
| Drag with chain propagation (3-node) — transitive shifts visible                                  | FE-03                         | Visual reactivity                                  | Create A→B→C chain; drag A right past C's start; observe transitive preview shifts; commit replaces all 3.                                                                                                           |
| `DEPENDENCY_CYCLE` toast                                                                          | ERR-01                        | UI integration with backend                        | 3-node cycle (force via direct relation factory); drag head; ERROR toast `timeline.propagation.error.dependency_cycle` appears; preview snaps back.                                                                  |
| `PROJECT_BOUNDARY_EXCEEDED` toast                                                                 | ERR-02                        | UI integration                                     | Cross-project relation (force via factory); drag predecessor; ERROR toast appears; snap back.                                                                                                                        |
| `INCOMPLETE_SCHEDULE` toast                                                                       | ERR-03                        | UI integration                                     | Successor with cleared `target_date` (PATCH via curl: `{"target_date": null}`); drag predecessor right; ERROR toast appears; snap back.                                                                              |
| `PROPAGATION_LIMIT_EXCEEDED` toast                                                                | ERR-04                        | UI integration                                     | Chain 101 work items via API factory; drag head; ERROR toast appears; snap back.                                                                                                                                     |
| `SCHEDULE_CHANGED` toast                                                                          | ERR-05                        | Concurrency / stale check                          | During drag (between mousedown and mouseup), curl `PATCH` to bump `updated_at`; on mouseup ERROR toast `schedule_changed` appears; snap back.                                                                        |
| `PERMISSION_DENIED` toast                                                                         | ERR-06                        | Auth integration                                   | Log in as GUEST member of project; drag; ERROR toast appears; snap back.                                                                                                                                             |
| `INVALID_DATE_RANGE` toast                                                                        | ERR-07                        | Defensive UI                                       | Bypass UI: direct API request with reversed dates returns code; toast appears (rare path; covered by Phase 3 contract test for backend; UI verification confirms i18n key fires).                                    |
| Hidden-update INFO toast — `count` matches server diff                                            | ERR-08 + (FE-03 carry-over)   | Visual + IntlMessageFormat plural                  | Filter Gantt to show only some blocks; drag a head whose successors include hidden chain members; observe INFO toast `"N additional work items updated"` (singular vs plural verified for `count=1` and `count>=2`). |
| Resize (left handle) — propagation NOT called                                                     | FE-09                         | Regression of D-01b                                | Resize a block via left handle; verify `updateIssueDates` runs (Network tab shows old endpoint); no propagation request fires.                                                                                       |
| Resize (right handle) — propagation NOT called                                                    | FE-09                         | Regression of D-01b                                | Same as above for right handle.                                                                                                                                                                                      |
| Module / Cycle / Project Gantt drag — propagation NOT called                                      | D-01c / D-03b                 | Regression of scope gate                           | Open Module Gantt; drag a block; verify `updateIssueDates` runs (no propagation request).                                                                                                                            |
| Dependency-creation drag (existing relation arrow drag) — UNCHANGED                               | FE-09, PROP-18                | Regression of `use-dependency-drag.ts` (untouched) | Hover block right edge; drag arrow to another block; verify the existing relation-create flow runs unchanged.                                                                                                        |
| `cycle-check.ts` immediate guard — UNCHANGED                                                      | PROP-18                       | Regression                                         | Attempt to create a cycle via dependency drag; verify the immediate UI cycle guard still blocks (cycle-check.ts not modified).                                                                                       |
| ja translations — Japanese phrasing renders correctly                                             | D-06a                         | i18n locale coverage                               | Switch UI language to ja; trigger each of the 7 errors; verify Japanese toast messages render with Ubiquitous Language ("作業項目" etc.).                                                                            |

_All Phase 5 user-visible behavior is exercised through this manual checklist. Phase 6 automates the happy path (TEST-23) + one failure path (TEST-24)._

---

## Validation Sign-Off

- [x] All tasks have regression-only verify (no new automated coverage by D-11)
- [x] Sampling continuity: regression suites run after every wave (no automated suite gaps because no new automated tests are introduced)
- [x] Wave 0 covers all dependencies (existing infra)
- [x] No watch-mode flags
- [x] Feedback latency < 120 s for full regression
- [ ] `nyquist_compliant: true` — **NOT applicable**; Phase 5 explicitly defers automated coverage per D-11. Frontmatter stays `false` and verification artifact records the deferral rationale.

**Approval:** pending — to be approved by `/gsd-verify-work` after Phase 5 plans complete and the manual smoke checklist runs against `docker-compose-local.yml + pnpm dev`.
