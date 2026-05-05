---
title: "Phase 02 — Frontend UI"
status: pending
priority: P2
effort: 3h
---

# Phase 02 — Frontend UI

## Context

- Parent plan: [plan.md](./plan.md)
- Depends on: [Phase 01](./phase-01-backend-api.md)
- Reference modal: `apps/admin/app/(all)/(dashboard)/staff/components/staff-import-modal.tsx`
- Reference service: `packages/services/src/staff/instance-staff.service.ts`
- Departments page: `apps/admin/app/(all)/(dashboard)/departments/`
- Store: `apps/admin/store/instance-department.store.ts`

## Overview

Add "Bulk Upload" button to the admin God Mode departments page. Clicking it opens a modal for CSV upload, preview, and results — following the `StaffImportModal` pattern exactly.

## Architecture

### New Files

- `apps/admin/app/(all)/(dashboard)/departments/components/department-import-modal.tsx` — import modal UI

### Modified Files

- `apps/admin/app/(all)/(dashboard)/departments/page.tsx` (or header component) — add "Bulk Upload" button
- `apps/admin/store/instance-department.store.ts` — add `bulkUpload()` action
- `packages/services/src/instance/instance-department.service.ts` (or equivalent) — add `bulkUpload()` method

> Note: Verify exact service file path. Staff uses `packages/services/src/staff/instance-staff.service.ts`.

## Related Code Files

- `apps/admin/app/(all)/(dashboard)/staff/components/staff-import-modal.tsx` — reference modal (copy structure)
- `packages/services/src/staff/instance-staff.service.ts` — `bulkImport()` method reference
- `apps/admin/store/instance-staff.store.ts` — store reference
- `apps/admin/app/(all)/(dashboard)/departments/components/department-form-modal.tsx` — existing modal pattern
- `apps/admin/store/instance-department.store.ts` — add bulkUpload action

## Modal UX Flow

```
[Bulk Upload button] → opens DepartmentImportModal
  ├── Step 1: Upload
  │   ├── File input (accept=".csv")
  │   ├── "Download CSV template" link (generates sample file)
  │   ├── Checkbox: "Skip existing departments (by short_name)"
  │   └── [Upload] button → POST /api/instances/departments/bulk-upload/
  └── Step 2: Results
      ├── Summary: Created: N | Skipped: N | Errors: N
      └── Error table: row | name | reason (if any errors)
```

## CSV Template Download

Generate client-side using `Blob`:

```typescript
const TEMPLATE_HEADERS = "name,code,short_name,dept_code,description,dept_type,parent_short_name,level,is_active";
const TEMPLATE_EXAMPLE = "Finance,FIN,FIN,1234,Finance Department,HO,,1,true";
const blob = new Blob([TEMPLATE_HEADERS + "\n" + TEMPLATE_EXAMPLE], { type: "text/csv" });
```

## Implementation Steps

### 1. Add service method

File: `packages/services/src/instance/instance-department.service.ts` (verify path)

```typescript
async bulkUpload(file: File, skipExisting: boolean): Promise<IDepartmentBulkUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("skip_existing", String(skipExisting));
  return this.post("/api/instances/departments/bulk-upload/", formData);
}
```

### 2. Add store action

File: `apps/admin/store/instance-department.store.ts`

```typescript
bulkUpload = async (file: File, skipExisting: boolean) => {
  return await departmentService.bulkUpload(file, skipExisting);
};
```

### 3. Create DepartmentImportModal

File: `apps/admin/app/(all)/(dashboard)/departments/components/department-import-modal.tsx`

- Mirror `staff-import-modal.tsx` structure
- States: `file`, `skipExisting`, `isLoading`, `results`
- On submit: call `store.bulkUpload()`, set results
- Show results step with created/skipped/error counts + error table
- "Download template" triggers client-side CSV download

### 4. Add button to departments page

File: departments `page.tsx` or header component

```tsx
<Button onClick={() => setImportModalOpen(true)}>Bulk Upload</Button>
<DepartmentImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} />
```

## Todo

- [ ] Locate exact service file for instance departments (verify `packages/services/src/`)
- [ ] Add `IDepartmentBulkUploadResponse` type: `{ created: number; skipped: number; errors: { row: number; name: string; reason: string }[] }`
- [ ] Add `bulkUpload()` to department service
- [ ] Add `bulkUpload` action to `instance-department.store.ts`
- [ ] Create `department-import-modal.tsx` (≤150 lines, split if needed)
- [ ] Implement CSV template download (client-side Blob)
- [ ] Add "Bulk Upload" button to departments page header
- [ ] Wire modal open/close state
- [ ] Show upload step: file input + skip_existing checkbox
- [ ] Show results step: summary + error table
- [ ] Run `pnpm check:lint` — 0 errors
- [ ] Verify imports in package.json

## Success Criteria

- Button visible in God Mode Departments page header
- Modal opens, accepts CSV file
- Template CSV downloads with correct columns
- On upload: shows results (created/skipped/errors)
- Error rows displayed with row number, dept name, reason
- Lint passes, no console errors

## Risk Assessment

- `staff-import-modal.tsx` may use different UI components — match to admin app's existing pattern
- Service file location for instance departments needs verification before implementation
- Modal component ≤150 lines — split into sub-components if results table grows large

## Security Considerations

- File input: restrict to `.csv` via `accept` attribute
- No client-side parsing needed (server handles it)
- Display server error messages safely (avoid raw HTML injection)

## Next Steps

After implementation → run `pnpm check:lint`, manual test in browser at `/god-mode/departments/`
