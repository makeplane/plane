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

from django.db import models
from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseAPIView
from plane.db.models.permission import (
    PermissionScheme,
    PermissionSchemeActivity,
    RolePermissionScheme,
    ResourcePermission,
)
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.permissions import can, WorkspacePermissions
from plane.permissions.serializers import PermissionSchemeSerializer


class PermissionSchemeEndpoint(BaseAPIView):
    """
    API endpoint to manage permission schemes in a workspace.

    Permission schemes are named, reusable collections of permissions.
    System PS (is_system=True, workspace=NULL) are shipped by Plane.
    Custom PS are created per workspace by workspace owners.

    Endpoints:
    - GET /workspaces/<slug>/permission-schemes/ - List system + workspace PS
    - GET /workspaces/<slug>/permission-schemes/<pk>/ - Retrieve a specific PS
    - POST /workspaces/<slug>/permission-schemes/ - Create a new custom PS
    - PATCH /workspaces/<slug>/permission-schemes/<pk>/ - Update a custom PS
    - DELETE /workspaces/<slug>/permission-schemes/<pk>/ - Delete a custom PS
    """

    @check_feature_flag(feature_key=FeatureFlag.GAC)
    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug, pk=None):
        """
        List all permission schemes or retrieve a specific one.

        Without pk: returns system PS (workspace=NULL) + this workspace's custom PS.
        With pk: returns a single PS (must belong to this workspace or be a system PS).

        Query params:
        - namespace: Filter by namespace (workspace, project)
        """

        if pk:
            # Retrieve a specific PS — must be system or belong to this workspace
            try:
                ps = PermissionScheme.objects.get(
                    models.Q(workspace_id=request.workspace_id) | models.Q(workspace__isnull=True, is_system=True),
                    id=pk,
                    deleted_at__isnull=True,
                )
            except PermissionScheme.DoesNotExist:
                return Response(
                    {"error": "Permission scheme not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            serializer = PermissionSchemeSerializer(ps)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # List system PS + workspace custom PS
        namespace = request.query_params.get("namespace")

        schemes = PermissionScheme.objects.filter(
            models.Q(workspace_id=request.workspace_id) | models.Q(workspace__isnull=True, is_system=True),
            deleted_at__isnull=True,
        ).order_by("namespace", "sort_order", "name")

        if namespace:
            schemes = schemes.filter(namespace=namespace)

        serializer = PermissionSchemeSerializer(schemes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(feature_key=FeatureFlag.GAC)
    @can(WorkspacePermissions.MANAGE, resource_param="workspace_id")
    def post(self, request, slug):
        """
        Create a new custom permission scheme for this workspace.

        Request body:
        {
            "name": "Read-only access",
            "description": "View-only permissions for contractors",
            "namespace": "project",
            "permissions": ["workitem:view", "project:view"]
        }
        """

        serializer = PermissionSchemeSerializer(
            data=request.data,
            context={"workspace_id": request.workspace_id},
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        ps = serializer.save(workspace_id=request.workspace_id)
        return Response(PermissionSchemeSerializer(ps).data, status=status.HTTP_201_CREATED)

    @check_feature_flag(feature_key=FeatureFlag.GAC)
    @can(WorkspacePermissions.MANAGE, resource_param="workspace_id")
    def patch(self, request, slug, pk):
        """
        Update an existing custom permission scheme.

        System PS cannot be modified.

        Request body (all fields optional):
        {
            "name": "Updated Name",
            "description": "Updated description",
            "permissions": ["workitem:view", "workitem:create"]
        }
        """

        try:
            ps = PermissionScheme.objects.get(
                workspace_id=request.workspace_id,
                id=pk,
                deleted_at__isnull=True,
            )
        except PermissionScheme.DoesNotExist:
            return Response(
                {"error": "Permission scheme not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # System PS cannot be modified
        if ps.is_system:
            return Response(
                {"error": "System permission schemes cannot be modified"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PermissionSchemeSerializer(
            ps,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        ps = serializer.save()

        # Invalidate caches for all roles and users referencing this PS
        from plane.permissions.cache import invalidate_caches_for_permission_scheme

        invalidate_caches_for_permission_scheme(ps.id)

        return Response(PermissionSchemeSerializer(ps).data, status=status.HTTP_200_OK)

    @check_feature_flag(feature_key=FeatureFlag.GAC)
    @can(WorkspacePermissions.MANAGE, resource_param="workspace_id")
    def delete(self, request, slug, pk):
        """
        Delete a custom permission scheme (soft delete).

        System PS cannot be deleted.
        PS in use by active roles cannot be deleted — reassign roles first.
        """

        try:
            ps = PermissionScheme.objects.get(
                workspace_id=request.workspace_id,
                id=pk,
                deleted_at__isnull=True,
            )
        except PermissionScheme.DoesNotExist:
            return Response(
                {"error": "Permission scheme not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # System PS cannot be deleted
        if ps.is_system:
            return Response(
                {"error": "System permission schemes cannot be deleted"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Reject if in use by active roles
        in_use = RolePermissionScheme.objects.filter(
            permission_scheme=ps,
            deleted_at__isnull=True,
            role__deleted_at__isnull=True,
        ).exists()

        if in_use:
            return Response(
                {"error": "Permission scheme is in use by active roles. Reassign roles first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Soft delete
        PermissionSchemeActivity.track_delete(
            scheme=ps,
            actor_id=request.user.id,
        )
        ps.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PermissionSchemeImpactEndpoint(BaseAPIView):
    """
    API endpoint to assess the impact of modifying or deleting a permission scheme.

    Returns counts of roles, users, and projects affected by this PS.

    Endpoints:
    - GET /workspaces/<slug>/permission-schemes/<pk>/impact/ - Get impact summary
    """

    @check_feature_flag(feature_key=FeatureFlag.GAC)
    @can(WorkspacePermissions.MANAGE, resource_param="workspace_id")
    def get(self, request, slug, pk):
        """
        Return impact summary for a permission scheme.

        Response:
        {
            "roles": N,     # distinct roles referencing this PS
            "users": N,     # distinct users assigned those role slugs
            "projects": N   # distinct projects those users have access to
        }
        """

        try:
            ps = PermissionScheme.objects.get(
                models.Q(workspace_id=request.workspace_id) | models.Q(workspace__isnull=True, is_system=True),
                id=pk,
                deleted_at__isnull=True,
            )
        except PermissionScheme.DoesNotExist:
            return Response(
                {"error": "Permission scheme not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Roles: count distinct roles referencing this PS
        role_slugs_qs = (
            RolePermissionScheme.objects.filter(
                permission_scheme=ps, deleted_at__isnull=True, role__deleted_at__isnull=True
            )
            .values_list("role__slug", flat=True)
            .distinct()
        )

        role_count = role_slugs_qs.count()

        # Users: count distinct users with those role slugs (uses subquery, no materialization)
        user_base_qs = ResourcePermission.objects.filter(
            workspace_id=request.workspace_id,
            relation__in=role_slugs_qs,
            subject_type="user",
            deleted_at__isnull=True,
        )
        user_count = user_base_qs.values("subject_id").distinct().count()

        # Projects: count distinct projects those users have access to
        user_ids_subquery = user_base_qs.values("subject_id").distinct()
        project_count = (
            ResourcePermission.objects.filter(
                workspace_id=request.workspace_id,
                subject_type="user",
                subject_id__in=user_ids_subquery,
                resource_type="project",
                deleted_at__isnull=True,
            )
            .values("resource_id")
            .distinct()
            .count()
        )

        return Response(
            {
                "roles": role_count,
                "users": user_count,
                "projects": project_count,
            },
            status=status.HTTP_200_OK,
        )
