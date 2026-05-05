---
title: "Workspace-Level Time Tracking"
description: "Add workspace sidebar time-tracking section reusing project-level components with cross-workspace scope"
status: completed
priority: P2
effort: 6h
branch: ngoc-feat/workspaces-default-view
tags: [time-tracking, workspace, ce-feature]
created: 2026-04-08
---

# Workspace-Level Time Tracking

## Summary

Expose project-level time-tracking UI (3 tabs: Timesheet, Analytics, Capacity) at workspace scope. Backend endpoints mostly exist; main gaps: workspace analytics endpoint, frontend pages/routes/nav.

## Data Flow

```
Sidebar click -> /:ws/time-tracking/ -> layout.tsx (3 tabs)
  Tab 1 (Timesheet) -> TimesheetGrid(defaultCrossWorkspace=true) -> fetchCrossWorkspaceTimesheet
  Tab 2 (Analytics) -> WorkspaceAnalyticsTimesheetGrid -> fetchWorkspaceAnalyticsTimesheet (NEW)
  Tab 3 (Capacity)  -> CapacityDashboard(defaultCrossWorkspace=true) -> fetchCrossWorkspaceCapacity
```

## Phases

| #   | Phase                                 | Status    | Effort | File                                                           |
| --- | ------------------------------------- | --------- | ------ | -------------------------------------------------------------- |
| 1   | Backend: Workspace Analytics Endpoint | Completed | 1h     | [phase-01](./phase-01-backend-workspace-analytics-endpoint.md) |
| 2   | Service + Store Updates               | Completed | 1h     | [phase-02](./phase-02-service-store-updates.md)                |
| 3   | Component Adaptations                 | Completed | 1.5h   | [phase-03](./phase-03-component-adaptations.md)                |
| 4   | Workspace Pages (layout/header/pages) | Completed | 1.5h   | [phase-04](./phase-04-workspace-pages.md)                      |
| 5   | Routes, Navigation, i18n              | Completed | 1h     | [phase-05](./phase-05-routes-navigation-i18n.md)               |

## Dependencies

- Phase 2 depends on Phase 1 (new endpoint URL)
- Phase 3 depends on Phase 2 (store action)
- Phase 4 depends on Phase 3 (adapted components)
- Phase 5 can start in parallel with Phase 4

## Red Team Review

### Session — 2026-04-08

**Findings:** 15 (15 accepted, 0 rejected)
**Severity breakdown:** 3 Critical, 8 High, 4 Medium

| #     | Finding                                                      | Severity | Disposition | Applied To  |
| ----- | ------------------------------------------------------------ | -------- | ----------- | ----------- |
| RT-1  | Route `:workspaceSlug/time-tracking` double-slug bug         | Critical | Accept      | Phase 05    |
| RT-2  | No pagination — unbounded data exposure                      | Critical | Accept      | Phase 01    |
| RT-3  | MEMBER horizontal privilege escalation                       | Critical | Accept      | Phase 01    |
| RT-4  | Permission class not explicitly specified                    | High     | Accept      | Phase 01    |
| RT-5  | `week_start` validation missing — DoS vector                 | High     | Accept      | Phase 01    |
| RT-6  | Rate limiting absent                                         | High     | Accept      | Phase 01    |
| RT-7  | Missing workspace capacity endpoint                          | High     | Accept      | Phase 01+02 |
| RT-8  | Error rethrow can throw `undefined`                          | High     | Accept      | Phase 02    |
| RT-9  | Store loading state desync — no error state                  | High     | Accept      | Phase 02    |
| RT-10 | `TimesheetTable` uses `row.project_id` not prop              | High     | Accept      | Phase 03    |
| RT-11 | `MemberDropdown` receives `undefined` in cross-workspace     | High     | Accept      | Phase 03    |
| RT-12 | `projectId` optional type change — call site audit missing   | High     | Accept      | Phase 03    |
| RT-13 | Issue links break at workspace scope                         | Medium   | Accept      | Phase 03    |
| RT-14 | No loading/error state in `WorkspaceAnalyticsTimesheetGrid`  | Medium   | Accept      | Phase 03    |
| RT-15 | Tab key `project_analytics` vs `analytics` mismatch          | Medium   | Accept      | Phase 04    |
| RT-16 | `Route.ComponentProps` type generation timing                | Medium   | Accept      | Phase 04    |
| RT-17 | i18n key mismatch between Phase 04 and Phase 05              | Medium   | Accept      | Phase 04+05 |
| RT-18 | `highlight` false positives with `pathname.includes`         | Medium   | Accept      | Phase 05    |
| RT-19 | Sidebar `href` is relative — workspace prefix may be missing | Medium   | Accept      | Phase 05    |

