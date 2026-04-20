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

from rest_framework.response import Response
from rest_framework import status

from plane.app.views import BaseAPIView
from plane.permissions import (
    Permission,
    ResourceType,
    RESOURCE_ACTIONS,
    PROJECT_RESOURCE_TYPES,
    can,
    WorkspacePermissions,
)
from plane.permissions.inheritance import get_all_resource_types_under
from plane.permissions.system_roles import WORKSPACE_ROLES, PROJECT_ROLES


def _get_permissions_from_roles(
    roles_config: dict,
    resource_types: frozenset[ResourceType],
) -> set[str]:
    """
    Extract all unique permissions used across a set of roles.

    Args:
        roles_config: Dictionary of role configurations
        resource_types: The resource types to include

    Returns a set of permission strings that are relevant for the given roles.
    """
    permissions = set()

    for role_config in roles_config.values():
        for perm in role_config["permissions"]:
            if perm == "*":
                # Wildcard means all permissions for the resource types in this set
                for resource_type, actions in RESOURCE_ACTIONS.items():
                    if resource_type in resource_types:
                        for action in actions:
                            p = Permission(resource_type, action)
                            permissions.add(str(p))
            elif isinstance(perm, Permission):
                if perm.resource_type in resource_types:
                    permissions.add(str(perm))
            elif isinstance(perm, str):
                if perm.endswith(":*"):
                    # Handle resource wildcard like "issue:*"
                    resource_str = perm[:-2]
                    try:
                        resource_type = ResourceType(resource_str)
                        if resource_type in resource_types:
                            actions = RESOURCE_ACTIONS.get(resource_type, frozenset())
                            for action in actions:
                                p = Permission(resource_type, action)
                                permissions.add(str(p))
                    except ValueError:
                        pass
                else:
                    permissions.add(perm)

    return permissions


def _build_resource_response(
    resource_types: frozenset[ResourceType],
    permissions: set[str],
) -> list[dict]:
    """
    Build the response structure for a set of resource types and their permissions.

    Args:
        resource_types: The resource types to include
        permissions: Set of permission strings to filter by

    Returns a list of resource dictionaries with their actions.
    """
    resources = []

    # Get resource types sorted by value
    sorted_resource_types = sorted(
        (rt for rt in RESOURCE_ACTIONS if rt in resource_types),
        key=lambda r: r.value,
    )

    for resource_type in sorted_resource_types:
        actions_for_resource = RESOURCE_ACTIONS.get(resource_type, frozenset())

        action_list = []
        for action in sorted(actions_for_resource, key=lambda a: a.value):
            perm = Permission(resource_type, action)
            permission_str = str(perm)

            # Only include if this permission is used in the roles
            if permission_str in permissions:
                action_list.append(
                    {
                        "action": action.value,
                        "display_name": action.name.replace("_", " ").title(),
                        "permission": permission_str,
                    }
                )

        # Only include resource if it has any actions
        if action_list:
            resources.append(
                {
                    "resource_type": resource_type.value,
                    "display_name": resource_type.name.replace("_", " ").title(),
                    "actions": action_list,
                }
            )

    return resources


class ResourcePermissionEndpoint(BaseAPIView):
    """
    API endpoint to list resources and their available permissions.

    Returns a structured response with:
    - Resource types for the requested namespace
    - Available actions for each resource
    - Permission strings (resource:action format)
    """

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug):
        """
        List resources and their permissions for a namespace.

        Response format:
        {
            "resources": [
                {
                    "resource_type": "workspace",
                    "display_name": "Workspace",
                    "actions": [
                        {
                            "action": "view",
                            "display_name": "View",
                            "permission": "workspace:view"
                        },
                        ...
                    ]
                },
                ...
            ]
        }
        """

        namespace = request.GET.get("namespace", "workspace")

        if namespace == "workspace":
            all_workspace_types = get_all_resource_types_under(ResourceType.WORKSPACE)
            workspace_permissions = _get_permissions_from_roles(WORKSPACE_ROLES, all_workspace_types)
            resources = _build_resource_response(all_workspace_types, workspace_permissions)
        else:
            project_permissions = _get_permissions_from_roles(PROJECT_ROLES, PROJECT_RESOURCE_TYPES)
            resources = _build_resource_response(PROJECT_RESOURCE_TYPES, project_permissions)

        return Response(
            {
                "resources": resources,
            },
            status=status.HTTP_200_OK,
        )
