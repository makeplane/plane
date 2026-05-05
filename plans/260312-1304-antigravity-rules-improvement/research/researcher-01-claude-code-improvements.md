# Claude Code AI Agent Rules Gap Analysis: Phase Summary

**Research Date**: 2026-03-12
**Source**: `plans/260312-0803-ai-agent-rules-gap-analysis/` (6 phases completed)
**Context**: Plane.so project — rules improvements implemented across color tokens, backend patterns, frontend patterns, anti-hallucination, and testing infrastructure.

---

## Phase 1: Fix Critical Rule Contradictions

| Changed Rule File                      | Actual Change                          | Before → After                                                   | Portable to Antigravity                  |
| -------------------------------------- | -------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| `color-tokens.md`                      | Rewrote entire color naming convention | `text-color-primary` → `text-primary` (remove `-color-` infix)   | ✅ YES — if Antigravity uses Tailwind v4 |
| `frontend-implementation-checklist.md` | Updated 3 lines + Common Traps table   | Color token naming + flip token form priority                    | ✅ YES                                   |
| `plane-design-system.md`               | Updated Top 10 rule #3                 | Flipped color token form (legacy marker)                         | ✅ YES                                   |
| `mobx-stores.md`                       | Fixed `set()` import line              | `import { set } from "mobx"` → `import { set } from "lodash-es"` | ✅ YES — if using MobX + lodash-es       |
| `i18n-rules.md`                        | Removed admin app from scope           | Removed `apps/admin/**/*.tsx` from paths                         | ✅ YES — if admin is i18n-free           |

**Key Fix**: 3 critical contradictions where rules told AI wrong patterns. 87% of codebase uses short-form tokens, yet rules said long-form. All store files use `lodash-es` for `set()`, yet rules said `mobx`.

---

## Phase 2: Add Missing Backend Rules

| Target Rule File                | New Section Added               | Content                                                                                         | Portable to Antigravity                                                 |
| ------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `backend-views.md`              | Instance Admin Views section    | `BaseAPIView` + `InstanceAdminPermission` pattern for God Mode endpoints (not workspace-scoped) | ✅ PARTIAL — only if Antigravity has similar instance/admin distinction |
| `backend-urls-celery.md`        | Task Registration section       | Critical: new Celery tasks MUST be registered in `plane/celery.py` `CELERY_IMPORTS` list        | ✅ PARTIAL — only if using Celery                                       |
| `plane-backend-architecture.md` | v0/v1/License decision guidance | 3-layer API distinction: v0 (internal session), v1 (external API key), license (instance admin) | ✅ PARTIAL — only if using same 3-layer model                           |

**Key Addition**: Instance Admin pattern (`BaseAPIView` + `InstanceAdminPermission`) — common mistake is using workspace patterns for instance-level endpoints.

---

## Phase 3: Add Missing Frontend Rules

| Target Rule File                       | New Section Added                 | Content                                                                                                               | Portable to Antigravity                    |
| -------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `routing-layouts.md`                   | React Router v7 Advanced Patterns | 3 subsections: type-safe params via `Route.ComponentProps`, route groups (parenthesized dirs), SSR vs CSR distinction | ✅ PARTIAL — only if using React Router v7 |
| `mobx-stores.md`                       | Data Fetching: SWR vs Store       | `useSWR` for read-only + cache; `store.fetchX()` for mutations/shared state. Rule: never mix patterns.                | ✅ YES — if using SWR + MobX               |
| `frontend-implementation-checklist.md` | (Coordinated fix with Phase 1)    | Common Traps table corrected after Phase 1 token naming fix                                                           | ✅ YES                                     |

**Key Addition**: Data fetching decision rule — two coexisting patterns must be explicitly chosen per domain. SSR loaders ONLY for `apps/space`.

---

## Phase 4: Anti-Hallucination Hardening

