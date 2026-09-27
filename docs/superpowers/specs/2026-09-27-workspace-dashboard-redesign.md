# Workspace Dashboard V3 — UX Redesign Spec

**Status**: Draft for review
**Date**: 2026-09-27
**Scope**: All 4 reported UX gaps, production-grade

## Problem

The Workspace Dashboard at `/{workspaceSlug}/dashboards/` ships with four user-visible defects that make it unusable as a daily-driving tool for PMs, engineers, and admins:

1. **Filter buttons never show the selected value.** `CustomSearchSelect` renders only its `label` prop inside the trigger button. After a user picks "This quarter" from the Time range dropdown, the button still reads "Time range". Users cannot tell whether a filter is active.
2. **Per-widget configuration is over-scoped.** Each card exposes a Configure popover with up to seven control types (metric, dimension, breakdown, normalization, allocation, date_grouping, renderer). The spec (§6.1) already declares the layout "fixed, never user-resized"; the configurability contradicts that and most users never touch it.
3. **No global Assignees, Labels, Cycles, Modules, or Created-by filter.** The analytics V2 engine supports all five dimensions, but the dashboard only filters by Project + Priority + State group. PMs asking "what is Sarah overloaded with?" or "what work touches the billing label?" cannot answer from the dashboard.
4. **No "Workload by labels" card.** `workload_by_assignee` is hardcoded to the `assignees` dimension; there is no equivalent card for `labels`, `project`, `module`, or `cycle` even though the engine supports them.

## Goals

1. A user opening `/home/dashboards/` can tell at a glance which filters are active and what value each holds.
2. A PM, engineer, or admin lands on a default view tuned to their role without picking anything.
3. A PM can answer "what is Sarah overloaded with this sprint?" in two clicks (assignee filter + click the In-progress KPI).
4. A user can click any number on any card and see the underlying work items without leaving the dashboard.
5. A user can see week-over-week deltas on the KPI band without re-querying.
6. Filter state persists across reloads per (workspace, user) without server changes.
7. Existing spec test asserting `lg:grid-cols-5` and the 12-card rendering contract still passes — we ship additive changes.

## Non-goals

- Mobile-specific layout (responsive grid already works; no phone-specific optimization).
- Multiple dashboard routes or a view switcher UI.
- Save & share named dashboards.
- Backend changes (analytics V2 engine already supports every dimension and comparison block used here).
- Real-time polling / auto-refresh.
- User-customisable card visibility (we keep all 13 cards always rendered, in spec order).

## User personas

The dashboard serves three personas on the same route:

| Persona       | Filter need                                         | Default behavior on mount                                             |
| ------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| Engineer / IC | "Show me my own work"                               | `assignees=[me]` if user role is MEMBER; otherwise no assignee filter |
| PM / Lead     | "Show me the team, with optional cycle/label focus" | No assignee filter (team-wide); Cycles and Labels available to narrow |
| Admin         | "Show me the workspace overview"                    | No assignee filter; Projects available                                |

Role determination uses `useUser().role` against the workspace membership record already loaded into the workspace store. We do NOT add a server round-trip to detect "does this user have any work items assigned"; the role check is the only input. If a MEMBER with no assigned work items lands on the dashboard, the cards correctly show 0 and the existing data-empty state handles the rest.

All three personas share the same 13 cards; only the default filter differs. Users can override any filter manually and the override is what persists.

## Architecture

### Route & layout

Single route `/home/dashboards/` (existing). Layout top-to-bottom:

```
[Global filter bar — 9 controls, all with selected-value display]
[KPI Band — 5 fixed cards A-E with comparison delta inline]
[Section: Delivery — 2 cards]
[Section: Workload — 3 cards (Workload by assignee, Workload allocation matrix, Workload by labels)]
[Section: Distribution — 2 cards]
[Section: Attention — 1 card]
```

