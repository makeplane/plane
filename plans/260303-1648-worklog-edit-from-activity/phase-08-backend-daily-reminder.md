# Phase 8: Backend Daily Reminder Notification

## Context Links

- [Plan Overview](./plan.md)
- Celery config: `apps/api/plane/celery.py`
- Notification model: `apps/api/plane/db/models/notification.py`
- Background tasks: `apps/api/plane/bgtasks/`
- Existing email task: `apps/api/plane/bgtasks/email_notification_task.py`
- User notification prefs model: `UserNotificationPreference` in `plane/db/models/notification.py`
- User notification prefs serializer: `apps/api/plane/app/serializers/notification.py`
- User notification prefs view: `apps/api/plane/app/views/notification/base.py` → `UserNotificationPreferenceEndpoint`
- Frontend notification settings: `apps/web/core/components/settings/profile/content/pages/notifications/email-notification-form.tsx`
- Frontend types: `packages/types/src/users.ts` → `IUserEmailNotificationSettings`

## Overview

- **Priority**: P3
- **Status**: pending
- **Effort**: 75m
- **Description**: Daily 5PM reminder (1 per user per day) for users who haven't logged time. In-app notification + email. User toggle to opt out.
<!-- Updated: Validation Session 8 - Simplified to user-level (1 per user per day), generic message -->

## Key Insights

- Celery Beat schedule in `plane/celery.py` → `app.conf.beat_schedule`. Follow existing pattern.
- **Decision**: UTC 10:00 (= 5PM Vietnam). Per-user TZ is future enhancement.
- **Scope**: **User-level** — 1 notification + 1 email per user per day, across all workspaces/projects.
- **Trigger**: User is member of ANY project with `is_time_tracking_enabled=True` AND hasn't logged time today.
- **Message**: i18n — see Implementation Steps for EN/KO/VI versions
- `is_time_tracking_enabled` already exists on Project model (`project.py:98`).
- Existing `UserNotificationPreference` model — add `worklog_reminder` field.
- Frontend toggle: `email-notification-form.tsx` uses React Hook Form + ToggleSwitch from `@plane/ui`.

## Requirements

- **R1**: Celery Beat task runs daily at 10:00 UTC (5PM Vietnam)
- **R2**: Find all users in any time-tracking project (across all workspaces)
- **R3**: Skip users who already logged time today (any project)
- **R4**: Skip users with `worklog_reminder=False`
- **R5**: 1 notification + 1 email per user per day max (idempotent)
- **R6**: Generic message — no project/workspace listing
- **R7**: Email via existing email pipeline [MUST-HAVE]
- **R8**: Add `worklog_reminder` toggle to `UserNotificationPreference` (default: True)
- **R9**: Add toggle in frontend Notification settings page

## Architecture

```
Celery Beat (10:00 UTC = 5PM VN)
  → worklog_daily_reminder task
    → Find all users in time-tracking projects (any workspace)
    → Filter out: already logged today, opted out, already reminded today
    → For each user needing reminder:
      → Create 1 Notification record (pick first workspace for FK)
      → Send 1 email
```

## Related Code Files

### Backend (Create/Modify)

- **Create**: `apps/api/plane/bgtasks/worklog_reminder_task.py` — Celery shared_task
- **Modify**: `apps/api/plane/celery.py` — Add beat schedule entry
- **Modify**: `apps/api/plane/db/models/notification.py` — Add `worklog_reminder` field to `UserNotificationPreference`
- **Modify**: `apps/api/plane/app/serializers/notification.py` — Add field to serializer
- **Migration**: Auto-generate after model change

### Frontend (Modify)

- **Modify**: `packages/types/src/users.ts` — Add `worklog_reminder` to `IUserEmailNotificationSettings`
- **Modify**: `apps/web/core/components/settings/profile/content/pages/notifications/email-notification-form.tsx` — Add toggle

## Embedded Rules

```
- @shared_task decorator for Celery tasks
- Pass IDs as strings, never model instances
- try/except with log_exception(e) for error handling
- Use bulk_create for batch Notification inserts
- Follow naming: "check-every-day-to-..." pattern in beat_schedule
- CE pattern: new features in ce/, never modify core/ (adding field to core model is OK)
- observer() on all MobX-reading components
- t() for all user-facing strings
```

## Implementation Steps

### Part A: User Preference Toggle

1. **Add `worklog_reminder` field to `UserNotificationPreference` model**

   ```python
   # In plane/db/models/notification.py → UserNotificationPreference
   worklog_reminder = models.BooleanField(default=True)
   ```

2. **Update serializer** (`plane/app/serializers/notification.py`)
   - Add `worklog_reminder` to `UserNotificationPreferenceSerializer` fields

