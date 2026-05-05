---
title: "Update Skills & Workflows References"
status: completed
priority: P1
effort: 25 min
---

# Phase 4: Update Skills & Workflows References

<!-- Updated: Validation Session 1 - New phase added per user decision to update skills -->
<!-- Updated: Validation Session 3 - Expanded scope to include workflow files -->

## Context Links

- Parent plan: [plan.md](plan.md)
- Depends on: Phase 2 (new rule files exist), Phase 3 (development-rules.md exists)

## Overview

Antigravity skills (cook, implement, review, test) and workflows (implement-feature, code-review) reference `.agent/rules/` files but don't know about new rules created in Phases 2-3. Add minimal references so skills and workflows can leverage verification gates, testing rules, and formatting standards.

## Key Insights

- Skills are sequential in Antigravity -- each SKILL.md is a self-contained instruction set
- Adding 1-2 lines per skill is sufficient -- don't bloat skill files
- Only reference rules relevant to each skill's domain
- Workflows orchestrate skills -- should reference new rules for completeness

## Related Code Files

### Files to MODIFY:

1. `.agent/skills/cook/SKILL.md` -- add verification gates + new rules
2. `.agent/skills/review/SKILL.md` -- add new rule files to review checklist
3. `.agent/skills/implement/SKILL.md` -- reference development-rules.md
4. `.agent/skills/test/SKILL.md` -- reference backend-testing.md
5. `.agent/workflows/implement-feature.md` -- reference development-rules.md verification gates
6. `.agent/workflows/code-review.md` -- reference new rule files in checklist

## Implementation Steps

### Step 1: Update `cook/SKILL.md`

In Step 5 (Review section), add reference to new rules:

- Add: `- Check: `.agent/rules/development-rules.md` for post-implementation verification gates`
- Add: `- Check: `.agent/rules/prettier-formatting.md` for formatting standards (120-char width)`
- Add: `- Check: `.agent/rules/frontend-canonical-imports.md` for verified frontend import paths`
- Add: `- Check: `.agent/rules/backend-canonical-imports.md` for verified backend import paths`
<!-- Updated: Validation Session 6 - Added backend-canonical-imports.md reference -->

### Step 2: Update `review/SKILL.md`

Add new rule files to the review checklist:

- Add: `- `.agent/rules/development-rules.md` -- verification gates, ESLint, testing integrity`
- Add: `- `.agent/rules/backend-testing.md` -- test runner commands and markers`
- Add: `- `.agent/rules/prettier-formatting.md` -- formatting standards`
- Add: `- `.agent/rules/frontend-canonical-imports.md` -- verified frontend import paths`
- Add: `- `.agent/rules/backend-canonical-imports.md` -- verified backend import paths`

### Step 3: Update `implement/SKILL.md`

Add post-implementation verification reference:

- Add line in implementation instructions: `After implementing, follow verification gates in `.agent/rules/development-rules.md``
- Add: `Verify imports against `.agent/rules/frontend-canonical-imports.md`and`.agent/rules/backend-canonical-imports.md``

### Step 4: Update `test/SKILL.md`

Add backend testing reference:

- Add: `For backend tests, follow `.agent/rules/backend-testing.md` for runner commands and markers`

### Step 5: Update `.agent/workflows/implement-feature.md`

<!-- Updated: Validation Session 3 - Added workflow updates -->

Add verification gates reference in implementation section:

- Add: `After implementing, follow verification gates in `.agent/rules/development-rules.md``
- Add: `Check `.agent/rules/prettier-formatting.md` for formatting standards (120-char width)`

### Step 6: Update `.agent/workflows/code-review.md`

<!-- Updated: Validation Session 3 - Added workflow updates -->

Add new rule files to review checklist:

- Add: `- `.agent/rules/development-rules.md` -- verification gates, ESLint, testing integrity`
- Add: `- `.agent/rules/backend-testing.md` -- test runner commands and markers`
- Add: `- `.agent/rules/prettier-formatting.md` -- formatting standards`

## Todo List

- [x] Step 1: Update cook/SKILL.md (3 lines added)
- [x] Step 2: Update review/SKILL.md (5 lines added)
- [x] Step 3: Update implement/SKILL.md (2 lines added)
- [x] Step 4: Update test/SKILL.md (1 line added)
- [x] Step 5: Update implement-feature.md workflow (2 lines added)
- [x] Step 6: Update code-review.md workflow (3 lines added)

## Success Criteria

1. All 4 SKILL.md files reference relevant new rules
2. Both workflow files reference relevant new rules
3. No bloat -- each file gains max 3 lines
4. References use correct file paths (`.agent/rules/...`)

## Risk Assessment

- **CRITICAL**: Without these updates, new rules from Phases 2-3 won't be loaded by Antigravity (no auto-discovery)
- Adding reference lines only, no logic changes to skills/workflows themselves

## Security Considerations

None -- Markdown files only.

## Next Steps

After Phase 4, run final validation grep commands from plan.md. Commit all changes.
