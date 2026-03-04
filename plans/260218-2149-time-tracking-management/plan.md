---
title: "Time Tracking / Work Log Feature (Consolidated)"
description: "Complete worklog system: CRUD, reports, edit-from-activity, business rules, permissions, reminders, feature gating"
status: in-progress
priority: P1
effort: 26h
branch: preview
tags: [time-tracking, worklog, issues, reporting, validation, permissions, celery]
created: 2026-02-18
updated: 2026-03-04
merged-from: [260218-2149-time-tracking-management, 260303-1648-worklog-edit-from-activity]
---

# Time Tracking / Work Log (Consolidated Plan)

## Overview

Complete time tracking for Plane: worklog CRUD, time estimates, reports, edit-from-activity, business rules (max 12h/day, 7-day backdate, no future dates), permission enforcement, daily reminders, and feature flag gating. Leverages CE stubs and `is_time_tracking_enabled` project flag.

## Phases

### Group A: Core Time Tracking (from plan 260218-2149)

| #   | Phase                        | Status   | Effort | File                                               |
| --- | ---------------------------- | -------- | ------ | -------------------------------------------------- |
| 1   | Database & API (Backend)     | complete | 4h     | [phase-01](phase-01-database-and-api.md)           |
| 2   | Types, Constants & i18n      | complete | 1.5h   | [phase-02](phase-02-types-constants-i18n.md)       |
| 3   | Frontend Service & Store     | complete | 2h     | [phase-03](phase-03-frontend-service-and-store.md) |
| 4   | UI Components (Issue Detail) | complete | 4h     | [phase-04](phase-04-ui-components-issue-detail.md) |
| 5   | Time Tracking Reports        | complete | 3h     | [phase-05](phase-05-time-tracking-reports.md)      |
| 6   | Testing & Polish             | complete | 1.5h   | [phase-06](phase-06-testing-and-polish.md)         |

### Group B: Worklog Enhancements (from plan 260303-1648)

| #   | Phase                                  | Status   | Effort | File                                                     |
| --- | -------------------------------------- | -------- | ------ | -------------------------------------------------------- |
| 10  | Backend: Verify & Fix Permissions      | complete | 1h     | [phase-10](phase-10-backend-verify-permissions.md)       |
| 11  | Frontend: Wire Filters + Pagination    | complete | 1.5h   | [phase-11](phase-11-frontend-wire-filters-pagination.md) |
| 12  | Frontend: Export + i18n + Code Quality | complete | 1h     | [phase-12](phase-12-frontend-export-i18n-cleanup.md)     |
| 13  | Frontend: Edit from Activity Click     | complete | 1.5h   | [phase-13](phase-13-frontend-edit-from-activity.md)      |
| 14  | Backend: Validation Rules              | complete | 1.5h   | [phase-14](phase-14-backend-validation-rules.md)         |
| 15  | Backend: Permission Enforcement        | complete | 1h     | [phase-15](phase-15-backend-permission-enforcement.md)   |
| 16  | Frontend: Validation & UX              | complete | 1.5h   | [phase-16](phase-16-frontend-validation-ux.md)           |
| 17  | Backend: Daily Reminder Notification   | complete | 1.5h   | [phase-17](phase-17-backend-daily-reminder.md)           |

### Group C: Remaining Work (Order: 9 → 7 → 8a → 8b)

| #   | Phase                                                | Status   | Effort | File                                                |
| --- | ---------------------------------------------------- | -------- | ------ | --------------------------------------------------- |
| 9   | Feature Flag Gating & UX Guards                      | complete | 2h     | [phase-09](phase-09-feature-flag-gating.md)         |
| 7   | Overload Calculation Engine                          | pending  | 6h     | [phase-07](phase-07-overload-calculation-engine.md) |
| 8a  | Hierarchical Dashboards: L1-L2 (Team + Manager)      | pending  | 5h     | [phase-08a](phase-08a-dashboards-l1-l2.md)          |
| 8b  | Hierarchical Dashboards: L3-L5 (Director + DGD + GD) | pending  | 5h     | [phase-08b](phase-08b-dashboards-l3-l5.md)          |

## Business Rules (from Group B)

