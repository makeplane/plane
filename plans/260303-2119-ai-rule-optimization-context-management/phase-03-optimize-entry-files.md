# Phase 3: Optimize Entry Files (CLAUDE.md & GEMINI.md)

## Context Links

- [Plan Overview](plan.md)
- [Phase 2: Compress & Scope](phase-02-compress-and-scope-rules.md) (dependency)

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 30m
- **Description**: Slim CLAUDE.md from 126L to ≤90L and GEMINI.md from 321L to ~180L. GEMINI.md needs more inline rules because .agent/rules/ does NOT auto-load.

## Key Insights

- CLAUDE.md is injected into EVERY Claude Code conversation — most expensive context
- GEMINI.md loaded for every Antigravity/Gemini session
- Both should contain ONLY critical invariants + pointers to scoped rule files
- Rule: If it's in a .claude/rules/ file, it should NOT be in CLAUDE.md

## CLAUDE.md Target Structure (~85 lines)

```markdown
# CLAUDE.md

## Architecture (5L)

- React 18 + Router v7 + MobX + Tailwind v4 | Django 4.2 + DRF + Postgres + Celery
- CE pattern: new features in ce/, never modify core/
- UI: prefer @plane/propel/\* over @plane/ui

## Rules & Workflows (10L)

<!-- Updated: Review v2 — restored workflow refs (Claude multi-agent system is real) -->

- Detailed rules: .claude/rules/ (auto-loaded by file path)
- **Workflow**: .claude/rules/primary-workflow.md (orchestrator pipeline)
- **Orchestration**: .claude/rules/orchestration-protocol.md (subagent delegation)
- Dev rules: .claude/rules/development-rules.md (always loaded)
- Skills catalog: .claude/skills/ (activate per task)
- Docs: ./docs/

## Git Safety (15L)

- Origin: github.com/shbvn/plane.git | Default: preview | Staging: develop
- Branch: {user}/{type}/{desc} → develop (PR) → preview (PR)
- ❌ NEVER pull/merge/rebase from upstream (makeplane/plane)
- ❌ NEVER force push to preview or develop
- ❌ NEVER push directly to preview or develop

## Build (5L)

- PM: pnpm | Lint: pnpm check:lint | Format: pnpm check:format
- Backend tests: cd apps/api && python run_tests.py

## File Standards (5L)

- kebab-case, <200 lines code, <150 lines components
- YAGNI / KISS / DRY

## Python Skills (5L)

- Use .claude/skills/.venv/bin/python3 for skill scripts
- Fix broken skills directly

## Hook Response Protocol (15L)

[Keep existing privacy block section — it's critical and unique to CLAUDE.md]

## Modularization (5L)

[Compress to 5-line checklist version]
```

**What to remove from CLAUDE.md:**

- "Role & Responsibilities" section (redundant with rules)
- "Workflows" section listing file paths (move to dev-rules pointer)
- Duplicated "Documentation Management" section
- Verbose modularization instructions (compress)
- "IMPORTANT" reminders that repeat rules

## GEMINI.md Target Structure (~180 lines)

<!-- Updated: Validation Session 2 — .agent/rules/ does NOT auto-load, need more inline -->

**Key insight**: Unlike .claude/rules/ which auto-loads by file path, .agent/rules/ requires explicit reading. GEMINI.md is the PRIMARY rule source for Antigravity.

```markdown
# GEMINI.md (~180L)

## Architecture (5L)

[Same as CLAUDE.md]

## Git Safety (10L)

[Same as CLAUDE.md]

## Build (5L)

[Same as CLAUDE.md]

## File Standards (5L)

[Same as CLAUDE.md]

## Rule Index (10L)

Point to .agent/rules/ files by category — Antigravity MUST read these before implementing.

## Key Rules Summary (120L)

More detailed than CLAUDE.md version because this is the primary entry point.
Keep top 5-8 rules per category inline in ❌/✅ checklist format.
For deep reference: "READ .agent/rules/{file} for full details"

## Skills & Workflows (15L)

- Skills catalog: .agent/skills/ (cook, implement, planning, research, review, test)
- Workflows: .agent/workflows/ (code-review, implement-feature, plan-feature)
- Workflow usage: /plan-feature → /implement-feature → /code-review

## Phase-Based Workflow (10L)

- Read plan phase files for implementation
- Each phase embeds relevant rules inline
- Fresh context per phase
```

**Strategy**: GEMINI.md carries heavier inline rules (~120L summary + 15L skills) because .agent/rules/ won't auto-load.
**Target total**: 5+10+5+5+10+120+15+10 = **180L** ✅
**What to remove**: Verbose examples, full code blocks (replace with ❌/✅), exact duplicates of .agent/rules/ content.

## Implementation Steps

### Step 1: Draft New CLAUDE.md

- Copy current CLAUDE.md
- Remove sections identified above
- Compress remaining sections to checklist format
- Verify ≤90 lines

### Step 2: Draft New GEMINI.md

- Start fresh with target structure above
- Pull critical invariants (architecture, git safety, build)
- Create rule index pointing to .agent/rules/
- Add compressed "top rules" summary (~80L)
- Verify ~180 lines (not less — .agent/rules/ no auto-load)

### Step 3: Validate No Lost Rules

- Diff old vs new CLAUDE.md — every removed rule must exist in .claude/rules/
- Diff old vs new GEMINI.md — every removed rule must exist in .agent/rules/
- Checklist: for each removed line, where does it live now?

### Step 4: Test Context Loading

- Simulate: edit a frontend file → which rules load?
- Expected: CLAUDE.md (~85L) + development-rules.md (~35L) + relevant scoped files
- Total should be ~200-400L vs current ~500+

## Post-Phase Checklist

- [ ] CLAUDE.md ≤90 lines
- [ ] GEMINI.md ~180 lines (not less — .agent/rules/ no auto-load)
- [ ] No rule content lost — all moved to scoped files
- [ ] Git safety rules preserved in both files
- [ ] Architecture summary in both files
- [ ] Build commands in both files
- [ ] Privacy hook protocol preserved in CLAUDE.md

## Todo List

- [ ] Draft new CLAUDE.md
- [ ] Draft new GEMINI.md
- [ ] Validate no lost rules (diff check)
- [ ] Review final line counts

## Success Criteria

- CLAUDE.md ≤90 lines (from 126)
- GEMINI.md ~180 lines (from 321)
- Zero rule content lost
- Both files pass syntax/markdown validation

## Risk Assessment

- **Medium**: Removing too much from CLAUDE.md → AI misses critical rules
  - Mitigation: Keep git safety + architecture (highest-impact rules)
  - Mitigation: development-rules.md (unscoped) catches general coding rules
- **Low**: GEMINI.md index format confusing for Gemini
  - Mitigation: Keep inline summary of top rules, not just file pointers