3. **Generate migration**

   ```bash
   cd apps/api && python manage.py makemigrations db
   ```

4. **Update frontend type** (`packages/types/src/users.ts`)

   ```typescript
   interface IUserEmailNotificationSettings {
     // ... existing fields
     worklog_reminder: boolean;
   }
   ```

5. **Add toggle in notification settings UI** (`email-notification-form.tsx`)
   - Follow existing pattern (Controller + ToggleSwitch)
   - Title: "Worklog reminder" / i18n key
   - Description: "Daily reminder at 5PM to log your time"

6. **Add i18n keys for reminder message** (EN, KO, VI)

   ```
   # EN
   worklog.reminder_title: "Time tracking reminder"
   worklog.reminder_message: "Hey there! 👋 Just a friendly nudge — don't forget to log your working hours for today. Keeping your timesheet up to date helps the whole team stay on track. It only takes a minute, and your future self will thank you! Head over to your project and log your time before the day wraps up."

   # KO
   worklog.reminder_title: "근무 시간 기록 알림"
   worklog.reminder_message: "안녕하세요! 👋 오늘 하루도 수고 많으셨습니다. 혹시 오늘의 근무 시간을 아직 기록하지 않으셨나요? 타임시트를 꾸준히 업데이트하면 팀 전체가 더 효율적으로 협업할 수 있어요. 잠깐이면 되니까, 퇴근 전에 프로젝트에서 시간을 기록해 주세요!"

   # VI
   worklog.reminder_title: "Nhắc nhở ghi nhận giờ làm việc"
   worklog.reminder_message: "Hey bạn ơi! 👋 Một ngày làm việc sắp kết thúc rồi — đừng quên ghi nhận giờ làm việc cho hôm nay nhé. Việc cập nhật timesheet đều đặn giúp cả team nắm bắt tiến độ tốt hơn đấy. Chỉ mất một phút thôi, bạn tương lai sẽ cảm ơn bạn hiện tại! Ghé vào project và log time trước khi hết ngày nha."
   ```

### Part B: Celery Task

6. **Create `worklog_reminder_task.py`**

   ```python
   from datetime import date
   from celery import shared_task
   from plane.utils.exception_logger import log_exception

   # Backend sends EN message; frontend/email renders per user locale
   REMINDER_MESSAGE = (
       "Hey there! Just a friendly nudge — don't forget to log your working hours for today. "
       "Keeping your timesheet up to date helps the whole team stay on track. "
       "It only takes a minute! Head over to your project and log your time before the day wraps up."
   )

   @shared_task
   def worklog_daily_reminder():
       """Send daily reminder to users who haven't logged time."""
       try:
           _send_reminders()
       except Exception as e:
           log_exception(e)
           raise

   def _send_reminders():
       from plane.db.models import (
           IssueWorkLog,
           Notification,
           Project,
           ProjectMember,
           UserNotificationPreference,
       )

       today = date.today()

       # 1. All users in any time-tracking project (across all workspaces)
       tracking_project_ids = Project.objects.filter(
           is_time_tracking_enabled=True,
           archived_at__isnull=True,
       ).values_list("id", flat=True)

       if not tracking_project_ids:
           return

       # All active members in time-tracking projects
       # Get (member_id, workspace_id) pairs for notification FK
       member_workspace = dict(
           ProjectMember.objects.filter(
               project_id__in=tracking_project_ids,
               is_active=True,
           ).values_list("member_id", "workspace_id").distinct()
       )
       all_member_ids = set(member_workspace.keys())

       if not all_member_ids:
           return

       # 2. Filter out: opted out
       opted_out_ids = set(
           UserNotificationPreference.objects.filter(
               worklog_reminder=False,
           ).values_list("user_id", flat=True)
       )

       # 3. Filter out: already logged today
       logged_today_ids = set(
           IssueWorkLog.objects.filter(
               logged_by_id__in=all_member_ids,
               logged_at=today,
           ).values_list("logged_by_id", flat=True)
       )

       # 4. Filter out: already reminded today (idempotency)
       already_reminded_ids = set(
           Notification.objects.filter(
               entity_name="worklog_reminder",
               data__date=str(today),
           ).values_list("receiver_id", flat=True)
       )

       needs_reminder = all_member_ids - opted_out_ids - logged_today_ids - already_reminded_ids

       if not needs_reminder:
           return

       # 5. Create notifications (1 per user, use first workspace for FK)
       notifications = [
           Notification(
               workspace_id=member_workspace[uid],
               receiver_id=uid,
               title="Time tracking reminder",
               entity_name="worklog_reminder",
               sender=None,  # system notification — investigate field type
               data={
                   "type": "worklog_reminder",
                   "date": str(today),
                   "message": REMINDER_MESSAGE,
               },
           )
           for uid in needs_reminder
       ]

       Notification.objects.bulk_create(notifications, batch_size=200)

       # 6. Send emails [MUST-HAVE]
       _send_reminder_emails(needs_reminder)

   def _send_reminder_emails(user_ids):
       """Send 1 email per user via existing email pipeline."""
       # TODO: investigate existing email_notification_task pattern during implementation
       # For each user_id, send email with:
       #   Subject: "Time tracking reminder"
       #   Body: REMINDER_MESSAGE
       pass
   ```

