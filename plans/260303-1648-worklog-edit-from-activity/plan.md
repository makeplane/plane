---
title: "Worklog Feature: Edit from Activity + Business Rules + Reminders"
description: "ARCHIVED — merged into plans/260218-2149-time-tracking-management (consolidated plan)"
status: archived
priority: P2
effort: 8-10h
branch: develop
tags: [worklog, activity, edit, settings, validation, permissions, celery]
created: 2026-03-03
archived: 2026-03-04
merged-into: plans/260218-2149-time-tracking-management
---

# Worklog Feature Completion (ARCHIVED)

> **This plan has been merged into [260218-2149-time-tracking-management](../260218-2149-time-tracking-management/plan.md) as Phases 10-17.**

## Goal

1. Enable clicking worklog activity entries to edit via WorklogModal
2. Complete project worklog settings page (filters, export, pagination)
3. Fix code quality issues and missing i18n
4. Enforce business rules: max 12h/day, 7-day backdate, no future dates
5. Permission enforcement: members can't edit/delete, admins have 7-day window
6. Daily 5PM reminder for users who haven't logged time

## Business Rules (NEW)

| Rule                              | Backend                                         | Frontend                             |
| --------------------------------- | ----------------------------------------------- | ------------------------------------ |
| Max 12h (720min) per user per day | Sum worklogs for user+date ≤ 720min             | Error toast on exceed                |
| No future dates                   | `logged_at <= today`                            | Date picker `max=today`              |
| Backdate limit: 7 working days    | Reject if `logged_at` < 7 working days ago      | Date picker `min` restriction        |
| Member can't edit/delete          | Return 403 for MEMBER on PATCH/DELETE           | Hide edit/delete UI for non-admin    |
| Admin 7-day edit window           | 403 if worklog `logged_at` > 7 working days ago | Disable edit/delete for old worklogs |
| Daily reminder at 5PM             | Celery Beat task → Notification model           | N/A (uses existing notification UI)  |

## Phases

| #   | Phase                                  | Status | File                                                       | Order |
| --- | -------------------------------------- | ------ | ---------------------------------------------------------- | ----- |
| 1   | Backend: verify & fix permissions      | Done   | [phase-01](./phase-01-backend-verify-permissions.md)       | 1st   |
| 2   | Frontend: wire filters + pagination    | Done   | [phase-02](./phase-02-frontend-wire-filters-pagination.md) | 2nd   |
| 3   | Frontend: export + i18n + code quality | Done   | [phase-03](./phase-03-frontend-export-i18n-cleanup.md)     | 3rd   |
| 4   | Frontend: edit from activity click     | Done   | [phase-04](./phase-04-frontend-edit-from-activity.md)      | 4th   |
| 5   | Backend: validation rules              | Done   | [phase-05](./phase-05-backend-validation-rules.md)         | 5th   |
| 6   | Backend: permission enforcement        | Done   | [phase-06](./phase-06-backend-permission-enforcement.md)   | 6th   |
| 7   | Frontend: validation & UX              | Done   | [phase-07](./phase-07-frontend-validation-ux.md)           | 7th   |
| 8   | Backend: daily reminder notification   | Done   | [phase-08](./phase-08-backend-daily-reminder.md)           | 8th   |

## Phase Order Rationale

- **Phases 1-4**: Completed — base CRUD, filters, export, activity edit
- **Phase 5 (Validation) before 6 (Permissions)**: Validation logic shared by both create and update paths
- **Phase 6 (Permissions) before 7 (Frontend)**: Backend must enforce rules before frontend reflects them
- **Phase 7 (Frontend UX)**: Reflects backend validation + permission rules in UI
- **Phase 8 (Reminder)**: Independent; can be done last or in parallel with Phase 7

## Permission Rules (UPDATED)

- **Create worklog**: ADMIN + MEMBER (unchanged)
- **Edit/Delete own worklog**: MEMBER — **NOT ALLOWED** after creation
- **Edit/Delete any worklog**: ADMIN — only within 7 working days of `logged_at`
- **Older worklogs**: Locked for everyone

## Key Dependencies

- Notification model exists (`plane.db.models.Notification`) — reuse for reminders
- Celery Beat configured in `plane/celery.py` with crontab patterns
- `ProjectMember` model available for role checks in views

## Validation Log

### Session 1 — 2026-03-04

