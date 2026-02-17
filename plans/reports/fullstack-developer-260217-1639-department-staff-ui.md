# Department & Staff Management UI Implementation Report

**Date:** 2026-02-17
**Agent:** fullstack-developer (aa085cd)
**Status:** ✅ COMPLETED

---

## Executive Summary

Implemented full frontend UI for Department and Staff management in Plane CE workspace settings. All components follow existing codebase patterns with SWR data fetching, TypeScript type safety, and Plane UI components.

---

## Files Modified

### 1. Type Definitions

**File:** `/Volumes/Data/SHBVN/plane.so/packages/types/src/settings.ts` (1 line changed)

- Added `"departments"` and `"staff"` to `TWorkspaceSettingsTabs` union type

### 2. Workspace Settings Configuration

**File:** `/Volumes/Data/SHBVN/plane.so/packages/constants/src/settings/workspace.ts` (22 lines added)

- Added `departments` and `staff` settings entries with routes, i18n labels, access controls
- Added both to `GROUPED_WORKSPACE_SETTINGS` under ADMINISTRATION category

### 3. Settings Sidebar Icons

**File:** `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/settings/workspace/sidebar/item-icon.tsx` (3 lines changed)

- Imported `Network` and `UserCheck` icons from lucide-react
- Mapped departments → Network, staff → UserCheck

---

## Files Created

### Services Layer (2 files, 398 lines)

#### `/Volumes/Data/SHBVN/plane.so/apps/web/core/services/department.service.ts` (198 lines)

**Exports:**

- `DepartmentService` class with methods:
  - `getDepartments(workspaceSlug)` - List all departments
  - `getDepartmentTree(workspaceSlug)` - Tree structure
  - `getDepartment(workspaceSlug, departmentId)` - Single department
  - `createDepartment(workspaceSlug, data)` - Create new
  - `updateDepartment(workspaceSlug, departmentId, data)` - Update existing
  - `deleteDepartment(workspaceSlug, departmentId)` - Delete
  - `linkProject(workspaceSlug, departmentId, projectId)` - Link project
  - `unlinkProject(workspaceSlug, departmentId)` - Unlink project
  - `getDepartmentStaff(workspaceSlug, departmentId)` - Get staff list
- `IDepartment`, `IDepartmentCreate`, `IDepartmentUpdate` interfaces

#### `/Volumes/Data/SHBVN/plane.so/apps/web/core/services/staff.service.ts` (200 lines)

**Exports:**

- `StaffService` class with methods:
  - `getStaffList(workspaceSlug, params)` - List with filters
  - `getStaff(workspaceSlug, staffId)` - Single staff
  - `createStaff(workspaceSlug, data)` - Create new
  - `updateStaff(workspaceSlug, staffId, data)` - Update existing
  - `deleteStaff(workspaceSlug, staffId)` - Delete
  - `transferStaff(workspaceSlug, staffId, departmentId)` - Transfer dept
  - `deactivateStaff(workspaceSlug, staffId)` - Deactivate
  - `bulkImport(workspaceSlug, formData)` - CSV import
  - `exportStaff(workspaceSlug)` - CSV export (Blob)
  - `getStats(workspaceSlug)` - Statistics
- `IStaff`, `IStaffCreate`, `IStaffUpdate`, `IStaffStats` interfaces

---

### Department Settings Pages (5 files, 571 lines)

**Directory:** `/Volumes/Data/SHBVN/plane.so/apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/departments/`

#### `header.tsx` (43 lines)

- Standard breadcrumb header using WORKSPACE_SETTINGS and icons

#### `page.tsx` (147 lines)

- Main page with SWR data fetching
- Tree view of departments with expand/collapse
- Add Department button → form modal
- Edit/delete actions on tree items
- Link project functionality for leaf nodes
- Real-time mutations via SWR

#### `components/department-form-modal.tsx` (199 lines)

**Fields:**

- name (required), code (required)
- short_name, dept_code, description
- parent (select from existing), level (number)
- manager (user select - placeholder for future)
  **Actions:** Create/Update with toast notifications

#### `components/department-tree-item.tsx` (140 lines)

- Recursive tree item component
- Expand/collapse icon for parents
- Display: code, name, staff count, manager, linked project
- Actions: Edit, Delete, Link Project (leaf only)
- Nested indentation by level

#### `components/department-tree.tsx` (42 lines)

- Container for tree items
- Empty state message
- Maps root departments to tree items

#### `components/link-project-modal.tsx` (99 lines)

