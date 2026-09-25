# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.response import Response
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema

from plane.api.serializers import PageAPISerializer
from plane.app.permissions import ROLE
from plane.bgtasks.page_transaction_task import page_transaction
from plane.db.models import Page, Project, ProjectMember
from plane.utils.openapi import CURSOR_PARAMETER, PER_PAGE_PARAMETER, create_paginated_response

from .base import BaseAPIView


class ProjectPageAPIPermission(BasePermission):
    """Require project membership and role-gate every PAT Page write."""

    def has_permission(self, request, view):
        role = (
            ProjectMember.objects.filter(
                workspace__slug=view.kwargs.get("slug"),
                project_id=view.kwargs.get("project_id"),
                member=request.user,
                is_active=True,
            )
            .values_list("role", flat=True)
            .first()
        )
        if not role:
            return False
        if request.method in SAFE_METHODS:
            return True
        return role in [ROLE.ADMIN.value, ROLE.MEMBER.value]


class ProjectPageBaseAPIEndpoint(BaseAPIView):
    serializer_class = PageAPISerializer
    model = Page
    permission_classes = [ProjectPageAPIPermission]

    def get_queryset(self):
        pages = (
            Page.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                project_pages__project_id=self.kwargs.get("project_id"),
                project_pages__deleted_at__isnull=True,
                project_pages__project__project_projectmember__member=self.request.user,
                project_pages__project__project_projectmember__is_active=True,
                project_pages__project__archived_at__isnull=True,
            )
            .filter(Q(owned_by=self.request.user) | Q(access=Page.PUBLIC_ACCESS))
            .defer("description_binary", "description_stripped")
            .distinct()
        )

        if ProjectMember.objects.filter(
            workspace__slug=self.workspace_slug,
            project_id=self.project_id,
            member=self.request.user,
            role=ROLE.GUEST.value,
            is_active=True,
            project__guest_view_all_features=False,
        ).exists():
            pages = pages.filter(owned_by=self.request.user)

        return pages

    def get_serializer_context(self):
        return {
            **super().get_serializer_context(),
            "workspace_slug": self.workspace_slug,
            "project_id": self.project_id,
            "owned_by_id": self.request.user.id,
        }


class ProjectPageListCreateAPIEndpoint(ProjectPageBaseAPIEndpoint):
    """List and create project Pages through PAT authentication."""

    @extend_schema(
        operation_id="list_project_pages",
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            OpenApiParameter("search", OpenApiTypes.STR, description="Filter Page names."),
            OpenApiParameter(
                "type",
                OpenApiTypes.STR,
                enum=["public", "private"],
                description="Filter by Page access.",
            ),
        ],
        responses={200: create_paginated_response(PageAPISerializer, "ProjectPage", "Paginated project Pages")},
    )
    def get(self, request, slug, project_id):
        pages = self.get_queryset()

        page_type = request.query_params.get("type")
        if page_type == "public":
            pages = pages.filter(access=Page.PUBLIC_ACCESS)
        elif page_type == "private":
            pages = pages.filter(access=Page.PRIVATE_ACCESS)

        search = request.query_params.get("search")
        if search:
            pages = pages.filter(name__icontains=search)

        pages = pages.order_by("-created_at")
        return self.paginate(
            request=request,
            queryset=pages,
            on_results=lambda results: self.get_serializer(results, many=True).data,
        )

    @extend_schema(
        operation_id="create_project_page",
        request=PageAPISerializer,
        responses={201: OpenApiResponse(response=PageAPISerializer, description="Created Page")},
    )
    def post(self, request, slug, project_id):
        if not Project.objects.filter(
            pk=project_id,
            workspace__slug=slug,
            archived_at__isnull=True,
        ).exists():
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            page = serializer.save(created_by=request.user, updated_by=request.user)
            transaction.on_commit(
                lambda: page_transaction.delay(
                    new_description_html=page.description_html,
                    old_description_html=None,
                    page_id=page.id,
                ),
                robust=True,
            )
        return Response(self.get_serializer(page).data, status=status.HTTP_201_CREATED)


class ProjectPageDetailAPIEndpoint(ProjectPageBaseAPIEndpoint):
    """Retrieve and update a project Page through PAT authentication."""

    @extend_schema(
        operation_id="retrieve_project_page",
        responses={200: OpenApiResponse(response=PageAPISerializer, description="Project Page")},
    )
    def get(self, request, slug, project_id, page_id):
        page = self.get_queryset().get(pk=page_id)
        return Response(self.get_serializer(page).data, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="update_project_page",
        request=PageAPISerializer,
        responses={200: OpenApiResponse(response=PageAPISerializer, description="Updated Page")},
    )
    def patch(self, request, slug, project_id, page_id):
        page = self.get_queryset().get(pk=page_id)
        if page.is_locked:
            return Response({"error": "Page is locked"}, status=status.HTTP_400_BAD_REQUEST)

        requested_access = request.data.get("access", page.access)
        if page.access != requested_access and page.owned_by_id != request.user.id:
            return Response(
                {"error": "Access cannot be updated since this page is owned by someone else"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_description_html = page.description_html
        serializer = self.get_serializer(
            page,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            page = serializer.save(updated_by=request.user)
            if "description_html" in request.data and page.description_html != previous_description_html:
                transaction.on_commit(
                    lambda: page_transaction.delay(
                        new_description_html=page.description_html,
                        old_description_html=previous_description_html,
                        page_id=page.id,
                    ),
                    robust=True,
                )
        return Response(self.get_serializer(page).data, status=status.HTTP_200_OK)
