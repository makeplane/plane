---
title: "Head Office - Management Analytics Dashboard"
description: "Cross-workspace analytics dashboard for managers based on org chart hierarchy scope"
status: pending
priority: P1
effort: 54h
branch: develop
tags: [analytics, dashboard, head-office, cross-workspace, management]
created: 2026-03-08
---

# Head Office - Management Analytics Dashboard

## Summary

Management analytics dashboard at `/:workspaceSlug/head-office/`. 4 tabs: Overview | Workspaces | Staff | Reports. Managers see aggregated KPIs across ALL workspaces under their management scope (dept hierarchy). Instance admins see everything. Manager + Admin only.

## Dependency

**BLOCKED BY** [Department-Workspace Migration](../260307-1053-dept-workspace-migration/plan.md) (all 6 phases). After migration: Department has `linked_workspace` OneToOne, StaffProfile is instance-level with `is_department_manager` boolean, max 6-level dept tree.

## Phases

| #   | Phase                                                                                                        | Effort | Status  |
| --- | ------------------------------------------------------------------------------------------------------------ | ------ | ------- |
| 1   | [Backend Scope Resolution & Core APIs](./phase-01-backend-scope-resolution-core-apis.md)                     | 6h     | pending |
| 2   | [Backend Activity & Analytics APIs](./phase-02-backend-activity-analytics-apis.md)                           | 4h     | pending |
| 3   | [Frontend MVP - Page & Summary](./phase-03-frontend-mvp-page-summary.md)                                     | 5h     | pending |
| 4   | [Frontend MVP - Activity & Cycles](./phase-04-frontend-mvp-activity-cycles.md)                               | 3h     | pending |
| 5   | [Frontend Analytics - Staff & Trends (P2)](./phase-05-frontend-analytics-staff-trends.md)                    | 4h     | pending |
| 6   | [Backend Workspace Drill-down APIs](./phase-06-backend-workspace-drilldown-apis.md)                          | 4h     | pending |
| 7   | [Backend Staff Search + Profile APIs](./phase-07-backend-staff-search-profile-apis.md)                       | 5h     | pending |
| 8   | [Backend Comparison + Reports APIs](./phase-08-backend-comparison-reports-apis.md)                           | 6h     | pending |
| 9   | [Frontend Tab Navigation + Workspaces Drill-down](./phase-09-frontend-tab-navigation-workspace-drilldown.md) | 5h     | pending |
| 10  | [Frontend Staff Tab + Profile Panel](./phase-10-frontend-staff-tab-profile-panel.md)                         | 5h     | pending |
| 11  | [Frontend Comparison View](./phase-11-frontend-comparison-view.md)                                           | 3h     | pending |
| 12  | [Frontend Reports Tab + PDF Export](./phase-12-frontend-reports-tab-pdf-export.md)                           | 4h     | pending |

## Key Dependencies

- Phase 1-2: backend, sequential (Phase 2 uses scope util from Phase 1)
- Phase 3-4: frontend, sequential (Phase 4 extends Phase 3 components)
- Phase 5: deferrable (P2), depends on Phase 2 + Phase 3
- Phase 6-7-8: backend, parallel (all use HeadOfficeBaseView from Phase 1)
- Phase 9: depends on Phase 3 + Phase 6 (refactors page, consumes drill-down APIs)
- Phase 10: depends on Phase 3 + Phase 7 (extends page, consumes staff APIs)
- Phase 11: depends on Phase 8 + Phase 9 (comparison API + tab structure)
- Phase 12: depends on Phase 8 + Phase 9 (report API + tab structure)

## Architecture

```
Browser -> /:workspaceSlug/head-office/ (4 tabs)

Overview tab (Phase 3-5):
  GET /head-office/summary/
  GET /head-office/workspaces/
  GET /head-office/activity/
  GET /head-office/staff-analytics/
  GET /head-office/cycles/

Workspaces tab (Phase 6, 9, 11):
  GET /head-office/workspaces/<ws_id>/projects/
  GET /head-office/workspaces/<ws_id>/members/
  GET /head-office/compare/?workspace_ids=id1,id2,id3

Staff tab (Phase 7, 10):
  GET /head-office/staff/?search=&department=&page=
  GET /head-office/staff/<staff_id>/profile/
  GET /head-office/staff/<staff_id>/activity/

Reports tab (Phase 8, 12):
  POST /head-office/reports/generate/
  GET  /head-office/reports/<report_id>/

Server: scope_resolution(user) -> workspace_ids[]
Celery: async PDF generation (weasyprint HTML->PDF->S3)
```

## Permission Model

| Role               | Scope                                         | Staff Details |
| ------------------ | --------------------------------------------- | ------------- |
| Instance Admin     | ALL workspaces                                | Full          |
| Department Manager | own dept + ALL descendants' linked_workspaces | Full          |
| Regular Staff      | NO ACCESS (use existing Analytics page)       | N/A           |

## Risk Summary

- Cross-workspace queries may be slow (mitigate: pagination, annotations, select_related)
- Scope resolution recursive query (mitigate: max 6 levels, iterative BFS)
- weasyprint system deps for PDF (mitigate: Dockerfile setup, test in CI)
- No staff profile = no head-office access (mitigate: graceful 403)

---

## Validation Log

### Session 1 — 2026-03-08 (4 questions)

