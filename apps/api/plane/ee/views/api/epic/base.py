from django.db.models import Q

from plane.api.views.base import BaseAPIView
from plane.db.models import Issue
from plane.app.permissions import ProjectEntityPermission
from plane.ee.serializers.api import EpicSerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.openapi.decorators import epic_docs
from plane.utils.openapi.parameters import WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER, FIELDS_PARAMETER, CURSOR_PARAMETER, PER_PAGE_PARAMETER
from plane.utils.openapi.responses import INVALID_REQUEST_RESPONSE, UNAUTHORIZED_RESPONSE, NOT_FOUND_RESPONSE, create_paginated_response
from plane.utils.openapi.examples import SAMPLE_EPIC

from drf_spectacular.utils import OpenApiResponse, OpenApiExample


# Third party imports
from rest_framework import status
from rest_framework.response import Response


class EpicListCreateAPIEndpoint(BaseAPIView):
    """
    This viewset provides `list` and `create` on epic level
    """

    model = Issue
    permission_classes = [ProjectEntityPermission]
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
    permission_classes = [ProjectEntityPermission]
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
                description="Epic",
                response=EpicSerializer,
                examples=[OpenApiExample(name="Epic", value=SAMPLE_EPIC)]
            ),
            400: INVALID_REQUEST_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, pk):
        epic = self.get_queryset().get(id=pk)
        return Response(EpicSerializer(epic).data, status=status.HTTP_200_OK)