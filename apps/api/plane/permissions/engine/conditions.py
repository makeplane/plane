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
Condition Evaluation

Evaluates conditional grants (e.g., "creator", "lead") against resource data.
Each condition checks that a field matches the user AND the user has active membership.
"""

import logging
from typing import Optional
from uuid import UUID

from ..context import ResourceID
from ..resource_models import get_model_for_resource

logger = logging.getLogger(__name__)


class ConditionEvaluator:
    """Evaluates conditional grants (creator, lead)."""

    def evaluate(
        self,
        condition: str,
        user_id: UUID,
        resource_type: str,
        resource_id: UUID,
        workspace_id: Optional[ResourceID],
        roles,
        resource_model=None,
        hierarchy_chain: Optional[list] = None,
        direct_tuples: Optional[dict] = None,
    ) -> bool:
        """
        Evaluate a condition against a specific resource.

        Args:
            condition: The condition name (e.g., "creator", "lead")
            roles: RoleLookup instance for membership checks
        """
        handler = getattr(self, f"_eval_condition_{condition}", None)
        if handler is None:
            logger.warning("[PERM] Unknown condition: %s", condition)
            return False
        return handler(
            user_id, resource_type, resource_id, workspace_id, roles, resource_model,
            hierarchy_chain=hierarchy_chain, direct_tuples=direct_tuples,
        )

    def _check_field_condition(
        self,
        field_name: str,
        user_id: UUID,
        resource_type: str,
        resource_id: UUID,
        workspace_id: Optional[ResourceID],
        roles,
        resource_model=None,
        hierarchy_chain: Optional[list] = None,
        direct_tuples: Optional[dict] = None,
    ) -> bool:
        """Check that a model field matches user_id AND user has active membership."""
        model = resource_model or get_model_for_resource(resource_type)
        if not model:
            return False
        try:
            filter_kwargs = {
                "id": resource_id,
                field_name: user_id,
                "deleted_at__isnull": True,
            }
            if workspace_id:
                filter_kwargs["workspace_id"] = workspace_id
            if not model.objects.filter(**filter_kwargs).exists():
                logger.debug("[PERM] condition field check failed: %s.%s != user", resource_type, field_name)
                return False
        except Exception as e:
            logger.warning("[PERM] Error checking condition field %s: %s", field_name, e)
            return False
        membership = roles.has_active_membership(
            user_id, resource_type, resource_id, workspace_id,
            hierarchy_chain=hierarchy_chain, direct_tuples=direct_tuples,
        )
        if not membership:
            logger.debug("[PERM] condition membership check failed for %s", resource_type)
        return membership

    def _eval_condition_creator(
        self, user_id, resource_type, resource_id, workspace_id, roles, resource_model=None,
        hierarchy_chain=None, direct_tuples=None,
    ):
        """Check if user created the resource (created_by_id == user_id)."""
        return self._check_field_condition(
            "created_by_id", user_id, resource_type, resource_id, workspace_id, roles, resource_model,
            hierarchy_chain=hierarchy_chain, direct_tuples=direct_tuples,
        )

    def _eval_condition_lead(
        self, user_id, resource_type, resource_id, workspace_id, roles, resource_model=None,
        hierarchy_chain=None, direct_tuples=None,
    ):
        """Check if user is the lead of the resource (lead_id == user_id)."""
        return self._check_field_condition(
            "lead_id", user_id, resource_type, resource_id, workspace_id, roles, resource_model,
            hierarchy_chain=hierarchy_chain, direct_tuples=direct_tuples,
        )
