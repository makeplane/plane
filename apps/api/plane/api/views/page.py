# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import uuid

# Django imports
from django.db.models import Exists, OuterRef, Q, Subquery

# Third party imports
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    extend_schema,
)
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import PageSearchSerializer
from plane.app.permissions import ROLE
from plane.db.models import Page, ProjectPage
from plane.utils.openapi import (
    BAD_SEARCH_REQUEST_RESPONSE,
    CURSOR_PARAMETER,
    FORBIDDEN_RESPONSE,
    PER_PAGE_PARAMETER,
    UNAUTHORIZED_RESPONSE,
    WORKSPACE_SLUG_PARAMETER,
    create_paginated_response,
)

from .base import BaseAPIView

# Page size for search results. Each hit carries a text snippet, so results are
# heavier than a plain id/name list; a smaller default keeps responses light and
# matches the advertised PER_PAGE_PARAMETER contract (default 20, max 100).
PAGE_SEARCH_DEFAULT_PER_PAGE = 20
PAGE_SEARCH_MAX_PER_PAGE = 100

# Query parameters specific to page search.
PAGE_SEARCH_QUERY_PARAMETER = OpenApiParameter(
    name="query",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="Search query matched (case-insensitively) against page name and page text content",
    required=True,
    examples=[
        OpenApiExample(
            name="Content search",
            value="onboarding checklist",
            description="Find pages whose name or body contains this text",
        )
    ],
)

PAGE_SEARCH_PROJECTS_PARAMETER = OpenApiParameter(
    name="projects",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="Optional comma-separated list of project IDs to restrict the search to",
    required=False,
    examples=[
        OpenApiExample(
            name="Two projects",
            value="550e8400-e29b-41d4-a716-446655440010,550e8400-e29b-41d4-a716-446655440011",
        )
    ],
)

PAGE_SEARCH_ARCHIVED_PARAMETER = OpenApiParameter(
    name="archived",
    type=OpenApiTypes.BOOL,
    location=OpenApiParameter.QUERY,
    description="Include archived pages in the results. Archived pages are excluded unless this is 'true'.",
    required=False,
    examples=[OpenApiExample(name="Include archived", value=True)],
)


class PageSearchEndpoint(BaseAPIView):
    """Endpoint to search project pages by name and text content."""

    use_read_replica = True

    @extend_schema(
        operation_id="search_pages",
        tags=["Pages"],
        description=(
            "Search pages across a workspace by name and text content. Only pages in projects the "
            "requesting user is a member of are returned; private pages are visible only to their owner "
            "and archived pages are excluded unless ``archived=true``."
        ),
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PAGE_SEARCH_QUERY_PARAMETER,
            PAGE_SEARCH_PROJECTS_PARAMETER,
            PAGE_SEARCH_ARCHIVED_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                item_schema=PageSearchSerializer,
                schema_name="PaginatedPageSearchResponse",
                description="Paginated page search results",
                example_name="Page Search Response",
            ),
            400: BAD_SEARCH_REQUEST_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
        },
    )
    def get(self, request, slug):
        """Search pages

        Perform a case-insensitive search across page names and page text
        content, scoped to the pages the requesting user is allowed to see.
        Results are cursor paginated.
        """
        query = request.query_params.get("query", "").strip()
        if not query:
            return Response(
                {"error": "The 'query' parameter is required to search pages."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Parse the optional project filter into a list of validated UUIDs.
        raw_projects = request.query_params.get("projects", "")
        try:
            project_ids = [uuid.UUID(pid.strip()) for pid in raw_projects.split(",") if pid.strip()]
        except (ValueError, TypeError):
            return Response(
                {"error": "The 'projects' parameter must be a comma-separated list of valid project IDs."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        include_archived = request.query_params.get("archived", "false").lower() == "true"

        # Match on page name OR the maintained stripped text content, case-insensitively.
        match_query = Q(name__icontains=query) | Q(description_stripped__icontains=query)

        # Scoping (security critical) — mirror the internal GlobalSearchEndpoint /
        # PageViewSet rules using an Exists() subquery so the project membership
        # join does not fan out (and duplicate) rows:
        #   * only pages that belong to at least one project where the requesting
        #     user is an active member and the project is not archived,
        #   * in a project where the user is only a guest, and that project has not
        #     opted guests into seeing everything, only their own pages — the same
        #     rule PageViewSet.list/retrieve enforce,
        #   * optionally narrowed to the requested projects.
        #
        # Every membership predicate stays in this single filter() call so they all
        # bind to the SAME ProjectMember row; splitting them across filter() calls
        # would let the role check match a different membership than the user's.
        accessible_project_pages = ProjectPage.objects.filter(
            Q(project__project_projectmember__role__gt=ROLE.GUEST.value)
            | Q(project__guest_view_all_features=True)
            | Q(page__owned_by=request.user),
            page_id=OuterRef("pk"),
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
        )
        if project_ids:
            accessible_project_pages = accessible_project_pages.filter(project_id__in=project_ids)

        # A representative accessible project id to report for the page.
        representative_project = accessible_project_pages.order_by("created_at").values("project_id")[:1]

        pages = (
            Page.objects.filter(workspace__slug=slug)
            .filter(match_query)
            # Private pages are visible only to their owner.
            .filter(Q(access=Page.PUBLIC_ACCESS) | Q(owned_by=request.user))
            .annotate(
                matched_project_id=Subquery(representative_project),
                has_access=Exists(accessible_project_pages),
            )
            .filter(has_access=True)
        )

        # Archived pages are excluded unless explicitly requested.
        if not include_archived:
            pages = pages.filter(archived_at__isnull=True)

        return self.paginate(
            request=request,
            queryset=pages,
            on_results=lambda results: PageSearchSerializer(results, many=True, context={"query": query}).data,
            order_by="-updated_at",
            default_per_page=PAGE_SEARCH_DEFAULT_PER_PAGE,
            max_per_page=PAGE_SEARCH_MAX_PER_PAGE,
        )