**Confirmed Decisions:**

- Navigation: Static sidebar item ngang hàng Projects/Org Chart
- Access: Manager + Admin only (regular staff dùng Analytics page)
- Metrics: Completion rate = 30-day window
- Charts: recharts (already in codebase, ^2.15.1)

**Impact:** Phase 1 adds 403 for non-manager + 30-day completion window. Phase 3 uses STATIC sidebar + ADMIN-only access. Phase 5 uses recharts BarChart.

### Session 2 — 2026-03-09

**Trigger:** Pre-implementation validation — review architecture, scope, assumptions, risks
**Questions asked:** 6

#### Questions & Answers

1. **[Architecture]** head_office.py will accumulate 10+ endpoint classes across Phases 1-8 (easily 500+ lines). HeadOfficeStore similarly grows to 30+ observables across Phases 3-12. Both violate the <200 line rule. How should we split them?
   - Options: Split by domain | Split by phase | Don't split, accept large files
   - **Answer:** Split by domain
   - **Rationale:** Backend: head_office_core.py, head_office_staff.py, head_office_reports.py. Store: head-office-overview.store.ts, head-office-staff.store.ts, head-office-reports.store.ts. Each file focused on one tab's concerns. Keeps files under 200 lines.

2. **[Architecture]** Sidebar uses EUserWorkspaceRoles.ADMIN access check, but department managers who aren't workspace admins won't see the nav item. How to handle navigation visibility gap?
   - Options: Show for all members | ADMIN-only sidebar | Add API check for visibility
   - **Answer:** Add API check for visibility
   - **Rationale:** Fetch /head-office/access-check/ on sidebar mount to determine visibility. Most accurate — only shows nav for users who actually have access. Requires new lightweight endpoint in Phase 1.

3. **[Risk]** Phase 8 adds weasyprint for PDF generation (requires cairo, pango system deps). Is PDF export needed for MVP or can it be deferred?
   - Options: Defer PDF to post-MVP | Keep weasyprint approach | Client-side PDF instead
   - **Answer:** Keep weasyprint approach
   - **Rationale:** Server-side PDF via weasyprint produces high-quality output. Accept deployment complexity — document Dockerfile deps clearly.

4. **[Scope]** 12 phases at 54h total. What's the realistic MVP scope?
   - Options: Phases 1-4 only (18h) | Phases 1-9 (41h) | All 12 phases (54h)
   - **Answer:** All 12 phases
   - **Rationale:** Ship complete feature. All tabs and capabilities included in first release.

5. **[Performance]** Multiple endpoints aggregate data across ALL managed workspaces. No caching strategy mentioned. How to handle performance?
   - Options: Django cache framework | No caching for now | Materialized view / periodic task
   - **Answer:** Django cache framework
   - **Rationale:** Cache summary/workspace results in Redis with 5-min TTL per user+scope. Low complexity, acceptable staleness for dashboard data.

6. **[Code Quality]** Phase 1 scope resolution has dead code: unreachable else branch after `if not is_department_manager: return []`, and undefined `current_workspace_id`. Fix in plan?
   - Options: Fix in plan now | Fix during implementation
   - **Answer:** Fix in plan now
   - **Rationale:** Clean pseudocode prevents implementing bugs. Remove dead branch, add current_workspace_id as function parameter.

#### Confirmed Decisions

- File splitting: domain-based split for backend views and frontend stores/services
- Sidebar visibility: API-based access check endpoint
- PDF export: weasyprint, full implementation
- Scope: all 12 phases, no deferral
- Caching: Django cache framework, Redis, 5-min TTL
- Code fix: clean up scope resolution algorithm in plan

#### Action Items

- [ ] Phase 1: Add /head-office/access-check/ endpoint
- [ ] Phase 1: Fix scope resolution dead code + add current_workspace_id param
- [ ] Phase 1: Add Django cache setup for head-office endpoints
- [ ] Phase 1, 6, 7, 8: Split head_office.py into head_office_core.py, head_office_staff.py, head_office_reports.py
- [ ] Phase 3: Replace ADMIN-only sidebar with API-based visibility check
- [ ] Phase 3, 9, 10, 12: Split HeadOfficeStore into domain-specific stores
- [ ] Phase 2: Add caching to activity/analytics/cycles endpoints

#### Impact on Phases

- Phase 1: Fix scope resolution pseudocode (remove dead branch, add current_workspace_id param). Add /head-office/access-check/ endpoint. Add Django cache to summary/workspaces endpoints (5-min TTL). File: head_office_core.py (not head_office.py).
- Phase 2: Add caching to activity, staff-analytics, cycles endpoints. File: head_office_core.py.
- Phase 3: Replace EUserWorkspaceRoles.ADMIN sidebar check with async API access check on mount. Store split: head-office-overview.store.ts for overview tab concerns.
- Phase 6: File: head_office_core.py (drill-down endpoints stay with core workspace concerns).
- Phase 7: File: head_office_staff.py (staff search + profile + activity).
- Phase 8: File: head_office_reports.py (comparison + report generation + status).
- Phase 9: Store split: workspace drill-down state in head-office-workspaces.store.ts.
- Phase 10: Store split: staff tab state in head-office-staff.store.ts.
- Phase 11: Comparison state in head-office-workspaces.store.ts.
- Phase 12: Reports state in head-office-reports.store.ts.
