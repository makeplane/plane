# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import math
import uuid

# Django imports
from django.db.models import Count

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
    OpenApiRequest,
)

# Module imports
from .base import BaseAPIView
from plane.api.serializers import (
    UserLiteSerializer,
    ProjectMemberSerializer,
    WorkspaceMemberLiteAPISerializer,
    ProjectMemberLiteAPISerializer,
    RoleSerializer,
)
from plane.db.models import User, Workspace, WorkspaceMember, Project, ProjectMember
from plane.app.permissions import WorkspaceUserPermission
from plane.utils.paginator import BadPaginationError, Cursor, CursorResult
from plane.utils.permissions import ProjectMemberPermission, WorkSpaceAdminPermission, ProjectAdminPermission
from plane.utils.openapi import (
    role_docs,
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_ID_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    UNAUTHORIZED_RESPONSE,
    FORBIDDEN_RESPONSE,
    INVALID_REQUEST_RESPONSE,
    WORKSPACE_NOT_FOUND_RESPONSE,
    PROJECT_NOT_FOUND_RESPONSE,
    WORKSPACE_MEMBER_EXAMPLE,
    PROJECT_MEMBER_EXAMPLE,
    create_paginated_response,
)


class WorkspaceMemberAPIEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]
    use_read_replica = True

    @extend_schema(
        operation_id="get_workspace_members",
        summary="List workspace members",
        description="Retrieve all users who are members of the specified workspace.",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="List of workspace members with their roles",
                response={
                    "type": "array",
                    "items": {
                        "allOf": [
                            {"$ref": "#/components/schemas/UserLite"},
                            {
                                "type": "object",
                                "properties": {
                                    "role": {
                                        "type": "integer",
                                        "description": "Member role in the workspace",
                                    }
                                },
                            },
                        ]
                    },
                },
                examples=[WORKSPACE_MEMBER_EXAMPLE],
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: WORKSPACE_NOT_FOUND_RESPONSE,
        },
    )
    # Get all the users that are present inside the workspace
    def get(self, request, slug):
        """List workspace members

        Retrieve all users who are members of the specified workspace.
        Returns user profiles with their respective workspace roles and permissions.
        """
        # Check if the workspace exists
        if not Workspace.objects.filter(slug=slug).exists():
            return Response(
                {"error": "Provided workspace does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        workspace_members = WorkspaceMember.objects.filter(workspace__slug=slug).select_related("member")

        # Get all the users with their roles
        users_with_roles = []
        for workspace_member in workspace_members:
            user_data = UserLiteSerializer(workspace_member.member).data
            user_data["role"] = workspace_member.role
            users_with_roles.append(user_data)

        return Response(users_with_roles, status=status.HTTP_200_OK)


class ProjectMemberListCreateAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectMemberPermission]
    use_read_replica = True

    def get_permissions(self):
        if self.request.method == "GET":
            return [ProjectMemberPermission()]
        return [ProjectAdminPermission()]

    @extend_schema(
        operation_id="get_project_members",
        summary="List project members",
        description="Retrieve all users who are members of the specified project.",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="List of project members with their roles",
                response=UserLiteSerializer,
                examples=[PROJECT_MEMBER_EXAMPLE],
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    # Get all the users that are present inside the workspace
    def get(self, request, slug, project_id):
        """List project members

        Retrieve all users who are members of the specified project.
        Returns user profiles with their project-specific roles and access levels.
        """
        # Check if the workspace exists
        if not Workspace.objects.filter(slug=slug).exists():
            return Response(
                {"error": "Provided workspace does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace members that are present inside the workspace
        project_members = ProjectMember.objects.filter(project_id=project_id, workspace__slug=slug).values_list(
            "member_id", flat=True
        )

        # Get all the users that are present inside the workspace
        users = UserLiteSerializer(User.objects.filter(id__in=project_members), many=True).data
        return Response(users, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="create_project_member",
        summary="Create project member",
        description="Create a new project member",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        responses={201: OpenApiResponse(description="Project member created", response=ProjectMemberSerializer)},
        request=OpenApiRequest(request=ProjectMemberSerializer),
    )
    def post(self, request, slug, project_id):
        serializer = ProjectMemberSerializer(data=request.data, context={"slug": slug})
        serializer.is_valid(raise_exception=True)
        serializer.save(project_id=project_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# API endpoint to get and update a project member
class ProjectMemberDetailAPIEndpoint(ProjectMemberListCreateAPIEndpoint):
    @extend_schema(
        operation_id="get_project_member",
        summary="Get project member",
        description="Retrieve a project member by ID.",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        responses={
            200: OpenApiResponse(description="Project member", response=ProjectMemberSerializer),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    # Get a project member by ID
    def get(self, request, slug, project_id, pk):
        """Get project member

        Retrieve a project member by ID.
        Returns a project member with their project-specific roles and access levels.
        """
        # Check if the workspace exists
        if not Workspace.objects.filter(slug=slug).exists():
            return Response(
                {"error": "Provided workspace does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace members that are present inside the workspace
        project_members = ProjectMember.objects.get(project_id=project_id, workspace__slug=slug, pk=pk)
        user = User.objects.get(id=project_members.member_id)
        user = UserLiteSerializer(user).data
        return Response(user, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="update_project_member",
        summary="Update project member",
        description="Update a project member",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        responses={200: OpenApiResponse(description="Project member updated", response=ProjectMemberSerializer)},
        request=OpenApiRequest(request=ProjectMemberSerializer),
    )
    def patch(self, request, slug, project_id, pk):
        project_member = ProjectMember.objects.get(project_id=project_id, workspace__slug=slug, pk=pk)
        # A partial update may omit `member`, so check the existing target's workspace membership here.
        if not WorkspaceMember.objects.filter(
            workspace__slug=slug, member_id=project_member.member_id, is_active=True
        ).exists():
            return Response({"member": ["Member not found in workspace"]}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ProjectMemberSerializer(project_member, data=request.data, partial=True, context={"slug": slug})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="delete_project_member",
        summary="Delete project member",
        description="Delete a project member",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        responses={204: OpenApiResponse(description="Project member deleted")},
    )
    def delete(self, request, slug, project_id, pk):
        project_member = ProjectMember.objects.get(project_id=project_id, workspace__slug=slug, pk=pk)
        project_member.is_active = False
        project_member.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceMemberLiteAPIEndpoint(BaseAPIView):
    """Workspace members (lite) list endpoint."""

    permission_classes = [WorkSpaceAdminPermission]
    use_read_replica = True

    @extend_schema(
        operation_id="get_workspace_members_lite",
        summary="List workspace members (lite)",
        description="Retrieve a paginated, lightweight list of workspace members for pickers and directories.",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER, CURSOR_PARAMETER, PER_PAGE_PARAMETER],
        responses={
            200: create_paginated_response(
                WorkspaceMemberLiteAPISerializer,
                "PaginatedWorkspaceMemberLite",
                "Paginated list of workspace members with minimal fields",
                "Paginated Workspace Members (Lite)",
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: WORKSPACE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug):
        """List workspace members (lite)

        Retrieve a paginated, lightweight list of workspace members, optimized for
        pickers and directories.
        """
        # Check if the workspace exists
        if not Workspace.objects.filter(slug=slug).exists():
            return Response(
                {"error": "Provided workspace does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

        workspace_members = (
            WorkspaceMember.objects.filter(workspace__slug=slug).select_related("member").order_by("-created_at")
        )
        return self.paginate(
            request=request,
            queryset=workspace_members,
            on_results=lambda members: WorkspaceMemberLiteAPISerializer(members, many=True).data,
        )


class ProjectMemberLiteAPIEndpoint(BaseAPIView):
    """Project members (lite) list endpoint."""

    permission_classes = [ProjectMemberPermission]
    use_read_replica = True

    @extend_schema(
        operation_id="get_project_members_lite",
        summary="List project members (lite)",
        description="Retrieve a paginated, lightweight list of project members for pickers and directories.",
        tags=["Members"],
        parameters=[WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER, CURSOR_PARAMETER, PER_PAGE_PARAMETER],
        responses={
            200: create_paginated_response(
                ProjectMemberLiteAPISerializer,
                "PaginatedProjectMemberLite",
                "Paginated list of project members with minimal fields",
                "Paginated Project Members (Lite)",
            ),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id):
        """List project members (lite)

        Retrieve a paginated, lightweight list of project members, optimized for
        pickers and directories.
        """
        # Check if the workspace exists
        if not Workspace.objects.filter(slug=slug).exists():
            return Response(
                {"error": "Provided workspace does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not Project.objects.filter(id=project_id, workspace__slug=slug).exists():
            return Response(
                {"error": "Provided project does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

        project_members = (
            ProjectMember.objects.filter(project_id=project_id, workspace__slug=slug)
            .select_related("member")
            .order_by("-created_at")
        )
        return self.paginate(
            request=request,
            queryset=project_members,
            on_results=lambda members: ProjectMemberLiteAPISerializer(members, many=True).data,
        )


ROLE_UUID_NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")

STATIC_ROLE_NAMESPACES = ("workspace", "project")
STATIC_ROLE_SPECS = (
    ("Admin", "admin", 20),
    ("Member", "member", 15),
    ("Guest", "guest", 5),
)


def _build_workspace_roles(slug, namespace_filter=None):
    namespaces = (namespace_filter,) if namespace_filter else STATIC_ROLE_NAMESPACES
    ws_counts = {}
    proj_counts = {}

    if "workspace" in namespaces:
        ws_counts = dict(
            WorkspaceMember.objects.filter(workspace__slug=slug, is_active=True)
            .values("role")
            .annotate(count=Count("id"))
            .values_list("role", "count")
        )
    if "project" in namespaces:
        proj_counts = dict(
            ProjectMember.objects.filter(workspace__slug=slug, is_active=True)
            .values("role")
            .annotate(count=Count("id"))
            .values_list("role", "count")
        )

    roles = []
    for ns in namespaces:
        counts = ws_counts if ns == "workspace" else proj_counts
        for name, role_slug, level in STATIC_ROLE_SPECS:
            role_id = uuid.uuid5(ROLE_UUID_NAMESPACE, f"{ns}:{role_slug}")
            roles.append(
                {
                    "id": str(role_id),
                    "name": name,
                    "slug": role_slug,
                    "namespace": ns,
                    "level": level,
                    "member_count": counts.get(level, 0),
                }
            )
    return roles


class _ListOffsetPaginator:
    """List-backed paginator compatible with BasePaginator.paginate."""

    def __init__(self, queryset, max_limit=1000, on_results=None, **kwargs):
        self.queryset = list(queryset)
        self.max_limit = max_limit
        self.on_results = on_results

    def get_result(self, limit=1000, cursor=None):
        if cursor is None:
            cursor = Cursor(0, 0, 0)

        limit = min(limit, self.max_limit)
        page = cursor.offset
        offset = page * limit
        stop = offset + limit + 1

        if offset < 0:
            raise BadPaginationError("Pagination offset cannot be negative")

        sliced = self.queryset[offset:stop]
        if cursor.value != limit and cursor.is_prev:
            sliced = sliced[-(limit + 1) :]

        total_count = len(self.queryset)
        next_cursor = Cursor(limit, page + 1, False, len(sliced) > limit)
        prev_cursor = Cursor(limit, page - 1, True, page > 0)
        results = sliced[:limit]
        if self.on_results:
            results = self.on_results(results)

        max_hits = math.ceil(total_count / limit) if limit else 0
        return CursorResult(
            results=results,
            next=next_cursor,
            prev=prev_cursor,
            hits=total_count,
            max_hits=max_hits,
        )


ROLE_NAMESPACE_PARAMETER = OpenApiParameter(
    name="namespace",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    required=False,
    enum=["workspace", "project"],
    description="Optional role namespace filter ('workspace' or 'project').",
)

ROLE_ID_PARAMETER = OpenApiParameter(
    name="role_id",
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    required=True,
    description="Role UUID",
)


class WorkspaceRoleListAPIEndpoint(BaseAPIView):
    """Workspace and Project Role Definitions List Endpoint"""

    serializer_class = RoleSerializer
    permission_classes = [WorkspaceUserPermission]
    use_read_replica = True

    def check_permissions(self, request):
        if (
            request.user
            and request.user.is_authenticated
            and self.workspace_slug
            and not Workspace.objects.filter(slug=self.workspace_slug).exists()
        ):
            raise Workspace.DoesNotExist()
        super().check_permissions(request)

    @role_docs(
        operation_id="list_workspace_roles",
        summary="List workspace and project roles",
        description="Retrieve paginated static role definitions for the workspace and its projects.",
        parameters=[ROLE_NAMESPACE_PARAMETER, CURSOR_PARAMETER, PER_PAGE_PARAMETER],
        responses={
            200: create_paginated_response(
                RoleSerializer,
                "PaginatedRoleResponse",
                "Paginated list of role definitions",
                "Paginated Roles",
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: WORKSPACE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug):
        """List workspace and project roles

        Retrieve paginated static role definitions with active member counts.
        """
        Workspace.objects.get(slug=slug)
        namespace = request.GET.get("namespace")
        if namespace is not None and namespace != "":
            if namespace not in STATIC_ROLE_NAMESPACES:
                return Response(
                    {"error": "Invalid namespace. Must be 'workspace' or 'project'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            namespace = None

        roles = _build_workspace_roles(slug, namespace_filter=namespace)
        return self.paginate(
            request=request,
            queryset=roles,
            paginator_cls=_ListOffsetPaginator,
        )


class WorkspaceRoleDetailAPIEndpoint(WorkspaceRoleListAPIEndpoint):
    """Workspace or Project Role Definition Retrieve Endpoint"""

    @role_docs(
        operation_id="retrieve_workspace_role",
        summary="Retrieve role definition",
        description="Retrieve a single workspace or project role definition by UUID.",
        parameters=[ROLE_ID_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="Role definition",
                response=RoleSerializer,
            ),
            404: WORKSPACE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, role_id):
        """Retrieve role definition

        Retrieve a single static role definition and its active member count in the workspace.
        """
        Workspace.objects.get(slug=slug)
        target_id = str(role_id)
        for ns in STATIC_ROLE_NAMESPACES:
            for _, role_slug, _ in STATIC_ROLE_SPECS:
                if str(uuid.uuid5(ROLE_UUID_NAMESPACE, f"{ns}:{role_slug}")) == target_id:
                    roles = _build_workspace_roles(slug, namespace_filter=ns)
                    match = next(r for r in roles if r["id"] == target_id)
                    return Response(match, status=status.HTTP_200_OK)

        return Response({"error": "Role not found"}, status=status.HTTP_404_NOT_FOUND)
