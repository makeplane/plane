---
status: COMPLETE
---

# Phase 4: Widget Interaction, Lifecycle & Deep Dive Specs

## 1. Interaction & Event Map

### 1.1 Lifecycle & Initialization

- **Add new Widget:** Clicking `Add widget` immediately creates a "Draft" Widget object on the grid layout, and the configuration Sidebar opens on the right. If the user clicks `Cancel`, the draft widget is discarded.
<!-- Updated: Validation Session 1 - Changed from auto-save to "Fake" Live Preview hybrid -->
- **"Fake" Live Preview:** Modifications in the Sidebar do NOT auto-save to DB. Instead:
  - **Data changes** (X-axis, Y-axis, Filters, Metrics): re-fetch `GET /charts/` to show live preview on grid. No PATCH.
  - **Visual changes** (colors, line types, toggles, legends): frontend re-renders chart locally from state. No API call at all.
  - **Save trigger**: `PATCH /widgets/{widget_id}/` fires ONLY when sidebar closes (X button or click-away). This persists all accumulated changes at once.
- **Close Panel:** Clicking outside the Grid area, or clicking the 'X' icon (close), closes the sidebar and triggers the save PATCH.

### 1.2 Layout Grid & Drag-Drop Mechanics

- **Grid System:** The entire Dashboard implements a free-form Grid system based on coordinate metrics (`x_axis_coord`, `y_axis_coord`) and sizing constraints (`width`, `height`).
- **Resize:** Each widget contains a drag handle in the bottom-right corner. Expanding it updates the `width` and `height`. The UI employs an auto-flow mechanism to organically push overlapping widgets downwards.
- **Drag & Drop:** Users can drag the header area of any widget (excluding buttons) to reposition it. The new (x, y) coordinates trigger an automatic `PATCH /widgets/{id}/` request. A ghost outline previews the drop position during the drag event.

### 1.3 Widget Context Menu

Located at the top-right corner of each rendered Widget on the grid is an ellipsis button (Menu `...`). Clicking it reveals:

- **`Edit`:** Reopens the configuration sidebar for property/style adjustments.
- **`Open in new tab`:** Redirects the user to a new tab showing the Dashboard's Issue list page. The Query Filter bar is pre-filled with the exact X-axis, Group By, and custom Filters defined for that specific widget, enabling deep drill-down.
- **`Copy link`:** Copies a direct preview link to the chart (or filtered board link) to the clipboard. Displays a success Toast notification: "Link copied to clipboard".
- **`Delete`:** Removes the widget. Triggers a warning Modal: "Are you sure you want to delete this widget?". Confirming calls the `DELETE` API and unmounts the component from the grid.

### 1.4 Drill-down Interactions

- **Hover Event:** Mouse-hovering over chart bars/lines activates a `Tooltip` showing the corresponding Label (e.g., `Todo`) and Value (e.g., `10 work items`). This can be toggled via the `Show tooltip` setting.
- **Click Event (Drill-down):** Clicking a specific chart element (e.g., the "In Progress" bar) pushes the routing path to the respective Issue list view, automatically appending query parameters derived from the clicked context (`?state=in_progress`) alongside parent dashboard filters.

## 2. Filter System & Calculation Logic

### 2.1 Filter Rules

The `Add filter` button applies secondary filtering logic _on top_ of the defined X/Y axes.

- **Fields:** `Assignees`, `Cycle`, `Module`, `Mentions`, `Created by`, `Priority`, `Label`, `Type`, `State`, `State Group`, `Start date`, `Due date`.
- **Logic Example:** If X-axis is `State` and Filter is `Priority = Urgent`. The backend API queries issues scoped to the Dashboard projects, filters for `priority='urgent'`, and then aggregates the result grouping by `State`.
- **Formulas:** Standard SQL aggregations. `$count` translates to `COUNT(id)` for `Work item count`, and `$sum(estimate_point)` for the `Estimate` metric.

## 3. Widget-by-Widget Deep Dive

All widgets share common `Name` and `Widget type` fields. The configuration sidebar dynamically adapts based on the chosen `Widget type`.

### 3.1 Bar Chart

- **Variants (`chart_model`):**
  - `Basic bar`: Requires `X-axis` and `Y-axis`. Single monolithic columns. Style defined by a single hex `Bar color`.
  - `Stacked bar`: Introduces the `Stack by` drop-down (e.g., X = Label, Stack = State). Color config switches to a `Color scheme` preset dropdown (e.g., Earthen, Modern). Bars stack vertically.
  - `Horizontal bar`: Similar to Basic bar but transposes axes (Value on X, Label on Y).
- **Settings (Toggles):** `Show legends`, `Show tooltip`.

### 3.2 Line Chart

- **Variants:**
  - `Basic line`: Single `X-axis`, `Y-axis`. Yields one continuous line. Customized by `Line color`.
  - `Multi-line`: Unlocks the `Group by` selector. Renders multiple overlapping lines. Applies styling via `Color scheme` presets.
- **Settings:**
  - `Line type`: Dropdown with `Solid`, `Dashed`, `Stepped`.
  - `Smoothing`: Toggle for bezier curve interpolation vs sharp vertices.
  - `Show markers`: Render spherical data points on vertices.
  - `Show legends`, `Show tooltip`.

### 3.3 Area Chart

- **Variants:**
  - `Basic area`: Single area shape. Uses `Area color`. Inherits Smoothing/Markers logic from Line chart.
  - `Stacked area`: Multiple regions. Introduces `Stack by` selector. Uses `Color scheme`. Fills volume to bottom axis.

### 3.4 Pie / Donut Chart

- **Variants:**
  - `Basic pie`: Traditional radial slices. Configured via `Color scheme`. Requires valid X and Y axes.
  - `Basic donut`: Radial with hollow center.
  - **Progress donut**: Specialized tracker. Evaluates a single Y-axis metric. Displays a single continuous tracking arc. Adds a `Completed color` picker and `Center value` toggle (displays massive % number within the hollow core).

### 3.5 Number Widget (Metric Summary)

- Simplest primitive, defaults to minimum grid layout constraint (width: 1, height: 1).
- **No X-axis**.
- **Metric dropdown:** Statically mapped metrics requiring hardcoded backend SQL evaluations: `Work item count`, `Pending work items`, `Completed work items`, `In progress work items`, `Blocked work items`, `Work items due this week`, `Work items due today`.
- **Style settings:**
  - `Text alignment`: Left, Center, Right.
  - `Text color`: Hex selector.
