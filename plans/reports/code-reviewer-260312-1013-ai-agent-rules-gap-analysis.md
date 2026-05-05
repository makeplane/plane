# Code Review: AI Agent Rules Gap Analysis & Fix

**Reviewer**: code-reviewer | **Date**: 2026-03-12
**Scope**: 115 files, ~2750 LOC changed (855 added, 1900 removed)
**Focus**: Rule file correctness, ESLint plugin, token migration, cross-file consistency

## Overall Assessment

Solid remediation effort. Rule contradictions fixed, backend rules expanded, ESLint plugin functional with correct regex. Two medium issues found in docs and one edge case in the migration. No critical security or breaking issues.

## Critical Issues

None.

## High Priority

### H1. `docs/design-guidelines.md` still contains legacy tokens (3 occurrences)

The doc update missed lines 174 and 196:

- **Line 174**: `border-color-subtle` in example code block
- **Line 196**: `text-color-primary` and `border-color-subtle` in "CORRECT" example

This is particularly harmful because line 196 is labeled "CORRECT" but uses legacy tokens, directly contradicting the rules.

**Fix**: Replace legacy tokens on these lines:

- `border-color-subtle` -> `border-subtle`
- `text-color-primary` -> `text-primary`

### H2. Bare token migration creates non-existent tokens

The bulk replace transformed `text-color-accent` -> `text-accent`, `bg-color-accent` -> `bg-accent`, `border-color-accent` -> `border-accent`. None of these bare tokens (`--text-accent`, `--bg-accent`, `--border-accent`) exist as CSS variables in `packages/tailwind-config/variables.css`.

The valid tokens are:

- `text-accent-primary` / `text-accent-secondary`
- `bg-accent-primary` / `bg-accent-subtle`
- `border-accent-strong`

**Impact**: ~33 replacements in this diff produced non-existent tokens. However, the originals (`text-color-accent`, `bg-color-accent`, `border-color-accent`) were ALSO non-existent -- this is a pre-existing bug that existed before this change. The ESLint rule correctly strips `-color-` but has no token existence validation.

**Recommendation**: Separate follow-up to audit all bare `*-accent` tokens and map to correct suffixed variants. Consider adding token allowlist validation to the ESLint rule.

## Medium Priority

### M1. `backend-testing.md` overlaps with `backend-testing-i18n.md`

New `backend-testing.md` duplicates test runner content from `backend-testing-i18n.md`. The modular rule files index in `plane-backend-architecture.md` (line 87) lists `backend-testing-i18n.md` but not the new `backend-testing.md`.

**Recommendation**: Either consolidate or add `backend-testing.md` to the index table.

### M2. ESLint rule reports only first legacy token per string

When a string contains multiple legacy tokens (e.g., `"text-color-primary border-color-subtle"`), the rule reports just one error per node. The auto-fix correctly transforms ALL tokens in the string, but the error message only references the first one. Minor UX issue for developer feedback.

### M3. ESLint rule `original` variable (line 50) is unused

Line 50 computes `original` by slicing the match, but line 52 recomputes `firstLegacy` using a different regex. The `original` variable on line 50 is dead code.

## Low Priority

### L1. `routing-layouts.md` contains Vietnamese text (line 16)

Line 16 has Vietnamese: "Khi them route CE moi cho cac trang co layout san...". While appropriate for this team, it breaks the pattern of English-only rule files. Other rule files are fully English.

### L2. Rule file sizes within limits

All rule files are under 200 lines. Largest: `backend-views.md` (154L), `mobx-stores.md` (152L). No action needed.

## ESLint Plugin Review

**File**: `packages/eslint-plugin-plane/rules/no-legacy-tokens.js`

| Aspect                         | Status                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Regex correctness              | PASS - negative lookbehind correctly excludes CSS vars                             |
| Auto-fix safety                | PASS - preserves quote style, handles all 3 prefixes                               |
| Template literal support       | PASS - handles quasis in template literals                                         |
| Package registration           | PASS - workspace protocol in root `package.json`, lockfile correct                 |
| ESLint config integration      | PASS - correctly scoped to `apps/**` and `packages/**`, excludes `tailwind-config` |
| Edge case: `--text-color-*`    | PASS - lookbehind prevents CSS variable false positives                            |
| Edge case: multi-token strings | PASS - fixString replaces all occurrences                                          |

**Issue found**: Dead code on line 50 (minor).

## Rule File Consistency Check

| Rule                                    | Consistent across files?                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `set` from `lodash-es` (not `mobx`)     | YES - `mobx-stores.md` + `plane-design-system.md` agree                                                                |
| `observer` from `mobx-react` (not lite) | YES - `mobx-stores.md` + `plane-design-system.md` agree                                                                |
| `makeObservable` (never auto)           | YES - `mobx-stores.md` only reference                                                                                  |
| `text-*` short form                     | YES - `color-tokens.md`, `frontend-implementation-checklist.md`, `plane-design-system.md`, `forms-inputs.md` all agree |
| i18n not in admin                       | YES - `i18n-rules.md` + `plane-design-system.md` agree                                                                 |
| `bg-layer-2` for inputs                 | YES - `color-tokens.md` + `forms-inputs.md` + checklist agree                                                          |
| Instance admin pattern                  | YES - `backend-views.md` + `plane-backend-architecture.md` agree                                                       |
| Canonical imports tables                | YES - frontend + backend architecture files match                                                                      |

## Remaining Legacy Tokens in Rule Files

ZERO legacy tokens found in `.claude/rules/` -- all `*-color-*` patterns cleared.

## Positive Observations

1. Comprehensive cross-file consistency in rule examples (all corrected examples agree)
2. ESLint plugin is well-structured with proper meta, fixable, and message support
3. CSS variable exclusion in regex is correct and tested
4. New backend rules (Instance Admin pattern, Celery task discovery) fill real gaps
5. SWR section in `mobx-stores.md` addresses an actual pattern confusion in the codebase
6. Anti-hallucination canonical imports tables prevent common AI agent mistakes
7. Rule maintenance section is a smart addition for self-correcting rules

## Recommended Actions

1. **[HIGH]** Fix 3 remaining legacy tokens in `docs/design-guidelines.md` (lines 174, 196)
2. **[HIGH]** Plan follow-up to audit bare `*-accent` tokens across codebase
3. **[MEDIUM]** Add `backend-testing.md` to index in `plane-backend-architecture.md`
4. **[LOW]** Remove dead code on line 50 of `no-legacy-tokens.js`

## Metrics

- Rule file consistency: 100% (all checked rules agree across files)
- Legacy tokens in rules: 0 remaining
- Legacy tokens in docs: 3 remaining (design-guidelines.md)
- Legacy tokens in app code: 0 (all 94 files migrated)
- ESLint plugin test coverage: manual verification passed (regex, fix, edge cases)

## Unresolved Questions

1. Are bare `text-accent`, `bg-accent`, `border-accent` tokens intentional Tailwind utilities or bugs? The CSS variables don't exist, but Tailwind v4 may generate them from theme config differently than v3. Needs verification against the actual Tailwind v4 theme resolution.
2. Should `backend-testing.md` replace `backend-testing-i18n.md` or coexist? The older file has broader content (fixtures, factory patterns).
