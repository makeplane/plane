# Phase 5: Legacy Token Cleanup (P3)

## Context Links

- [Plan Overview](plan.md)
- [Phase 1 — Critical Fixes](phase-01-fix-critical-rule-contradictions.md)
- [Design Guidelines](../../docs/design-guidelines.md)

## Overview

- **Priority**: P3
- **Status**: complete
- **Effort**: 30m
- **Description**: Bulk-replace ALL legacy `*-color-*` token usage (`text-color-*`, `border-color-*`, `bg-color-*`) with short-form equivalents across all frontend .tsx files. Ensures codebase consistency matches updated rules.

## Key Insights

- 13% of codebase (216 occurrences) still uses long-form `text-color-primary`, `border-color-subtle`
- 87% already uses correct short form
- Mixed patterns confuse AI agents — seeing both forms in codebase leads to inconsistent generated code
- Safe mechanical replacement — both forms resolve to same CSS variable

## Requirements

- **Functional**: Replace all `text-color-*` → `text-*`, `border-color-*` → `border-*`, and `bg-color-*` → `bg-*` in .tsx AND .ts files
- **Non-functional**: Must not break any styling; both forms are functionally equivalent

## Architecture

### Replacement Map

| Old (Legacy)                 | New (Standard)         |
| ---------------------------- | ---------------------- |
| `text-color-primary`         | `text-primary`         |
| `text-color-secondary`       | `text-secondary`       |
| `text-color-tertiary`        | `text-tertiary`        |
| `text-color-placeholder`     | `text-placeholder`     |
| `text-color-disabled`        | `text-disabled`        |
| `text-color-accent-primary`  | `text-accent-primary`  |
| `text-color-on-color`        | `text-on-color`        |
| `text-color-success-primary` | `text-success-primary` |
| `text-color-warning-primary` | `text-warning-primary` |
| `text-color-danger-primary`  | `text-danger-primary`  |
| `border-color-subtle`        | `border-subtle`        |
| `border-color-strong`        | `border-strong`        |
| `border-color-accent`        | `border-accent`        |
| `border-color-accent-strong` | `border-accent-strong` |
| `border-color-danger-strong` | `border-danger-strong` |
| `border-color-error`         | `border-error`         |
| `border-color-success`       | `border-success`       |
| `border-color-warning`       | `border-warning`       |
| `bg-color-accent`            | `bg-accent`            |
| `bg-color-success-primary`   | `bg-success-primary`   |
| `bg-color-danger-primary`    | `bg-danger-primary`    |
| `bg-color-error`             | `bg-error`             |
| `bg-color-success`           | `bg-success`           |
| `bg-color-warning`           | `bg-warning`           |
| `text-color-error`           | `text-error`           |
| `text-color-success`         | `text-success`         |
| `text-color-warning`         | `text-warning`         |

## Related Code Files

- **Modify**: All `.tsx` and `.ts` files under `apps/web/`, `apps/admin/`, `apps/space/` containing legacy tokens
<!-- Updated: Validation Session 5 - Expanded file scope from .tsx to .tsx + .ts -->

## Embedded Rules

1. **Rule accuracy**: Verify both old and new forms render identically (same CSS variable)
2. **Negative examples**: After replacement, grep must return 0 hits for old form in .tsx files
3. **Path scoping**: Only modify .tsx files in apps/ directories, NOT packages/tailwind-config CSS variables
4. **No contradictions**: CSS variable definitions in tailwind-config MUST NOT be modified — only Tailwind utility class names in components

## Implementation Steps

1. **Grep for all legacy occurrences**: `grep -r "text-color-\|border-color-\|bg-color-" apps/ --include="*.tsx" --include="*.ts" -l`
2. **Manual review bg-color-\* files**: Inspect `capacity-heatmap.tsx`, admin bulk-import files for dynamic class construction (`bg-color-${var}`). Only replace static class names; handle dynamic patterns manually.
<!-- Updated: Validation Session 6 - Added manual review step for bg-color-* before bulk replacement -->
3. **Run sed replacement for each pattern** (or use Edit tool per file)
4. **Verify zero remaining**: `grep -r "text-color-[a-z]\|border-color-[a-z]\|bg-color-[a-z]" apps/ --include="*.tsx" --include="*.ts" -l`
<!-- Updated: Validation Session 5 - Expanded grep/sed scope to include .ts files -->
5. **Run lint check**: `pnpm check:lint` to ensure no breakage
6. **Visual check**: Start dev server, verify pages render correctly in light/dark theme

