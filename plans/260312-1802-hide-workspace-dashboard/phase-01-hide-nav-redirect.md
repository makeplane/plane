# Phase 01 — Hide Navigation & Redirect Routes

**Parent:** [plan.md](./plan.md)

## Overview

- **Date:** 2026-03-12
- **Priority:** P2
- **Effort:** 30m
- **Status:** pending

## Key Insights

Two separate sidebar components render the dashboard link independently:

1. `user-menu.tsx` (top of sidebar — personal items) — inline array inside component
2. `workspace.ts` constants → `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS` — drives workspace-level sidebar nav

Both must be modified to fully remove the link from the sidebar. Direct URL (`/:workspaceSlug/dashboards`) also needs to be guarded via a redirect in `layout.tsx`.

`user-menu.tsx` is a core file, but the change is a minimal single-item removal from a local array — acceptable for this temporary hide.

## Requirements

- Dashboard link invisible in sidebar (both sections)
- Direct URL navigates away (redirect to workspace home)
- No code deleted — only commented out or filtered
- Reversible in one PR

## Related Files

| File                                                                  | Change                                                                                                                          |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `packages/constants/src/workspace.ts:235`                             | Remove `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["dashboards"]` from `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS` array |
| `apps/web/core/components/workspace/sidebar/user-menu.tsx:33-39`      | Remove/comment dashboard item from `SIDEBAR_USER_MENU_ITEMS`                                                                    |
| `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/layout.tsx` | Add `<Navigate>` redirect to `/:workspaceSlug/`                                                                                 |

## Implementation Steps

### Step 1 — Comment out from constants array

<!-- Updated: Validation Session 1 - use comment-out not removal -->

**File:** `packages/constants/src/workspace.ts`

Comment out line 235:

```ts
export const WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS: IWorkspaceSidebarNavigationItem[] = [
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["views"],
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["analytics"],
  // WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["dashboards"],  // temporarily hidden
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["archives"],
];
```

### Step 2 — Comment out from user-menu sidebar

<!-- Updated: Validation Session 1 - comment out item + import, not delete -->

**File:** `apps/web/core/components/workspace/sidebar/user-menu.tsx`

Comment out the dashboard item from `SIDEBAR_USER_MENU_ITEMS` (lines 33-39):

```ts
// {
//   key: "dashboards",
//   labelTranslationKey: "workspace_dashboards",
//   href: `/${workspaceSlug.toString()}/dashboards/`,
//   access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
//   Icon: DashboardIcon,
// },
```

Also comment out the `DashboardIcon` import if no other items use it.

### Step 3 — SKIPPED (URL guard)

<!-- Updated: Validation Session 1 - user chose to keep layout.tsx as-is, URL remains accessible directly -->

`dashboards/layout.tsx` is **not modified**. Direct URL access (`/:workspaceSlug/dashboards`) still works — only the nav links are hidden.

## Todo

- [ ] Step 1: Comment out dashboards from `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS`
- [ ] Step 2: Comment out dashboard item + `DashboardIcon` import in `user-menu.tsx`
- [ ] ~~Step 3: layout.tsx redirect~~ — skipped
- [ ] Verify: sidebar shows no dashboard link

## Success Criteria

- Sidebar has no "Dashboards" link in either section
- Direct URL `/:workspaceSlug/dashboards` still works — only nav links are hidden
- No TypeScript/lint errors

## Risk Assessment

- **Low risk** — no logic deleted, only navigation hidden
- `user-menu.tsx` is a core file but change is a 6-line array item removal
- If `DashboardIcon` is used elsewhere in user-menu.tsx, keep the import

## Revert Instructions

To re-enable dashboard:

1. Restore line in `workspace.ts` constants array
2. Restore item in `user-menu.tsx` array (+ import)
