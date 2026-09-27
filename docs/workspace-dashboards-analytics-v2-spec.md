# Workspace Dashboard + Analytics V2 — Product & Implementation Spec

Status: **Historical V3 product specification; Analytics V2 contract reference**

Implementation status: **Historical implementation notes below must be verified against current source.**

Target branch: `master`  
Scope: Community Edition fork  
Supersedes: the previous multi-dashboard / dashboard-builder design in this file  
Decision date: 2026-09-26

> **Product direction rewritten 2026-09-27:** [Team Operations Overview spec](superpowers/specs/2026-09-27-workspace-dashboard-redesign.md) is the new review draft for Dashboard UX, layout, metrics, filters, deep views and delivery gates. It supersedes the fixed 12/13/14-card product direction below. Existing Analytics V2 contracts remain the compatibility baseline, with explicit extensions identified in the new spec. The redesign is not implemented or approved merely by this notice.

> **Important implementation rule:** this document intentionally resets the Dashboard product direction. Existing Analytics V2 query logic, ACL logic, drill-down, batch-query plumbing, reusable chart renderers, matrix/table renderers, CSV helpers, and related tests are valuable assets and MUST NOT be deleted merely because the dashboard-builder product surface is being removed.

---

## 1. Executive decision

The fork will NOT ship a general-purpose user-created dashboard builder in the current phase.

Instead:

- every workspace has exactly **one built-in Workspace Dashboard**;
- the dashboard has a **product-defined layout and product-defined set of cards**;
- users do not create, delete, duplicate, share, favorite, drag, resize, or manually compose dashboards;
- users customize **how the built-in cards calculate and group data** through controlled UI parameters derived from Customized Insights / Analytics V2;
- the dashboard always respects the current viewer's workspace/project ACL;
- Analytics remains the ad-hoc exploration surface;
- Dashboard becomes the operational overview surface;
- all data still comes from the same Analytics V2 engine;
- reusable query and rendering infrastructure remains intentionally extensible so richer dashboard composition can be introduced later without rebuilding the analytics stack.

The governing product rule is:

> **Dashboard composition is fixed. Query configuration is flexible.**

And the governing architecture rule is:

> **Dashboard is a presentation of Analytics V2, not a separate analytics system and not a user-authored content resource.**

---

## 2. Why the previous direction is being replaced

The previous spec drove implementation toward a mini-BI/dashboard-builder product with:

- multiple dashboards per workspace;
- dashboard list pages;
- All / Mine / Shared / Favorites tabs;
- dashboard ownership and visibility;
- dashboard member sharing;
- dashboard duplication;
- dashboard favorites;
- widget CRUD;
- add-widget flows;
- markdown widgets;
- a 12-column editable layout;
- drag/resize persistence;
- view/edit modes;
- source-project persistence per dashboard;
- dashboard-level mutation APIs.

That model introduces significant complexity in:

- permissions;
- UX discoverability;
- persistence;
- sharing semantics;
- ACL validation;
- mobile layout;
- migration compatibility;
- testing surface;
- support burden;
- future upstream merge conflicts.

It also exceeds the actual product need.

The desired behavior is much simpler:

1. A leader enters a workspace.
2. Dashboard is already useful without setup.
3. It contains a complete, opinionated set of management charts and indicators.
4. The leader changes time range, project/member/label scope, metric, grouping, breakdown, normalization, allocation, or visualization when needed.
5. The dashboard immediately recalculates using the same Analytics V2 engine.

The user should never need to understand concepts such as dashboard ownership, widget placement, grid sizing, or dashboard sharing just to obtain a useful management view.

---

## 3. Product boundaries

### 3.1 In scope now

- one Workspace Dashboard per workspace;
- workspace sidebar entry;
- fixed dashboard composition;
- global filters;
- global time range;
- global date basis;
- configurable card query parameters;
- reusable chart rendering;
- Analytics V2 batch execution;
- percentage / normalization / allocation semantics;
- drill-down to work items;
- CSV export where already supported;
- ACL-safe aggregation;
- per-user dashboard preferences;
- responsive fixed layout;
- safe migration away from the dashboard-builder UI/API.

### 3.2 Explicitly out of scope now

Do NOT implement or preserve as active user-facing behavior:

- create dashboard;
- delete dashboard;
- rename dashboard;
- duplicate dashboard;
- dashboard owner;
- private vs workspace dashboard visibility;
- dashboard member sharing;
- dashboard favorites;
- dashboard list/tabs;
- public dashboard publishing;
- add widget;
- delete widget;
- arbitrary widget library;
- markdown widgets;
- drag layout;
- resize layout;
- manual layout persistence;
- edit/view modes for layout;
- dashboard templates as user-selectable compositions;
- Save Customized Insight to arbitrary dashboard.

### 3.3 Future expansion is allowed

The architecture MUST leave clean extension seams for future features such as:

