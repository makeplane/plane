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
Permission Queries

Query-heavy methods for listing accessible resources, permission matrices,
and role inspection. Used by views and serializers for bulk permission lookups.
"""

from __future__ import annotations

import logging
from typing import Optional, Union
from uuid import UUID

from django.db.models import Q
from django.utils import timezone

from ..context import ResourceID
from ..definitions import Permission, ResourceType
from ..inheritance import get_link_relations
from .roles import RoleLookup

logger = logging.getLogger(__name__)


class PermissionQueries:
    """Query APIs: accessible resources, permission matrices, role inspection."""

    def __init__(self, roles: RoleLookup):
        self._roles = roles

    def get_accessible_resources(
        self,
        user,
        resource_type: Union[ResourceType, str],
        workspace_id: ResourceID,
        permission: Optional[Union[Permission, str]] = None,
        include_relations: bool = False,
    ) -> Union[list[UUID], dict[UUID, str]]:
        """
        Get all resource IDs of a type that a user can access for a given permission.

        Handles direct tuples and link relation traversal.
        """
        from plane.db.models import ResourcePermission

        resource_type_str = str(resource_type)
        user_id = user.id if hasattr(user, "id") else user

        if permission is None:
            permission_str = f"{resource_type_str}:view"
        elif isinstance(permission, Permission):
            permission_str = str(permission)
        else:
            permission_str = str(permission)

        result: dict[UUID, str] = {}

        # 1. Direct permissions
        direct_perms = (
            ResourcePermission.objects.filter(
                subject_type="user",
                subject_id=user_id,
                resource_type=resource_type_str,
                workspace_id=workspace_id,
                deleted_at__isnull=True,
            )
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
            .values("resource_id", "relation", "permissions_grant", "permissions_deny")
        )

        perms_by_relation: dict[str, list[dict]] = {}
        for perm in direct_perms:
            perms_by_relation.setdefault(perm["relation"], []).append(perm)

        for relation, perms in perms_by_relation.items():
            role_grants_permission = self._roles.has_permission(
                relation, permission_str, resource_type_str, workspace_id
            )

            for perm in perms:
                if permission_str in (perm["permissions_deny"] or []):
                    continue
                if permission_str in (perm["permissions_grant"] or []) or role_grants_permission:
                    result[perm["resource_id"]] = relation

        # 2. Link relation traversal
        for lr in get_link_relations(resource_type_str):
            user_link_subquery = (
                ResourcePermission.objects.filter(
                    subject_type="user",
                    subject_id=user_id,
                    resource_type=lr.source_type,
                    workspace_id=workspace_id,
                    deleted_at__isnull=True,
                )
                .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
                .values("resource_id")
            )

            linked_resources = (
                ResourcePermission.objects.filter(
                    subject_type=lr.source_type,
                    subject_id__in=user_link_subquery,
                    resource_type=resource_type_str,
                    workspace_id=workspace_id,
                    deleted_at__isnull=True,
                )
                .exclude(resource_id__in=list(result.keys()) if result else [])
                .values("resource_id", "relation")
            )

            by_role: dict[str, list] = {}
            for row in linked_resources:
                by_role.setdefault(row["relation"], []).append(row["resource_id"])

            for target_role, resource_ids in by_role.items():
                if self._roles.has_permission(target_role, permission_str, resource_type_str, workspace_id):
                    for rid in resource_ids:
                        result[rid] = target_role

        if include_relations:
            return result
        return list(result.keys())

    def get_accessible_resources_with_conditions(
        self,
        user,
        permission: Union[Permission, str],
        scope_resource_type: Union[ResourceType, str],
        workspace_id: ResourceID,
    ) -> list:
        """Like get_accessible_resources but preserves conditional-grant info.

        Returns one AccessibleResource per scope-tuple that grants `permission`,
        either unconditionally (conditions=()) or via conditional grants such
        as workitem:view+creator (conditions=("creator",)). Multiple conditions
        on the same role are OR'd: conditions=("creator", "lead") means access
        applies when the user is the creator OR the lead.

        Resolution order mirrors the engine resolver (engine/resolver.py:163):
        explicit deny > inline grant > role unconditional > role conditional.
        Link-relation traversal (e.g., teamspace → project) propagates
        conditions from the linked role the same way.

        The legacy get_accessible_resources filters out conditional grants
        because RoleLookup.has_permission is documented as unconditional-only.
        This primitive consults both has_permission AND get_conditions so
        guests (with workitem:view+creator only) are not silently dropped.
        """
        from plane.db.models import ResourcePermission
        from .accessible_resource import AccessibleResource

        resource_type_str = str(scope_resource_type)
        user_id = user.id if hasattr(user, "id") else user
        permission_str = str(permission) if not isinstance(permission, str) else permission

        results: dict[UUID, AccessibleResource] = {}
        # Explicit deny applies PER RESOURCE across all paths. A tuple with
        # permissions_deny=[permission_str] on resource X marks X denied; any
        # tuple that would grant X (direct or via link relation) is suppressed.
        # Deny does NOT short-circuit the whole call — other resources remain
        # accessible.
        denied_ids: set[UUID] = set()

        def _merge(existing: AccessibleResource | None, new: AccessibleResource) -> AccessibleResource:
            """Merge two grants for the same resource.

            Rules:
              - If either path is unconditional, the result is unconditional.
                Multiple paths to the same resource with one unconditional
                means the caller has unconditional access — the conditional
                path adds no restriction.
              - Otherwise both paths are conditional: the conditions are
                UNIONed. "Access via path A when creator" OR "access via path
                B when lead" → access when creator OR lead. This matches
                engine/resolver.py's per-resource resolution.
              - Relation is kept from the first grant seen (relation is not
                used by the helper's Q-building; only conditions + scope_fk
                matter).
            """
            if existing is None:
                return new
            if existing.is_unconditional() or new.is_unconditional():
                return AccessibleResource(
                    resource_id=existing.resource_id,
                    relation=existing.relation if existing.is_unconditional() else new.relation,
                    conditions=(),
                )
            merged_conditions = tuple(sorted(set(existing.conditions) | set(new.conditions)))
            return AccessibleResource(
                resource_id=existing.resource_id,
                relation=existing.relation,
                conditions=merged_conditions,
            )

        def _process_tuples(tuples_by_relation: dict[str, list[dict]]) -> None:
            """Walk collected tuples, evaluate grants, merge into results."""
            _missing = object()
            for relation, tuples in tuples_by_relation.items():
                role_has = self._roles.has_permission(
                    relation, permission_str, resource_type_str, workspace_id
                )
                role_conditions = _missing  # lazy — only fetch when unconditional doesn't apply
                for tup in tuples:
                    rid = tup["resource_id"]
                    if rid in denied_ids:
                        continue
                    if permission_str in (tup["permissions_grant"] or []) or role_has:
                        new_grant = AccessibleResource(
                            resource_id=rid, relation=relation, conditions=(),
                        )
                    else:
                        if role_conditions is _missing:
                            role_conditions = self._roles.get_conditions(
                                relation, permission_str, resource_type_str, workspace_id
                            )
                        if not role_conditions:
                            continue
                        new_grant = AccessibleResource(
                            resource_id=rid, relation=relation,
                            conditions=tuple(role_conditions),
                        )
                    results[rid] = _merge(results.get(rid), new_grant)

        # --- Direct tuples ---
        direct_perms = (
            ResourcePermission.objects.filter(
                subject_type="user",
                subject_id=user_id,
                resource_type=resource_type_str,
                workspace_id=workspace_id,
                deleted_at__isnull=True,
            )
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
            .values("resource_id", "relation", "permissions_grant", "permissions_deny")
        )

        by_relation: dict[str, list[dict]] = {}
        for tup in direct_perms:
            if permission_str in (tup["permissions_deny"] or []):
                denied_ids.add(tup["resource_id"])
            by_relation.setdefault(tup["relation"], []).append(tup)
        _process_tuples(by_relation)

        # --- Link-relation traversal (e.g., teamspace → project) ---
        # We do NOT exclude resources already in `results` here — the link
        # path may upgrade a conditional direct grant to unconditional (or
        # add a different conditional alternative), and the merge logic
        # above takes care of combining them.
        for lr in get_link_relations(resource_type_str):
            user_link_subquery = (
                ResourcePermission.objects.filter(
                    subject_type="user",
                    subject_id=user_id,
                    resource_type=lr.source_type,
                    workspace_id=workspace_id,
                    deleted_at__isnull=True,
                )
                .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
                .values("resource_id")
            )
            linked = (
                ResourcePermission.objects.filter(
                    subject_type=lr.source_type,
                    subject_id__in=user_link_subquery,
                    resource_type=resource_type_str,
                    workspace_id=workspace_id,
                    deleted_at__isnull=True,
                )
                .values("resource_id", "relation", "permissions_grant", "permissions_deny")
            )
            link_by_relation: dict[str, list[dict]] = {}
            for tup in linked:
                if permission_str in (tup["permissions_deny"] or []):
                    denied_ids.add(tup["resource_id"])
                    # Remove any previously-added grant — deny wins.
                    results.pop(tup["resource_id"], None)
                link_by_relation.setdefault(tup["relation"], []).append(tup)
            _process_tuples(link_by_relation)

        return list(results.values())

    def get_role_permission_list(
        self,
        relation: str,
        resource_type: Union[ResourceType, str],
        workspace_id: Optional[ResourceID] = None,
    ) -> list[str]:
        """Return a sorted list of concrete permission strings granted by a role."""
        resource_type_str = str(resource_type)
        from ..system_roles import get_system_role_permission_set

        namespace = self._roles.get_namespace(resource_type_str)

        system_perms = get_system_role_permission_set(relation, namespace)
        if system_perms is not None:
            return self.expand_permission_set(system_perms)

        custom_perms = self._roles.get_cached_permissions(relation, resource_type_str, workspace_id)
        if custom_perms is not None:
            return self.expand_permission_set(custom_perms)

        return []

    def get_resource_permission_lists(
        self,
        user,
        resource_type: Union[ResourceType, str],
        resource_ids: list[UUID],
        workspace_id: ResourceID,
    ) -> dict[UUID, dict]:
        """Batch-fetch permission lists for a user across multiple resources."""
        if not resource_ids:
            return {}

        resource_type_str = str(resource_type)
        user_id = user.id if hasattr(user, "id") else user

        from plane.db.models import ResourcePermission

        direct_tuples = (
            ResourcePermission.objects.filter(
                subject_type="user",
                subject_id=user_id,
                resource_type=resource_type_str,
                resource_id__in=resource_ids,
                workspace_id=workspace_id,
                deleted_at__isnull=True,
            )
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
            .values("resource_id", "relation")
        )

        resource_relations: dict[UUID, set[str]] = {}
        for t in direct_tuples:
            resource_relations.setdefault(t["resource_id"], set()).add(t["relation"])

        for lr in get_link_relations(resource_type_str):
            user_sources = (
                ResourcePermission.objects.filter(
                    subject_type="user",
                    subject_id=user_id,
                    resource_type=lr.source_type,
                    workspace_id=workspace_id,
                    deleted_at__isnull=True,
                )
                .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
                .values("resource_id")
            )
            linked = ResourcePermission.objects.filter(
                subject_type=lr.source_type,
                subject_id__in=user_sources,
                resource_type=resource_type_str,
                resource_id__in=resource_ids,
                workspace_id=workspace_id,
                deleted_at__isnull=True,
            ).values("resource_id", "relation")

            for row in linked:
                resource_relations.setdefault(row["resource_id"], set()).add(row["relation"])

        from ..system_roles import get_highest_role

        role_perm_cache: dict[str, list[str]] = {}
        result: dict[UUID, dict] = {}

        for resource_id in resource_ids:
            relations = resource_relations.get(resource_id)
            if not relations:
                result[resource_id] = {"relation": None, "permission_grants": []}
                continue

            perm_lists = []
            for relation in relations:
                if relation not in role_perm_cache:
                    role_perm_cache[relation] = self.get_role_permission_list(
                        relation, resource_type_str, workspace_id
                    )
                perm_lists.append(role_perm_cache[relation])

            result[resource_id] = {
                "relation": get_highest_role(list(relations)),
                "permission_grants": self.merge_permission_lists(perm_lists),
            }

        return result

    @staticmethod
    def expand_permission_set(permissions: Union[frozenset, set]) -> list[str]:
        """Expand wildcards to concrete permission strings."""
        from ..definitions import RESOURCE_ACTIONS, ResourceType, Permission

        result = set()
        for perm_str in permissions:
            if perm_str == "*":
                for rt, actions in RESOURCE_ACTIONS.items():
                    for action in actions:
                        result.add(str(Permission(rt, action)))
            elif perm_str.endswith(":*"):
                resource_name = perm_str[:-2]
                try:
                    rt = ResourceType(resource_name)
                    for action in RESOURCE_ACTIONS.get(rt, frozenset()):
                        result.add(str(Permission(rt, action)))
                except ValueError:
                    result.add(perm_str)
            else:
                result.add(perm_str)

        return sorted(result)

    @staticmethod
    def merge_permission_lists(perm_lists: list[list[str]]) -> list[str]:
        """Merge multiple permission lists. Unconditional wins over conditional."""
        all_perms: set[str] = set()
        for perm_list in perm_lists:
            all_perms.update(perm_list)

        unconditional: set[str] = set()
        conditional: dict[str, set[str]] = {}

        for perm in all_perms:
            if "+" in perm:
                base = perm.split("+", 1)[0]
                conditional.setdefault(base, set()).add(perm)
            else:
                unconditional.add(perm)

        result = set(unconditional)
        for base, cond_perms in conditional.items():
            if base not in unconditional:
                result.update(cond_perms)

        return sorted(result)
