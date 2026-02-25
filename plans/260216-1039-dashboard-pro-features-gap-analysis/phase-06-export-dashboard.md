# Phase 6: Export Dashboard (PDF/Image)

## Context Links

- Dashboard detail page: `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`
- Widget grid: `apps/web/core/components/dashboards/analytics-dashboard-widget-grid.tsx`
- Widget card: `apps/web/core/components/dashboards/analytics-dashboard-widget-card.tsx`

## Overview

- **Priority:** Low
- **Status:** Deferred (Validation Session 1: focus on Phases 1-4 first)
- **Effort:** 4h
- **Description:** No way to export dashboard as PDF or image for reporting/sharing outside Plane. Client-side rendering approach using html2canvas + jsPDF.

## Key Insights

- Client-side export avoids server-side rendering complexity
- html2canvas captures DOM as canvas; jsPDF converts canvas to PDF
- Recharts renders as SVG, which html2canvas handles well
- Export should capture current widget data (already rendered)
- Need to temporarily hide UI chrome (edit buttons, menus) during capture

## Requirements

### Functional

- "Export" button in dashboard header (next to Refresh)
- Export options: PNG image, PDF document
- Export captures all visible widgets with current data
- Dashboard title included in export header
- Export date/timestamp in footer
- Loading indicator during export generation

### Non-functional

- Export resolution: 2x for crisp output
- PDF page size: A4 landscape
- Max export time: <5 seconds for typical dashboard

## Architecture

### Frontend Only (No Backend)

1. Install `html2canvas` and `jspdf` packages
2. Export button triggers DOM capture of widget grid
3. Temporary CSS class hides interactive elements during capture
4. Canvas converted to PNG blob or PDF document
5. Browser download triggered

## Related Code Files

### Modify

- `apps/web/package.json` — add html2canvas, jspdf dependencies
- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx` — add export button + handler
- `apps/web/core/components/dashboards/analytics-dashboard-widget-grid.tsx` — add ref for DOM capture

### Create

- `apps/web/core/components/dashboards/dashboard-export-utils.ts`

## Implementation Steps

1. **Install dependencies**:

   ```bash
   pnpm add html2canvas jspdf --filter @plane/web
   ```

2. **Export utility module** — Create `dashboard-export-utils.ts`:

   ```typescript
   export async function exportDashboardAsImage(element: HTMLElement, title: string): Promise<void> {
     // Add export-mode class to hide UI chrome
     // Capture with html2canvas at 2x scale
     // Convert to blob, trigger download
     // Remove export-mode class
   }
   export async function exportDashboardAsPDF(element: HTMLElement, title: string): Promise<void> {
     // Similar capture
     // Create jsPDF instance (landscape A4)
     // Add title header + timestamp footer
     // Add canvas as image
     // Save PDF
   }
   ```

3. **Grid ref** — Add `React.forwardRef` to AnalyticsDashboardWidgetGrid for DOM access

4. **Export button** — Add dropdown button in dashboard header:
   - "Export as PNG" option
   - "Export as PDF" option
   - Loading spinner during export

5. **CSS export mode** — Add `.dashboard-export-mode` class that:
   - Hides edit buttons, context menus, hover effects
   - Sets white background
   - Removes border-dashed "Add Widget" button

6. **Download trigger** — Use `URL.createObjectURL` + hidden anchor click for browser download

## Todo List

- [ ] Install html2canvas and jspdf
- [ ] Create dashboard-export-utils module
- [ ] Add forwardRef to widget grid component
- [ ] Add export button/dropdown to dashboard header
- [ ] Implement PNG export function
- [ ] Implement PDF export function with title/timestamp
- [ ] Add CSS export mode class
- [ ] Add loading state during export
- [ ] Test export with various widget configurations
- [ ] Test PDF page fitting with many widgets
- [ ] Verify SVG chart rendering in html2canvas

## Success Criteria

- PNG export downloads full dashboard as image
- PDF export includes title, widgets, and timestamp
- Export captures all widget charts correctly (SVG rendering)
- Interactive elements hidden in export output
- Export completes within 5 seconds for 8-widget dashboard

## Risk Assessment

- **SVG rendering**: html2canvas has known issues with some SVG patterns. Mitigation: test with all 6 widget types; fallback to `canvg` for SVG-to-canvas if needed.
- **Large dashboards**: Many widgets may exceed canvas size limits. Mitigation: set reasonable max canvas size; for PDF, paginate if needed.
- **Cross-origin images**: If widgets reference external images. Mitigation: unlikely for chart widgets; set `useCORS: true` in html2canvas config.

## Security Considerations

- Export is client-side only; no data leaves the browser except via user download
- Ensure exported data respects user's current permission scope (already enforced by widget data fetch)