- optional dashboard variants;
- role/team presets;
- admin-defined templates;
- controlled card visibility;
- custom additional cards;
- multiple dashboards;
- saved management views;
- published dashboards.

However, future extensibility is achieved by preserving **generic analytics/query/render capabilities**, not by keeping the current dashboard-builder product active.

Do not keep incorrect product complexity merely because it might be useful someday.

---

## 4. User-facing information architecture

Workspace navigation:

~~~text
Workspace
├── Projects
├── Cycles
├── Modules
├── Dashboard
├── Analytics
├── Wiki
└── ...
~~~

Semantics:

- **Dashboard** = monitor and understand workspace health quickly.
- **Analytics** = explore and investigate data interactively.

### 4.1 Route

Canonical route:

~~~text
/:workspaceSlug/dashboard
~~~

If keeping the existing plural route reduces migration risk, this is acceptable temporarily:

~~~text
/:workspaceSlug/dashboards
~~~

but it MUST directly render the single Workspace Dashboard and MUST NOT render a dashboard list.

Any legacy route of the form:

~~~text
/:workspaceSlug/dashboards/:dashboardId
~~~

must be removed from navigation and eventually removed entirely.

### 4.2 No empty state requiring setup

A workspace with accessible projects/work items should always render a meaningful dashboard immediately.

There must be no first-run screen saying:

- Create dashboard;
- Add widget;
- Choose template;
- Start from blank.

If there is no data, show a normal data-empty state, not a configuration-empty state.

---

## 5. Product model

The dashboard is a built-in system projection.

Conceptually:

~~~text
Workspace
   +
Viewer ACL
   +
Built-in Dashboard Definition
   +
Global Dashboard State
   +
Per-user Preferences
   =
Rendered Workspace Dashboard
~~~

A workspace does not need a persisted `Dashboard` row in order for its dashboard to exist.

The dashboard exists because the workspace exists.

### 5.1 Built-in dashboard definition

The built-in definition is code/configuration owned by the product and versioned in source control.

Each card definition contains stable metadata such as:

~~~ts
{
  id: "workload_by_assignee",
  section: "workload",
  title: "Workload by assignee",
  renderer: "bar",
  allowedRenderers: ["bar", "matrix", "table"],
  defaults: {
    metric: "work_item_count",
    dimension: "assignee",
    breakdown: "project",
    display: "value_and_percentage",
    normalization: "grand_total",
    allocation: "split_equal"
  },
  controls: [
    "metric",
    "dimension",
    "breakdown",
    "display",
    "normalization",
    "allocation",
    "renderer"
  ]
}
~~~

Stable card IDs are important because preferences should attach to logical cards rather than layout coordinates or database widget IDs.

### 5.2 Fixed composition does not mean hard-coded data logic

The card list/layout is fixed, but each card is still powered by a generic Analytics V2 query.

Do not implement card-specific SQL or client-side aggregation when Analytics V2 can express the same result.

---

## 6. Dashboard layout

The dashboard should be complete but scannable.

Recommended desktop composition:

~~~text
┌──────────────────────────────────────────────────────────────┐
│ Global controls                                              │
├───────────┬───────────┬───────────┬───────────┬──────────────┤
│ Open      │ In prog.  │ Completed │ Overdue   │ Blocked      │
├──────────────────────────────┬───────────────────────────────┤
│ Created vs completed trend   │ Work state distribution       │
├──────────────────────────────┼───────────────────────────────┤
│ Workload by assignee         │ Priority distribution         │
├──────────────────────────────┴───────────────────────────────┤
│ Workload allocation matrix                                  │
├──────────────────────────────┬───────────────────────────────┤
│ Work by project              │ Attention required            │
└──────────────────────────────┴───────────────────────────────┘
~~~

Exact visual proportions may change with responsive design, but users do not manually drag or resize cards.

### 6.1 Mobile / narrow layout

- stack cards deterministically;
- KPI cards may wrap into 2 columns or horizontal scroll if consistent with Plane UI;
- charts must remain readable;
- controls may collapse into a filter drawer;
- no drag/resize affordance;
- no desktop layout coordinates need persistence.

---

## 7. Default card set

P0 dashboard should ship with the following cards.

### 7.1 KPI cards

#### A. Open work items

Purpose: current outstanding scope visible to the viewer.

Default semantics:

- source: `work_items`;
- metric: pending/open work-item count;
- current-state metric;
- respects global project/member/label/module/cycle filters;
- selected time range only affects the card if the chosen time basis/metric semantics require it; do not silently reinterpret current state as created-in-period.

#### B. In progress

- current-state in-progress work items.

#### C. Completed

Default:

- completed work items in selected time range;
- default date basis: completed date for this card unless a compatible global override is selected.

#### D. Overdue

- incomplete work items whose due/target date is before today in workspace timezone.

#### E. Blocked

- current blocked work items using the same blocked semantics defined by Analytics V2.

### 7.2 Delivery section

#### F. Created vs completed trend

Default:

