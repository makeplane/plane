---
title: "Fix Critical Rule Contradictions"
status: completed
priority: P1
effort: 40 min
---

# Phase 1: Fix Critical Rule Contradictions

## Context Links

- Research: [researcher-01-claude-code-improvements.md](research/researcher-01-claude-code-improvements.md)
- Gap analysis: [researcher-260312-1306-antigravity-gaps.md](../reports/researcher-260312-1306-antigravity-gaps.md)
- Claude Code reference files: `.claude/rules/{color-tokens,mobx-stores,i18n-rules,frontend-implementation-checklist}.md`

## Overview

Four Antigravity rule files contain outdated/wrong patterns that directly contradict codebase conventions. 87% of codebase uses short-form color tokens, 100% of stores use `lodash-es` for `set()`, and admin app has no i18n.

## Key Insights

- Color tokens: Tailwind v4 CSS var structure changed. ESLint guard already enforces short-form. Rules must match.
- MobX `set()`: MobX's `set()` vs lodash-es `set()` have different semantics. All existing stores use lodash-es.
- i18n: `apps/admin` never had i18n support. Including it in scope causes false positives.
- Checklist grep pattern actively checks for WRONG direction (flags correct tokens as violations).

## Related Code Files

### Files to MODIFY:

1. `.agent/rules/color-tokens.md` (95 lines)
2. `.agent/rules/mobx-stores.md` (125 lines)
3. `.agent/rules/i18n-rules.md` (63 lines)
4. `.agent/rules/frontend-implementation-checklist.md` (93 lines)
5. `.agent/rules/plane-design-system.md` (62 lines) -- Top 10 rule #3

## Implementation Steps

### Step 1: Fix `color-tokens.md`

**Reference:** `.claude/rules/color-tokens.md` (the corrected version)

Changes to make in `.agent/rules/color-tokens.md`:

1. **Line 16**: Change `text-color-*` (WITH `color-` infix) -> `text-*` (WITHOUT `color-` infix)
   - Old: `- Text: \`text-color-\*\` (WITH \`color-\` infix) -> \`text-color-primary\`, \`text-color-tertiary\``
   - New: `- Text: \`text-\*\` (WITHOUT \`color-\` infix) -> \`text-primary\`, \`text-secondary\`, \`text-tertiary\``

2. **Line 17**: Change `border-color-*` (WITH `color-` infix) -> `border-*` (WITHOUT `color-` infix)
   - Old: `- Border: \`border-color-\*\` (WITH \`color-\` infix) -> \`border-color-subtle\`, \`border-color-strong\``
   - New: `- Border: \`border-\*\` (WITHOUT \`color-\` infix) -> \`border-subtle\`, \`border-strong\``

3. **Line 18**: Background stays the same (already correct).

4. **Line 20**: Flip the common mistake direction
   - Old: `**Common mistake:** \`text-tertiary\` is WRONG -> must be \`text-color-tertiary\``
   - New: Add wrong/correct markers matching Claude Code format:

   ```
   WRONG (legacy, do NOT use): `text-color-tertiary`, `border-color-subtle`
   CORRECT: `text-tertiary`, `border-subtle`
   ```

5. **Lines 22-31**: DELETE entire "Tailwind v4 Infrastructure Naming" section (double-namespace `--text-color-color-*` guidance). This section is wrong and confusing. The Claude Code version removed it entirely.

6. **Lines 46-56**: Update Text Colors table -- remove `color-` infix from all token names:
   - `text-color-primary` -> `text-primary`
   - `text-color-secondary` -> `text-secondary`
   - `text-color-tertiary` -> `text-tertiary`
   - `text-color-placeholder` / `text-color-disabled` -> `text-placeholder` / `text-disabled`
   - `text-color-accent-primary` -> `text-accent-primary`
   - `text-color-on-color` -> `text-on-color`
   - `text-color-success-primary` etc -> `text-success-primary` etc

7. **Lines 59-63**: Update Borders table -- remove `color-` infix:
   - `border-color-subtle` -> `border-subtle`
   - `border-color-strong` -> `border-strong`
   - `border-color-accent-strong` / `border-color-danger-strong` -> `border-accent-strong` / `border-danger-strong`

8. **Line 71**: Input example -- update `border-subtle-1` reference
   - Old: `<input className="bg-layer-2 border-[0.5px] border-subtle-1 ..." />`
   - New: `<input className="bg-layer-2 border-[0.5px] border-subtle ..." />`

9. **Line 82**: Dark mode example -- remove `-color-` infix
   - Old: `<div className="bg-surface-1 text-color-primary border-color-subtle">`
   - New: `<div className="bg-surface-1 text-primary border-subtle">`

### Step 2: Fix `mobx-stores.md`

**Reference:** `.claude/rules/mobx-stores.md` (the corrected version)

1. **Line 23**: Change import source for `set`
   - Old: `import { set } from "mobx";`
   - New: `import { set } from "lodash-es";`

2. **Line 74**: Update Critical Rules bullet
   - Old: `- **ALWAYS** \`set()\` from MobX for dynamic record keys (NOT \`this.map[id] = x\`)`
   - New: `- **ALWAYS** \`set()\` from \`lodash-es\` for dynamic record keys (NOT \`this.map[id] = x\`, NOT from \`mobx\`)`

3. **Line 75**: Add `observer()` source clarification (P3 fix included here)
   - Old: `- **ALWAYS** \`observer()\` wrapper on components reading stores`
   - New: `- **ALWAYS** \`observer()\` from \`mobx-react\` (NOT \`mobx-react-lite\`) on components reading stores`

