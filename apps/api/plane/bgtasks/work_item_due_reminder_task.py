# Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
from collections import defaultdict

# Third party imports
import pytz
from celery import shared_task

# Django imports
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.db.models import Prefetch
from django.template.loader import render_to_string
from django.utils import timezone

# Module imports
from plane.bgtasks.email_notification_task import acquire_lock
from plane.db.models import Issue, IssueAssignee, ProjectMember, StateGroup, User
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.email import generate_plain_text_from_html
from plane.utils.exception_logger import log_exception

# Same palette as the priority pills in emails/notifications/issue-updates.html
PRIORITY_DETAILS = {
    "urgent": ("Pilne", "#CE2C31"),
    "high": ("Wysoki", "#F04610"),
    "medium": ("Średni", "#E2A336"),
    "low": ("Niski", "#2A7E3B"),
}

DEFAULT_STATE_COLOR = "#60646c"

OVERDUE_ACCENT = "#CE2C31"
DUE_TODAY_ACCENT = "#3358d4"


def work_item_noun(count):
    """Polish plural forms: 1 zadanie, 2 zadania, 5 zadań."""
    if count == 1:
        return "zadanie"
    if 12 <= count % 100 <= 14:
        return "zadań"
    return "zadania" if count % 10 in (2, 3, 4) else "zadań"


def work_item_count_label(count):
    return f"{count} {work_item_noun(count)}"


def overdue_count_label(count):
    """The adjective agrees with the noun: 1 przeterminowane, 3 przeterminowane, 5 przeterminowanych."""
    if count == 1:
        return "1 przeterminowane"
    if 12 <= count % 100 <= 14:
        return f"{count} przeterminowanych"
    return f"{count} przeterminowane" if count % 10 in (2, 3, 4) else f"{count} przeterminowanych"


def days_overdue_label(days):
    return "1 dzień po terminie" if days == 1 else f"{days} dni po terminie"


def reminder_now():
    """Current time in the timezone the reminder hour is expressed in."""
    return timezone.now().astimezone(pytz.timezone(settings.WORK_ITEM_DUE_REMINDER_TIMEZONE))


@shared_task
def stack_due_reminders(force=False):
    """
    Queue one reminder email per assignee for the work items due today and the ones already overdue.

    Beat ticks every hour because celery runs on UTC, so the send is gated on the local hour instead.
    Pass force=True to send right away, ignoring both the hour and the duplicate send lock.
    """
    now_local = reminder_now()

    if not force and now_local.hour != settings.WORK_ITEM_DUE_REMINDER_HOUR:
        return

    today = now_local.date()

    # The lock outlives the tick, so a beat or worker restart within the hour cannot send twice
    if not force and not acquire_lock(lock_id=f"work-item-due-reminder-{today}", expire_time=3600):
        logging.getLogger("plane.worker").info("Due reminders already stacked, skipping")
        return

    # issue_objects already drops drafts, archived work items, archived projects and triage.
    # lte picks up both today and everything overdue, and never matches an empty target_date.
    issues = (
        Issue.issue_objects.filter(target_date__lte=today)
        .exclude(state__group__in=[StateGroup.COMPLETED, StateGroup.CANCELLED])
        .prefetch_related(Prefetch("issue_assignee", queryset=IssueAssignee.objects.select_related("assignee")))
    )

    candidates = []
    for issue in issues:
        for issue_assignee in issue.issue_assignee.all():
            assignee = issue_assignee.assignee
            if assignee.is_active and not assignee.is_bot and assignee.email:
                candidates.append((issue, assignee.id))

    if not candidates:
        return

    # Someone removed from a project keeps the assignment, so check the membership is still active
    active_memberships = set(
        ProjectMember.objects.filter(
            project_id__in={issue.project_id for issue, _ in candidates},
            member_id__in={member_id for _, member_id in candidates},
            is_active=True,
        ).values_list("project_id", "member_id")
    )

    due_today_by_receiver = defaultdict(list)
    overdue_by_receiver = defaultdict(list)
    for issue, member_id in candidates:
        if (issue.project_id, member_id) in active_memberships:
            bucket = due_today_by_receiver if issue.target_date == today else overdue_by_receiver
            bucket[member_id].append(str(issue.id))

    # Union, so someone with nothing due today still hears about their overdue work items
    for receiver_id in set(due_today_by_receiver) | set(overdue_by_receiver):
        send_due_reminder.delay(
            receiver_id=str(receiver_id),
            due_today_ids=due_today_by_receiver.get(receiver_id, []),
            overdue_ids=overdue_by_receiver.get(receiver_id, []),
        )


