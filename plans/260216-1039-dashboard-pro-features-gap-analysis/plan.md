---
title: "Dashboard Pro Features Gap Analysis & Implementation"
description: "Implement missing Pro dashboard features: widget filters, DnD, duplicate, preview"
status: complete
priority: P2
effort: 15h
branch: preview
tags: [dashboard, analytics, pro-features, widgets]
created: 2026-02-16
---

# Dashboard Pro Features - Implementation Plan

## Overview

Close the gap between current analytics dashboard implementation and Plane Pro feature parity. Six phases ordered by user impact.

## Phases

| #   | Phase                                                                         | Priority | Effort | Status   |
| --- | ----------------------------------------------------------------------------- | -------- | ------ | -------- |
| 1   | [Widget-level Filtering UI + Date Range](./phase-01-widget-filtering-ui.md)   | High     | 4h     | Complete |
| 2   | [Drag-and-Drop Widget Rearrangement + Resize](./phase-02-drag-drop-resize.md) | High     | 5h     | Complete |
| 3   | [Dashboard & Widget Duplicate](./phase-03-duplicate-functionality.md)         | Medium   | 3h     | Complete |
| 4   | [Widget Preview in Config Modal](./phase-04-widget-preview.md)                | Medium   | 3h     | Complete |
| 5   | [Dashboard Sharing/Permissions](./phase-05-sharing-permissions.md)            | Low      | 5h     | Deferred |
| 6   | [Export Dashboard (PDF/Image)](./phase-06-export-dashboard.md)                | Low      | 4h     | Deferred |

## Key Dependencies

- `react-grid-layout` — new dependency for Phase 2 DnD + resize (replaces custom pragmatic-drag-and-drop approach)
- `@plane/propel` Recharts widgets already built (reused for preview in Phase 4)
- Backend `build_analytics_chart` utility handles all chart data (Phase 1 extends filters)
- Widget `config.filters` field exists in model but has no frontend UI (Phase 1 adds it)

## Architecture Principles

- Frontend: MobX store pattern, observer components, react-hook-form
- Backend: Django REST, soft-delete models, WorkSpaceAdminPermission
- Follow existing file structure under `apps/web/core/components/dashboards/`
- Keep files under 200 lines; modularize into config/ subdirectory

## Notes

- Phases 1-4 active (15h). Phases 5-6 deferred to future iteration.
- Phase 2 uses `react-grid-layout/Responsive` with breakpoints (lg:12, md:8, sm:4)
- Phase 1 filter options lazy-loaded on tab click from existing MobX workspace stores
- Phase 4 preview uses side-by-side layout (config left, preview right)
- Phase 5 default visibility = workspace-visible (when implemented later)

## Validation Log

### Session 1 — 2026-02-16

**Trigger:** Initial plan creation validation
**Questions asked:** 6

#### Questions & Answers

1. **[Scope]** Should we implement all 6 phases or focus on a subset for the initial release?
   - Options: Phases 1-4 only (Recommended) | All 6 phases | Phases 1-2 only
   - **Answer:** Phases 1-4 only
   - **Rationale:** Focus on high+medium priority features (15h). Shipping sharing/export can wait; core UX improvements (filters, DnD, duplicate, preview) deliver most user value.

2. **[Architecture]** For widget drag-and-drop (Phase 2), which approach should we use?
   - Options: react-grid-layout (Recommended) | Pragmatic DnD (existing) | CSS-only resize + simple reorder
   - **Answer:** react-grid-layout
   - **Rationale:** Purpose-built for dashboard grids. Handles DnD + resize + collision out of the box. Avoids building custom grid math from scratch.

3. **[Architecture]** For Phase 5 (Sharing), should dashboards default to workspace-visible or private?
   - Options: Workspace-visible (Recommended) | Private by default | Skip Phase 5 entirely
   - **Answer:** Workspace-visible
   - **Rationale:** Matches current behavior. More collaborative. Decision recorded for when Phase 5 is implemented later.

4. **[Architecture]** For widget preview (Phase 4), how should the preview panel be positioned in the config modal?
   - Options: Side-by-side (Recommended) | Stacked below config | Toggle preview tab
   - **Answer:** Side-by-side
   - **Rationale:** Best UX — user sees config and preview simultaneously. Modal widens to ~900px.

5. **[Architecture]** Should widget-level filters (Phase 1) load filter options eagerly or lazily?
   - Options: Lazy load on tab click (Recommended) | Eager load on modal open | Pre-cached from workspace stores
   - **Answer:** Lazy load on tab click
   - **Rationale:** Faster modal open time. Only fetch states/members/labels/cycles when user actually opens Filters tab.

6. **[Architecture]** For react-grid-layout in Phase 2, should we use the responsive variant?
   - Options: Yes, responsive (Recommended) | Fixed 12-column only | 12-col with min-width scroll
   - **Answer:** Yes, responsive
   - **Rationale:** Use ResponsiveGridLayout with breakpoints (lg:12col, md:8col, sm:4col). Better mobile/tablet experience.

#### Confirmed Decisions

- **Scope**: Phases 1-4 only (15h) — defer sharing & export
- **DnD Library**: react-grid-layout (new dependency) over pragmatic-drag-and-drop
- **Responsive Grid**: ResponsiveGridLayout with breakpoints
- **Filter Loading**: Lazy on Filters tab click
- **Preview Layout**: Side-by-side in wider modal
- **Default Visibility**: Workspace-visible (for future Phase 5)

#### Action Items

- [ ] Update Phase 2 to use react-grid-layout instead of pragmatic-drag-and-drop
- [ ] Update Phase 2 to use ResponsiveGridLayout with breakpoints
- [ ] Update Phase 4 preview to use side-by-side layout
- [ ] Update Phase 1 filter loading strategy to lazy
- [ ] Mark Phases 5-6 as deferred in plan.md

#### Impact on Phases

- Phase 2: Replace pragmatic-drag-and-drop with react-grid-layout/Responsive. Add breakpoints config.
- Phase 4: Config modal layout changes to side-by-side (wider modal ~900px).
- Phase 1: Filter options loaded lazily on tab activation, not eagerly.
- Phase 5: Deferred but default visibility decision documented (workspace-visible).
- Phase 6: Deferred entirely.
