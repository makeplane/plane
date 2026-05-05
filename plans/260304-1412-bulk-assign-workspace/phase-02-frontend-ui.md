# Phase 02 — Frontend: Excel Bulk Assign UI

## Context Links

- Plan: [plan.md](./plan.md)
- Phase 01 (dependency): [phase-01-backend-api.md](./phase-01-backend-api.md)
- Mirror form: `apps/admin/components/workspace/workspace-bulk-import-form.tsx`
- Mirror preview: `apps/admin/components/workspace/workspace-bulk-import-preview.tsx`
- Mirror results: `apps/admin/components/workspace/workspace-bulk-import-results.tsx`
- Store: `apps/admin/store/workspace.store.ts`
- Service: `packages/services/src/workspace/instance-workspace.service.ts`
- Hook: `apps/admin/hooks/store/use-workspace.tsx`
- Listing page: `apps/admin/app/(all)/(dashboard)/workspace/page.tsx`

## Overview

- **Priority:** P2
- **Status:** pending (blocked by Phase 01)
- **Description:** Add "Bulk Assign Workspace" button to workspace listing page. Navigates to `/workspace/bulk-assign` where admin uploads `.xlsx`/`.xls`, previews rows, submits → backend assigns users → results displayed. Mirror existing bulk-import pattern exactly.

## Key Insights

- `WorkspaceBulkImportForm` is 167 lines — stay under 200 for assign form
- All three sub-components (`form`, `preview`, `results`) are separate files — follow same split
- `bulkAssignMembers` store action needs no `runInAction` — memberships don't go into local observable state
- `IWorkspaceBulkAssignResponse` defined in `packages/services/src/workspace/instance-workspace.service.ts`
- **Role normalization: `{Guest:5, Member:15, Admin:20}` — NOT 10 for Member**
- Default role if omitted: `15` (Member)
- `xlsx` package already a dependency (used by bulk-import) — no new package needed

## Requirements

**Functional:**

- "Bulk Assign Workspace" `Link` button on `/workspace/` page
- Route `/workspace/bulk-assign` renders assign form in `PageWrapper`
- File upload: `.xlsx`, `.xls` only, max 5 MB, max 500 rows
- Template download: columns `email`, `workspace_slug`, `role`
- Preview table: `#`, Email, Workspace Slug, Role columns
- Submit: POST JSON to `/api/instances/workspaces/bulk-assign-members/`
- Results: show `total_assigned`, `total_skipped`, skipped rows with reason

**Non-functional:**

- `observer()` wrapper on all components
- Each file under 200 lines
- Role normalization on parse (string/number → valid int)
- Toast on success/warning/error

## Architecture

```
workspace/page.tsx
  └─ <Link href="/workspace/bulk-assign">Bulk Assign Workspace</Link>

workspace/bulk-assign/page.tsx
  └─ <PageWrapper>
       └─ <WorkspaceBulkAssignForm />

WorkspaceBulkAssignForm
  ├─ downloadTemplate() — XLSX aoa_to_sheet([["email","workspace_slug","role"]])
  ├─ parseExcel(file) → IWorkspaceAssignRow[]  (normalizeRole inline)
  ├─ <WorkspaceBulkAssignPreview rows={parsedRows} />
  ├─ handleSubmit() → useWorkspace().bulkAssignMembers(rows) → setResult()
  └─ <WorkspaceBulkAssignResults result={result} />

WorkspaceStore.bulkAssignMembers()
  └─ instanceWorkspaceService.bulkAssignMembers(members)
       └─ POST /api/instances/workspaces/bulk-assign-members/
```

## Related Code Files

**CREATE:**

- `apps/admin/app/(all)/(dashboard)/workspace/bulk-assign/page.tsx`
- `apps/admin/components/workspace/workspace-bulk-assign-form.tsx`
- `apps/admin/components/workspace/workspace-bulk-assign-preview.tsx`
- `apps/admin/components/workspace/workspace-bulk-assign-results.tsx`

**MODIFY:**

- `apps/admin/app/(all)/(dashboard)/workspace/page.tsx` — add Link button (lines 132–139)
- `apps/admin/store/workspace.store.ts` — add `bulkAssignMembers` action
- `packages/services/src/workspace/instance-workspace.service.ts` — add type + method

**NO CHANGE:**

- `apps/admin/hooks/store/use-workspace.tsx` — auto-exposes `IWorkspaceStore` members

## Embedded Rules

**Rule 1 — observer() on every component (MobX requirement):**

```tsx
import { observer } from "mobx-react";
export const WorkspaceBulkAssignForm = observer(function WorkspaceBulkAssignForm() { ... });
```

**Rule 2 — xlsx dynamic import (avoid bundle bloat):**

