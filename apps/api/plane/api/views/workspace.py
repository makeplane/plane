# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os

# Django imports
from django.db import IntegrityError, transaction
from django.db.models import F, Func, OuterRef
from django.utils.text import slugify

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiRequest

# Module imports
from plane.api.serializers import WorkspaceSerializer
from plane.api.views.base import BaseAPIView
from plane.app.permissions import WorkSpaceBasePermission, WorkspaceOwnerPermission
from plane.db.models import Workspace, WorkspaceMember
from plane.bgtasks.workspace_seed_task import workspace_seed
from plane.license.utils.instance_value import get_configuration_value
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS
from plane.utils.openapi import (
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    FIELDS_PARAMETER,
    EXPAND_PARAMETER,
    UNAUTHORIZED_RESPONSE,
    FORBIDDEN_RESPONSE,
    NOT_FOUND_RESPONSE,
    VALIDATION_ERROR_RESPONSE,
    CONFLICT_RESPONSE,
    create_paginated_response,
)

# Workspace slug field length (mirrors Workspace.slug max_length).
WORKSPACE_SLUG_MAX_LENGTH = 48


def generate_unique_workspace_slug(name):
    """Derive a unique, URL-safe workspace slug from a workspace name.

    Used when the caller does not supply an explicit slug so a workspace can be
    provisioned headlessly. The result respects ``Workspace.slug``'s length
    limit, avoids reserved slugs, and is guaranteed not to collide with an
    existing workspace at generation time (the DB ``unique`` constraint remains
    the final guard against races).
    """
    base = slugify(name)[:WORKSPACE_SLUG_MAX_LENGTH]
    # ``slugify`` can strip a purely non-ASCII name down to an empty string;
    # fall back to a stable prefix so we always have something to suffix.
    if not base:
        base = "workspace"

    candidate = base
    index = 1
    while candidate in RESTRICTED_WORKSPACE_SLUGS or Workspace.objects.filter(slug=candidate).exists():
        suffix = f"-{index}"
        candidate = f"{base[: WORKSPACE_SLUG_MAX_LENGTH - len(suffix)]}{suffix}"
        index += 1
    return candidate


def workspace_queryset(user):
    """Workspaces the given user is an active member of, annotated for output.

    Annotates ``total_members`` (non-bot active members) and the caller's
    ``role`` so the serializer can surface them, mirroring the internal
    app ``WorkSpaceViewSet`` queryset.
    """
    member_count = (
        WorkspaceMember.objects.filter(workspace=OuterRef("id"), member__is_bot=False, is_active=True)
        .order_by()
        .annotate(count=Func(F("id"), function="Count"))
        .values("count")
    )
    role = WorkspaceMember.objects.filter(workspace=OuterRef("id"), member=user, is_active=True).values("role")
    return (
        Workspace.objects.filter(workspace_member__member=user, workspace_member__is_active=True)
        .select_related("owner")
        .annotate(total_members=member_count, role=role)
        .distinct()
    )


