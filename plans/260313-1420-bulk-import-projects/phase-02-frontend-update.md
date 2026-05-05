# Phase 02: Frontend Update

## Context Links

- [Plan Overview](./plan.md)
- Depends on: [phase-01-backend-upsert.md](./phase-01-backend-upsert.md)
- Extends: `plans/260313-1403-bulk-import-projects/phase-02-frontend-ui.md`
- Research: `research/researcher-02-project-model.md`

## Overview

| Field       | Value                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Priority    | P2                                                                                                      |
| Status      | ⬜ pending                                                                                              |
| Effort      | 1.5h                                                                                                    |
| Description | Update service type, store, form, preview, and results components to support `project_id` UPSERT column |

## Key Insights

- All 5 files already exist — this is an extension, not a rewrite
- `IWorkspaceProjectBulkImportResponse` type lives in `packages/services` — single source of truth
- `IProjectRow` type is defined inline in `workspace-project-bulk-import-preview.tsx` — add `project_id?`
- Template download uses `aoa_to_sheet` — just prepend `project_id` to header array
- Results component: add an "Updated" section mirroring the "Created" section
- Preview table: add `project_id` column (show truncated UUID or "—" if empty)
- No store logic changes — `bulkImportProjects()` payload already supports extra fields via spread

## Requirements

- `IWorkspaceProjectBulkImportResponse`: add `updated` array + `total_updated` number
- Payload item type: add optional `project_id?: string`
- Excel template: 5 columns — `project_id` (optional), `workspace_slug`, `name`, `description`, `network`
- Preview table: show `project_id` column (truncate to 8 chars + "…" if UUID present)
- Results: show "Updated" badge + list alongside "Created" and "Skipped"
- `handleSubmit`: pass `project_id` field through to store call

## Architecture

```
packages/services/src/workspace/instance-workspace.service.ts
  IWorkspaceProjectBulkImportResponse: + updated[], total_updated

apps/admin/store/workspace.store.ts
  bulkImportProjects() payload item: + project_id?

apps/admin/components/workspace/workspace-project-bulk-import-preview.tsx
  IProjectRow: + project_id?
  Preview table: + project_id column

apps/admin/components/workspace/workspace-project-bulk-import-form.tsx
  downloadTemplate(): add project_id header column
  handleSubmit(): pass project_id in payload

apps/admin/components/workspace/workspace-project-bulk-import-results.tsx
  Add "Updated" section
```

## Related Code Files

- **Modify:** `packages/services/src/workspace/instance-workspace.service.ts`
- **Modify:** `apps/admin/store/workspace.store.ts`
- **Modify:** `apps/admin/components/workspace/workspace-project-bulk-import-preview.tsx`
- **Modify:** `apps/admin/components/workspace/workspace-project-bulk-import-form.tsx`
- **Modify:** `apps/admin/components/workspace/workspace-project-bulk-import-results.tsx`

## Embedded Rules

```
- apps/admin has NO i18n — plain string literals only (no t())
- observer() from mobx-react on all MobX-reading components (already applied)
- @plane/propel/* subpath imports for UI components
- Semantic color tokens: text-primary, text-secondary, text-tertiary, text-danger-primary, text-success-primary
- Components <150 lines; if adding content pushes over limit, extract sub-component
- import type { X } from "y" for type-only imports (ESLint typed-linting enforced)
- kebab-case filenames
```

## Implementation Steps

1. **Update `IWorkspaceProjectBulkImportResponse` type** in `instance-workspace.service.ts`

   ```typescript
   export type IWorkspaceProjectBulkImportResponse = {
     created: Array<{ workspace_slug: string; name: string; identifier: string }>;
     updated: Array<{ workspace_slug: string; name: string; identifier: string; project_id: string }>;
     skipped: Array<{ row_number: number; workspace_slug: string; name: string; reason: string }>;
     total_created: number;
     total_updated: number;
     total_skipped: number;
   };
   ```

   Also update `bulkImportProjects()` param type to include `project_id?: string`.

2. **Update store `bulkImportProjects()` param type** in `workspace.store.ts`
   - Add `project_id?: string` to the array item type in the method signature.

3. **Update `IProjectRow` in preview component** (`workspace-project-bulk-import-preview.tsx`)

   ```typescript
   export interface IProjectRow {
     project_id?: string;
     workspace_slug: string;
     name: string;
     description?: string;
     network?: number;
   }
   ```

   - Add `project_id` column to table header and body:
     - Header: `"Project ID"` (first column)
     - Cell: `row.project_id ? row.project_id.slice(0, 8) + "…" : "—"`

4. **Update form component** (`workspace-project-bulk-import-form.tsx`)
   - `downloadTemplate()`: change header array to `["project_id", "workspace_slug", "name", "description", "network"]`
   - Update instructions text to mention `project_id` as optional (for updating existing projects)
   - `handleSubmit()`: include `project_id: r.project_id` in payload map

5. **Update results component** (`workspace-project-bulk-import-results.tsx`)
   - Add "Updated" count badge (green or blue) when `result.total_updated > 0`
   - Add updated projects list section mirroring the created section
   - Show `project_id` (truncated) + workspace + name + identifier for each updated item
   - Summary line: "X created, Y updated, Z skipped"

## Post-Phase Checklist

- [ ] `IWorkspaceProjectBulkImportResponse` has `updated` + `total_updated` — no TypeScript errors
- [ ] `import type` used for all type-only imports
- [ ] Preview table shows `project_id` column with truncation fallback "—"
- [ ] Template download includes `project_id` as first column header
- [ ] Results component shows "Updated" section when `total_updated > 0`
- [ ] All modified components stay ≤150 lines; extract if over
- [ ] `observer()` still applied to all MobX-reading components
- [ ] No `t()` calls added (apps/admin has no i18n)
- [ ] Run `pnpm check:lint` — 0 errors

## Todo List

- [ ] Update `IWorkspaceProjectBulkImportResponse` + payload type in service file
- [ ] Update store method signature
- [ ] Add `project_id?` to `IProjectRow`, update preview table
- [ ] Update form: template header + submit payload + instructions text
- [ ] Update results: add Updated section
- [ ] Run `pnpm check:lint`
- [ ] Run post-phase checklist
- [ ] Mark phase complete in plan.md

## Success Criteria

- Download template → `project_id` is first column in `.xlsx`
- Upload file with `project_id` values → preview table shows truncated UUIDs
- Submit → API called with `project_id` in payload
- Results page shows "Updated: N" badge and list when projects were updated
- No TypeScript compilation errors (`pnpm check:lint` passes)

## Risk Assessment

- **Line count overflow:** results component may exceed 150 lines — extract `UpdatedProjectsList` sub-component if needed
- **Type mismatch:** store and service must use identical payload type — define once in service, import in store

## Security Considerations

- `project_id` values are user-provided Excel data — passed as-is to backend; backend validates UUID format and ownership
- No client-side UUID validation needed (backend is authoritative), but malformed UUIDs shown in preview are harmless

## Next Steps

- After both phases: manual end-to-end test via God Mode UI
- Verify: upload Excel with mix of `project_id` (update) and blank (create) rows → correct results
