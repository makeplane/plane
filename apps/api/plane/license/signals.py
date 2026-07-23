# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db.models.signals import post_save
from django.dispatch import receiver

from plane.db.models import Project, Workspace
from plane.license.models import InstanceAdmin, INSTANCE_ADMIN_ROLE
from plane.license.workspace_access import (
    grant_all_instance_admins_access,
    grant_instance_admin_access,
    revoke_instance_admin_access,
)


@receiver(post_save, sender=InstanceAdmin)
def sync_instance_admin_access(sender, instance, created, **kwargs):
    if instance.user is None:
        return
    if instance.deleted_at is not None:
        revoke_instance_admin_access(instance.user)
    elif created and instance.role >= INSTANCE_ADMIN_ROLE:
        grant_instance_admin_access(instance.user)


@receiver(post_save, sender=Workspace)
def grant_instance_admins_new_workspace_access(sender, instance, created, **kwargs):
    if created:
        grant_all_instance_admins_access(workspace=instance, exclude_users=[instance.owner])


@receiver(post_save, sender=Project)
def grant_instance_admins_new_project_access(sender, instance, created, **kwargs):
    if created:
        grant_all_instance_admins_access(
            project=instance,
            exclude_users=[instance.created_by, instance.project_lead],
        )