| Rule                                 | Backend                                    | Frontend                             |
| ------------------------------------ | ------------------------------------------ | ------------------------------------ |
| Max 12h (720min) per entry/day       | Serializer validates ≤ 720min              | Error toast on exceed                |
| No future dates                      | `logged_at <= today`                       | Date picker `max=today`              |
| Backdate limit: 7 working days       | Reject if `logged_at` < 7 working days ago | Date picker `min` restriction        |
| Member can't edit/delete             | Return 403 for MEMBER on PATCH/DELETE      | Hide edit/delete UI for non-admin    |
| Admin 7-day edit window              | 403 if `logged_at` > 7 working days ago    | Disable edit/delete for old worklogs |
| Daily reminder at 5PM VN (UTC 10:00) | Celery Beat → Notification + email         | Existing notification UI             |

## Permission Rules

- **Create worklog**: ADMIN + MEMBER
- **Edit/Delete own worklog**: MEMBER — NOT ALLOWED after creation
- **Edit/Delete any worklog**: ADMIN — only within 7 working days of `logged_at`
- **Older worklogs**: Locked for everyone

## Key Dependencies

- CE stubs: `apps/web/ce/components/issues/worklog/`
- Project flag: `is_time_tracking_enabled` on Project model
- Activity system: `WORKLOG` type in activity-comment-root.tsx
- Exporter: `issue_worklogs` in exporter choices
- Notification model: `plane.db.models.Notification`
- Celery Beat: configured in `plane/celery.py`

## Architecture

```
IssueWorkLog model ←→ DRF ViewSet (v0 plane/app/) ←→ worklog.service.ts ←→ MobX store ←→ CE components
Issue.estimate_time ←→ Issue serializer ←→ issue store
Celery Beat → daily reminder task → Notification model + email
```

## Confirmed Decisions (All Sessions)

### Core Architecture

- **Manual entry only** — no live timer (YAGNI)
- **v0 API layer** — `plane/app/` following IssueComment pattern
- **CE implementation** — available to all editions
- **Separate estimate_time field** — independent from story points
- **Reports as sidebar tab** — project-level, default to current cycle
- **Enabled by default** — `is_time_tracking_enabled` default = True

### Business Rules

- **720min per entry** — single entry max = daily max = 12h
- **Legacy worklogs >720min** — reject on update, force fix (no grandfathering)
- **Working days** — Mon-Fri, no holiday calendar (KISS)
- **Member permissions** — cannot edit/delete after creation (strict)

### Reminders

- **Reminder time** — UTC 10:00 (5PM Vietnam)
- **Scope** — user-level, 1 notification + 1 email per user per day
- **Message** — i18n (EN/KO/VI), friendly generic nudge, no project listing
- **Toggle** — `worklog_reminder` in UserNotificationPreference
- **Email** — must-have, investigate existing pipeline during implementation

### Feature Gating (Phase 9)

- **Sidebar** — hide when `is_time_tracking_enabled === false`
- **Log Time button** — show friendly popup when disabled
- **Route guard** — disabled message on `/time-tracking/*`
- **i18n** — EN, VI, KO translations for disabled popup

## Validation Log

> Full validation history preserved below from both original plans.

### Sessions 1-2 (2026-02-18) — Core Architecture

- **Session 1**: 5 questions — manual entry, reports location, admin visibility, estimate_time field, report default filter
- **Session 2**: 3 questions — API version (v0), CE/EE split (CE), default state (enabled)
- See original plan `260218-2149` for full Q&A

### Session 3 (2026-03-04) — Feature Flag Gating

- New requirements: sidebar gating, Log Time button popup, route guards
- Codebase audit: toggle page ✅, settings constant ✅, sidebar nav ❌, TS type ❌, button check ❌, route guard ❌, i18n ❌
- Created Phase 9

### Sessions 4-12 (2026-03-03 to 2026-03-04) — Worklog Enhancements

Merged from plan `260303-1648-worklog-edit-from-activity`:

- **Session 1**: 4Q — reminder time (UTC 10:00), member permissions (strict), duration cap (720), working days (Mon-Fri)
- **Session 2**: 4Q — bulk daily limit (yes), reminder scope (per-project→later reverted), idempotency (yes), translations (actual KO/VI)
- **Session 3**: 3Q — email method (reuse existing), email preferences (separate toggle), email content (simple CTA)
- **Session 4**: 0Q — reverted to workspace-level reminder, fixed message, toggle in Notifications
- **Session 5**: 3Q — email compatibility (investigate), CTA link (per-project), utility location (keep in serializer)
- **Session 6**: 3Q — multi-project CTA (all links), notification sender (investigate), error format (check existing)
- **Session 7**: 3Q — legacy >720min (reject), is_time_tracking_enabled (exists), email (must-have)
- **Session 8**: 0Q — reverted to user-level, 1 email/day, generic message
- **Session 9**: 3Q — MAX_DURATION=720 confirmed, email deferred to impl, notification UI deferred to impl

