# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Signals for AI service accounts.

Workspace membership of an AI bot inherits into projects: when a new project
is created, every active AI account of that workspace is added as a project
member automatically (decision recorded on PLANE-11). Implemented as a signal
so upstream project-creation code paths stay untouched.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from plane.db.models import Project, ProjectMember, WorkspaceMember


@receiver(post_save, sender=Project)
def add_ai_bots_to_new_project(sender, instance, created, **kwargs):
    if not created:
        return

    from .models import AIAccount

    accounts = AIAccount.objects.filter(
        workspace_id=instance.workspace_id, is_active=True
    ).select_related("bot_user")
    for account in accounts:
        # The project role mirrors the bot's workspace role
        role = (
            WorkspaceMember.objects.filter(
                workspace_id=instance.workspace_id,
                member=account.bot_user,
                is_active=True,
            )
            .values_list("role", flat=True)
            .first()
            or 15
        )
        membership = ProjectMember.objects.filter(
            project=instance, member=account.bot_user
        ).first()
        if membership is None:
            ProjectMember.objects.create(
                project=instance,
                member=account.bot_user,
                role=role,
                workspace_id=instance.workspace_id,
            )
        elif not membership.is_active:
            membership.is_active = True
            membership.save(update_fields=["is_active", "updated_at"])