class WorkspaceListCreateAPIEndpoint(BaseAPIView):
    """Workspace list and create endpoint for the public (token) API."""

    serializer_class = WorkspaceSerializer
    model = Workspace
    permission_classes = [WorkSpaceBasePermission]
    use_read_replica = True

    def get_queryset(self):
        return workspace_queryset(self.request.user).order_by("name")

    @extend_schema(
        operation_id="list_workspaces",
        tags=["Workspaces"],
        summary="List workspaces",
        description="Retrieve all workspaces the authenticated user is an active member of.",
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                WorkspaceSerializer,
                "PaginatedWorkspaceResponse",
                "Paginated list of workspaces",
                "Paginated Workspaces",
            ),
            401: UNAUTHORIZED_RESPONSE,
        },
    )
    def get(self, request):
        """List workspaces

        Retrieve all workspaces the authenticated user is an active member of,
        ordered by name with member counts and the user's role.
        """
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda workspaces: (
                WorkspaceSerializer(workspaces, many=True, fields=self.fields, expand=self.expand).data
            ),
        )

    @extend_schema(
        operation_id="create_workspace",
        tags=["Workspaces"],
        summary="Create workspace",
        description=(
            "Create a new workspace and make the token's user its owner and admin. "
            "When ``slug`` is omitted a unique slug is generated from ``name`` so "
            "workspaces can be provisioned headlessly."
        ),
        request=OpenApiRequest(request=WorkspaceSerializer),
        responses={
            201: OpenApiResponse(
                description="Workspace created successfully",
                response=WorkspaceSerializer,
            ),
            400: VALIDATION_ERROR_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            409: CONFLICT_RESPONSE,
        },
    )
    def post(self, request):
        """Create workspace

        Create a new workspace, generate a unique slug when one is not supplied,
        and register the token's user as the owner and admin (role 20). Seeds the
        workspace with default project data asynchronously.
        """
        # Respect the instance-level switch that disables workspace creation,
        # exactly as the internal app API does.
        (disable_workspace_creation,) = get_configuration_value(
            [
                {
                    "key": "DISABLE_WORKSPACE_CREATION",
                    "default": os.environ.get("DISABLE_WORKSPACE_CREATION", "0"),
                }
            ]
        )
        if disable_workspace_creation == "1":
            return Response(
                {"error": "Workspace creation is not allowed"},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = {**request.data}
        name = data.get("name")
        if not name:
            return Response(
                {"error": "Name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Auto-generate a unique slug when the caller does not supply one; an
        # explicit slug is validated (format/reserved/uniqueness) by the
        # serializer just like the internal API.
        if not data.get("slug"):
            data["slug"] = generate_unique_workspace_slug(name)

        serializer = WorkspaceSerializer(data=data)
        try:
            if serializer.is_valid():
                # Create the workspace and register the creator as its
                # owner/admin (role 20) in one transaction so a membership
                # failure can never leave an orphaned, owner-less workspace.
                with transaction.atomic():
                    serializer.save(owner=request.user)
                    WorkspaceMember.objects.create(
                        workspace_id=serializer.data["id"],
                        member=request.user,
                        role=20,
                        company_role=data.get("company_role", ""),
                    )

                # Transaction committed: build the response and seed in the
                # background. total_members mirrors the list/retrieve annotation
                # (non-bot, active members only).
                total_members = WorkspaceMember.objects.filter(
                    workspace_id=serializer.data["id"], member__is_bot=False, is_active=True
                ).count()
                response_data = serializer.data
                response_data["total_members"] = total_members
                response_data["role"] = 20

                # Seed default project data in the background.
                workspace_seed.delay(serializer.data["id"])

                return Response(response_data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            # The slug is unique; a concurrent create can still lose the race
            # after validation passes. Report only that as a conflict and let
            # any other integrity error bubble to the global handler instead of
            # mislabelling it as a slug collision.
            if "already exists" in str(e):
                return Response(
                    {"slug": "The workspace with the slug already exists"},
                    status=status.HTTP_409_CONFLICT,
                )
            raise


class WorkspaceDetailAPIEndpoint(BaseAPIView):
    """Workspace retrieve and update endpoint for the public (token) API."""

    serializer_class = WorkspaceSerializer
    model = Workspace
    permission_classes = [WorkSpaceBasePermission]
    use_read_replica = True

    def get_permissions(self):
        # Mirror the internal WorkSpaceViewSet: retrieve is available to any
        # active member, but updates are admin-only (the internal
        # partial_update is decorated ``@allow_permission([ROLE.ADMIN])``).
        if self.request.method == "PATCH":
            return [WorkspaceOwnerPermission()]
        return [WorkSpaceBasePermission()]

    def get_queryset(self):
        return workspace_queryset(self.request.user)

    @extend_schema(
        operation_id="retrieve_workspace",
        tags=["Workspaces"],
        summary="Retrieve workspace",
        description="Retrieve details of a workspace the authenticated user is an active member of.",
        parameters=[
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Workspace details",
                response=WorkspaceSerializer,
            ),
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug):
        """Retrieve workspace

        Retrieve details of a workspace the authenticated user is an active
        member of. Non-members receive a 404.
        """
        workspace = self.get_queryset().get(slug=slug)
        serializer = WorkspaceSerializer(workspace, fields=self.fields, expand=self.expand)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="update_workspace",
        tags=["Workspaces"],
        summary="Update workspace",
        description="Partially update a workspace. Requires the token's user to be an admin of the workspace.",
        request=OpenApiRequest(request=WorkspaceSerializer),
        responses={
            200: OpenApiResponse(
                description="Workspace updated successfully",
                response=WorkspaceSerializer,
            ),
            400: VALIDATION_ERROR_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
            409: CONFLICT_RESPONSE,
        },
    )
    def patch(self, request, slug):
        """Update workspace

        Partially update a workspace's properties (name, timezone, logo, slug, ...).
        Restricted to workspace admins. Name and slug are validated with the same
        rules as creation. The owner is immutable through this endpoint.
        """
        workspace = self.get_queryset().get(slug=slug)
        serializer = WorkspaceSerializer(workspace, data=request.data, partial=True)
        try:
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            # Only a slug unique-violation is a client-facing conflict; let any
            # other integrity error bubble to the global handler.
            if "already exists" in str(e):
                return Response(
                    {"slug": "The workspace with the slug already exists"},
                    status=status.HTTP_409_CONFLICT,
                )
            raise
