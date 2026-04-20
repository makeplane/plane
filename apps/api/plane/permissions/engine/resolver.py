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
Permission Resolver

The core Zanzibar algorithm: walks a hierarchy chain of pre-fetched tuples
and resolves permissions via deny → grant → role → conditions → links → default deny.
"""

from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from ..context import AccessResult, ResourceID
from ..inheritance import is_child_of
from .roles import RoleLookup
from .conditions import ConditionEvaluator

logger = logging.getLogger(__name__)


class PermissionResolver:
    """The Zanzibar loop: deny → grant → role → conditions → links → default deny."""

    def __init__(self, roles: RoleLookup, conditions: ConditionEvaluator):
        self._roles = roles
        self._conditions = conditions

    def resolve(
        self,
        user_id: UUID,
        permission_str: str,
        hierarchy_chain: list,
        direct_tuples: dict,
        link_tuples: dict,
        original_resource_type: str,
        original_resource_id: UUID,
        workspace_id: Optional[ResourceID] = None,
        defer_conditions: bool = False,
        resource_model=None,
    ) -> AccessResult:
        """
        Resolve a permission using pre-fetched hierarchy chain and tuples.

        Reusable by check(), check_batch(), and bulk_check() to avoid
        repeated hierarchy + tuple queries.
        """
        for res_type, res_id in hierarchy_chain:
            perms = direct_tuples.get((res_type, res_id), [])
            logger.debug(
                "[PERM] level %s → %d tuple(s)",
                res_type, len(perms),
            )

            for perm in perms:
                # Check explicit deny
                if permission_str in (perm.permissions_deny or []):
                    logger.warning(
                        "[PERM] Explicit deny: %s on %s:%s", permission_str, res_type, res_id,
                    )
                    return AccessResult(allowed=False)
                # Check explicit grant
                if permission_str in (perm.permissions_grant or []):
                    return AccessResult(allowed=True)
                # Check role permissions
                result = self._check_role_permission(
                    perm.relation,
                    permission_str,
                    res_type,
                    workspace_id,
                    user_id,
                    original_resource_type,
                    original_resource_id,
                    defer_conditions,
                    resource_model=resource_model,
                    hierarchy_chain=hierarchy_chain,
                    direct_tuples=direct_tuples,
                )
                if result is not None:
                    return result

            # Check link relations at this level (already prefetched, no extra queries).
            link_perms = link_tuples.get((res_type, res_id))
            if link_perms:
                for lp in link_perms:
                    if not lp.target_role:
                        continue
                    # Check explicit deny on the source membership tuple
                    if permission_str in (lp.perm.permissions_deny or []):
                        logger.warning(
                            "[PERM] Explicit deny via link: %s on %s:%s",
                            permission_str, res_type, res_id,
                        )
                        return AccessResult(allowed=False)
                    result = self._check_role_permission(
                        lp.target_role,
                        permission_str,
                        res_type,
                        workspace_id,
                        user_id,
                        original_resource_type,
                        original_resource_id,
                        defer_conditions,
                        resource_model=resource_model,
                        hierarchy_chain=hierarchy_chain,
                        direct_tuples=direct_tuples,
                    )
                    if result is not None:
                        return result

        # Default deny
        logger.warning("[PERM] Default deny: %s for user %s", permission_str, user_id)
        return AccessResult(allowed=False)

    def _check_role_permission(
        self,
        relation: str,
        permission_str: str,
        res_type: str,
        workspace_id: Optional[ResourceID],
        user_id: UUID,
        original_resource_type: str,
        original_resource_id: UUID,
        defer_conditions: bool,
        resource_model=None,
        hierarchy_chain: Optional[list] = None,
        direct_tuples: Optional[dict] = None,
    ) -> Optional[AccessResult]:
        """Check if a role grants a permission (unconditional or conditional).

        Returns AccessResult if resolved, None if the role doesn't grant this permission.
        """
        compiled = self._roles.get_compiled_role(relation, res_type, workspace_id)
        if compiled is not None:
            if compiled.has_permission(permission_str):
                return AccessResult(allowed=True)
            conditions = compiled.get_conditions(permission_str)
        else:
            role_perms = self._roles.get_cached_permissions(relation, res_type, workspace_id)
            if self._roles.has_permission(
                relation, permission_str, res_type, workspace_id, role_permissions=role_perms,
            ):
                return AccessResult(allowed=True)
            conditions = self._roles.get_conditions(
                relation, permission_str, res_type, workspace_id, role_permissions=role_perms,
            )
        if conditions:
            logger.debug(
                "[PERM] role=%s conditions=%s for %s, evaluating against %s",
                relation, conditions, permission_str, original_resource_type,
            )
            if defer_conditions:
                perm_resource = permission_str.split(":")[0]
                if is_child_of(perm_resource, original_resource_type):
                    return AccessResult(allowed=True, conditions=tuple(conditions))
                else:
                    logger.warning(
                        "[PERM] defer_conditions=True but '%s' is not a child of '%s'. Evaluating normally.",
                        perm_resource, original_resource_type,
                    )
            for condition in conditions:
                result = self._conditions.evaluate(
                    condition,
                    user_id,
                    original_resource_type,
                    original_resource_id,
                    workspace_id,
                    roles=self._roles,
                    resource_model=resource_model,
                    hierarchy_chain=hierarchy_chain,
                    direct_tuples=direct_tuples,
                )
                logger.debug("[PERM] condition '%s' → %s", condition, result)
                if result:
                    return AccessResult(allowed=True)

        return None
