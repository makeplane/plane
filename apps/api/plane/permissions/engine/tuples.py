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
Tuple Fetching

Prefetches ResourcePermission tuples for a user across a hierarchy chain,
including link relation tuples (e.g., teamspace → project) via subqueries.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING
from uuid import UUID

from django.db.models import Q
from django.utils import timezone

from ..inheritance import get_link_relations

if TYPE_CHECKING:
    from plane.db.models import ResourcePermission

logger = logging.getLogger(__name__)


class ResolvedLinkPerm:
    """A user's membership tuple paired with the target role from the link relation."""

    __slots__ = ("perm", "target_role")

    def __init__(self, perm: "ResourcePermission", target_role: str | None):
        self.perm = perm
        self.target_role = target_role


class TupleFetcher:
    """Prefetches ResourcePermission tuples across a hierarchy chain."""

    def prefetch(self, user_id: UUID, hierarchy_chain: list) -> tuple[dict, dict]:
        """
        Prefetch all ResourcePermission tuples for a user across the hierarchy,
        including link relation tuples via subqueries.

        Returns: (direct_tuples, link_tuples)
            direct_tuples: {(resource_type, resource_id): [ResourcePermission, ...]}
            link_tuples: {(resource_type, resource_id): [ResolvedLinkPerm, ...]}
                keyed by the hierarchy level the link applies to

        Queries: 1 + N where N is the number of hierarchy levels with link relations
            (typically 1 extra query for teamspace→project links)
        """
        from plane.db.models import ResourcePermission

        hierarchy_set = set(hierarchy_chain)

        q_filter = Q()
        for res_type, res_id in hierarchy_chain:
            q_filter |= Q(resource_type=res_type, resource_id=res_id)

        # Build link relation conditions.
        link_configs = {}
        for res_type, res_id in hierarchy_chain:
            link_rels = get_link_relations(res_type)
            if not link_rels:
                continue
            for lr in link_rels:
                linked_tuples = ResourcePermission.objects.filter(
                    resource_type=res_type,
                    resource_id=res_id,
                    subject_type=lr.source_type,
                    deleted_at__isnull=True,
                ).values("subject_id", "relation")

                target_roles = {row["subject_id"]: row["relation"] for row in linked_tuples}

                if (res_type, res_id) not in link_configs:
                    link_configs[(res_type, res_id)] = {"link_rels": [], "target_roles": {}}

                link_configs[(res_type, res_id)]["link_rels"].append(lr)
                link_configs[(res_type, res_id)]["target_roles"].update(target_roles)

                if target_roles:
                    q_filter |= Q(
                        resource_type=lr.source_type,
                        resource_id__in=list(target_roles.keys()),
                    )

        tuples = list(
            ResourcePermission.objects.filter(
                q_filter,
                subject_type="user",
                subject_id=user_id,
                deleted_at__isnull=True,
            ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
        )

        direct_grouped: dict = {}
        link_grouped: dict = {}

        for perm in tuples:
            key = (perm.resource_type, perm.resource_id)
            if key in hierarchy_set:
                direct_grouped.setdefault(key, []).append(perm)
            else:
                match_key, config = self._match_link_config(perm, link_configs)
                if config:
                    resolved = ResolvedLinkPerm(
                        perm=perm,
                        target_role=config["target_roles"].get(perm.resource_id),
                    )
                    link_grouped.setdefault(match_key, []).append(resolved)

        return direct_grouped, link_grouped

    @staticmethod
    def _match_link_config(perm, link_configs: dict) -> tuple:
        """Find the hierarchy level and config matching a link relation perm."""
        for (h_type, h_id), config in link_configs.items():
            for lr in config["link_rels"]:
                if perm.resource_type == lr.source_type:
                    return (h_type, h_id), config
        return None, None
