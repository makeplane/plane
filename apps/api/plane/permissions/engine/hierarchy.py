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
Hierarchy Resolution

Builds resource hierarchy chains (e.g., issue → project → workspace) and validates
that URL-provided workspace/project IDs match the resource's actual parents (IDOR protection).
"""

import logging
from typing import Optional
from uuid import UUID

from rest_framework.exceptions import PermissionDenied

from ..context import ResourceID
from ..inheritance import get_resource_config, build_chain_config
from ..resource_models import get_model_for_resource, get_bridge_config

logger = logging.getLogger(__name__)


class HierarchyResolver:
    """Builds resource hierarchy chains and validates IDOR safety."""

    def build_chain(
        self,
        resource_type: str,
        resource_id: UUID,
        workspace_id: Optional[ResourceID] = None,
        project_id: Optional[UUID] = None,
    ) -> list:
        """
        Build the full hierarchy chain from resource to root.

        Returns: [(resource_type, resource_id), (parent_type, parent_id), ...]
        Example for issue: [("issue", id1), ("project", id2), ("workspace", id3)]

        Uses a single query with direct model fields when possible (all
        project-scoped models have workspace_id and project_id as direct
        columns). Falls back to iterative per-level queries for bridge-table
        types.

        Always resolves parents from DB and validates against caller-provided
        workspace_id/project_id to prevent cross-workspace/cross-project access.

        Raises PermissionDenied if workspace_id or project_id from the URL
        doesn't match the resource's actual parent (indicates intentional misuse).
        """
        resource_id = UUID(str(resource_id)) if not isinstance(resource_id, UUID) else resource_id

        config = build_chain_config(resource_type)
        if config is None:
            return self.build_chain_iterative(resource_type, resource_id, workspace_id, project_id)

        if not config["chain"]:
            return [(resource_type, resource_id)]

        model = get_model_for_resource(resource_type)
        if not model:
            return self.build_chain_iterative(resource_type, resource_id, workspace_id, project_id)

        try:
            row = model.objects.filter(id=resource_id).values(*config["fields"]).first()
        except Exception as e:
            logger.warning("[PERM] Single-query hierarchy failed: %s", e)
            return self.build_chain_iterative(resource_type, resource_id, workspace_id, project_id)

        if not row:
            return [(resource_type, resource_id)]

        expected_ancestors = self._build_expected_ancestors(workspace_id, project_id)

        chain = [(resource_type, resource_id)]
        for ancestor_type, field_name, validation_type in config["chain"]:
            ancestor_id = row.get(field_name)
            if not ancestor_id:
                break
            self._check_ancestor_match(
                validation_type, ancestor_id, expected_ancestors, resource_type, resource_id
            )
            chain.append((ancestor_type, ancestor_id))

        return chain

    def build_chain_iterative(
        self,
        resource_type: str,
        resource_id: UUID,
        workspace_id: Optional[ResourceID] = None,
        project_id: Optional[UUID] = None,
    ) -> list:
        """Iterative fallback for hierarchy chain building.

        Used when single-query traversal is impossible (bridge tables, non-FK
        parent fields). Issues one query per hierarchy level.
        """
        resource_id = UUID(str(resource_id)) if not isinstance(resource_id, UUID) else resource_id
        chain = [(resource_type, resource_id)]
        current_type = resource_type
        current_id = resource_id

        expected_ancestors = self._build_expected_ancestors(workspace_id, project_id)

        while True:
            config = get_resource_config(current_type)
            if not config or not config["parent"]:
                break

            parent_type = config["parent"]
            parent_field = config["parent_field"]

            parent_id = self._get_parent_id(current_type, current_id, parent_field)
            if not parent_id:
                break

            self._check_ancestor_match(
                parent_type, parent_id, expected_ancestors, resource_type, resource_id
            )

            chain.append((parent_type, parent_id))
            current_type = parent_type
            current_id = parent_id

        return chain

    def batch_build_chains(
        self,
        resource_type: str,
        resource_ids: list[UUID],
        workspace_id: Optional[ResourceID] = None,
    ) -> dict[UUID, list]:
        """
        Build hierarchy chains for multiple resources in batch.

        Uses a single query with direct model fields when possible. Falls
        back to iterative per-level queries for bridge types.

        Returns: {resource_id: [(resource_type, resource_id), (parent_type, parent_id), ...]}
        Raises PermissionDenied if any resource's workspace doesn't match workspace_id.
        """
        resource_ids = [
            UUID(str(rid)) if not isinstance(rid, UUID) else rid
            for rid in resource_ids
        ]

        chain_cfg = build_chain_config(resource_type)
        if chain_cfg is None:
            return self.batch_build_chains_iterative(resource_type, resource_ids, workspace_id)

        if not chain_cfg["chain"]:
            return {rid: [(resource_type, rid)] for rid in resource_ids}

        model = get_model_for_resource(resource_type)
        if not model:
            return self.batch_build_chains_iterative(resource_type, resource_ids, workspace_id)

        try:
            rows = model.objects.filter(id__in=resource_ids).values("id", *chain_cfg["fields"])
        except Exception as e:
            logger.warning("[PERM] Single-query batch hierarchy failed: %s", e)
            return self.batch_build_chains_iterative(resource_type, resource_ids, workspace_id)

        expected_ancestors = self._build_expected_ancestors(workspace_id)

        row_map = {row["id"]: row for row in rows}

        chains: dict[UUID, list] = {}
        for rid in resource_ids:
            row = row_map.get(rid)
            chain = [(resource_type, rid)]
            if row:
                for ancestor_type, field_name, validation_type in chain_cfg["chain"]:
                    ancestor_id = row.get(field_name)
                    if not ancestor_id:
                        break
                    self._check_ancestor_match(
                        validation_type, ancestor_id, expected_ancestors, resource_type, rid
                    )
                    chain.append((ancestor_type, ancestor_id))
            chains[rid] = chain

        return chains

    def batch_build_chains_iterative(
        self,
        resource_type: str,
        resource_ids: list[UUID],
        workspace_id: Optional[ResourceID] = None,
    ) -> dict[UUID, list]:
        """Iterative fallback for batch hierarchy chain building.

        Used when single-query traversal is impossible (bridge tables).
        Issues one batch query per hierarchy level.
        """
        resource_ids = [
            UUID(str(rid)) if not isinstance(rid, UUID) else rid
            for rid in resource_ids
        ]

        chains: dict[UUID, list] = {
            rid: [(resource_type, rid)] for rid in resource_ids
        }

        expected_ancestors = self._build_expected_ancestors(workspace_id)

        current_type = resource_type

        while True:
            config = get_resource_config(current_type)
            if not config or not config["parent"]:
                break

            parent_type = config["parent"]
            parent_field = config["parent_field"]

            bridge = get_bridge_config(current_type)
            if not bridge:
                model = get_model_for_resource(current_type)
                if not model:
                    break

            tail_ids = {
                chains[rid][-1][1]
                for rid in resource_ids
                if chains[rid][-1][0] == current_type
            }
            if not tail_ids:
                break

            try:
                if bridge:
                    parent_map = dict(
                        bridge["model"]
                        .objects.filter(**{f"{bridge['lookup_field']}__in": list(tail_ids)})
                        .values_list(bridge["lookup_field"], parent_field)
                    )
                else:
                    parent_map = dict(
                        model.objects.filter(id__in=list(tail_ids)).values_list("id", parent_field)
                    )
            except Exception as e:
                logger.warning("[PERM] Error batch-fetching parent IDs: %s", e)
                break

            for rid in resource_ids:
                tail_type, tail_id = chains[rid][-1]
                if tail_type != current_type:
                    continue
                parent_id = parent_map.get(tail_id)
                if not parent_id:
                    continue

                self._check_ancestor_match(
                    parent_type, parent_id, expected_ancestors, resource_type, rid
                )
                chains[rid].append((parent_type, parent_id))

            current_type = parent_type

        return chains

    def _get_parent_id(
        self,
        resource_type: str,
        resource_id: UUID,
        parent_field: str,
    ) -> Optional[UUID]:
        """Get the parent resource ID for a given resource.

        For bridge-table types (page, teamspace_page, teamspace_workitem_view),
        queries the bridge model instead of the resource model.
        """
        bridge = get_bridge_config(resource_type)
        if bridge:
            try:
                return (
                    bridge["model"]
                    .objects.filter(**{bridge["lookup_field"]: resource_id})
                    .values_list(parent_field, flat=True)
                    .first()
                )
            except Exception as e:
                logger.warning("[PERM] Error getting parent ID via bridge: %s", e)
                return None

        model = get_model_for_resource(resource_type)
        if not model:
            return None

        try:
            instance = model.objects.filter(id=resource_id).values(parent_field).first()
            if instance:
                return instance.get(parent_field)
        except Exception as e:
            logger.warning("[PERM] Error getting parent ID: %s", e)

        return None

    @staticmethod
    def _build_expected_ancestors(
        workspace_id: Optional[ResourceID] = None,
        project_id: Optional[UUID] = None,
    ) -> dict[str, str]:
        """Build a {scope_type: id_str} dict for IDOR ancestor validation."""
        expected: dict[str, str] = {}
        if workspace_id:
            expected["workspace"] = str(workspace_id)
        if project_id:
            expected["project"] = str(project_id)
        return expected

    @staticmethod
    def _check_ancestor_match(
        validation_type: Optional[str],
        ancestor_id,
        expected_ancestors: dict[str, str],
        resource_type: str,
        resource_id,
    ) -> None:
        """Raise PermissionDenied if ancestor doesn't match the expected value."""
        if validation_type and validation_type in expected_ancestors:
            expected_id = expected_ancestors[validation_type]
            if str(ancestor_id) != expected_id:
                logger.warning(
                    "[PERM] %s mismatch: resource %s:%s belongs to %s %s, not %s",
                    validation_type, resource_type, resource_id,
                    validation_type, ancestor_id, expected_id,
                )
                raise PermissionDenied(f"Resource does not belong to this {validation_type}.")