```ts
const XLSX = await import("xlsx");
```

**Rule 3 — Button/toast imports:**

```ts
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
```

**Rule 4 — Role normalization (CRITICAL: Member=15, NOT 10):**

```ts
const ROLE_MAP: Record<string, number> = {
  guest: 5,
  member: 15,
  admin: 20,
  "5": 5,
  "15": 15,
  "20": 20,
};
function normalizeRole(raw: unknown): number {
  if (typeof raw === "number" && [5, 15, 20].includes(raw)) return raw;
  const key = String(raw ?? "")
    .trim()
    .toLowerCase();
  return ROLE_MAP[key] ?? 15; // default Member
}
```

**Rule 5 — Service additions in `instance-workspace.service.ts`:**

```ts
export interface IWorkspaceBulkAssignResponse {
  assigned: Array<{ email: string; workspace_slug: string; role: number }>;
  skipped: Array<{ row_number: number; email: string; workspace_slug: string; reason: string }>;
  total_assigned: number;
  total_skipped: number;
}

async bulkAssignMembers(
  members: Array<{ email: string; workspace_slug: string; role: number }>
): Promise<IWorkspaceBulkAssignResponse> {
  return this.post("/api/instances/workspaces/bulk-assign-members/", { members })
    .then((response) => response?.data)
    .catch((error) => { throw error?.response?.data; });
}
```

**Rule 6 — Store action (no observable mutation needed):**

```ts
bulkAssignMembers = async (
  members: Array<{ email: string; workspace_slug: string; role: number }>
): Promise<IWorkspaceBulkAssignResponse> => {
  try {
    return await this.instanceWorkspaceService.bulkAssignMembers(members);
  } catch (error) {
    throw error;
  }
};
```

**Rule 7 — Each file under 200 lines.**

## Implementation Steps

### Step 1: Add type + method to `instance-workspace.service.ts`

File: `packages/services/src/workspace/instance-workspace.service.ts`

- Add `IWorkspaceBulkAssignResponse` interface after `IWorkspaceBulkCreateResponse` (line ~15)
- Add `async bulkAssignMembers()` method after existing `bulkCreate()` (line ~93)

### Step 2: Update `workspace.store.ts`

File: `apps/admin/store/workspace.store.ts`

- Import `IWorkspaceBulkAssignResponse` at line 11 (alongside existing import)
- Re-export at line 16 (alongside existing re-export)
- Add to `IWorkspaceStore` interface: `bulkAssignMembers: (members: Array<{email: string; workspace_slug: string; role: number}>) => Promise<IWorkspaceBulkAssignResponse>`
- Add to `makeObservable`: `bulkAssignMembers: action`
- Implement method (see Rule 6)

### Step 3: Create `workspace-bulk-assign-preview.tsx`

File: `apps/admin/components/workspace/workspace-bulk-assign-preview.tsx`

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

export interface IWorkspaceAssignRow {
  email: string;
  workspace_slug: string;
  role?: number | string;
}

type Props = { rows: IWorkspaceAssignRow[] };

