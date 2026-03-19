---
parent: ./plan.md
---

# Phase 01 — Store Action + Page Button

## Overview

- **Date**: 2026-03-19
- **Description**: Add `exportWorkspaceLinked()` to the store and render the button in the departments page.
- **Priority**: P2
- **Implementation status**: complete
- **Review status**: complete

## Key Insights

- `xlsx` v0.18.5 already in `apps/admin/package.json` — no new dep needed.
- `tree: IInstanceDepartment[]` in store is already populated by `fetchTree()` (called on mount via SWR).
- Each `IInstanceDepartment` has `linked_workspace_detail: { id, name, slug } | null` and `code` (unique dept identifier used for bulk-link).
- `dept_code` is a separate banking code field — user's "department_code" most likely refers to `code` (the identifier used in Bulk Linked import/export).
- Existing `exportDepartments()` uses `window.open()` (server download). New export is client-side (no auth header issue since data is in store).
- Pattern for client-side XLSX: create workbook → add worksheet → write rows → trigger blob download.

## Requirements

1. Button label: **"Export Workspace Linked"**
2. Position: beside "Bulk Linked" button (before it or after — insert after Bulk Linked, before Add Department)
3. Exports only departments where `linked_workspace_detail !== null` (recursively flatten tree)
4. Columns: `workspace_slug`, `department_code` (= `code` field)
5. Filename: `workspace-linked-departments_YYYYMMDD_HHmmss.xlsx`
6. No backend changes

## Architecture

```
page.tsx
  └─ onClick → store.exportWorkspaceLinked()
                  └─ flatten tree (filter linked)
                  └─ xlsx.utils.aoa_to_sheet([headers, ...rows])
                  └─ xlsx.writeFile() → triggers browser download
```

## Related Code Files

- `apps/admin/app/(all)/(dashboard)/departments/page.tsx` — add button (line 83–86)
- `apps/admin/store/instance-department.store.ts` — add action (after exportDepartments, line 203–205)
- `packages/services/src/department/instance-department.service.ts` — IInstanceDepartmentStore interface (add method signature)

## Implementation Steps

### 1. Update store interface (`IInstanceDepartmentStore`)

In `instance-department.store.ts`, add to the interface:
```ts
exportWorkspaceLinked: () => void;
```

### 2. Add MobX observable registration

In `makeObservable(...)`, add:
```ts
exportWorkspaceLinked: action,
```

### 3. Implement `exportWorkspaceLinked` action

After `exportDepartments` method:
```ts
exportWorkspaceLinked = (): void => {
  import("xlsx").then((XLSX) => {
    // Flatten tree recursively
    const flatten = (nodes: IInstanceDepartment[]): IInstanceDepartment[] =>
      nodes.flatMap((n) => [n, ...flatten(n.children ?? [])]);

    const rows = flatten(this.tree)
      .filter((d) => d.linked_workspace_detail !== null)
      .map((d) => ({
        workspace_slug: d.linked_workspace_detail!.slug,
        department_code: d.code,
      }));

    const ws = XLSX.utils.json_to_sheet(rows, { header: ["workspace_slug", "department_code"] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workspace Linked");

    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
    XLSX.writeFile(wb, `workspace-linked-departments_${timestamp}.xlsx`);
  });
};
```

### 4. Add button in `page.tsx`

After the Bulk Linked button (line ~83), add:
```tsx
<Button variant="outline" size="sm" onClick={() => exportWorkspaceLinked()}>
  <Download className="w-4 h-4" />
  Export Workspace Linked
</Button>
```

Destructure `exportWorkspaceLinked` from `useInstanceDepartment()` hook on line 25.

## Todo

- [ ] Add `exportWorkspaceLinked` to `IInstanceDepartmentStore` interface
- [ ] Register in `makeObservable`
- [ ] Implement action with xlsx dynamic import
- [ ] Add button to `page.tsx`
- [ ] Run `pnpm check:lint` — 0 errors

## Success Criteria

- Button appears beside Bulk Linked
- Clicking downloads `workspace-linked-departments_*.xlsx`
- File has 2 columns: `workspace_slug`, `department_code`
- Only linked departments appear (rows with `linked_workspace_detail !== null`)
- Tree children are included (flattened recursively)
- `pnpm check:lint` passes

## Risk Assessment

- **Low**: `xlsx` dynamic import — if tree-shaking issues, use static import instead
- **Low**: timestamp format — `toISOString()` is safe across all browsers

## Security Considerations

- No new API surface — purely client-side read of already-fetched store data
- No sensitive data beyond what's already displayed on the page

## Next Steps

Implement → lint check → done. No backend, no new files.
