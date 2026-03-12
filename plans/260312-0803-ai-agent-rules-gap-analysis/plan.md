---
title: "AI Agent Rules Gap Analysis & Fix"
description: "Fix incorrect rules, add missing patterns, harden anti-hallucination for Plane.so AI agents"
status: complete
priority: P1
effort: 3h
branch: develop
tags: [ai-rules, gap-analysis, anti-hallucination, dx]
created: 2026-03-12
---

# AI Agent Rules Gap Analysis & Fix

## Problem

15 gaps found between `.claude/rules/` files and actual codebase. 3 critical contradictions cause AI to generate wrong code (wrong color tokens, wrong MobX import, i18n applied to admin app).

## Research

- [Plane Patterns Report](research/researcher-01-plane-patterns.md)
- [Anti-Hallucination Report](research/researcher-02-anti-hallucination.md)

## Phases

| #   | Phase                                                                            | Priority | Effort | Status   |
| --- | -------------------------------------------------------------------------------- | -------- | ------ | -------- |
| 1   | [Fix Critical Rule Contradictions](phase-01-fix-critical-rule-contradictions.md) | P1       | 45m    | complete |
| 2   | [Add Missing Backend Rules](phase-02-add-missing-backend-rules.md)               | P2       | 45m    | complete |
| 3   | [Add Missing Frontend Rules](phase-03-add-missing-frontend-rules.md)             | P2       | 45m    | complete |
| 4   | [Anti-Hallucination Hardening](phase-04-anti-hallucination-hardening.md)         | P2       | 45m    | complete |
| 5   | [Legacy Token Cleanup](phase-05-legacy-token-cleanup.md)                         | P3       | 30m    | complete |
| 6   | [Add Formatting & Testing Rules](phase-06-add-formatting-testing-rules.md)       | P2       | 30m    | complete |

## Execution Order

1 → 2+3 (parallel) → 4 → 6 → 5

**PR Strategy**: Phases 1-4+6 in one PR (rule file changes). Phase 5 in separate PR (bulk token cleanup + ESLint plugin).

## Research

- [Plane Dev Docs Review](../reports/researcher-260312-0838-plane-dev-docs-review.md)

## Scope

- **In scope**: Fix `.claude/rules/*.md` files, update `MEMORY.md`, bulk-replace legacy `text-color-*` → `text-*` in codebase, add formatting/testing/linting rules
- **Out of scope**: Non-token app code changes, new features, upstream contributing conventions

## Key Constraint

Every rule statement must be verified against actual codebase via grep before writing. No assumptions.

## Success Criteria

- Zero contradictions between rule files and codebase patterns (verified by grep)
- All 3 P1 gaps fixed (color tokens, set import, i18n scope)
- Instance admin pattern documented
- Anti-hallucination checkpoints embedded in rule files
- Legacy `text-color-*` usage replaced with `text-*` across codebase

## Validation Log

### Session 1 — 2026-03-12

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Color token CSS variables use double-namespace (`--text-color-color-primary`) but Tailwind generates short-form utilities (`text-primary`). Plan removes the 'Infrastructure Naming' section from color-tokens.md. Keep technical explanation or remove?
   - Options: Remove section (Recommended) | Keep but clarify | Move to docs/
   - **Answer:** Remove section
   - **Rationale:** Short form `text-primary` is what devs write. Infrastructure details about CSS vars cause confusion. Cleaner rules = less AI confusion.

2. **[Scope]** Plan scope is 'rule files only'. The 13% legacy code still uses `text-color-primary` (long form). Should we also clean up legacy codebase usage?
   - Options: Rules only (Recommended) | Rules + legacy cleanup | Rules + lint rule
   - **Answer:** Rules + legacy cleanup
   - **Rationale:** Complete consistency prevents AI from seeing mixed patterns in codebase and getting confused about which is correct.