13 cards total (12 existing + 1 new). The new card `workload_by_labels` slots into the Workload section directly after `workload_by_assignee`.

### Smart-default hook

A new hook `useDashboardSmartDefault` runs once per (workspace, user) on first mount:

1. Read current user role from `useUser().role` (already populated by the user store).
2. If role is `MEMBER`, set `viewMode='personal'` and seed `global.assignees=[user.id]`.
3. If role is `ADMIN`, set `viewMode='team'` with no assignee filter.
4. Write the resolved mode into `dashboardPreferencesStore` so subsequent reloads use it without re-querying.

### Persistence

Filter state (global scope + view mode) persists to `localStorage` under `plane-dashboard-scope:{workspaceId}:{userId}`. Per-card preferences (metric, dimension, breakdown, renderer) already persist via `dashboardPreferencesStore` (existing). We extend the same store with a `global` and `viewMode` slice; storage layer is localStorage-only.

Server sync is out of scope per the user's decision. A user on a second device or browser starts from the smart default again.

## Components

### `CustomSearchSelect` (UI package) — the core filter fix

**Current bug**: `custom-search-select.tsx:137` renders `{label}` only. The selected value never appears in the trigger button.

**Fix**: Accept a new optional `selectedContent` prop. When the combobox has a single non-empty value AND `selectedContent` is provided, render `selectedContent` inside the trigger instead of `label`. For multiple values, render `"{count} selected"` unless a `multipleLabel` prop is supplied.

```tsx
<CustomSearchSelect
  value={[scope.timePreset]}
  options={timeOptions}
  label={t("dashboard_v3.control.time_range")} // shown only when nothing selected
  selectedContent={timeContent} // function: (value) => ReactNode
/>
```

The new prop is fully backwards-compatible — callers that omit it get the old label-only behaviour. The fix lives in the shared UI component so every consumer (sidebar, modal, etc.) can opt in.

### `global-controls.tsx` — 9 filters + comparison

Add five new global filters and a Comparison toggle. All 9 controls follow the `ProjectSelect` pattern (custom button that shows the selected value, not just the static label):

| Filter     | Dimension     | Multi? | Default when unset   |
| ---------- | ------------- | ------ | -------------------- |
| Projects   | `project_ids` | yes    | all joined projects  |
| Time range | `preset`      | no     | `this_quarter`       |
| Date basis | `basis`       | no     | `created_at`         |
| Priority   | `priority`    | yes    | none                 |
| Assignees  | `assignees`   | yes    | `viewMode`-dependent |
| Labels     | `labels`      | yes    | none                 |
| States     | `state_group` | yes    | none                 |
| Cycles     | `cycle`       | yes    | none                 |
| Modules    | `module`      | yes    | none                 |
| Created by | `created_by`  | yes    | none                 |
| Comparison | `comparison`  | no     | `none`               |

Reset button clears every filter and the comparison toggle, then re-runs the smart default for Assignees.

### `dashboard-card.tsx` — drop Configure, expose drilldown

- **Remove the Configure button from 12 of 13 cards.** Only `workload_by_assignee` keeps a card-local control — a dimension swap dropdown letting the user flip between `assignees`, `labels`, `project`, `module`, `cycle`. The swap is in-place (no popover).
- **Keep Export CSV** on every card (icon-only on KPI cards per existing fix).
- **Expose drilldown on every cell with a value.** Card body cells gain `cursor-pointer`, `hover:bg-layer-transparent-hover`, and `aria-label="View work items"`. Click invokes the existing `InsightDrilldownDrawer` (already wired in `dashboard-card.tsx:219`, just not yet exposed as a click handler on every renderer).
- Add a **comparison delta row** to KPI cards. When `scope.comparison !== "none"`, render a small `▲ +N` or `▼ −N` line under the number. The delta comes from the engine response `comparison.totals[metric]` (already part of the V2 schema).

### `card-registry.ts` — add `workload_by_labels`, slim per-card controls

