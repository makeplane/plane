# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import WorkspaceEstimateSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Project, Estimate
from plane.app.permissions import WorkspaceEntityPermission

# Django imports
from django.db.models import (
    Prefetch,
)
from plane.utils.cache import cache_response


class WorkspaceEstimatesEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    @cache_response(60 * 60 * 2)
    def get(self, request, slug):
        estimate_ids = Project.objects.filter(
            workspace__slug=slug, estimate__isnull=False
        ).values_list("estimate_id", flat=True)
        estimates = Estimate.objects.filter(
            pk__in=estimate_ids
        ).prefetch_related(
            Prefetch(
                "points",
                queryset=Project.objects.select_related(
                    "estimate", "workspace", "project"
                ),
            )
        )
        serializer = WorkspaceEstimateSerializer(estimates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