3. **[Scope]** Phase 4 modifies parent project rules at `/Volumes/Data/SHBVN/.claude/rules/development-rules.md` AND plane.so rules. Parent rules apply to ALL projects. Should verification gates go in parent or plane.so only?
   - Options: Plane.so only (Recommended) | Both parent + plane.so | Parent only
   - **Answer:** Plane.so only
   - **Rationale:** Verification gates and canonical imports are Plane-specific. Parent rules stay generic. No cross-project side effects.

4. **[Architecture]** Phase 3 adds SWR data fetching guidance to `mobx-stores.md`. SWR is not MobX-related. Where should this go?
   - Options: In mobx-stores.md (Recommended) | New data-fetching.md | In api-services.md
   - **Answer:** In mobx-stores.md
   - **Rationale:** Devs need SWR vs store decision at point-of-use. Side-by-side comparison in one file helps. Avoids creating yet another rule file.

#### Confirmed Decisions

- **Color tokens section**: Remove "Infrastructure Naming" section entirely from color-tokens.md
- **Scope expansion**: Add Phase 5 for bulk-replacing legacy `text-color-*` → `text-*` in codebase
- **Verification gates**: Only in plane.so `.claude/rules/development-rules.md`, NOT parent project
- **SWR guidance**: Keep in `mobx-stores.md` alongside store patterns

#### Action Items

- [ ] Add Phase 5: Legacy Token Cleanup (bulk-replace `text-color-*` in codebase)
- [ ] Update Phase 1: Confirm "Infrastructure Naming" section removal
- [ ] Update Phase 4: Remove parent project modification, keep plane.so only

#### Impact on Phases

- Phase 1: Confirmed removal of "Infrastructure Naming" section (already in plan, no change needed)
- Phase 3: SWR placement confirmed in mobx-stores.md (already in plan, no change needed)
- Phase 4: Remove `/Volumes/Data/SHBVN/.claude/rules/development-rules.md` from related files — only modify plane.so rules
- New Phase 5: Bulk-replace `text-color-*` → `text-*` across apps/web, apps/admin, apps/space .tsx files

### Session 2 — 2026-03-12

**Trigger:** Re-validation before implementation — risk assessment, execution order, scope confirmation
**Questions asked:** 3

#### Questions & Answers

1. **[Risk]** Phase 5 replaces `border-color-subtle` → `border-subtle` via bulk sed. In Tailwind v4, `border-color-*` is a standard utility for border colors. Have you verified these are all custom Plane tokens (not standard Tailwind utilities) so bulk replacement won't break styling?
   - Options: Yes, all custom tokens (Recommended) | Not verified, grep first | Skip border-color-_, only text-color-_
   - **Answer:** Yes, all custom tokens
   - **Rationale:** All `border-color-*` tokens in the codebase are custom Plane design tokens, not standard Tailwind utilities. Safe to bulk-replace.

2. **[Execution]** What execution order for the 5 phases? Plan implies Phase 1 first (fixes contradictions others depend on), then 2+3 parallel, then 4, then 5.
   - Options: 1 → 2+3 parallel → 4 → 5 (Recommended) | 1 → 2+3+5 parallel → 4 | Sequential 1→2→3→4→5
   - **Answer:** 1 → 2+3 parallel → 4 → 5
   - **Rationale:** Phase 1 fixes foundations all others depend on. Phases 2+3 are independent (backend vs frontend). Phase 4 needs 1-3 complete. Phase 5 is lowest priority, runs last.

3. **[Scope]** Phase 5 mentions 'consider adding ESLint custom rule to prevent future regression' of legacy tokens. Should we include this in scope?
   - Options: No, out of scope (Recommended) | Yes, add ESLint rule | Add TODO comment only
   - **Answer:** Yes, add ESLint rule
   - **Rationale:** Prevents future regression of legacy token usage. Worth the effort since Phase 5 already touches all the files.

#### Confirmed Decisions

