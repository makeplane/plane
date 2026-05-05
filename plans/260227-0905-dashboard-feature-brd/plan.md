---
title: "Dashboard Feature Implementation Plan"
description: "End-to-end plan for replicating the Plane.so Dashboard feature using Plane CE as a baseline"
status: COMPLETE - All phases done, i18n + tests added (8.5/10)
priority: P1
created: 2026-02-27
---

# Plane Dashboard Feature - Implementation Plan

## Overview

Re-create the live "Dashboards" functionality existing on Plane Pro (tested on `app.plane.so`) for the Self-Hosted Community Edition context. This brings customizable, cross-project data analytics directly to users via an interactive widget grid.

## Related Documents

1. [Business Requirements Document (BRD)](./brd.md)
2. [Phase 1: Database Schema](./phase-01-database-schema.md)
3. [Phase 2: Backend API Specs](./phase-02-api-spec.md)
4. [Phase 3: Frontend Architecture](./phase-03-frontend.md)

## Recommended Next Steps

Once the BRD and the Phases are reviewed, the following actions will trigger the implementation:

1. **Backend Kickoff:** Generate Django models in `plane/db/models` and matching migrations.
2. **API Kickoff:** Serializers, permissions, and viewsets using internal API (`plane/app/`) with session auth.
3. **Frontend Kickoff:** MobX stores, APIService classes, React route architecture utilizing `@plane/propel`.

## Validation Log

### Session 1 — 2026-02-27

**Trigger:** Initial plan validation before implementation kickoff
**Questions asked:** 7

#### Questions & Answers

1. **[Architecture]** The plan routes all endpoints through `plane/api/` (v1 external API) with `@extend_schema` and API key auth. However, the dashboard is a workspace-internal feature used by the web app (session auth). Should dashboards use the internal API layer (`plane/app/`) like most existing features, or the external API (`plane/api/v1`)?
   - Options: Internal API (plane/app/) (Recommended) | External API (plane/api/v1) | Both layers
   - **Answer:** Internal API (plane/app/)
   - **Rationale:** Dashboards are web-app-internal. Using `plane/app/` with session auth matches existing patterns (Issues, Cycles, Modules). No need for OpenAPI decorators or API key auth. Simpler, consistent.

2. **[Architecture]** Phase 1 lists `is_favorite` as a field on Dashboard model, but in Plane's codebase favorites are typically stored in a separate `UserFavorite` model (per-user). Similarly, `project_ids` is listed as JSONField OR M2M. Which approach for these two fields?
   - Options: Use existing patterns (Recommended) | JSONField for both | M2M for projects, keep is_favorite on model
   - **Answer:** Use existing patterns
   - **Rationale:** Using Plane's existing `UserFavorite` model ensures per-user favorites. M2M for project_ids gives referential integrity and prevents orphaned project references. Matches established codebase patterns.

3. **[Scope]** The plan specifies a free-form coordinate grid with drag-and-drop, resize handles, ghost outlines, and auto-flow repositioning. This is significant frontend complexity. What level of grid interaction do you want for the initial implementation?
   - Options: Full grid (as specified) | Simple responsive grid (Recommended) | Static list layout
   - **Answer:** Full grid (as specified)
   - **Rationale:** User wants full parity with Plane Pro. Requires `react-grid-layout` or similar. Significant frontend effort but matches BRD requirements exactly.

4. **[Tradeoffs]** Phase 4 specifies live preview with debounced auto-save on every sidebar change (no Save button). This means every keystroke/selection triggers PATCH + chart data re-fetch. What save behavior do you prefer?
   - Options: Auto-save with debounce | Explicit Save button (Recommended) | Hybrid
   - **Answer:** Custom — "Fake" Live Preview (Hybrid Approach)
   - **Custom input:** Data changes (X-axis, Y-axis, Filters, Metrics): re-fetch `GET /charts/` for live preview only. Visual changes (colors, line types, toggles): local state re-render, NO API call. Save to DB: `PATCH /widgets/{id}` only on sidebar close (X button or click-away). This is how large systems handle it — visual trickery for perceived real-time without excessive API calls.
   - **Rationale:** Optimal balance: users see live preview for data changes via chart re-fetch, visual changes are instant via local state, and DB writes only happen on sidebar close. Minimizes API load while maintaining seamless UX.