- Project selection modal
- Dropdown populated from workspace projects
- Links project to department

---

### Staff Settings Pages (4 files, 566 lines)

**Directory:** `/Volumes/Data/SHBVN/plane.so/apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/staff/`

#### `header.tsx` (43 lines)

- Standard breadcrumb header using WORKSPACE_SETTINGS and icons

#### `page.tsx` (223 lines)

**Features:**

- Stats dashboard (total, active, probation, resigned, terminated)
- Search by staff ID, name, email
- Filter by department, status
- Export to CSV (downloads file)
- Import from CSV button → import modal
- Add Staff button → form modal
- Table view with pagination-ready structure

#### `components/staff-form-modal.tsx` (177 lines)

**Fields:**

- staff_id (required), position
- department (select), status (select: active/probation/resigned/terminated)
- joined_date, resigned_date (date pickers)
  **Actions:** Create/Update with validation

#### `components/staff-import-modal.tsx` (123 lines)

- CSV file upload with validation
- Format requirements displayed
- File preview (name, size)
- Bulk import with error handling
- Success/error toast notifications

#### `components/staff-table.tsx` (167 lines)

**Columns:**

- Staff ID, Name, Department, Position, Status, Joined Date, Actions
  **Actions:** Edit, Deactivate (if active), Delete
  **Features:**
- Status badges with color coding
- Empty state message
- Responsive table layout

---

## Implementation Details

### Design Patterns Followed

✅ Service layer extends `APIService` from `@/services/api.service`
✅ All API methods return promises with proper error handling
✅ SWR for data fetching with cache keys `DEPARTMENT_TREE_${workspaceSlug}`, `STAFF_LIST_${workspaceSlug}`, etc.
✅ Observer pattern with mobx-react
✅ `"use client"` directive for client components
✅ TypeScript interfaces defined inline in service files
✅ Toast notifications for user feedback
✅ Modals with controlled state (isOpen, onClose, onSuccess)

### UI/UX Features

- **Departments:**
  - Tree hierarchy with expand/collapse
  - Visual indentation by level
  - Staff count per department
  - Manager display
  - Project linking for leaf nodes only

- **Staff:**
  - Statistics dashboard with color-coded cards
  - Multi-filter search (text, department, status)
  - CSV import/export
  - Status badges (green=active, yellow=probation, gray=resigned, red=terminated)
  - Deactivate action for active staff

### Security & Validation

- Admin-only access (EUserWorkspaceRoles.ADMIN)
- Required fields enforced in forms
- CSV file type validation
- Confirmation dialogs for destructive actions
- Error boundaries with try/catch blocks

---

## Tests Status

### Type Check

✅ **PASS** - No TypeScript compilation errors

```bash
npm run check:types
```

All new files compiled successfully with no type errors.

### Integration Points

- ✅ Icons added to lucide-react imports
- ✅ Constants updated in @plane/constants
- ✅ Types extended in @plane/types
- ✅ Services follow APIService pattern
- ✅ Components use @plane/ui primitives
- ✅ Hooks use workspace store via useWorkspace, useProject

---

## File Summary

| Category         | Files Created    | Lines of Code  |
| ---------------- | ---------------- | -------------- |
| Services         | 2                | 398            |
| Types/Constants  | 0 (modified 3)   | ~25 modified   |
| Department Pages | 5                | 571            |
| Staff Pages      | 4                | 566            |
| **Total**        | **11 new files** | **~1,560 LOC** |

---

## Next Steps

### Phase 6: Auto-membership + Manager Access

- Wire up manager user selection in department form (currently placeholder)
- Implement auto-project-membership logic
- Add manager access permissions

### Phase 7: Integration + Polish

- Add user selection to staff form (link to workspace members)
- Implement staff transfer modal
- Add department staff view (show staff list for department)
- Internationalization (i18n) string values
- E2E tests for critical workflows
- Performance optimization (virtualized lists for large datasets)

---

## Unresolved Questions

1. **User Selection:** Should we create a reusable UserSelect component or use existing workspace member selector?
2. **Manager Permissions:** What specific access should managers have to their department's projects?
3. **Department Deletion:** Should we prevent deletion if department has staff or children?
4. **CSV Format:** Should we provide a downloadable CSV template for import?
5. **Pagination:** Staff table ready for pagination - should we implement or wait for data volume?

---

## Repository State

**Branch:** preview
**Untracked files:**

- `plans/260216-2037-ldap-authentication-implementation/`
- `plans/260217-1300-department-staff-management/`

All implementation files are ready for commit.
