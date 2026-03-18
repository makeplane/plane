---
title: "Worklog Modification Reason + Validation UX + Activity Scalability"
description: "Mandatory reason for edit/delete, specific validation errors, admin audit trail, collapsible worklog groups"
status: complete
priority: P2
effort: 9h (revised from 9h — merged Phases 4+6, renumbered 7→6)
branch: develop
tags: [worklog, time-tracking, audit, backend, frontend, ux]
created: 2026-03-17
---

# Worklog Modification Reason + Validation UX + Activity Scalability

## Summary

1. Add mandatory "reason" text input for admin edit/delete of worklogs
2. Fix generic validation error toasts → show specific error messages
3. Admin modification/deletion history visible to all members in activity feed
4. Collapsible worklog groups when activity feed has many time logs
5. Update edit window from 7 → 60 working days (backend + frontend)

## Key Architecture Decisions

- **No model change** to `IssueWorkLog` — reason stored in `requested_data` JSON passed to `issue_activity.delay()`
- Backend validates non-empty `reason` on PATCH/DELETE
- Add `worklog.activity.updated` and `worklog.activity.deleted` handlers to `ACTIVITY_MAPPER` → creates `IssueActivity` records visible to all members
- Frontend `extractApiError()` utility handles both DRF serializer and view-level error formats
- Collapsible groups: frontend-only, groups >3 consecutive worklogs into expandable summary
- **Edit window**: 60 working days (changed from 7) — update `get_min_allowed_date()` default + `isWithinEditWindow()` default

## Phases

| #   | Phase                                             | Status   | Effort | File                                                   |
| --- | ------------------------------------------------- | -------- | ------ | ------------------------------------------------------ |
| 1   | Backend: reason validation + 60-day window        | complete | 1.5h   | [phase-01](./phase-01-backend-reason-validation.md)    |
| 2   | Frontend: edit modal reason field                 | complete | 1h     | [phase-02](./phase-02-frontend-edit-modal-reason.md)   |
| 3   | Frontend: delete confirmation dialog              | complete | 1h     | [phase-03](./phase-03-frontend-delete-confirmation.md) |
| 4   | Audit trail + reason display in activity feed     | complete | 2.5h   | [phase-04](./phase-04-audit-trail-activity-feed.md)    |
| 5   | Validation error UX (specific toast messages)     | complete | 1h     | [phase-05](./phase-05-validation-error-ux.md)          |
| 6   | Worklog activity scalability (collapsible groups) | complete | 2h     | [phase-06](./phase-06-worklog-activity-scalability.md) |

## Dependencies

```
Phase 1 (backend) ─┬─→ Phase 2 (edit modal reason)
                   ├─→ Phase 3 (delete confirmation reason)
                   └─→ Phase 4 (audit trail + reason display)
Phase 5 (validation UX) — independent, parallel with any phase
Phase 6 (scalability) — depends on Phase 4 (must not collapse audit entries)
Phases 2, 3, 5 can run in parallel
```

## Edit Window Change (7 → 60 working days)

Update these locations:

- Backend: `apps/api/plane/app/serializers/worklog.py` → `get_min_allowed_date()` default param: `7` → `60`
- Backend: `apps/api/plane/app/views/issue/worklog.py` → `_check_edit_window()` call: `working_days=7` → `working_days=60`
- Backend: `apps/api/plane/app/views/workspace/time_tracking/timesheet_bulk.py` → `get_min_allowed_date(working_days=7)` → `60`
- Frontend: `apps/web/ce/components/issues/worklog/utils/worklog-date-utils.ts` → `getMinAllowedDate(workingDays = 7)` → `60`, `isWithinEditWindow(loggedAt, workingDays = 7)` → `60`
- Backend serializer validation message: update "7 working days" → "60 working days"

## Constraints

- No new DB migration needed
- No IssueWorkLog model changes
- Admin-only edit/delete (already gated)
- i18n keys needed for en/vi/ko translations
- **Atomic deploy**: Backend + frontend must ship together (reason validation is breaking change)

## Validation Log

### Session 1 — 2026-03-17

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Scope]** Phase 4 and Phase 6 overlap significantly — both add IssueActivity mapper functions for worklog edit/delete and display reasons in the activity feed. Phase 4 even concludes with the same architecture as Phase 6. Should they be merged into a single phase?
   - Options: Merge into one phase (Recommended) | Keep separate phases | Drop Phase 4 entirely
   - **Answer:** Merge into one phase
   - **Rationale:** Eliminates duplication and conflicting implementation notes. Both phases add the same mapper functions and render the same data.

2. **[Risk]** Backend reason validation (Phase 1) is a breaking change — PATCH/DELETE will fail without reason field. The plan says 'deploy together' but has no fallback. How should we handle the deploy risk?
   - Options: Deploy atomically (Recommended) | Make reason optional initially | Feature flag on backend
   - **Answer:** Deploy atomically
   - **Rationale:** Simple approach, no extra code. Backend + frontend ship in same release.

3. **[Assumptions]** Edit window changes from 7 to 60 working days (~3 months). This is an 8.5x increase. Is 60 the confirmed number, and are there concerns about allowing edits to very old worklogs?
   - Options: 60 working days confirmed | Make it configurable per-project | Use a different number
   - **Answer:** 60 working days confirmed
   - **Rationale:** Business requirement confirmed. No need for per-project configuration.

4. **[Scope]** Phase 7 (collapsible worklog groups) is P2, adds ~2h effort, and requires modifying the activity store's data structure. Should it ship in this PR or be deferred?
   - Options: Defer to separate PR (Recommended) | Include in this PR | Drop Phase 7 entirely
   - **Answer:** Include in this PR
   - **Rationale:** Users get the full experience — audit trail + scalable feed — in one release.

#### Confirmed Decisions

- **Phase merge**: Phases 4+6 → single Phase 4 "Audit trail + reason display"
- **Deploy strategy**: Atomic deploy, no feature flag
- **Edit window**: 60 working days confirmed
- **Phase 7 scope**: Included in this PR (renumbered to Phase 6)

#### Action Items

- [x] Merge Phase 4 + Phase 6 content into single phase file
- [x] Renumber Phase 7 → Phase 6
- [x] Update dependencies graph
- [x] Add atomic deploy constraint

#### Impact on Phases

- Phase 4: Merged with Phase 6 → new file `phase-04-audit-trail-activity-feed.md` combining backend mapper + frontend rendering
- Phase 6 (old): Removed as standalone, content merged into Phase 4
- Phase 7 (old): Renumbered to Phase 6, file renamed to `phase-06-worklog-activity-scalability.md`
