# Phase 3: God-mode Frontend

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2: Backend API Migration](./phase-02-backend-api-migration.md)
- Admin sidebar: `apps/admin/hooks/use-sidebar-menu/core.ts`
- Admin store pattern: `apps/admin/store/instance-user.store.ts`
- Service pattern: `packages/services/src/user/instance-user.service.ts`
- Admin pages: `apps/admin/app/(all)/(dashboard)/users/`
- Existing workspace components to adapt: `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/`, `...staff/`

## Overview

- **Priority:** P1
- **Status:** completed
- **Effort:** 8h
- Create InstanceDepartmentService and InstanceStaffService in `packages/services/src/`. Create MobX stores in `apps/admin/store/`. Add sidebar menu items. Build department and staff management pages in admin app. Adapt existing workspace settings components (remove workspaceSlug deps, replace project selector with workspace selector).

## Key Insights

- Admin uses file-based routing: page at `apps/admin/app/(all)/(dashboard)/{feature}/page.tsx`
- Admin store pattern: MobX with `makeObservable` (explicit), `set()` for new keys, `runInAction` in async
- Service pattern: extends `APIService`, all calls to `/api/instances/` prefix
- Existing components in `apps/web/` can be adapted -- not copied. Move relevant shared logic
- Department form: replace project link dropdown with workspace link dropdown
- No confirm dialog needed for link-workspace: always auto-join all staff
<!-- Updated: Validation Session 1 - removed confirm dialog requirement -->

## Requirements

### Functional

- Admin sidebar: "Departments" and "Staff" menu items between "Users" and "Authentication"
- Department pages: list (tree view), create, edit, delete, link/unlink workspace
- Staff pages: list (table with filters/search/sort), create, edit, delete, transfer, deactivate, bulk import, export, stats
- Workspace selector dropdown for link-workspace (fetches from `/api/instances/workspaces/`)
- Confirm dialog when linking workspace to dept with existing staff

### Non-functional

- Follow existing admin component patterns (page.tsx + form.tsx structure)
- Components <150 lines each
- Use `@plane/propel` UI components where available, fallback to `@plane/ui`

## Architecture

```
packages/services/src/
  department/
    instance-department.service.ts     -- API calls to /api/instances/departments/
  staff/
    instance-staff.service.ts          -- API calls to /api/instances/staff/

apps/admin/store/
  instance-department.store.ts         -- MobX store for departments
  instance-staff.store.ts              -- MobX store for staff
  root.store.ts                        -- add department + staff stores

apps/admin/app/(all)/(dashboard)/
  departments/
    page.tsx                           -- department list + tree view
    components/
      department-form-modal.tsx        -- create/edit modal
      department-tree-item.tsx         -- tree node component
      department-link-workspace.tsx    -- workspace selector (auto-join, no confirm)
  staff/
    page.tsx                           -- staff list with table
    create/
      page.tsx                         -- create staff form page
    components/
      staff-table.tsx                  -- data table component
      staff-form-fields.tsx            -- shared form fields
      staff-form-modal.tsx             -- edit modal
      staff-import-modal.tsx           -- CSV bulk import dialog
      staff-status-badge.tsx           -- status color badge
      staff-action-buttons.tsx         -- transfer/deactivate/delete actions
```

## Related Code Files

### Files to Create

- `packages/services/src/department/instance-department.service.ts`
- `packages/services/src/department/index.ts` (barrel export)
- `packages/services/src/staff/instance-staff.service.ts`
- `packages/services/src/staff/index.ts` (barrel export)
- `apps/admin/store/instance-department.store.ts`
- `apps/admin/store/instance-staff.store.ts`
- `apps/admin/app/(all)/(dashboard)/departments/page.tsx`
- `apps/admin/app/(all)/(dashboard)/departments/components/department-form-modal.tsx`
- `apps/admin/app/(all)/(dashboard)/departments/components/department-tree-item.tsx`
- `apps/admin/app/(all)/(dashboard)/departments/components/department-link-workspace.tsx`
- `apps/admin/app/(all)/(dashboard)/staff/page.tsx`
- `apps/admin/app/(all)/(dashboard)/staff/create/page.tsx`
- `apps/admin/app/(all)/(dashboard)/staff/components/staff-table.tsx`
- `apps/admin/app/(all)/(dashboard)/staff/components/staff-form-fields.tsx`
- `apps/admin/app/(all)/(dashboard)/staff/components/staff-form-modal.tsx`
- `apps/admin/app/(all)/(dashboard)/staff/components/staff-import-modal.tsx`
- `apps/admin/app/(all)/(dashboard)/staff/components/staff-status-badge.tsx`
- `apps/admin/app/(all)/(dashboard)/staff/components/staff-action-buttons.tsx`

### Files to Modify

- `packages/services/src/index.ts` -- add exports for department/staff services
- `apps/admin/hooks/use-sidebar-menu/core.ts` -- add `departments` and `staff` menu items
- `apps/admin/store/root.store.ts` -- add department and staff store instances

## Implementation Steps

1. **Create InstanceDepartmentService** (`packages/services/src/department/instance-department.service.ts`):
   - Extends `APIService` from `../api.service`
   - Methods: `list()`, `getTree()`, `detail(id)`, `create(data)`, `update(id, data)`, `delete(id)`, `getStaff(id)`, `linkWorkspace(id, workspaceId)`, `unlinkWorkspace(id)`
   - All calls to `/api/instances/departments/` prefix
   - Export types: `IInstanceDepartment`, `IInstanceDepartmentCreate`, `IInstanceDepartmentUpdate`