**Trigger:** Initial validation before implementing Phases 5-8
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** The daily reminder is scheduled at UTC 17:00. Since the team is in Vietnam (UTC+7), that's midnight local time — not useful. What time should the reminder fire?
   - Options: UTC 10:00 (5PM Vietnam) | UTC 09:00 (4PM Vietnam) | Keep UTC 17:00 | Make it configurable
   - **Answer:** UTC 10:00 (5PM Vietnam)
   - **Rationale:** Team is Vietnam-based. UTC 17:00 = midnight VN, useless. UTC 10:00 = 5PM VN, end of workday.

2. **[Permissions]** MEMBERs cannot edit/delete their own worklogs AT ALL after creation. Only ADMINs can, within 7 working days. This is very restrictive — is this the intended behavior?
   - Options: Yes, as planned | Members can edit own, same day only | Members can edit own, within 7 days
   - **Answer:** Yes, as planned
   - **Rationale:** Strict control intended. Members submit once, admins correct. No changes needed.

3. **[Scope]** Plan changes MAX_DURATION_MINUTES from 1440 (24h) to 720 (12h) per single entry. This is a breaking change for existing behavior. Confirm?
   - Options: Yes, cap at 720min (12h) | Keep 1440 per entry, 720 daily aggregate | Cap at 480min (8h) per entry
   - **Answer:** Yes, cap at 720min (12h)
   - **Rationale:** Single entry max = daily max = 12h. Simpler. Existing worklogs >12h won't be affected retroactively (only new creates/updates).

4. **[Assumptions]** Working days = Mon-Fri only, no Vietnamese holiday awareness. National holidays still count as working days. Acceptable?
   - Options: Mon-Fri is fine (Recommended) | Add VN holiday calendar | Use calendar days instead
   - **Answer:** Mon-Fri is fine (Recommended)
   - **Rationale:** KISS. No holiday calendar maintenance burden. Acceptable for MVP.

#### Confirmed Decisions

- **Reminder time**: UTC 10:00 (5PM Vietnam) — changed from UTC 17:00
- **Member permissions**: Cannot edit/delete after creation — confirmed as-is
- **Duration cap**: 720min per entry — confirmed, breaking change accepted
- **Working days**: Mon-Fri, no holidays — confirmed

#### Action Items

- [x] Update Phase 8: change crontab from `hour=17` to `hour=10`

#### Impact on Phases

- Phase 8: Change Celery Beat crontab from `hour=17, minute=0` to `hour=10, minute=0` (UTC 10:00 = 5PM Vietnam)

### Session 2 — 2026-03-04

**Trigger:** Re-validation before implementing Phases 5-8 — surfacing gaps in bulk endpoint, reminder scope, idempotency, and i18n
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Phase 5 mentions bulk endpoint (TimesheetBulkEntrySerializer) needs aggregate daily limit check too, but implementation steps only cover IssueWorkLogViewSet. Should we add daily limit check to the bulk endpoint as well?
   - Options: Yes, add to bulk endpoint too (Recommended) | Skip for now, only single entry | Block bulk endpoint entirely
   - **Answer:** Yes, add to bulk endpoint too (Recommended)
   - **Rationale:** Consistent enforcement — bulk import must not bypass 720min/day limit. Without this, users could circumvent single-entry limits via bulk import.

2. **[Scope]** Phase 8 reminder: workspace-level (1 notification regardless of projects) or per-project (separate notification per time-tracking project)?
   - Options: Workspace-level (Recommended) | Per-project
   - **Answer:** Per-project
   - **Rationale:** More specific — users get reminded per project they haven't logged time in. More actionable than a generic workspace reminder.

3. **[Risk]** Phase 8 has a duplicate notification risk if Celery Beat fires twice. Should we add idempotency check now or defer?
   - Options: Add idempotency now (Recommended) | Defer to v2
   - **Answer:** Add idempotency now (Recommended)
   - **Rationale:** Simple `exists()` check prevents duplicate reminders. Low effort, high reliability.

4. **[Scope]** Phase 7 adds i18n keys for KO and VI as 'placeholders' (English copies). Should we write actual translations now or keep English placeholders?
   - Options: English placeholders for now | Write actual KO/VI translations now (Recommended) | Only VI translations, KO placeholder
   - **Answer:** Write actual KO/VI translations now (Recommended)
   - **Rationale:** Team includes Vietnamese speakers. Complete i18n properly to avoid separate translation pass later.

#### Confirmed Decisions

- **Bulk daily limit**: Add aggregate check to bulk endpoint too — consistent enforcement
- **Reminder scope**: Per-project, not workspace-level — more specific/actionable
- **Idempotency**: Add exists() check before creating reminders — prevents duplicates
- **Translations**: Write actual KO/VI translations now — complete i18n in one pass

