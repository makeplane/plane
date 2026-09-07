# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
The reminders PROJECT.md asks for.

Missing check-ins, missing work logs, blocked and overdue issues, a QA queue
that is backing up, a release queue nobody has picked up. They land in the Workspaces
own notification inbox rather than an email or a Discord webhook -- the point
of the extension is that people stop leaving Workspaces, and a reminder that lives
somewhere else defeats it.

Two rules hold across every task here:

* **Never notify twice for the same thing on the same day.** These run on a
  schedule and a reminder that repeats every hour is a reminder people mute.
  Deduplication is by ``entity_name`` plus ``entity_identifier`` within the
  local day.
* **Respect the workspace's configuration.** Every notification type can be
  switched off in :class:`OperationsSetting`, and a workspace that has not
  enabled work logs is not chased for them.
"""

# Python imports
import logging
from datetime import timedelta

# Django imports
from django.db.models import Count, Q
from django.utils import timezone

# Third party imports
from celery import shared_task

# Module imports
from workspaces.db.models import (
    Issue,
    Notification,
    OperationsTicket,
    OperationsTicketStatus,
    State,
    WorkLog,
    Workspace,
    WorkspaceMember,
)
from workspaces.utils.engineering_ops import get_operations_config, state_names
from workspaces.utils.exception_logger import log_exception

logger = logging.getLogger("workspaces.worker")

SENDER = "engineering_operations"


def already_notified(workspace_id, receiver_id, entity_name, entity_identifier, since):
    """True when this exact reminder has already gone out in the window."""
    return Notification.objects.filter(
        workspace_id=workspace_id,
        receiver_id=receiver_id,
        entity_name=entity_name,
        entity_identifier=entity_identifier,
        sender=SENDER,
        created_at__gte=since,
    ).exists()


def notify(workspace_id, receiver_id, entity_name, entity_identifier, title, message, data=None):
    """Create one inbox notification."""
    return Notification(
        workspace_id=workspace_id,
        receiver_id=receiver_id,
        entity_name=entity_name,
        entity_identifier=entity_identifier,
        title=title,
        message={"text": message},
        message_stripped=message,
        sender=SENDER,
        data=data or {},
    )


def active_members(workspace):
    return WorkspaceMember.objects.filter(workspace=workspace, is_active=True).exclude(member__is_bot=True)


def state_ids_for_workspace(workspace, config, bucket):
    """State ids across the whole workspace matching one semantic bucket."""
    names = state_names(config, bucket)
    if not names:
        return []
    query = Q()
    for name in names:
        query |= Q(name__iexact=name)
    return list(
        State.all_state_objects.filter(query, workspace=workspace, project__archived_at__isnull=True).values_list(
            "id", flat=True
        )
    )


@shared_task
def remind_missing_work_logs():
    """
    Nudge everybody who has not filed today's log.

    Runs hourly and only fires for a workspace once the local hour has passed
    the configured reminder hour, which is how a single UTC schedule ends up
    respecting a dozen different working days.
    """
    today = timezone.localdate()
    since = timezone.now() - timedelta(hours=20)
    pending = []

    for workspace in Workspace.objects.all().iterator():
        try:
            config = get_operations_config(workspace.id)
            if not config["work_log"]["enabled"] or not config["notifications"]["missing_work_log"]:
                continue
            if today.isoweekday() not in config["work_log"]["required_weekdays"]:
                continue
            if timezone.localtime().hour < config["work_log"]["reminder_hour"]:
                continue

            member_ids = list(active_members(workspace).values_list("member_id", flat=True))
            filed = set(
                WorkLog.objects.filter(
                    workspace=workspace, owner_id__in=member_ids, date=today, submitted_at__isnull=False
                ).values_list("owner_id", flat=True)
            )

            for member_id in member_ids:
                if member_id in filed:
                    continue
                # The identifier is the workspace, not the day: one reminder
                # per person per workspace per run window, whatever the date.
                if already_notified(workspace.id, member_id, "work_log", workspace.id, since):
                    continue
                pending.append(
                    notify(
                        workspace.id,
                        member_id,
                        "work_log",
                        workspace.id,
                        "Your work log for today is missing",
                        f"You have not filed a work log for {today.isoformat()}.",
                        {"date": today.isoformat()},
                    )
                )
        except Exception as exc:  # one bad workspace must not stop the rest
            log_exception(exc)

    Notification.objects.bulk_create(pending, batch_size=200)
    logger.info("Work log reminders queued: %s", len(pending))
    return len(pending)


@shared_task
def remind_blocked_and_overdue():
    """
    Tell project managers what is stuck.

    Blocked issues, overdue issues, a QA queue that has items in it and a
    release queue waiting on DevOps -- one notification per workspace per
    category per day, not one per issue. A hundred notifications is silence.
    """
    since = timezone.now() - timedelta(hours=20)
    today = timezone.localdate()
    pending = []

    for workspace in Workspace.objects.all().iterator():
        try:
            config = get_operations_config(workspace.id)
            notifications = config["notifications"]

            blocked_states = state_ids_for_workspace(workspace, config, "blocked")
            qa_states = state_ids_for_workspace(workspace, config, "qa") + state_ids_for_workspace(
                workspace, config, "ready_for_test"
            )
            release_states = state_ids_for_workspace(workspace, config, "ready_for_release")

            issues = Issue.issue_objects.filter(workspace=workspace).exclude(type__is_epic=True)

            counts = {
                "blocked": issues.filter(state_id__in=blocked_states).count() if notifications["blocked_issues"] else 0,
                "overdue": (
                    issues.filter(target_date__lt=today).exclude(state__group__in=["completed", "cancelled"]).count()
                    if notifications["overdue_issues"]
                    else 0
                ),
                "qa_waiting": issues.filter(state_id__in=qa_states).count() if notifications["qa_waiting"] else 0,
                "ready_for_release": (
                    issues.filter(state_id__in=release_states).count() if notifications["ready_for_release"] else 0
                ),
            }

            # Admins get the delivery picture; that is the audience PROJECT.md
            # names for the blocked/overdue/QA-waiting reminders.
            admin_ids = list(active_members(workspace).filter(role=20).values_list("member_id", flat=True))
            messages = {
                "blocked": ("Blocked work items", "{n} work items are on hold."),
                "overdue": ("Overdue work items", "{n} work items are past their target date."),
                "qa_waiting": ("QA queue", "{n} work items are waiting on QA."),
                "ready_for_release": ("Release queue", "{n} work items are ready for release."),
            }

            for key, count in counts.items():
                if not count:
                    continue
                title, template = messages[key]
                for member_id in admin_ids:
                    if already_notified(workspace.id, member_id, f"operations_{key}", workspace.id, since):
                        continue
                    pending.append(
                        notify(
                            workspace.id,
                            member_id,
                            f"operations_{key}",
                            workspace.id,
                            title,
                            template.format(n=count),
                            {"count": count},
                        )
                    )
        except Exception as exc:
            log_exception(exc)

    Notification.objects.bulk_create(pending, batch_size=200)
    logger.info("Delivery reminders queued: %s", len(pending))
    return len(pending)


@shared_task
def remind_operations_tickets():
    """Tell the PM about requests waiting on them."""
    since = timezone.now() - timedelta(hours=20)
    pending = []

    for workspace in Workspace.objects.all().iterator():
        try:
            waiting = OperationsTicket.objects.filter(
                workspace=workspace,
                status__in=[
                    OperationsTicketStatus.NEW,
                    OperationsTicketStatus.PM_REVIEW,
                    OperationsTicketStatus.APPROVED,
                ],
            )
            by_assignee = {
                row["assignee_id"]: row["count"]
                for row in waiting.exclude(assignee__isnull=True)
                .values("assignee_id")
                .annotate(count=Count("id"))
                .order_by()
            }
            unassigned = waiting.filter(assignee__isnull=True).count()

            for member_id, count in by_assignee.items():
                if already_notified(workspace.id, member_id, "operations_tickets", workspace.id, since):
                    continue
                pending.append(
                    notify(
                        workspace.id,
                        member_id,
                        "operations_tickets",
                        workspace.id,
                        "Operations requests waiting on you",
                        f"{count} operations requests are assigned to you and still open.",
                        {"count": count},
                    )
                )

            if unassigned:
                for member_id in active_members(workspace).filter(role=20).values_list("member_id", flat=True):
                    if already_notified(workspace.id, member_id, "operations_tickets_unassigned", workspace.id, since):
                        continue
                    pending.append(
                        notify(
                            workspace.id,
                            member_id,
                            "operations_tickets_unassigned",
                            workspace.id,
                            "Unassigned operations requests",
                            f"{unassigned} operations requests have nobody reviewing them.",
                            {"count": unassigned},
                        )
                    )
        except Exception as exc:
            log_exception(exc)

    Notification.objects.bulk_create(pending, batch_size=200)
    logger.info("Operations ticket reminders queued: %s", len(pending))
    return len(pending)


@shared_task
def remind_missing_attendance():
    """
    Nudge people who have not punched in.

    Needs the bridge, and asks it once per person -- so it is deliberately the
    lightest of these tasks and skips entirely when Odoo is not configured. A
    workspace where nobody is linked to an employee record produces no
    notifications rather than a wall of them.
    """
    from workspaces.utils.odoo_bridge import OdooBridgeUnavailable, call, is_configured

    if not is_configured():
        return 0

    since = timezone.now() - timedelta(hours=8)
    pending = []

    for workspace in Workspace.objects.all().iterator():
        try:
            config = get_operations_config(workspace.id)
            if not config["attendance"]["enabled"] or not config["notifications"]["missing_attendance"]:
                continue
            if timezone.localtime().hour < config["attendance"]["check_in_reminder_hour"]:
                continue
            if timezone.localdate().isoweekday() not in config["work_log"]["required_weekdays"]:
                continue

            for member in active_members(workspace).values("member_id", "member__email"):
                email = member["member__email"]
                if not email:
                    continue
                if already_notified(workspace.id, member["member_id"], "attendance", workspace.id, since):
                    continue
                try:
                    status_code, payload = call("GET", "/api/v1/attendance/me", params={"email": email})
                except OdooBridgeUnavailable:
                    # The bridge is down for everybody; stop asking.
                    raise
                if status_code != 200 or not isinstance(payload, dict):
                    continue
                if payload.get("checked_in") or payload.get("worked_hours_today"):
                    continue

                pending.append(
                    notify(
                        workspace.id,
                        member["member_id"],
                        "attendance",
                        workspace.id,
                        "You have not checked in",
                        "There is no attendance record for you today.",
                    )
                )
        except OdooBridgeUnavailable:
            logger.warning("Attendance reminders skipped: bridge unavailable")
            break
        except Exception as exc:
            log_exception(exc)

    Notification.objects.bulk_create(pending, batch_size=200)
    logger.info("Attendance reminders queued: %s", len(pending))
    return len(pending)
