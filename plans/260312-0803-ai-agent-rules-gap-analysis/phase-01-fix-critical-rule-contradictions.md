# Phase 1: Fix Critical Rule Contradictions (P1)

## Context Links

- [Plan Overview](plan.md)
- [Plane Patterns Research](research/researcher-01-plane-patterns.md)
- [Anti-Hallucination Research](research/researcher-02-anti-hallucination.md)
- [Design Guidelines (already fixed)](../../docs/design-guidelines.md)

## Overview

- **Priority**: P1
- **Status**: complete
- **Effort**: 45m
- **Description**: Fix 3 critical contradictions where rule files tell AI the OPPOSITE of what the codebase actually does. These cause every AI-generated component to use wrong color tokens, wrong imports, and unnecessary i18n wrappers.

## Key Insights

- Grep verified: 87% of codebase uses SHORT form (`text-primary`, `border-subtle`), only 13% uses long form (`text-color-primary`)
- ALL 15+ store files import `set` from `lodash-es`, ZERO import from `mobx`
- `useTranslation` has ZERO occurrences in `apps/admin/` — admin app has no i18n at all
- `docs/design-guidelines.md` was already corrected in a previous session, but the 3 rule files were not

## Requirements

- **Functional**: All 3 rule files must match actual codebase conventions
- **Non-functional**: Changes must not break existing correct patterns; old form should be noted as "legacy, do not add new"

## Architecture

### GAP 1: Color Token Naming (3 files)

**Current (WRONG)**: Rules say `text-color-primary`, `border-color-subtle` with `-color-` infix
**Actual codebase**: Uses `text-primary`, `text-secondary`, `text-tertiary`, `border-subtle`, `border-strong` (short form, 87%)

Files to fix:

- `.claude/rules/color-tokens.md` — entire file uses wrong naming
- `.claude/rules/frontend-implementation-checklist.md` — lines 47-49, line 89
- `.claude/rules/plane-design-system.md` — line 3 of Top 10 rules

### GAP 2: MobX `set()` Import (1 file)

**Current (WRONG)**: `import { set } from "mobx"` (line 23 of mobx-stores.md)
**Actual codebase**: `import { set } from "lodash-es"` in all store files

### GAP 3: i18n Scope (1 file)

**Current (WRONG)**: `paths:` includes `apps/admin/**/*.tsx`
**Actual codebase**: Admin app has zero i18n usage

## Related Code Files

- **Modify**: `.claude/rules/color-tokens.md`
- **Modify**: `.claude/rules/frontend-implementation-checklist.md`
- **Modify**: `.claude/rules/plane-design-system.md`
- **Modify**: `.claude/rules/mobx-stores.md`
- **Modify**: `.claude/rules/i18n-rules.md`

## Embedded Rules

1. **Rule accuracy**: Every rule statement MUST be verified against actual codebase grep results before writing
2. **Negative examples**: Every correction MUST include ❌ WRONG and ✅ CORRECT examples
3. **Path scoping**: Every rule file MUST have correct `paths:` frontmatter matching actual directories
4. **No contradictions**: After editing, grep for the old incorrect pattern across ALL rule files to ensure no contradictions remain

## Implementation Steps

### Step 1: Fix `color-tokens.md` — Complete Rewrite of Token Naming

Replace the naming convention section. Change from:

```
text-color-* (WITH color- infix)
border-color-* (WITH color- infix)
```

To:

```
text-* (WITHOUT color- infix) → text-primary, text-secondary, text-tertiary
border-* (WITHOUT color- infix) → border-subtle, border-strong
bg-* (no change) → bg-surface-1, bg-layer-2
```

Specific changes in `color-tokens.md`:

- Line 16: `text-color-*` → `text-*`; examples `text-primary`, `text-tertiary`
- Line 17: `border-color-*` → `border-*`; examples `border-subtle`, `border-strong`
- Line 20: Flip the "Common mistake" — `text-color-tertiary` is LEGACY → use `text-tertiary`
- Lines 22-31: Remove/rewrite the "Tailwind v4 Infrastructure Naming" section about double-namespace `--text-color-color-*`. This is misleading; the short form works.
- Lines 46-63: Update ALL text and border token tables to short form
- Lines 81-84: Update dark mode example to use short form
- Line 71: Update input example `border-subtle-1` (verify this exists in codebase)

