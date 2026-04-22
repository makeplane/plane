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
Each condition checks that a field matches the user AND the user has active
membership on the resource.

Field resolution order for each condition:
  1. Model-declared `PermissionMeta.condition_fields` — per-model override.
  2. Hardcoded default (`created_by_id` for creator, `lead_id` for lead) —
     preserves backward compatibility for models that haven't declared
     PermissionMeta yet.
"""

import logging
from typing import Optional
from uuid import UUID

from ..context import ResourceID
from ..resource_models import get_model_for_resource

logger = logging.getLogger(__name__)


# Hardcoded fallbacks when a model has no PermissionMeta.condition_fields
# entry. Django accepts both "created_by" and "created_by_id" for FK
# filtering; the _id suffix matches the legacy behavior.
_DEFAULT_CONDITION_FIELDS = {
    "creator": "created_by_id",
    "lead": "lead_id",
}


def _resolve_field(model, condition: str) -> Optional[str]:
    """Read the Django field path for `condition` from model.PermissionMeta.

    Falls back to the hardcoded default when the model has no PermissionMeta
    or no entry for the condition. Returns None only when neither source
    yields a field (unknown condition on a model without PermissionMeta).
    """
    if model is not None:
        try:
            from plane.permissions.exceptions import PermissionConfigurationError
            from plane.permissions.meta import resolve_condition_field

            return resolve_condition_field(model, condition)
        except PermissionConfigurationError:
            pass
    return _DEFAULT_CONDITION_FIELDS.get(condition)


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
        """Evaluate a condition against a specific resource."""
        model = resource_model or get_model_for_resource(resource_type)
        field = _resolve_field(model, condition)
        if field is None:
            logger.warning("[PERM] Unknown condition: %s", condition)
            return False
        return self._check_field_condition(
            field, user_id, resource_type, resource_id, workspace_id, roles,
            resource_model=model,
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
