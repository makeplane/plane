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
Permission API Views

API endpoints for the RBAC + GAC permission system.
"""

from uuid import UUID
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.db.models import Q
from django.utils import timezone
from django.utils.text import slugify

from plane.app.views.base import BaseViewSet, BaseAPIView
from plane.app.permissions.workspace import WorkSpaceAdminPermission, WorkspaceEntityPermission
from plane.db.models import (
    User,
    Workspace,
    Role,
    ResourcePermission,
)
from plane.permissions.definitions import get_permission
from plane.permissions.engine import permission_engine
from plane.permissions.grants import Grant
from plane.permissions.resource_models import get_model_for_resource
from plane.permissions.context import PermissionContext
from plane.permissions.inheritance import get_workspace_field_path
from plane.permissions.serializers import RoleSerializer, ResourcePermissionSerializer


class RoleViewSet(BaseViewSet):
    """
    ViewSet for managing custom roles in a workspace.

    list: Get all roles (system + custom)
    create: Create a new custom role
    update: Update a custom role
    destroy: Delete a custom role (system roles cannot be deleted)
    """

    permission_classes = [IsAuthenticated, WorkSpaceAdminPermission]
    serializer_class = RoleSerializer

    def get_queryset(self):
        workspace_slug = self.kwargs.get("slug")
        return Role.objects.filter(
            workspace__slug=workspace_slug,
            deleted_at__isnull=True,
        ).order_by("-level", "sort_order", "name")

    def list(self, request, slug):
        """Get all roles for the workspace."""
        queryset = self.get_queryset()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, slug):
        """Create a new custom role."""
        workspace = Workspace.objects.get(slug=slug)

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Generate slug from name if not provided
        name = serializer.validated_data.get("name")
        role_slug = serializer.validated_data.get("slug") or slugify(name)

        # Get namespace (defaults to workspace for custom roles)
        namespace = request.data.get("namespace", "workspace")
        if namespace not in ("workspace", "project"):
            return Response(
                {"error": "namespace must be 'workspace' or 'project'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for duplicate slug in the same namespace
        if Role.objects.filter(
            workspace=workspace,
            namespace=namespace,
            slug=role_slug,
            deleted_at__isnull=True,
        ).exists():
            return Response(
                {"error": f"Role with slug '{role_slug}' already exists in {namespace} namespace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        role = Role.objects.create(
            workspace=workspace,
            namespace=namespace,
            name=name,
            slug=role_slug,
            description=serializer.validated_data.get("description", ""),
            permissions=serializer.validated_data.get("permissions", []),
            level=serializer.validated_data.get("level", 10),
            is_system=False,
        )

        return Response(
            self.serializer_class(role).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, slug, pk):
        """Update a custom role."""
        try:
            role = Role.objects.get(
                id=pk,
                workspace__slug=slug,
                deleted_at__isnull=True,
            )
        except Role.DoesNotExist:
            return Response(
                {"error": "Role not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if role.is_system:
            return Response(
                {"error": "System roles cannot be modified"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.serializer_class(role, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Update fields
        for field in ["name", "description", "permissions", "level", "sort_order"]:
            if field in serializer.validated_data:
                setattr(role, field, serializer.validated_data[field])

        role.save()

        return Response(self.serializer_class(role).data)

    def destroy(self, request, slug, pk):
        """Delete a custom role."""
        try:
            role = Role.objects.get(
                id=pk,
                workspace__slug=slug,
                deleted_at__isnull=True,
            )
        except Role.DoesNotExist:
            return Response(
                {"error": "Role not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if role.is_system:
            return Response(
                {"error": "System roles cannot be deleted"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if role is in use
        in_use = ResourcePermission.objects.filter(
            workspace__slug=slug,
            relation=role.slug,
            deleted_at__isnull=True,
        ).exists()

        if in_use:
            return Response(
                {"error": "Role is in use and cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        role.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PermissionCheckView(BaseAPIView):
    """
    Check if the current user has a specific permission.

    GET /api/v1/workspaces/{slug}/permissions/check/
    Query params:
        - action: The action to check (e.g., "edit")
        - resource_type: The resource type (e.g., "issue")
        - resource_id: The resource ID
    """

    permission_classes = [IsAuthenticated, WorkspaceEntityPermission]

    def get(self, request, slug):
        action = request.query_params.get("action")
        resource_type = request.query_params.get("resource_type")
        resource_id = request.query_params.get("resource_id")

        if not all([action, resource_type, resource_id]):
            return Response(
                {"error": "action, resource_type, and resource_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Look up the Permission object from the user-provided strings
        perm = get_permission(f"{resource_type}:{action}")
        if perm is None:
            return Response(
                {"error": f"Invalid permission: {resource_type}:{action}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resource_uuid = UUID(resource_id)
        except (ValueError, AttributeError):
            return Response(
                {"error": "Invalid resource_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed = bool(
            permission_engine.check(
                user=request.user,
                permission=perm,
                context=PermissionContext.resource(
                    scope_id=resource_uuid,
                    workspace_id=workspace.id,
                    resource_type=resource_type,
                ),
            )
        )

        return Response({"allowed": allowed})


class ResourcePermissionsView(BaseAPIView):
    """
    Get all permissions for the current user on a resource.

    GET /api/v1/workspaces/{slug}/permissions/resource/
    Query params:
        - resource_type: The resource type (e.g., "issue")
        - resource_id: The resource ID
    """

    permission_classes = [IsAuthenticated, WorkspaceEntityPermission]

    def get(self, request, slug):
        resource_type = request.query_params.get("resource_type")
        resource_id = request.query_params.get("resource_id")

        if not all([resource_type, resource_id]):
            return Response(
                {"error": "resource_type and resource_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            resource_uuid = UUID(resource_id)
        except (ValueError, AttributeError):
            return Response(
                {"error": "Invalid resource_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        permissions = permission_engine.get_permissions(
            user=request.user,
            resource_type=resource_type,
            resource_id=resource_uuid,
            workspace_id=workspace.id,
        )

        return Response(permissions)


class ResourceGrantsViewSet(BaseViewSet):
    """
    ViewSet for managing permission grants on resources (GAC).

    list: Get all grants for a resource
    create: Grant permission to a user/role/team
    update: Update a grant
    destroy: Revoke a grant
    """

    permission_classes = [IsAuthenticated, WorkspaceEntityPermission]
    serializer_class = ResourcePermissionSerializer

    def _check_manage_permission(self, request, resource_type, resource_id, workspace_id):
        """Check that the requesting user has manage permission on the resource. Returns a 403 Response or None."""
        manage_perm = get_permission(f"{resource_type}:manage")
        if not manage_perm or not permission_engine.check(
            user=request.user,
            permission=manage_perm,
            context=PermissionContext.resource(
                scope_id=resource_id,
                workspace_id=workspace_id,
                resource_type=resource_type,
            ),
        ):
            return Response(
                {"error": "You don't have permission to manage this resource"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def list(self, request, slug):
        """Get all permission grants for a resource."""
        resource_type = request.query_params.get("resource_type")
        resource_id = request.query_params.get("resource_id")

        if not all([resource_type, resource_id]):
            return Response(
                {"error": "resource_type and resource_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = ResourcePermission.objects.filter(
            workspace__slug=slug,
            resource_type=resource_type,
            resource_id=resource_id,
            deleted_at__isnull=True,
        ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))

        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, slug):
        """Grant permission to a subject on a resource."""
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Validate subject exists
        subject_type = serializer.validated_data["subject_type"]
        subject_id = serializer.validated_data["subject_id"]

        if subject_type == "user":
            if not User.objects.filter(id=subject_id).exists():
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Extract resource info from validated data
        resource_type = serializer.validated_data["resource_type"]
        resource_id = serializer.validated_data["resource_id"]

        # Validate resource belongs to this workspace (defense-in-depth)
        model = get_model_for_resource(resource_type)
        if not model:
            return Response(
                {"error": "Invalid resource type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace_field = get_workspace_field_path(resource_type)
        if workspace_field is None:
            # resource_type IS "workspace" — verify resource_id matches
            if str(resource_id) != str(workspace.id):
                return Response(
                    {"error": "Resource does not belong to this workspace"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            if not model.objects.filter(pk=resource_id, **{workspace_field: workspace.id}).exists():
                return Response(
                    {"error": "Resource not found in this workspace"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Check if user has permission to grant on this resource
        denied = self._check_manage_permission(request, resource_type, resource_id, workspace.id)
        if denied:
            return denied

        grant = permission_engine.grant(
            granter=request.user,
            grant=Grant(
                subject_type=serializer.validated_data["subject_type"],
                subject_id=serializer.validated_data["subject_id"],
                relation=serializer.validated_data["relation"],
                resource_type=resource_type,
                resource_id=resource_id,
                workspace_id=workspace.id,
                permissions_grant=serializer.validated_data.get("permissions_grant", []),
                permissions_deny=serializer.validated_data.get("permissions_deny", []),
                expires_at=serializer.validated_data.get("expires_at"),
            ),
        )

        return Response(
            self.serializer_class(grant).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, slug, pk):
        """Update a permission grant."""
        try:
            grant = ResourcePermission.objects.get(
                id=pk,
                workspace__slug=slug,
                deleted_at__isnull=True,
            )
        except ResourcePermission.DoesNotExist:
            return Response(
                {"error": "Grant not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user has permission to manage
        workspace = grant.workspace
        denied = self._check_manage_permission(request, grant.resource_type, grant.resource_id, workspace.id)
        if denied:
            return denied

        serializer = self.serializer_class(grant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Route through engine for audit logging + cache invalidation
        updated = permission_engine.grant(
            granter=request.user,
            grant=Grant(
                subject_type=grant.subject_type,
                subject_id=grant.subject_id,
                resource_type=grant.resource_type,
                resource_id=grant.resource_id,
                workspace_id=workspace.id,
                relation=serializer.validated_data.get("relation", grant.relation),
                permissions_grant=serializer.validated_data.get("permissions_grant", grant.permissions_grant),
                permissions_deny=serializer.validated_data.get("permissions_deny", grant.permissions_deny),
                expires_at=serializer.validated_data.get("expires_at", grant.expires_at),
            ),
        )

        return Response(self.serializer_class(updated).data)

    def destroy(self, request, slug, pk):
        """Revoke a permission grant."""
        try:
            grant = ResourcePermission.objects.get(
                id=pk,
                workspace__slug=slug,
                deleted_at__isnull=True,
            )
        except ResourcePermission.DoesNotExist:
            return Response(
                {"error": "Grant not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user has permission to manage
        workspace = grant.workspace
        denied = self._check_manage_permission(request, grant.resource_type, grant.resource_id, workspace.id)
        if denied:
            return denied

        permission_engine.revoke(
            revoker=request.user,
            subject_type=grant.subject_type,
            subject_id=grant.subject_id,
            resource_type=grant.resource_type,
            resource_id=grant.resource_id,
            workspace_id=workspace.id,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class AccessibleResourcesView(BaseAPIView):
    """
    Get all resources of a type that the current user can access.

    GET /api/v1/workspaces/{slug}/permissions/accessible/
    Query params:
        - resource_type: The resource type (e.g., "project")
        - action: Optional action to filter by (default: "view")
    """

    permission_classes = [IsAuthenticated, WorkspaceEntityPermission]

    def get(self, request, slug):
        resource_type = request.query_params.get("resource_type")
        action = request.query_params.get("action", "view")

        if not resource_type:
            return Response(
                {"error": "resource_type is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Build permission string
        permission_str = f"{resource_type}:{action}"

        resource_ids = permission_engine.get_accessible_resources(
            user=request.user,
            resource_type=resource_type,
            workspace_id=workspace.id,
            permission=permission_str,
        )

        return Response([str(rid) for rid in resource_ids])


class UserRelationView(BaseAPIView):
    """
    Get the current user's relation to a resource.

    GET /api/v1/workspaces/{slug}/permissions/relation/
    Query params:
        - resource_type: The resource type
        - resource_id: The resource ID
    """

    permission_classes = [IsAuthenticated, WorkspaceEntityPermission]

    def get(self, request, slug):
        resource_type = request.query_params.get("resource_type")
        resource_id = request.query_params.get("resource_id")

        if not all([resource_type, resource_id]):
            return Response(
                {"error": "resource_type and resource_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resource_uuid = UUID(resource_id)
        except (ValueError, AttributeError):
            return Response(
                {"error": "Invalid resource_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        relation = permission_engine.get_user_relation(
            user=request.user,
            resource_type=resource_type,
            resource_id=resource_uuid,
        )

        return Response({"relation": relation})
