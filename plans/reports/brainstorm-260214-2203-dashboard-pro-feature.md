# Brainstorm: Dashboard Pro Feature

## Problem Statement
Implement Plane Pro-equivalent dashboard feature as a separate section with full analytics chart capabilities (bar, line, area, donut, pie, number widgets), multi-dashboard support, project scoping, and configurable styling.

## Current State

### CE Home Page (exists)
- Basic utility widgets: quick_links, recents, stickies
- User-level preferences via `WorkspaceHomePreference` model
- Located at `/[workspaceSlug]/` root

### Analytics Module (exists, reusable)
- Backend: `AdvanceAnalyticsEndpoint` with chart builder (`build_analytics_chart()`)
- Grouping: 13 properties (state, priority, assignee, labels, cycles, modules, etc.)
- Metrics: work item count, estimate points
- Frontend: `InsightCard`, `InsightTable`, `PriorityChart`, axis selectors
- **Reusability Score: 9/10**

### Propel Chart Components (exists, ready)
- Bar, Line, Area, Pie (donut via innerRadius), Radar, Scatter, TreeMap
- Full TypeScript generics, responsive, interactive legends, custom tooltips
- Already used in analytics & profile pages

## Plane Pro Dashboard (target)

### Widget Types
| Type | Propel Base | Gap |
|---|---|---|
| Bar Chart | `@plane/propel/charts/bar-chart` | Config wrapper + data adapter |
| Line Chart | `@plane/propel/charts/line-chart` | Config wrapper + data adapter |
| Area Chart | `@plane/propel/charts/area-chart` | Config wrapper + data adapter |
| Donut Chart | `@plane/propel/charts/pie-chart` (innerRadius) | Config wrapper |
| Pie Chart | `@plane/propel/charts/pie-chart` | Config wrapper |
| Number | None | New simple component |

### Configuration Per Widget
- **Property**: group by work item type, priority, assignee, state, label, module, cycle
- **Metric**: work item count or estimate points
- **Color presets**: Modern, Horizon, Earthen
- **Style**: fill opacity, border, smoothing, data point markers
- **Display**: center value (donut/pie), legends, tooltips

### Dashboard-Level Features
- Multiple dashboards per workspace
- Project scoping per dashboard
- Edit/view mode toggle
- Dashboard CRUD

## Architecture Decision

### Backend: Extend Analytics Infrastructure
- Reuse `build_analytics_chart()` for aggregation
- Reuse `get_analytics_filters()` for filtering
- New models: `Dashboard`, `DashboardWidget`
- New endpoints: `/api/workspaces/{slug}/dashboards/`
- Return standardized `{ data, schema }` format

### Frontend: New Section
- New route: `/[workspaceSlug]/(projects)/dashboards/`
- Sidebar nav item via `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS`
- Dashboard store (MobX) for state management
- Widget components wrapping propel charts
- Grid layout for widget positioning

### Charting: Recharts via Propel
- Already installed (`recharts@^2.12.7` in apps/web)
- Wrap existing propel chart components
- Add color preset system
- Add widget config panel UI

## Implementation Considerations

### High Reusability
- Backend analytics utils: `build_chart.py`, `date_utils.py`
- Frontend: `parseChartData()`, `AnalyticsService`, chart components
- Types: `ChartXAxisProperty`, `ChartYAxisMetric` enums

### New Development Needed
1. Database models (Dashboard, DashboardWidget)
2. API endpoints (CRUD + widget data)
3. Dashboard list/detail pages
4. Widget configuration UI (type, property, metric, style)
5. Grid layout system for widget positioning
6. Color preset system (Modern, Horizon, Earthen)
7. Number widget component (new)
8. Dashboard store (MobX)

### Risks
- Performance: many widgets = many API calls; consider batch endpoints
- Layout: responsive grid for different screen sizes
- Permissions: who can create/edit/view dashboards
- Data freshness: caching strategy for widget data

## Success Metrics
- All 6 widget types functional
- Multi-dashboard CRUD working
- Project scoping per dashboard
- Color preset & style customization
- Edit/view mode toggle
- Sidebar navigation integration

## Next Steps
Create detailed phased implementation plan.
