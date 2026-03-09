# Phase 5: Org Chart Workspace Page

## Context Links

- [Plan Overview](./plan.md)
- [Phase 2: Backend API Migration](./phase-02-backend-api-migration.md)
- Workspace sidebar example: `apps/web/app/(all)/[workspaceSlug]/(projects)/layout.tsx`
- Routes: `apps/web/app/routes/core.ts`
- Department tree component reference: `apps/admin/app/(all)/(dashboard)/departments/components/department-tree-item.tsx` (from Phase 3)

## Overview

- **Priority:** P2
- **Status:** pending
- **Effort:** 5h
- Add read-only Org Chart page in workspace at `/:workspaceSlug/org-chart`. Backend returns department tree scoped to departments linked to this workspace (traverse up/down from linked dept). Frontend renders expand/collapse tree with staff counts, manager names, positions. Available to any workspace member.

## Key Insights

- Not every department is linked to a workspace -- only show departments relevant to current workspace
- Scoping logic: find departments where `linked_workspace` matches current workspace, then include their ancestors (up to root) and descendants (all children)
- Read-only: no edit/delete actions, just visualization
- Permission: any workspace member can view (WorkspaceEntityPermission equivalent)
- This is a **workspace-scoped** endpoint (unlike Phase 2's instance endpoints), so it lives in `plane.app.views` not `plane.license`
- Tree should show: department name, code, level, manager name, staff count, whether it's directly linked to this workspace

## Requirements

### Functional

- GET `/api/v1/workspaces/<slug>/org-chart/` returns department tree scoped to workspace
- Tree includes: departments linked to this workspace + their ancestor chain + their descendant chain
- Each node shows: name, code, short_name, level, manager_detail, staff_count, is_linked (whether this dept's linked_workspace is current workspace)
- Frontend page at `/:workspaceSlug/org-chart` with tree view
- Expand/collapse tree nodes
- Main workspace sidebar item (ngang hang Projects, Cycles) with org chart icon
<!-- Updated: Validation Session 1 - org chart in main sidebar, not settings -->

### Non-functional

- Permission: WorkspaceEntityPermission (any member)
- Tree rendered efficiently (no N+1 queries)
- Handles case where no departments are linked to workspace (empty state)

## Architecture

### Backend Query Logic

```python
# 1. Find departments directly linked to this workspace
linked_depts = Department.objects.filter(linked_workspace__slug=slug)

# 2. Collect all ancestor IDs (walk up parent chain)
ancestor_ids = set()
for dept in linked_depts:
    current = dept.parent
    while current:
        ancestor_ids.add(current.id)
        current = current.parent

# 3. Collect all descendant IDs (recursive children)
def collect_descendants(dept_ids):
    children = Department.objects.filter(parent_id__in=dept_ids)
    if not children.exists():
        return set()
    child_ids = set(children.values_list("id", flat=True))
    return child_ids | collect_descendants(child_ids)

descendant_ids = collect_descendants(set(linked_depts.values_list("id", flat=True)))

# 4. Union: linked + ancestors + descendants
all_ids = set(linked_depts.values_list("id", flat=True)) | ancestor_ids | descendant_ids

# 5. Build tree from roots in all_ids
```

### Frontend Component Tree

```
OrgChartPage
  +-- OrgChartHeader (title, breadcrumb)
  +-- OrgChartEmptyState (when no linked departments)
  +-- OrgChartTree
       +-- OrgChartNode (recursive)
            +-- expand/collapse toggle
            +-- dept name, code, level badge
            +-- manager avatar + name
            +-- staff count badge
            +-- "linked" indicator if is_linked=true
            +-- children: OrgChartNode[]
```

## Related Code Files

### Files to Create

**Backend:**

- `apps/api/plane/app/views/workspace/org_chart.py` -- OrgChartEndpoint
- `apps/api/plane/app/urls/org_chart.py` -- URL patterns

**Frontend:**

- `apps/web/ce/services/org-chart.service.ts` -- OrgChartService
- `apps/web/app/(all)/[workspaceSlug]/(projects)/org-chart/page.tsx` -- page
- `apps/web/app/(all)/[workspaceSlug]/(projects)/org-chart/layout.tsx` -- layout
- `apps/web/app/(all)/[workspaceSlug]/(projects)/org-chart/header.tsx` -- header
- `apps/web/app/(all)/[workspaceSlug]/(projects)/org-chart/components/org-chart-tree.tsx` -- tree container
- `apps/web/app/(all)/[workspaceSlug]/(projects)/org-chart/components/org-chart-node.tsx` -- recursive node
- `apps/web/app/(all)/[workspaceSlug]/(projects)/org-chart/components/org-chart-empty-state.tsx` -- empty state

### Files to Modify

- `apps/api/plane/app/urls/__init__.py` -- include org_chart URLs
- `apps/api/plane/app/views/workspace/__init__.py` -- export OrgChartEndpoint
- `apps/web/app/routes/core.ts` -- add org-chart route

## Implementation Steps

1. **Create OrgChartEndpoint** (`apps/api/plane/app/views/workspace/org_chart.py`):
   - Inherit from app `BaseAPIView` (not license)
   - Permission: `WorkspaceEntityPermission`
   - GET method:
     a. Find departments with `linked_workspace__slug=slug`
     b. If none found, return empty list
     c. Collect ancestor IDs (walk parent chain)
     d. Collect descendant IDs (recursive query)
     e. Fetch all departments in union set, with `select_related("manager")`, `annotate(staff_count=...)`
     f. Mark each dept with `is_linked = (dept.linked_workspace_id == workspace.id)` in serializer
     g. Build tree structure (filter roots where parent is None or parent not in set)
     h. Return nested JSON

2. **Create OrgChartSerializer** (can add to existing `department.py` serializer file or new file):
   - Extend DepartmentTreeSerializer
   - Add `is_linked` boolean field
   - Add `linked_workspace_detail` (name, slug)
   - Override `get_children` to only include children present in the scoped ID set

3. **Create URL patterns** (`apps/api/plane/app/urls/org_chart.py`):

   ```python
   path("workspaces/<str:slug>/org-chart/", OrgChartEndpoint.as_view(), name="org-chart")
   ```

4. **Wire URLs** in `apps/api/plane/app/urls/__init__.py`

5. **Create OrgChartService** (`apps/web/ce/services/org-chart.service.ts`):
   - `getOrgChart(workspaceSlug: string): Promise<IOrgChartDepartment[]>`
   - Calls `GET /api/workspaces/${workspaceSlug}/org-chart/`

6. **Create org-chart page** (`apps/web/app/(all)/[workspaceSlug]/(projects)/org-chart/page.tsx`):
   - Fetch org chart on mount via service
   - Render header + tree or empty state
   - Loading skeleton while fetching

7. **Create layout.tsx** -- standard workspace page layout wrapper

8. **Create header.tsx** -- page title "Organization Chart" with breadcrumb

9. **Create OrgChartTree** component:
   - Takes `departments: IOrgChartDepartment[]` (root nodes)
   - Maps over roots rendering OrgChartNode

10. **Create OrgChartNode** component:
    - Expand/collapse toggle (chevron icon)
    - Department info: name, code in parentheses, level badge
    - Manager: avatar + display_name (or "No manager")
    - Staff count badge
    - `is_linked` indicator (small "Linked" tag with workspace name)
    - Recursive render children

11. **Create empty state** -- "No departments are linked to this workspace" message

12. **Add route** in `apps/web/app/routes/core.ts`:

    ```typescript
    route(":workspaceSlug/org-chart", "./(all)/[workspaceSlug]/(projects)/org-chart/page.tsx");
    ```

13. **Add sidebar navigation** -- add org chart link to workspace sidebar (with `Network` or `GitBranch` icon)

## Todo List

- [ ] Create OrgChartEndpoint with scoped tree query
- [ ] Create or extend serializer with is_linked field
- [ ] Create URL patterns and wire in **init**.py
- [ ] Create OrgChartService (frontend)
- [ ] Create org-chart page.tsx with layout.tsx and header.tsx
- [ ] Create OrgChartTree component
- [ ] Create OrgChartNode component (recursive, expand/collapse)
- [ ] Create OrgChartEmptyState component
- [ ] Add route in core.ts
- [ ] Add sidebar navigation item
- [ ] Test with workspace that has linked departments
- [ ] Test empty state (workspace with no linked departments)

## Success Criteria

- `/:workspaceSlug/org-chart` renders department tree scoped to workspace
- Tree shows only departments relevant to this workspace (linked + ancestors + descendants)
- Each node displays name, code, manager, staff count
- Linked departments have visual indicator
- Expand/collapse works on nodes with children
- Empty state shown when no departments linked
- Any workspace member can access (not admin-only)

## Risk Assessment

| Risk                                          | Impact                       | Mitigation                                                      |
| --------------------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| N+1 queries for ancestor/descendant traversal | Slow response for deep trees | Pre-fetch all depts, filter in Python; max 6 levels             |
| Large org chart renders slowly                | Poor UX                      | Lazy-load children on expand (or pre-render since max 6 levels) |
| No departments linked                         | Confusing empty page         | Clear empty state with guidance text                            |
| Sidebar gets cluttered                        | UX concern                   | Use collapsible section or place under workspace home           |

## Security Considerations

- Read-only endpoint: no mutations possible
- WorkspaceEntityPermission: only workspace members can view
- No sensitive staff data exposed (only dept name, manager name, staff count)
- Does not expose departments from other workspaces

## Next Steps

- Phase 6: Auto-join Logic & Polish (finalize membership automation)
