# Phase 02 — Page & Components

**Parent:** [plan.md](./plan.md)
**Depends on:** [phase-01-navigation-setup.md](./phase-01-navigation-setup.md)
**Date:** 2026-03-10
**Status:** ⬜ pending

## Overview

Create the HO page layout and CE department list components. Follows the stickies layout pattern (AppHeader + ContentWrapper + Outlet). Department data fetched with SWR via existing `DepartmentService.getDepartments()`.

## Key Insights

- Stickies layout pattern: `AppHeader` + `ContentWrapper` + `<Outlet />` — reuse for HO
- Department service already exists at `apps/web/ce/services/department.service.ts`
- Use `useSWR` with `workspaceSlug` from `useParams()` for data fetching
- CE components go in `apps/web/ce/components/ho/`
- `IDepartment`: id, name, code, short_name, parent (id), level, staff_count, children

## Requirements

<!-- Updated: Validation Session 1 - flat table confirmed; add BOD workspace guard on page -->

1. `layout.tsx` — AppHeader + ContentWrapper shell
2. `page.tsx` — imports and renders CE `<HoDepartmentList />`; guard: if not BOD workspace, show "Not available"
3. `department-list.tsx` — fetches departments, renders flat table
4. `department-list-item.tsx` — single row: Name, Code, Short Name, Parent, Staff Count, Level

## Architecture

```
ho/
├── layout.tsx          — AppHeader + ContentWrapper + Outlet
└── page.tsx            — renders <HoDepartmentList />

ce/components/ho/
├── department-list.tsx      — SWR fetch + list render
└── department-list-item.tsx — single department row
```

## Related Code Files

- `apps/web/app/(all)/[workspaceSlug]/(projects)/stickies/layout.tsx` — layout pattern
- `apps/web/app/(all)/[workspaceSlug]/(projects)/stickies/page.tsx` — page pattern
- `apps/web/ce/services/department.service.ts` — `getDepartments(workspaceSlug)`
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/page.tsx` — existing dept UI reference

## Implementation Steps

### 1. `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/layout.tsx`

Mirror stickies layout:

```tsx
import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";

export default function HoLayout() {
  return (
    <>
      <AppHeader header={<h2 className="text-h5-semibold">HO</h2>} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
```

### 2. `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/page.tsx`

```tsx
import { PageHead } from "@/components/core/page-title";
import { HoDepartmentList } from "@/plane-web/components/ho/department-list";

export default function HoPage() {
  return (
    <>
      <PageHead title="HO — Departments" />
      <HoDepartmentList />
    </>
  );
}
```

### 3. `apps/web/ce/components/ho/department-list.tsx`

- `useParams()` → `workspaceSlug`
- `useSWR(\`departments-${workspaceSlug}\`, () => service.getDepartments(workspaceSlug))`
- Build `parentMap: Record<string, string>` from flat list (id → name)
- Render table/list of `<HoDepartmentListItem>` rows
- Handle loading and empty states

### 4. `apps/web/ce/components/ho/department-list-item.tsx`

Columns to display:
| Field | Source |
|---|---|
| Name | `dept.name` |
| Code | `dept.code` |
| Short Name | `dept.short_name` |
| Parent | `parentMap[dept.parent]` or `—` |
| Staff | `dept.staff_count` |
| Level | `dept.level` |

## Todo

- [ ] Create `ho/layout.tsx`
- [ ] Create `ho/page.tsx`
- [ ] Create `ce/components/ho/department-list.tsx`
- [ ] Create `ce/components/ho/department-list-item.tsx`

## Success Criteria

- `/dgd-her-jung-chul/ho` renders department list
- Loading state shown while fetching
- Empty state when no departments
- Table columns: Name, Code, Short Name, Parent, Staff Count, Level
- No TypeScript errors, components < 150 lines

## Risk

- `@/plane-web/components/ho/department-list` alias — verify path alias maps to `apps/web/ce/components/` correctly (same pattern as other CE components)
- `DepartmentService` instantiation — check if it's a singleton export or requires `new DepartmentService()`
