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

"""Model-side permission meta — ScopeSpec and PermissionMeta discovery.

Models declare their listing authorization shape via a nested `PermissionMeta`
class. Example:

    class Issue(models.Model):
        class PermissionMeta:
            scope_map = {
                WorkitemPermissions: ScopeSpec(resource_type="project", fk="project_id"),
            }
            condition_fields = {
                Condition.CREATOR: "created_by",
            }

`resolve_scope_spec` finds the ScopeSpec for a (model, permission_instance) by
looking up the permission's container class in `scope_map`. The container
class is resolved from the permission's resource_type via the existing
_PERMISSION_CLASSES registry.
"""

from dataclasses import dataclass

from plane.permissions.definitions import Permission, _PERMISSION_CLASSES
from plane.permissions.exceptions import PermissionConfigurationError


@dataclass(frozen=True)
class ScopeSpec:
    """Where and how a model joins to a scope resource for authorization.

    resource_type: the scope type the engine should query tuples for
        (e.g., "project" when listing workitems).
    fk: the Django field path on the model that joins to the scope resource
        (e.g., "project_id").
    """

    resource_type: str
    fk: str


def _permission_container_class(permission: Permission):
    """Resolve a Permission instance to its container class via the engine's
    _PERMISSION_CLASSES registry (keyed by ResourceType).
    """
    return _PERMISSION_CLASSES.get(permission.resource_type)


def resolve_scope_spec(model_cls, permission: Permission) -> ScopeSpec:
    """Return the ScopeSpec declaring how `model_cls` joins to the scope
    resource for `permission`.

    Raises PermissionConfigurationError if `model_cls` has no PermissionMeta
    or the permission's container class isn't in `scope_map`.
    """
    meta = getattr(model_cls, "PermissionMeta", None)
    if meta is None:
        raise PermissionConfigurationError(
            f"{model_cls.__name__} has no PermissionMeta; cannot authorize "
            f"listing for permission {permission}."
        )
    scope_map = getattr(meta, "scope_map", None) or {}
    container = _permission_container_class(permission)
    if container is None or container not in scope_map:
        container_name = container.__name__ if container else str(permission.resource_type)
        raise PermissionConfigurationError(
            f"{model_cls.__name__}.PermissionMeta.scope_map does not contain "
            f"{container_name} — cannot authorize listing for permission {permission}."
        )
    return scope_map[container]


def resolve_condition_field(model_cls, condition: str) -> str:
    """Return the Django field path mapped to `condition` in the model's
    PermissionMeta.condition_fields.

    Raises PermissionConfigurationError if meta is missing or the condition
    isn't mapped.
    """
    meta = getattr(model_cls, "PermissionMeta", None)
    if meta is None:
        raise PermissionConfigurationError(
            f"{model_cls.__name__} has no PermissionMeta; cannot evaluate "
            f"condition {condition!r}."
        )
    condition_fields = getattr(meta, "condition_fields", None) or {}
    for key, field in condition_fields.items():
        key_str = key.value if hasattr(key, "value") else str(key)
        if key_str == condition:
            return field
    raise PermissionConfigurationError(
        f"{model_cls.__name__}.PermissionMeta.condition_fields does not map "
        f"condition {condition!r}."
    )
