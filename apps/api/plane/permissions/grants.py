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

"""
Grant Operations

Grant dataclass and standalone functions for granting, revoking, and
cache-invalidating permissions. These were extracted from PermissionEngine
to keep the engine focused on permission resolution.
"""

import logging
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Union
from uuid import UUID

from django.db import transaction
from django.db.models import Q

from .cache import invalidate_cache_for_resource, invalidate_caches_for_subject
from .context import ResourceID
from .definitions import ResourceType

logger = logging.getLogger(__name__)


@dataclass
class Grant:
    """A single grant request for grant_permission() and bulk_grant_permissions()."""

    subject_type: str
    subject_id: UUID
    relation: str
    resource_type: str
    resource_id: UUID
    workspace_id: ResourceID
    permissions_grant: Optional[list] = field(default=None)
    permissions_deny: Optional[list] = field(default=None)
    expires_at: Optional[datetime] = field(default=None)
    condition: Optional[dict] = field(default=None)


def grant_permission(granter, grant_obj: Grant):
    """
    Grant a permission/relation to a subject on a resource.

    Args:
        granter: The user granting the permission
        grant_obj: A Grant dataclass with all grant details

    Returns:
        The created or updated ResourcePermission
    """
    from plane.db.models import ResourcePermission, PermissionAuditLog

    resource_type_str = str(grant_obj.resource_type)
    granter_id = granter.id if hasattr(granter, "id") else granter

    # Create or update the active permission. Soft-deleted records are left as
    # tombstones; `objects` (active-only manager) ensures we never match them.
    perm, created = ResourcePermission.objects.update_or_create(
        subject_type=grant_obj.subject_type,
        subject_id=grant_obj.subject_id,
        resource_type=resource_type_str,
        resource_id=grant_obj.resource_id,
        defaults={
            "workspace_id": grant_obj.workspace_id,
            "relation": grant_obj.relation,
            "granted_by_id": granter_id,
            "permissions_grant": grant_obj.permissions_grant or [],
            "permissions_deny": grant_obj.permissions_deny or [],
            "expires_at": grant_obj.expires_at,
            "condition": grant_obj.condition,
        },
    )

    # Log the action
    PermissionAuditLog.objects.create(
        workspace_id=grant_obj.workspace_id,
        action="grant" if created else "modify",
        actor_id=granter_id,
        subject_type=grant_obj.subject_type,
        subject_id=grant_obj.subject_id,
        resource_type=resource_type_str,
        resource_id=grant_obj.resource_id,
        relation_after=grant_obj.relation,
        metadata={
            "permissions_grant": grant_obj.permissions_grant,
            "permissions_deny": grant_obj.permissions_deny,
        },
    )

    # Invalidate cache
    invalidate_caches_for_subject(grant_obj.subject_type, grant_obj.subject_id)
    invalidate_cache_for_resource(resource_type_str, grant_obj.resource_id)

    return perm


