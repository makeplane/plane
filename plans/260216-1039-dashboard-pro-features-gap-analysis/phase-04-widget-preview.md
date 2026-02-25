# Phase 4: Widget Preview in Config Modal

## Context Links

- Widget config modal: `apps/web/core/components/dashboards/widget-config-modal.tsx`
- Widget components: `apps/web/core/components/dashboards/widgets/` (bar, line, area, donut, pie, number)
- Constants: `packages/constants/src/analytics-dashboard.ts` (color presets, defaults)
- Types: `packages/types/src/analytics-dashboard.ts`

## Overview

- **Priority:** Medium
- **Status:** Pending
- **Effort:** 3h
- **Description:** Config modal has no live preview. User must save widget and wait for data fetch to see result. Adding a preview panel with sample data improves UX significantly.

## Key Insights

- All 6 widget components already accept `data`, `config`, `chartProperty`, `chartMetric` props
- Can render preview with sample/mock data matching the selected property schema
- Preview updates reactively as user changes form values (react-hook-form `watch`)
- No API call needed for preview; use static sample data

## Requirements

### Functional

- Live preview panel in config modal (right side or bottom)
- Preview updates in real-time as user changes type, property, metric, style, display settings
- Sample data matches selected chart property (e.g., priority shows urgent/high/medium/low)
- Preview shows actual color preset colors
- Preview renders at approximately widget card size

### Non-functional

- Preview re-renders smoothly without flicker
- Sample data is static (no API calls)
- Preview container matches actual widget aspect ratio

## Architecture

### Frontend Only (No Backend Changes)

1. Add preview panel to widget config modal layout (split view: config left, preview right)
2. New component `widget-preview-panel.tsx` that renders the appropriate widget component
3. Static sample data generator per chart property
4. Uses `watch()` from react-hook-form to reactively get current form values

## Related Code Files

### Modify

- `apps/web/core/components/dashboards/widget-config-modal.tsx` — add preview panel layout

### Create

- `apps/web/core/components/dashboards/config/widget-preview-panel.tsx`
- `apps/web/core/components/dashboards/config/widget-sample-data.ts`

## Implementation Steps

1. **Sample data generator** — Create `widget-sample-data.ts`:

   ```typescript
   // Returns IAnalyticsChartData with realistic sample data per property
   export function getSampleChartData(property: string): IAnalyticsChartData {
     const samples: Record<string, IAnalyticsChartData> = {
       priority: { data: [{name:"Urgent",count:5},{name:"High",count:12},...], schema:{...} },
       state_group: { data: [{name:"Backlog",count:8},...], schema:{...} },
       // ... per property
     };
     return samples[property] || samples.priority;
   }
   export function getSampleNumberData(metric: string): IAnalyticsNumberWidgetData {
     return { value: metric === "count" ? 142 : 385, metric };
   }
   ```

2. **Widget preview panel component** — Create `widget-preview-panel.tsx`:
   - Props: `widgetType`, `config`, `chartProperty`, `chartMetric`
   - Renders appropriate widget component (BarChartWidget, LineChartWidget, etc.)
   - Wraps in styled container matching widget card dimensions
   - Shows "Preview" label at top

3. **Config modal layout (side-by-side — confirmed in validation)** — Modify `widget-config-modal.tsx`:
   <!-- Updated: Validation Session 1 - Side-by-side layout confirmed -->
   - Change modal to wider layout (~900px, flex row: config panel + preview panel)
   - Config panel takes 55% width (left)
   - Preview panel takes 45% width (right) with light background
   - Use `watch()` to pass live form values to preview panel
   - Preview panel only renders when modal is open (performance)

4. **Responsive preview** — Preview container scales widget to fit available space using CSS transform or container queries

## Todo List

- [ ] Create sample data generator for all 12 chart properties
- [ ] Create sample number widget data
- [ ] Create WidgetPreviewPanel component
- [ ] Modify config modal layout to split view
- [ ] Wire form watch() values to preview panel
- [ ] Test preview with all widget types
- [ ] Test preview updates reactively with config changes
- [ ] Verify color preset changes reflect in preview

## Success Criteria

- Preview renders correct widget type as user selects it
- Color preset changes immediately reflected in preview
- Style/display toggles (legend, tooltip, border, etc.) reflected in preview
- Preview uses appropriate sample data per selected property
- No API calls made for preview rendering

## Risk Assessment

- **Modal width**: Wider modal may not fit small screens. Mitigation: stack preview below config on narrow viewports or hide preview.
- **Re-render performance**: Frequent form changes trigger many re-renders. Mitigation: debounce watch values or use `useMemo` for sample data.

## Security Considerations

- No security concerns; preview uses static client-side data only
