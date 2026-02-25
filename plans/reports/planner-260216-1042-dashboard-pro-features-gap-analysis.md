# Planner Report: Dashboard Pro Features Gap Analysis

**Date:** 2026-02-16
**Branch:** preview
**Plan:** `plans/260216-1039-dashboard-pro-features-gap-analysis/`

## Summary

Created 6-phase implementation plan to close gap between current analytics dashboard and Plane Pro feature parity. Total estimated effort: 24h.

## Phases Created

| Phase | File                                  | Priority | Effort | Key Changes                                               |
| ----- | ------------------------------------- | -------- | ------ | --------------------------------------------------------- |
| 1     | `phase-01-widget-filtering-ui.md`     | High     | 4h     | Filter tab in config modal, date range filters on backend |
| 2     | `phase-02-drag-drop-resize.md`        | High     | 5h     | Pragmatic DnD for widget reorder + resize handles         |
| 3     | `phase-03-duplicate-functionality.md` | Medium   | 3h     | Backend duplicate endpoint + UI menu items                |
| 4     | `phase-04-widget-preview.md`          | Medium   | 3h     | Live preview panel in config modal with sample data       |
| 5     | `phase-05-sharing-permissions.md`     | Low      | 5h     | Visibility field, custom permission class, share modal    |
| 6     | `phase-06-export-dashboard.md`        | Low      | 4h     | html2canvas + jsPDF client-side export                    |

## Key Architecture Decisions

1. **DnD library**: Use existing `@atlaskit/pragmatic-drag-and-drop` (already in project) instead of adding react-grid-layout
2. **Widget preview**: Client-side sample data, no API calls; reuse existing widget components
3. **Dashboard duplicate**: Server-side atomic operation (single API call clones dashboard + all widgets)
4. **Sharing**: Add visibility field to model rather than separate ACL table (KISS)
5. **Export**: Client-side only (html2canvas); no server-side PDF rendering needed

## Codebase Analysis

- Backend fully supports widget filters via `config.filters` JSON field — just needs date range extension and frontend UI
- All 6 widget components (bar, line, area, donut, pie, number) accept standardized props — reusable for preview
- MobX store pattern consistent across all dashboard operations
- 12-column CSS grid with `IAnalyticsWidgetPosition` already structured for DnD

## Files Produced

- `/Volumes/Data/SHBVN/plane.so/plans/260216-1039-dashboard-pro-features-gap-analysis/plan.md`
- `/Volumes/Data/SHBVN/plane.so/plans/260216-1039-dashboard-pro-features-gap-analysis/phase-01-widget-filtering-ui.md`
- `/Volumes/Data/SHBVN/plane.so/plans/260216-1039-dashboard-pro-features-gap-analysis/phase-02-drag-drop-resize.md`
- `/Volumes/Data/SHBVN/plane.so/plans/260216-1039-dashboard-pro-features-gap-analysis/phase-03-duplicate-functionality.md`
- `/Volumes/Data/SHBVN/plane.so/plans/260216-1039-dashboard-pro-features-gap-analysis/phase-04-widget-preview.md`
- `/Volumes/Data/SHBVN/plane.so/plans/260216-1039-dashboard-pro-features-gap-analysis/phase-05-sharing-permissions.md`
- `/Volumes/Data/SHBVN/plane.so/plans/260216-1039-dashboard-pro-features-gap-analysis/phase-06-export-dashboard.md`
