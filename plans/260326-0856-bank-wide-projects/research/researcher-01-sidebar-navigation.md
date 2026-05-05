# Research: Sidebar Navigation & HO Menu

## Key Findings

### HO Menu Implementation

- **Constants**: `packages/constants/src/workspace.ts` lines 282-288
- **CE Wrapper**: `apps/web/ce/components/workspace/sidebar/sidebar-item.tsx` line 23
  - Condition: `if (item.key === "ho" && !currentWorkspace?.is_board_of_director_workspace) return null;`
- **Icon**: `apps/web/ce/components/workspace/sidebar/helper.tsx` lines 47-48
- **Route**: `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/layout.tsx` & `page.tsx`

### Board of Director Identification

- Flag: `is_board_of_director_workspace: boolean` on `IWorkspace` type
- File: `packages/types/src/workspace.ts` line 37

### Static Navigation Items Array

```
WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS = [home, ho]
WORKSPACE_SIDEBAR_STATIC_PINNED_NAVIGATION_ITEMS_LINKS = [projects]
```

- Rendered in: `apps/web/core/components/workspace/sidebar/sidebar-menu-items.tsx` lines 100-102

### Existing Bank-wide Features

- `apps/web/ce/components/projects/settings/bank-wide/root.tsx` — toggle in project settings (already exists)
- `apps/web/ce/components/issues/spreadsheet/columns/bank-wide-project-column.tsx` — column display

## Addition Pattern

1. Add item key to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS` in constants
2. Add key to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS` array
3. Add conditional in CE sidebar-item.tsx (same pattern as `ho`)
4. Add icon in helper.tsx
5. Create route directory + layout.tsx + page.tsx
