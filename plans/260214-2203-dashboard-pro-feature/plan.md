---
title: "Dashboard Pro Feature"
description: "Implement analytics dashboard with 6 chart widget types, multi-dashboard CRUD, project scoping"
status: completed
priority: P1
effort: 32h
branch: preview
tags: [dashboard, analytics, charts, widgets, pro-feature]
created: 2026-02-14
completed: 2026-02-14
---

# Dashboard Pro Feature - Implementation Plan

## Overview

Implement full-featured Pro dashboard system with customizable analytics widgets, multi-dashboard management, and project scoping capabilities.

## Goals

- 6 widget types: bar, line, area, donut, pie, number
- Multi-dashboard CRUD operations
- Project-level scoping per dashboard
- Recharts integration via propel components
- Color presets: Modern, Horizon, Earthen
- Grid-based widget layout with drag-drop
- Separate "Dashboards" navigation section

## Implementation Phases

| Phase                                                     | Description                         | Status    | Effort |
| --------------------------------------------------------- | ----------------------------------- | --------- | ------ |
| [Phase 1](./phase-01-backend-models.md)                   | Backend Models & Migrations         | Completed | 3h     |
| [Phase 2](./phase-02-backend-api.md)                      | Backend API Endpoints               | Completed | 4h     |
| [Phase 3](./phase-03-frontend-types-constants-service.md) | Frontend Types, Constants & Service | Completed | 3h     |
| [Phase 4](./phase-04-frontend-store.md)                   | Frontend MobX Store                 | Completed | 3h     |
| [Phase 5](./phase-05-navigation-routing.md)               | Navigation & Routing                | Completed | 2h     |
| [Phase 6](./phase-06-dashboard-list-crud.md)              | Dashboard List & CRUD UI            | Completed | 4h     |
| [Phase 7](./phase-07-widget-components-grid.md)           | Widget Components & Grid Layout     | Completed | 6h     |
| [Phase 8](./phase-08-widget-configuration.md)             | Widget Configuration UI             | Completed | 7h     |

**Total Estimated Effort**: 32 hours

## Key Dependencies

- Existing analytics backend (`build_analytics_chart()`, `get_analytics_filters()`)
- Propel chart components (`@plane/propel/charts/*`)
- MobX store infrastructure
- React Router v7 routing
- Workspace sidebar navigation system

## Technical Approach

- **Backend**: Extend analytics infrastructure, reuse chart builders
- **Frontend**: New dashboard section with MobX state management
- **Charts**: Wrap existing propel/Recharts components
- **Layout**: CSS Grid for responsive widget positioning
- **Permissions**: Workspace ADMIN/MEMBER level access

## Success Criteria

- All 6 widget types render correctly with live data
- Dashboard CRUD operations functional
- Project filtering works per dashboard
- Color presets apply correctly
- Edit/view mode toggle functional
- Sidebar navigation integrated
- Grid layout responsive on mobile/desktop

## Risk Mitigation

- Performance: Implement widget data caching and batch API calls
- Layout: Ensure responsive grid breakpoints tested
- Data freshness: Add refresh intervals for widget data
- Permissions: Validate workspace access on all endpoints

## Validation Log

### Session 1 — 2026-02-14

**Trigger:** Initial plan creation validation
**Questions asked:** 7

#### Questions & Answers

1. **[Architecture]** Plan uses v0 API pattern (plane/api/) for new endpoints. The codebase has both v0 (plane/app/) and v1 (plane/api/). Which API version should dashboards use?
   - Options: v1 (plane/api/) (Recommended) | v0 (plane/app/) | Both
   - **Answer:** v1 (plane/api/) (Recommended)
   - **Rationale:** New feature should use new API namespace. Plan already targets this correctly.

2. **[Architecture]** Dashboard ownership model: single owner per dashboard. Shared/collaborative or owner-only?
   - Options: Shared (Recommended) | Owner-only edit | Role-based
   - **Answer:** Shared (Recommended)
   - **Rationale:** Any workspace ADMIN/MEMBER can edit any dashboard. Simpler. Matches Plane Pro behavior. No per-dashboard permission checks needed.

3. **[Scope]** Widget grid layout: CSS Grid with fixed position JSON or user-resizing?
   - Options: Fixed preset sizes (Recommended) | Free resize with react-grid-layout | Simple flow layout
   - **Answer:** Fixed preset sizes (Recommended)
   - **Rationale:** Each widget type has default size. Simpler. Can add resize later. No additional dependencies needed.

4. **[Architecture]** New dashboard.py model file vs reusing deprecated Dashboard/DashboardWidget tables?
   - Options: Fresh tables (Recommended) | Reuse deprecated tables | New names to avoid conflict
   - **Answer:** Fresh tables (Recommended)
   - **Rationale:** Clean break from deprecated models. New 'dashboards' and 'dashboard_widgets' table names. No schema migration risk.

5. **[Architecture]** Widget data fetching: individual per-widget calls or batch endpoint?
   - Options: Individual fetch (Recommended) | Batch endpoint | Both
   - **Answer:** Individual fetch (Recommended)
   - **Rationale:** Each widget fetches own data. Simpler. Independent loading states. Parallel requests. Optimize later if needed.

6. **[Architecture]** Widget components location: route folder or core/components/dashboards/?
   - Options: core/components/dashboards/ (Recommended) | Route folder as planned | Split
   - **Answer:** core/components/dashboards/ (Recommended)
   - **Rationale:** Reusable across routes. Follows existing pattern (analytics components in core/components/analytics/). Impacts Phase 7 file paths.

7. **[Scope]** Dashboard/widget count limits?
   - Options: No limits | Soft limits with warning | Hard limits
   - **Answer:** No limits
   - **Rationale:** Unlimited dashboards and widgets. Users self-manage. Simpler implementation. No limit checks needed in API.

