# Phase 2: Drag-and-Drop Widget Rearrangement + Resize

## Context Links

- Widget grid: `apps/web/core/components/dashboards/analytics-dashboard-widget-grid.tsx`
- Widget card: `apps/web/core/components/dashboards/analytics-dashboard-widget-card.tsx`
- Dashboard detail page: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`
- Store: `apps/web/core/store/analytics-dashboard.store.ts`
- Types: `packages/types/src/analytics-dashboard.ts` (IAnalyticsWidgetPosition)
- DnD lib: `react-grid-layout` (new dependency — validated in Session 1)

## Overview

- **Priority:** High
- **Status:** Pending
- **Effort:** 5h
- **Description:** Widget grid is currently static CSS grid. Widgets have position data (row, col, width, height) but no interactive repositioning or resizing. Need drag-to-reorder and resize handles in edit mode.

## Key Insights

<!-- Updated: Validation Session 1 - Switch from pragmatic-drag-and-drop to react-grid-layout -->

- **Using `react-grid-layout` (new dependency)** — purpose-built for dashboard grids, handles DnD + resize + collision out of the box
- **Using `ResponsiveGridLayout`** with breakpoints: lg=12col, md=8col, sm=4col for tablet/mobile support
- Widget position stored as JSON `{row, col, width, height}` on responsive grid with 60px row height
- Only active in edit mode; view mode is read-only (use `static` prop on layout items)
- Need batch position update after layout change via `onLayoutChange` callback

## Requirements

### Functional

- Drag widgets to new grid positions in edit mode
- Resize widgets via drag handle (bottom-right corner)
- Visual feedback during drag (ghost element, drop zone indicator)
- Snap to grid (12-col, 60px rows)
- Persist new positions to backend after drop/resize
- Min size constraints per widget type (number: 2x2, charts: 3x3)

### Non-functional

- Smooth 60fps drag performance
- No layout jumps on drop
- Touch support not required (desktop-first)

## Architecture

<!-- Updated: Validation Session 1 - Use react-grid-layout/Responsive -->

### Approach: react-grid-layout with ResponsiveGridLayout

Using `react-grid-layout` (new dependency). Provides DnD + resize + collision detection built-in. ResponsiveGridLayout handles breakpoints.

### Frontend

1. Install `react-grid-layout` + `@types/react-grid-layout`
2. Replace CSS grid in widget-grid with `ResponsiveGridLayout`
3. Breakpoints: `{ lg: 1200, md: 996, sm: 768 }` → cols: `{ lg: 12, md: 8, sm: 4 }`
4. Each widget maps to a layout item `{ i: widgetId, x, y, w, h, minW, minH }`
5. `isDraggable` and `isResizable` controlled by edit mode toggle
6. `onLayoutChange` callback persists new positions to backend
7. `static: true` on items when NOT in edit mode

### Store Changes

- Add `updateWidgetPositions` action for batch position update
- Add `reorderWidgets` local action for optimistic reordering

### Backend

- Add bulk widget position update endpoint (PATCH with array of `{id, position}`)

## Related Code Files

### Modify

- `apps/web/core/components/dashboards/analytics-dashboard-widget-grid.tsx` — add DnD container logic
- `apps/web/core/components/dashboards/analytics-dashboard-widget-card.tsx` — add draggable + resize handle
- `apps/web/core/store/analytics-dashboard.store.ts` — add batch position update action
- `apps/web/core/services/analytics-dashboard.service.ts` — add bulk position update method
- `apps/api/plane/app/views/analytics_dashboard.py` — add bulk widget position endpoint
- `apps/api/plane/app/urls/analytics_dashboard.py` — add URL for bulk position

### Create

- `apps/web/core/components/dashboards/widget-resize-handle.tsx`
- `apps/web/core/components/dashboards/widget-drag-overlay.tsx`

## Implementation Steps

1. **Backend bulk position endpoint** — New view method or endpoint that accepts `[{widget_id, position}]` array and updates all widgets in a transaction
2. **Service method** — Add `updateWidgetPositions(workspaceSlug, dashboardId, positions[])` to AnalyticsDashboardService
3. **Store action** — Add `updateWidgetPositions` with optimistic update pattern
4. **Install react-grid-layout**:
   ```bash
   pnpm add react-grid-layout @types/react-grid-layout --filter @plane/web
   ```
5. **Replace CSS grid with ResponsiveGridLayout** — In widget-grid component:
   - Import `{ Responsive, WidthProvider }` from `react-grid-layout`
   - Create `ResponsiveGridLayout = WidthProvider(Responsive)`
   - Define breakpoints: `{ lg: 1200, md: 996, sm: 768 }`
   - Define cols: `{ lg: 12, md: 8, sm: 4 }`
   - Map widgets to layout items: `{ i: widget.id, x: position.col, y: position.row, w: position.width, h: position.height }`
   - Set `isDraggable={isEditMode}` and `isResizable={isEditMode}`
   - Import react-grid-layout CSS
6. **Min/max size constraints** — Per widget type:
   - Number: `minW: 2, minH: 2`
   - Charts: `minW: 3, minH: 3`
7. **onLayoutChange callback** — Debounce, then:
   - Optimistically update local positions
   - Call bulk position update API
   - Revert on failure
8. **Drag handle** — Add grip dots icon as `draggableHandle=".widget-drag-handle"` visible only in edit mode

## Todo List

- [ ] Create backend bulk widget position update endpoint
- [ ] Add URL route for bulk position update
- [ ] Add service method for bulk position update
- [ ] Add store action for batch position update
- [ ] Implement draggable widget cards with pragmatic-drag-and-drop
- [ ] Implement drop zone calculation in grid
- [ ] Create widget resize handle component
- [ ] Create drag overlay component
- [ ] Add min/max size constraints per widget type
- [ ] Add visual feedback (ghost, drop indicator)
- [ ] Test drag-and-drop with various widget sizes
- [ ] Test resize with boundary conditions

## Success Criteria

- Widgets can be dragged to new positions in edit mode
- Widgets can be resized via corner handle
- Positions persist after page refresh
- No overlap between widgets after repositioning
- Smooth drag performance without layout jumps

## Risk Assessment

- **Grid collision detection**: Complex logic for preventing overlap. Mitigation: simple "swap positions" on overlap rather than full collision avoidance.
- **Performance with many widgets**: DnD monitors on many elements. Mitigation: pragmatic-drag-and-drop is lightweight, Plane already uses it extensively.
- **Position calculation accuracy**: Grid snapping math. Mitigation: use `Math.round(mouseOffset / cellWidth)` for clean snapping.

## Security Considerations

- Bulk position update validates widget ownership (dashboard belongs to workspace)
- Position values validated as positive integers within grid bounds
