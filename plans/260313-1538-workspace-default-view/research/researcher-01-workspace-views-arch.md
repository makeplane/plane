# Researcher 01 — Workspace Views Architecture

## Key Files

| File                                                         | Purpose                                                                                                   |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `packages/types/src/workspace-views.ts`                      | `IWorkspaceView` interface (id, name, access, filters, display_filters, display_properties, rich_filters) |
| `packages/types/src/view-props.ts`                           | `TIssueLayouts` enum: list/kanban/calendar/spreadsheet/gantt_chart                                        |
| `apps/api/plane/db/models/view.py`                           | `IssueView` model — JSON fields: filters, query, display_properties, display_filters                      |
| `apps/api/plane/app/views/view/base.py`                      | `WorkspaceViewViewSet` CRUD — project\_\_isnull=True scopes to workspace level                            |
| `apps/web/core/store/global-view.store.ts`                   | `GlobalViewStore` — `globalViewMap: Record<viewId, IWorkspaceView>`                                       |
| `apps/web/core/components/issues/issue-layouts/spreadsheet/` | Spreadsheet layout components                                                                             |

## Data Flow

```
POST /workspaces/{slug}/views/  →  IssueViewSerializer.create()
  ↓  filters → query via issue_filters()
GlobalViewStore.fetchAllGlobalViews()  →  globalViewMap[viewId]
Components read display_properties booleans to show/hide columns
```

## IssueView Model Fields

- `name`, `description` — display
- `access` — 0=private, 1=public
- `filters` — JSON (priority, state, assignees, labels, dates)
- `display_properties` — 13 boolean toggles
- `display_filters` — group_by, order_by, layout, sub_issue
- `sort_order` — auto-incremented for ordering

## Spreadsheet Column Pattern

- Column components: `apps/web/core/components/issues/issue-layouts/spreadsheet/columns/{name}-column.tsx`
- Properties defined in `SPREADSHEET_PROPERTY_DETAILS` constant
- Header supports sorting/filtering per property
- Cell receives `issue: TIssue` prop

## Default Workspace View Strategy

- **Backend**: Create via Django post_migrate signal or data migration
- `access=1` (public), filters pre-set for start_date=today, due_date=today
- **Frontend**: `GlobalViewStore.fetchAllGlobalViews()` auto-loads on workspace init
- `is_default=True` flag needed on IssueView model to identify seeded views

## Seed Pattern

- Django data migration: `RunPython` function iterates all existing workspaces
- Signal: `post_save` on `Workspace` model auto-creates view for new workspaces
- Mark with `is_locked=True` or custom `is_default` field to prevent deletion

## Unresolved

- Exact location of `SPREADSHEET_PROPERTY_DETAILS` constant
- Whether `display_properties` supports custom/non-boolean columns
