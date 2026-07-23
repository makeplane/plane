# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from django.db.models import OuterRef, Func, F, Q
from django.utils import timezone

# Module imports
from plane.app.views.base import BaseAPIView
from plane.license.api.permissions import InstanceAdminPermission
from plane.db.models import User, Workspace, WorkspaceMember, Project, ProjectMember
from plane.app.serializers import WorkspaceMemberAdminSerializer
from plane.license.api.serializers import WorkspaceSerializer
from plane.license.models import InstanceAdmin
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS


class InstanceWorkSpaceAvailabilityCheckEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        slug = request.GET.get("slug", False)

        if not slug or slug == "":
            return Response(
                {"error": "Workspace Slug is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace = Workspace.objects.filter(slug__iexact=slug).exists() or slug in RESTRICTED_WORKSPACE_SLUGS
        return Response({"status": not workspace}, status=status.HTTP_200_OK)


class InstanceWorkSpaceEndpoint(BaseAPIView):
    model = Workspace
    serializer_class = WorkspaceSerializer
    permission_classes = [InstanceAdminPermission]

    def get_workspace_queryset(self):
        project_count = (
            Project.objects.filter(workspace_id=OuterRef("id"))
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )

        member_count = (
            WorkspaceMember.objects.filter(
                workspace=OuterRef("id"),
                member__is_bot=False,
                is_active=True,
                is_instance_admin_access=False,
            )
            .select_related("owner")
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )

        return Workspace.objects.annotate(total_projects=project_count, total_members=member_count)

    def get(self, request, pk=None):
        workspaces = self.get_workspace_queryset()

        if pk is not None:
            workspace = workspaces.filter(pk=pk).first()
            if workspace is None:
                return Response(status=status.HTTP_404_NOT_FOUND)
            return Response(WorkspaceSerializer(workspace).data, status=status.HTTP_200_OK)

        # Add search functionality
        search = request.query_params.get("search", None)
        if search:
            workspaces = workspaces.filter(name__icontains=search)

        return self.paginate(
            request=request,
            queryset=workspaces,
            on_results=lambda results: WorkspaceSerializer(results, many=True).data,
            max_per_page=10,
            default_per_page=10,
        )

    def post(self, request):
        try:
            serializer = WorkspaceSerializer(data=request.data)

            slug = request.data.get("slug", False)
            name = request.data.get("name", False)

            if not name or not slug:
                return Response(
                    {"error": "Both name and slug are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if len(name) > 80 or len(slug) > 48:
                return Response(
                    {"error": "The maximum length for name is 80 and for slug is 48"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if serializer.is_valid(raise_exception=True):
                serializer.save(owner=request.user)
                # Create Workspace member
                _ = WorkspaceMember.objects.create(
                    workspace_id=serializer.data["id"],
                    member=request.user,
                    role=20,
                    company_role=request.data.get("company_role", ""),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(
                [serializer.errors[error][0] for error in serializer.errors],
                status=status.HTTP_400_BAD_REQUEST,
            )

        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"slug": "The workspace with the slug already exists"},
                    status=status.HTTP_409_CONFLICT,
                )


class InstanceWorkspaceMemberEndpoint(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    def get_workspace(self, workspace_id):
        return Workspace.objects.filter(pk=workspace_id).first()

    def get(self, request, workspace_id, pk=None):
        workspace = self.get_workspace(workspace_id)
        if workspace is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        members = WorkspaceMember.objects.filter(
            workspace=workspace,
            member__is_bot=False,
            is_active=True,
        ).select_related("member")
        search = request.query_params.get("search", "").strip()
        if search:
            members = members.filter(
                Q(member__email__icontains=search)
                | Q(member__display_name__icontains=search)
                | Q(member__first_name__icontains=search)
                | Q(member__last_name__icontains=search)
            )

        return self.paginate(
            request=request,
            queryset=members,
            on_results=lambda results: WorkspaceMemberAdminSerializer(results, many=True).data,
            default_per_page=50,
            max_per_page=100,
        )

    def post(self, request, workspace_id):
        workspace = self.get_workspace(workspace_id)
        if workspace is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            role = int(request.data.get("role", 15))
        except (TypeError, ValueError):
            return Response({"error": "Invalid workspace role"}, status=status.HTTP_400_BAD_REQUEST)
        if role not in [5, 15, 20]:
            return Response({"error": "Invalid workspace role"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email, is_bot=False, is_active=True).first()
        if user is None:
            return Response(
                {"error": "An active registered user with this email was not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if InstanceAdmin.objects.filter(user=user).exists():
            return Response(
                {"error": "Instance administrators already have access to every workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member = WorkspaceMember.objects.filter(
            workspace=workspace,
            member=user,
            deleted_at__isnull=True,
        ).first()
        if member is not None and member.is_active:
            return Response(
                {"error": "This user is already a workspace member"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if member is None:
            member = WorkspaceMember.objects.create(
                workspace=workspace,
                member=user,
                role=role,
            )
        else:
            member.role = role
            member.is_active = True
            member.is_instance_admin_access = False
            member.instance_admin_previous_role = None
            member.save(
                update_fields=[
                    "role",
                    "is_active",
                    "is_instance_admin_access",
                    "instance_admin_previous_role",
                    "updated_at",
                ]
            )

        return Response(WorkspaceMemberAdminSerializer(member).data, status=status.HTTP_201_CREATED)

    def patch(self, request, workspace_id, pk):
        workspace = self.get_workspace(workspace_id)
        if workspace is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        member = WorkspaceMember.objects.filter(pk=pk, workspace=workspace, is_active=True).first()
        if member is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if member.is_instance_admin_access:
            return Response(
                {"error": "Instance administrators are managed separately"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            role = int(request.data.get("role"))
        except (TypeError, ValueError):
            return Response({"error": "Invalid workspace role"}, status=status.HTTP_400_BAD_REQUEST)
        if role not in [5, 15, 20]:
            return Response({"error": "Invalid workspace role"}, status=status.HTTP_400_BAD_REQUEST)
        if workspace.owner_id == member.member_id and role != 20:
            return Response(
                {"error": "The workspace owner must remain an administrator"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member.role = role
        member.save(update_fields=["role", "updated_at"])
        return Response(WorkspaceMemberAdminSerializer(member).data, status=status.HTTP_200_OK)

    def delete(self, request, workspace_id, pk):
        workspace = self.get_workspace(workspace_id)
        if workspace is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        member = WorkspaceMember.objects.filter(pk=pk, workspace=workspace, is_active=True).first()
        if member is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if member.is_instance_admin_access:
            return Response(
                {"error": "Instance administrators are managed separately"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if workspace.owner_id == member.member_id:
            return Response(
                {"error": "The workspace owner cannot be removed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ProjectMember.objects.filter(
            workspace=workspace,
            member=member.member,
            is_instance_admin_access=False,
            is_active=True,
        ).update(is_active=False, updated_at=timezone.now())
        member.is_active = False
        member.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
