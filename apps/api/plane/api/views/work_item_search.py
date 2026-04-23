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

# Python imports
import re

from django.conf import settings

# Django imports
from django.db.models import (
    Q,
)

# drf-spectacular imports
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiRequest,
    OpenApiResponse,
    extend_schema,
)

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import (
    WorkItemAdvancedSearchRequestSerializer,
    WorkItemAdvancedSearchResponseSerializer,
)
from plane.db.models import (
    Issue,
)

# Module imports
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.utils.filters import ComplexFilterBackend, IssueFilterSet
from plane.utils.openapi import (
    INVALID_REQUEST_RESPONSE,
    WORKSPACE_SLUG_PARAMETER,
)

from .base import ScopedBaseAPIView
from plane.permissions import can, WorkitemPermissions
from plane.utils.oauth import READ_SCOPE, PROJECTS_WORK_ITEMS_READ_SCOPE
from plane.utils.pql import PQLFilterBackend

if settings.OPENSEARCH_ENABLED:
    from plane.ee.documents import IssueDocument
    from plane.ee.utils.opensearch_helper import OpenSearchHelper


class WorkItemAdvancedSearchEndpoint(ScopedBaseAPIView):
    """Work Item Advanced Search Endpoint"""

    filter_backends = (ComplexFilterBackend, PQLFilterBackend)
    filterset_class = IssueFilterSet

    required_alternate_scopes = {
        "POST": [[READ_SCOPE], [PROJECTS_WORK_ITEMS_READ_SCOPE]],
    }

    @extend_schema(
        operation_id="work_item_advanced_search",
        summary="Work Item Advanced Search",
        description="Search for work items with advanced filters and search query.",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
        ],
        request=OpenApiRequest(
            request=WorkItemAdvancedSearchRequestSerializer,
            examples=[
                OpenApiExample(
                    name="Basic text search in project",
                    value={
                        "query": "login",
                        "project_id": "11111111-1111-1111-1111-111111111111",
                        "limit": 10,
                    },
                ),
                OpenApiExample(
                    name="Workspace search by assignee and state",
                    value={
                        "filters": {
                            "and": [
                                {"assignee_id": "22222222-2222-2222-2222-222222222222"},
                                {"state_group__in": ["started", "unstarted"]},
                                {"priority__in": ["high", "urgent"]},
                            ]
                        },
                        "workspace_search": True,
                        "limit": 20,
                    },
                ),
                OpenApiExample(
                    name="Filter by date range and labels",
                    value={
                        "filters": {
                            "and": [
                                {"target_date__range": ["2025-01-01", "2025-01-31"]},
                                {
                                    "label_id__in": [
                                        "33333333-3333-3333-3333-333333333333",
                                        "44444444-4444-4444-4444-444444444444",
                                    ]
                                },
                                {"module_id": "55555555-5555-5555-5555-555555555555"},
                                {"is_archived": False},
                            ]
                        },
                        "project_id": "66666666-6666-6666-6666-666666666666",
                        "limit": 15,
                    },
                ),
                OpenApiExample(
                    name="Nested and/or with not",
                    value={
                        "filters": {
                            "and": [
                                {
                                    "or": [
                                        {"assignee_id": "77777777-7777-7777-7777-777777777777"},
                                        {"created_by_id": "88888888-8888-8888-8888-888888888888"},
                                    ]
                                },
                                {"not": {"state_group": "completed"}},
                                {"priority__in": ["high", "urgent"]},
                            ]
                        },
                        "workspace_search": True,
                        "limit": 25,
                    },
                ),
                OpenApiExample(
                    name="Deeply nested groups across cycle/module/date",
                    value={
                        "filters": {
                            "or": [
                                {
                                    "and": [
                                        {
                                            "cycle_id__in": [
                                                "99999999-9999-9999-9999-999999999999",
                                                "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                                            ]
                                        },
                                        {"target_date__range": ["2025-02-01", "2025-02-28"]},
                                    ]
                                },
                                {
                                    "and": [
                                        {
                                            "module_id__in": [
                                                "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                                                "cccccccc-cccc-cccc-cccc-cccccccccccc",
                                            ]
                                        },
                                        {
                                            "state_id__in": [
                                                "dddddddd-dddd-dddd-dddd-dddddddddddd",
                                                "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
                                            ]
                                        },
                                        {"is_archived": False},
                                    ]
                                },
                            ]
                        },
                        "project_id": "ffffffff-ffff-ffff-ffff-ffffffffffff",
                        "limit": 30,
                    },
                ),
            ],
        ),
        responses={
            200: OpenApiResponse(
                description="Work item advanced search results",
                response=WorkItemAdvancedSearchResponseSerializer(many=True),
                examples=[
                    OpenApiExample(
                        name="Work Item Advanced Search Results",
                        value=[
                            {
                                "id": "0f5e2c9a-1b2c-4d5e-8f01-23456789abcd",
                                "name": "Fix login redirect loop",
                                "sequence_id": 102,
                                "project_identifier": "WEB",
                                "project_id": "11111111-1111-1111-1111-111111111111",
                                "workspace_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                                "type_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                                "state_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
                                "priority": "high",
                                "target_date": "2025-01-15",
                                "start_date": "2025-01-10",
                            },
                            {
                                "id": "1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f890",
                                "name": "Update billing email validation",
                                "sequence_id": 245,
                                "project_identifier": "API",
                                "project_id": "22222222-2222-2222-2222-222222222222",
                                "workspace_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                                "type_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                                "state_id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
                                "priority": "medium",
                                "target_date": None,
                                "start_date": "2025-01-05",
                            },
                        ],
                    )
                ],
            ),
            400: INVALID_REQUEST_RESPONSE,
        },
    )
    @can(WorkitemPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def post(self, request, slug):
        """Work Item Advanced Search"""
        query = request.data.get("query", False)
        filters = request.data.get("filters", False)
        pql = request.data.get("pql", False)
        limit = request.data.get("limit", 25)
        workspace_search = request.data.get("workspace_search", False)
        project_id = request.data.get("project_id", False)

        if not (query or filters or pql):
            return Response([], status=status.HTTP_200_OK)

        q = Q()

        if query:
            opensearch_enabled = settings.OPENSEARCH_ENABLED and check_workspace_feature_flag(
                FeatureFlag.ADVANCED_SEARCH, slug, self.request.user.id
            )
            if opensearch_enabled:
                opensearch_filters = [
                    {"workspace_slug": slug},
                    {"active_project_member_user_ids": self.request.user.id},
                    {"project_is_archived": False},
                ]
                if project_id:
                    opensearch_filters.append({"project_id": project_id})
                fields_to_retrieve = ["id"]
                boosts = {"name": 1.25, "description": 1.0}
                search_fields = ["name", "description", "project_identifier", "pretty_sequence", "sequence_id"]

                helper = OpenSearchHelper(
                    document_cls=IssueDocument,
                    filters=opensearch_filters,
                    query=query,
                    search_fields=search_fields,
                    source_fields=fields_to_retrieve,
                    page=1,
                    page_size=100,
                    boosts=boosts,
                    operator="and",  # Use AND operator for stricter matching
                )
                issues = helper.execute()
                q |= Q(**{"id__in": [issue["id"] for issue in issues]})
            else:
                # Build search query
                fields = ["name", "sequence_id", "project__identifier"]
                for field in fields:
                    if field == "sequence_id":
                        # Match whole integers only (exclude decimal numbers)
                        sequences = re.findall(r"\b\d+\b", query)
                        for sequence_id in sequences:
                            q |= Q(**{"sequence_id": sequence_id})
                    else:
                        q |= Q(**{f"{field}__icontains": query})

        # Filter issues
        issues = (
            Issue.issue_and_epics_objects.filter(q).select_related("project").accessible_to(self.request.user.id, slug)
        )

        # Apply project filter if not searching across workspace
        if (not workspace_search) and project_id:
            issues = issues.filter(project_id=project_id)

        if filters:
            # Pass filters from request body explicitly to ComplexFilterBackend
            backend = ComplexFilterBackend()
            issues = backend.filter_queryset(request, issues, self, filter_data=filters)

        if pql:
            # Pass PQL from request body explicitly to PQLFilterBackend
            pql_backend = PQLFilterBackend()
            issues = pql_backend.filter_queryset(request, issues, self, pql=pql)


        issues = issues.distinct()[: int(limit)]

        issue_results = WorkItemAdvancedSearchResponseSerializer(issues, many=True).data

        return Response(issue_results, status=status.HTTP_200_OK)
