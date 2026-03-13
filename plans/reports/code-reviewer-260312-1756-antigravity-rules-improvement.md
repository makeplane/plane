# Code Review: Antigravity Rules Improvement

## Score: 9/10

## Scope

- Files reviewed: 25 rule files + 4 skill files + 3 workflow files = 32 files total
- LOC reviewed: ~2,199 lines across `.agent/rules/`, `.agent/skills/`, `.agent/workflows/`
- Focus: Contradiction fixes, scope migration, new rule files, cross-file consistency

## Overall Assessment

Excellent quality. All six review criteria pass cleanly. The changes systematically fix real contradictions (color tokens, MobX imports, i18n scope), remove broken YAML `paths:` frontmatter, and add genuinely useful new files (canonical imports, verification gates). Cross-file references are consistent and accurate.

## Criteria Verification

### 1. `text-color-*` usage -- PASS

All 10 occurrences of `text-color-*` across `.agent/` appear exclusively in WRONG/NEVER/NOT/LEGACY contexts:

- `color-tokens.md:13` -- "WRONG (legacy, do NOT use)"
- `frontend-implementation-checklist.md:42,75,84` -- NOT examples, grep pattern, trap table
- `plane-design-system.md:26` -- "LEGACY -> use text-tertiary"
- `implement/SKILL.md:28`, `review/SKILL.md:31` -- NOT examples
- `code-review.md:33`, `implement-feature.md:43`, `plan-feature.md:46` -- NOT/LEGACY examples

Same for `border-color-*` (7 occurrences, all WRONG context). Zero false positives.

### 2. Zero YAML `paths:` frontmatter -- PASS

`grep '^paths:' .agent/rules/` returns zero matches. All 23 rule files use `<!-- Scope: ... -->` HTML comments.

### 3. No Claude Code-specific references -- PASS

`grep 'code-reviewer\|docs-seeker\|sequential-thinking' .agent/` returns zero matches. The `.agent/` files are cleanly tool-agnostic.

### 4. File size targets -- PASS

- `backend-testing.md`: 33 lines (target <40)
- `prettier-formatting.md`: 27 lines (target <40)
- `frontend-canonical-imports.md`: 24 lines
- `backend-canonical-imports.md`: 19 lines
- `development-rules.md`: 66 lines (target ~65)

### 5. NEVER/WRONG examples accuracy -- PASS

Verified against known codebase patterns:

- `set()` from `lodash-es` not `mobx` -- correct
- `observer()` from `mobx-react` not `mobx-react-lite` -- correct
- `text-tertiary` not `text-color-tertiary` -- correct (matches ESLint plugin)
- i18n NOT for `apps/admin` -- correct
- `BaseAPIView`/`BaseViewSet` not DRF directly -- correct
- SWR deprecated note -- correct (codebase uses MobX stores)

### 6. Cross-file consistency -- PASS

All skill/workflow files reference correct rule file paths:

- `cook/SKILL.md` references `development-rules.md`, `prettier-formatting.md`, `frontend-canonical-imports.md`, `backend-canonical-imports.md`
- `review/SKILL.md` references all 8 rule files in correct order
- `implement/SKILL.md` references `development-rules.md`, canonical import files
- `test/SKILL.md` references `backend-testing.md`
- Workflow files reference correct rule paths

## Warnings (Low)

### 1. Inconsistent frontmatter style between old and new files

**5 new files** (Phase 2-3) use BOTH `<!-- Scope -->` AND YAML `---` description frontmatter:

```
<!-- Scope: apps/api/** -->
---
description: Backend test runner commands and markers
---
```

**18 existing files** (Phase 1 modified) use ONLY `<!-- Scope -->`:

```
<!-- Scope: plane/db/** -->

# Backend Models & Custom Managers
```

Impact: Minor inconsistency. The YAML `description` field is actually useful for Antigravity's rule-loading UI, so the new files arguably have the better format. However, the inconsistency means Phase 1 files lack descriptions.

Recommendation: Either add `description` frontmatter to the 18 older files, or remove it from the 5 new ones, to achieve uniformity. Low priority -- no functional impact.

### 2. `bg-surface-1` in implement-feature.md general example

`implement-feature.md:32` lists `bg-surface-1` as a valid semantic token in the general component guidelines:

```
- Use semantic color tokens (`bg-surface-1`, `text-primary`, etc.)
```

This is technically correct (bg-surface-1 IS a valid token for cards/panels), but given the heavy emphasis everywhere else on "NOT bg-surface-1 for inputs", an agent could misapply it. The same file correctly says `NOT bg-surface-1` at line 44 for inputs specifically.

Impact: Minimal -- the input-specific rule at line 44 is clear. Just a potential confusion point.

## Suggestions

1. The `frontend-implementation-checklist.md` grep pattern at line 75 includes `bg-surface-1` in the violation search, but `bg-surface-1` is a valid token for non-input elements (cards, panels). This could produce false positives during post-implementation scans. Consider narrowing to input-context patterns only, or adding a note that `bg-surface-1` is only wrong on form elements.

## Positive Observations

- **Systematic contradiction resolution**: Every known issue from the gap analysis was addressed
- **Rule Maintenance sections**: Added to both `plane-design-system.md` and `plane-backend-architecture.md` -- enables self-correction when rules drift from codebase reality
- **Canonical import files**: Directly address the hallucination/slopsquatting risk for AI agents
- **Verification gates**: The `development-rules.md` post-implementation checklist is a concrete, actionable safeguard
- **Concise new files**: All under target line counts, no bloat
- **SWR deprecation note** in `mobx-stores.md` prevents agents from introducing deprecated patterns

## Summary

- Files reviewed: 32
- Critical: 0 | Warnings: 2 (both low) | Suggestions: 1
- Verdict: **Approved** -- clean, consistent, well-targeted changes