4. **After line 75** (Critical Rules section): Add SWR deprecation note
   - Add: `- **SWR (`useSWR`) is deprecated** in this codebase. Use MobX stores for all data fetching.`
     <!-- Updated: Validation Session 5 - SWR deprecation note instead of separate file -->
     <!-- Updated: Validation Session 6 - Propagated from Session 5 unchecked action item -->

### Step 3: Fix `i18n-rules.md`

**Reference:** `.claude/rules/i18n-rules.md` (the corrected version)

1. **Lines 3-4**: Replace `paths:` YAML with markdown comment (remove admin scope)
   <!-- Updated: Validation Session 4 - Fixed contradiction: use markdown comment, not YAML paths: -->
   - Old:

   ```
   paths:
     - apps/web/**/*.tsx
     - apps/admin/**/*.tsx
     - packages/i18n/**
   ```

   - New:

   ```
   <!-- Scope: apps/web/**/*.tsx, packages/i18n/** -->
   ```

2. **After line 8** (title): Add explicit scope statement
   - Add: `**Scope**: \`apps/web\` and \`packages/i18n\` only. NOT for \`apps/admin\` -- admin app has no i18n.`
     (This matches Claude Code version line 9)

### Step 4: Fix `frontend-implementation-checklist.md`

**Reference:** `.claude/rules/frontend-implementation-checklist.md` (the corrected version)

1. **Line 47**: Flip color token check direction
   - Old: `- [ ] Text: \`text-color-\*\` (NOT \`text-tertiary\` -> \`text-color-tertiary\`)`
   - New: `- [ ] Text: \`text-\*\` (NOT \`text-color-tertiary\` -> use \`text-tertiary\`)`

2. **Line 48**: Flip border token check direction
   - Old: `- [ ] Border: \`border-color-\*\` (NOT \`border-subtle\` -> \`border-color-subtle\`)`
   - New: `- [ ] Border: \`border-\*\` (NOT \`border-color-subtle\` -> use \`border-subtle\`)`

3. **Line 81**: Update grep pattern to check for LEGACY tokens (violations)
   - Old: `grep -n 'text-tertiary\|text-secondary\|border-subtle\|bg-surface-1' <file>.tsx`
   - New: `grep -n 'text-color-tertiary\|text-color-secondary\|border-color-subtle\|bg-surface-1' <file>.tsx`

4. **Line 89**: Fix Common Traps table entry
   - Old: `| Wrong token prefix    | Always \`text-color-tertiary\`, never \`text-tertiary\` |`
   - New: `| Wrong token prefix    | Always \`text-tertiary\`, never \`text-color-tertiary\` |`

### Step 5: Fix `plane-design-system.md`

1. **Line 34**: Update Top 10 rule #3
   - Old: `3. **\`text-color-\*\` infix\*\* -- \`text-tertiary\` WRONG -> \`text-color-tertiary\` (-> \`color-tokens.md\`)`
   - New: `3. **\`text-\*\` short form\*\* -- \`text-color-tertiary\` LEGACY -> use \`text-tertiary\` (-> \`color-tokens.md\`)`

### Step 6: Replace `paths:` frontmatter with markdown comments — ALL 18 files

<!-- Updated: Validation Session 1 - Replace YAML paths: with markdown comments -->
<!-- Updated: Validation Session 2 - Expanded scope to ALL .agent/rules/ files with paths: -->

For ALL `.agent/rules/` files with `paths:` frontmatter (18 files), replace YAML `paths:` with markdown comments:

**Pattern:**

- Old: `paths:\n  - apps/web/**/*.tsx`
- New: `<!-- Scope: apps/web/**/*.tsx -->`

**Full file list (18 files):**

1. `color-tokens.md` (also modified in Step 1)
2. `mobx-stores.md` (also modified in Step 2)
3. `i18n-rules.md` (also modified in Step 3)
4. `frontend-implementation-checklist.md` (also modified in Step 4)
5. `plane-design-system.md` (also modified in Step 5)
6. `routing-layouts.md`
7. `forms-inputs.md`
8. `dialogs-modals.md`
9. `component-libraries.md`
10. `backend-views.md`
11. `backend-urls-celery.md`
12. `backend-testing-i18n.md`
13. `backend-serializers.md`
14. `backend-models.md`
15. `api-services.md`
16. `types-interfaces.md`
17. `plane-backend-architecture.md` (also modified in Phase 3)
18. `ce-override-pattern.md`

## Todo List

- [x] Step 1: Fix color-tokens.md (9 changes)
- [x] Step 2: Fix mobx-stores.md (3 changes, SWR moved to Phase 2)
- [x] Step 3: Fix i18n-rules.md (2 changes)
- [x] Step 4: Fix frontend-implementation-checklist.md (4 changes)
- [x] Step 5: Fix plane-design-system.md (1 change)
- [x] Step 6: Replace `paths:` frontmatter with markdown comments in ALL 18 .agent/rules/ files
- [x] Validation: grep for zero legacy patterns in corrected contexts

## Success Criteria

1. `grep -r 'text-color-' .agent/rules/` returns ONLY lines in "WRONG"/"legacy"/"NEVER" example contexts
2. `grep -r 'from "mobx"' .agent/rules/mobx-stores.md` returns ONLY the `makeObservable` import line, NOT `set`
3. `grep -r 'apps/admin' .agent/rules/i18n-rules.md` returns zero matches
4. Grep patterns in checklist now flag LEGACY tokens (text-color-_) not SHORT-FORM tokens (text-_)

## Risk Assessment

- **Low risk**: All changes mirror already-verified Claude Code rule updates
- **Potential issue**: Antigravity agent may have cached old rules -- clear cache if behavior doesn't change after update

## Security Considerations

None -- Markdown rule files only, no code execution or credentials involved.

## Next Steps

Phase 2: Add missing rule files (backend-testing.md, prettier-formatting.md)
