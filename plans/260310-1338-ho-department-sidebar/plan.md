---
title: "HO Menu - Department List Sidebar"
description: "Add HO (Head Office) dynamic sidebar menu item showing workspace Department List"
status: completed
priority: P2
effort: 1.5h
branch: triho
tags: [sidebar, navigation, departments, CE]
created: 2026-03-10
---

# HO Menu — Department List Sidebar

Add "HO" as a new dynamic workspace sidebar navigation item (in the Workspace section, alongside Views/Analytics/Dashboards). Clicking it routes to `/:workspaceSlug/ho` which displays a flat Department List.

## Phases

| #   | Phase             | Status       | File                                                           |
| --- | ----------------- | ------------ | -------------------------------------------------------------- |
| 1   | Navigation Setup  | ✅ completed | [phase-01-navigation-setup.md](./phase-01-navigation-setup.md) |
| 2   | Page & Components | ✅ completed | [phase-02-page-components.md](./phase-02-page-components.md)   |

## Validation Log

### Session 1 — 2026-03-10

**Trigger:** Initial plan validation
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** The plan places HO in the collapsible "Workspace" section. Is this correct, or should HO appear as a static always-visible item directly below Stickies?
   - Options: Workspace section | Static, below Stickies
   - **Answer:** Static, below Stickies
   - **Rationale:** HO must be added to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS` (not dynamic). Since core `sidebar-menu-items.tsx` cannot be modified, HO will render in the static section (after Home). Stickies is a personal-preference item; HO will appear nearby but exact ordering depends on user prefs.

2. **[Architecture]** How should departments be displayed on the HO page?
   - Options: Flat list / table | Hierarchical tree
   - **Answer:** Flat list / table
   - **Rationale:** Simple table with columns: Name, Code, Short Name, Parent, Staff Count, Level.

3. **[Assumptions]** Who should be able to see the HO menu item?
   - Options: All roles | Admin & Member only
   - **Answer:** Admin & Member only — AND `is_board_of_director_workspace = true`
   - **Custom input:** "Admin, Member only and Board of Director Workspace = Yes"
   - **Rationale:** HO item must ONLY show when user is Admin or Member AND workspace has `is_board_of_director_workspace = true`. CE `SidebarItem` must add this check for the "ho" key. Page also guards if accessed directly.

4. **[Architecture]** How should the sidebar label "HO" be handled?
   - Options: Hardcode "HO" | Add i18n key
   - **Answer:** Hardcode "HO"
   - **Rationale:** No i18n file changes needed. Use `label: "HO"` directly instead of `labelTranslationKey`.

#### Confirmed Decisions

- **Placement**: Static section (not Workspace section) — added to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS`
- **Display**: Flat table (Name, Code, Short Name, Parent, Staff Count, Level)
- **Access**: Admin + Member roles AND `is_board_of_director_workspace === true`
- **Label**: Hardcoded "HO" string

#### Action Items

- [ ] Change from DYNAMIC to STATIC nav item
- [ ] Set `access: [ADMIN, MEMBER]` on the constant
- [ ] Add `is_board_of_director_workspace` check in CE `SidebarItem` for "ho" key
- [ ] Add `is_board_of_director_workspace` read from workspace store in SidebarItem
- [ ] Page-level guard: if workspace is not BOD, show "Not available" or redirect

#### Impact on Phases

- Phase 1: Change from `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS` → `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS`; use hardcoded label; access ADMIN+MEMBER; add BOD check in CE SidebarItem
- Phase 2: Add workspace store check (is_board_of_director_workspace) in page guard

## Files Modified / Created

### Modified

- `packages/constants/src/workspace.ts` — add `ho` to dynamic nav items
- `apps/web/ce/components/workspace/sidebar/helper.tsx` — add `ho` icon case
- `apps/web/app/routes/core.ts` — add ho route

### Created

- `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/layout.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/page.tsx`
- `apps/web/ce/components/ho/department-list.tsx`
- `apps/web/ce/components/ho/department-list-item.tsx`