export const WorkspaceBulkAssignPreview = observer(function WorkspaceBulkAssignPreview({ rows }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Preview — <span className="text-tertiary">{rows.length} row(s)</span>
      </p>
      <div className="rounded-md border border-border-subtle overflow-auto max-h-64">
        <table className="w-full text-sm">
          <thead className="bg-surface-1 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Workspace Slug</th>
              <th className="px-3 py-2 text-left font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-border-subtle">
                <td className="px-3 py-2 text-tertiary">{idx + 1}</td>
                <td className="px-3 py-2">{row.email || <span className="text-color-danger-primary">—</span>}</td>
                <td className="px-3 py-2">
                  {row.workspace_slug || <span className="text-color-danger-primary">—</span>}
                </td>
                <td className="px-3 py-2">{String(row.role ?? 15)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
```

### Step 4: Create `workspace-bulk-assign-results.tsx`

File: `apps/admin/components/workspace/workspace-bulk-assign-results.tsx`

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { IWorkspaceBulkAssignResponse } from "@plane/services";

type Props = { result: IWorkspaceBulkAssignResponse };

export const WorkspaceBulkAssignResults = observer(function WorkspaceBulkAssignResults({ result }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="rounded-md bg-green-500/10 px-4 py-2 text-sm">
          Assigned: <strong>{result.total_assigned}</strong>
        </div>
        {result.total_skipped > 0 && (
          <div className="rounded-md bg-red-500/10 px-4 py-2 text-sm">
            Skipped: <strong>{result.total_skipped}</strong>
          </div>
        )}
      </div>
      {result.skipped.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Skipped rows:</p>
          <div className="rounded-md border border-border-subtle overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-1">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Row</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Workspace</th>
                  <th className="px-3 py-2 text-left font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {result.skipped.map((item, idx) => (
                  <tr key={idx} className="border-t border-border-subtle">
                    <td className="px-3 py-2">{item.row_number}</td>
                    <td className="px-3 py-2">{item.email || "—"}</td>
                    <td className="px-3 py-2">{item.workspace_slug || "—"}</td>
                    <td className="px-3 py-2 text-red-500">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});
```

### Step 5: Create `workspace-bulk-assign-form.tsx`

File: `apps/admin/components/workspace/workspace-bulk-assign-form.tsx`

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Download, Upload } from "lucide-react";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceBulkAssignResponse } from "@plane/services";
import { useWorkspace } from "@/hooks/store";
import { WorkspaceBulkAssignPreview } from "./workspace-bulk-assign-preview";
import { WorkspaceBulkAssignResults } from "./workspace-bulk-assign-results";
import type { IWorkspaceAssignRow } from "./workspace-bulk-assign-preview";

const MAX_ROWS = 500;
const MAX_FILE_SIZE_MB = 5;

const ROLE_MAP: Record<string, number> = {
  guest: 5,
  member: 15,
  admin: 20,
  "5": 5,
  "15": 15,
  "20": 20,
};

function normalizeRole(raw: unknown): number {
  if (typeof raw === "number" && [5, 15, 20].includes(raw)) return raw;
  const key = String(raw ?? "")
    .trim()
    .toLowerCase();
  return ROLE_MAP[key] ?? 15;
}

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([["email", "workspace_slug", "role"]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Assignments");
  XLSX.writeFile(wb, "workspace-assign-template.xlsx");
}

async function parseExcel(file: File): Promise<IWorkspaceAssignRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return raw.map((r) => ({
    email: String(r.email ?? "")
      .trim()
      .toLowerCase(),
    workspace_slug: String(r.workspace_slug ?? "").trim(),
    role: normalizeRole(r.role),
  }));
}

export const WorkspaceBulkAssignForm = observer(function WorkspaceBulkAssignForm() {
  const { bulkAssignMembers } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<IWorkspaceAssignRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<IWorkspaceBulkAssignResponse | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    setParseError(null);
    setParsedRows([]);
    if (!file) return;

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setParseError("Only .xlsx and .xls files are accepted.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setParseError(`File too large. Maximum ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    try {
      const rows = await parseExcel(file);
      if (rows.length > MAX_ROWS) {
        setParseError(`Too many rows: ${rows.length}. Maximum allowed is ${MAX_ROWS}.`);
        return;
      }
      setParsedRows(rows);
    } catch {
      setParseError("Failed to parse the file. Ensure it is a valid .xlsx or .xls file.");
    }
  }, []);

  const handleSubmit = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    try {
      const data = await bulkAssignMembers(
        parsedRows.map((r) => ({ email: r.email, workspace_slug: r.workspace_slug, role: (r.role as number) ?? 15 }))
      );
      setResult(data);
      if (data.total_assigned > 0)
        setToast({ type: TOAST_TYPE.SUCCESS, title: `${data.total_assigned} member(s) assigned successfully` });
      if (data.total_skipped > 0) setToast({ type: TOAST_TYPE.WARNING, title: `${data.total_skipped} row(s) skipped` });
    } catch (err) {
      const error = err as Record<string, string>;
      setToast({ type: TOAST_TYPE.ERROR, title: "Assignment failed", message: error?.error || "Something went wrong" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="space-y-2">
        <p className="text-sm font-medium">Excel file requirements:</p>
        <p className="text-sm text-tertiary">
          File must have a header row with columns: <code className="text-primary">email</code>,{" "}
          <code className="text-primary">workspace_slug</code>, <code className="text-primary">role</code> (5=Guest,
          15=Member, 20=Admin — or text "Guest"/"Member"/"Admin"). Default role: Member.
        </p>
        <p className="text-sm text-tertiary">
          Max {MAX_ROWS} rows and {MAX_FILE_SIZE_MB} MB per import.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void downloadTemplate()}
        className="flex items-center gap-2 text-sm text-primary hover:underline w-fit"
      >
        <Download className="h-4 w-4" />
        Download template
      </button>

      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => void handleFileChange(e)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 rounded-md border border-dashed border-border-subtle p-6 w-full hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <Upload className="h-5 w-5 text-tertiary" />
          <span className="text-sm">
            {selectedFile ? selectedFile.name : "Click to select an Excel file (.xlsx, .xls)"}
          </span>
        </button>
        {parseError && <p className="text-sm text-red-500">{parseError}</p>}
      </div>

      {parsedRows.length > 0 && <WorkspaceBulkAssignPreview rows={parsedRows} />}

      <div className="flex items-center gap-4">
        <Button
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={parsedRows.length === 0 || isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? "Assigning..." : "Assign members"}
        </Button>
        <Link href="/workspace" className={getButtonStyling("secondary", "lg")}>
          Cancel
        </Link>
      </div>

      {result && <WorkspaceBulkAssignResults result={result} />}
    </div>
  );
});
```

### Step 6: Create route page

File: `apps/admin/app/(all)/(dashboard)/workspace/bulk-assign/page.tsx`

```tsx
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PageWrapper } from "@/components/common/page-wrapper";
import { WorkspaceBulkAssignForm } from "@/components/workspace/workspace-bulk-assign-form";
import type { Route } from "./+types/page";