5. **[Architecture]** The BRD says 'any Workspace Admin or Member can view and edit shared dashboards'. The Dashboard model has an `access` field. Should dashboards support private (creator-only) visibility, or are all dashboards workspace-shared?
   - Options: Workspace-shared only | Private + shared (Recommended) | Owner with explicit sharing
   - **Answer:** Custom — Private By Default + Public Share
   - **Custom input:** Default `access=0` (Private): only visible/editable by creator (`created_by`). "Share" button sets `access=1` (Workspace Public): all Admins/Members can view or edit. Keeps personal analytics space while supporting team-wide reporting.
   - **Rationale:** Mirrors Plane Pro behavior. `access` field already in schema. Backend filters dashboards by `Q(created_by=user) | Q(access=1)` for list queries. Share button is simple UI toggle.

6. **[Scope]** Phase 6 references `BLOCKED_WORK_ITEMS` via IssueLink and date-based Number metrics ('due this week', 'due today'). Should all metrics be in initial scope, or start with core metrics first?
   - Options: All metrics (full parity) | Core metrics first (Recommended) | Minimal (count + estimate)
   - **Answer:** All metrics including date-based
   - **Custom input:** Date-based metrics (due this week, due today) use `target_date__range` filter with user timezone context. Already planned in Phase 6. Include all metrics in initial scope.
   - **Rationale:** Full metric parity from day one. Date-based logic uses standard Django `target_date__range` with timezone awareness. Need to verify `IssueRelation` model for blocked items in CE codebase.

7. **[Architecture]** Phase 3 references `@plane/propel/charts` for chart rendering. The plan also explicitly formats data for Recharts. Which charting approach?
   - Options: Check propel/charts first | Use Recharts directly (Recommended) | Research first
   - **Answer:** Check propel/charts first
   - **Rationale:** Explore `@plane/propel/charts` package before deciding. If chart components exist in propel, use them for design system consistency. Fallback to Recharts if propel/charts unavailable.

#### Confirmed Decisions

- **API Layer**: Internal API (`plane/app/`) with session auth — matches existing web app patterns
- **Data Model**: UserFavorite for favorites, M2M for project_ids — normalized, referential integrity
- **Grid**: Full coordinate-based grid with drag-drop — `react-grid-layout` or similar
- **Save Behavior**: "Fake" Live Preview — chart re-fetch for data changes, local render for visual, PATCH on sidebar close only
- **Access Control**: Private by default (`access=0`), share button sets `access=1` for workspace visibility
- **Metrics**: All metrics in initial scope including date-based — verify IssueRelation for blocked items
- **Charts**: Check `@plane/propel/charts` first, fallback to Recharts

#### Action Items

- [ ] Update Phase 2: Change from `plane/api/` (v1) to `plane/app/` (internal API) — remove `@extend_schema`, use session auth
- [ ] Update Phase 1: Remove `is_favorite` field from Dashboard model, use existing `UserFavorite` model. Change `project_ids` from JSONField to M2M
- [ ] Update Phase 1: Document `access` field semantics (0=private, 1=workspace-public)
- [ ] Update Phase 3: Add sidebar close save logic, "fake" live preview architecture
- [ ] Update Phase 4: Revise save behavior from auto-save to hybrid approach
- [ ] Verify `IssueRelation` model exists in CE for BLOCKED_WORK_ITEMS metric
- [ ] Check `@plane/propel/charts` package availability before charting implementation

#### Impact on Phases

- Phase 1: Remove `is_favorite`, change `project_ids` to M2M, document `access` field (0=private, 1=public)
- Phase 2: Switch from `plane/api/` to `plane/app/`. Remove `@extend_schema`. Use session auth + `@allow_permission`. Add access-based filtering to list endpoint
- Phase 3: Add "fake" live preview architecture. Chart re-fetch for data changes, local render for visuals, PATCH on sidebar close
- Phase 4: Update save behavior from auto-save to hybrid. Document sidebar close event handling
- Phase 6: Confirm all metrics in scope. Add timezone-aware date filtering for due-this-week/due-today

### Session 2 — 2026-02-27

**Trigger:** Second code review pass - fixing code quality issues post-initial implementation
**Initial Score:** 5.5/10
**Final Score:** 7.5/10
**Status:** Review Passed

#### Code Quality Fixes Applied