| Target Rule File                | New Section Added                            | Content                                                                                                       | Portable to Antigravity                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `development-rules.md`          | Post-Implementation Verification (MANDATORY) | 4 verification gates: compile check, import verification, pattern check, no-duplication check                 | ✅ YES — language-agnostic principle                      |
| `plane-design-system.md`        | Canonical Imports table                      | 10 rows: correct sources for mobx, lodash-es, swr, react-router, @plane/\* packages + explicit ❌ NEVERs      | ✅ PARTIAL — adapt package list to Antigravity tech stack |
| `plane-backend-architecture.md` | Canonical Imports table                      | 7 rows: correct import sources for plane views, permissions, tasks, logging                                   | ✅ PARTIAL — adapt to Antigravity backend                 |
| `development-rules.md`          | Testing Integrity rules                      | Real data only (no mocks except API boundaries), test behavior not implementation, >3 mocks = refactor needed | ✅ YES — universal QA principle                           |

**Key Hardening**: Verification gates + canonical imports prevent ~20% of AI hallucination (slopsquatting). Negative examples ("NEVER import X from Y") more effective than positive.

---

## Phase 5: Legacy Token Cleanup

**SKIPPED** (code changes only, not rule content — ESLint plugin configuration + bulk token migration script already executed in prior sessions).

---

## Phase 6: Add Formatting & Testing Rules

| Created/Modified Rule File     | Content                                                                                                      | Portable to Antigravity                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `prettier-formatting.md` (NEW) | Prettier config: 120-char width (NOT 80), es5 trailing comma, @prettier/plugin-oxc                           | ✅ YES — if using Prettier with same config  |
| `backend-testing.md` (NEW)     | `run_tests.py` flags + markers: `-u` (unit), `-c` (contract), `-s` (smoke), `-p` (parallel), `-o` (coverage) | ✅ PARTIAL — if using same test runner       |
| `development-rules.md`         | ESLint context: v9 flat config, typed linting enabled, prefer top-level type imports (`import type { X }`)   | ✅ PARTIAL — if using ESLint v9 + TypeScript |

**Key Specs**:

- Prettier: 120-char width (unusual — most default 80)
- Type imports: top-level syntax enforced by typed linting
- Test runner: custom `run_tests.py` with markers

---

## Portability Summary to Antigravity

| Phase                      | Fully Portable                        | Partial (adapt)                             | Not Applicable |
| -------------------------- | ------------------------------------- | ------------------------------------------- | -------------- |
| **1** (Color tokens)       | ❌ Tailwind-specific                  | —                                           | ✅ YES         |
| **2** (Backend patterns)   | ❌ Plane-specific                     | Instance admin pattern, Celery registration | —              |
| **3** (Frontend patterns)  | ❌ React/Router v7                    | SSR/CSR distinction, SWR + store pattern    | —              |
| **4** (Anti-hallucination) | ✅ YES (verification gates + testing) | Canonical imports (adapt package names)     | —              |
| **6** (Testing/Formatting) | ❌ Tool-specific                      | ESLint v9 context, test runner markers      | —              |

**Directly Applicable to Antigravity**:

- Verification gates framework (Step 1, Phase 4)
- Anti-mock testing principle (Step 4, Phase 4)
- Rule maintenance self-check pattern (Step 5, Phase 4)

**Requires Adaptation for Antigravity**:

- Canonical imports tables (substitute Antigravity tech stack)
- Color token naming (if Antigravity uses different design system)
- API layer distinction (if Antigravity has similar v0/v1/license pattern)

---

## Unresolved Questions

1. Does Antigravity use Tailwind v4, or a different CSS framework? (affects Phase 1 portability)
2. Does Antigravity distinguish instance admin / workspace admin roles? (affects Phase 2 patterns)
3. What is Antigravity's primary tech stack (frontend framework, backend, test runner)? (affects Phase 3, 6 adaptation)
4. Are there existing Antigravity rule files that need similar contradiction fixes?
