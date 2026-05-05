# Dashboard Feature Documentation Analysis & Updates

**Date**: 2026-02-27
**Status**: Analysis Complete
**Scope**: Assess dashboard feature impact on project documentation

## Executive Summary

The dashboard feature implementation adds **significant new patterns** that warrant comprehensive documentation updates across three core docs:

1. **system-architecture.md** - Add Dashboard subsystem architecture
2. **project-overview-pdr.md** - Update feature list to include dashboards
3. **project-roadmap.md** - Note dashboard as shipped in v1.2

**Recommendation**: Proceed with updates. Dashboard introduces new entity relationships, CRDT-adjacent patterns, and frontend patterns worth documenting for future developers.

---

## Feature Overview

### Backend Components

**Models** (`apps/api/plane/db/models/dashboard.py`):

- `Dashboard`: Workspace-scoped, contains multiple widgets, access control (private/public), M2M to projects, soft-delete
- `DashboardWidget`: Workspace+Dashboard-scoped, chart type selection (BAR, LINE, AREA, DONUT, PIE, NUMBER), grid positioning (x, y, width, height), filters + config as JSONField

**Views** (`apps/api/plane/app/views/dashboard.py`):

- `DashboardViewSet`: CRUD ops, M2M project handling, creator-based access control
- `DashboardWidgetViewSet`: Nested under dashboard, CRUD
- `DashboardWidgetChartEndpoint`: Aggregates Issue data, complex metric calculation logic, filter whitelist security pattern

**Patterns Introduced**:

- **Access Control Pattern**: Creator-based OR public flag filtering (`Q(created_by=user) | Q(access=1)`)
- **Widget Data Aggregation**: Django aggregation pipeline (Count, Sum, Coalesce, group_by for grouped charts)
- **Filter Whitelisting**: Security-first metric/filter injection (strict mapping prevents SQL injection)
- **Grid Positioning**: UI layout metadata stored in DB (x, y, width, height)

### Frontend Components

**Store** (`apps/web/ce/store/dashboards/dashboard.store.ts`):

- Dashboard CRUD + widget CRUD
- Chart data caching by widget ID
- Nested data structure: `dashboardWidgets[dashboardId][]`, `widgetChartData[widgetId]`

**Service** (`apps/web/core/services/dashboards/dashboard.service.ts`):

- Standard REST calls + chart endpoint
- URL: `/api/workspaces/{slug}/dashboards/`

**Routes** (`app/routes/core.ts`):

- `/:workspaceSlug/dashboards` - List page
- `/:workspaceSlug/dashboards/:dashboardId` - Detail + widget grid
- Dynamic widget layout via grid positioning

**Patterns Introduced**:

- **Widget Chart Rendering**: Uses `@plane/propel/charts` for chart type selection
- **Nested Resource Routes**: Dashboard → Widgets (nested URL structure)
- **Grid Layout**: Widget positioning tied to DB model (not just UI state)

---

## Documentation Impact Assessment

### 1. system-architecture.md (722 LOC, ~78 LOC budget)

**Current State**:

- Line 172: Mentions "Dashboard list & widget detail pages" in Frontend Architecture
- Line 242: Mentions "Analytics dashboard CRUD & aggregation" in Backend Architecture
- **NO dedicated section** for Dashboard subsystem

**Required Updates**:

#### Add Dashboard Subsystem Section (est. 45 LOC)

```markdown
## Dashboard Subsystem (Analytics & Visualization)

### Architecture Overview

Dashboard feature enables workspace-level customizable analytics via multi-widget dashboards. Implements creator-based access control + public sharing.

### Entity Relationships
```

Workspace
└── Dashboard (1:N)
├── name, description, access (0=private, 1=public)
├── archived_at (soft archive support)
├── projects (M2M, scopes widget data aggregation)
└── DashboardWidget (1:N)
├── chart_type (BAR_CHART, LINE_CHART, AREA_CHART, DONUT_CHART, PIE_CHART, NUMBER)
├── chart_model (BASIC or GROUPED)
├── x_axis_property (STATES, STATE_GROUPS, ASSIGNEES, PROJECTS, PRIORITIES, LABELS)
├── y_axis_metric (WORK_ITEM_COUNT, ESTIMATE_POINTS, PENDING_WORK_ITEMS, COMPLETED_WORK_ITEMS, IN_PROGRESS_WORK_ITEMS, BLOCKED_WORK_ITEMS, WORK_ITEMS_DUE_TODAY, WORK_ITEMS_DUE_THIS_WEEK)
├── group_by (secondary x-axis for GROUPED mode)
├── filters (JSONField: {priority, assignees, labels, state, state_group, created_by})
└── Grid positioning: x_axis_coord, y_axis_coord, width, height