- **Border-color tokens**: All custom Plane tokens, safe for bulk replacement
- **Execution order**: 1 → 2+3 parallel → 4 → 5
- **ESLint rule**: In scope for Phase 5 — add custom ESLint rule to warn on `text-color-*`/`border-color-*` usage

#### Action Items

- [ ] Update Phase 5: Add ESLint custom rule implementation step
- [ ] Document execution order in plan.md overview

#### Impact on Phases

- Phase 5: Add ESLint custom rule step — create rule that warns on `text-color-*` and `border-color-*` in .tsx files
- Plan overview: Document execution order (1 → 2+3 parallel → 4 → 5)

### Session 3 — 2026-03-12

**Trigger:** Final validation before implementation — resolve internal contradictions, confirm ESLint approach, file creation strategy
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 5 adds an ESLint custom rule to warn on legacy `text-color-*`/`border-color-*` tokens. Which implementation approach should we use?
   - Options: no-restricted-syntax (Recommended) | Custom ESLint plugin | Skip ESLint rule entirely
   - **Answer:** Custom ESLint plugin
   - **Rationale:** Custom plugin in `packages/eslint-plugin-plane/` provides auto-fix capability, replacing legacy tokens automatically. Better DX despite more effort (~50 lines + config).

2. **[Architecture]** Phase 6 creates 2 NEW rule files (`prettier-formatting.md`, `backend-testing.md`), but Phases 2-3 explicitly say 'concise additions to existing files, not new rule files'. Should Phase 6 create new files or follow the same pattern?
   - Options: Create new files (Recommended) | Add to existing files | Create new + add ESLint to existing
   - **Answer:** Create new files
   - **Rationale:** Prettier and testing are distinct domains with own `paths:` scoping. New focused files keep each rule file under 150 lines and load only when relevant.

3. **[Scope]** Phase 1 risk mitigation says 'do not convert existing legacy code, but always use short form for new code'. But Phase 5 explicitly bulk-converts all existing legacy tokens. This is contradictory. How should we resolve?
   - Options: Remove Phase 1 caveat (Recommended) | Keep both, add context
   - **Answer:** Remove Phase 1 caveat
   - **Rationale:** Phase 5 handles full cleanup. Rules should say 'only short form allowed, period'. No need for "legacy OK" caveat.

#### Confirmed Decisions

- **ESLint rule**: Custom plugin in `packages/eslint-plugin-plane/` with auto-fix for legacy token replacement
- **Phase 6 files**: Create new `prettier-formatting.md` and `backend-testing.md` (distinct domains justify new files)
- **Phase 1 contradiction**: Remove "do not convert existing" risk mitigation — short form is the only form

#### Action Items

- [ ] Update Phase 5: Specify custom ESLint plugin approach with auto-fix in `packages/eslint-plugin-plane/`
- [ ] Update Phase 1: Remove "do not convert existing" from risk mitigation
- [ ] Phase 6: No change needed (already creates new files)

#### Impact on Phases

- Phase 1: Remove "do not convert existing, but always use short form for new code" from Risk Assessment — replace with "short form is the only accepted form"
- Phase 5: Update ESLint step to specify custom plugin in `packages/eslint-plugin-plane/rules/no-legacy-tokens.js` with auto-fix capability

### Session 4 — 2026-03-12

**Trigger:** Pre-implementation validation — incomplete replacement map, monorepo integration gaps, execution order
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** Phase 5's replacement map only covers `text-color-*` and `border-color-*`, but grep found 9+ occurrences of `bg-color-*` tokens (`bg-color-accent`, `bg-color-success-primary/10`, `bg-color-error/10`, etc.) plus missing variants like `text-color-error`, `border-color-accent`, `border-color-error/success/warning`. Should we expand the replacement scope?
   - Options: Expand to all _-color-_ (Recommended) | Only text-color-_ and border-color-_ | Expand + separate bg-color-\* phase
   - **Answer:** Expand to all _-color-_
   - **Rationale:** Full consistency in one pass. All `*-color-*` tokens are custom Plane design tokens. Replacing them all eliminates mixed patterns entirely.