def bulk_grant_permissions(granter, grants: list[Grant]) -> list:
    """
    Grant multiple permissions in bulk with minimal queries.

    Args:
        granter: The user granting the permissions
        grants: List of Grant dataclasses

    Returns:
        List of created/updated ResourcePermission objects

    Query cost: 1 prefetch + 1 bulk_update + 1 bulk_create + 1 audit bulk_create
    (vs 2-3N queries with individual grant_permission() calls).
    """
    if not grants:
        return []

    from plane.db.models import ResourcePermission, PermissionAuditLog

    granter_id = granter.id if hasattr(granter, "id") else granter if granter else None

    # Steps 1-5 run in a transaction with row locking to prevent
    # concurrent bulk_grant calls from reading stale state (TOCTOU).
    with transaction.atomic():
        # Step 1: Prefetch existing records with row lock
        by_resource = defaultdict(set)
        for g in grants:
            by_resource[(g.subject_type, str(g.resource_type), g.resource_id)].add(g.subject_id)

        q = Q()
        for (st, rt, rid), sids in by_resource.items():
            q |= Q(subject_type=st, resource_type=rt, resource_id=rid, subject_id__in=list(sids))

        existing = {
            (p.subject_type, p.subject_id, p.resource_type, p.resource_id): p
            for p in ResourcePermission.objects.select_for_update().filter(q)
        }

        # Step 2: Partition into creates vs updates
        to_create = []
        to_update = []
        audit_logs = []

        for g in grants:
            resource_type_str = str(g.resource_type)
            key = (g.subject_type, g.subject_id, resource_type_str, g.resource_id)
            existing_perm = existing.get(key)

            if existing_perm:
                # Update existing active record
                existing_perm.relation = g.relation
                existing_perm.workspace_id = g.workspace_id
                existing_perm.granted_by_id = granter_id
                existing_perm.permissions_grant = g.permissions_grant or []
                existing_perm.permissions_deny = g.permissions_deny or []
                existing_perm.expires_at = g.expires_at
                existing_perm.condition = g.condition
                to_update.append(existing_perm)

                audit_logs.append(
                    PermissionAuditLog(
                        workspace_id=g.workspace_id,
                        action="modify",
                        actor_id=granter_id,
                        subject_type=g.subject_type,
                        subject_id=g.subject_id,
                        resource_type=resource_type_str,
                        resource_id=g.resource_id,
                        relation_after=g.relation,
                        metadata={
                            "permissions_grant": g.permissions_grant,
                            "permissions_deny": g.permissions_deny,
                        },
                    )
                )
            else:
                # Create new record
                perm = ResourcePermission(
                    workspace_id=g.workspace_id,
                    subject_type=g.subject_type,
                    subject_id=g.subject_id,
                    relation=g.relation,
                    resource_type=resource_type_str,
                    resource_id=g.resource_id,
                    granted_by_id=granter_id,
                    permissions_grant=g.permissions_grant or [],
                    permissions_deny=g.permissions_deny or [],
                    expires_at=g.expires_at,
                    condition=g.condition,
                )
                to_create.append(perm)

                audit_logs.append(
                    PermissionAuditLog(
                        workspace_id=g.workspace_id,
                        action="grant",
                        actor_id=granter_id,
                        subject_type=g.subject_type,
                        subject_id=g.subject_id,
                        resource_type=resource_type_str,
                        resource_id=g.resource_id,
                        relation_after=g.relation,
                        metadata={
                            "permissions_grant": g.permissions_grant,
                            "permissions_deny": g.permissions_deny,
                        },
                    )
                )

        # Step 3: Bulk update existing records
        if to_update:
            ResourcePermission.objects.bulk_update(
                to_update,
                fields=[
                    "relation",
                    "workspace_id",
                    "granted_by_id",
                    "permissions_grant",
                    "permissions_deny",
                    "expires_at",
                    "condition",
                ],
                batch_size=5000,
            )

        # Step 4: Bulk create new records
        if to_create:
            ResourcePermission.objects.bulk_create(to_create, ignore_conflicts=True, batch_size=5000)

        # Step 5: Bulk create audit logs
        if audit_logs:
            PermissionAuditLog.objects.bulk_create(audit_logs, batch_size=5000)

    # Step 6: Batch cache invalidation (outside transaction — no DB lock held)
    subjects = {(g.subject_type, g.subject_id) for g in grants}
    for subject_type, subject_id in subjects:
        invalidate_caches_for_subject(subject_type, subject_id)

    return to_update + to_create


def revoke_permission(
    revoker,
    subject_type: str,
    subject_id: UUID,
    resource_type: Union[ResourceType, str],
    resource_id: UUID,
    workspace_id: ResourceID,
) -> bool:
    """
    Revoke a permission from a subject on a resource.

    Returns True if a permission was revoked, False if none existed.
    """
    from plane.db.models import ResourcePermission, PermissionAuditLog

    resource_type_str = str(resource_type)
    revoker_id = revoker.id if hasattr(revoker, "id") else revoker

    try:
        perm = ResourcePermission.objects.get(
            subject_type=subject_type,
            subject_id=subject_id,
            resource_type=resource_type_str,
            resource_id=resource_id,
            deleted_at__isnull=True,
        )

        old_relation = perm.relation
        perm.delete()  # Soft delete

        # Log the action
        PermissionAuditLog.objects.create(
            workspace_id=workspace_id,
            action="revoke",
            actor_id=revoker_id,
            subject_type=subject_type,
            subject_id=subject_id,
            resource_type=resource_type_str,
            resource_id=resource_id,
            relation_before=old_relation,
        )

        # Invalidate cache
        invalidate_caches_for_subject(subject_type, subject_id)
        invalidate_cache_for_resource(resource_type_str, resource_id)

        return True

    except ResourcePermission.DoesNotExist:
        return False