- Add card id `workload_by_labels` (letter M) to the Workload section. Defaults: `dimension=labels`, `metric=work_item_count`, `display=value_and_percentage`, `normalization=group_total`, `allocation=full_credit`, `renderer=bar`. Same shape and controls as `workload_by_assignee` (H).
- KPI cards (A-E): `controls` array stays as `["metric", "display"]` — no change. Comparison is a global control, not per-card.
- All other cards: `controls` array unchanged in this spec. Future cleanup can slim them down, but no card-local controls are added or removed in this scope.

### `card-controls.tsx` — slim to one component

Remove the generic `WorkspaceDashboardCardControls` (the Configure popover). Add one narrow `WorkloadDimensionSwap` component used only by `workload_by_assignee`. KPI cards no longer render any control beyond Export CSV.

### `batch-composer.ts` — wire comparison + new dimensions

- Add `comparison` to the `TWorkspaceDashboardGlobalScope` type already defined in this file.
- Include `comparison: { type: scope.comparison }` in every batch request payload.
- For the five new global filter dimensions, pass them through into the engine payload's `filters` block using the same shape as the existing Priority and State group filters.
- `isDashboardDataEmpty` stays as-is.

### `dashboard-preferences.store.ts` — extend global slice

- Add `global: TWorkspaceDashboardGlobalScope` and `viewMode: 'personal' | 'team' | null` to the store state.
- On every `setGlobalScope` call, persist the new slice to `localStorage` under `plane-dashboard-scope:{workspaceId}:{userId}`.
- On `setIdentity(workspaceId, userId)`, hydrate from localStorage; fall back to smart default if no entry exists.
- Existing per-card preferences (`cards`) remain untouched.

### `use-smart-default.ts` (new)

Exports a single hook `useDashboardSmartDefault()` that:

- Reads current user role from `useUser().role`.
- Resolves the initial `viewMode` and `global.assignees` per the personas table above (MEMBER → personal + `assignees=[me]`, ADMIN → team + no assignee filter).
- Returns `{ viewMode, isResolving }` so the dashboard can show a lightweight skeleton while it runs.
- Skips re-resolution if a persisted scope already exists for the (workspace, user) pair.
- Performs no extra HTTP calls — everything is read from stores already populated by the app shell.

## Data flow

```
mount /home/dashboards/
    │
    ├─ dashboardPreferencesStore.setIdentity(wsId, userId)
    │      │
    │      ├─ localStorage has key?  → hydrate global + viewMode from JSON
    │      └─ localStorage empty     → run useDashboardSmartDefault
    │
    ├─ buildDashboardBatchRequest(preferences.cards, scope.global)
    │
    ├─ debounced 250ms → POST /api/workspaces/{slug}/analytics/v2/batch/
    │      body: { queries: [...12 cards], comparison: { type } }
    │
    ├─ response.results → normalizeDashboardBatchResponse → setBatch
    │
    └─ render cards with batch + per-card preference
```

User interactions:

- **Pick filter** → `setGlobalScope({ filters: { labels: [...] } })` → persist to localStorage synchronously → trigger debounced batch re-fetch.
- **Swap Workload by assignee dimension** → `setCardPreference("workload_by_assignee", { dimension: "labels" })` → existing per-card flow + persist.
- **Click cell on a card** → set local `drilldown` state → render `InsightDrilldownDrawer` with the card's `query` + clicked cell selection.
- **Reset** → `dashboardPreferencesStore.reset()` clears per-card + global + viewMode → smart default re-runs.

## Error handling