2. **[Integration]** Phase 5 creates a new `packages/eslint-plugin-plane/` package. The pnpm workspace glob (`packages/*`) will auto-discover it, but the plan doesn't mention `pnpm install` to link it or turbo.json pipeline config. How should we handle monorepo integration?
   - Options: Add setup steps to Phase 5 (Recommended) | Use no-restricted-syntax instead | Defer ESLint plugin to separate PR
   - **Answer:** Add setup steps to Phase 5
   - **Rationale:** Explicit steps: create package.json, run pnpm install to link, add to eslint.config.mjs. No turbo pipeline needed (lint plugin has no build step).

3. **[Execution]** Phase 6 (Prettier/Testing rules) has no dependency on Phases 2-5 — it only creates new rule files and adds an ESLint section. Current order is `1 → 2+3 → 4 → 5 → 6`. Could Phase 6 run earlier to save time?
   - Options: Keep 5 → 6 sequential (Recommended) | Run 6 parallel with 5 | Run 6 parallel with 2+3
   - **Answer:** Keep 5 → 6 sequential
   - **Rationale:** Phase 6 adds ESLint context to development-rules.md, which Phase 4 also modifies. Sequential avoids merge conflicts.

#### Confirmed Decisions

- **Replacement scope**: Expand to ALL `*-color-*` patterns including `bg-color-*`, `text-color-error/success/warning`, `border-color-accent/error/success/warning`
- **ESLint plugin integration**: Add explicit monorepo setup steps (package.json, pnpm install, eslint.config.mjs registration)
- **Execution order**: Keep `1 → 2+3 parallel → 4 → 5 → 6` (no change)

#### Action Items

- [ ] Update Phase 5: Expand replacement map to include `bg-color-*` and missing `text-color-*`/`border-color-*` variants
- [ ] Update Phase 5: Add monorepo integration steps (pnpm install, eslint.config.mjs registration)
- [ ] Update Phase 5 ESLint rule: Pattern should match all `*-color-*` infix tokens, not just text/border

#### Impact on Phases

- Phase 5: Expand replacement map with `bg-color-accent` → `bg-accent`, `bg-color-success-primary` → `bg-success-primary`, `bg-color-danger-primary` → `bg-danger-primary`, `bg-color-error` → `bg-error`, `bg-color-success` → `bg-success`, `bg-color-warning` → `bg-warning`, `text-color-error` → `text-error`, `text-color-success` → `text-success`, `text-color-warning` → `text-warning`, `border-color-accent` → `border-accent`, `border-color-error` → `border-error`, `border-color-success` → `border-success`, `border-color-warning` → `border-warning`
- Phase 5: Add Steps 7-9 for monorepo integration: create package.json, pnpm install, register in eslint.config.mjs

### Session 5 — 2026-03-12

**Trigger:** Final pre-implementation validation — ESLint plugin scope, commit strategy, file scope
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 5's ESLint plugin matches 'string literals containing text-color-'. In practice, class names appear in className strings, cn()/clsx() calls, and template literals. Should the rule match ALL string literals in .tsx files (simpler but may flag false positives in comments/error messages) or only strings in className-like contexts?
   - Options: All string literals (Recommended) | className context only | Skip ESLint plugin entirely
   - **Answer:** All string literals
   - **Rationale:** Simpler implementation (~30 lines). Token names rarely appear outside class contexts so false positives are minimal. Auto-fix is safe either way.

2. **[Scope]** Phase 5 bulk-replaces 216+ files. Should this be a separate commit/PR from Phases 1-4 (rule file changes), or combined into one PR?
   - Options: Separate PR for Phase 5 (Recommended) | Single PR, separate commits | All in one commit
   - **Answer:** Separate PR for Phase 5
   - **Rationale:** Rule changes in one PR (easy review), token cleanup + ESLint plugin in another PR (bulk mechanical change, verifiable with grep).