#### Action Items

- [ ] Update Phase 5: add bulk endpoint daily limit check steps
- [ ] Update Phase 8: change from workspace-level to per-project reminders
- [ ] Update Phase 8: add idempotency check in task implementation
- [ ] Update Phase 7: change i18n approach from placeholders to actual translations

#### Impact on Phases

- Phase 5: Add implementation steps for bulk endpoint aggregate daily limit check (TimesheetBulkEntrySerializer view)
- Phase 7: Change i18n approach — write actual Korean and Vietnamese translations instead of English placeholders
- Phase 8: Change from workspace-level to per-project notifications; add idempotency check before bulk_create

### Session 3 — 2026-03-04

**Trigger:** Scope change — Phase 8 description updated to include email notification alongside in-app
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 8 now includes email notification alongside in-app. How should the email be sent?
   - Options: Reuse existing email_notification_task (Recommended) | New dedicated email task | Skip email for now, in-app only
   - **Answer:** Reuse existing email_notification_task (Recommended)
   - **Rationale:** Leverage Plane's existing email pipeline — same templates, same Celery task pattern. No new infrastructure.

2. **[Scope]** Should the email respect user notification preferences (e.g., email opt-out)?
   - Options: Yes, check user email preferences (Recommended) | Always send email | Add a separate worklog reminder toggle
   - **Answer:** Add a separate worklog reminder toggle
   - **Rationale:** Dedicated toggle gives users granular control over worklog reminders without affecting other email notifications.

3. **[Scope]** What should the reminder email contain?
   - Options: Simple text: project name + 'log your time' CTA (Recommended) | Summary with hours logged today | Just a nudge, no project details
   - **Answer:** Simple text: project name + 'log your time' CTA (Recommended)
   - **Rationale:** Minimal, actionable — links to project worklog page. No over-engineering.

#### Confirmed Decisions

- **Email method**: Reuse existing `email_notification_task` pipeline — no new infrastructure
- **Email preferences**: New per-user worklog reminder toggle — granular control
- **Email content**: Simple text with project name + CTA link to worklog page

#### Action Items

- [ ] Update Phase 8: add email sending via existing email pipeline
- [ ] Update Phase 8: add user preference toggle for worklog reminders
- [ ] Update Phase 8: define email content (project name + CTA)

#### Impact on Phases

- Phase 8: Add email notification using existing `email_notification_task`; add per-user worklog reminder toggle (new user setting); email content = project name + 'log your time' CTA with link

### Session 4 — 2026-03-04

**Trigger:** User refined Phase 8 requirements — workspace-level reminder, fixed message, toggle in Notification center
**Questions asked:** 0 (direct user instruction, no ambiguity)

#### Confirmed Decisions

- **Reminder scope**: Reverted from per-project (Session 2) to **workspace-level** — 1 reminder per user per workspace per day
- **Message**: Fixed text — "A gentle reminder to all members: remember to log the time for the tasks you're following!"
- **Toggle**: `worklog_reminder` field in `UserNotificationPreference` model — controls both in-app + email
- **Toggle UI**: Added to Profile → Notifications settings page, following existing ToggleSwitch pattern

#### Action Items

- [x] Rewrite Phase 8 with workspace-level scope, fixed message, user toggle, email via existing pipeline

#### Impact on Phases

- Phase 8: Complete rewrite — workspace-level (not per-project), fixed message, `worklog_reminder` toggle in UserNotificationPreference model + frontend settings UI

### Session 5 — 2026-03-04

**Trigger:** Final validation before implementing Phases 5-8 — email compatibility, CTA link target, utility location
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 8 email: `_send_reminder_emails()` is a TODO stub. The existing `send_email_notification` task expects specific notification format (likely FK-based receiver, entity identifiers). Have you verified it's compatible with the workspace-level Notification records being created, or should we build a simpler standalone email sender instead?
   - Options: Investigate during implementation (Recommended) | Build standalone email sender | Skip email entirely for now
   - **Answer:** Investigate during implementation
   - **Rationale:** Read existing email task code during Phase 8 implementation, adapt as needed. No premature decisions.

2. **[Scope]** Phase 8 email CTA links to 'workspace worklogs page' — but worklog settings are per-project, not per-workspace. What should the CTA link to?
   - Options: Link to workspace home/dashboard | No link, just text reminder | Link to first time-tracking project
   - **Answer:** Other — follow project-level worklog settings
   - **Custom input:** Worklog settings are per-project. If time tracking is enabled in Project Settings → the reminder should link to the project. Need to develop "Time Tracking" features section in Project Settings sidebar (similar to Features → Views pattern).
   - **Rationale:** Per-project linking is more actionable. The Time Tracking settings page already exists in sidebar under Features. CTA should link to project-level time tracking page.