- visualization: line or grouped bar;
- time bucket derived from selected range;
- series: created vs completed;
- grouping auto-resolution:
  - <= 31 days: day;
  - <= 120 days: week;
  - longer: month;
- user may override grouping when supported.

This card answers whether demand is arriving faster than the team is closing work.

#### G. Work state distribution

Default:

- metric: work-item count;
- dimension: state group or state;
- visualization: donut/bar;
- display: value + percentage.

### 7.3 Workload section

#### H. Workload by assignee

Default:

- metric: work-item count;
- dimension: assignee;
- breakdown: none or project depending on available horizontal space;
- display: value + percentage;
- allocation: `split_equal` for multi-assignee work items;
- visualization: horizontal bar.

Allowed metrics should include at minimum:

- work-item count;
- estimate points;
- allocated work-item count;
- allocated estimate points when supported;
- logged time later when Time Tracking data is available.

#### I. Workload allocation matrix

This is a first-class management card and must cover both multi-project and mono-project teams.

Default multi-project workspace configuration:

~~~text
Metric:      Work item count
Rows:        Assignee
Columns:     Project
Display:     Value + percentage
Normalize:   Series/group/grand total selectable
Allocation:  Split equally
Renderer:    Matrix table
~~~

Mono-project teams that use labels as products can change:

~~~text
Columns: Label
~~~

Expected use cases:

1. **Share of each product/project by assignee**
   - rows: Assignee
   - columns: Project or Label
   - normalize within Project/Label.

2. **Share of each person's workload by product/project**
   - rows: Assignee
   - columns: Project or Label
   - normalize within Assignee.

3. Same analysis using estimate points instead of count.

This card is the primary replacement for manually created workload dashboards.

### 7.4 Distribution section

#### J. Priority distribution

Default:

- metric: work-item count;
- dimension: priority;
- display: value + percentage;
- visualization: bar/donut.

#### K. Work by project

Default:

- metric: work-item count;
- dimension: project;
- display: value + percentage;
- visualization: bar.

In a mono-project workspace this card may automatically use another useful dimension such as module or label, but automatic substitution must be explicit and testable. P0 may simply show the single project instead of inventing dynamic behavior.

### 7.5 Attention section

#### L. Attention required

A work-item table, not an aggregate-only chart.

Default categories should surface useful risk items such as:

- overdue;
- blocked;
- urgent/high priority and unassigned;
- due soon.

Do not create undocumented "AI risk" scoring.

P0 can use deterministic filters only.

---

## 8. Global dashboard controls

Header/global control row:

~~~text
Dashboard
[Time range] [Date basis] [Projects] [Members] [States] [Priority]
[Labels] [Cycles] [Modules]                              [Reset]
~~~

Controls should follow Plane's existing filter UI patterns.

### 8.1 Time range

Support at minimum:

- Today;
- Yesterday;
- This week;
- Last week;
- Last 7 days;
- Last 30 days;
- This month;
- Last month;
- This quarter;
- Last quarter;
- Last 90 days;
- This year;
- Custom range.

Workspace timezone is authoritative for calendar boundaries.

### 8.2 Date basis

Supported bases should remain aligned with Analytics V2:

- created;
- completed;
- start;
- due/target;
- lifecycle overlap where supported.

A card may declare a stronger semantic default when the metric requires it, e.g. Completed naturally uses completed date.

The UI must avoid producing nonsensical combinations. If a global date basis is incompatible with a card's metric semantics, the card uses its defined semantic basis and should expose that fact in metadata/tooltip rather than returning an incorrect number.

### 8.3 Scope filters

Global filters are viewer-scoped and may include:

- projects;
- members/assignees;
- states/state groups;
- priorities;
- labels;
- cycles;
- modules;
- work item types when available.

All filter option lists MUST themselves respect ACL.

### 8.4 Reset

Reset returns global controls and all card preferences to product defaults for that user.

If reset-all feels too destructive, the UI may expose:

- Reset filters;
- Reset this card;
- Reset dashboard preferences.

But the underlying preference semantics must support a full reset.

---

## 9. Per-card configuration

Cards expose a controlled `Configure` menu/drawer.

The dashboard is NOT a free-form query builder. Each card explicitly declares which parameters are configurable.

Reusable controls should come from Customized Insights / Analytics V2 whenever possible.

Candidate controls:

- Metric / Calculate;
- Dimension / Group by;
- Breakdown;
- Display;
- Normalize;
- Allocation;
- Date grouping;
- Visualization;
- Sort / Top N where needed.

### 9.1 Metric

Examples:

- work-item count;
- estimate points;
- pending;
- completed;
- in progress;
- overdue;
- blocked;
- allocated count;
- allocated estimate points.

### 9.2 Dimension

Examples:

- project;
- assignee;
- state;
- state group;
- priority;
- label;
- cycle;
- module;
- created by;
- work item type;
- date dimensions.

### 9.3 Breakdown

A second dimension/series.

P0 supports at most two dimensions in the generic UI.

