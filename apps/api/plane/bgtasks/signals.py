# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

# Module imports
from plane.bgtasks.lark_project_autojoin import (
    autojoin_workspace_members_to_project_task,
)
from plane.db.models import Project


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
    # transaction.on_commit so we don't fire while the Project row may still
    # be rolled back by an enclosing transaction.
    transaction.on_commit(
        lambda: autojoin_workspace_members_to_project_task.delay(str(instance.id))
    )
