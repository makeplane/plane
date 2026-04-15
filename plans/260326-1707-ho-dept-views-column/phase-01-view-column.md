# Phase 01 — View Column in HO Department Table

**Parent plan:** [plan.md](./plan.md)

## Overview

| Field    | Value      |
| -------- | ---------- |
| Date     | 2026-03-26 |
| Priority | P2         |
| Status   | pending    |
| Effort   | 2h         |

Add a "View" column to the HO Department table. For each department row that has a `linked_workspace_detail`, fetch all workspace views via `WorkspaceService.getAllViews(workspaceSlug)` and render each view as an `<a>` tag (opens new tab) styled as a badge/chip.

## Key Insights

1. **Current table** has 2 columns: Name, Linked Workspace (`department-list.tsx` + `department-tree-row.tsx`).
2. **`linked_workspace_detail.slug`** is already available in each `IDepartment` object — no API changes needed for department data.
3. **Views API**: `GET /api/workspaces/{workspaceSlug}/views/` → returns `IWorkspaceView[]` with `id`, `name`, `is_default`.
4. **No MobX store needed** — SWR per-row fetch keyed by workspace slug is sufficient (cached, reused across rows sharing same workspace).
5. **View URL pattern**: `/{workspaceSlug}/workspace-views/{viewId}/` (inferred from app routes).
6. **Badge component** (`@plane/propel/badge`) is a `<span>` — must wrap in `<a>` for link behavior.
7. **Separation of concerns**: extract view-tags rendering into a small helper component `HoDeptViewTags`.

## Requirements

- [x] Add "View" `<th>` header in `department-list.tsx`
- [x] Add "View" `<td>` cell in `department-tree-row.tsx`
- [x] Fetch workspace views using SWR + `WorkspaceService.getAllViews()` when `linked_workspace_detail` exists
- [x] Render each view as `<a href="/{slug}/workspace-views/{id}/" target="_blank">` styled as badge
- [x] Show `—` when no linked workspace
- [x] Show skeleton/loading state while fetching

## Architecture

```
department-list.tsx
  └── <th> View </th>          ← add header

department-tree-row.tsx
  └── <td>
        └── HoDeptViewTags     ← new helper component (same file or separate)
              ├── useSWR → WorkspaceService.getAllViews(slug)
              └── views.map → <a target="_blank"><Badge>{view.name}</Badge></a>
```

## Related Code Files

| File                                                | Role                         |
| --------------------------------------------------- | ---------------------------- |
| `apps/web/ce/components/ho/department-list.tsx`     | Table header                 |
| `apps/web/ce/components/ho/department-tree-row.tsx` | Table row + new cell         |
| `apps/web/core/services/workspace.service.ts`       | `getAllViews(workspaceSlug)` |
| `packages/propel/src/badge/badge.tsx`               | `Badge` component            |
| `packages/types/src/workspace-views.ts`             | `IWorkspaceView` type        |

## Implementation Steps

### Step 1 — Add View column header (`department-list.tsx`)

Add after the existing `<th>Linked Workspace</th>`:

```tsx
<th className="px-4 py-2.5 text-xs font-medium text-placeholder uppercase tracking-wide">View</th>
```

### Step 2 — Create `HoDeptViewTags` helper in `department-tree-row.tsx`

```tsx
import useSWR from "swr";
import { Badge } from "@plane/propel/badge";
import { WorkspaceService } from "@/services/workspace.service";
import type { IWorkspaceView } from "@plane/types";

const workspaceService = new WorkspaceService();

function HoDeptViewTags({ workspaceSlug }: { workspaceSlug: string }) {
  const { data: views, isLoading } = useSWR(`WORKSPACE_VIEWS_${workspaceSlug}`, () =>
    workspaceService.getAllViews(workspaceSlug)
  );

  if (isLoading) return <span className="text-custom-text-400 text-xs">...</span>;
  if (!views?.length) return <span className="text-custom-text-400">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {views.map((view: IWorkspaceView) => (
        <a
          key={view.id}
          href={`/${workspaceSlug}/workspace-views/${view.id}/`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Badge variant="neutral" size="base">
            {view.name}
          </Badge>
        </a>
      ))}
    </div>
  );
}
```

### Step 3 — Add `<td>` cell in `HoDepartmentTreeRow`

After the existing workspace cell:

```tsx
<td className="px-4 py-2.5 text-sm">
  {dept.linked_workspace_detail ? (
    <HoDeptViewTags workspaceSlug={dept.linked_workspace_detail.slug} />
  ) : (
    <span className="text-custom-text-400">—</span>
  )}
</td>
```

## Todo

- [ ] Add `<th>View</th>` in `department-list.tsx`
- [ ] Add `HoDeptViewTags` component in `department-tree-row.tsx`
- [ ] Add `<td>` using `HoDeptViewTags` in `HoDepartmentTreeRow`
- [ ] Import `Badge` from `@plane/propel/badge`
- [ ] Import `WorkspaceService` from `@/services/workspace.service`
- [ ] Run `pnpm check:lint` — 0 errors
- [ ] Manual test: departments with linked workspace show view tags; clicking opens new tab

## Success Criteria

- View column appears in table header
- Each department row shows view tags for its linked workspace
- Clicking a tag opens the correct view URL in a new tab
- Rows without linked workspace show `—`
- Loading state shown during fetch
- `pnpm check:lint` passes

## Risk Assessment

| Risk                                                           | Impact | Mitigation                             |
| -------------------------------------------------------------- | ------ | -------------------------------------- |
| `WorkspaceService.getAllViews` not exported/accessible from CE | High   | Verify import path before implementing |
| Badge is `<span>` not `<a>`                                    | Low    | Wrap in `<a>` tag                      |
| Many views → wide column                                       | Low    | `flex-wrap` handles overflow           |
| SWR key collision                                              | Low    | Key includes workspace slug            |

## Security Considerations

- `rel="noopener noreferrer"` on `target="_blank"` links — prevents tab-napping.
- No user input used in URLs (view IDs/slugs come from API response).

## Next Steps

After implementation → run `/code-review` then commit via `/git`.

## Unresolved Questions

1. **View URL pattern**: Assuming `/{workspaceSlug}/workspace-views/{viewId}/` — verify against actual app routes.
2. **`WorkspaceService` import path**: `@/services/workspace.service` vs `@/plane-web/services/workspace.service` — check which is available in CE context.
3. **Badge export path**: Confirm `@plane/propel/badge` is the correct subpath export.
