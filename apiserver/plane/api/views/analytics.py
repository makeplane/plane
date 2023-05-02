# Django imports
from django.db.models import Count
from django.db.models import (
    CharField,
    Count,
    OuterRef,
    Func,
    F,
    Q,
)

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

# Module imports
from plane.api.views import BaseAPIView
from plane.api.permissions import WorkSpaceAdminPermission, ProjectBasePermission
from plane.db.models import Issue


class PlaneAnalyticsEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def build_graph_plot(self, queryset, x_axis, y_axis):
        
        if y_axis == "issue_count":
            if x_axis == "state_name":
                queryset = queryset.annotate()
        
        if x_axis == "state_name":
            queryset = queryset.annotate().values(
                x_axis
            )
        if x_axis == "priority":
            queryset = queryset.annotate("priority")
        if y_axis == "issue_count":
            queryset = queryset.annotate(count=Count(x_axis))

        return queryset

    def get(self, request, slug):
        try:
            x_axis = request.GET.get("x_axis", False)
            y_axis = request.GET.get("y_axis", False)

            if not x_axis or not y_axis:
                return Response(
                    {"error": "x-axis and y-axis dimensions are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            queryset = Issue.objects.filter(workspace__slug=slug)
            total_issues = queryset.count()
            distribution = self.build_graph_plot(
                queryset=queryset, x_axis=x_axis, y_axis=y_axis
            )

            return Response(
                {"total": total_issues, "distribution": distribution},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
