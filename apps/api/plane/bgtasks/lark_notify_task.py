# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Async tasks that bridge Plane issue events to Feishu Bot direct messages.

Signals queue these tasks via .delay(); they look up the recipient's
union_id and POST an interactive card. Each task is best-effort —
failures are logged but never propagated back to the user's web request.
"""

# Python imports
import logging
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
