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
Permission Engine

Public API for Zanzibar-style permission checking. PermissionEngine is a
composed facade that delegates to focused helper classes:

    HierarchyResolver  — builds resource→parent chain, IDOR validation
    TupleFetcher       — prefetches ResourcePermission tuples + link relations
    PermissionResolver — the core deny→grant→role→conditions→links loop
    RoleLookup         — compiled/cached/DB role permission resolution
    ConditionEvaluator — creator, lead condition handlers

Resolution order (per hierarchy level):
1. Explicit DENY → False
2. Explicit GRANT → True
3. Role permissions → system roles (O(1) compiled) or custom (cached/DB)
4. Conditional grants (+creator, +lead) → evaluate against resource
5. Link relations (tuple traversal) → e.g., teamspace → project
6. Inherited from parent → next hierarchy level
7. Default → False

Logging:
- INFO: One line per permission check result + grant/revoke events
    [PERM] ALLOWED user=<uuid> perm=workitem:edit resource=project:<uuid>
    [PERM] GRANT <uuid> -> contributor on project:<uuid>
- WARNING: Denials, IDOR mismatches, invalid permissions
- DEBUG: Cache hit/miss
"""

from __future__ import annotations

import logging
from typing import Optional, Union
from uuid import UUID
from django.core.cache import cache
from django.db.models import Q
from django.utils import timezone
from ..definitions import (
    ResourceType,
    Permission,
    is_valid_permission,
)
from ..context import PermissionContext, ResourceID, AccessResult
from ..grants import Grant, grant_permission, bulk_grant_permissions, revoke_permission
from .hierarchy import HierarchyResolver
from .tuples import TupleFetcher, ResolvedLinkPerm  # noqa: F401 (re-exported via __init__)
from .roles import RoleLookup
from .conditions import ConditionEvaluator
from .resolver import PermissionResolver
from .queries import PermissionQueries

logger = logging.getLogger(__name__)


# Cache TTLs
PERMISSION_CACHE_TTL = 300  # 5 minutes (versioned invalidation on grant/revoke + role change)
ROLE_CACHE_TTL = 86400  # 24 hours (actively invalidated via ChangeTrackerMixin on Role)


class PermissionEngine:
    """
    Composed facade for permission checking.

    Delegates to focused helper classes (created in __init__):
    - _hierarchy  (HierarchyResolver)  — chain building, IDOR validation
    - _tuples     (TupleFetcher)       — prefetch tuples + link relations
    - _resolver   (PermissionResolver) — the Zanzibar deny→grant→role loop
    - _roles      (RoleLookup)         — compiled/cached/DB role resolution
    - _conditions (ConditionEvaluator) — creator, lead handlers
    - _queries    (PermissionQueries)  — accessible resources, permission matrices

    Usage:
        engine = PermissionEngine()

        # Check a single permission
        if engine.check(user, WorkitemPermissions.EDIT, issue_id):
            ...

        # Get all permissions for a resource
        perms = engine.get_permissions(user, ResourceType.WORKITEM, issue_id)

    Use PermissionEngine(use_cache=False) for sync operations and tests.
    """

    def __init__(self, use_cache: bool = True):
        self.use_cache = use_cache
        self._hierarchy = HierarchyResolver()
        self._tuples = TupleFetcher()
        self._roles = RoleLookup(use_cache=use_cache)
        self._conditions = ConditionEvaluator()
        self._resolver = PermissionResolver(
            roles=self._roles, conditions=self._conditions,
        )
        self._queries = PermissionQueries(roles=self._roles)

    def _get_cache_key(
        self,
        user_id: UUID,
        permission_str: str,
        context: PermissionContext,
        defer_conditions: bool = False,
        version: Optional[int] = None,
    ) -> str:
        """
        Generate a versioned cache key for permission check.

        Uses a per-user version counter to enable O(1) cache invalidation.
        When permissions change, the version is incremented and all old
        cache entries (with the previous version) become orphaned and
        expire naturally via TTL.

        Args:
            version: Pre-fetched version counter. When provided, skips the
                     Redis lookup. Used by batch callers to avoid N redundant
                     version fetches.
        """
        if version is None:
            version = cache.get(f"perm_v:{user_id}", 0) or 0
        workspace_part = context.workspace_id or "none"
        project_part = context.project_id or "none"
        defer_part = "1" if defer_conditions else "0"
        return (
            f"perm:{user_id}:v{version}:{permission_str}:"
            f"{context.scope_type}:{context.scope_id}:{workspace_part}:{project_part}:{defer_part}"
        )

    def check(
        self,
        user,
        permission: Permission,
        context: Optional[PermissionContext] = None,
        resource_id: Optional[UUID] = None,
        workspace_id: Optional[ResourceID] = None,
        project_id: Optional[UUID] = None,
        scope_param_type: Optional[Union[ResourceType, str]] = None,
        resource_model=None,
        defer_conditions: bool = False,
    ) -> "AccessResult":
        """
        Check if a user has permission to perform an action on a resource.

        Args:
            user: The user to check (can be User object or user_id)
            permission: The Permission object to check (e.g., WorkitemPermissions.VIEW)
            context: Explicit permission context describing where tuples should be checked
            resource_model: Optional Django model class for the resource being checked.
                           Used by conditional grants (e.g., creator condition) to resolve
                           the resource without relying on the model map. Passed by the
                           decorator from the view's model attribute.
            defer_conditions: When True, conditional grants are returned without evaluation
                             (as AccessResult.conditions) for the view to filter via queryset.
                             Used for list operations where conditions can't be evaluated
                             against the parent resource. Default False preserves backward compat.

        Returns:
            AccessResult with allowed/conditions. bool(result) is True only for
            unconditional allow, preserving backward compatibility.

        Example - List operation:
            # Check if user can view issues in a project
            check(user, WorkitemPermissions.VIEW, project_id,
                  scope_param_type="project")
            # This checks for "issue:view" permission but looks up tuples on the project

        Creator Patterns:
            Conditional grants (e.g., "workitem:delete+creator" in system_roles.py):
                Evaluated automatically during role permission resolution.

            Creator-only business rules (e.g., only the creator can edit a view):
                Handled via inline checks in the view layer, not the engine.
        """
        permission_str = str(permission)  # e.g., "workitem:view"
        user_id = user.id if hasattr(user, "id") else user

        if context is None:
            if resource_id is None:
                raise ValueError("Either context or resource_id must be provided")
            context = self._build_context_from_legacy(resource_id, workspace_id, project_id, scope_param_type)

        lookup_type_str = context.resolved_resource_type or str(permission.resource_type)
        resource_id = context.scope_id
        workspace_id = context.workspace_id
        project_id = context.project_id

        # Validate the permission combination
        if not is_valid_permission(permission.resource_type, permission.action):
            logger.warning("[PERM] Invalid permission: %s", permission_str)
            return AccessResult(allowed=False)

        # Check cache first
        cache_key = self._get_cache_key(
            user_id, permission_str, context, defer_conditions=defer_conditions,
        )
        cached = cache.get(cache_key) if self.use_cache else None
        if cached is not None:
            logger.debug("[PERM] Cache HIT for %s", permission_str)
            return AccessResult.from_cache(cached)

        logger.debug("[PERM] Cache MISS for %s", permission_str)

        # Resolve permission: build hierarchy → prefetch tuples → resolve
        hierarchy_chain = self._build_hierarchy_chain(
            lookup_type_str, resource_id, workspace_id, project_id=project_id,
        )
        direct_tuples, link_tuples = self._tuples.prefetch(user_id, hierarchy_chain)
        result = self._resolver.resolve(
            user_id=user_id,
            permission_str=permission_str,
            hierarchy_chain=hierarchy_chain,
            direct_tuples=direct_tuples,
            link_tuples=link_tuples,
            original_resource_type=hierarchy_chain[0][0],
            original_resource_id=hierarchy_chain[0][1],
            workspace_id=workspace_id,
            defer_conditions=defer_conditions,
            resource_model=resource_model,
        )

        # Cache result
        if self.use_cache:
            cache.set(cache_key, result.to_cache(), PERMISSION_CACHE_TTL)

        # INFO: one line per permission check for production observability
        logger.info(
            "[PERM] %s user=%s perm=%s resource=%s:%s",
            "ALLOWED" if result else "DENIED",
            user_id, permission_str, lookup_type_str, resource_id,
        )

        return result

    def check_batch(
        self,
        user,
        permissions: list[Permission],
        context: Optional[PermissionContext] = None,
        resource_id: Optional[UUID] = None,
        workspace_id: Optional[ResourceID] = None,
        scope_param_type: Optional[Union[ResourceType, str]] = None,
        defer_conditions: bool = False,
    ) -> dict[str, "AccessResult"]:
        """
        Check multiple permissions against the same resource in batch.

        Builds hierarchy chain and prefetches tuples ONCE, then resolves
        each permission in-memory. Reduces 100-500+ queries to 1-3.

        Args:
            user: The user to check
            permissions: List of Permission objects to check
            context: Explicit permission context describing where tuples should be checked
            defer_conditions: When True, conditional grants are returned without evaluation

        Returns:
            Dict mapping permission string -> AccessResult
        """
        if not permissions:
            return {}

        if context is None:
            if resource_id is None:
                raise ValueError("Either context or resource_id must be provided")
            context = self._build_context_from_legacy(resource_id, workspace_id, None, scope_param_type)

        user_id = user.id if hasattr(user, "id") else user
        lookup_type_str = context.resolved_resource_type

        # Build hierarchy chain ONCE
        first_perm = permissions[0]
        base_resource_type = lookup_type_str or str(first_perm.resource_type)
        hierarchy_chain = self._build_hierarchy_chain(
            base_resource_type,
            context.scope_id,
            context.workspace_id,
            project_id=context.project_id,
        )

        original_resource_type = hierarchy_chain[0][0]
        original_resource_id = hierarchy_chain[0][1]

        # Prefetch tuples ONCE
        direct_tuples, link_tuples = self._tuples.prefetch(user_id, hierarchy_chain)

        results = {}

        # --- Batch cache read (1 version GET + 1 get_many) ---
        perm_keys = {}
        if self.use_cache:
            version = cache.get(f"perm_v:{user_id}", 0) or 0
            for perm in permissions:
                perm_str = str(perm)
                perm_keys[perm_str] = self._get_cache_key(
                    user_id, perm_str, context, defer_conditions, version=version,
                )
            cached_values = cache.get_many(list(perm_keys.values()))
            for perm_str, cache_key in perm_keys.items():
                if cache_key in cached_values:
                    results[perm_str] = AccessResult.from_cache(cached_values[cache_key])

        # --- Resolve uncached in-memory using prefetched data ---
        to_cache = {}
        for perm in permissions:
            permission_str = str(perm)
            if permission_str in results:
                continue

            result = self._resolver.resolve(
                user_id=user_id,
                permission_str=permission_str,
                hierarchy_chain=hierarchy_chain,
                direct_tuples=direct_tuples,
                link_tuples=link_tuples,
                original_resource_type=original_resource_type,
                original_resource_id=original_resource_id,
                workspace_id=context.workspace_id,
                defer_conditions=defer_conditions,
            )
            results[permission_str] = result
            if self.use_cache:
                to_cache[perm_keys[permission_str]] = result.to_cache()

        # --- Batch cache write (1 set_many) ---
        if to_cache:
            cache.set_many(to_cache, PERMISSION_CACHE_TTL)

        return results

    def _build_context_from_legacy(
        self,
        resource_id: UUID,
        workspace_id: Optional[ResourceID],
        project_id: Optional[UUID],
        scope_param_type: Optional[Union[ResourceType, str]],
    ) -> PermissionContext:
        """Build PermissionContext from legacy keyword arguments."""
        scope_val = str(scope_param_type) if scope_param_type else None
        if scope_val == "workspace":
            return PermissionContext.workspace(resource_id)
        if scope_val == "project":
            if not workspace_id:
                raise ValueError("workspace_id is required for project scope")
            return PermissionContext.project(project_id=resource_id, workspace_id=workspace_id)
        if scope_val == "teamspace":
            if not workspace_id:
                raise ValueError("workspace_id is required for teamspace scope")
            return PermissionContext.teamspace(teamspace_id=resource_id, workspace_id=workspace_id)
        return PermissionContext.resource(
            scope_id=resource_id,
            workspace_id=workspace_id,
            project_id=project_id,
            resource_type=scope_val,
        )

    # --- Delegation to sub-objects ---
    # These thin wrappers exist because tests call them via the engine instance
    # (e.g., engine._build_hierarchy_chain). Internal code calls them too for
    # readability, but the real logic lives in the sub-objects.

    def _build_hierarchy_chain(self, resource_type, resource_id, workspace_id=None, project_id=None):
        return self._hierarchy.build_chain(resource_type, resource_id, workspace_id, project_id)

    def _batch_build_hierarchy_chains(self, resource_type, resource_ids, workspace_id=None):
        return self._hierarchy.batch_build_chains(resource_type, resource_ids, workspace_id)

    def _get_parent_id(self, resource_type, resource_id, parent_field):
        return self._hierarchy._get_parent_id(resource_type, resource_id, parent_field)

    def get_grant_conditions(
        self,
        user,
        permission: Permission,
        resource_id: UUID,
        workspace_id: Optional[ResourceID] = None,
    ) -> list[str]:
        """
        Get conditions from the user's role grants for a permission (without evaluating).

        Used by /permissions/me/ endpoint to return conditional permission strings
        to the FE (e.g., "comment:edit+creator").

        Returns a list of condition names (e.g., ["creator"]).
        """
        from plane.db.models import ResourcePermission

        user_id = user.id if hasattr(user, "id") else user
        permission_str = str(permission)

        # Get user's tuples on the resource
        tuples = ResourcePermission.objects.filter(
            subject_type="user",
            subject_id=user_id,
            resource_id=resource_id,
            deleted_at__isnull=True,
        ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))

        conditions = set()
        for tup in tuples:
            result = self._roles.get_conditions(tup.relation, permission_str, tup.resource_type, workspace_id)
            conditions.update(result)
        return list(conditions)

    def get_permissions(
        self,
        user,
        resource_type: Union[ResourceType, str],
        resource_id: UUID,
        workspace_id: Optional[ResourceID] = None,
    ) -> dict[str, bool]:
        """
        Get all permissions for a user on a resource.

        Returns a dictionary of permission strings to boolean values.

        Example:
            {
                "can_view": True,
                "can_edit": True,
                "can_delete": False,
                "can_assign": True,
                ...
            }
        """
        from ..definitions import get_all_permissions_for_resource

        resource_type_str = str(resource_type)

        try:
            rt = ResourceType(resource_type_str)
        except ValueError:
            return {}

        relevant_perms = get_all_permissions_for_resource(rt)
        if not relevant_perms:
            return {}

        batch_results = self.check_batch(
            user=user,
            permissions=relevant_perms,
            context=PermissionContext.resource(
                scope_id=resource_id,
                workspace_id=workspace_id,
                resource_type=resource_type_str,
            ),
        )

        result = {}
        for perm in relevant_perms:
            perm_str = str(perm)
            access_result = batch_results.get(perm_str)
            result[f"can_{perm.action}"] = bool(access_result) if access_result else False
        return result

    def get_user_relation(
        self,
        user,
        resource_type: Union[ResourceType, str],
        resource_id: UUID,
    ) -> Optional[str]:
        """
        Get the relation a user has to a resource.

        Returns the relation name (e.g., "admin", "member") or None if no relation.
        """
        from plane.db.models import ResourcePermission

        user_id = user.id if hasattr(user, "id") else user
        resource_type_str = str(resource_type)

        return (
            ResourcePermission.objects.filter(
                subject_type="user",
                subject_id=user_id,
                resource_type=resource_type_str,
                resource_id=resource_id,
                deleted_at__isnull=True,
            )
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
            .values_list("relation", flat=True)
            .first()
        )

    def grant(self, granter, grant: Grant):
        """Grant a permission/relation. Delegates to grants module."""
        result = grant_permission(granter, grant)
        logger.info(
            "[PERM] GRANT %s -> %s on %s:%s",
            grant.subject_id, grant.relation, grant.resource_type, grant.resource_id,
        )
        return result

    def bulk_grant(self, granter, grants: list[Grant]) -> list:
        """Bulk grant permissions. Delegates to grants module."""
        return bulk_grant_permissions(granter, grants)

    def revoke(self, revoker, subject_type, subject_id, resource_type, resource_id, workspace_id) -> bool:
        """Revoke a permission. Delegates to grants module."""
        result = revoke_permission(
            revoker, subject_type, subject_id, resource_type, resource_id, workspace_id
        )
        logger.info(
            "[PERM] REVOKE %s on %s:%s", subject_id, resource_type, resource_id,
        )
        return result

    def bulk_check(
        self,
        user,
        permission: Permission,
        resource_ids: list[UUID],
        workspace_id: Optional[ResourceID] = None,
    ) -> dict[UUID, bool]:
        """
        Check one permission across multiple resources efficiently.

        Batch-builds hierarchy chains (1-2 queries per level instead of N)
        and prefetches all tuples in a single query, then resolves in-memory.

        Query cost on full cache miss: 2-3 (batch hierarchy) + 1-2 (batch prefetch)
        vs N × (2-5) with individual check() calls.

        Args:
            user: The user to check
            permission: The Permission object to check
            resource_ids: List of resource IDs to check
            workspace_id: Optional workspace ID for ownership validation

        Returns:
            Dict mapping resource_id to permission result (bool)
        """
        if not resource_ids:
            return {}

        user_id = user.id if hasattr(user, "id") else user
        permission_str = str(permission)
        resource_type_str = str(permission.resource_type)

        # --- Phase 1: Batch cache read (1 version GET + 1 get_many) ---
        cached_results: dict[UUID, bool] = {}
        rid_keys: dict[UUID, str] = {}

        if self.use_cache:
            version = cache.get(f"perm_v:{user_id}", 0) or 0
            for rid in resource_ids:
                ctx = PermissionContext.resource(scope_id=rid, workspace_id=workspace_id)
                rid_keys[rid] = self._get_cache_key(user_id, permission_str, ctx, version=version)
            cached_values = cache.get_many(list(rid_keys.values()))
            for rid, cache_key in rid_keys.items():
                if cache_key in cached_values:
                    cached_results[rid] = bool(AccessResult.from_cache(cached_values[cache_key]))

        uncached_ids = [rid for rid in resource_ids if rid not in cached_results]

        if not uncached_ids:
            return cached_results

        # --- Phase 2: Batch-build hierarchy chains (1 query per level) ---
        chains = self._batch_build_hierarchy_chains(
            resource_type_str, uncached_ids, workspace_id
        )

        # --- Phase 3: Batch prefetch tuples ---
        # Collect all unique (type, id) pairs across all chains into one combined chain
        seen: set[tuple[str, UUID]] = set()
        combined_chain: list[tuple[str, UUID]] = []
        for chain in chains.values():
            for node in chain:
                if node not in seen:
                    seen.add(node)
                    combined_chain.append(node)

        direct_tuples, link_tuples = self._tuples.prefetch(user_id, combined_chain)

        # --- Phase 4: Resolve uncached + batch cache write ---
        resolved_results: dict[UUID, bool] = {}
        to_cache = {}
        for rid in uncached_ids:
            chain = chains.get(rid)
            if not chain:
                resolved_results[rid] = False
                continue

            original_resource_type, original_resource_id = chain[0]

            result = self._resolver.resolve(
                user_id=user_id,
                permission_str=permission_str,
                hierarchy_chain=chain,
                direct_tuples=direct_tuples,
                link_tuples=link_tuples,
                original_resource_type=original_resource_type,
                original_resource_id=original_resource_id,
                workspace_id=workspace_id,
            )

            resolved_results[rid] = bool(result)
            if self.use_cache:
                to_cache[rid_keys[rid]] = result.to_cache()

        if to_cache:
            cache.set_many(to_cache, PERMISSION_CACHE_TTL)

        return {**cached_results, **resolved_results}

    # --- Query delegation (see engine/queries.py) ---

    def get_accessible_resources(self, user, resource_type, workspace_id, permission=None, include_relations=False):
        return self._queries.get_accessible_resources(user, resource_type, workspace_id, permission, include_relations)

    def get_role_permission_list(self, relation, resource_type, workspace_id=None):
        return self._queries.get_role_permission_list(relation, resource_type, workspace_id)

    def get_resource_permission_lists(self, user, resource_type, resource_ids, workspace_id):
        return self._queries.get_resource_permission_lists(user, resource_type, resource_ids, workspace_id)


# Global singleton instance
permission_engine = PermissionEngine()