Do not expose arbitrary OLAP complexity.

### 9.4 Display

- Value;
- Percentage;
- Value + Percentage.

### 9.5 Normalization

Preserve Analytics V2 normalization semantics.

At minimum:

- none;
- group/row total;
- series/column total;
- grand total.

Names shown in UI should be understandable in the context of the current visualization.

### 9.6 Allocation

Preserve generic allocation semantics:

- full credit;
- split equally.

This is essential for accurate workload analysis when a work item has multiple assignees/labels/etc.

### 9.7 Visualization

Only expose renderers compatible with the card/query shape.

Potential renderers:

- number;
- statistics/counter;
- gauge;
- bar;
- line;
- pie;
- donut;
- matrix;
- table/work-item table.

Do not allow a renderer that cannot truthfully represent the selected dimensions/metrics.

---

## 10. Analytics V2 remains the canonical query engine

This requirement is non-negotiable.

Architecture:

~~~text
Plane data
   |
   v
Viewer ACL scope
   |
   v
Analytics Engine V2
   |\
   | \
   |  +--> Workspace Dashboard
   |
   +-----> Customized Insights
   |
   +-----> CSV / drill-down / API / plane-cli / agents
~~~

### 10.1 Do not duplicate analytics logic in Dashboard

Dashboard code may:

- construct queries;
- combine global and card-local query configuration;
- batch requests;
- choose renderers;
- display results.

Dashboard code must NOT independently implement:

- metric calculations;
- ACL filtering;
- multi-membership allocation;
- percentage normalization;
- date bucketing;
- project permission filtering;
- aggregate totals.

### 10.2 Canonical query schema

Continue using a versioned Analytics V2 query shape such as:

~~~json
{
  "version": 1,
  "source": "work_items",
  "project_ids": [],
  "metrics": [{ "key": "work_item_count" }],
  "dimensions": [
    { "key": "assignee" },
    { "key": "project" }
  ],
  "filters": {},
  "time": {
    "preset": "this_quarter",
    "basis": "lifecycle_overlap"
  },
  "display": "value_and_percentage",
  "normalization": "grand_total",
  "allocation": "split_equal"
}
~~~

Persist/query configuration, never materialized result snapshots.

---

## 11. Generic batch query API

The current dashboard batch-query implementation is useful and should be preserved conceptually, but it must be generalized out of dashboard-instance CRUD.

Target endpoint:

~~~text
POST /api/workspaces/{slug}/analytics/v2/batch/
~~~

Conceptual request:

~~~json
{
  "queries": [
    {
      "id": "open_work_items",
      "query": { "...": "AnalyticsQueryV2" }
    },
    {
      "id": "workload_by_assignee",
      "query": { "...": "AnalyticsQueryV2" }
    },
    {
      "id": "workload_matrix",
      "query": { "...": "AnalyticsQueryV2" }
    }
  ]
}
~~~

Conceptual response:

~~~json
{
  "results": {
    "open_work_items": {
      "status": "ok",
      "data": {}
    },
    "workload_by_assignee": {
      "status": "ok",
      "data": {}
    },
    "workload_matrix": {
      "status": "error",
      "error": {
        "code": "QUERY_LIMIT_EXCEEDED",
        "message": "..."
      }
    }
  }
}
~~~

Requirements:

- one failing query must not fail all cards;
- query/work budgets remain enforced;
- ACL is applied separately and correctly to every query;
- results are keyed by stable client-provided card/query ID;
- response order is not semantically significant;
- batching must not bypass existing query validation;
- batch behavior should be reusable by future dashboard composition features.

### 11.1 Migration from current dashboard data endpoint

Do NOT delete existing batch/query composition code before the generic endpoint is working and covered by tests.

Recommended sequence:

1. Extract generic batch execution helper from dashboard-specific endpoint.
2. Add `/analytics/v2/batch/` using the helper.
3. Move Workspace Dashboard to the generic endpoint.
4. Verify result parity.
5. Remove the dashboard-ID-dependent data endpoint only after no active code depends on it.

---

## 12. Renderer architecture

Existing renderer work is valuable and MUST be retained where generic.

The target layering is:

~~~text
Analytics query result
       |
       v
Generic analytics presentation model
       |
       +--> Number
       +--> Gauge / statistics
       +--> Bar
       +--> Line
       +--> Pie / donut
       +--> Matrix
       +--> Aggregate table
       +--> Work-item table
~~~

Dashboard cards call these generic renderers.

Customized Insights may call the same renderers.

Future saved/custom dashboards may call the same renderers.

### 12.1 Namespace cleanup

If reusable renderers currently live under dashboard-specific paths such as:

