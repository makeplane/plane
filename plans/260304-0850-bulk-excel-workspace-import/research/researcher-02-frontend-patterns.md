# Researcher 02: Frontend Patterns & Admin App Structure

## God-Mode Workspace Page

**File**: `apps/admin/app/(all)/(dashboard)/workspace/page.tsx`

- Component: `WorkspaceManagementPage` (MobX observer)
- Has "Create workspace" Link → `/workspace/create`
- Uses `useWorkspace()` hook for store access
- Action buttons area: `<div className="flex items-center gap-2">` (lines 132–136)
- **Add**: "Bulk Create Workspace" button beside "Create workspace"

## Existing Bulk Import Route (Users)

**File**: `apps/admin/app/(all)/(dashboard)/users/bulk-import/page.tsx`

- Simple page wrapping `<BulkImportForm />`
- Pattern: PageWrapper + form component
- Route: `/users/bulk-import`

## BulkImportForm Pattern (CSV Users)

**File**: `apps/admin/components/users/bulk-import-form.tsx`

- Hidden `<input type="file" accept=".csv">` with ref
- Click button → triggers file picker
- State: `selectedFile`, `isSubmitting`, `result`
- Submit: calls store action → shows results table
- Results component shows skipped rows with reason

## Workspace Store

**File**: `apps/admin/store/workspace.store.ts`

- Class `WorkspaceStore` uses `InstanceWorkspaceService` from `@plane/services`
- Existing action: `createWorkspace(data: IWorkspace)` — single create
- **Add**: `bulkCreateWorkspaces(workspaces: Partial<IWorkspace>[])` action
- Loader states: "init-loader" | "mutation" | "pagination" | "loaded"

## No Excel Library Installed

- `apps/admin/package.json` — no xlsx/exceljs/papaparse
- Must add: `xlsx` (SheetJS) — widely used, no native deps, ~800KB

## Recommended Architecture

**Frontend parses Excel (not backend)**:

1. User uploads `.xlsx`/`.xls` file
2. Frontend reads file with `xlsx.read()` → extracts first sheet
3. Convert to JSON array: `xlsx.utils.sheet_to_json(sheet)`
4. Show preview table with parsed rows (editable or read-only)
5. User clicks "Import" → POST JSON to `/god-mode/workspaces/bulk-create/`
6. Show results (created/skipped per row)

**Why frontend parsing?**

- Enables data preview before creation (per requirements)
- No new Python dependencies
- Better UX (live validation feedback possible)

## Template Download

- Generate `.xlsx` template in-browser using `xlsx.utils.aoa_to_sheet`
- Headers: `name`, `slug`, `organization_size` (optional)
- Triggered by a "Download Template" button

## Files to Create/Modify

**New files:**

- `apps/admin/components/workspace/bulk-import-form.tsx`
- `apps/admin/app/(all)/(dashboard)/workspace/bulk-import/page.tsx`

**Modified files:**

- `apps/admin/store/workspace.store.ts` — add `bulkCreateWorkspaces()`
- `apps/admin/hooks/store/use-workspace.tsx` — expose new action
- `apps/admin/app/(all)/(dashboard)/workspace/page.tsx` — add button
- `apps/admin/package.json` — add `xlsx` dependency
