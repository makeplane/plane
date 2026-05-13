# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
import os

# Django imports
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

# Module imports
from plane.bgtasks.lark_notify_task import (
    notify_issue_assigned_task,
    notify_issue_comment_task,
    notify_issue_state_changed_task,
)
from plane.bgtasks.lark_project_autojoin import (
    autojoin_workspace_members_to_project_task,
)
from plane.db.models import IssueActivity, Project

logger = logging.getLogger("plane.bgtasks.signals")


@receiver(post_save, sender=Project)
def queue_lark_project_autojoin(sender, instance, created, **kwargs):
    """When a new Project is created, queue a background job to add every
    active workspace member as a ProjectMember. The task short-circuits
    unless LARK_AUTO_JOIN_NEW_PROJECTS is enabled, so this signal is a
    cheap no-op for deploys that haven't opted in.

    Runs out-of-band via Celery rather than inline because adding 500
    members serially during project creation would block the HTTP response.
    """
    if not created or instance.id is None:
        return
    transaction.on_commit(
        lambda: autojoin_workspace_members_to_project_task.delay(str(instance.id))
    )


def _lark_notifications_enabled():
    return (os.environ.get("LARK_NOTIFICATIONS_ENABLED") or "").strip().lower() in (
        "1",
        "true",
        "yes",
    )


@receiver(post_save, sender=IssueActivity)
def dispatch_lark_issue_notifications(sender, instance, created, **kwargs):
    """Plane writes one IssueActivity row per field change — the central
    audit log. We piggyback on it to fan out Feishu Bot DMs without
    touching Plane's issue write paths.

    Three event flavours mapped to three tasks:
      field == 'assignees'          → user added (new_identifier holds user_id)
      field == 'state'              → state changed (old/new_identifier hold state ids)
      issue_comment_id is set       → comment created on the issue

    No-op unless LARK_NOTIFICATIONS_ENABLED is truthy.
    """
    if not created or not _lark_notifications_enabled():
        return
    if instance.issue_id is None:
        return

    field = (instance.field or "").strip()
    actor_id = str(instance.actor_id) if instance.actor_id else None
    issue_id = str(instance.issue_id)

    try:
        if field == "assignees" and instance.new_identifier:
            new_assignee_id = str(instance.new_identifier)
            transaction.on_commit(
                lambda: notify_issue_assigned_task.delay(issue_id, new_assignee_id, actor_id)
            )
            return

        if field == "state":
            old_state = str(instance.old_identifier) if instance.old_identifier else None
            new_state = str(instance.new_identifier) if instance.new_identifier else None
            transaction.on_commit(
                lambda: notify_issue_state_changed_task.delay(
                    issue_id, old_state, new_state, actor_id
                )
            )
            return

        if instance.issue_comment_id and instance.verb == "created":
            comment_id = str(instance.issue_comment_id)
            transaction.on_commit(
                lambda: notify_issue_comment_task.delay(issue_id, comment_id, actor_id)
            )
            return
    except Exception:
        logger.exception("Failed to dispatch Lark notification for activity %s", instance.id)
