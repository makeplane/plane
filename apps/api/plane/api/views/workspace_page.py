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

import base64

# openapi imports
from drf_spectacular.utils import OpenApiResponse, OpenApiExample

# Django imports
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

from plane.api.views.base import BaseAPIView
from plane.db.models import Page, Workspace
from plane.ee.models import PageUser
from plane.api.serializers import PageDetailAPISerializer, PageCreateAPISerializer, PageListAPISerializer
from plane.ee.permissions import WorkspacePagePermission
from plane.utils.openapi.decorators import page_docs
from plane.utils.openapi.parameters import (
    WORKSPACE_SLUG_PARAMETER,
    PAGE_ID_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    ORDER_BY_PARAMETER,
)
from plane.utils.openapi.responses import UNAUTHORIZED_RESPONSE, NOT_FOUND_RESPONSE, create_paginated_response
from plane.utils.openapi.examples import SAMPLE_PAGE
from plane.bgtasks.copy_s3_object import sync_with_external_service
from plane.bgtasks.page_transaction_task import page_transaction
from plane.ee.bgtasks.page_update import nested_page_update, PageAction
from plane.authentication.permissions.oauth import TokenHasScopeIfOAuth
from plane.utils.oauth import (
    READ_SCOPE,
    WRITE_SCOPE,
    WIKI_PAGES_READ_SCOPE,
    WIKI_PAGES_WRITE_SCOPE,
)


class WorkspacePageDetailAPIEndpoint(BaseAPIView):
    use_read_replica = True

    model = Page
    serializer_class = PageDetailAPISerializer
    permission_classes = [WorkspacePagePermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WIKI_PAGES_READ_SCOPE]],
    }

    def get_queryset(self):
        return Page.objects.filter(workspace__slug=self.kwargs["slug"], is_global=True)

    @page_docs(
        operation_id="get_workspace_page_detail",
        summary="Get a workspace page by ID",
        description="Get a workspace page by ID",
        parameters=[WORKSPACE_SLUG_PARAMETER, PAGE_ID_PARAMETER],
        responses={
            200: OpenApiResponse(
                description="Page",
                response=PageDetailAPISerializer,
                examples=[OpenApiExample(name="Page", value=SAMPLE_PAGE)],
            ),
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, pk):
        page = self.get_queryset().get(id=pk)
        serializer = self.serializer_class(page)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspacePageAPIEndpoint(BaseAPIView):
    use_read_replica = True

    serializer_class = PageCreateAPISerializer
    permission_classes = [WorkspacePagePermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WIKI_PAGES_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [WIKI_PAGES_WRITE_SCOPE]],
    }

    @page_docs(
        operation_id="list_workspace_pages",
        summary="List workspace pages",
        description="List workspace pages",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                PageListAPISerializer,
                "PaginatedWorkspacePageResponse",
                "Paginated list of workspace pages",
                "Paginated Workspace Pages",
            ),
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug):
        page_type = request.query_params.get("type", "all")
        search = request.query_params.get("search")

        user_pages = PageUser.objects.filter(
            Q(user_id=request.user.id) | Q(page__owned_by_id=request.user.id),
            workspace__slug=slug,
        ).values_list("page_id", flat=True)

        queryset = (
            Page.objects.filter(workspace__slug=slug, is_global=True)
            .filter(moved_to_page__isnull=True)
            .filter(Q(owned_by=request.user) | Q(access=0) | Q(id__in=user_pages))
            .distinct()
        )

        filters = Q()
        if search:
            filters &= Q(name__icontains=search)
        if page_type == "public":
            filters &= Q(access=0, archived_at__isnull=True)
        elif page_type == "private":
            filters &= Q(access=1, archived_at__isnull=True) & ~Q(id__in=user_pages)
        elif page_type == "shared":
            filters &= Q(id__in=user_pages, access=1, archived_at__isnull=True)
        elif page_type == "archived":
            filters &= Q(archived_at__isnull=False)

        queryset = queryset.filter(filters).order_by("-created_at")

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda pages: PageListAPISerializer(pages, many=True).data,
        )

    @page_docs(
        operation_id="create_workspace_page",
        summary="Create a workspace page",
        description="Create a workspace page",
        parameters=[WORKSPACE_SLUG_PARAMETER],
        responses={
            201: OpenApiResponse(description="Page", response=PageCreateAPISerializer),
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        description_html = request.data.get("description_html", "<p></p>")
        external_data = sync_with_external_service(entity_name="PAGE", description_html=description_html)
        serializer = PageCreateAPISerializer(
            data=request.data,
            context={
                "workspace_id": workspace.id,
                "owned_by_id": request.user.id,
                "description_binary": (
                    base64.b64decode(external_data.get("description_binary")) if external_data else None
                ),
                "description_json": (external_data.get("description_json", {}) if external_data else {}),
                "collection_id": request.data.get("collection_id"),
            },
        )

        if serializer.is_valid():
            page = serializer.save(is_global=True)
            # capture the page transaction
            page_transaction.delay(
                new_description_html=request.data.get("description_html", "<p></p>"),
                old_description_html=None,
                page_id=page.id,
            )
            if serializer.data.get("parent_id"):
                nested_page_update.delay(
                    page_id=page.id,
                    action=PageAction.SUB_PAGE,
                    slug=slug,
                    user_id=request.user.id,
                )

            # Check parent access without additional query
            if page.parent_id and page.parent.access == Page.PRIVATE_ACCESS:
                page.owned_by_id = page.parent.owned_by_id
                page.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
