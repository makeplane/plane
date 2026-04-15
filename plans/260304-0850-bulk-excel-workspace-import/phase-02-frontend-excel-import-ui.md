# Phase 02: Frontend — Excel Import UI

## Context Links

- Parent plan: [plan.md](./plan.md)
- Depends on: [Phase 01](./phase-01-backend-bulk-create-endpoint.md) (API endpoint URL)
- Reference: [researcher-02-frontend-patterns.md](./research/researcher-02-frontend-patterns.md)
- Reference: `apps/admin/components/users/bulk-import-form.tsx` (pattern to follow)
- Reference: `apps/admin/app/(all)/(dashboard)/users/bulk-import/page.tsx` (page pattern)
- Reference: `apps/admin/store/workspace.store.ts` (store pattern)
- Reference: `apps/admin/app/(all)/(dashboard)/workspace/page.tsx` (add button here)

## Overview

- **Date**: 2026-03-04
- **Priority**: P1
- **Status**: complete
- **Description**: Add Excel import button to workspace listing page, create import page with file upload → parse → preview → submit flow, and provide downloadable template.

## Key Insights

- `xlsx` (SheetJS CE) is the standard browser Excel parser: `read(buffer, {type:'array'})` → `utils.sheet_to_json(sheet)`
- Pattern mirrors `BulkImportForm` for users but adds a **preview table** step (per requirements)
- Template download can be done fully in-browser with `xlsx.utils.aoa_to_sheet` + `xlsx.writeFile`
- Backend endpoint (Phase 01): `POST /god-mode/workspaces/bulk-create/` with `{ workspaces: [] }`
- Service method **inlined** in admin store (no @plane/services change needed) — `axios.post` directly in `bulkCreateWorkspaces` action
- Store action `bulkCreateWorkspaces` follows `createWorkspace` pattern in `workspace.store.ts`
- Import button goes next to "Create workspace" in `workspace/page.tsx` header actions area

## Requirements

### Functional

- "Bulk Create Workspace" button on `/workspace/` page → navigates to `/workspace/bulk-import`
- "Download Template" button on import page → generates & downloads `workspace-import-template.xlsx`
- File picker: accept `.xlsx`, `.xls`
<!-- Updated: Validation Session 1 - No slug column; template is name + organization_size only -->
- Parse uploaded file → show preview table (`name`, `organization_size` columns; slug shown as "auto-generated" in preview)
- "Import workspaces" submit button → POST to backend → show results
- Results: green badge (created count), red badge (skipped count), skipped rows table with reason
- Max 200 rows enforced with user-facing error message

### Non-Functional

- `xlsx` package added to `apps/admin/package.json` (or workspace root if shared)
- Keep form component under 200 lines — split into sub-components if needed
- Use existing Tailwind CSS + `@plane/propel` component patterns

## Architecture

```
workspace/page.tsx
  └─ "Bulk Create Workspace" button → Link to /workspace/bulk-import

workspace/bulk-import/page.tsx
  └─ <PageWrapper>
       └─ <WorkspaceBulkImportForm />

WorkspaceBulkImportForm (components/workspace/bulk-import-form.tsx)
  ├─ downloadTemplate()           ← xlsx.utils in-browser generation
  ├─ File input (.xlsx/.xls)
  ├─ parseExcel(file)             ← xlsx.read → sheet_to_json → rows[]
  ├─ Preview table (if rows parsed)
  │   └─ name | slug | organization_size
  ├─ "Import workspaces" button
  │   └─ bulkCreateWorkspaces(rows) ← store action
  └─ ImportResults component      ← shows created/skipped

WorkspaceStore.bulkCreateWorkspaces(workspaces)
  └─ instanceWorkspaceService.bulkCreate(workspaces)
       └─ POST /god-mode/workspaces/bulk-create/
```

## Related Code Files

**Create:**

- `apps/admin/components/workspace/workspace-bulk-import-form.tsx`
- `apps/admin/app/(all)/(dashboard)/workspace/bulk-import/page.tsx`

<!-- Updated: Validation Session 1 - No @plane/services change; service method inlined in store -->

**Modify:**

