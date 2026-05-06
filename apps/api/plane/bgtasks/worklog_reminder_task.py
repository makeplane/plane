# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import logging
from datetime import date

from celery import shared_task
from django.core.mail import EmailMultiAlternatives, get_connection

from plane.license.utils.instance_value import get_email_configuration
from plane.utils.celery_helpers import working_day_required
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")

REMINDER_SUBJECT = "Time tracking reminder"
REMINDER_BODY = (
    "Hey there! Just a friendly nudge — don't forget to log your working hours "
    "for today. Keeping your timesheet up to date helps the whole team stay on "
    "track. It only takes a minute! Head over to your project and log your time "
    "before the day wraps up."
)


@shared_task
@working_day_required()
def worklog_daily_reminder():
    """Send daily reminder to users who haven't logged time today.

    Skipped automatically on weekends and VN public holidays via the
    @working_day_required() decorator (Asia/Ho_Chi_Minh timezone, fail-open).
    """
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
        User,
        UserNotificationPreference,
    )

    today = date.today()

    # 1. All active time-tracking projects
    tracking_project_ids = Project.objects.filter(
        is_time_tracking_enabled=True,
        archived_at__isnull=True,
    ).values_list("id", flat=True)

    if not tracking_project_ids:
        return

    # 2. All active members → pick one workspace_id per member for Notification FK
    member_workspace = dict(
        ProjectMember.objects.filter(
            project_id__in=tracking_project_ids,
            is_active=True,
        )
        .values_list("member_id", "workspace_id")
        .distinct()
    )
    all_member_ids = set(member_workspace.keys())

    if not all_member_ids:
        return

    # 3. Exclude: opted out
    opted_out_ids = set(
        UserNotificationPreference.objects.filter(
            worklog_reminder=False,
        ).values_list("user_id", flat=True)
    )

    # 4. Exclude: already logged today
    logged_today_ids = set(
        IssueWorkLog.objects.filter(
            logged_by_id__in=all_member_ids,
            logged_at=today,
        ).values_list("logged_by_id", flat=True)
    )

    # 5. Exclude: already reminded today (idempotency)
    already_reminded_ids = set(
        Notification.objects.filter(
            entity_name="worklog_reminder",
            data__date=str(today),
        ).values_list("receiver_id", flat=True)
    )

    needs_reminder = all_member_ids - opted_out_ids - logged_today_ids - already_reminded_ids

    if not needs_reminder:
        return

    # 6. Create in-app notifications
    notifications = [
        Notification(
            workspace_id=member_workspace[uid],
            receiver_id=uid,
            title=REMINDER_SUBJECT,
            entity_name="worklog_reminder",
            sender="system",
            data={
                "type": "worklog_reminder",
                "date": str(today),
                "message": REMINDER_BODY,
            },
        )
        for uid in needs_reminder
    ]
    Notification.objects.bulk_create(notifications, batch_size=200)

    # 7. Send emails
    _send_reminder_emails(needs_reminder, User)


def _send_reminder_emails(user_ids, user_model):
    """Send 1 email per user via Django email pipeline."""
    (
        EMAIL_HOST,
        EMAIL_HOST_USER,
        EMAIL_HOST_PASSWORD,
        EMAIL_PORT,
        EMAIL_USE_TLS,
        EMAIL_USE_SSL,
        EMAIL_FROM,
    ) = get_email_configuration()

    if not EMAIL_HOST or not EMAIL_FROM:
        logger.warning("Email not configured — skipping worklog reminder emails")
        return

    users = user_model.objects.filter(id__in=user_ids).values_list("id", "email")

    try:
        connection = get_connection(
            host=EMAIL_HOST,
            port=int(EMAIL_PORT),
            username=EMAIL_HOST_USER,
            password=EMAIL_HOST_PASSWORD,
            use_tls=EMAIL_USE_TLS == "1",
            use_ssl=EMAIL_USE_SSL == "1",
        )

        try:
            for _uid, email in users:
                try:
                    msg = EmailMultiAlternatives(
                        subject=REMINDER_SUBJECT,
                        body=REMINDER_BODY,
                        from_email=EMAIL_FROM,
                        to=[email],
                        connection=connection,
                    )
                    msg.send()
                except Exception as e:
                    log_exception(e)
        finally:
            connection.close()

        logger.info(f"Sent worklog reminder emails to {len(user_ids)} users")
    except Exception as e:
        log_exception(e)
