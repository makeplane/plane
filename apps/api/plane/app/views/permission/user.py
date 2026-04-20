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
from plane.db.models import Workspace
from plane.permissions import (
    Permission,
    ResourceType,
    RESOURCE_ACTIONS,
    PROJECT_RESOURCE_TYPES,
    TEAMSPACE_RESOURCE_TYPES,
    can,
    WorkspacePermissions,
    PermissionContext,
)
from plane.permissions.engine import permission_engine


class UserPermissionEndpoint(BaseAPIView):
    """
    API endpoint to get the current user's permissions for a workspace or project.

    Returns the user's role/relation and all their effective permission grants
    as a sorted list of permission strings.
    """

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug, project_id=None, team_space_id=None):
        """
        Get current user's permissions.

        URL patterns:
            GET /workspaces/<slug>/permissions/
            GET /workspaces/<slug>/projects/<project_id>/permissions/
            GET /workspaces/<slug>/teamspaces/<team_space_id>/permissions/

        Response format:
        {
            "relation": "admin",
            "permission_grants": ["issue:view", "workspace_member:view", ...]
        }
        """
        # Get workspace
        workspace = Workspace.objects.get(slug=slug)

        workspace_id = workspace.id
        user = request.user

        if project_id:
            # Get user's relation to the project
            relation = permission_engine.get_user_relation(
                user=user,
                resource_type=ResourceType.PROJECT,
                resource_id=project_id,
            )

            # Build permissions for project-level resources
            permissions = self._get_project_permissions(user, project_id, workspace_id)

        elif team_space_id:
            # Get user's relation to the teamspace
            relation = permission_engine.get_user_relation(
                user=user,
                resource_type=ResourceType.TEAMSPACE,
                resource_id=team_space_id,
            )

            # Build permissions for teamspace-level resources
            permissions = self._get_teamspace_permissions(user, team_space_id, workspace_id)

        else:
            # Workspace-level permissions
            relation = permission_engine.get_user_relation(
                user=user,
                resource_type=ResourceType.WORKSPACE,
                resource_id=workspace_id,
            )

            # Build permissions for workspace-level resources
            permissions = self._get_workspace_permissions(user, workspace_id)

        return Response(
            {
                "relation": relation,
                "permission_grants": permissions,
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def _format_permission_results(batch_results: dict) -> list[str]:
        """
        Convert batch AccessResult dict into a sorted list of permission strings.

        Unconditional allows become `"perm:action"`.
        Conditional allows become `"perm:action+condition"`.
        """
        permissions = []
        for perm_str, result in batch_results.items():
            if result:  # unconditional allow
                permissions.append(perm_str)
            elif result.allowed:  # conditional allow — conditions attached
                for condition in result.conditions:
                    permissions.append(f"{perm_str}+{condition}")
        return sorted(permissions)

    def _get_workspace_permissions(self, user, workspace_id) -> list[str]:
        """
        Get all permissions for a user at the workspace level.

        Iterates all RESOURCE_ACTIONS so workspace owners/admins see every
        permission across workspace, teamspace, and project resources.

        Returns a sorted list of permission grant strings, including conditional
        grants (e.g., "comment:edit+creator").
        """
        # Collect all permissions to check
        all_perms = [
            Permission(resource_type, action)
            for resource_type, actions in RESOURCE_ACTIONS.items()
            for action in actions
        ]
        if not all_perms:
            return []

        # Batch check — builds hierarchy chain and prefetches tuples ONCE
        batch_results = permission_engine.check_batch(
            user=user,
            permissions=all_perms,
            context=PermissionContext.workspace(workspace_id),
            defer_conditions=True,
        )

        return self._format_permission_results(batch_results)

    def _get_project_permissions(self, user, project_id, workspace_id) -> list[str]:
        """
        Get all project-level permissions for a user.

        Iterates RESOURCE_ACTIONS filtered by PROJECT_RESOURCE_TYPES.
        Returns a sorted list of permission grant strings, including
        conditional grants (e.g., "comment:edit+creator").
        """
        # Collect all permissions to check
        all_perms = [
            Permission(resource_type, action)
            for resource_type, actions in RESOURCE_ACTIONS.items()
            if resource_type in PROJECT_RESOURCE_TYPES
            for action in actions
        ]
        if not all_perms:
            return []

        # Batch check — builds hierarchy chain and prefetches tuples ONCE
        batch_results = permission_engine.check_batch(
            user=user,
            permissions=all_perms,
            context=PermissionContext.project(project_id=project_id, workspace_id=workspace_id),
            defer_conditions=True,
        )

        return self._format_permission_results(batch_results)

    def _get_teamspace_permissions(self, user, team_space_id, workspace_id) -> list[str]:
        """
        Get all teamspace-level permissions for a user.

        Iterates RESOURCE_ACTIONS filtered by TEAMSPACE_RESOURCE_TYPES.
        Returns a sorted list of permission grant strings, including
        conditional grants (e.g., "teamspace:edit+lead").
        """
        # Collect all permissions to check
        all_perms = [
            Permission(resource_type, action)
            for resource_type, actions in RESOURCE_ACTIONS.items()
            if resource_type in TEAMSPACE_RESOURCE_TYPES
            for action in actions
        ]
        if not all_perms:
            return []

        # Batch check — builds hierarchy chain and prefetches tuples ONCE
        batch_results = permission_engine.check_batch(
            user=user,
            permissions=all_perms,
            context=PermissionContext.teamspace(teamspace_id=team_space_id, workspace_id=workspace_id),
            defer_conditions=True,
        )

        return self._format_permission_results(batch_results)