7. **Register in Celery Beat schedule** (`plane/celery.py`)
   ```python
   "check-every-day-to-send-worklog-reminder": {
       "task": "plane.bgtasks.worklog_reminder_task.worklog_daily_reminder",
       "schedule": crontab(hour=10, minute=0),  # UTC 10:00 = 5PM Vietnam
   },
   ```

### Part C: Email Sending [MUST-HAVE]

8. **Implement `_send_reminder_emails()`**
   - Study existing `email_notification_task.py` pattern
   - For each user, send 1 email with:
     - Subject: "Time tracking reminder"
     - Body: Use EN version of `worklog.reminder_message` (email is EN-only for MVP; i18n email is future enhancement)
     - No project listing, no CTA links — just a friendly nudge

## Todo List

- [ ] Add `worklog_reminder` field to `UserNotificationPreference` model
- [ ] Update `UserNotificationPreferenceSerializer` with new field
- [ ] Generate and apply migration
- [ ] Update `IUserEmailNotificationSettings` type
- [ ] Add toggle in `email-notification-form.tsx`
- [ ] Add i18n keys for toggle (EN, KO, VI)
- [ ] Create `worklog_reminder_task.py`
- [ ] Add beat schedule entry in `celery.py`
- [ ] Implement email sending via existing pipeline
- [ ] Test locally: `celery -A plane call plane.bgtasks.worklog_reminder_task.worklog_daily_reminder`
- [ ] Verify 1 notification per user (not per workspace)
- [ ] Verify email sends (when toggle is on)
- [ ] Verify no notification when toggle is off
- [ ] Run post-phase checklist
- [ ] Mark phase complete in plan.md

## Post-Phase Checklist

- [ ] Task file created at `apps/api/plane/bgtasks/worklog_reminder_task.py`
- [ ] Task registered in `app.conf.beat_schedule` in `celery.py`
- [ ] `worklog_reminder` field added to `UserNotificationPreference`
- [ ] Migration generated and applied
- [ ] Frontend toggle works in Notification settings
- [ ] Task uses `@shared_task` decorator
- [ ] Error handling with `log_exception`
- [ ] Bulk create for efficiency
- [ ] Opted-out users don't receive notification or email
- [ ] Idempotent — no duplicates on re-run
- [ ] 1 notification + 1 email per user per day (not per workspace)
- [ ] File < 200 lines

## Success Criteria

- Task runs without error when invoked manually
- User in time-tracking project without today's log → receives 1 notification + 1 email
- User who already logged today → receives nothing
- User with `worklog_reminder=False` → receives nothing
- User in multiple workspaces → still only 1 notification + 1 email
- Toggle visible and functional in Profile → Notifications
- No duplicate notifications on re-run
- Message: i18n — EN/KO/VI versions (see i18n keys in implementation steps)

## Risk Assessment

- **Duplicate notifications**: Resolved — idempotency check per user+date
- **Performance**: bulk_create + batch_size + values_list for efficiency
- **Timezone**: UTC 10:00 = 5PM Vietnam. Per-user TZ is future enhancement.
- **Migration**: Adding boolean field with default — safe, no data loss
- **Multi-workspace user**: `member_workspace` dict picks arbitrary workspace for Notification FK — acceptable since message is generic

## Security Considerations

- Task runs as system — no user auth context needed
- Notification content is generic, no sensitive data
- User preference respected — GDPR-friendly opt-out

## Resolved Questions

1. ~~Workspace-level or per-project or per-user?~~ **User-level.** 1 reminder per user per day. (Session 8)
2. ~~Workspace setting to enable/disable?~~ YAGNI. Per-user toggle is sufficient.
3. ~~Email method?~~ Reuse existing `email_notification_task` pipeline. (Session 3)
4. ~~Email preferences?~~ `worklog_reminder` toggle in `UserNotificationPreference`. (Session 4)
5. ~~Include project links in CTA?~~ No. Generic message only. (Session 8)

## Next Steps

- Optional future: per-user timezone scheduling
- Optional future: workspace-level enable/disable setting
