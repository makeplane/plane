---
title: "AI Rule Optimization — Context Management"
description: "Reduce attention dilution and context rot by scoping, compressing, and deduplicating AI rule files"
status: completed
priority: P1
effort: 3h
branch: develop
tags: [dx, ai-rules, context-management]
created: 2026-03-03
---

# AI Rule Optimization Plan

## Problem

20 rule files (1,723L) + CLAUDE.md (127L) + GEMINI.md (321L) cause Lost-in-the-Middle, Attention Dilution, and Context Rot. 4 files (315L) always loaded regardless of task.

## Solution: 3-Tier Rule System

1. **Tier 1 — Always On** (<100L): CLAUDE.md, GEMINI.md — critical invariants only
2. **Tier 2 — Conditional**: .claude/rules/ with path globs — load per file context
3. **Tier 3 — Embedded**: Rules injected into plan phase files at point-of-use

## Phases

| #   | Phase                                                          | Status    | Effort |
| --- | -------------------------------------------------------------- | --------- | ------ |
| 1   | [Audit & Deduplicate](phase-01-audit-and-deduplicate.md)       | completed | 30m    |
| 2   | [Compress & Scope Rules](phase-02-compress-and-scope-rules.md) | completed | 45m    |
| 3   | [Optimize Entry Files](phase-03-optimize-entry-files.md)       | completed | 30m    |
| 4   | [Add Missing Rules](phase-04-add-missing-rules.md)             | completed | 45m    |
| 5   | [Sync Tooling](phase-05-sync-tooling.md)                       | completed | 30m    |

## Key Metrics

| Metric                 | Current           | Target             | Actual               |
| ---------------------- | ----------------- | ------------------ | -------------------- |
| CLAUDE.md              | 126L              | ≤90L               | 67L ✅               |
| GEMINI.md              | 321L              | ~180L              | 120L ✅              |
| Always-loaded rules    | 315L (4 files)    | ~35L (1 file)      | 32L ✅               |
| .claude/rules/ total   | 1,723L (20 files) | N/A                | 1,566L (22 files) ✅ |
| Rules loaded per task  | ALL 20            | 3-5 relevant       | 3-5 relevant ✅      |
| Cross-tool duplication | ~95%              | 0% (single source) | 0% ✅                |

## Dependencies

- No external deps. All changes are config/documentation files.
- Phase 5 (sync tooling) depends on phases 2-4 being complete.

## Research

- [Context Management Best Practices](research/researcher-01-context-management-best-practices.md)
- [Rule Coverage Strategy](research/researcher-02-plane-component-rule-coverage.md)

## Validation Log

### Session 1 — 2026-03-03

**Trigger:** Initial plan creation validation
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Plan đề xuất giữ development-rules.md (~35L) là file DUY NHẤT always-loaded. 3 file còn lại (primary-workflow, orchestration-protocol, documentation-management) sẽ scope vào `plans/**`. Đồng ý?
   - Options: Scope 3 files (Recommended) | Keep primary-workflow always loaded | Scope all 4
   - **Answer:** Scope 3 files to plans/\*\*
   - **Custom input:** User asked for detailed explanation of impact. Confirmed after understanding that CLAUDE.md still provides workflow pointers as backup.
   - **Rationale:** Reduces always-loaded from 315L to ~35L. Workflow rules auto-load when editing plan files.

2. **[Architecture]** Sync strategy for .claude/rules/ → .agent/rules/?
   - Options: Sync script (Recommended) | Symlinks | Manual sync
   - **Answer:** Sync script
   - **Rationale:** Script strips YAML frontmatter (not supported by Antigravity), excludes workflow-only files.

3. **[Scope]** Xử lý 2 composite files (plane-design-system.md 118L, plane-backend-architecture.md 118L)?
   - Options: Delete after merge (Recommended) | Convert to compact index | Keep as-is
   - **Answer:** Delete after merging unique content
   - **Custom input:** User asked for explanation of what composites contain and how they overlap with individual files. Confirmed deletion after understanding.
   - **Rationale:** Eliminates 236L of duplicate context. Individual scoped files already cover all rules.

