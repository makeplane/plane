# Frontend Research: God-Mode Workspace Admin & Bulk Import

## 1. God-Mode Workspace Listing Page

**File:** `apps/admin/app/(all)/(dashboard)/workspace/page.tsx`

- Shows all instance workspaces with pagination
- Has "Bulk Create Workspace" button (line 133) → `/workspace/bulk-import`
- Has "Create workspace" button
- Uses `WorkspaceListItem` component per workspace
- Uses `useWorkspace()` hook for state management

## 2. Existing Bulk Import Workspace Pattern

### Entry Page

**File:** `apps/admin/app/(all)/(dashboard)/workspace/bulk-import/page.tsx`

- Simple wrapper using `PageWrapper` component
- Renders `WorkspaceBulkImportForm`

### Main Form

**File:** (component `workspace-bulk-import-form.tsx` in admin app components)

- Uses `useWorkspace()` hook → `bulkCreateWorkspaces()` method
- Template Download: generates .xlsx with columns: `name`, `organization_size`
- **File Validation:** `.xlsx` / `.xls` only, max 5 MB, max 200 rows
- **Excel Parsing:** `xlsx` library (dynamic import)
- **State:** selectedFile, parsedRows, parseError, result, isSubmitting

### Three-Step Flow

1. File selection & parsing → preview
2. `WorkspaceBulkImportPreview` — table showing parsed rows
3. Submit → API call → `WorkspaceBulkImportResults` (success/skip counts)

### Supporting Components

- `workspace-bulk-import-preview.tsx` — table showing name/slug/org-size
- `workspace-bulk-import-results.tsx` — displays success/skip counts

## 3. Key Patterns

**UI Stack:**

- `@plane/propel/button` (Button, getButtonStyling)
- `@plane/propel/toast` (TOAST_TYPE, setToast)
- Lucide icons (Download, Upload)
- MobX observer pattern

**Data Flow:**

```
Excel Upload
→ parseExcel() via xlsx lib
→ IWorkspaceRow[]
→ WorkspaceBulkImportPreview
→ bulkCreateWorkspaces(rows)
→ IWorkspaceBulkCreateResponse { total_created, total_skipped }
→ WorkspaceBulkImportResults
→ toast + redirect to /workspace
```

**Workspace Import Schema (2 columns):**

- `name` (required) — workspace name
- `organization_size` (optional) — org size

## 4. Unresolved Questions

- Where is `bulkCreateWorkspaces()` service method defined? (need exact file)
- Exact format of `IWorkspaceBulkCreateResponse` interface?
- Can existing bulk import be extended for member assignment or needs separate route?
