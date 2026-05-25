---
title: "Web/API Performance Optimization"
description: ""
status: pending
priority: P2
branch: "ngoc-feat/categories"
tags: []
blockedBy: []
blocks: []
created: "2026-05-22T08:27:36.710Z"
createdBy: "ck:plan"
source: skill
---

# Web/API Performance Optimization

## Overview

Optimize Plane web+API performance based on findings from two debug reports (2026-05-22). Symptoms: 17.5s login on dev, 1442 ES modules per authenticated page, `/api/ho/filter-options/` TTFB 400ms firing twice, 27 bootstrap XHRs on profile page, silent 404 on `staff-profile`. Strategy: measure prod baseline first (Phase 1), then attack dev-mode module bloat (Phase 2), then backend query hot spots + silent 404 (Phase 3), then collapse profile bootstrap waterfall (Phase 4).

**Source reports:**

- `plans/reports/debug-260522-1429-cache-disabled-slow-login.md`
- `plans/reports/debug-260522-1514-authenticated-pages-perf.md`

**Out of scope:** Perceived-latency UX (logo-spinner on Sign In) — small win, deferred.

## Phases

| Phase | Name                                                                                               | Status                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1     | [Production Build Benchmark](./phase-01-production-build-benchmark.md)                             | **Done** (see `artifacts/prod-summary.md`)                                                                      |
| 2     | [Vite Dev-Mode Speedup](./phase-02-vite-dev-mode-speedup.md)                                       | **Skipped** — failed success criteria (wall ↓4.3%, modules ↓1.7%); reverted. See `artifacts/phase2-summary.md`. |
| 3     | [Backend /ho/ Hot Spots + staff-profile 404](./phase-03-backend-ho-hot-spots-staff-profile-404.md) | Pending                                                                                                         |
| 4     | [Profile-Page XHR Batching](./phase-04-profile-page-xhr-batching.md)                               | Pending (hard-gate evaluated: PROCEED — aggNet 9.8s >3s threshold)                                              |

## Dependencies

<!-- Cross-plan dependencies -->

## Red Team Review

**Session:** 2026-05-22 — 3 adversarial reviewers (Scope Critic, Evidence Auditor, Risk Surveyor). 27 raw findings → 12 deduplicated → all 12 accepted by user.

| #   | Severity | Phase | Finding                                                                                                                                                            | Disposition                                                                                                                     |
| --- | -------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Critical | 3-C   | staff-profile URL was already correct (`staff.service.ts:104` matches `urls/staff.py:17`); `my-staff-profile.service.ts` is dead. 404 is data-driven, not routing. | Track C rewritten: delete dead service, investigate real cause.                                                                 |
| 2   | High     | 4     | Composite endpoint duplicates `members`/`task_categories` already SWR-cached in `workspace-wrapper.tsx:95` + `content-wrapper.tsx:31` → dual truth.                | Exclude both from payload; single code path (no SWR fallback); partial-failure `{data,error}` schema; hard-gate behind Phase 1. |
| 3   | High     | 2     | Lazy-loading MobX stores is dev-only ROI with real cross-store `computed`/`reaction` race risk; prod bundle unaffected.                                            | Section removed entirely.                                                                                                       |
| 4   | High     | 2     | `apps/web` is RR7 framework mode wrapping Vite — `optimizeDeps`/`warmup` may be intercepted by `@react-router/dev/vite`.                                           | Added Step 0: single-entry probe with `--debug` before full rollout.                                                            |
| 5   | Medium   | 2     | Propel subpaths `select`/`checkbox` don't exist; canonical exports are `combobox`/`switch`/`menu`.                                                                 | Fixed include list; mandate verification against `packages/propel/package.json` exports.                                        |
| 6   | High     | 1     | `pnpm start` = `serve -s build/client` has no `/api` proxy → benchmark hits 404s.                                                                                  | Mandatory reverse-proxy step (Caddy/nginx); login-completes precheck before measuring.                                          |
| 7   | High     | 3-A   | `fetchFilterOptions` has 5 internal store callers beyond mount-time double-fire — undercounted in original plan.                                                   | Instrument with `console.trace()` first; consider store-level in-flight promise dedupe.                                         |
| 8   | High     | 3-A   | `store.filterOptions: null` initial value → null-race when child mount fetches removed.                                                                            | Added blocking null-guard audit step before code change.                                                                        |
| 9   | Medium   | 3-B   | Blind `prefetch_related("assignees","labels","work_logs")` wastes work if serializer doesn't emit them.                                                            | Serializer audit required first; only prefetch what's serialized; drop `work_logs` unless used.                                 |
| 10  | Medium   | 3-B   | `cache_response` before fixing root cause masks the problem; needs explicit key + invalidation.                                                                    | Deferred until after dedupe+EXPLAIN; if added, design signal-based invalidation.                                                |
| 11  | Medium   | 3-B   | Speculative composite index without EXPLAIN evidence is YAGNI; need atomic=False template.                                                                         | Gate strictly on EXPLAIN seq-scan evidence; reference `0168_add_issue_workitems_index.py` template.                             |
| 12  | Low      | All   | No rollback path documented per phase; no `clean:vite` helper for cache invalidation.                                                                              | Added Rollback section to every phase; added `clean:vite` root script in Phase 2.                                               |

**User scope reaffirmations (reviewer wanted to delete; user kept):**

- Phase 1 (production benchmark) — kept; Phase 4 hard-gated on it.
- Phase 4 (composite endpoint) — kept, hard-gated, scope-narrowed (excludes shared SWR-cached payloads).

## Validation Log

**Session 1 — 2026-05-22**

| Topic                                    | Decision                                                       | Phase impact                                                                            |
| ---------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Phase 1 reverse proxy choice             | **Caddy**                                                      | phase-01: Caddyfile is the canonical example; nginx/Node mentioned only as alternatives |
| Phase 3 Track A in-flight promise dedupe | **Only if traces show duplicates**                             | phase-03: gated on `artifacts/ho-filter-options-traces.txt` evidence                    |
| Phase 3 Track C staff-profile 404        | **Leave as intended behavior** (no DB seeding, no view change) | phase-03: C.3 confirms current hook silent-hide is the contract                         |
| Phase 4 cancel threshold                 | **Keep `wall <2s AND aggregated <3s`**                         | phase-04: thresholds unchanged                                                          |

### Whole-Plan Consistency Sweep (Red Team)

- All phase files re-read after edits. No remaining references to: "v1 staff-profile route", "lazy-load stores", `@plane/propel/select`, `@plane/propel/checkbox`, "fallback to SWR", "27 RTTs" as bare premise without Phase 1 gating.
- `phase-04` hard-gate language matches `phase-01` artifact path (`phase-01-.../artifacts/prod-summary.md`).
- Dead service reference (`my-staff-profile.service.ts`) consistently marked for deletion in Phase 3 only; not cited as live caller anywhere.
- Each phase has Rollback section.
- No unresolved contradictions across the plan.

### Whole-Plan Consistency Sweep (Validation Session 1)

- Phase 1: Caddy is now the canonical example; nginx/Node demoted to alternatives. No contradictions.
- Phase 3 A.4: dedupe gated on trace evidence; consistent with A.1 instrumentation step.
- Phase 3 C.3: 404 is intended; no DB seeding, no view change. Consistent with hook behavior in `use-my-staff-profile.ts`.
- Phase 4: thresholds unchanged; no propagation needed beyond marker.
- Zero unresolved contradictions. Plan is ready for `/ck:cook`.
