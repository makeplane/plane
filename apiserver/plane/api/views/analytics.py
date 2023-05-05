from itertools import groupby

# Django imports
from django.db.models import Count
from django.db.models import CharField, Count, OuterRef, Func, F, Q, DateField
from django.db.models.functions import Cast, Trunc

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

    def build_graph_plot(self, queryset, x_axis, y_axis, segment=None):
        if x_axis in ["created_at", "completed_at"]:
            queryset = queryset.annotate(date=Cast(x_axis, DateField()))
            x_axis = "date"

        # Group queryset by x_axis field
        queryset = queryset.values(x_axis).annotate()

        if segment:
            queryset = queryset.annotate(segment=F(segment))

        if y_axis == "issue_count":
            queryset = queryset.annotate(count=Count(x_axis)).order_by(x_axis)
        if y_axis == "effort":
            queryset = queryset.annotate(effort=Count("estimate_point")).order_by(
                x_axis
            )
        if y_axis == "lead_time":
            queryset = queryset.filter(
                completed_at__isnull=False,
            )

        result_values = list(queryset)
        grouped_data = {}
        for date, items in groupby(result_values, key=lambda x: x[str(x_axis)]):
            grouped_data[str(date)] = list(items)

        return grouped_data

    def get(self, request, slug):
        try:
            x_axis = request.GET.get("x_axis", False)
            y_axis = request.GET.get("y_axis", False)

            if not x_axis or not y_axis:
                return Response(
                    {"error": "x-axis and y-axis dimensions are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            project_id = request.GET.get("project_id", False)
            cycle_id = request.GET.get("cycle_id", False)
            module_id = request.GET.get("module_id", False)
            segment = request.GET.get("segment", False)

            queryset = Issue.objects.filter(workspace__slug=slug)
            if project_id:
                queryset = queryset.filter(project_id=project_id)
            if cycle_id:
                queryset = queryset.filter(issue_cycle__cycle_id=cycle_id)
            if module_id:
                queryset = queryset.filter(issue_module__module_id=module_id)

            total_issues = queryset.count()
            distribution = self.build_graph_plot(
                queryset=queryset, x_axis=x_axis, y_axis=y_axis, segment=segment
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