| Case                                                                 | Behavior                                                                                                                            |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| A filter dimension not supported by the engine version               | Filter renders disabled with tooltip "Not supported by your Plane version"                                                          |
| A previously selected user / label no longer exists in the workspace | Strip silently from the filter, toast "Removed missing value"                                                                       |
| Comparison enabled but timePreset is `none`                          | Auto-hide comparison toggle (KPI cards ignore time, so comparison is meaningless)                                                   |
| localStorage quota exceeded                                          | Catch + log + fall back to in-memory scope for that session                                                                         |
| Smart-default hook cannot read user role (store not yet populated)   | Defer the resolution to the next render; if still empty, render the dashboard with no assignee filter rather than blocking the page |
| Batch request fails                                                  | Existing behavior: per-card error state, dashboard never blanks (§11)                                                               |
| Workspace has zero members                                           | `viewMode='team'`, no assignee filter                                                                                               |

## Testing

### Unit (vitest)

- `custom-search-select`: trigger renders `label` when nothing selected, `selectedContent(value)` when one item selected, `"{count} selected"` when multi. Backwards-compat: omitting the new prop yields the old label-only behaviour.
- `dashboard-preferences.store`: hydrate/dehydrate round-trip with all 9 filter slots + comparison + viewMode; multi-workspace isolation (key per wsId + userId); quota-exceeded fallback.
- `use-smart-default`: MEMBER → personal; ADMIN → team; persisted scope exists → use persisted; resolver runs synchronously from store data.
- `batch-composer`: comparison block included in payload when set; omitted when `none`; filters map covers all 5 new dimensions.
- `card-registry`: new `workload_by_labels` card passes the same registry validation as the existing 12.

### Component (vitest + RTL)

- `global-controls`: 9 filters render in spec order; multi-select shows chip count; reset clears state; comparison disabled when timePreset=none.
- `dashboard-card`: no Configure button on 12 cards; Workload by assignee shows dimension swap; click on a number fires `setDrilldown`.
- Drilldown drawer opens with the correct query + selection.

### Integration (orca-cli browser)

- Visit `/home/dashboards/` — KPI band visible, filter bar visible, all 13 cards render.
- Pick "This month" in Time range — button reads "Time range · This month".
- Pick Assignee = current user — data refreshes, "Open work items" number changes.
- Reload the page — filters and comparison persist.
- Click a number on a KPI — drawer opens with the work items list.
- Reset — filters clear, smart default re-runs.

### Spec regression

- The existing assertion `expect(html).toContain("lg:grid-cols-5")` must still pass.
- The existing assertion `for (const card of WORKSPACE_DASHBOARD_CARDS) expect(screen.getByTestId(...))` is updated to iterate over the 13 cards (registry now has one extra).
- All 100 tests in `tests/dashboards/` continue to pass.

## Out of scope (explicit)

- Mobile-specific layout optimization beyond responsive grid.
- Multiple dashboard routes or a view-switcher UI.
- Save & share named dashboard views.
- Backend changes (analytics V2 already supports every dimension and comparison block used here).
- Real-time polling or auto-refresh on a timer.
- Card visibility toggle (all 13 cards always render in spec order).
- Localization of new strings (covered by existing i18n workflow; one key per filter name added via the `translate` skill).
- Renaming the route or moving the page.

## Risks

- **CustomSearchSelect is shared across the app.** Changing its trigger rendering touches every consumer. The new prop is opt-in (callers that do not pass `selectedContent` see the old label-only behaviour), so the blast radius is limited to call sites we explicitly migrate. We migrate all 9 dashboard filters and leave every other call site untouched in this spec.
- **localStorage corruption** (a user manually edits the key). Hydration wraps the read in try/catch and falls back to smart default.
- **The 13th card shifts Workload section layout.** `lg:grid-cols-2` means the new card occupies half a row; the wide `workload_allocation_matrix` card already uses `lg:col-span-2`. Verified manually that 3 cards (H, I, M) lay out as: H + M side-by-side on row 1, I spans row 2. No grid class change required.
- **Smart-default count query adds an extra HTTP call on first visit.** Resolved by removing the query: smart default is now derived from `useUser().role`, no extra HTTP call.