~~~text
components/dashboards/widgets/*
~~~

prefer moving or re-exporting them into a generic analytics presentation namespace rather than deleting them.

For example:

~~~text
components/analytics/v2/renderers/*
components/analytics/v2/matrix/*
components/analytics/v2/export/*
~~~

Exact paths may follow repository conventions.

### 12.2 Keep renderer capabilities

Preserve, where already implemented and correct:

- number/counter/statistics;
- gauge;
- bar;
- line;
- pie;
- donut;
- matrix table;
- work-item table;
- truncation warning display;
- CSV serialization/export helpers;
- dimension value resolution;
- click/drill-down hooks;
- value + percentage formatting.

---

## 13. Drill-down

Aggregates must remain explainable.

Where a chart/matrix cell corresponds to a deterministic work-item set, clicking it should open a work-item drill-down drawer.

The drill-down request must use:

- the same source query;
- the same global filters;
- the same card-local filters;
- the selected dimension value(s);
- the same ACL-scoped backend path.

No client-side approximation of the underlying item set.

Known date-bucket drill-down limitations should remain tracked separately rather than blocking categorical drill-down.

---

## 14. ACL and security contract

ACL filtering happens BEFORE all observable aggregation.

This applies to:

- counts;
- sums;
- percentages;
- normalization denominators;
- matrix totals;
- date series;
- comparison values;
- filter facets;
- dimension labels;
- drill-down;
- CSV export;
- batch results;
- card metadata derived from query results.

A hidden private project must contribute zero observable information to an unauthorized viewer.

### 14.1 Dashboard has no separate sharing ACL in P0

Because the dashboard is a built-in workspace view, its visibility follows normal workspace access.

Data visibility follows the viewer's existing Plane workspace/project ACL.

There is no separate:

- dashboard owner;
- dashboard viewer;
- dashboard editor;
- dashboard member-sharing layer.

This deliberately removes a large class of authorization problems from the P0 product.

### 14.2 Preserve Analytics V2 security work

Do not weaken existing protections such as:

- ACL-scoped base issue queryset;
- project scope intersection;
- registry validation of metrics/dimensions;
- allowlisted structured filters;
- query/group/work budgets;
- fail-closed behavior where applicable.

---

## 15. User preference persistence

Users may customize how the built-in dashboard appears without mutating a shared workspace dashboard object.

Preference identity:

~~~text
(workspace, user)
~~~

Conceptual preference payload:

~~~json
{
  "schema_version": 1,
  "global": {
    "time": { "preset": "this_quarter" },
    "date_basis": "lifecycle_overlap",
    "project_ids": [],
    "filters": {}
  },
  "cards": {
    "workload_by_assignee": {
      "metric": "estimate_points",
      "dimension": "assignee",
      "breakdown": "project",
      "display": "value_and_percentage",
      "normalization": "grand_total",
      "allocation": "split_equal",
      "renderer": "bar"
    },
    "workload_matrix": {
      "dimension": "assignee",
      "breakdown": "label",
      "normalization": "series_total"
    }
  }
}
~~~

### 15.1 P0 persistence choice

Preferred:

- reuse an existing Plane per-user/per-workspace preference mechanism if one exists and is appropriate.

Acceptable temporary fallback:

- localStorage, if server-side preference storage would materially delay the product reset.

But the preference API/data shape should be designed so moving from localStorage to server persistence does not require changing card IDs or query semantics.

### 15.2 No shared mutable dashboard state

One user's changes to:

- metric;
- grouping;
- visualization;
- filters;
- time range;

must not unexpectedly reconfigure the dashboard for other users.

### 15.3 Reset/versioning

Preferences require:

- `schema_version`;
- safe ignore of unknown card IDs;
- fallback to product defaults when a card definition changes;
- reset-to-default support.

---

## 16. Current implementation audit — KEEP / EXTRACT / REMOVE

This section is an implementation contract, not a suggestion.

### 16.1 KEEP — backend analytics engine

Preserve the current Analytics V2 capabilities and tests, including equivalent code responsible for:

- canonical query validation;
- metric registry;
- dimension registry;
- time scope resolution;
- date grouping;
- normalization;
- allocation;
- ACL project scoping;
- structured filters;
- PQL integration where already supported;
- aggregate execution;
- warning/truncation handling;
- drill-down;
- serializers/response metadata;
- query budgets/work caps.

These are foundational assets for Dashboard, Analytics, CLI, and future agents.

### 16.2 KEEP — frontend analytics/query primitives

Preserve/reuse equivalent code for:

- Customized Insights V2 query building;
- legacy-to-V2 mappings where still needed;
- cells -> chart/table presentation mapping;
- percentage/value formatting;
- drill-down selection mapping;
- UUID/dimension label resolution;
- analytics controls for Metric/Dimension/Breakdown/Display/Normalize/Allocation/Date grouping.

### 16.3 KEEP or EXTRACT — chart/render infrastructure

Do not delete generic implementations merely because they were introduced under Dashboard.

Keep or extract:

- number/stat renderer;
- gauge renderer;
- bar renderer;
- line renderer;
- pie renderer;
- donut renderer;
- matrix model + renderer;
- aggregate table renderer;
- work-item table renderer;
- CSV helpers;
- truncation warning UI;
- chart click hooks;
- drill-down drawer integration;
- analytics response parsing.

### 16.4 KEEP or EXTRACT — batch/query composition plumbing

Preserve useful backend behavior such as:

- composing a base/global query with a card-local query;
- resolving dynamic viewer tokens if still required;
- partial failure per query;
- executing multiple analytics queries efficiently;
- reusing the Analytics V2 engine rather than client-side aggregation.

Move these capabilities to a generic analytics layer where possible.

### 16.5 REMOVE from product surface

Remove UI/features for:

- dashboard list;
- Mine/Shared/Favorites tabs;
- create dashboard;
- dashboard card/list item;
- dashboard rename;
- dashboard duplicate;
- dashboard favorite;
- dashboard share/members;
- owner/visibility UI;
- edit/view mode;
- add widget;
- markdown widget;
- widget deletion;
- widget library;
- drag/resize;
- 12-column editable grid;
- layout persistence controls;
- manual source-project persistence belonging to a dashboard instance.

### 16.6 REMOVE or deprecate — builder-specific API surface

After the fixed Workspace Dashboard no longer depends on them, remove/deprecate APIs equivalent to:

~~~text
GET/POST    /workspaces/{slug}/dashboards/
GET/PATCH   /workspaces/{slug}/dashboards/{id}/
DELETE      /workspaces/{slug}/dashboards/{id}/
POST        /workspaces/{slug}/dashboards/{id}/duplicate/
POST/DELETE /workspaces/{slug}/dashboards/{id}/favorite/
GET/POST    /workspaces/{slug}/dashboards/{id}/members/
GET/POST    /workspaces/{slug}/dashboards/{id}/widgets/
PATCH/DELETE /workspaces/{slug}/dashboards/{id}/widgets/{widgetId}/
PATCH       /workspaces/{slug}/dashboards/{id}/layout/
~~~

Do not remove the old batch/data endpoint until equivalent generic Analytics V2 batch execution has landed and the new Dashboard has migrated to it.

### 16.7 Builder data models

Models created solely for the previous builder design include concepts equivalent to:

- `Dashboard`;
- `DashboardProject`;
- `DashboardWidget`;
- `DashboardMemberAccess`;
- `DashboardFavorite`.

These models are NOT required by the target P0 product.

However, schema removal should happen only after code migration is complete.

Do not modify historical migrations in place on a branch already used by deployments.

Use a forward migration when removal is safe.

---

## 17. Safe implementation sequence

The cleanup must be staged so reusable work is not lost and staging/production migrations remain sane.

### Phase A — Freeze the old builder product

1. Treat this spec as authoritative.
2. Stop adding features to the old dashboard list/grid/sharing model.
3. Keep current feature flag fail-closed until the fixed dashboard is ready.
4. Add tests where necessary to pin reusable Analytics V2 behavior before refactoring.

### Phase B — Extract reusable analytics presentation infrastructure

1. Identify dashboard-specific renderer files that are generic.
2. Move/re-export them under Analytics V2/shared presentation namespace.
3. Keep behavior and tests equivalent.
4. Extract generic batch execution from dashboard-ID-specific APIs.
5. Add `/analytics/v2/batch/`.

Acceptance gate:

- Analytics V2 query tests pass;
- renderer tests pass;
- batch result parity verified;
- drill-down/CSV behavior remains intact.

### Phase C — Build fixed Workspace Dashboard

1. Add single workspace route.
2. Implement product-defined card registry.
3. Implement fixed responsive layout.
4. Implement global filters.
5. Implement card configuration controls.
6. Build batched query requests from card definitions + preferences.
7. Reuse generic renderers.
8. Implement per-user preference persistence.
9. Add reset behavior.

### Phase D — Remove old builder UI

Delete/deactivate:

- dashboard list;
- create flow;
- tabs/favorites;
- edit mode;
- grid drag/resize;
- widget CRUD UI;
- share/owner/visibility UI;
- Save to dashboard from Customized Insights.

### Phase E — Remove old builder APIs/models

Only after no active UI/service depends on them:

1. remove dashboard CRUD/sharing/favorite/layout/widget endpoints;
2. remove obsolete services/types;
3. create a forward migration dropping builder-only tables if confirmed unused;
4. retain generic analytics batch/query/render code;
5. retain migration compatibility for existing deployed databases.

### Phase F — cleanup documentation/tests

1. remove stale builder-specific i18n;
2. remove stale feature descriptions;
3. update operator env docs;
4. update tests to target fixed-dashboard behavior;
5. keep regression coverage for Analytics V2.

---

## 18. Customized Insights relationship

Customized Insights remains the ad-hoc analysis tool.

It should continue to expose the richer query controls and share query semantics/renderers with Dashboard.

### 18.1 Remove Save to dashboard for P0

The previous flow:

~~~text
Customized Insight
  -> Save to dashboard
  -> choose dashboard
  -> choose widget title/type
  -> create widget
~~~

belongs to the old dashboard-builder model and should be removed from the active UI.

### 18.2 Possible future controlled integration

A future feature may allow something like:

~~~text
Apply this configuration to:
[Workload by assignee]
~~~

or:

~~~text
Save as personal analytics preset
~~~

but it must not be implemented until there is a clear product need.

---

## 19. Query semantics that must remain explicit

### 19.1 Work-item count is not time spent

Do not label task duration or age as workload.

Workload can be represented by:

- count;
- allocated count;
- estimate points;
- allocated estimate points;
- logged time when available.

### 19.2 Multi-membership allocation

If one work item belongs to multiple assignees/labels/etc., full-credit grouping can inflate totals.

Keep explicit allocation behavior:

- `full_credit`;
- `split_equal`.

Display warnings/metadata where totals may appear counter-intuitive.

### 19.3 Percentages require an explicit denominator

Percentage without denominator semantics is invalid.

Normalization must explicitly define whether percentage is relative to:

- row/group total;
- column/series total;
- grand total.

### 19.4 Current-state vs event metrics

Do not apply identical date semantics blindly to:

- current-state metrics;
- created/completed event metrics;
- interval metrics.

The backend remains authoritative for metric semantics.

---

## 20. Performance requirements

Dashboard should not trigger one uncontrolled request per card when a batch request can serve the same purpose.

Requirements:

- use generic Analytics V2 batch endpoint for aggregate cards;
- partial failure per card;
- reasonable query/work budgets;
- do not fetch inaccessible projects then filter client-side;
- avoid duplicate identical queries within a single render;
- stable cache keys based on query payload + workspace/viewer context;
- changing one local card preference should ideally only invalidate the affected query/card when practical;
- changing global scope invalidates affected cards consistently.

P0 does not require materialized analytics cubes.

Use current database query engine and optimize only with evidence from real workloads.

---

## 21. API consumers / plane-cli / agents

Analytics V2 should remain usable without the Dashboard UI.

The generic APIs should support future consumers such as:

- `plane-cli`;
- scheduled digest jobs;
- management agents;
- reporting/export tooling.

Do not require consumers to create fake dashboard/widget database objects just to execute analytics queries.

This is another reason the generic batch API belongs under Analytics rather than Dashboard CRUD.

---

## 22. Feature flag behavior

Retain a workspace-dashboard feature flag while migration/refactor is in progress.

Expected behavior:

- flag off: Dashboard navigation and route unavailable/fail-closed;
- flag on: fixed Workspace Dashboard shown;
- no fallback to old dashboard builder once the new dashboard is active.

The flag should gate the product surface, not the generic Analytics V2 engine if other features depend on that engine.

---

## 23. Migration / compatibility rules

### 23.1 Do not rewrite historical migrations

If dashboard models already shipped in migration `0134` or equivalent, do not edit that migration in place for deployed environments.

### 23.2 Forward cleanup migration

Only after all runtime references are removed, add a forward migration to drop builder-only tables if the team confirms they are not needed.

### 23.3 Existing dashboard data

The previous builder was not the desired production product. There is no requirement to preserve user-authored dashboard composition as first-class migrated content unless real production data is discovered.

Before dropping tables:

- verify whether any production instance contains meaningful dashboard rows;
- if yes, export/backup them before removal;
- do not attempt a complex automatic transformation into the fixed dashboard unless there is an actual business requirement.

### 23.4 Preference migration

Do not convert old dashboard widget layouts into user preferences.

New preferences start from product defaults.

---

## 24. Testing requirements

### 24.1 Analytics regression

Must continue passing:

- metric calculations;
- dimension grouping;
- percentage normalization;
- split-equal allocation;
- date grouping incl. quarter;
- ACL scoping;
- query work caps;
- drill-down;
- CSV serialization where applicable.

### 24.2 Dashboard product tests

Cover at minimum:

1. Workspace has one dashboard route and no dashboard list.
2. No create-dashboard UI.
3. No add-widget UI.
4. No drag/resize/edit-layout mode.
5. Default cards render.
6. Global time range updates relevant queries.
7. Project filter updates all relevant card queries.
8. Card Metric change updates only that card configuration.
9. Card Group by / Breakdown changes generate valid Analytics V2 queries.
10. Display percentage uses correct normalization.
11. Split-equal allocation remains correct.
12. Matrix supports Assignee x Project.
13. Matrix supports Assignee x Label.
14. Viewer cannot observe hidden-project contribution in any total/percentage.
15. One failed batch query does not blank the entire dashboard.
16. Drill-down rows match aggregate selection.
17. User preferences are isolated per user.
18. Reset restores product defaults.
19. Unknown/stale preference card IDs do not break rendering.
20. Narrow viewport stacks cards deterministically.

### 24.3 Security tests

At minimum:

- non-workspace user denied;
- Guest/member semantics follow normal Plane workspace/project ACL for reading analytics;
- hidden private project contributes no aggregates;
- hidden project names/IDs do not appear in facets/metadata;
- batch endpoint cannot bypass ACL;
- drill-down cannot widen scope;
- CSV cannot widen scope;
- invalid metrics/dimensions rejected;
- expensive/bad queries remain bounded.

---

## 25. Acceptance criteria — product

P0 is accepted only when all of the following are true:

- [ ] Each workspace exposes one built-in Dashboard.
- [ ] User does not need to create or configure a dashboard before seeing useful data.
- [ ] Dashboard contains the complete default card set or an explicitly approved equivalent.
- [ ] There is no dashboard list / Mine / Shared / Favorites UX.
- [ ] There is no user-facing create/duplicate/share/favorite dashboard flow.
- [ ] There is no drag/resize/edit-grid UI.
- [ ] There is no arbitrary add/delete widget UX.
- [ ] Global time range works.
- [ ] Global project/filter scope works.
- [ ] Cards expose controlled query configuration.
- [ ] Workload by assignee works by count and estimate points.
- [ ] Assignee x Project matrix works.
- [ ] Assignee x Label matrix works for mono-project/product-label teams.
- [ ] Value / percentage / value+percentage display works.
- [ ] Normalization semantics are correct and explicit.
- [ ] Split-equal allocation works.
- [ ] Drill-down works for supported categorical aggregates.
- [ ] ACL is applied before aggregation.
- [ ] One user's preferences do not mutate another user's dashboard.
- [ ] Dashboard uses Analytics V2, not a parallel aggregation engine.

---

## 26. Acceptance criteria — implementation cleanup

- [ ] Existing Analytics V2 backend engine is preserved.
- [ ] Generic chart/render code introduced by the previous Dashboard phase is preserved/extracted, not discarded.
- [ ] Matrix/CSV/truncation/drill-down helpers remain reusable.
- [ ] Generic batch execution exists under Analytics V2 before dashboard-specific data endpoint is removed.
- [ ] Builder UI is removed from active routes.
- [ ] Builder-specific CRUD/sharing/favorite/layout APIs are removed only after all consumers migrate.
- [ ] Historical migrations are not edited destructively.
- [ ] Builder-only tables are dropped only through a safe forward migration and only after confirming no required production data.
- [ ] Stale old-spec tests are replaced with tests matching this spec.
- [ ] Documentation no longer instructs developers to implement a general dashboard builder for P0.

---

## 27. Future extension contract

Future dashboard expansion should build on these preserved layers:

~~~text
Analytics Engine V2
        |
        +-- Query schema / metrics / dimensions / ACL
        |
        +-- Batch execution
        |
        +-- Drill-down / export
        |
        +-- Generic renderer library
        |
        +-- Dashboard card definition schema
                 |
                 +-- Built-in fixed Workspace Dashboard (P0)
                 +-- Admin presets (future)
                 +-- Optional custom cards (future)
                 +-- Multiple dashboards (future, only if justified)
~~~

If multiple dashboards are reintroduced later, they should compose these stable abstractions rather than reimplementing query/render logic.

Do not pre-build ownership/sharing/layout complexity until the corresponding product requirement exists.

---

## 28. Implementation guidance for agents

Agents implementing this spec MUST classify every touched dashboard-related file as one of:

- **KEEP** — generic analytics capability;
- **EXTRACT** — useful capability currently trapped in dashboard-specific namespace;
- **REPLACE** — old builder UI replaced by fixed Workspace Dashboard;
- **REMOVE** — builder-only surface with no reusable analytics value;
- **DEFER** — safe schema/API cleanup that must wait for migration dependencies.

Before deleting any dashboard file, answer:

1. Does it execute/query Analytics V2 data?
2. Does it transform analytics responses generically?
3. Does it render a reusable chart/table/matrix?
4. Does it support CSV, drill-down, truncation, value resolution, or generic batching?

If **yes** to any of these, default to **KEEP/EXTRACT**, not delete.

Files whose only purpose is dashboard-builder CRUD, sharing, favorites, arbitrary layout, or arbitrary widget composition should default to **REMOVE/DEFER**.

Implementation PRs should include a short migration table:

| Previous capability/file | Action | New location/replacement | Reason |
|---|---|---|---|
| Analytics V2 engine | KEEP | unchanged | canonical data engine |
| Dashboard analytics renderer | EXTRACT | analytics renderer namespace | reusable |
| Dashboard grid drag/resize | REMOVE | fixed responsive layout | no builder |
| Dashboard member sharing | REMOVE | workspace/project ACL | no separate dashboard ACL |
| Dashboard data batching | EXTRACT | analytics/v2/batch | reusable |

This classification is mandatory to prevent another broad rewrite based on ambiguous product assumptions.

---

## 29. Final product statement

The Workspace Dashboard is an opinionated, immediately useful management view powered by Analytics V2.

Users should think:

> "I can change what this dashboard measures and how it groups the data."

They should NOT need to think:

> "I need to design and maintain a dashboard system."

That distinction is the core requirement of this phase.