4. **[Scope]** Phase 4 — Create 4 new rule files or only P1?
   - Options: Create all 4 (Recommended) | Only P1 | Skip Phase 4
   - **Answer:** Create all 4
   - **Rationale:** Full coverage for types-interfaces, ce-override-pattern, permissions-rbac, activity-tracking.

#### Confirmed Decisions

- Always-loaded: Only development-rules.md (~35L), scope 3 others to plans/\*\*
- Sync: Shell script .claude/rules/ → .agent/rules/ with frontmatter stripping
- Composites: Delete plane-design-system.md and plane-backend-architecture.md after merging unique content
- New rules: Create all 4 files (types-interfaces, ce-override-pattern, permissions-rbac, activity-tracking)

#### Action Items

- [ ] Add safeguard in CLAUDE.md: workflow pointer line so Claude knows where to find workflow rules
- [ ] Verify composite files have no unique content before deletion

#### Impact on Phases

- Phase 2: Confirmed — scope 3 files, delete 2 composites
- Phase 3: Add workflow pointer to CLAUDE.md as safeguard
- Phase 4: Create all 4 new rule files (no scope reduction)

### Session 2 — 2026-03-03

**Trigger:** User code review of plan — 5 critical issues + 3 warnings
**Questions asked:** 0 (direct corrections from user)

#### Corrections Applied

1. **[Critical] GEMINI.md target too slim** — .agent/rules/ does NOT auto-load (unlike .claude/rules/). GEMINI.md is the ONLY place Antigravity reads rules by default.
   - **Before:** Target 150L
   - **After:** Target ~180L — keep more inline rules since .agent/rules/ won't auto-load
   - **Impact:** Phase 3 updated

2. **[Critical] Keep composite indexes as slim ~60L** — plane-design-system.md contains CE pattern + Top 10 rules without individual file coverage yet
   - **Before:** Delete composites
   - **After:** Slim to ~60L index format, don't delete
   - **Impact:** Phase 2 updated — convert to slim index, not delete

3. **[Critical] Sync script no need to strip frontmatter** — .agent/rules/ already has YAML frontmatter (verified: backend-models.md has `paths:` header). Just cp.
   - **Before:** awk strip frontmatter
   - **After:** Simple cp, exclude workflow-only files
   - **Impact:** Phase 5 simplified

4. **[Critical] Delete primary-workflow.md + orchestration-protocol.md** — contain dead agent references (planner, tester, reviewer, debugger, docs-manager agents). Not scope, delete.
   - **Before:** Scope to plans/\*\*
   - **After:** DELETE both files, move any salvageable content to development-rules.md
   - **Impact:** Phase 2 updated

5. **[Warning] development-rules.md has 6 dead skill references** — docs-seeker, ai-multimodal, imagemagick, sequential-thinking, debug skills, mermaidjs-v11
   - **Action:** Clean up in Phase 2

6. **[Warning] frontend-implementation-checklist.md diverged significantly** — .claude/=72L vs .agent/=124L (+52 lines, not +30 as initially noted). .agent/ version has full Pre-Implementation Search section with bash examples, component lookup table.
   - **Action:** Copy .agent/rules/ version → .claude/rules/ (the .agent/ version is MORE COMPLETE)

7. **[Warning] Phase 4 new files may overlap with existing backend-\* files** — permissions-rbac and activity-tracking may duplicate backend-views.md content
   - **Action:** Verify overlap before creating, merge into existing files if overlap >50%

#### Updated Decisions

- GEMINI.md: ~180L (was 150L)
- Composites: Slim to ~60L index (was: delete)
- primary-workflow.md: DELETE (was: scope)
- orchestration-protocol.md: DELETE (was: scope)
- Sync script: simple cp (was: awk strip frontmatter)
- development-rules.md: cleanup dead refs
- frontend-checklist: reconcile 2 versions

### Session 3 — 2026-03-03

**Trigger:** Antigravity review of complete plan
**Questions asked:** 0 (direct fixes applied)

#### Fixes Applied (partially reverted in 3b)

1. ~~[Critical] Phase 3 — removed refs to primary-workflow.md and orchestration-protocol.md~~ **REVERTED in 3b**
2. [Valid] Phase 3 — removed duplicate "Rules & Workflows" section
3. [Valid] Phase 5 — replaced `awk` frontmatter stripping with simple `diff`
4. ~~[Warning] Phase 2 — changed "scope" to "DELETE" for workflow files~~ **REVERTED in 3b**
5. [Valid] Phase 5 — added skill/workflow pointer validation step