### Step 2: Fix `frontend-implementation-checklist.md`

- Line 47: Change `text-color-*` to `text-*` and flip the example
- Line 48: Change `border-color-*` to `border-*` and flip the example
- Line 81 grep command: Update to search for `text-color-tertiary` (the WRONG form now)
- Line 89 Common Traps table: Change from "Always `text-color-tertiary`, never `text-tertiary`" to "Always `text-tertiary`, never `text-color-tertiary`"

### Step 3: Fix `plane-design-system.md`

- Line 3 of Top 10: Change `text-tertiary WRONG → text-color-tertiary` to `text-color-tertiary LEGACY → text-tertiary`

### Step 4: Fix `mobx-stores.md` — `set()` Import

- Line 23: Change `import { set } from "mobx"` to `import { set } from "lodash-es"`
- Line 74: Update the Critical Rules bullet — change `set() from MobX` to `set() from lodash-es`

### Step 5: Fix `i18n-rules.md` — Remove Admin Scope

- Remove `apps/admin/**/*.tsx` from `paths:` frontmatter
- Add note after the title: "**Scope**: `apps/web` and `packages/i18n` only. NOT for `apps/admin` — admin app has no i18n."

### Step 6: Verification — Grep for Contradictions

After all edits, run:

```bash
# Should return ZERO hits in rule files for old wrong patterns:
grep -r "text-color-primary\|text-color-tertiary\|text-color-secondary" .claude/rules/ --include="*.md"
# Exception: may appear in ❌ WRONG examples — verify each hit is in a negative example

# Verify set import is correct:
grep -r 'from "mobx"' .claude/rules/ --include="*.md"
# Should NOT contain set import from mobx

# Verify admin not in i18n paths:
grep -r "apps/admin" .claude/rules/i18n-rules.md
# Should return ZERO hits
```

## Post-Phase Checklist

- [ ] All 3 rule files use short-form color tokens (`text-primary`, `border-subtle`)
- [ ] `mobx-stores.md` imports `set` from `lodash-es`, not `mobx`
- [ ] `i18n-rules.md` paths no longer include `apps/admin`
- [ ] Grep verification passes: no old wrong patterns remain in rule files (outside ❌ examples)
- [ ] Each correction has ❌ WRONG / ✅ CORRECT example pair
- [ ] `docs/design-guidelines.md` still consistent with updated rules

## Todo List

- [ ] Rewrite color token naming in `color-tokens.md`
- [ ] Update token tables (text, border) in `color-tokens.md`
- [ ] Fix dark mode example in `color-tokens.md`
- [ ] Fix checklist lines 47-49 and Common Traps in `frontend-implementation-checklist.md`
- [ ] Fix Top 10 rule #3 in `plane-design-system.md`
- [ ] Fix `set` import in `mobx-stores.md`
- [ ] Remove `apps/admin` from `i18n-rules.md` paths
- [ ] Run grep verification across all rule files
- [ ] Mark phase complete in plan.md

## Success Criteria

- AI agents generating new components use `text-primary` (not `text-color-primary`)
- AI agents use `import { set } from "lodash-es"` in store code
- AI agents do NOT add `t()` wrappers in admin app components
- Zero contradictions across all `.claude/rules/` files

## Risk Assessment

- **Risk**: Changing rules might confuse AI about the 13% legacy code that still uses long form
  - **Mitigation**: Phase 5 bulk-replaces all legacy usage. Rules state short form is the only accepted form — no legacy caveat needed.
  <!-- Updated: Validation Session 3 - Removed "do not convert existing" caveat since Phase 5 handles full cleanup -->
- **Risk**: Other rule files we haven't identified may reference old conventions
  - **Mitigation**: Step 6 grep verification catches any remaining references

## Security Considerations

- No security impact — changes are to AI agent instruction files only, not application code

## Next Steps

- Phase 2 depends on this phase for consistent rule conventions
- After Phase 1, all subsequent rule additions will use correct token naming