3. **[Architecture]** Phase 5: `get_min_allowed_date()` is defined in serializer module but also needed in views (Phase 6) and frontend utils (Phase 7). Should it live in a shared utils module instead of the serializer file?
   - Options: Keep in serializer, import from there (Recommended) | Move to shared utils module | Duplicate in view
   - **Answer:** Keep in serializer, import from there
   - **Rationale:** KISS — small function, avoid new files. Views import from serializer module.

#### Confirmed Decisions

- **Email implementation**: Investigate existing email task during Phase 8 implementation — adapt as needed
- **CTA link**: Per-project time tracking page (not workspace-level)
- **Utility location**: `get_min_allowed_date()` stays in serializer module — KISS

#### Action Items

- [ ] Update Phase 8: CTA link to project-level time tracking settings page (not workspace worklogs)
- [ ] Phase 8 email: investigate `send_email_notification` compatibility during implementation

#### Impact on Phases

- Phase 8: Email CTA links to project-level time tracking settings page instead of workspace worklogs page

### Session 6 — 2026-03-04

**Trigger:** Final pre-implementation validation — CTA multi-project ambiguity, Notification sender field, error response format
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 8: Notification is workspace-level (1 per user per workspace), but Session 5 decided CTA should link to 'project-level time tracking page.' If a user has multiple time-tracking projects in one workspace, which project does the CTA link to?
   - Options: Link to workspace dashboard | Include all project links | Link to first unlogged project
   - **Answer:** Include all project links
   - **Rationale:** More actionable — user sees exactly which projects need time logging. Notification/email lists all time-tracking projects the user hasn't logged to today.

2. **[Architecture]** Phase 8: The implementation uses sender='system' (string) for Notification records. Does Plane's Notification model accept a string for sender, or does it expect a User UUID/FK?
   - Options: Investigate during implementation (Recommended) | Use dedicated 'system' User record | Set sender to None/null
   - **Answer:** Investigate during implementation (Recommended)
   - **Rationale:** Read Notification model during Phase 8 implementation, adapt to actual field type. No premature decisions.

3. **[Architecture]** Phase 5: The aggregate daily limit check error response format — should the view return {"error": "message"} or DRF standard {"detail": "message"}?
   - Options: Use {"error": "message"} as planned | Use DRF standard {"detail": "message"} | Check existing worklog error format first
   - **Answer:** Check existing worklog error format first
   - **Rationale:** Follow existing codebase patterns. Read current worklog view error responses during implementation, match that format. Frontend adapts accordingly.

#### Confirmed Decisions

- **CTA links**: Include all unlogged project links in notification/email — more actionable
- **Notification sender**: Investigate Notification model during implementation — adapt to actual schema
- **Error format**: Follow existing worklog error format in codebase — check during implementation

#### Action Items

- [ ] Update Phase 8: notification/email includes list of all unlogged time-tracking projects (not single project link)
- [ ] Phase 5/7: check existing error response format during implementation, adapt frontend parsing accordingly

#### Impact on Phases

- Phase 8: Notification data and email body include list of all time-tracking projects user hasn't logged to (not single project CTA)
- Phase 5: Error format to be determined by existing codebase patterns (investigated during implementation)
- Phase 7: Frontend error parsing adapts to whatever format Phase 5 uses

### Session 7 — 2026-03-04

**Trigger:** Final gap analysis before implementation — legacy data handling, dependency verification, email scope
**Questions asked:** 3

#### Questions & Answers

1. **[Validation]** Phase 5 changes MAX_DURATION_MINUTES from 1440 to 720. If a user tries to UPDATE an existing worklog that was created with >720min (e.g., 900min) without changing the duration, should the update be rejected or should the old duration be grandfathered?
   - Options: Reject — force fix to ≤720min | Grandfather — allow if unchanged | Silently cap at 720min
   - **Answer:** Reject — force fix to ≤720min
   - **Rationale:** Strict enforcement. Any update on a worklog with >720min duration forces user to reduce duration first. No legacy exceptions.

2. **[Dependency]** Phase 8 relies on Project.is_time_tracking_enabled field to find time-tracking projects. Has this field been added to the Project model yet?
   - Options: Already exists | Needs to be created | Use different mechanism
   - **Answer:** Search codebase — reuse if exists, add if not
   - **Custom input:** Cần search codebase xem có chưa nếu chưa có thì cần add thêm, có rồi thì re-use
   - **Rationale:** Verified: `is_time_tracking_enabled = models.BooleanField(default=True)` exists at `apps/api/plane/db/models/project.py:98`. No changes needed.