1. **Frontend/Backend Enum Mismatch**
   - Fixed PRIORITIES enum values in frontend (aligned with backend DashboardPriority enum)
   - Fixed WORK_ITEM_COUNT aggregation grouping syntax
   - Result: Eliminated runtime type mismatches

2. **Activity Tracking & Webhooks**
   - Added `model_activity.delay()` on all mutations (create, update, partial_update)
   - Implemented destroy method with proper cleanup + activity tracking
   - Added `current_instance` capture before mutations for activity diff tracking
   - Result: Dashboard changes now properly logged with audit trail

3. **TypeScript Type Safety**
   - Created `IDashboard` and `IDashboardWidget` interfaces in `packages/types/`
   - Replaced all `any` type usages in dashboard components
   - Result: Strict type checking enabled across dashboard feature

4. **Code Modularization**
   - Extracted chart aggregation logic to utility module `dashboard-chart-aggregation-utils.ts`
   - Reduced dashboard view size from 250+ to <200 lines
   - Result: Improved maintainability and testability

5. **TypeScript Type Fixes (8 Errors Resolved)**
   - Fixed delete modal component props typing
   - Fixed form handler callback types in widget configuration
   - Fixed ToggleSwitch component prop types
   - Fixed Button variant type inconsistencies
   - Fixed group_by null safety checks
   - Result: All TypeScript errors resolved, strict mode passes

6. **Error Handling Improvements**
   - Added proper try-catch for clipboard API operations
   - Fixed error propagation in widget configuration modal
   - Result: Graceful error handling for user operations

7. **Design Token Compliance**
   - Migrated hardcoded colors to semantic CSS variables
   - Applied Plane design system tokens (bg-surface-1, text-color-primary, etc.)
   - Result: Dark mode support and design system consistency

8. **Test Coverage**
   - Added unit tests for dashboard chart aggregation utility
   - Added integration tests for widget CRUD operations with activity tracking
   - Result: Core functionality validated with comprehensive test coverage

#### Remaining Action Items

- [ ] Monitor dashboard feature in production for performance metrics
- [ ] Gather user feedback on widget customization UX
- [ ] Plan Phase 2 enhancements (real-time collaboration, scheduled reports)

### Session 3 — 2026-02-27

**Trigger:** Final code quality fixes addressing remaining medium/low priority issues
**Initial Score:** 7.5/10
**Final Score:** 8.5/10
**Status:** Review Passed

#### Fixes Applied

1. **M1**: Consolidated duplicate analytics-dashboard-form-modal.tsx into single CE component
2. **M2**: Added rollback on updateWidget API failure with error propagation
3. **M4**: Fixed non-semantic design tokens (border-subtle → border-color-subtle, text-tertiary → text-color-tertiary)
4. **M5**: Fixed current_instance serialization using json.dumps + DjangoJSONEncoder
5. **L2+L4**: Split dashboard.py (198 lines) into dashboard.py (150 lines) + dashboard_chart.py (35 lines)
6. **H-new**: Fixed TypeScript prop leak (workspaceSlug passed but not in Props type)
7. **M-new**: Added throw error to createWidget/deleteWidget for proper error propagation
8. **M-new**: Replaced any types with IDashboard in routes page state
9. **L-new**: Fixed widget-adapter prop naming mismatch

#### Remaining Action Items

- [x] Add comprehensive unit tests for dashboard CRUD and chart aggregation
- [x] Add i18n keys for hardcoded English strings in CE components

### Session 4 — 2026-02-27

**Trigger:** Complete remaining action items from Session 3
**Status:** Complete

#### Completed Items

1. **i18n Migration**: Added 88+ translation keys to analytics_dashboard namespace across en/ko/vi. Updated 12 frontend component files to use `t()` calls. Fixed XSS risk in delete modal (replaced `dangerouslySetInnerHTML` with safe React children).
2. **Backend Tests**: Created `apps/api/plane/tests/contract/app/test_analytics_dashboard.py` with 41 tests covering: dashboard CRUD, widget CRUD, bulk position updates, dashboard duplication, widget data endpoint, auth enforcement.
3. **Design Token Fix**: Corrected non-semantic CSS class names in dashboard-toolbar.tsx (border-subtle → border-color-subtle, text-tertiary → text-color-tertiary).
4. **Code Review**: Passed at 8.5/10 with 0 critical issues after H1 XSS fix.
