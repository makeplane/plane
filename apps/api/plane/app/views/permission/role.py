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

from django.db.models import Count, Prefetch, Q
from django.db import transaction
from rest_framework.response import Response
from rest_framework import status

from plane.app.views import BaseAPIView
from plane.db.models import Role, WorkspaceMember, ProjectMember, RoleActivity
from plane.db.models.permission import RolePermissionScheme
from plane.permissions import can, WorkspacePermissions
from plane.permissions.serializers import RoleSerializer
from plane.permissions.system_roles import member_role_from_role_ref


class RoleEndpoint(BaseAPIView):
    """
    API endpoint to manage custom roles in a workspace.

    Only workspace owners can create, update, or delete custom roles.
    System roles (admin, member, guest, contributor, commenter) cannot be modified.

    Endpoints:
    - GET /workspaces/<slug>/roles/ - List all roles (system + custom)
    - GET /workspaces/<slug>/roles/<pk>/ - Retrieve a specific role
    - POST /workspaces/<slug>/roles/ - Create a new custom role
    - PATCH /workspaces/<slug>/roles/<pk>/ - Update a custom role
    - DELETE /workspaces/<slug>/roles/<pk>/ - Delete a custom role
    """

    @can(WorkspacePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug, pk=None):
        """
        List all roles or retrieve a specific role.

        Query params:
        - namespace: Filter by namespace (workspace, project)
        """

        if pk:
            # Retrieve specific role
            try:
                role = Role.objects.annotate(
                    workspace_member_count=Count(
                        "workspace_members",
                        filter=Q(workspace_members__is_active=True, workspace_members__deleted_at__isnull=True),
                    ),
                    project_member_count=Count(
                        "project_members",
                        filter=Q(project_members__is_active=True, project_members__deleted_at__isnull=True),
                    ),
                ).prefetch_related(
                    Prefetch(
                        "role_permission_schemes",
                        queryset=RolePermissionScheme.objects.filter(
                            deleted_at__isnull=True,
                            permission_scheme__deleted_at__isnull=True,
                        ).select_related("permission_scheme").order_by("sort_order"),
                    )
                ).get(
                    id=pk,
                    workspace__slug=slug,
                    deleted_at__isnull=True,
                )
            except Role.DoesNotExist:
                return Response(
                    {"error": "Role not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            serializer = RoleSerializer(role)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # List all roles
        namespace = request.query_params.get("namespace")

        roles = Role.objects.filter(
            workspace__slug=slug,
            deleted_at__isnull=True,
        ).annotate(
            workspace_member_count=Count(
                "workspace_members",
                filter=Q(workspace_members__is_active=True, workspace_members__deleted_at__isnull=True),
            ),
            project_member_count=Count(
                "project_members",
                filter=Q(project_members__is_active=True, project_members__deleted_at__isnull=True),
            ),
        ).prefetch_related(
            Prefetch(
                "role_permission_schemes",
                queryset=RolePermissionScheme.objects.filter(
                    deleted_at__isnull=True,
                    permission_scheme__deleted_at__isnull=True,
                ).select_related("permission_scheme").order_by("sort_order"),
            )
        ).order_by("namespace", "sort_order", "name")

        if namespace:
            roles = roles.filter(namespace=namespace)

        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @can(WorkspacePermissions.MANAGE, resource_param="workspace_id")
    def post(self, request, slug):
        """
        Create a new custom role.

        Only workspace owners can create custom roles.

        Request body:
        {
            "name": "QA Lead",
            "description": "Quality assurance team lead",
            "namespace": "project",  // "workspace" or "project"
            "permissions": {
                "issue:view": true,
                "issue:create": true,
                "issue:edit": true
            },
            "level": 12,  // optional, defaults to 10
            "sort_order": 250  // optional
        }
        """

        # Validate and create using serializer
        serializer = RoleSerializer(
            data=request.data,
            context={"workspace_slug": slug, "request": request},
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        role = serializer.save()
        return Response(RoleSerializer(role).data, status=status.HTTP_201_CREATED)

    @can(WorkspacePermissions.MANAGE, resource_param="workspace_id")
    def patch(self, request, slug, pk):
        """
        Update an existing custom role.

        Only workspace owners can update custom roles.
        System roles cannot be modified (except sort_order).

        When setting status to "inactive" for a role with active members,
        a ``reassign_to`` role ID must be provided so those members are
        moved to the target role before the status change is persisted.

        Request body (all fields optional):
        {
            "name": "Updated Name",
            "description": "Updated description",
            "permissions": {
                "issue:view": true,
                "issue:create": true
            },
            "level": 12,
            "sort_order": 300,
            "status": "inactive",
            "reassign_to": "<target-role-uuid>"
        }
        """
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

        reassign_to = request.data.get("reassign_to")
        new_status = request.data.get("status")

        # Disable flow: when transitioning active → inactive, members on this
        # role must be moved to another active role in the same namespace.
        if new_status == "inactive" and role.status == "active":
            MemberModel = ProjectMember if role.namespace == "project" else WorkspaceMember
            member_qs = MemberModel.objects.filter(
                role_ref=role,
                workspace__slug=slug,
                is_active=True,
                deleted_at__isnull=True,
            )

            if member_qs.exists():
                if not reassign_to:
                    return Response(
                        {"error": "Role has active members. Provide reassign_to to reassign them."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                try:
                    target_role = Role.objects.get(
                        id=reassign_to,
                        workspace__slug=slug,
                        status="active",
                        deleted_at__isnull=True,
                    )
                except Role.DoesNotExist:
                    return Response(
                        {"error": "Target role not found or not active"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if target_role.namespace != role.namespace:
                    return Response(
                        {"error": "Target role must be in the same namespace"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Update role_ref on the member table. QuerySet.update() fires
                # post_bulk_update → the sync signal updates ResourcePermission
                # and invalidates per-user caches. Capture PKs first so the
                # signal's queryset isn't empty after role_ref is changed.
                with transaction.atomic():
                    affected_pks = list(member_qs.values_list("pk", flat=True))
                    MemberModel.objects.filter(pk__in=affected_pks).update(
                        role_ref_id=target_role.id,
                        role=member_role_from_role_ref(target_role),
                    )

        # Validate and update using serializer (unknown fields like reassign_to are ignored)
        serializer = RoleSerializer(
            role,
            data=request.data,
            partial=True,
            context={"workspace_slug": slug, "request": request},
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        role = serializer.save()
        return Response(RoleSerializer(role).data, status=status.HTTP_200_OK)

    @can(WorkspacePermissions.MANAGE, resource_param="workspace_id")
    def delete(self, request, slug, pk):
        """
        Delete a custom role (soft delete).

        Only workspace owners can delete custom roles.
        System roles cannot be deleted.
        If members are assigned to the role, a `reassign_to` role ID
        must be provided in the request body to reassign them first.
        """

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

        # System roles cannot be deleted
        if role.is_system:
            return Response(
                {"error": "System roles cannot be deleted"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if role has active members
        MemberModel = ProjectMember if role.namespace == "project" else WorkspaceMember
        member_qs = MemberModel.objects.filter(
            role_ref=role,
            workspace__slug=slug,
            is_active=True,
            deleted_at__isnull=True,
        )
        has_members = member_qs.exists()

        reassign_to = request.data.get("reassign_to")

        if has_members and not reassign_to:
            return Response(
                {"error": "Role has active members. Provide reassign_to to reassign them."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_role = None
        if has_members:
            try:
                target_role = Role.objects.get(
                    id=reassign_to,
                    workspace__slug=slug,
                    deleted_at__isnull=True,
                )
            except Role.DoesNotExist:
                return Response(
                    {"error": "Target role not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if target_role.id == role.id:
                return Response(
                    {"error": "Cannot reassign to the same role"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if target_role.namespace != role.namespace:
                return Response(
                    {"error": "Target role must be in the same namespace"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():
            if target_role is not None:
                # Update role_ref on the member table. post_bulk_update signal
                # syncs ResourcePermission and invalidates per-user caches.
                affected_pks = list(member_qs.values_list("pk", flat=True))
                MemberModel.objects.filter(pk__in=affected_pks).update(
                    role_ref_id=target_role.id,
                    role=member_role_from_role_ref(target_role),
                )

            # Soft-delete M2M links to permission schemes, then the role
            RolePermissionScheme.objects.filter(
                role=role, deleted_at__isnull=True
            ).delete()
            role.delete()

        # Soft delete
        RoleActivity.track_role_delete(
            role=role,
            actor_id=request.user.id,
        )
        role.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
