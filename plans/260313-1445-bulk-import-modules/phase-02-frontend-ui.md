# Phase 02: Frontend UI

## Context Links

- [Plan Overview](./plan.md)
- Depends on: [phase-01-backend-api.md](./phase-01-backend-api.md)
- Pattern — form: `apps/admin/components/workspace/workspace-project-bulk-import-form.tsx`
- Pattern — preview: `apps/admin/components/workspace/workspace-project-bulk-import-preview.tsx`
- Pattern — results: `apps/admin/components/workspace/workspace-project-bulk-import-results.tsx`
- Pattern — page: `apps/admin/app/(all)/(dashboard)/workspace/bulk-import-projects/page.tsx`
- Pattern — store: `apps/admin/store/workspace.store.ts`
- Pattern — service: `packages/services/src/workspace/instance-workspace.service.ts`

## Overview

| Field       | Value                                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| Priority    | P2                                                                                                                          |
| Status      | ⬜ pending                                                                                                                  |
| Effort      | 2h                                                                                                                          |
| Description | Mirror workspace-project-bulk-import UI pattern for modules — service type, store method, 3 components, route, entry button |

## Key Insights

- All new files mirror existing project bulk import files ~90% — adapt field names only
- `IWorkspaceProjectBulkImportResponse` type lives in `instance-workspace.service.ts` — add sibling type `IWorkspaceModuleBulkImportResponse` in same file
- `xlsx` already in admin app deps — no new packages needed
- Preview table: 7 columns (`workspace_slug`, `project_identifier`, `name`, `description`, `status`, `start_date`, `target_date`)
<!-- Updated: Validation Session 1 - status added as optional column -->
- Results: same `created`/`skipped` shape — no `updated` needed (modules don't support upsert here)
- `workspace.store.ts` imports types from `@plane/services` — new type must be exported from package index

## Requirements

- New service type: `IWorkspaceModuleBulkImportResponse`
- New service method: `instanceWorkspaceService.bulkImportModules(modules[])`
- New store method: `workspaceStore.bulkImportModules(modules[])`
- New route: `apps/admin/app/(all)/(dashboard)/workspace/bulk-import-modules/page.tsx`
- 3 new components in `apps/admin/components/workspace/`:
  - `workspace-module-bulk-import-form.tsx` (≤150 lines)
  - `workspace-module-bulk-import-preview.tsx` (≤150 lines)
  - `workspace-module-bulk-import-results.tsx` (≤100 lines)
- "Bulk Import Modules" button on workspace list page (`/workspace/page.tsx`)
- Excel template: 7 columns — `workspace_slug`, `project_identifier`, `name`, `description`, `status`, `start_date`, `target_date`
<!-- Updated: Validation Session 1 - status optional column added -->
- File validation: `.xlsx`/`.xls`, max 100 rows, 5MB

## Architecture

```
/workspace/bulk-import-modules/ (new route)
  → WorkspaceModuleBulkImportPage (page.tsx)
    → WorkspaceModuleBulkImportForm (observer)
      → WorkspaceModuleBulkImportPreview (table of parsed rows)
      → WorkspaceModuleBulkImportResults (inline after submit)

Type:
  IWorkspaceModuleBulkImportResponse (packages/services)

Service:
  instanceWorkspaceService.bulkImportModules(modules[])
    POST /api/instances/bulk-import-modules/

Store:
  workspaceStore.bulkImportModules(modules[])
    → delegates to service

IModuleRow (interface in preview component):
  { workspace_slug: string; project_identifier: string; name: string;
    description?: string; status?: string; start_date?: string; target_date?: string }
```

## Related Code Files

- **Modify:** `packages/services/src/workspace/instance-workspace.service.ts` — add type + method
- **Modify:** `packages/services/src/index.ts` (or barrel) — export new type
- **Modify:** `apps/admin/store/workspace.store.ts` — add store method + type import
- **Create:** `apps/admin/components/workspace/workspace-module-bulk-import-form.tsx`
- **Create:** `apps/admin/components/workspace/workspace-module-bulk-import-preview.tsx`
- **Create:** `apps/admin/components/workspace/workspace-module-bulk-import-results.tsx`
- **Create:** `apps/admin/app/(all)/(dashboard)/workspace/bulk-import-modules/page.tsx`
- **Modify:** `apps/admin/app/(all)/(dashboard)/workspace/page.tsx` — add entry button

## Embedded Rules

```
- apps/admin has NO i18n — plain string literals only (no t() calls)
- observer() from mobx-react on all MobX-reading components
- @plane/propel/* subpath imports: Button from "@plane/propel/button", TOAST_TYPE/setToast from "@plane/propel/toast"
- import type { X } from "y" for ALL type-only imports — typed linting enforced
- Semantic color tokens (short form): text-primary, text-secondary, text-tertiary, text-danger-primary
- Components ≤150 lines; if at risk of exceeding, extract a sub-component
- kebab-case filenames always
- Link from "next/link" for navigation (not useRouter().push for declarative links)
- getButtonStyling from "@plane/propel/button" for anchor-as-button styling
```

## Implementation Steps

1. **Add type + method to service** (`instance-workspace.service.ts`):

   ```typescript
   export type IWorkspaceModuleBulkImportResponse = {
     created: Array<{ workspace_slug: string; project_identifier: string; name: string }>;
     skipped: Array<{ row_number: number; workspace_slug: string; project_identifier: string; name: string; reason: string }>;
     total_created: number;
     total_skipped: number;
   };

   async bulkImportModules(
     modules: Array<{ workspace_slug: string; project_identifier: string; name: string; description?: string; status?: string; start_date?: string; target_date?: string }>
   ): Promise<IWorkspaceModuleBulkImportResponse> {
     return this.post("/api/instances/bulk-import-modules/", { modules });
   }
   ```

   Export type from package barrel (`packages/services/src/index.ts` or nearest barrel).

2. **Add store method** (`workspace.store.ts`):
   - Import `IWorkspaceModuleBulkImportResponse` from `@plane/services`
   - Add `bulkImportModules` to `makeObservable` actions
   - Method: same pattern as `bulkImportProjects` — delegate to service, return result

3. **Create `workspace-module-bulk-import-preview.tsx`**:
   - Export `IModuleRow` interface (6 fields)
   - Table with columns: Workspace Slug, Project, Name, Description, Status, Start Date, Target Date
   - Show row count summary above table
   - ≤100 lines

4. **Create `workspace-module-bulk-import-results.tsx`**:
   - Props: `result: IWorkspaceModuleBulkImportResponse`
   - Show "Created: N" badge (green) + "Skipped: N" badge (yellow)
   - List skipped rows with `row_number`, `project_identifier`, `name`, `reason`
   - ≤80 lines

5. **Create `workspace-module-bulk-import-form.tsx`** (main component):
   - Copy structure from `workspace-project-bulk-import-form.tsx`
   - `downloadTemplate()`: 7-column header + 1 example row (include `status` with example value `planned`)
   - `parseExcel()`: returns `IModuleRow[]`
   - `handleSubmit()`: map rows → call `bulkImportModules()`
   - Instructions text: mention all 6 columns, `project_identifier` as project's short code
   - ≤150 lines

6. **Create route page** (`bulk-import-modules/page.tsx`):

   ```tsx
   import { WorkspaceModuleBulkImportForm } from "@/components/workspace/workspace-module-bulk-import-form";
   export default function WorkspaceModuleBulkImportPage() {
     return (
       <div className="...">
         <h1>Bulk Import Modules</h1>
         <WorkspaceModuleBulkImportForm />
       </div>
     );
   }
   ```

   Mirror existing `bulk-import-projects/page.tsx` for layout.

7. **Add entry button to workspace list page** (`/workspace/page.tsx`):
   - Add `<Link href="/workspace/bulk-import-modules" className={getButtonStyling("secondary", "base")}>Bulk Import Modules</Link>`
   - Place alongside existing "Bulk Import Projects" button

## Post-Phase Checklist

- [ ] `IWorkspaceModuleBulkImportResponse` exported from `@plane/services` barrel — store import resolves
- [ ] `import type` used for all type-only imports in every file
- [ ] `observer()` applied to `WorkspaceModuleBulkImportForm`
- [ ] No `t()` calls anywhere in new files
- [ ] All 3 components ≤150 lines
- [ ] Template download has 6-column header + example row
- [ ] "Bulk Import Modules" button added to workspace list page
- [ ] Route page exists at `workspace/bulk-import-modules/page.tsx`
- [ ] Run `pnpm check:lint` — 0 errors

## Todo List

- [ ] Add `IWorkspaceModuleBulkImportResponse` type + `bulkImportModules()` to service
- [ ] Export type from services barrel
- [ ] Add `bulkImportModules()` to workspace store
- [ ] Create `workspace-module-bulk-import-preview.tsx`
- [ ] Create `workspace-module-bulk-import-results.tsx`
- [ ] Create `workspace-module-bulk-import-form.tsx`
- [ ] Create `bulk-import-modules/page.tsx` route
- [ ] Add entry button to workspace list page
- [ ] Run `pnpm check:lint`
- [ ] Run post-phase checklist
- [ ] Mark phase complete in plan.md

## Success Criteria

- Navigate to `/god-mode/workspace/` → "Bulk Import Modules" button visible
- Click button → `/workspace/bulk-import-modules/` page loads
- Download template → `.xlsx` with 6-column header + example row
- Upload valid Excel → preview table shows rows with all 6 columns
- Submit → API called → results shown inline (created count + skipped list)
- `pnpm check:lint` passes with 0 errors

## Risk Assessment

- **Services barrel export:** new type must be in the barrel file — grep for `IWorkspaceProjectBulkImportResponse` export location first to find the right barrel file
- **Line count:** form component may approach 150 lines — keep `downloadTemplate` and `parseExcel` as standalone functions (not methods) to stay lean
- **Store makeObservable:** must add `bulkImportModules` to the `makeObservable` actions map or MobX won't track it

## Security Considerations

- All data flows through `InstanceAdminPermission` — God Mode admin only
- Client-side validation (file size, row count, format) is UX only; backend is authoritative

## Next Steps

- After both phases: manual E2E test — upload Excel with rows across 2 different workspaces + 2 projects
- Verify: duplicate module name in same project → skipped; same name in different project → created
