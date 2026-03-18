# Phase 04 — Frontend UI

**Plan:** [plan.md](./plan.md) | **Prev:** [phase-03-frontend-service-store.md](./phase-03-frontend-service-store.md)

## Overview

| Field | Value |
|---|---|
| Date | 2026-03-17 |
| Description | Add Export + Import buttons to departments page toolbar; modal for import flow |
| Priority | P2 |
| Status | ⬜ pending |

<!-- Updated: Validation Session 1 - dedicated page (not modal); window.open() for export -->
## Requirements

- **Export button**: "Export" in toolbar → calls `exportDepartments()` → `window.open()` downloads XLSX
- **Import button**: "Import" in toolbar → navigates to `/god-mode/departments/import`
- **Import page**: file upload → preview table → submit → results display (mirrors `workspace-bulk-import-form.tsx`)
- XLSX parsing: reuse `xlsx` library (already installed, used in `workspace-bulk-import-form.tsx`)
- Max 500 rows, 5MB file size
- After successful import, navigate back to `/god-mode/departments/`

## Architecture

```
departments/page.tsx
  └── toolbar: [Export btn] [Import btn] [Add Department btn]
       ├── Export → exportDepartments() → window.open(url)
       └── Import → router.push('/god-mode/departments/import')

departments/import/page.tsx   (new route, ~100 lines)
  └── <DepartmentImportForm />

departments/import/components/
  └── department-import-form.tsx   (new, <150 lines, mirrors workspace-bulk-import-form.tsx)
       ├── Template download
       ├── File upload (drag-drop area)
       ├── Parse error display
       ├── Preview table (name, short_name, dept_code, dept_type, parent_code)
       ├── Submit → store.bulkImport() → results
       └── Results: created count + skipped list with reasons
```

## Import Column Mapping (XLSX → API)

| XLSX Header | API Field | Required |
|---|---|---|
| `name` | `name` | ✅ |
| `short_name` | `short_name` | ✅ |
| `dept_code` | `dept_code` | ✅ |
| `dept_type` | `dept_type` | ✅ (HO/BRX/OSR) |
| `code` | `code` | ❌ |
| `parent_code` | `parent_code` | ❌ |
| `manager_email` | `manager_email` | ❌ |
| `sort_order` | `sort_order` | ❌ |
| `is_active` | `is_active` | ❌ (default: true) |

## Related Code Files

- `apps/admin/app/(all)/(dashboard)/departments/page.tsx` — add Export + Import buttons
- `apps/admin/app/(all)/(dashboard)/departments/import/page.tsx` — new route entry
- `apps/admin/app/(all)/(dashboard)/departments/import/components/department-import-form.tsx` — new form component
- Reference: `apps/admin/components/workspace/workspace-bulk-import-form.tsx`

## Implementation Steps

### 1. `department-import-form.tsx` (new, <150 lines, mirrors workspace-bulk-import-form.tsx)

```
State: selectedFile, parsedRows, parseError, isSubmitting, result
Template download: downloadTemplate() → xlsx aoa_to_sheet([TEMPLATE_HEADERS]) → writeFile
File parse: parseExcel(file) → xlsx sheet_to_json
Submit: store.bulkImport({ departments: parsedRows })
        → on success: show results; if total_created > 0 → router.push('/god-mode/departments/')
UI structure:
  instructions + template download link
  file upload area (matches workspace import styling)
  parse error display
  preview table (name, short_name, dept_code, dept_type, parent_code)
  results: created count + skipped list
  [Cancel → /god-mode/departments/]  [Import N departments]
```

### 2. `departments/import/page.tsx` (new route, ~15 lines)

- Minimal wrapper: `<PageWrapper header={{ title: "Import Departments" }}>` + `<DepartmentImportForm />`

### 3. `departments/page.tsx` changes

- Add `Export` button (outline variant, `Download` icon) — calls `exportDepartments()` from store
- Add `Import` button (outline variant, `Upload` icon) — `router.push('/god-mode/departments/import')`
- Remove `importOpen` state (no modal needed)

### 3. Template download columns

```typescript
const TEMPLATE_HEADERS = ["name", "short_name", "dept_code", "dept_type", "code", "parent_code", "manager_email", "sort_order", "is_active"];
```

## Todo

- [ ] Create `departments/import/page.tsx` (new route)
- [ ] Create `department-import-form.tsx` with full import flow
- [ ] Add `downloadTemplate()` helper (XLSX, 9 columns)
- [ ] Add `parseExcel()` helper (reuse xlsx pattern from workspace import)
- [ ] Add `Export` + `Import` buttons to `departments/page.tsx` toolbar
- [ ] Run `pnpm check:lint` — 0 errors
- [ ] Manual test: template download, valid import, partial skip display, navigate back on success

## Success Criteria

- Export button downloads valid XLSX with all departments
- Import modal opens, accepts `.xlsx`/`.xls`, shows preview before submit
- Template download produces file with correct 9 column headers
- Results show created count + skipped rows with reasons
- After successful import, tree refreshes automatically
- Component stays under 150 lines

## Risk Assessment

- `xlsx` import: already used in `workspace-bulk-import-form.tsx` (dynamic `await import("xlsx")`) — use same pattern
- `page.tsx` is currently 99 lines — adding 2 buttons + router import stays under 150 lines ✅
- New route `departments/import/` needs to be under `(all)/(dashboard)/` for layout inheritance — confirm admin router structure

## Security Considerations

- File type validation: `/.xlsx|.xls$/i` before parsing
- File size limit: 5MB check before `arrayBuffer()`
- Row limit: 500 max — prevent excessive memory use from large XLSX
- No file stored server-side — parsed client-side, JSON sent to API