function WorkspaceBulkAssignPage(_props: Route.ComponentProps) {
  return (
    <PageWrapper
      header={{
        title: "Bulk assign workspace members",
        description: "Upload an Excel file to add users to workspaces at once.",
      }}
    >
      <div className="pt-4">
        <WorkspaceBulkAssignForm />
      </div>
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Bulk Assign Workspace Members - God Mode" }];

export default WorkspaceBulkAssignPage;
```

### Step 7: Add button to workspace listing page

File: `apps/admin/app/(all)/(dashboard)/workspace/page.tsx`

At lines 132–139, insert new `Link` between "Bulk Create Workspace" and "Create workspace":

```tsx
<div className="flex items-center gap-2">
  <Link href="/workspace/bulk-import" className={getButtonStyling("secondary", "base")}>
    Bulk Create Workspace
  </Link>
  <Link href="/workspace/bulk-assign" className={getButtonStyling("neutral-primary", "base")}>
    Bulk Assign Workspace
  </Link>
  <Link href="/workspace/create" className={getButtonStyling("primary", "base")}>
    Create workspace
  </Link>
</div>
```

## Post-Phase Checklist

- [ ] `IWorkspaceBulkAssignResponse` exported from `@plane/services`
- [ ] `bulkAssignMembers()` in `InstanceWorkspaceService` POSTs to `/api/instances/workspaces/bulk-assign-members/`
- [ ] `bulkAssignMembers` action in `WorkspaceStore`, registered in `makeObservable`
- [ ] `observer()` wrapper on all 3 new components
- [ ] Role normalization uses `{Guest:5, Member:15, Admin:20}` (NOT 10)
- [ ] Default role fallback is `15` (Member)
- [ ] Template download has 3 columns: `email`, `workspace_slug`, `role`
- [ ] Preview table shows `#`, Email, Workspace Slug, Role
- [ ] Results table shows skipped rows with `workspace_slug` column
- [ ] Button added to workspace listing page
- [ ] All new files under 200 lines
- [ ] `xlsx` already in `apps/admin/package.json` — verified, no new dep needed

## Todo List

- [ ] Modify `instance-workspace.service.ts` (type + method)
- [ ] Modify `workspace.store.ts` (type import + action)
- [ ] Create `workspace-bulk-assign-preview.tsx`
- [ ] Create `workspace-bulk-assign-results.tsx`
- [ ] Create `workspace-bulk-assign-form.tsx`
- [ ] Create `workspace/bulk-assign/page.tsx`
- [ ] Modify `workspace/page.tsx` (add button)
- [ ] Manual test: upload file → preview → submit → verify results

## Success Criteria

- Admin can click "Bulk Assign Workspace" on `/workspace/` page
- Upload `.xlsx` with valid rows → preview renders correctly
- Submit → assigned members visible in workspace
- Skipped rows shown with reasons in results table
- Invalid file/format rejected client-side with clear error message

## Risk Assessment

- **Role value mismatch (HIGH):** Spec says Member=10; backend uses 15. `ROLE_MAP` uses 15 — this is the #1 bug risk.
- **xlsx already present (LOW):** Expected to be available — verify `apps/admin/package.json` before assuming.
- **`+types/page` route type (LOW):** Same convention as `bulk-import/page.tsx` — should work identically.

## Security Considerations

- Only god-mode admin can reach this page (shared session auth)
- Role values validated both client-side (`normalizeRole`) and server-side (`VALID_ROLES`)
- Email lowercased before sending — prevents case bypass

## Next Steps

- After both phases: update `docs/project-changelog.md` and `docs/development-roadmap.md`
- Consider showing member count in workspace listing for visibility

## Unresolved Questions

1. **Role value:** Spec says Member=10 but DB model defines Member=15. Implementation uses 15. Needs explicit sign-off.
2. **xlsx availability:** Verify `xlsx` is in `apps/admin/package.json` (expected yes from bulk-import feature).
3. **`neutral-primary` button variant:** Confirm this variant exists in `@plane/propel/button` — if not, use `"secondary"`.
