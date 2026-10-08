# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Stop running timers when their owner loses access or their project is archived (plan 6.8)."""

# Django imports
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

# Module imports
from plane.db.models import Project, ProjectMember, WorkspaceMember

from .services import running_entries, stop_timer


def _stop_running(**lookup):
    with transaction.atomic():
        for entry in running_entries().filter(**lookup).select_for_update(of=("self",)).select_related("user"):
            stop_timer(entry, auto=True)


@receiver(post_save, sender=ProjectMember, dispatch_uid="time_tracking_project_member_deactivated")
def stop_timer_on_project_member_removed(sender, instance, created, **kwargs):
    if not instance.is_active and not kwargs.get("raw"):
        _stop_running(user_id=instance.member_id, project_id=instance.project_id)


@receiver(post_save, sender=WorkspaceMember, dispatch_uid="time_tracking_workspace_member_deactivated")
def stop_timer_on_workspace_member_removed(sender, instance, created, **kwargs):
    # Workspace removal deactivates project memberships with a bulk update(), which sends no signal.
    if not instance.is_active and not kwargs.get("raw"):
        _stop_running(user_id=instance.member_id, workspace_id=instance.workspace_id)


@receiver(post_save, sender=Project, dispatch_uid="time_tracking_project_archived")
def stop_timers_on_project_archived(sender, instance, created, **kwargs):
    if instance.archived_at is not None and not created and not kwargs.get("raw"):
        _stop_running(project_id=instance.id)
