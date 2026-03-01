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

from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiExample

# Module imports
from plane.api.views.base import BaseAPIView
from plane.api.serializers import EpicSerializer
from plane.app.permissions import ProjectEntityPermission

# plane db models
from plane.db.models import Issue

# plane payment flags
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag

# plane utils openapi decorators
from plane.utils.openapi.decorators import epic_docs
from plane.utils.openapi.parameters import (
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_ID_PARAMETER,
    FIELDS_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
)
from plane.utils.openapi.responses import (
    INVALID_REQUEST_RESPONSE,
    UNAUTHORIZED_RESPONSE,
    NOT_FOUND_RESPONSE,
    create_paginated_response,
)
from plane.utils.openapi.examples import SAMPLE_EPIC
from plane.authentication.permissions.oauth import TokenHasScopeIfOAuth
from plane.utils.oauth import READ_SCOPE, PROJECTS_EPICS_READ_SCOPE


class EpicListCreateAPIEndpoint(BaseAPIView):
    """
    This viewset provides `list` and `create` on epic level
    """

    model = Issue
    permission_classes = [ProjectEntityPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_EPICS_READ_SCOPE]],
    }
    serializer_class = EpicSerializer

    def get_queryset(self):
        return Issue.objects.filter(
            workspace__slug=self.kwargs["slug"],
            project_id=self.kwargs["project_id"],
        ).filter(Q(type__isnull=False) & Q(type__is_epic=True))

    @check_feature_flag(FeatureFlag.EPICS)
    @epic_docs(
        operation_id="list_epics",
        summary="List epics",
        description="List epics",
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                EpicSerializer,
                "PaginatedEpicResponse",
                "Paginated list of epics",
                "Paginated Epics",
            ),
            400: INVALID_REQUEST_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
        },
    )
    def get(self, request, slug, project_id):
        epic_queryset = self.get_queryset()
        return self.paginate(
            request=request,
            queryset=epic_queryset,
            on_results=lambda x: EpicSerializer(x, many=True).data,
        )


class EpicDetailAPIEndpoint(BaseAPIView):
    """
    This viewset provides `retrieve` on epic level
    """

    model = Issue
    permission_classes = [ProjectEntityPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_EPICS_READ_SCOPE]],
    }
    serializer_class = EpicSerializer

    def get_queryset(self):
        return Issue.objects.filter(
            workspace__slug=self.kwargs["slug"],
            project_id=self.kwargs["project_id"],
        ).filter(Q(type__isnull=False) & Q(type__is_epic=True))

    @check_feature_flag(FeatureFlag.EPICS)
    @epic_docs(
        operation_id="retrieve_epic",
        summary="Retrieve an epic",
        description="Retrieve an epic by id",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
            FIELDS_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Epic", response=EpicSerializer, examples=[OpenApiExample(name="Epic", value=SAMPLE_EPIC)]
            ),
            400: INVALID_REQUEST_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, pk):
        epic = self.get_queryset().get(id=pk)
        return Response(EpicSerializer(epic).data, status=status.HTTP_200_OK)
