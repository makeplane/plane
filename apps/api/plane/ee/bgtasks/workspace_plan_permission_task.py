# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import logging

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Workspace, ResourcePermission

logger = logging.getLogger(__name__)

FREE_PRO_ONE = {"FREE", "PRO", "ONE"}


@shared_task
def resync_workspace_admin_permissions(workspace_id, new_plan):
    """Re-sync role=20 workspace member permissions after a plan change.

    Uses PermissionEngine.bulk_grant() to update affected permissions so that
    audit logs are created and per-user caches are invalidated.

    - Free/Pro/One: all role=20 → "owner"
    - Business/Enterprise: role=20 → "admin", except Workspace.owner → "owner"
    """
    from plane.permissions.engine import PermissionEngine
    from plane.permissions.grants import Grant

    engine = PermissionEngine(use_cache=False)

    try:
        workspace = Workspace.objects.get(id=workspace_id)
    except Workspace.DoesNotExist:
        logger.warning("Workspace %s not found, skipping permission resync", workspace_id)
        return

    if new_plan in FREE_PRO_ONE:
        # Downgrade: all admin relations become owner
        affected = ResourcePermission.objects.filter(
            subject_type="user",
            resource_type="workspace",
            resource_id=workspace_id,
            relation="admin",
            deleted_at__isnull=True,
        )
        grants = [
            Grant(
                subject_type="user",
                subject_id=perm.subject_id,
                relation="owner",
                resource_type="workspace",
                resource_id=workspace_id,
                workspace_id=workspace_id,
            )
            for perm in affected
        ]
    else:
        # Upgrade: determine which user is the FK owner
        owner_id = workspace.owner_id

        # All owner/admin relations need to be re-evaluated
        affected = ResourcePermission.objects.filter(
            subject_type="user",
            resource_type="workspace",
            resource_id=workspace_id,
            relation__in=["owner", "admin"],
            deleted_at__isnull=True,
        )
        grants = [
            Grant(
                subject_type="user",
                subject_id=perm.subject_id,
                relation="owner" if perm.subject_id == owner_id else "admin",
                resource_type="workspace",
                resource_id=workspace_id,
                workspace_id=workspace_id,
            )
            for perm in affected
        ]

    if grants:
        engine.bulk_grant(granter=None, grants=grants)

    # Also update role_ref FK on affected WorkspaceMember records so it stays in sync
    from plane.db.models import WorkspaceMember
    from plane.db.models.permission import Role

    ws_roles = {
        r.slug: r
        for r in Role.objects.filter(
            workspace_id=workspace_id,
            namespace="workspace",
            is_system=True,
            deleted_at__isnull=True,
        )
    }
    affected_members = WorkspaceMember.objects.filter(
        workspace_id=workspace_id, role=20, is_active=True, deleted_at__isnull=True
    )
    to_update = []
    for member in affected_members:
        # Free/Pro/One: ALL role=20 → owner. Business/Enterprise: only FK owner → owner, rest → admin.
        if new_plan in FREE_PRO_ONE:
            target_slug = "owner"
        else:
            target_slug = "owner" if member.member_id == workspace.owner_id else "admin"
        role_obj = ws_roles.get(target_slug)
        if role_obj and member.role_ref_id != role_obj.id:
            member.role_ref_id = role_obj.id
            to_update.append(member)
    if to_update:
        WorkspaceMember.objects.bulk_update(to_update, ["role_ref_id"], batch_size=100)