2. **Create InstanceStaffService** (`packages/services/src/staff/instance-staff.service.ts`):
   - Methods: `list(params)`, `detail(id)`, `create(data)`, `update(id, data)`, `delete(id)`, `transfer(id, deptId)`, `deactivate(id)`, `bulkImport(formData)`, `bulkActions(data)`, `export()`, `stats()`
   - All calls to `/api/instances/staff/` prefix
   - Export types: `IInstanceStaff`, `IInstanceStaffCreate`, `IInstanceStaffStats`

3. **Create InstanceDepartmentStore** (`apps/admin/store/instance-department.store.ts`):
   - Follow `instance-user.store.ts` pattern exactly
   - Observables: `loader`, `departments: Record<string, IInstanceDepartment>`, `tree: IInstanceDepartment[]`
   - Actions: `fetchDepartments`, `fetchTree`, `createDepartment`, `updateDepartment`, `deleteDepartment`, `linkWorkspace`, `unlinkWorkspace`
   - Use `makeObservable` (explicit), `set()` for new keys, `runInAction` in async

4. **Create InstanceStaffStore** (`apps/admin/store/instance-staff.store.ts`):
   - Observables: `loader`, `staff: Record<string, IInstanceStaff>`, `stats`, `paginationInfo`
   - Actions: `fetchStaff`, `fetchNextStaff`, `createStaff`, `updateStaff`, `deleteStaff`, `transferStaff`, `deactivateStaff`, `bulkImport`, `fetchStats`

5. **Register stores** in `apps/admin/store/root.store.ts`:
   - Add `instanceDepartment: InstanceDepartmentStore`
   - Add `instanceStaff: InstanceStaffStore`

6. **Add sidebar menu items** in `apps/admin/hooks/use-sidebar-menu/core.ts`:
   - Add to `TCoreSidebarMenuKey`: `"departments"` | `"staff"`
   - Add entries with `Network` icon (departments) and `UserCheck` icon (staff)
   - Position after "users", before "authentication"

7. **Build department pages**:
   - `departments/page.tsx`: fetch tree on mount, render tree with expand/collapse, "Add Department" button opens modal
   - `department-form-modal.tsx`: name, code, short_name, dept_code, description, parent dropdown, level auto-calc, manager user search
   - `department-tree-item.tsx`: expand arrow, name, code, staff count badge, linked workspace badge, edit/delete actions
   - `department-link-workspace.tsx`: workspace selector dropdown (from InstanceWorkSpaceEndpoint). On select, POST to link-workspace -- auto-joins all staff (no confirm needed)
   <!-- Updated: Validation Session 1 - simplified link-workspace component, no confirm dialog -->

8. **Build staff pages**:
   - `staff/page.tsx`: stats summary cards at top, table below, search/filter bar, "Add Staff" button, bulk import button
   - `staff/create/page.tsx`: full-page create form
   - `staff-table.tsx`: columns (staff_id, name, email, department, position, status), row actions (edit, transfer, deactivate, delete)
   - `staff-form-modal.tsx`: edit modal with StaffProfileSerializer fields
   - `staff-form-fields.tsx`: shared field components (staff_id, name, department dropdown, position, job_grade, phone, dates)
   - `staff-import-modal.tsx`: CSV file upload, default password input, preview/submit
   - `staff-status-badge.tsx`: color-coded employment status badge
   - `staff-action-buttons.tsx`: transfer (dept selector), deactivate (confirm), delete (confirm)

## Todo List

- [x]Create InstanceDepartmentService with types
- [x]Create InstanceStaffService with types
- [x]Create barrel exports in packages/services/src/
- [x]Create InstanceDepartmentStore (MobX)
- [x]Create InstanceStaffStore (MobX)
- [x]Register stores in root.store.ts
- [x]Add sidebar menu items (departments, staff)
- [x]Build departments/page.tsx (tree view)
- [x]Build department-form-modal.tsx
- [x]Build department-tree-item.tsx
- [x]Build department-link-workspace.tsx (workspace selector + confirm)
- [x]Build staff/page.tsx (stats + table)
- [x]Build staff/create/page.tsx
- [x]Build staff-table.tsx
- [x]Build staff-form-fields.tsx + staff-form-modal.tsx
- [x]Build staff-import-modal.tsx
- [x]Build staff-status-badge.tsx + staff-action-buttons.tsx
- [x]Run `pnpm check:lint` and fix issues
- [x]Manual test in browser

## Success Criteria

- Admin sidebar shows Departments and Staff links
- Department tree renders with expand/collapse, CRUD operations work
- Link workspace shows confirm dialog, retroactively adds staff
- Staff table renders with search, filter, sort, pagination
- Create/edit/delete/transfer/deactivate staff all functional
- Bulk import CSV works
- Export downloads CSV
- Stats dashboard shows correct counts

## Risk Assessment

| Risk                       | Impact                  | Mitigation                                                          |
| -------------------------- | ----------------------- | ------------------------------------------------------------------- |
| Admin app routing mismatch | 404 on new pages        | Admin uses file-based routing -- verify directory structure matches |
| MobX store not reactive    | UI doesn't update       | Follow instance-user.store.ts pattern exactly with makeObservable   |
| Workspace selector empty   | Can't link workspace    | Reuse existing InstanceWorkSpaceEndpoint that already works         |
| Component files too large  | Violates <150 line rule | Pre-plan component decomposition (already split into components/)   |

## Security Considerations

- All admin pages behind InstanceAdmin session authentication
- No sensitive data exposed in frontend (passwords hashed server-side)
- CSV upload size validated by backend (10MB max)

## Next Steps

- Phase 4: Cleanup Workspace Settings (remove old department/staff pages from web app)
