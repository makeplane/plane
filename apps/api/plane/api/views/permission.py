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

"""External read-only endpoints for permission introspection.

Mirrors the internal app endpoints under apps/api/plane/app/views/permission/
so OAuth apps and integrations can:
  - Discover what permissions the calling user has in a workspace/project
  - List the workspace's roles (system + custom)
  - List the workspace's permission schemes (system + custom)

All three are gated by @can(WorkspacePermissions.VIEW) — any active workspace
member may read this metadata.
"""

from django.db import models
from django.db.models import Prefetch
from rest_framework import status
from rest_framework.response import Response

from plane.api.views.base import ScopedBaseAPIView
from plane.db.models import Role
from plane.db.models.permission import PermissionScheme, RolePermissionScheme
from plane.permissions import (
    Permission,
    PROJECT_RESOURCE_TYPES,
    PermissionContext,
    RESOURCE_ACTIONS,
    ResourceType,
    WorkspacePermissions,
    can,
)
from plane.permissions.engine import permission_engine
from plane.permissions.serializers import PermissionSchemeSerializer, RoleSerializer
from plane.utils.oauth import (
    READ_SCOPE,
    WORKSPACES_PERMISSION_SCHEMES_READ_SCOPE,
    WORKSPACES_PERMISSIONS_READ_SCOPE,
    WORKSPACES_ROLES_READ_SCOPE,
)


def _format_permission_results(batch_results: dict) -> list[str]:
    """Convert batch AccessResult dict into sorted list of permission strings.

    Unconditional allows → "perm:action".
    Conditional allows  → "perm:action+condition".
    """
    permissions = []
    for perm_str, result in batch_results.items():
        if result:
            permissions.append(perm_str)
        elif result.allowed:
            for condition in result.conditions:
                permissions.append(f"{perm_str}+{condition}")
    return sorted(permissions)


class UserPermissionEndpoint(ScopedBaseAPIView):
    """Returns the calling user's effective permissions in a workspace or project.

    Response shape:
        {
            "relation": "admin",
            "permission_grants": ["wiki:view", "workitem:view+creator", ...]
        }
    """

    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WORKSPACES_PERMISSIONS_READ_SCOPE]],
    }

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def get(self, request, slug, project_id=None):
        workspace_id = request.workspace_id
        user = request.user

        if project_id:
            relation = permission_engine.get_user_relation(
                user=user,
                resource_type=ResourceType.PROJECT,
                resource_id=project_id,
            )
            perms = [
                Permission(rt, action)
                for rt, actions in RESOURCE_ACTIONS.items()
                if rt in PROJECT_RESOURCE_TYPES
                for action in actions
            ]
            context = PermissionContext.project(project_id=project_id, workspace_id=workspace_id)
        else:
            relation = permission_engine.get_user_relation(
                user=user,
                resource_type=ResourceType.WORKSPACE,
                resource_id=workspace_id,
            )
            perms = [Permission(rt, action) for rt, actions in RESOURCE_ACTIONS.items() for action in actions]
            context = PermissionContext.workspace(workspace_id)

        if not perms:
            permission_grants = []
        else:
            batch = permission_engine.check_batch(
                user=user,
                permissions=perms,
                context=context,
                defer_conditions=True,
            )
            permission_grants = _format_permission_results(batch)

        return Response(
            {"relation": relation, "permission_grants": permission_grants},
            status=status.HTTP_200_OK,
        )


class RoleListAPIEndpoint(ScopedBaseAPIView):
    """List or retrieve workspace roles (system + custom).

    Query params:
        namespace: filter by 'workspace' or 'project'.
    """

    use_read_replica = True
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WORKSPACES_ROLES_READ_SCOPE]],
    }

    def _base_queryset(self, slug):
        return Role.objects.filter(workspace__slug=slug, deleted_at__isnull=True).prefetch_related(
            Prefetch(
                "role_permission_schemes",
                queryset=RolePermissionScheme.objects.filter(
                    deleted_at__isnull=True,
                    permission_scheme__deleted_at__isnull=True,
                )
                .select_related("permission_scheme")
                .order_by("sort_order"),
            )
        )

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def get(self, request, slug, pk=None):
        if pk:
            try:
                role = self._base_queryset(slug).get(id=pk)
            except Role.DoesNotExist:
                return Response({"error": "Role not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response(RoleSerializer(role).data, status=status.HTTP_200_OK)

        roles = self._base_queryset(slug).order_by("namespace", "sort_order", "name")
        namespace = request.query_params.get("namespace")
        if namespace:
            roles = roles.filter(namespace=namespace)

        return self.paginate(
            request=request,
            queryset=roles,
            on_results=lambda rs: RoleSerializer(rs, many=True).data,
            default_per_page=20,
        )


class PermissionSchemeListAPIEndpoint(ScopedBaseAPIView):
    """List or retrieve workspace permission schemes (system + custom).

    Without pk: returns system PS (workspace=NULL) + this workspace's custom PS.
    With pk: returns a single PS (must belong to this workspace or be a system PS).

    Query params:
        namespace: filter by 'workspace' or 'project'.
    """

    use_read_replica = True
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WORKSPACES_PERMISSION_SCHEMES_READ_SCOPE]],
    }

    def _base_queryset(self, request):
        return PermissionScheme.objects.filter(
            models.Q(workspace_id=request.workspace_id) | models.Q(workspace__isnull=True, is_system=True),
            deleted_at__isnull=True,
        )

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def get(self, request, slug, pk=None):
        if pk:
            try:
                ps = self._base_queryset(request).get(id=pk)
            except PermissionScheme.DoesNotExist:
                return Response(
                    {"error": "Permission scheme not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(PermissionSchemeSerializer(ps).data, status=status.HTTP_200_OK)

        schemes = self._base_queryset(request).order_by("namespace", "sort_order", "name")
        namespace = request.query_params.get("namespace")
        if namespace:
            schemes = schemes.filter(namespace=namespace)

        return self.paginate(
            request=request,
            queryset=schemes,
            on_results=lambda ss: PermissionSchemeSerializer(ss, many=True).data,
            default_per_page=20,
        )