3. **[Scope]** Phase 5 only targets .tsx files, but legacy tokens might also exist in .ts utility files (e.g., helper functions building class strings). Should we expand the file scope?
   - Options: tsx + ts files (Recommended) | tsx only (current plan) | tsx + ts + css + stories
   - **Answer:** tsx + ts files
   - **Rationale:** Covers utility files that build class strings. Excludes CSS variable definitions in tailwind-config.

#### Confirmed Decisions

- **ESLint plugin scope**: Match all string literals (simple approach, ~30 lines)
- **Commit strategy**: Phases 1-4+6 in one PR, Phase 5 in separate PR
- **File scope**: Expand to `.tsx` AND `.ts` files (not just `.tsx`)

#### Action Items

- [ ] Update Phase 5: Expand file scope from `.tsx` to `.tsx` + `.ts`
- [ ] Update Phase 5: ESLint rule targets all string literals (simple matching)
- [ ] Update plan.md: Note separate PR strategy for Phase 5

#### Impact on Phases

- Phase 5: Change all `.tsx`-only references to include `.ts` files — grep, sed, and ESLint rule scope
- Phase 5: ESLint rule implementation confirmed as simple string literal matching (~30 lines)
- Plan overview: Phase 5 should be a separate PR from Phases 1-4+6

### Session 6 — 2026-03-12

**Trigger:** Final pre-implementation validation — coordination conflict, bulk-replace safety, readiness
**Questions asked:** 3

#### Questions & Answers

1. **[Coordination]** Phase 1 (Step 2) and Phase 3 (Step 3) BOTH modify the same line 89 in `frontend-implementation-checklist.md` — flipping the Common Traps token. Since execution is 1 → 2+3 parallel, Phase 1 runs first and changes the line. Phase 3 then tries to find the OLD text that Phase 1 already replaced — causing a failed edit. How should we resolve this duplicate?
   - Options: Remove from Phase 3 (Recommended) | Remove from Phase 1 | Keep both, add guard
   - **Answer:** Remove from Phase 3
   - **Rationale:** Phase 1 already handles line 89. Eliminates duplicate work and prevents failed edit when Phase 3 can't find old text.

2. **[Risk]** `capacity-heatmap.tsx` has 3 `bg-color-*` occurrences. Heatmaps often build dynamic class names. If dynamic, sed replacing `bg-color-` → `bg-` would break them. Should Phase 5 manually review heatmap files before bulk replacement?
   - Options: Manual review first (Recommended) | Bulk replace all | Exclude bg-color-\*
   - **Answer:** Manual review first
   - **Rationale:** Inspect affected files for dynamic class construction before replacing. Static class names safe to replace; dynamic patterns need manual handling.

3. **[Readiness]** Plan has been through 5 validation sessions (16 questions). All decisions confirmed, action items propagated. Ready to proceed?
   - Options: Yes, proceed | One more review
   - **Answer:** Yes, proceed

#### Confirmed Decisions

- **Phase 3 Common Traps**: Remove Step 3 from Phase 3 — Phase 1 owns the `frontend-implementation-checklist.md` line 89 change
- **Phase 5 bg-color-\***: Manual review of heatmap and admin files before bulk sed — inspect for dynamic class construction
- **Readiness**: Plan validated, proceed to implementation

#### Action Items

- [ ] Remove Step 3 (Common Traps fix) from Phase 3
- [ ] Add manual review step to Phase 5 for bg-color-\* files before bulk replacement

#### Impact on Phases

- Phase 3: Remove Step 3 entirely (GAP 15 Common Traps fix) — already handled by Phase 1
- Phase 5: Add pre-replacement manual review step for files containing `bg-color-*` patterns
