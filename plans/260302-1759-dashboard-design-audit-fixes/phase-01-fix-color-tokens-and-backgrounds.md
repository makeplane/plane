# Phase 01: Fix Color Tokens & Backgrounds

## Context Links

- [Design Audit Report](../reports/design-review-260302-1619-dashboard-design-audit.md) — C2, C3
- [Code Standards](../../docs/code-standards.md)

## Overview

- **Priority:** P0 (C2) + P1 (C3)
- **Status:** pending
- **Description:** Fix wrong Tailwind color token names in toolbar + wrong `bg-surface-1` in modal/filter inputs

## Key Insights

- Tokens without `color-` prefix (`text-tertiary`, `border-subtle`, `text-accent-primary`) may not resolve in all themes
- `bg-surface-1` on inputs/lists inside modals should be `bg-layer-2` per Plane's layering convention

## Requirements

- All color tokens in dashboard files use correct `color-` prefixed names
- Modal inputs/lists use `bg-layer-2` instead of `bg-surface-1`

## Related Code Files

### Files to modify

1. `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/dashboard-toolbar.tsx` (C2)
2. `apps/web/ce/components/dashboards/config/filter-settings-section.tsx` (C3)
3. `apps/web/ce/components/dashboards/dashboard-form-modal.tsx` (C3)

## Embedded Rules

- **Semantic color tokens only** — never hardcode hex/rgb; use Plane's design token classes
- Layering convention: `bg-surface-1` = page background; `bg-layer-2` = elevated containers inside modals/panels
- Token naming: `text-color-*`, `border-color-*`, `bg-*` (bg tokens don't use `color-` prefix)

## Implementation Steps

### Step 1: Fix `dashboard-toolbar.tsx` (C2)

**File:** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/dashboard-toolbar.tsx`

Line 31 — container div:

```diff
- border-b border-subtle bg-surface-1
+ border-b border-color-subtle bg-surface-1
```

Line 37 — back arrow icon:

```diff
- text-tertiary
+ text-color-tertiary
```

Line 39 — dashboard icon:

```diff
- text-accent-primary
+ text-color-accent-primary
```

Line 43 — description text:

```diff
- text-sm text-tertiary
+ text-sm text-color-tertiary
```

### Step 2: Fix `filter-settings-section.tsx` (C3)

**File:** `apps/web/ce/components/dashboards/config/filter-settings-section.tsx`

Line 77 — first date input:

```diff
- bg-surface-1
+ bg-layer-2
```

Line 84 — second date input:

```diff
- bg-surface-1
+ bg-layer-2
```

### Step 3: Fix `dashboard-form-modal.tsx` (C3)

**File:** `apps/web/ce/components/dashboards/dashboard-form-modal.tsx`

Line 177 — project list container:

```diff
- bg-surface-1
+ bg-layer-2
```

Also line 200 — checkbox unchecked state:

```diff
- bg-surface-1
+ bg-layer-2
```

## Post-Phase Checklist

- [ ] All `border-subtle` → `border-color-subtle` in toolbar
- [ ] All `text-tertiary` → `text-color-tertiary` in toolbar
- [ ] All `text-accent-primary` → `text-color-accent-primary` in toolbar
- [ ] Date inputs in filter-settings use `bg-layer-2`
- [ ] Project list in form-modal uses `bg-layer-2`
- [ ] Run `pnpm check:lint` — no new errors
- [ ] Visual check: tokens resolve correctly in light/dark theme

## Todo

- [ ] Fix 4 wrong tokens in `dashboard-toolbar.tsx`
- [ ] Fix 2 bg tokens in `filter-settings-section.tsx`
- [ ] Fix 2 bg tokens in `dashboard-form-modal.tsx`
- [ ] Lint check passes

## Success Criteria

- All color tokens follow `text-color-*` / `border-color-*` naming
- Modal inputs use `bg-layer-2`
- No visual regressions

## Risk Assessment

- **Low risk** — simple find-replace, no logic changes
- If `border-color-subtle` doesn't exist in theme config, verify in `@plane/tailwind-config`

## Security Considerations

- N/A — cosmetic changes only

## Next Steps

- Phase 2: i18n translations
