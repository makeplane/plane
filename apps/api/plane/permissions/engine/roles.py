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
Role Lookup

Resolves role permissions: compiled O(1) lookups for system roles,
Redis-cached/DB lookups for custom roles. Also handles membership
validation and namespace mapping.
"""

import logging
from typing import Optional
from uuid import UUID

from django.core.cache import cache

from ..context import ResourceID
from ..inheritance import (
    WORKSPACE_RESOURCE_TYPES,
    TEAMSPACE_RESOURCE_TYPES,
)
from ..resource_models import get_model_for_resource

logger = logging.getLogger(__name__)


class RoleLookup:
    """Role permission resolution: compiled (system) / cached / DB (custom)."""

    def __init__(self, use_cache: bool = True):
        self.use_cache = use_cache

    def has_permission(
        self,
        relation: str,
        permission_str: str,
        tuple_resource_type: str,
        workspace_id: Optional[ResourceID] = None,
        role_permissions: Optional[set] = None,
    ) -> bool:
        """Check if a role grants a specific permission (unconditional only)."""
        compiled = self.get_compiled_role(relation, tuple_resource_type, workspace_id)
        if compiled is not None:
            return compiled.has_permission(permission_str)

        if role_permissions is not None:
            permissions = role_permissions
        else:
            permissions = self.get_cached_permissions(relation, tuple_resource_type, workspace_id)
        if permissions is None:
            return False

        from ..definitions import permission_pattern_matches

        return permission_pattern_matches(permission_str, permissions)

    def get_conditions(
        self,
        relation: str,
        permission_str: str,
        tuple_resource_type: str,
        workspace_id: Optional[ResourceID] = None,
        role_permissions: Optional[set] = None,
    ) -> list[str]:
        """Get conditions from conditional grants matching the permission."""
        compiled = self.get_compiled_role(relation, tuple_resource_type, workspace_id)
        if compiled is not None:
            return compiled.get_conditions(permission_str)

        if role_permissions is not None:
            permissions = role_permissions
        else:
            permissions = self.get_cached_permissions(relation, tuple_resource_type, workspace_id)
        if permissions is None:
            return []

        conditions = []
        for pattern in permissions:
            if "+" not in pattern:
                continue
            base_perm, condition = pattern.split("+", 1)
            if base_perm == permission_str:
                conditions.append(condition)
            elif base_perm.endswith(":*"):
                resource = base_perm[:-2]
                if permission_str.startswith(f"{resource}:"):
                    conditions.append(condition)
        return conditions

    def get_compiled_role(self, relation: str, tuple_resource_type: str, workspace_id: Optional[ResourceID] = None):
        """Get a CompiledPermissions object for a role (system roles only).

        Returns the CompiledPermissions for O(1) lookups, or None if
        this is a custom role (caller should fall back to iteration).
        """
        from ..system_roles import get_compiled_permissions

        role_namespace = self.get_namespace(tuple_resource_type)
        return get_compiled_permissions(relation, role_namespace)

    def get_cached_permissions(
        self,
        relation: str,
        tuple_resource_type: str,
        workspace_id: Optional[ResourceID] = None,
    ) -> Optional[set]:
        """
        Get cached role permissions set. Returns None if role not found.

        Two-tier lookup:
        1. Fast path: system roles resolve from in-memory definitions.
        2. Slow path: custom roles use Redis cache → PermissionScheme JOIN query.
        """
        from .core import ROLE_CACHE_TTL

        role_namespace = self.get_namespace(tuple_resource_type)

        from ..system_roles import get_system_role_permission_set

        system_perms = get_system_role_permission_set(relation, role_namespace)
        if system_perms is not None:
            return system_perms

        if role_namespace == "instance":
            cache_key = f"role_perms:instance:{role_namespace}:{relation}"
        else:
            if not workspace_id:
                return None
            cache_key = f"role_perms:{workspace_id}:{role_namespace}:{relation}"

        if self.use_cache:
            cached = cache.get(cache_key)
            if cached is not None:
                return cached

        # 3. Cache miss — resolve from DB via Permission Schemes (single JOIN query)
        from plane.db.models.permission import PermissionScheme
        from plane.permissions.permission_schemes import deduplicate_conditionals

        perm_lists = list(
            PermissionScheme.objects.filter(
                role_permission_schemes__role__slug=relation,
                role_permission_schemes__role__workspace_id=workspace_id,
                role_permission_schemes__role__namespace=role_namespace,
                role_permission_schemes__role__deleted_at__isnull=True,
                role_permission_schemes__deleted_at__isnull=True,
                deleted_at__isnull=True,
            ).values_list("permissions", flat=True)
        )

        if not perm_lists:
            result = frozenset()
        else:
            all_perms: set[str] = set()
            for perm_list in perm_lists:
                all_perms.update(perm_list)
            result = deduplicate_conditionals(all_perms)

        if self.use_cache:
            cache.set(cache_key, result, ROLE_CACHE_TTL)
        return result

    def get_namespace(self, resource_type: str) -> str:
        """Map a resource_type to its role namespace for Role table lookup."""
        if resource_type == "instance":
            return "instance"
        elif resource_type in WORKSPACE_RESOURCE_TYPES:
            return "workspace"
        elif resource_type in TEAMSPACE_RESOURCE_TYPES:
            return "teamspace"
        else:
            return "project"

    def has_active_membership(
        self,
        user_id: UUID,
        resource_type: str,
        resource_id: UUID,
        workspace_id: Optional[ResourceID],
        hierarchy_chain: Optional[list] = None,
        direct_tuples: Optional[dict] = None,
    ) -> bool:
        """
        Check if user has active membership via direct tuple lookup.

        This is NOT a permission check — it checks for tuple existence.
        Used to verify that a user is still an active member before granting
        creator-based permissions.
        """
        # Normalize workspace_id to UUID — hierarchy chain and direct_tuples
        # use UUID keys, but callers may pass a string (e.g., from middleware).
        if workspace_id and not isinstance(workspace_id, UUID):
            workspace_id = UUID(str(workspace_id))

        project_id = None
        if hierarchy_chain:
            for h_type, h_id in hierarchy_chain:
                if h_type == "project":
                    project_id = h_id
                    break
        if project_id is None:
            project_id = self.get_project_id_from_resource(resource_type, resource_id)

        if project_id:
            namespace, check_type, check_id = "project", "project", project_id
        elif workspace_id:
            namespace, check_type, check_id = "workspace", "workspace", workspace_id
        else:
            return False

        valid_relations = set(self.get_valid_role_slugs(namespace, workspace_id))

        if direct_tuples is not None:
            prefetched = direct_tuples.get((check_type, check_id), [])
            for tup in prefetched:
                if tup.relation in valid_relations:
                    return True
            if check_type == "project" and workspace_id:
                ws_tuples = direct_tuples.get(("workspace", workspace_id), [])
                ws_valid = set(self.get_valid_role_slugs("workspace", workspace_id))
                for tup in ws_tuples:
                    if tup.relation in ws_valid:
                        return True
            return False

        from plane.db.models import ResourcePermission

        return ResourcePermission.objects.filter(
            subject_type="user",
            subject_id=user_id,
            resource_type=check_type,
            resource_id=check_id,
            relation__in=valid_relations,
            deleted_at__isnull=True,
        ).exists()

    def get_valid_role_slugs(self, namespace: str, workspace_id: Optional[ResourceID]) -> list[str]:
        """Get all valid role slugs for a namespace (system + custom)."""
        from .core import ROLE_CACHE_TTL
        from ..system_roles import SYSTEM_ROLE_SLUGS

        system_slugs = list(SYSTEM_ROLE_SLUGS.get(namespace, frozenset()))

        if namespace == "instance":
            return system_slugs

        cache_key = f"custom_role_slugs:{workspace_id}:{namespace}"
        custom_slugs = None
        if self.use_cache:
            custom_slugs = cache.get(cache_key)

        if custom_slugs is None:
            from plane.db.models import Role

            custom_slugs = list(
                Role.objects.filter(
                    workspace_id=workspace_id,
                    namespace=namespace,
                    is_system=False,
                    deleted_at__isnull=True,
                ).values_list("slug", flat=True)
            )
            if self.use_cache:
                cache.set(cache_key, custom_slugs, ROLE_CACHE_TTL)

        return system_slugs + custom_slugs

    def get_project_id_from_resource(self, resource_type: str, resource_id: UUID) -> Optional[UUID]:
        """Get project_id for a resource."""
        model = get_model_for_resource(resource_type)
        if not model:
            return None

        if resource_type == "project":
            return resource_id

        try:
            instance = model.objects.filter(id=resource_id).values("project_id").first()
            return instance.get("project_id") if instance else None
        except Exception as e:
            logger.warning("[PERM] Error getting project_id from resource: %s", e)
            return None