### Session 3b — 2026-03-03

**Trigger:** User correction — Claude CLI IS multi-agent (14 agents in .claude/agents/)
**Root cause:** Antigravity incorrectly assumed Claude CLI is single-agent

#### Critical Corrections

1. **[Critical] primary-workflow.md is NOT dead** — all agent refs (`planner`, `tester`, `code-reviewer`, `debugger`, `docs-manager`) map to real files in `.claude/agents/`. File should be SCOPED, not deleted.
2. **[Critical] orchestration-protocol.md is NOT dead** — defines subagent delegation rules (sequential chaining, parallel execution). File should be SCOPED to `plans/**`.
3. **[Critical] Session 2 DELETE decision was wrong** — reverted to original plan of SCOPING these files.

#### Architecture Understanding (for future reference)

- Claude CLI = **multi-agent orchestrator** with Task tool delegation
- `.claude/agents/` = 14 subagent definitions (planner, researcher, tester, code-reviewer, debugger, docs-manager, brainstormer, code-simplifier, fullstack-developer, ui-ux-designer, git-manager, project-manager, journal-writer, mcp-manager)
- `packages/**` = shared libraries (propel, ui, types, i18n...) — core code, rarely customized
- Antigravity = **single agent**, uses `.agent/skills/` for pipeline steps
- These are DIFFERENT architectures — rules/workflows cannot be assumed interchangeable

#### Updated Decisions

- primary-workflow.md: SCOPE to `apps/**` (was: DELETE) — packages/\*\* excluded (core libs, not custom code)
- orchestration-protocol.md: SCOPE to `plans/**` (was: DELETE)
- Always-loaded files: 1 (dev-rules ~35L) — workflow + orchestration SCOPED (confirmed Session 4)

#### Review Report