## Validation Session

### Session 1 — 2026-04-09

**Trigger:** `/ck:plan validate` pre-implementation
**Questions asked:** 4

#### Questions & Answers

1. **[RT-7]**: `fetchCrossWorkspaceCapacity` calls a backend endpoint that doesn't exist. How handle?
   - Options: Expand Phase 01 | Defer fix later | Check existing endpoint
   - **Answer:** Expand Phase 01 to include capacity endpoint
   - **Rationale:** Capacity tab won't 404 — full end-to-end coverage

2. **[RT-2]**: No pagination — unbounded rows → OOM/timeout. Add pagination?
   - Options: Add limit/offset now | Skip (YAGNI) | Pagination + rate limiting
   - **Answer:** Add limit/offset pagination now
   - **Rationale:** Prevent OOM on large workspaces

3. **[RT-3]**: MEMBER horizontal privilege escalation — see all projects' logs. Acceptable?
   - Options: Filter to ProjectMember only | ADMIN only | ADMIN + MEMBER (current plan)
   - **Answer:** Filter to user's ProjectMember only
   - **Rationale:** Respects project-level isolation for MEMBERs

4. **[RT-16]**: `Route.ComponentProps` type only generates after Phase 05. TypeScript fails in Phase 04. How handle?
   - Options: Skip type imports, use useParams() | Implement Phase 05 first | Temp type workaround
   - **Answer:** Skip type imports — use `useParams()` workaround
   - **Rationale:** Cleaner, avoids type workarounds

#### Confirmed Decisions

- RT-7 resolved: Phase 01 expands to include `WorkspaceCapacityEndpoint`
- RT-2 resolved: Pagination added to workspace analytics endpoint
- RT-3 resolved: MEMBER scoped to their ProjectMember projects
- RT-16 resolved: Phase 04 pages use `useParams()` directly, no `Route.ComponentProps`

#### Action Items

- [ ] Phase 01: Add `WorkspaceCapacityEndpoint` + pagination + MEMBER filtering + `week_start` validation
- [ ] Phase 03: Audit existing `TimesheetGrid`/`CapacityDashboard` call sites, add runtime guard
- [ ] Phase 04: Use `useParams()` in all page files — no `Route.ComponentProps` imports

#### Phase Propagation

- Phase 01: New `WorkspaceCapacityEndpoint`, pagination, permission scoping, validation
- Phase 03: Call site audit, runtime guard for optional `projectId`
- Phase 04: `useParams()` instead of type imports

---

## Risks

| Risk                                           | Likelihood | Impact | Mitigation                                                          |
| ---------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------- |
| AnalyticsTimesheetTable expects projectId prop | Medium     | Medium | Make projectId optional, show project_identifier column when absent |
| Capacity MemberDropdown requires projectId     | Medium     | Low    | Hide member filter in cross-workspace mode (already done)           |
| Route collision with existing /analytics/ path | Low        | High   | Use /time-tracking/ prefix, distinct from workspace analytics       |

## Rollback

Each phase is additive (new files/endpoints). Revert = delete new files + remove route/nav entries. No existing behavior modified destructively.

## Success Criteria

- [ ] `/:ws/time-tracking/` renders Timesheet tab with cross-workspace data
- [ ] `/:ws/time-tracking/analytics` renders workspace-scoped analytics
- [ ] `/:ws/time-tracking/capacity` renders capacity heatmap cross-workspace
- [ ] Sidebar shows "Time Tracking" nav item with Timer icon
- [ ] No regression on project-level time-tracking pages