- `apps/admin/store/workspace.store.ts` — add `bulkCreateWorkspaces()` action + interface method (inline API call)
- `apps/admin/hooks/store/use-workspace.tsx` — expose `bulkCreateWorkspaces`
- `apps/admin/app/(all)/(dashboard)/workspace/page.tsx` — add "Bulk Create Workspace" Link button
- `apps/admin/package.json` — add `"xlsx": "^0.18.5"` (or latest SheetJS CE)

## Embedded Rules (Phase-Specific)

### Rule 1 — Observer Pattern

All MobX-connected components must use `observer()` from `mobx-react`.

```tsx
import { observer } from "mobx-react";
export const WorkspaceBulkImportForm = observer(function WorkspaceBulkImportForm() { ... });
```

### Rule 2 — Store Action Pattern

Follow `workspace.store.ts` pattern: set `loader = "mutation"`, call service, `runInAction()` to update state.

```ts
bulkCreateWorkspaces = async (workspaces: Partial<IWorkspace>[]): Promise<IBulkCreateResponse> => {
  try {
    this.loader = "mutation";
    const result = await this.instanceWorkspaceService.bulkCreate(workspaces);
    runInAction(() => {
      result.created.forEach((ws: IWorkspace) => set(this.workspaces, [ws.id], ws));
    });
    return result;
  } catch (error) {
    throw error;
  } finally {
    this.loader = "loaded";
  }
};
```

### Rule 3 — Toast Pattern

Use `@plane/propel/toast`: `setToast({ type: TOAST_TYPE.SUCCESS/ERROR/WARNING, title, message })`.

### Rule 4 — Button & Link Styling

```tsx
import { Button, getButtonStyling } from "@plane/propel/button";
import Link from "next/link";
// Navigation button:
<Link href="/workspace/bulk-import" className={getButtonStyling("secondary", "base")}>
  Bulk Create Workspace
</Link>
// Action button:
<Button variant="primary" size="lg" loading={isSubmitting} onClick={handleSubmit}>
  Import workspaces
</Button>
```

### Rule 5 — xlsx Usage

```ts
import * as XLSX from "xlsx";

// Parse:
const buf = await file.arrayBuffer();
const wb = XLSX.read(buf, { type: "array" });
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json<{ name: string; slug: string; organization_size?: string }>(ws);

// Template download (slug is auto-generated, so no slug column):
// Updated: Validation Session 1
const templateWs = XLSX.utils.aoa_to_sheet([["name", "organization_size"]]);
const templateWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(templateWb, templateWs, "Workspaces");
XLSX.writeFile(templateWb, "workspace-import-template.xlsx");
```

### Rule 6 — File Size / Count Validation (frontend)

- Max 200 rows: show inline error if exceeded, do not proceed
- Accept only `.xlsx`, `.xls`: `accept=".xlsx,.xls"` on file input
- Show file name after selection

### Rule 7 — Inline Service Call in Store

<!-- Updated: Validation Session 1 - Inline in store, not @plane/services -->

Do NOT modify `@plane/services`. Inline the API call in `workspace.store.ts`:

```ts
// In WorkspaceStore, use the existing instanceWorkspaceService's axios instance
// OR import APIService directly from @plane/services
bulkCreateWorkspaces = async (workspaces: Array<{ name: string; organization_size?: string }>) => {
  const response = await this.instanceWorkspaceService["requester"].post("/god-mode/workspaces/bulk-create/", {
    workspaces,
  });
  return response?.data;
};
// Alternatively, look at how instanceWorkspaceService makes requests and follow same pattern
// (check the base APIService class for the underlying axios instance field name)
```

## Implementation Steps

1. **Install xlsx dependency**:
   - In `apps/admin/package.json`, add `"xlsx": "^0.18.5"` to `dependencies`
   - Run `pnpm install` from repo root

2. **No @plane/services changes needed** (Validation Session 1):
   - Skip this step — API call will be inlined in `workspace.store.ts` (see Rule 7)
   - Define local type `IWorkspaceBulkCreateResponse` in store file

3. **Update workspace store** `apps/admin/store/workspace.store.ts`:
   - Add `bulkCreateWorkspaces` to `IWorkspaceStore` interface
   - Add `bulkCreateWorkspaces: action` in `makeObservable`
   - Implement method following Rule 2 above

