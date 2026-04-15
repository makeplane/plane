---
title: "Phase 02 — Frontend: Bulk Link Modal & Button"
description: "Add Bulk Department Linked button and Excel upload modal to departments page"
status: pending
priority: P2
---

# Phase 02 — Frontend

**Parent plan:** [plan.md](./plan.md)
**Prev phase:** [phase-01-backend.md](./phase-01-backend.md)

## Overview

| Field    | Value      |
| -------- | ---------- |
| Date     | 2026-03-18 |
| Status   | pending    |
| Priority | P2         |

## Key Insights

- Existing `department-import-form.tsx` is excellent reference — same Excel upload + preview + results UX
- Button row in `page.tsx` (line 68-85): Export → Import → Rejoin → **[Bulk Linked]** → Add Department
- New modal (not separate page) — operation is simple, keeps user on departments page
- Excel columns: `code` (dept identifier, unique round-trip code) + `workspace_slug` <!-- Updated: Validation Session 1 - use `code` not `dept_code` -->
- Template download: generate minimal xlsx with 2-column header + 1 sample row
- Store action: `bulkLinkWorkspace(links)` → calls new API endpoint
- Service method: `bulkLinkWorkspace(data)` in instance-department.service.ts

## Requirements

1. New button "Bulk Linked" (with Link icon) in departments toolbar
2. Clicking opens `BulkLinkModal` dialog
3. Modal features:
   - Template download (xlsx with `dept_code`, `workspace_slug` columns)
   - File upload (xlsx/xls, max 5MB, max 500 rows)
   - Preview table (first 10 rows)
   - Submit button → POST to API
   - Results: linked count, skipped rows table with reasons
4. Store action `bulkLinkWorkspace()` + service method
5. Refresh tree after successful link

## Architecture

```
departments/page.tsx
  └── BulkLinkModal (new component)
        ├── Template download (xlsx with dept_code + workspace_slug)
        ├── File upload → parse with xlsx lib → [{dept_code, workspace_slug}]
        ├── Preview table (first 10 rows)
        └── Submit → store.bulkLinkWorkspace(links) → API
              └── Results: linked[] + skipped[{row, reason}]
```

## Related Code Files

- `apps/admin/app/(all)/(dashboard)/departments/page.tsx` — add button + modal render
- `apps/admin/app/(all)/(dashboard)/departments/import/components/department-import-form.tsx` — reference for UX pattern
- `apps/admin/store/instance-department.store.ts` — add `bulkLinkWorkspace()` action
- `packages/services/src/department/instance-department.service.ts` — add `bulkLinkWorkspace()` method

## Implementation Steps

1. **Service** (`instance-department.service.ts`):

   ```typescript
   async bulkLinkWorkspace(data: { links: { code: string; workspace_slug: string }[] }) {
     return this.post(`/api/instances/departments/bulk-link-workspace/`, data);
   }
   ```

2. **Store** (`instance-department.store.ts`):
   - Add `bulkLinkWorkspace(links)` action
   - Calls service, refreshes tree on success

3. **Modal** (`departments/components/bulk-link-modal.tsx`):
   - Props: `open: boolean`, `onClose: () => void`
   - Template download: generate xlsx with headers `code`, `workspace_slug` <!-- Updated: Validation Session 1 -->
   - File upload: same validation as import form (xlsx/xls, 5MB, 500 rows)
   - Parse: only read columns `code` and `workspace_slug`
   - Preview: 2-column table, max 10 rows shown
   - Submit → store.bulkLinkWorkspace → show results
   - Results section: green success count + skipped table

4. **Page** (`departments/page.tsx`):
   - Import `BulkLinkModal` + `Link` icon from lucide-react
   - Add state: `const [bulkLinkOpen, setBulkLinkOpen] = useState(false)`
   - Add button between Rejoin and Add Department:
     ```tsx
     <Button variant="outline" size="sm" onClick={() => setBulkLinkOpen(true)}>
       <Link className="w-4 h-4" />
       Bulk Linked
     </Button>
     ```
   - Render modal: `<BulkLinkModal open={bulkLinkOpen} onClose={() => setBulkLinkOpen(false)} />`

## Todo

- [ ] Add `bulkLinkWorkspace()` to `instance-department.service.ts`
- [ ] Add `bulkLinkWorkspace()` action to `instance-department.store.ts`
- [ ] Create `bulk-link-modal.tsx` component (<150 lines)
- [ ] Update `page.tsx` — add button + modal
- [ ] Run `pnpm check:lint`

## Success Criteria

- Button visible beside Add Department in toolbar
- Modal opens on click
- Template downloads as valid xlsx
- File upload validates extension/size/rows
- Preview shows first 10 rows of parsed data
- Submit sends correct payload to API
- Results display linked count + skipped table
- Tree refreshes after submission

## Risk Assessment

- **Component size**: bulk-link-modal.tsx must stay <150 lines; split results display to sub-component if needed
- **xlsx lib**: already imported in import form — no new dependency needed

## Security Considerations

- File type validation client-side (extension + MIME)
- Max 500 rows enforced client-side before API call
- No direct DOM manipulation or eval of file content