### Session 10 (2026-03-04) — Remaining Phases Validation

**Trigger:** Pre-implementation validation of pending Phases 7, 8, 9
**Questions asked:** 7

#### Questions & Answers

1. **[Scope]** Phase 9 (Feature Flag Gating, 2h) is independent and low-risk, while Phases 7-8 depend on bank-specific models (StaffProfile, Department, DashboardLevelMapping). Should Phase 9 be implemented first?
   - Options: Phase 9 first (Recommended) | Phase 7→8→9 as planned | Only Phase 9 for now
   - **Answer:** Phase 9 first (Recommended)
   - **Rationale:** Ship feature gating independently since it has no dependencies on bank models; unblocks QA earlier

2. **[Dependencies]** Phases 7-8 reference Department, StaffProfile, and bank hierarchy models. Do these models already exist in the codebase, or are they planned for a separate feature?
   - Options: Already exist | Planned separately | Don't exist, skip 7-8
   - **Answer:** Already exist
   - **Rationale:** Confirms Phases 7-8 can proceed without waiting for external dependencies

3. **[Architecture]** Phase 7's overload formula uses Issue.estimate_time for remaining estimate. What should happen when estimate_time is null (not set on an issue)?
   - Options: Treat as 0 (Recommended) | Exclude from calculation | Flag as 'incomplete data'
   - **Answer:** Treat as 0 (Recommended)
   - **Rationale:** KISS — no estimate means no remaining work assumed. Avoids complexity of partial data handling.

4. **[Scope]** Phase 8 creates 20+ new files across 5 dashboard levels (10h effort). Should it be split into sub-phases for incremental delivery?
   - Options: Split into 2-3 sub-phases (Recommended) | Keep as single phase | MVP: L1-L2 only
   - **Answer:** Split into 2-3 sub-phases (Recommended)
   - **Rationale:** Reduces risk, enables incremental review and testing

5. **[Architecture]** Phase 7 triggers Celery recalculation on every worklog mutation with countdown=60s debounce. For a department with 50+ members, should the Celery task recalculate the entire department or just the affected member?
   - Options: Member only + lazy dept rollup (Recommended) | Full department recalc | Member + async dept rollup
   - **Answer:** Member only + lazy dept rollup (Recommended)
   - **Rationale:** Reduces write amplification; department/org aggregation cached and computed on dashboard request

6. **[Scope]** Phase 8 sub-phase split: how should the 5 dashboard levels be grouped?
   - Options: 8a: L1-L2, 8b: L3-L5 (Recommended) | 8a: Backend all, 8b: Frontend all | 8a: L1-L3, 8b: L4-L5
   - **Answer:** 8a: L1-L2, 8b: L3-L5 (Recommended)
   - **Rationale:** Team + Manager dashboards are most-used; ship them first for early feedback

7. **[Tradeoffs]** Phase 9 route guard: when time tracking is disabled and user navigates to /time-tracking URL directly, what should happen?
   - Options: Show EmptyState with message (Recommended) | Redirect to project home | Show toast + redirect
   - **Answer:** Show EmptyState with message (Recommended)
   - **Rationale:** Follows existing Views/Cycles/Modules pattern; provides context to user about why feature is unavailable

#### Confirmed Decisions

- **Implementation order**: Phase 9 → 7 → 8a → 8b
- **Null estimate_time**: Treat as 0 (no remaining work)
- **Celery recalc scope**: Member-only + lazy dept/org rollup on dashboard read
- **Phase 8 split**: 8a (L1-L2 Team+Manager), 8b (L3-L5 Director+DGD+GD)
- **Route guard UX**: EmptyState with friendly disabled message

#### Action Items

- [ ] Split Phase 8 into phase-08a and phase-08b files
- [ ] Update Phase 7: null estimate_time → 0, member-only recalc, lazy dept rollup
- [ ] Update Phase 9: route guard = EmptyState pattern
- [ ] Update plan.md phase table to reflect new order and split

#### Impact on Phases

- Phase 7: Change pre-aggregation from eager (write dept/org rows on every mutation) to lazy (compute on dashboard request, cache). Update null estimate handling.
- Phase 8: Split into 8a (L1-L2, ~5h) and 8b (L3-L5, ~5h)
- Phase 9: Confirm route guard uses EmptyState pattern (already planned, just confirming)

## Archived Plan Reference

- Original plan 2: `plans/260303-1648-worklog-edit-from-activity/plan.md` (archived, merged here)