### Step 6: Add ESLint Custom Plugin to Prevent Regression

<!-- Updated: Validation Session 2 - Added ESLint rule per scope expansion -->
<!-- Updated: Validation Session 3 - Specified custom plugin approach with auto-fix -->

Create a custom ESLint plugin at `packages/eslint-plugin-plane/` with auto-fix:

1. Create `packages/eslint-plugin-plane/rules/no-legacy-tokens.js`:
   - Match ALL string literals containing `text-color-`, `border-color-`, or `bg-color-` followed by a letter (~30 lines, simple matching)
   - Report warning with auto-fix: replace `text-color-` → `text-`, `border-color-` → `border-`, `bg-color-` → `bg-`
   <!-- Updated: Validation Session 5 - Confirmed simple string literal matching approach -->
2. Create `packages/eslint-plugin-plane/index.js` to export the plugin
3. Add `packages/eslint-plugin-plane/package.json` with name `eslint-plugin-plane`
4. Register plugin in root `eslint.config.mjs`
5. Exclude: CSS variable definitions in `packages/tailwind-config/`

### Step 7: Monorepo Integration

<!-- Updated: Validation Session 4 - Added explicit monorepo setup steps -->

1. Run `pnpm install` from repo root to link the new `eslint-plugin-plane` package
2. Verify package appears in `node_modules/eslint-plugin-plane` (symlink)
3. No turbo.json pipeline config needed — lint plugin has no build step

### Step 8: Verify ESLint Plugin

1. Run `pnpm check:lint` to verify rule works on any remaining legacy tokens
2. Test auto-fix: `pnpm fix:lint` should auto-replace any legacy tokens found

## Post-Phase Checklist

- [ ] Zero `text-color-*` occurrences in .tsx/.ts files (outside CSS variable definitions)
- [ ] Zero `border-color-*` occurrences in .tsx/.ts files (outside CSS variable definitions)
- [ ] Zero `bg-color-*` occurrences in .tsx/.ts files (outside CSS variable definitions)
- [ ] `pnpm check:lint` passes with 0 new errors
- [ ] `packages/tailwind-config/` CSS variables NOT modified
- [ ] Visual spot-check: light + dark theme render correctly
- [ ] `eslint-plugin-plane` warns on legacy tokens with auto-fix in .tsx files
- [ ] `pnpm install` run successfully, plugin symlinked in node_modules

## Todo List

- [ ] Grep and list all affected files (text-color-_, border-color-_, bg-color-\*)
- [ ] Run replacements for all _-color-_ patterns
- [ ] Verify zero remaining legacy tokens across all three prefixes
- [ ] Run lint
- [ ] Visual spot-check
- [ ] Create `packages/eslint-plugin-plane/` with `no-legacy-tokens` rule + auto-fix (all 3 prefixes)
- [ ] Run `pnpm install` to link new package
- [ ] Register plugin in `eslint.config.mjs`
- [ ] Verify plugin with `pnpm check:lint`
- [ ] Mark phase complete in plan.md

## Success Criteria

- 100% of frontend .tsx files use short-form tokens
- No visual regressions
- AI agents now see only one consistent pattern in codebase

## Risk Assessment

- **Risk**: Some `text-color-*` patterns may be in CSS files or Tailwind config, not just .tsx/.ts
  - **Mitigation**: Only modify .tsx/.ts files; CSS variable definitions must keep their naming
- **Risk**: Some files may use `text-color-*` in comments or strings, not as class names
  - **Mitigation**: Review grep results before bulk-replace; skip non-className occurrences
  <!-- Updated: Validation Session 5 - Risk scope expanded to .ts files -->

## Security Considerations

- No security impact — purely cosmetic class name changes

## Next Steps

- After this phase, full grep audit confirms zero mixed patterns
- Consider adding ESLint custom rule to prevent future regression
