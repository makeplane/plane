# Phase 03: Replace Custom Dropdown with Propel Menu

## Context Links

- [Design Audit Report](../reports/design-review-260302-1619-dashboard-design-audit.md) — M2
- [Menu usage reference](../../apps/web/core/components/navigation/tab-navigation-overflow-menu.tsx)

## Overview

- **Priority:** P2
- **Status:** pending
- **Description:** Replace custom hover-based dropdown in `dashboard-card.tsx` (lines 65-94) with `@plane/propel/menu` component for keyboard accessibility and focus trap

## Key Insights

- Current implementation uses `hidden group-hover:block` CSS pattern — not keyboard accessible, no focus trap
- `@plane/propel/menu` provides: keyboard navigation, focus trap, click-outside close, proper ARIA attributes
- Reference usage found in `tab-navigation-overflow-menu.tsx`: `Menu`, `Menu.MenuItem`, with `customButton` prop
- The menu must `stopPropagation` on trigger click to prevent card navigation

## Requirements

- Dashboard card action menu uses `@plane/propel/menu`
- Keyboard accessible (Tab, Enter, Escape)
- Click outside closes menu
- Card click still navigates to dashboard detail

## Architecture

Current (custom CSS dropdown):

```
<div class="group">
  <button> MoreHorizontal icon </button>
  <div class="hidden group-hover:block"> ← CSS-only, no a11y
    <button>Edit</button>
    <button>Delete</button>
  </div>
</div>
```

Target (Propel Menu):

```
<Menu>
  customButton={<MoreHorizontal icon button>}
  <Menu.MenuItem onClick={onEdit}>Edit</Menu.MenuItem>
  <Menu.MenuItem onClick={onDelete}>Delete</Menu.MenuItem>
</Menu>
```

## Related Code Files

### Files to modify

1. `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-card.tsx` — lines 64-94

### Reference files

- `apps/web/core/components/navigation/tab-navigation-overflow-menu.tsx` — Menu usage pattern

## Embedded Rules

- **Prefer `@plane/propel/*`** over `@plane/ui` for new component usage
- **Import subpath:** `import { Menu } from "@plane/propel/menu"`
- **observer()** must be preserved on DashboardCard
- **Stop propagation** on menu trigger to prevent card click handler firing

## Implementation Steps

### Step 1: Add Menu import

**File:** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-card.tsx`

Add import:

```typescript
import { Menu } from "@plane/propel/menu";
```

### Step 2: Replace custom dropdown (lines 64-94)

Replace the entire actions menu block with:

```tsx
{
  /* Actions menu */
}
<div
  className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
  onClick={(e) => e.stopPropagation()}
  onKeyDown={(e) => e.stopPropagation()}
>
  <Menu
    ellipsis
    customButton={
      <div className="flex h-6 w-6 items-center justify-center rounded hover:bg-layer-1">
        <MoreHorizontal className="h-4 w-4 text-color-secondary" />
      </div>
    }
  >
    <Menu.MenuItem onClick={() => onEdit(dashboard)}>
      <div className="flex items-center gap-2 text-sm text-color-secondary">
        <Pencil className="h-3.5 w-3.5" />
        {t("analytics_dashboard.context_edit")}
      </div>
    </Menu.MenuItem>
    <Menu.MenuItem onClick={() => onDelete(dashboard)}>
      <div className="flex items-center gap-2 text-sm text-color-danger-primary">
        <Trash2 className="h-3.5 w-3.5" />
        {t("analytics_dashboard.context_delete")}
      </div>
    </Menu.MenuItem>
  </Menu>
</div>;
```

**Note:** This step depends on Phase 2 having added `useTranslation` to this component. If implementing before Phase 2, use hardcoded strings temporarily ("Edit", "Delete") and Phase 2 will replace them.

### Step 3: Remove unused relative wrapper div

The old code had a `relative` positioned wrapper for the absolute dropdown. The Menu component handles positioning internally — remove `relative` from the wrapper if present.

## Post-Phase Checklist

- [ ] `@plane/propel/menu` imported (not `@plane/ui`)
- [ ] Menu opens on click (not just hover)
- [ ] Menu closes on click-outside and Escape
- [ ] Keyboard navigation works (Tab → Enter opens, Arrow keys navigate)
- [ ] Card click still navigates to dashboard detail (stopPropagation on menu wrapper)
- [ ] Edit/Delete callbacks fire correctly
- [ ] `observer()` wrapper preserved
- [ ] `pnpm check:lint` passes
- [ ] Visual appearance matches other menus in codebase

## Todo

- [ ] Add `Menu` import from `@plane/propel/menu`
- [ ] Replace custom dropdown with `Menu` + `Menu.MenuItem`
- [ ] Verify stopPropagation prevents card navigation
- [ ] Lint check passes

## Success Criteria

- Menu is keyboard accessible
- Menu has proper focus trap
- No visual regression on card layout
- Card click-to-navigate still works

## Risk Assessment

- **Low:** Well-established pattern in codebase (see reference file)
- Menu positioning might differ from old absolute dropdown — may need `optionsClassName` to adjust width/alignment
- If `Menu` API differs from expected, check `@plane/propel/menu` exports

## Security Considerations

- N/A — UI-only change

## Next Steps

- Phase 4: Layout patterns