- [Full review v2](file:///Users/duonglx/.gemini/antigravity/brain/047cd32e-90dc-45a5-a9b8-97dfc0ffc863/review-ai-rule-optimization.md)

### Session 4 — 2026-03-04

**Trigger:** Final validation — resolve Session 3b open decisions + fix phase-02 inconsistency
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Session 3b chưa chốt: giữ always-loaded hay scope primary-workflow.md + orchestration-protocol.md?
   - Options: Scope cả 2 (Recommended) | Keep cả 3 always-loaded | Scope primary-workflow only
   - **Answer:** Scope cả 2 file
   - **Rationale:** Only dev-rules (~35L) always-loaded. Workflow rules load when editing code files. Orchestration loads when editing plans.

2. **[Scope]** Phase 2 Step 1 vẫn ghi DELETE (Session 2), mâu thuẫn với Session 3b (SCOPE). Cách xử lý dead skill refs?
   - Options: Xóa hết dead refs (Recommended) | Comment out | Replace với tên skill đúng
   - **Answer:** Replace với tên skill đúng
   - **Rationale:** Keep refs functional by mapping to actual available skills.

3. **[Architecture]** primary-workflow.md scope `apps/**,packages/**` rất rộng. Scope hẹp hơn?
   - Options: `apps/**,packages/**` (original) | `apps/**` only | `plans/**` only | Keep always-loaded, trim
   - **Answer:** `apps/**` only
   - **Rationale:** `packages/**` chứa shared libs (propel, ui, types) — core code, không custom. Workflow pipeline chỉ cần khi edit apps/.

#### Confirmed Decisions (FINAL)

- Always-loaded: ONLY `development-rules.md` (~35L)
- primary-workflow.md: SCOPE to `apps/**`
- orchestration-protocol.md: SCOPE to `plans/**`
- Dead skill refs: REPLACE with actual skill names (not delete)
- Phase-02 Step 1: FIXED — now says SCOPE (was incorrectly DELETE from Session 2)

#### Action Items

- [x] Fix phase-02 Step 1: changed DELETE → SCOPE for workflow files
- [ ] Map dead skill names to actual available skills during implementation

#### Impact on Phases

- Phase 2: Step 1 fixed — workflow files scoped, not deleted
- No other phase changes needed

### Session 5 — 2026-03-04

**Trigger:** Antigravity independent review v3 — codebase-verified audit
**Questions asked:** 1 (packages/\*\* scope discussion)

#### Corrections Applied (10 fixes)

| #   | Fix                                                                           | Files Changed               |
| --- | ----------------------------------------------------------------------------- | --------------------------- |
| 1   | Line count 2,170→1,723 (verified via `wc -l`)                                 | plan.md, phase-02           |
| 2   | primary-workflow.md scope: `apps/**` only (packages/ = core libs, not custom) | plan.md, phase-01, phase-02 |
| 3   | Composite files already have `paths:` scoping (not unscoped as claimed)       | phase-01                    |
| 4   | GEMINI.md target: fix remaining 150→~180 references                           | phase-03                    |
| 5   | Sync script exclude: +primary-workflow.md, +orchestration-protocol.md         | phase-05                    |
| 6   | frontend-checklist: divergence is 52L not 30L, copy .agent/→.claude/          | plan.md                     |
| 7   | Phase 4 overlap: verify backend-views.md before creating separate files       | phase-04                    |
| 8   | Add rollback strategy: git tag + smoke test                                   | phase-05                    |
| 9   | GEMINI.md target: add Skills & Workflows section (15L)                        | phase-03                    |
| 10  | Skill validation: include .claude/skills/ (not just .agent/)                  | phase-05                    |

#### Updated Decisions

- primary-workflow.md: `apps/**` only (was `apps/**,packages/**`)
- packages/\*\* = shared core libs (propel, ui, types), not custom code
- Actual baseline: 1,723L (not 2,170L)
- Phase 4: merge-first strategy for permissions-rbac + activity-tracking

### Session 6 — 2026-03-04

**Trigger:** Final pre-implementation validation (plan:validate)
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** 6 dead skill refs (docs-seeker, ai-multimodal, imagemagick, sequential-thinking, debug, mermaidjs-v11) — replace, remove, or keep?
   - Options: Keep as-is | Remove all skill refs | Verify & update each
   - **Answer:** Keep as-is
   - **Rationale:** These skills exist in the current skills catalog (verified in available skills list). Not dead refs after all.

2. **[Architecture]** 2 CLAUDE.md files (root /Volumes/Data/SHBVN/CLAUDE.md vs project plane.so/CLAUDE.md) — optimize both?
   - Options: Project CLAUDE.md only (Recommended) | Both files | Merge into one
   - **Answer:** Project CLAUDE.md only
   - **Rationale:** Root CLAUDE.md is shared config for multiple projects, not in scope.

3. **[Scope]** documentation-management.md plan structure section (~112L) — where to move?
   - Options: plans/templates/phase-template.md (Recommended) | Keep inline but compress | Move to docs/
   - **Answer:** Custom mapping (Other)
   - **Custom input:** documentation-management.md (~60L after trim): keep Roadmap & Changelog (L1-34) + Plan Location & Naming (L35-44, 10L) + pointer to template (1L). Move directory structure (L45-66) + phase file sections (L68-158) + phase workflow (L159-173) → plans/templates/phase-template.md (~100L, NEW).
   - **Rationale:** Clean separation — doc-management keeps operational rules, template gets structural guidance.

#### Confirmed Decisions (FINAL)

- Skill refs: NOT dead — keep as-is (all exist in skills catalog)
- CLAUDE.md: optimize only plane.so/CLAUDE.md (root is out of scope)
- Plan structure: split into doc-management (~60L) + plans/templates/phase-template.md (~100L)

#### Action Items

- [ ] Update Phase 2: remove "Replace dead skill refs" step from development-rules.md trimming
- [ ] Update Phase 5: phase-template.md grows to ~100L (was minimal template)

#### Impact on Phases

- Phase 2: development-rules.md — no longer need to replace skill refs (they're valid). Still trim to ~35L by removing other verbosity.
- Phase 3: Only optimize plane.so/CLAUDE.md (not root CLAUDE.md)
- Phase 5: phase-template.md = ~100L with plan structure content from documentation-management.md

### Session 7 — 2026-03-04

**Trigger:** Final pre-implementation validation (plan:validate) with user best practices context
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 5 Step 0 nói tạo git tag BEFORE Phase 2, nhưng nằm trong file Phase 5. Move rollback step ra Phase 1?
   - Options: Move to Phase 1 | Keep in Phase 5 | Add to both
   - **Answer:** Custom (Other)
   - **Custom input:** Add to Phase 1 todo list as LAST STEP. Phase 5 Step 0 becomes verification only (`git tag -l`).
   - **Rationale:** Ensures rollback point created at right time without duplication.

2. **[Scope]** User best practices say CLAUDE.md <150L. Plan targets <80L. Too aggressive?
   - Options: <80L (current) | <100L | <120L (moderate)
   - **Answer:** Custom — ≤90L
   - **Custom input:** Giữ target ≤90L — cho phép giữ hook protocol nguyên vẹn mà không phải hy sinh content khác.
   - **Rationale:** Hook injection (privacy block ~15L) is separate context, not counted. ≤90L gives breathing room.

3. **[Cleanup]** Phase 2 checklist dòng 118 says 'dead refs removed' (contradicts Session 6). Phase 5 risk mentions 'awk counter' (obsolete since Session 2). Fix?
   - Options: Fix now | Fix during implementation
   - **Answer:** User already fixed directly
   - **Custom input:** Phase 2 checklist: "dead refs removed" → "imagemagick ref removed" (only actual dead ref). Phase 5 risk: "awk counter approach" → "Test with all current files before bulk sync".
   - **Rationale:** Keeps plan consistent with final decisions.

#### Confirmed Decisions (FINAL)

- Rollback: git tag in Phase 1 (last step), Phase 5 verifies
- CLAUDE.md: ≤90L (was <80L)
- Checklist fixes: user applied directly (imagemagick only dead ref, awk ref removed)

#### Action Items

- [x] Add git tag step to Phase 1 todo list
- [x] Change Phase 5 Step 0 to verification
- [x] Update CLAUDE.md target to ≤90L across Phase 3 + plan.md metrics

#### Impact on Phases

- Phase 1: Added rollback tag as last todo item
- Phase 3: CLAUDE.md target updated from <80L to ≤90L (6 references updated)
- Phase 5: Step 0 changed from "Create" to "Verify" rollback point

### Session 8 — 2026-03-04

**Trigger:** User-reported issues — step numbering gap + sync exclude question
**Questions asked:** 3

#### Questions & Answers

1. **[Cleanup]** Phase 4: Step numbering gap — sau Step 3a/3b/3c nhảy thẳng sang Step 5. Đổi Step 5 → Step 4?
   - Options: Rename to Step 4 (Recommended) | Keep as Step 5 | Remove step entirely
   - **Answer:** Rename to Step 4
   - **Rationale:** But moot — step removed entirely per Q3.

2. **[Architecture]** Phase 5 sync script exclude list — development-rules.md có nên exclude? (nội dung đã nằm trong GEMINI.md)
   - Options: Exclude (Recommended) | Keep syncing | Sync but with note
   - **Answer:** Exclude development-rules.md
   - **Rationale:** .agent/rules/ doesn't auto-load. GEMINI.md already contains dev-rules content. Syncing = useless duplication.

3. **[Redundancy]** Phase 4 Step 5 (Copy to .agent/rules/) — Phase 5 sync script already handles copy. Redundant?
   - Options: Remove Step, defer to Phase 5 (Recommended) | Keep as manual fallback | Replace with verification
   - **Answer:** Remove Step, defer to Phase 5
   - **Rationale:** Phase 5 sync script copies all files. Manual copy in Phase 4 is redundant.

#### Confirmed Decisions (FINAL)

- Phase 4: Step 5 removed (deferred to Phase 5 sync)
- Sync exclude: +development-rules.md (content in GEMINI.md, .agent/ doesn't auto-load)

#### Action Items

- [x] Remove Phase 4 Step 5 (copy to .agent/rules/)
- [x] Add development-rules.md to Phase 5 exclude list
- [x] Update Phase 5 description to mention new exclude

#### Impact on Phases

- Phase 4: Step 5 removed, todo updated to "Verify files ready for Phase 5 sync"
- Phase 5: Sync script exclude list now has 4 entries (was 3)
