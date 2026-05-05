# Phase 01 — Navigation Setup

**Parent:** [plan.md](./plan.md)
**Date:** 2026-03-10
**Status:** ⬜ pending

## Overview

Register "HO" as a dynamic workspace sidebar nav item. Dynamic items live in the collapsible "Workspace" section (alongside Views, Analytics, Dashboards, Archives). Users can pin/unpin and reorder it.

## Key Insights

- `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS` is consumed by `sidebar-menu-items.tsx` (core — do NOT modify) via `sortedNavigationItems`
- CE `helper.tsx` already handles all icon mappings — safe to add `ho` case
- `routes/core.ts` must be modified to register the new route path

## Requirements

<!-- Updated: Validation Session 1 - Changed from DYNAMIC to STATIC, added BOD workspace check -->

1. Add `ho` entry to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS` object (NOT dynamic)
2. Append to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS` array
3. Use hardcoded label `"HO"` (no i18n key needed)
4. Set `access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER]` (no Guest)
5. Add icon case in CE `helper.tsx`
6. Register route `/:workspaceSlug/ho` in `routes/core.ts`
7. Add `is_board_of_director_workspace` visibility check in CE `SidebarItem` for key `"ho"`

## Related Code Files

- `packages/constants/src/workspace.ts` — nav item definitions (lines 201-237)
- `apps/web/ce/components/workspace/sidebar/helper.tsx` — icon switch (lines 22-47)
- `apps/web/app/routes/core.ts` — route config (line ~104 stickies pattern)

## Implementation Steps

### 1. `packages/constants/src/workspace.ts`

Add `ho` to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS` object:

```typescript
ho: {
  key: "ho",
  label: "HO",              // hardcoded, no i18n
  href: `/ho/`,
  access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
  highlight: (pathname: string, url: string) => pathname.includes(url),
},
```

Then append to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS`:

```typescript
WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS["ho"],
```

> Note: Check if `IWorkspaceSidebarNavigationItem` uses `label` or `labelTranslationKey` — use `label` for hardcoded string, or set `labelTranslationKey: "ho"` and handle fallback in the sidebar item renderer.

### 2. `apps/web/ce/components/workspace/sidebar/helper.tsx`

Add case before the closing brace of the switch:

```typescript
case "ho":
  return <BuildingIcon className={cn("size-4 flex-shrink-0", className)} />;
```

Use `Building2` from lucide-react if `@plane/propel/icons` has no org icon.

### 3. `apps/web/app/routes/core.ts`

After the stickies route block (line ~104):

```typescript
layout("./(all)/[workspaceSlug]/(projects)/ho/layout.tsx", [
  route(":workspaceSlug/ho", "./(all)/[workspaceSlug]/(projects)/ho/page.tsx"),
]),
```

## Todo

<!-- Updated: Validation Session 1 -->

- [ ] Add `ho` to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS` (hardcoded label, ADMIN+MEMBER access)
- [ ] Append to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS`
- [ ] Add icon in `helper.tsx` (use `Building2` from lucide-react)
- [ ] Register route in `routes/core.ts`
- [ ] Add `is_board_of_director_workspace` check in CE `SidebarItem` for key `"ho"` (reads from workspace store)

## Success Criteria

- "HO" appears in the Workspace sidebar section
- Clicking navigates to `/:workspaceSlug/ho`
- Icon renders correctly
- No TypeScript errors

## Risk

- `labelTranslationKey: "sidebar.ho"` — i18n key may not exist; use hardcoded label `"HO"` as fallback or add to translation files if needed
