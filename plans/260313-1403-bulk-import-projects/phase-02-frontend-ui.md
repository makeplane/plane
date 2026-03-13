# Phase 02: Frontend UI

## Context Links

- Parent plan: [plan.md](./plan.md)
- Depends on: [phase-01-backend-api.md](./phase-01-backend-api.md)
- Reference: `apps/admin/app/(all)/(dashboard)/workspace/bulk-import/page.tsx`
- Reference: `apps/admin/components/workspace/workspace-bulk-import-form.tsx`
- Reference: `packages/services/src/workspace/instance-workspace.service.ts`
- Reference: `apps/admin/store/workspace.store.ts`

## Overview

| Field                 | Value                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| Date                  | 2026-03-13                                                                             |
| Description           | React UI in apps/admin for bulk project import — mirrors workspace bulk-import pattern |
| Priority              | P2                                                                                     |
| Implementation Status | ✅ complete                                                                            |
| Review Status         | ✅ complete                                                                            |

## Key Insights

<!-- Updated: Validation Session 1 - no dropdown, workspace_slug in Excel per row -->

- Target app: `apps/admin` (God Mode), NOT `apps/web/ce/`
- Mirrors existing `workspace/bulk-import/` exactly: Excel upload → preview → submit → results
- `xlsx` already in deps (used by `WorkspaceBulkImportForm`)
- **No workspace dropdown** — admin types workspace slug directly in Excel column `workspace_slug`
- Each row can target a different workspace (multi-workspace import in one file)
- API call goes through service → store → component (same pattern as bulk workspace create)
- `@plane/propel` for UI components (`getButtonStyling`, `Button`, etc.)

## Requirements

<!-- Updated: Validation Session 1 -->

- New route: `/workspace/bulk-import-projects/`
- Excel template: columns `workspace_slug` (required), `name` (required), `description` (optional), `network` (optional)
- **No workspace selector dropdown** — workspace slug is a column in the Excel file
- File upload: `.xlsx`/`.xls`, max 100 rows, 5MB client-side validation
- Preview table before submit (show workspace_slug, name, description, network columns)
- Results view: created count + skipped list with reasons (inline, same page)
- "Bulk Import Projects" button on `/workspace/` page linking to new route

## Architecture

<!-- Updated: Validation Session 1 -->

```
/workspace/bulk-import-projects/
  → WorkspaceProjectBulkImportPage (page.tsx)
    → WorkspaceProjectBulkImportForm
      → WorkspaceProjectBulkImportPreview (table of parsed rows)
      → WorkspaceProjectBulkImportResults (after submit, inline)

Service layer:
  instanceWorkspaceService.bulkImportProjects(projects[])  // no slug param

Store layer:
  workspaceStore.bulkImportProjects(projects[])
```

## Related Code Files

- `apps/admin/app/(all)/(dashboard)/workspace/bulk-import/page.tsx` — page pattern
- `apps/admin/components/workspace/workspace-bulk-import-form.tsx` — form pattern
- `apps/admin/components/workspace/workspace-bulk-import-preview.tsx` — preview pattern (if exists)
- `apps/admin/components/workspace/workspace-bulk-import-results.tsx` — results pattern (if exists)
- `packages/services/src/workspace/instance-workspace.service.ts` — add method
- `apps/admin/store/workspace.store.ts` — add action
- `apps/admin/app/(all)/(dashboard)/workspace/page.tsx` — add button

## Implementation Steps

1. **Add service method** in `instance-workspace.service.ts`
   - Interface: `IWorkspaceProjectBulkImportResponse { created, skipped, total_created, total_skipped }`
   - Method: `bulkImportProjects(projects): Promise<IWorkspaceProjectBulkImportResponse>` (no slug param)
   - URL: `${API_BASE_URL}/api/instances/bulk-import-projects/`

2. **Add store action** in `workspace.store.ts`
   - Action: `bulkImportProjects(projects)` — calls service, handles loading state
   - No local observable update needed

3. **Create preview component** `workspace-project-bulk-import-preview.tsx` (<150 lines)
   - Table columns: `#`, `Workspace Slug`, `Name`, `Description`, `Network`
   - No auto-identifier preview (generated server-side)

4. **Create results component** `workspace-project-bulk-import-results.tsx` (<100 lines)
   - Success banner: "X projects created successfully"
   - Skipped table: row #, workspace_slug, name, reason
   - "Back to Workspaces" button

5. **Create form component** `workspace-project-bulk-import-form.tsx` (<150 lines)
   - Step 1: template download (xlsx with columns: workspace_slug, name, description, network)
   - Step 2: file upload (xlsx/xls, 5MB, 100 row limit)
   - Step 3: preview table
   - Step 4: submit → inline results
   - Cancel → `router.push("/workspace")`

6. **Create route page** `workspace/bulk-import-projects/page.tsx`
   - `PageWrapper` with breadcrumb/title
   - Renders `<WorkspaceProjectBulkImportForm />`

7. **Add button** to `workspace/page.tsx`
   - After "Bulk Create Workspace" button
   - `<Link href="/workspace/bulk-import-projects">` with secondary styling
   - Label: "Bulk Import Projects"

## Todo

- [x] Add `bulkImportProjects()` to `instance-workspace.service.ts`
- [x] Add `bulkImportProjects()` action to `workspace.store.ts`
- [x] Create `workspace-project-bulk-import-preview.tsx`
- [x] Create `workspace-project-bulk-import-results.tsx`
- [x] Create `workspace-project-bulk-import-form.tsx`
- [x] Create `apps/admin/app/(all)/(dashboard)/workspace/bulk-import-projects/page.tsx`
- [x] Add button to `workspace/page.tsx`
- [x] Verify `xlsx` import pattern from existing form
- [x] pnpm check:lint — 0 errors

## Success Criteria

- Route `/workspace/bulk-import-projects/` renders correctly
- Workspace selector populated with all workspaces
- Excel file parses correctly (name, description, network columns)
- Preview table shows auto-generated identifiers
- Submit calls API and shows created/skipped results
- "Bulk Import Projects" button visible on `/workspace/` page
- `pnpm check:lint` passes with 0 errors

## Risk Assessment

| Risk                                              | Likelihood | Mitigation                                                    |
| ------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| xlsx import pattern differs                       | Low        | Copy from `workspace-bulk-import-form.tsx` exactly            |
| workspaceStore doesn't have all workspaces loaded | Medium     | Check store init, may need to call fetchWorkspaces() on mount |
| Component exceeds 150 lines                       | Medium     | Split into preview + results + form sub-components            |

## Security Considerations

- File size limit: 5MB client-side (prevent large uploads)
- Row limit: 100 client-side validation before API call
- No HTML in name/description fields — plain text only in Excel parse

## Next Steps

After phase 02: Run `pnpm check:lint`, manual test in browser, then finalize.