3. **[Scope]** Phase 8 \_send_reminder_emails() is a TODO stub. Should email be a stretch goal that can be deferred?
   - Options: Email is must-have | Email is stretch goal | Skip email entirely
   - **Answer:** Email is must-have
   - **Rationale:** Phase 8 is not complete without working email. Must investigate existing email pipeline and implement during Phase 8.

#### Confirmed Decisions

- **Legacy worklogs >720min**: Reject on update — force fix to ≤720min. No grandfathering.
- **is_time_tracking_enabled**: Already exists on Project model — reuse as-is
- **Email**: Must-have. Phase 8 not done until email works.

#### Action Items

- [ ] Update Phase 5: note that updates to legacy >720min worklogs are rejected unless duration is reduced
- [ ] Phase 8: email implementation is blocking, not optional

#### Impact on Phases

- Phase 5: Serializer `validate_duration_minutes` enforces ≤720min on all creates AND updates (no grandfathering)
- Phase 8: No model changes needed for `is_time_tracking_enabled` (already exists). Email is must-have, not stretch goal.

### Session 8 — 2026-03-04

**Trigger:** User clarified notification scope — simplify to 1 email per user per day, generic message
**Questions asked:** 0 (direct user instruction, no ambiguity)

#### Confirmed Decisions

- **Notification scope**: Reverted from workspace-level (Session 4) to **user-level** — 1 notification + 1 email per user per day, across ALL workspaces/projects
- **Trigger condition**: If user is member of ANY project with `is_time_tracking_enabled=True` across ANY workspace, and hasn't logged time today → send reminder
- **Message**: i18n (EN/KO/VI) — friendly, creative reminder. No project/workspace listing.
- **CTA links**: Reverted from "include all project links" (Session 6) — no project links needed, just a gentle nudge
- **Deduplication**: 1 email max per user per day (not per workspace)

#### Action Items

- [x] Rewrite Phase 8 with user-level scope, 1 email/day, generic message

#### Impact on Phases

- Phase 8: Complete scope change — user-level (not workspace-level), 1 notification + 1 email per user per day, generic message, no project listing in CTA

### Session 9 — 2026-03-04

**Trigger:** Final pre-implementation validation — resolving contradictions, email approach, notification UI compatibility
**Questions asked:** 3

#### Questions & Answers

1. **[Clarity]** Phase 5 has contradictory text about MAX_DURATION_MINUTES: Key Insights says 'keep 1440 per-entry but add aggregate 720/day check', but Step 8 concludes 'Change MAX_DURATION_MINUTES = 720'. Which is the final intent?
   - Options: 720 per entry (Recommended) | 1440 per entry, 720 daily aggregate
   - **Answer:** 720 per entry (Recommended)
   - **Rationale:** Single entry max = daily max = 12h. Simpler, consistent with Session 1 validation. Resolves contradictory text in Phase 5.

2. **[Scope]** Phase 8 email implementation is MUST-HAVE but `_send_reminder_emails()` is still a TODO stub. Lock in approach now or defer?
   - Options: Defer to implementation | Use Django send_mail directly | Skip email, in-app only
   - **Answer:** Defer to implementation
   - **Rationale:** Read existing email_notification_task code during Phase 8, adapt as needed. Flexible approach.

3. **[Architecture]** Phase 8 Notification uses `sender=None` and `entity_name='worklog_reminder'`. Frontend notification UI may not handle these. Verify now or later?
   - Options: Investigate during implementation (Recommended) | Add to Phase 7 scope | Use existing entity_name pattern
   - **Answer:** Investigate during implementation (Recommended)
   - **Rationale:** Read NotificationCard component during Phase 8 implementation. Adapt sender/entity_name to match existing patterns.

#### Confirmed Decisions

- **MAX_DURATION_MINUTES**: 720 per entry — resolves contradictory Phase 5 text
- **Email approach**: Deferred to implementation — investigate existing pipeline
- **Notification UI**: Deferred to implementation — investigate frontend handling

#### Action Items

- [ ] Fix Phase 5 contradictory text: clarify MAX_DURATION_MINUTES = 720 (not 1440)

#### Impact on Phases

- Phase 5: Fix contradictory Key Insights text — remove "keep 1440" reference, clarify MAX_DURATION_MINUTES = 720
