---
phase: 4
slug: frontend-service-client-mobx-preview-store
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-04
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4 (new for `@plane/utils`; same major as `packages/codemods` precedent) |
| **Config file** | `packages/utils/vitest.config.ts` (Wave 1 installs) |
| **Quick run command** | `pnpm --filter=@plane/utils test` |
| **Full suite command** | `pnpm --filter=@plane/utils test` |
| **Estimated runtime** | ~2 seconds (4 small pure-function tests) |
| **Pre-existing checks (still required)** | `pnpm check:types --filter=@plane/types --filter=@plane/services --filter=@plane/utils --filter=web`; `pnpm check:lint --filter=@plane/utils --filter=@plane/services --filter=@plane/types --filter=web`; backend tests must remain GREEN (`cd apps/api && python run_tests.py -u` for the 64 unit + `-c` for the 26 contract). |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter=@plane/utils test` if the task touched `packages/utils/src/timeline-propagation/` or `packages/utils/package.json` / `vitest.config.ts`. Otherwise run `pnpm check:types --filter=<touched>`.
- **After every plan wave:** Run BOTH `pnpm --filter=@plane/utils test` and `pnpm check` (full lint + types). Confirm `cd apps/api && python run_tests.py -c` still GREEN (Phase 3 contract regression guard).
- **Before `/gsd-verify-work`:** Full suite must be green: Vitest + types + lint across the four touched packages.
- **Max feedback latency:** ~30 seconds (vitest + per-package types are fast).

---

## Per-Task Verification Map

> Tasks below are the EXPECTED layout the planner will produce (Wave 1 = 5 tasks; Wave 2 = 2 tasks). Plan-phase may rename / merge but the shape (one Vitest run per helper test, one type-check per touched package, one lint check per wave) is the validation contract.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 04-01 | 1 | (D-02 / D-02b) | — | snake_case wire types compile + barrel-export | type | `pnpm check:types --filter=@plane/types` | ❌ W0 (Wave 0 creates the file) | ⬜ pending |
| 4-01-02 | 04-01 | 1 | (D-03 / D-03a / D-03c) | — | service file extends APIService and is barrel-exported | type | `pnpm check:types --filter=@plane/services` | ❌ W0 | ⬜ pending |
| 4-01-03 | 04-01 | 1 | (D-01 / D-01a / D-01b / D-10a) | — | Vitest harness installs and a smoke test runs GREEN | unit | `pnpm --filter=@plane/utils test` | ❌ W0 (Wave 0 installs harness + smoke test) | ⬜ pending |
| 4-01-04 | 04-01 | 1 | TEST-19 (FE-01 / FE-02) | — | `computeLoadedPreview` simple / chain / branch returns minimum-shift map | unit | `pnpm --filter=@plane/utils test` | ❌ | ⬜ pending |
| 4-01-05 | 04-01 | 1 | TEST-21 (FE-04) + TEST-22 (FE-06) | — | `applyServerWorkItems` replaces issues with server values; `diffHiddenUpdate` returns count of non-preview ids | unit | `pnpm --filter=@plane/utils test` | ❌ | ⬜ pending |
| 4-02-01 | 04-02 | 2 | FE-01 / FE-02 / FE-04 / FE-05 / FE-06 / FE-07 / FE-08 (D-05 / D-05a..e / D-08 / D-08a / D-09) | — | `TimelinePropagationStore` exposes 4-action surface + dual-observable error path | type | `pnpm check:types --filter=web` | ❌ | ⬜ pending |
| 4-02-02 | 04-02 | 2 | (D-06 / D-06a) | — | `TimeLineStore` constructs `timelinePropagationStore` and `ITimelineStore` includes the field | type+lint | `pnpm check:types --filter=web && pnpm check:lint --filter=web` | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

**Wave 0 = the test harness setup.** Phase 4 introduces Vitest to `@plane/utils` as a NEW harness; this is mandatory infrastructure before any helper test can run.

- [ ] `packages/utils/vitest.config.ts` — minimal config per CONTEXT.md D-01a (`environment: "node"`, `globals: true`, `include: ["src/**/*.test.ts"]`)
- [ ] `packages/utils/package.json` — gain `"test": "vitest run"` script + `"vitest": "^4.0.8"` devDep (matches `packages/codemods`)
- [ ] `packages/utils/src/timeline-propagation/__tests__/_smoke.test.ts` — single `expect(1 + 1).toBe(2)` test confirming the harness is wired BEFORE any propagation helper test is added (per RESEARCH §"Implementation Order")
- [ ] tsdown excludes the test files from `dist/` (already configured via `entry: ["src/index.ts"]` per RESEARCH §"Reusable Code Map"; Wave 1 verifies post-build via `pnpm --filter=@plane/utils build && find packages/utils/dist -name '*.test.*' | head` returning empty)

The smoke test is removed at the end of Wave 1 task 4-01-03 once the real preview tests exist (no need to ship a placeholder).

---

## Manual-Only Verifications

Phase 4 has zero user-visible behavior — Phase 5 owns rendering. There is nothing to verify manually in this phase. Phase 6 E2E (TEST-23 / TEST-24) covers the full stack including the store transitively.

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| _(none)_ | — | All Phase 4 behavior is exercisable via Vitest helper tests + TypeScript checks. The MobX store's flow is covered transitively by Phase 6 E2E (TEST-23 / TEST-24); no Phase 4 manual step is required. | — |

*All phase behaviors have automated verification (Vitest + tsc + Phase 6 E2E for store flow).*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (Wave 0 = vitest harness install in `packages/utils`)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (Wave 1 has type-check + Vitest at every task; Wave 2 has type-check at every task)
- [ ] Wave 0 covers all MISSING references (the new `vitest.config.ts` + `vitest` devDep are the only MISSING refs; Wave 1 task 4-01-03 installs them)
- [ ] No watch-mode flags (`vitest run`, not `vitest`; verified in `package.json` script)
- [ ] Feedback latency < 30s (Vitest + types-check on touched packages combined are well under 30s)
- [ ] `nyquist_compliant: true` set in frontmatter (set after plan-phase completes and the per-task verification map is reconciled with the actual PLAN.md task IDs)

**Approval:** pending