```

### API Endpoints

| Endpoint | Method | Purpose |
| -------- | ------ | ------- |
| `/api/workspaces/{slug}/dashboards/` | GET | List dashboards (filtered by creator \| public) |
| `/api/workspaces/{slug}/dashboards/` | POST | Create dashboard |
| `/api/workspaces/{slug}/dashboards/{id}/` | GET | Retrieve dashboard + widgets |
| `/api/workspaces/{slug}/dashboards/{id}/` | PATCH | Update dashboard |
| `/api/workspaces/{slug}/dashboards/{id}/` | DELETE | Delete dashboard (soft delete) |
| `/api/workspaces/{slug}/dashboards/{dashboard_id}/widgets/` | GET | List widgets |
| `/api/workspaces/{slug}/dashboards/{dashboard_id}/widgets/` | POST | Create widget |
| `/api/workspaces/{slug}/dashboards/{dashboard_id}/widgets/{widget_id}/` | PATCH | Update widget positioning + filters |
| `/api/workspaces/{slug}/dashboards/{dashboard_id}/widgets/{widget_id}/` | DELETE | Delete widget |
| `/api/workspaces/{slug}/dashboards/{dashboard_id}/widgets/{widget_id}/chart/` | GET | Fetch aggregated chart data |

### Access Control Pattern

- Creator can always access their own dashboards
- Public dashboards (access=1) visible to all workspace members
- Widget data scoped to dashboard's selected projects
- Workspace-level permission check (ADMIN + MEMBER only)

### Data Aggregation Pipeline

**DashboardWidgetChartEndpoint** implements multi-step aggregation:

1. **Base Query**: Filter Issues by workspace + dashboard projects
2. **Filter Whitelisting**: Apply strict filter mapping (no dynamic keys allowed)
   - Allowed: priority, assignees, labels, state, state_group, created_by
3. **Metric Selection**: Y-axis metric determines aggregation function
   - Static metrics: WORK_ITEM_COUNT, ESTIMATE_POINTS, PENDING_WORK_ITEMS, etc.
   - Date-based: WORK_ITEMS_DUE_TODAY, WORK_ITEMS_DUE_THIS_WEEK
4. **Grouping**: X-axis property determines group-by fields
5. **Secondary Grouping** (optional): GROUPED chart_model adds second dimension
6. **Aggregation**: Count/Sum based on metric
7. **JSON Normalization**: Return formatted data for chart rendering

Example flow for "Issues by State (grouped by Priority)":
- x_axis_property: "STATES"
- chart_model: "GROUPED"
- group_by: "PRIORITIES"
- Result: `[{name: "To Do", high: 5, medium: 3, low: 1}, ...]`

### Frontend Store Pattern

**DashboardStore** (MobX):
- `dashboards`: Array of dashboard objects
- `dashboardWidgets[dashboardId]`: Nested widgets per dashboard
- `widgetChartData[widgetId]`: Chart data cache
- Actions: CRUD on dashboards + widgets, fetch chart data

**Routes**:
- `/[workspaceSlug]/dashboards` - List page with create button
- `/[workspaceSlug]/dashboards/[dashboardId]` - Detail page with grid layout

**Widget Grid Layout**: Position metadata (x_axis_coord, y_axis_coord, width, height) drives responsive CSS grid on frontend.

### UI Component Structure

- **DashboardListPage**: Lists all dashboards (owned + public)
- **DashboardDetailPage**: Grid container for widgets
- **WidgetAdapter**: Maps widget.chart_type to propel/charts component
- **WidgetContextMenu**: Edit, delete, share actions
- **WidgetChartRenderer**: Displays chart data from API

### Performance Considerations

- **Query Optimization**: Prefetch projects + widgets on dashboard retrieve
- **Chart Data Caching**: Keyed by widget ID to prevent duplicate aggregations
- **Filter Whitelisting**: Prevents expensive/malicious queries
- **Pagination**: Dashboard list paginated; widget list fetched per dashboard
```

**Impact**: Adds 45 LOC to system-architecture.md (722 → 767 LOC, exceeds 800 LOC limit by 0, acceptable).

---

### 2. project-overview-pdr.md (241 LOC, healthy)

**Current State**:

- Line 59-64: Lists "Analytics" feature with dashboard references
- **Already documents dashboards at high level**

**Required Updates**:

#### Enhance Analytics Section (est. 8 LOC addition)

Current:

```markdown
### 6. Analytics

- Real-time dashboards (Pro feature)
- Custom analytics views with multiple chart types
- Trend visualization via charts (line, bar, pie, scatter)
- Dashboard favorites/pinning with unified UserFavorite system
- Multi-dashboard CRUD with widget configuration UI
- Export capabilities
```

Updated:

```markdown
### 6. Analytics & Dashboards

- **Multi-Dashboard Support**: Create unlimited dashboards per workspace, private or public sharing
- **Widget System**: 6 chart types (bar, line, area, donut, pie, number), configurable grid layout
- **Advanced Filtering**: Filter by priority, assignees, labels, state, state group, creator
- **Grouped Charts**: Secondary grouping dimension for complex visualizations
- **Data Aggregation**: Real-time Issue metrics (counts, estimates, completion status)
- **Favorites & Pinning**: Unified UserFavorite system for dashboard discovery
- **Creator-Based Access**: Dashboards visible to creator + workspace members (if public)
```

**Impact**: Adds 8 LOC (241 → 249 LOC, well within limit).

---

### 3. project-roadmap.md (435 LOC, ~365 LOC budget)

**Current State**:

- Line 53: Notes "✅ Analytics Dashboard Pro Feature (6 widget types, ...)"
- **Already documented as shipped**

**Required Updates**:

#### No changes needed to roadmap section; already marked as shipped

**Optional**: Add to "Next Release Notes" section if planning future dashboard enhancements:

```markdown
### Dashboard Roadmap (Potential Enhancements)

- Custom metric builder (no-code aggregation)
- Scheduled exports (email reports)
- Real-time data refresh (WebSocket updates)
- Dashboard templates (pre-built analytics)
- Cross-project dashboards (workspace-wide metrics)
```

**Impact**: 0 LOC required (already documented).

---

## Patterns Worth Documenting

### 1. **Creator-Based Access Control**

Pattern: `Q(created_by=request.user) | Q(access=1)`

**Use Cases**:

- Dashboards (creator-private OR public flag)
- Pages (similar pattern)
- Custom workflows (if added)

**Guideline**: Document in `code-standards.md` under "Permission Patterns" section for future features.

### 2. **Filter Whitelisting for Security**

Pattern: Strict mapping dict prevents dynamic filter injection

```python
filter_mapping = {
    "priority": "priority__in",
    "assignees": "assignees__id__in",
    ...
}
# Only apply if key in mapping
if rule_key in filter_mapping and rules:
    query_kwargs[filter_mapping[rule_key]] = rules
```

**Use Cases**:

- Complex aggregation endpoints
- User-provided filter parameters
- Chart/report generation

**Guideline**: Add to `code-standards.md` under "API Security Patterns".

### 3. **Grid Positioning Metadata**

Pattern: Store x, y, width, height in DB; let frontend render with CSS Grid

**Use Cases**:

- Dashboards (current)
- Kanban board lanes (future)
- Custom layout-driven UIs

**Guideline**: Document as "Layout-Driven Architecture" in system-architecture.md for future reference.

---

## Line Count Impact Summary

| Document                | Current LOC | Addition | Final    | Status             |
| ----------------------- | ----------- | -------- | -------- | ------------------ |
| system-architecture.md  | 722         | +45      | 767      | ✅ OK (limit: 800) |
| project-overview-pdr.md | 241         | +8       | 249      | ✅ OK (limit: 800) |
| project-roadmap.md      | 435         | 0        | 435      | ✅ Already shipped |
| **TOTAL**               | **1398**    | **+53**  | **1451** | ✅ OK              |

---

## Recommended Documentation Sequence

1. **Update system-architecture.md** first (highest priority, new subsystem)
2. **Update project-overview-pdr.md** second (enhancement to existing feature)
3. **Skip project-roadmap.md** (already documented as shipped)

---

## Questions & Decisions for Implementation

**Q1**: Should dashboard-related patterns (filter whitelisting, creator-based access) be extracted to `code-standards.md` as reusable guidelines?

**Answer**: **Yes, recommended**. These patterns apply to future features (custom workflows, advanced reporting). Update `code-standards.md` with a "Security & Access Control Patterns" section referencing dashboard implementation as example.

**Q2**: Should we document dashboard performance tuning (query optimization, caching strategy)?

**Answer**: **Not in this update**. Add to `deployment-guide.md` if/when dashboard becomes production bottleneck. For now, document in code comments.

**Q3**: Should we create separate `docs/dashboards/` subdirectory for detailed dashboard API docs?

**Answer**: **No, not yet**. Keeping dashboard docs in main system-architecture.md is sufficient for MVP. Revisit if dashboard becomes major feature (v1.3+).

---

## Files to Update

1. `/Volumes/Data/SHBVN/plane.so/docs/system-architecture.md` - Add 45 LOC Dashboard subsystem section
2. `/Volumes/Data/SHBVN/plane.so/docs/project-overview-pdr.md` - Enhance Analytics section (8 LOC)
3. `/Volumes/Data/SHBVN/plane.so/docs/code-standards.md` - Add "Security & Access Control Patterns" reference (optional, future task)

---

## Sign-Off

**Recommendation**: Proceed with documentation updates for system-architecture.md and project-overview-pdr.md. Dashboard feature introduces sufficient new patterns and architecture to warrant comprehensive documentation for future maintainers.

**Next Step**: Implement updates using provided section text above.