def build_groups(issue_ids, web_url, today, overdue=False):
    """Group work items by project, in the order they should appear in the email."""
    if not issue_ids:
        return []

    # Oldest overdue work item first, so the longest standing debt is at the top of its project
    ordering = ["workspace__name", "project__name"]
    ordering += ["target_date", "sequence_id"] if overdue else ["sequence_id"]

    groups = []
    for issue in (
        Issue.issue_objects.filter(pk__in=issue_ids)
        .select_related("project", "workspace", "state")
        .order_by(*ordering)
    ):
        project_url = f"{web_url}/{issue.workspace.slug}/projects/{issue.project_id}/issues/"
        if not groups or groups[-1]["project_id"] != str(issue.project_id):
            groups.append(
                {
                    "project_id": str(issue.project_id),
                    "workspace_name": issue.workspace.name,
                    "workspace_slug": issue.workspace.slug,
                    "project_name": issue.project.name,
                    "project_url": project_url,
                    "issues": [],
                }
            )

        priority_label, priority_color = PRIORITY_DETAILS.get(issue.priority, (None, None))
        groups[-1]["issues"].append(
            {
                "identifier": f"{issue.project.identifier}-{issue.sequence_id}",
                "name": issue.name,
                "url": f"{project_url}{issue.id}",
                "state_name": issue.state.name if issue.state else "",
                "state_color": issue.state.color if issue.state else DEFAULT_STATE_COLOR,
                "priority_label": priority_label,
                "priority_color": priority_color,
                "days_overdue_label": days_overdue_label((today - issue.target_date).days) if overdue else None,
                "due_date_label": issue.target_date.strftime("%d.%m.%Y") if overdue else None,
            }
        )

    return groups


def count_items(groups):
    return sum(len(group["issues"]) for group in groups)


@shared_task
def send_due_reminder(receiver_id, due_today_ids, overdue_ids):
    """Send a single digest email covering both the receiver's work items due today and the overdue ones."""
    try:
        receiver = User.objects.get(pk=receiver_id)
        web_url = settings.WEB_URL or settings.APP_BASE_URL
        today = reminder_now().date()

        overdue_groups = build_groups(overdue_ids, web_url, today, overdue=True)
        due_today_groups = build_groups(due_today_ids, web_url, today)
        overdue_count = count_items(overdue_groups)
        due_today_count = count_items(due_today_groups)

        # Overdue first, it is the more urgent of the two. Empty sections never reach the template.
        sections = [
            section
            for section in (
                {
                    "title": "Przeterminowane",
                    "count": overdue_count,
                    "accent": OVERDUE_ACCENT,
                    "groups": overdue_groups,
                },
                {
                    "title": "Zadania z terminem na dzisiaj",
                    "count": due_today_count,
                    "accent": DUE_TODAY_ACCENT,
                    "groups": due_today_groups,
                },
            )
            if section["groups"]
        ]

        if not sections:
            return

        today_label = today.strftime("%d.%m.%Y")
        due_today_label = work_item_count_label(due_today_count)
        overdue_label = overdue_count_label(overdue_count)

        if due_today_count and overdue_count:
            summary_text = f"{due_today_label} z terminem na dzisiaj i {overdue_label}."
            subject = f"Masz {due_today_label} na dzisiaj i {overdue_label}"
        elif due_today_count:
            summary_text = f"{due_today_label} z terminem na dzisiaj ({today_label})."
            subject = f"Masz {due_today_label} z terminem na dzisiaj ({today_label})"
        else:
            overdue_phrase = f"{overdue_label} {work_item_noun(overdue_count)}"
            summary_text = f"{overdue_phrase}."
            subject = f"Masz {overdue_phrase}"

        context = {
            "receiver_first_name": receiver.first_name,
            "summary_text": summary_text,
            "sections": sections,
            "assigned_url": f"{web_url}/{sections[0]['groups'][0]['workspace_slug']}/profile/{receiver.id}/assigned",
        }

        html_content = render_to_string("emails/notifications/work-item-due-reminder.html", context)
        text_content = generate_plain_text_from_html(html_content)

        (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_USE_SSL,
            EMAIL_FROM,
        ) = get_email_configuration()

        connection = get_connection(
            host=EMAIL_HOST,
            port=int(EMAIL_PORT),
            username=EMAIL_HOST_USER,
            password=EMAIL_HOST_PASSWORD,
            use_tls=EMAIL_USE_TLS == "1",
            use_ssl=EMAIL_USE_SSL == "1",
        )

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=EMAIL_FROM,
            to=[receiver.email],
            connection=connection,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logging.getLogger("plane.worker").info("Due reminder sent successfully")
    except User.DoesNotExist:
        return
    except Exception as e:
        log_exception(e)
        return
