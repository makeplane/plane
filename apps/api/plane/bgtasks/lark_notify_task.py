# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Async tasks that bridge Plane issue events to Feishu Bot direct messages.

The dispatcher (`dispatch_lark_for_activities`) is called inline from
`issue_activities_task.issue_activity` right after IssueActivity rows are
bulk_create'd — Django's post_save signal does NOT fire on bulk_create, so
the activity audit log is the only reliable place to fan out notifications
without patching every write path. Each Celery task is best-effort: failures
are logged but never bubbled back into the originating HTTP request.
"""

# Python imports
import logging
import os
import re

# Third party
from celery import shared_task

# Module imports
from plane.utils.lark_notify import (
    card_issue_assigned,
    card_issue_comment,
    card_issue_state_changed,
    get_union_id,
    send_interactive_card,
)

logger = logging.getLogger("plane.bgtasks.lark_notify_task")


def _lark_notifications_enabled():
    return (os.environ.get("LARK_NOTIFICATIONS_ENABLED") or "").strip().lower() in (
        "1",
        "true",
        "yes",
    )


def dispatch_lark_for_activities(activities):
    """Fan out Feishu Bot DMs based on freshly-created IssueActivity rows.

    Called from issue_activities_task right after `bulk_create`. Iterates the
    same rows that just hit the DB and queues a Celery task per notifiable
    event. We do not touch the rows themselves — only read their fields.

    No-op unless LARK_NOTIFICATIONS_ENABLED is truthy. Exceptions swallowed so
    a Lark integration glitch can never break Plane's issue write paths.
    """
    if not activities or not _lark_notifications_enabled():
        return

    for activity in activities:
        try:
            issue_id = getattr(activity, "issue_id", None)
            if issue_id is None:
                continue
            field = (getattr(activity, "field", "") or "").strip()
            verb = (getattr(activity, "verb", "") or "").strip()
            actor_id = getattr(activity, "actor_id", None)
            actor_str = str(actor_id) if actor_id else None
            issue_str = str(issue_id)

            if field == "assignees" and getattr(activity, "new_identifier", None):
                # new_identifier holds the added assignee's user_id; the
                # `dropped_assignee` branch sets old_identifier instead.
                notify_issue_assigned_task.delay(
                    issue_str, str(activity.new_identifier), actor_str
                )
                continue

            if field == "state":
                old_id = getattr(activity, "old_identifier", None)
                new_id = getattr(activity, "new_identifier", None)
                notify_issue_state_changed_task.delay(
                    issue_str,
                    str(old_id) if old_id else None,
                    str(new_id) if new_id else None,
                    actor_str,
                )
                continue

            comment_id = getattr(activity, "issue_comment_id", None)
            if comment_id and field == "comment" and verb == "created":
                notify_issue_comment_task.delay(issue_str, str(comment_id), actor_str)
                continue
        except Exception:
            logger.exception("Failed to dispatch Lark notification for activity")


def _user_display(user):
    if user is None:
        return None
    return user.display_name or user.first_name or (user.email.split("@")[0] if user.email else None)


def _strip_html(s):
    if not s:
        return ""
    # Lightweight: drop tags + collapse whitespace. Comment HTML is from a
    # rich editor; we just want a single-line preview for the card.
    text = re.sub(r"<[^>]+>", " ", s)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > 140:
        text = text[:137] + "…"
    return text


@shared_task
def notify_issue_assigned_task(issue_id, assignee_id, by_user_id):
    """Fired when a user is added as assignee on an issue."""
    from plane.db.models import Issue, User

    try:
        issue = (
            Issue.objects.select_related("project", "workspace").filter(id=issue_id).first()
        )
        if issue is None:
            return
        assignee = User.objects.filter(id=assignee_id).first()
        if assignee is None:
            return
        if by_user_id and by_user_id == assignee_id:
            # Self-assignment — don't notify yourself
            return

        union_id = get_union_id(assignee)
        if not union_id:
            logger.info("No lark union_id for user %s — skipping notify", assignee_id)
            return

        by_user = User.objects.filter(id=by_user_id).first() if by_user_id else None
        send_interactive_card(union_id, card_issue_assigned(issue, _user_display(by_user)))
    except Exception:
        logger.exception("notify_issue_assigned_task failed: issue=%s assignee=%s", issue_id, assignee_id)


@shared_task
def notify_issue_state_changed_task(issue_id, old_state_id, new_state_id, by_user_id):
    """Fired when an issue's state field changes. Notifies every active
    assignee except the person who made the change."""
    from plane.db.models import Issue, State, User

    try:
        issue = (
            Issue.objects.select_related("project", "workspace")
            .prefetch_related("assignees")
            .filter(id=issue_id)
            .first()
        )
        if issue is None:
            return
        old_state = State.objects.filter(id=old_state_id).first() if old_state_id else None
        new_state = State.objects.filter(id=new_state_id).first() if new_state_id else None
        by_user = User.objects.filter(id=by_user_id).first() if by_user_id else None
        by_display = _user_display(by_user)

        for assignee in issue.assignees.all():
            if by_user_id and assignee.id == by_user_id:
                continue
            union_id = get_union_id(assignee)
            if not union_id:
                continue
            send_interactive_card(
                union_id,
                card_issue_state_changed(
                    issue,
                    getattr(old_state, "name", None),
                    getattr(new_state, "name", None),
                    by_display,
                ),
            )
    except Exception:
        logger.exception("notify_issue_state_changed_task failed: issue=%s", issue_id)


@shared_task
def notify_issue_comment_task(issue_id, comment_id, by_user_id):
    """Fired when a new comment is added to an issue. Notifies every
    active assignee except the commenter."""
    from plane.db.models import Issue, IssueComment, User

    try:
        issue = (
            Issue.objects.select_related("project", "workspace")
            .prefetch_related("assignees")
            .filter(id=issue_id)
            .first()
        )
        comment = IssueComment.objects.filter(id=comment_id).first()
        if issue is None or comment is None:
            return

        excerpt = _strip_html(comment.comment_html or comment.comment_stripped or "")
        if not excerpt:
            return

        by_user = User.objects.filter(id=by_user_id).first() if by_user_id else None
        by_display = _user_display(by_user)

        for assignee in issue.assignees.all():
            if by_user_id and assignee.id == by_user_id:
                continue
            union_id = get_union_id(assignee)
            if not union_id:
                continue
            send_interactive_card(union_id, card_issue_comment(issue, excerpt, by_display))
    except Exception:
        logger.exception("notify_issue_comment_task failed: issue=%s comment=%s", issue_id, comment_id)