4. **Update hook** `apps/admin/hooks/store/use-workspace.tsx`:
   - Expose `bulkCreateWorkspaces` from the hook return value

5. **Create bulk import form** `apps/admin/components/workspace/workspace-bulk-import-form.tsx`:
   - Download Template button (Rule 5)
   - File input (accept .xlsx/.xls)
   - `parseExcel()` function using xlsx (Rule 5)
   - Preview table: columns `Name`, `Slug`, `Org Size`, row count badge
   - Validate max 200 rows (Rule 6)
   - Submit button → calls `bulkCreateWorkspaces` (Rule 1, 2, 3)
   - `WorkspaceBulkImportResults` sub-component for results display
   - Keep each component function ≤ 150 lines; split if needed

6. **Create page** `apps/admin/app/(all)/(dashboard)/workspace/bulk-import/page.tsx`:
   - Follow user bulk import page pattern exactly
   - `PageWrapper` with title "Bulk import workspaces"
   - Render `<WorkspaceBulkImportForm />`
   - Export `meta` for page title

7. **Add button to workspace listing page** `apps/admin/app/(all)/(dashboard)/workspace/page.tsx`:
   - In the header actions `<div className="flex items-center gap-2">` (around line 132)
   - Add before "Create workspace": `<Link href="/workspace/bulk-import" className={getButtonStyling("secondary", "base")}>Bulk Create Workspace</Link>`

8. **Verify** - no TypeScript errors: `pnpm --filter @plane/admin check:lint` or type-check

## Todo List

- [ ] Add `xlsx` to `apps/admin/package.json`
- [ ] Run `pnpm install`
- [ ] Check/add `bulkCreate()` in `InstanceWorkspaceService`
- [ ] Add `bulkCreateWorkspaces()` to `workspace.store.ts`
- [ ] Expose in `use-workspace.tsx`
- [ ] Create `workspace-bulk-import-form.tsx` component
- [ ] Create `workspace/bulk-import/page.tsx` route
- [ ] Add "Bulk Create Workspace" button to `workspace/page.tsx`
- [ ] Verify no TypeScript/lint errors

## Post-Phase Checklist

- [ ] `observer()` wraps all MobX-connected components
- [ ] File input accepts only `.xlsx, .xls`
- [ ] Preview table shown after file selection (before submit)
- [ ] Max 200 rows enforced with inline error
- [ ] Toast shown on success/error (TOAST_TYPE.SUCCESS/ERROR/WARNING)
- [ ] Results table shows skipped rows with reason column
- [ ] "Download Template" downloads valid `.xlsx` with correct headers
- [ ] "Bulk Create Workspace" button visible on `/workspace/` page
- [ ] No `console.error` leaks in production paths (catch errors properly)
- [ ] Components under 200 lines each (split if needed)

## Success Criteria

- Admin visits `/god-mode/workspace/` → sees "Bulk Create Workspace" button
- Clicking opens `/god-mode/workspace/bulk-import`
- Can download template with `name`, `slug`, `organization_size` headers
- Upload filled `.xlsx` → preview table shows parsed rows
- Click "Import workspaces" → rows created in DB → results shown
- Invalid rows (duplicate slug, missing name) shown in skipped table with reason

## Risk Assessment

| Risk                            | Mitigation                                                         |
| ------------------------------- | ------------------------------------------------------------------ |
| xlsx bundle size (~800KB)       | Lazy import with dynamic `import("xlsx")` inside handler functions |
| Slug auto-generation            | Do NOT auto-generate slug; require user to fill it in the template |
| @plane/services build needed    | If adding to shared service, rebuild package before admin app runs |
| Preview table for 200 rows slow | Virtual scrolling not needed for ≤200 rows; simple table is fine   |

## Security Considerations

- File type checked client-side (`accept` attribute) AND by extension check before parse
- Max rows enforced client-side to prevent large payloads
- Backend (Phase 01) re-validates all data before creating in DB
- No user-provided data rendered as HTML (use text content only in table)

## Next Steps

After both phases complete:

- Run `pnpm build` for admin app to verify production build
- Manual test: upload template with 3-5 valid + 2 invalid rows
- Commit with message: `feat(god-mode): add bulk Excel workspace import`