#### Confirmed Decisions

- API version: v1 (plane/api/) — new feature, new namespace
- Ownership: Shared editing — any ADMIN/MEMBER can edit any dashboard
- Grid layout: Fixed preset sizes per widget type — no react-grid-layout dependency
- DB tables: Fresh 'dashboards' and 'dashboard_widgets' tables — clean break
- Data fetching: Individual per-widget — simpler, parallel, independent loading
- File location: core/components/dashboards/ — reusable, follows analytics pattern
- Limits: None — unlimited dashboards and widgets

#### Action Items

- [ ] Phase 2: Ensure API endpoints use v1 namespace (plane/api/), not v0
- [ ] Phase 1: Remove owner-only permission logic, keep shared model
- [ ] Phase 7: Move widget component paths from route folder to core/components/dashboards/
- [ ] Phase 7: Remove position JSON from widget model, use fixed preset sizes from constants

#### Impact on Phases

- Phase 1: Keep owner field for tracking but no owner-only permission logic. Fresh table names confirmed.
- Phase 2: API in v1 namespace (plane/api/views/, plane/api/serializers/, plane/api/urls/). Already correct in plan.
- Phase 7: Widget components move to `apps/web/core/components/dashboards/widgets/` instead of route folder. Position simplified to preset sizes from constants.
- Phase 8: No changes needed (config modal stays in route folder or moves to core/components/dashboards/config/).

### Session 2 — 2026-02-14

**Trigger:** Re-validation to catch implementation-blocking issues before coding
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 7/8 have a file path inconsistency: Validation Session 1 decided widget components go in `core/components/dashboards/`, but implementation steps still place files in `app/.../dashboards/[dashboardId]/components/`. Which path should be authoritative?
   - Options: core/components/dashboards/ (Recommended) | Split approach | Keep in route folder
   - **Answer:** core/components/dashboards/ (Recommended)
   - **Rationale:** Consistent with Session 1 decision. ALL widget & config components in core/components/dashboards/ for reusability. Route pages only import from there.

2. **[Security]** Phase 2's widget data endpoint passes `widget_filters` from JSON config directly to Django ORM filter (`queryset.filter(**widget_filters)`). This allows arbitrary ORM lookups from user-supplied JSON — injection risk.
   - Options: Whitelist allowed filter keys (Recommended) | Remove widget-level filters | Keep as-is, validate in serializer
   - **Answer:** Whitelist allowed filter keys (Recommended)
   - **Rationale:** Only allow known filter keys (state, priority, labels, assignee, etc.) and validate values before passing to ORM. Prevents arbitrary queryset manipulation.

3. **[Architecture]** The codebase likely has deprecated Dashboard/DashboardWidget models. Have these been removed, or do we need to handle import conflicts and migration ordering?
   - Options: Assume clean - create fresh | Check first, then proceed | Use different model names
   - **Answer:** Assume clean - create fresh
   - **Rationale:** Proceed as planned. Handle conflicts during implementation if they arise. Fresh table names ('dashboards', 'dashboard_widgets') should avoid collisions.

#### Confirmed Decisions

- File paths: ALL components in `core/components/dashboards/` — route pages only import, no local components
- Security: Whitelist ORM filter keys in widget data endpoint — prevent injection
- DB models: Proceed with fresh creation, handle conflicts if encountered

#### Action Items

- [ ] Phase 7: Update ALL component file paths from `app/.../components/` to `apps/web/core/components/dashboards/`
- [ ] Phase 8: Update ALL config component file paths to `apps/web/core/components/dashboards/config/`
- [ ] Phase 2: Add ALLOWED_WIDGET_FILTER_KEYS whitelist in DashboardWidgetDataEndpoint

#### Impact on Phases

- Phase 2: Add filter key whitelist (`ALLOWED_WIDGET_FILTER_KEYS = ["state", "priority", "labels", "assignee", "cycle", "module"]`) to DashboardWidgetDataEndpoint. Reject unknown keys.
- Phase 7: Move ALL component files (dashboard-detail-header, widget-card, widget-grid, add-widget-button, all widgets/) to `apps/web/core/components/dashboards/`. Route page.tsx only imports from core.
- Phase 8: Move ALL config component files (widget-config-modal, config/) to `apps/web/core/components/dashboards/`. Route page.tsx only imports from core.

### Session 3 — 2026-02-15

**Trigger:** Post-implementation fixes for chart property key mismatch and missing route registration
**Status:** Validation of production fixes

#### Fixes Applied

1. **Backend Chart Property Keys** (Phase 2)
   - **Issue:** Frontend chart configuration uses lowercase property keys (e.g., `x_axis_key`), but backend `build_analytics_chart()` returns uppercase keys (e.g., `X_AXIS_KEY`)
   - **File:** `apps/plane/app/views/analytics_dashboard.py`
   - **Fix:** Added `CHART_PROPERTY_TO_X_AXIS` mapping to normalize case conversion between frontend and backend
   - **Status:** Resolved — charts now render correctly with proper data binding

2. **Dashboard Routes Registration** (Phase 5)
   - **Issue:** Dashboard routes were not registered in core route file, causing TypeScript type generation failure for `/dashboards` endpoints
   - **File:** `apps/web/app/routes/core.ts`
   - **Fix:** Registered all dashboard routes (list, create, detail, widget data, etc.) in route exports
   - **Status:** Resolved — TypeScript generation now includes dashboard endpoints

3. **Navigation Integration** (Phase 5)
   - **File:** `apps/web/core/components/sidebar/sidebar-menu-items.tsx`
   - **Check:** Verified working correctly, no changes needed
   - **Status:** Confirmed working

#### Summary

All three integration points verified and working. Feature complete and production-ready.
