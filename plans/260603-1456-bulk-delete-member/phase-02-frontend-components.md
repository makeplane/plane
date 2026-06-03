---
phase: 2
title: "Frontend components"
status: completed
priority: P1
effort: "1.5h"
dependencies: [1]
---

# Phase 2: Frontend Components

## Overview

Three new admin components mirroring the existing bulk-assign set, plus new types and service/store methods.
No new routes — the existing `/workspace/bulk-assign` page gains a tab switcher.

## Requirements

- Functional:
  - `WorkspaceBulkDeleteForm` — file upload, parse, preview, submit
  - `WorkspaceBulkDeletePreview` — table showing `workspace_slug`, `user_id`
  - `WorkspaceBulkDeleteResults` — removed/skipped summary
  - New type `IWorkspaceBulkRemoveResponse` in service file
  - New `bulkRemoveMembers` method in service + store
- Non-functional:
  - Admin app: English-only, NO i18n
  - Propel Button/Toast, semantic color tokens
  - Components < 150 lines, files < 200 lines
  - `observer()` on all MobX-reading components

## Architecture

```
workspace-bulk-delete-form.tsx
  ├── parseExcelForDelete(file) → IWorkspaceDeleteRow[]
  │     columns: workspace_slug (string), user_id (string)
  ├── downloadDeleteTemplate() → .xlsx with headers
  ├── WorkspaceBulkDeletePreview (inline sub-render or separate component)
  └── on submit → bulkRemoveMembers() → WorkspaceBulkDeleteResults

IWorkspaceDeleteRow { workspace_slug: string; user_id: string }

IWorkspaceBulkRemoveResponse {
  removed: Array<{ workspace_slug: string; user_id: string }>;
  skipped: Array<{ row_number: number; workspace_slug: string; user_id: string; reason: string }>;
  total_removed: number;
  total_skipped: number;
}
```

## Related Code Files

- Create: `apps/admin/components/workspace/workspace-bulk-delete-form.tsx`
- Create: `apps/admin/components/workspace/workspace-bulk-delete-preview.tsx`
- Create: `apps/admin/components/workspace/workspace-bulk-delete-results.tsx`
- Modify: `packages/services/src/workspace/instance-workspace.service.ts`
  — add `IWorkspaceBulkRemoveResponse` interface + `bulkRemoveMembers()` method
- Modify: `apps/admin/store/workspace.store.ts`
  — add `bulkRemoveMembers` to interface + `makeObservable` + implementation

## Implementation Steps

### 1. Types & Service (`instance-workspace.service.ts`)

Add after `IWorkspaceBulkAssignResponse` (line ~44):
```typescript
export interface IWorkspaceBulkRemoveResponse {
  removed: Array<{ workspace_slug: string; user_id: string }>;
  skipped: Array<{ row_number: number; workspace_slug: string; user_id: string; reason: string }>;
  total_removed: number;
  total_skipped: number;
}
```

Add method after `bulkAssignMembers()`:
```typescript
async bulkRemoveMembers(
  members: Array<{ workspace_slug: string; user_id: string }>
): Promise<IWorkspaceBulkRemoveResponse> {
  return this.post<IWorkspaceBulkRemoveResponse>("/api/instances/workspaces/bulk-remove-members/", {
    members,
  })
    .then((response) => response?.data as IWorkspaceBulkRemoveResponse)
    .catch((error: unknown) => {
      const errorData = (error as Record<string, unknown>)?.response?.data;
      throw errorData;
    });
}
```

### 2. Store (`workspace.store.ts`)

Add to `IWorkspaceStore` interface:
```typescript
bulkRemoveMembers: (
  members: Array<{ workspace_slug: string; user_id: string }>
) => Promise<IWorkspaceBulkRemoveResponse>;
```

Add to `makeObservable`: `bulkRemoveMembers: action`

Add implementation (after `bulkAssignMembers`):
```typescript
bulkRemoveMembers = (members: Array<{ workspace_slug: string; user_id: string }>) =>
  this.instanceWorkspaceService.bulkRemoveMembers(members);
```

### 3. `workspace-bulk-delete-preview.tsx`

```typescript
export interface IWorkspaceDeleteRow {
  workspace_slug: string;
  user_id: string;
}
type Props = { rows: IWorkspaceDeleteRow[] };
// Table columns: #, Workspace Slug, User ID
```

### 4. `workspace-bulk-delete-results.tsx`

- Summary badges: "Removed: N" (green) + "Skipped: N" (red, conditional)
- Skipped table columns: Row, Workspace, User ID, Reason
- Uses `IWorkspaceBulkRemoveResponse` (imported from `@plane/services`)

### 5. `workspace-bulk-delete-form.tsx`

Key differences from assign form:
- `parseExcelForDelete`: maps `workspace_slug` + `user_id` columns (no role normalization)
- `downloadDeleteTemplate()`: two-column sheet (`workspace_slug`, `user_id`)
- Requirements box: lists two required columns only
- Button label: "Remove members" / "Removing..."
- Toast: "N member(s) removed" on success, no redirect (stay on page to show results)
- On submit: calls `bulkRemoveMembers()`

## Success Criteria

- [ ] Template downloads with correct two-column headers
- [ ] File parse correctly extracts `workspace_slug` and `user_id`
- [ ] Preview table shows slug + user_id columns
- [ ] Submit calls correct store method
- [ ] Results shows removed/skipped with user_id (no email)
- [ ] No i18n imports; all strings English

## Risk Assessment

- **`user_id` column naming**: Excel header must exactly match `user_id` — document in requirements box on the form
- **File size**: reuse same 500 row / 5 MB constants
