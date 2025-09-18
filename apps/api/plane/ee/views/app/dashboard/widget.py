# django imports
from django.db import models
from django.db.models import F, Q
from django_filters.rest_framework import FilterSet, filters

# Third party imports
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import Issue, Project, Workspace
from plane.ee.models import (
    Dashboard,
    DashboardProject,
    # DashboardQuickFilter,
    DashboardWidget,
    Widget,
)
from plane.ee.permissions import ROLE, allow_permission
from plane.ee.serializers import WidgetSerializer
from plane.ee.utils.chart_validations import validate_chart_config
from plane.ee.utils.widget_graph_plot import build_widget_chart
from plane.ee.views.base import BaseAPIView
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import (
    check_feature_flag,
    check_workspace_feature_flag,
)
from plane.utils.filters import ComplexFilterBackend, IssueFilterSet


class WidgetEndpoint(BaseAPIView):
    def get_queryset(self):
        return Widget.objects.filter(
            dashboard_widgets__dashboard_id=self.kwargs.get("dashboard_id"),
            workspace__slug=self.kwargs.get("slug"),
        ).annotate(
            width=F("dashboard_widgets__width"),
            height=F("dashboard_widgets__height"),
            x_axis_coord=F("dashboard_widgets__x_axis_coord"),
            y_axis_coord=F("dashboard_widgets__y_axis_coord"),
            filters=F("dashboard_widgets__filters"),
        )

    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug, dashboard_id):
        workspace = Workspace.objects.filter(slug=slug).first()
        serializer = WidgetSerializer(
            data=request.data,
            context={"workspace_id": workspace.id, "dashboard_id": dashboard_id},
        )
        if serializer.is_valid():
            serializer.save()
            widget = self.get_queryset().filter(id=serializer.data["id"]).first()
            serializer = WidgetSerializer(widget)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def patch(self, request, slug, dashboard_id, pk):
        widget = Widget.objects.filter(id=pk, workspace__slug=slug).first()
        if not widget:
            return Response(
                {"error": "Widget not found"}, status=status.HTTP_404_NOT_FOUND
            )

        chart_model = request.data.get("chart_model")
        chart_type = request.data.get("chart_type")

        if chart_model and chart_type:
            mutable_data = request.data.copy()
            validated_data = validate_chart_config(
                chart_model, chart_type, mutable_data
            )
        else:
            validated_data = request.data

        serializer = WidgetSerializer(
            widget,
            data=validated_data,
            context={"dashboard_id": dashboard_id},
            partial=True,
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, dashboard_id):
        widgets = self.get_queryset()
        serializer = WidgetSerializer(widgets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def delete(self, request, slug, dashboard_id, pk):
        dashboard_widget = DashboardWidget.objects.filter(
            dashboard_id=dashboard_id, widget_id=pk, workspace__slug=slug
        ).first()
        dashboard_widget.delete()
        widget = Widget.objects.filter(id=pk, workspace__slug=slug).first()
        widget.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WidgetListEndpoint(BaseAPIView):
    filterset_class = IssueFilterSet

    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, dashboard_id, widget_id):
        workspace = Workspace.objects.get(slug=slug)

        dashboard = Dashboard.objects.get(id=dashboard_id, workspace_id=workspace.id)

        # get the dashboard projects
        dashboard_project_ids = DashboardProject.objects.filter(
            dashboard_id=dashboard_id, workspace_id=workspace.id
        ).values_list("project_id", flat=True)

        dashboard_widget = DashboardWidget.objects.filter(
            dashboard_id=dashboard_id, widget_id=widget_id, workspace_id=workspace.id
        ).first()
        widget = Widget.objects.filter(workspace_id=workspace.id, id=widget_id).first()

        # query params for live update in the chart
        group_by = request.query_params.get("group_by", widget.group_by)
        # quick_filter = request.query_params.get("quick_filter", None)
        y_axis_metric = request.query_params.get("y_axis_metric", widget.y_axis_metric)
        x_axis_property = request.query_params.get(
            "x_axis_property", widget.x_axis_property
        )
        x_axis_date_grouping = request.query_params.get(
            "x_axis_date_grouping", widget.x_axis_date_grouping
        )

        if (
            widget.y_axis_metric == Widget.YAxisMetricEnum.ESTIMATE_POINT_COUNT
            or y_axis_metric == Widget.YAxisMetricEnum.ESTIMATE_POINT_COUNT
        ):
            dashboard_project_ids = (
                Project.objects.filter(id__in=dashboard_project_ids)
                .filter(
                    estimate__isnull=False,
                    estimate__type="points",
                )
                .values_list("id", flat=True)
            )

        issues = Issue.objects.filter(
            workspace_id=workspace.id,
            project_id__in=dashboard_project_ids,
        )

        # get the widget filter
        if dashboard_widget.filters:
            # use the complex filter backend using dashboard widget filters
            issues = ComplexFilterBackend().filter_queryset(
                request, issues, self, dashboard_widget.filters
            )

        issues = (
            issues.filter(
                models.Q(issue_intake__status=1)
                | models.Q(issue_intake__status=-1)
                | models.Q(issue_intake__status=2)
                | models.Q(issue_intake__isnull=True)
            )
            .filter(
                state__is_triage=False,
            )
            .exclude(
                archived_at__isnull=False,
                project__archived_at__isnull=False,
                is_draft=True,
            )
        )

        if (
            x_axis_property == Widget.PropertyEnum.EPICS
            or group_by == Widget.PropertyEnum.EPICS
        ):
            issues = issues.filter(Q(type__isnull=False) & Q(type__is_epic=True))
        else:
            issues = issues.filter(Q(type__is_epic=False) | Q(type__isnull=True))

        issues = issues.accessible_to(request.user.id, slug)

        if not x_axis_property and widget.chart_type != "NUMBER":
            return Response(
                {"message": "x axis is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not y_axis_metric:
            return Response(
                {"message": "y axis is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # build the graph
        response = build_widget_chart(
            queryset=issues,
            chart_type=widget.chart_type,
            x_axis=x_axis_property,
            y_axis=y_axis_metric,
            group_by=group_by,
            x_axis_date_grouping=x_axis_date_grouping,
        )

        return Response(response, status=status.HTTP_200_OK)


class BulkWidgetEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.DASHBOARDS)
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug, dashboard_id):
        widgets_data = request.data.get("widgets", [])

        # Extract widget IDs
        widget_ids = [w["id"] for w in widgets_data if "id" in w]

        # Fetch existing widgets in one query
        widget_map = {
            str(w.widget_id): w
            for w in DashboardWidget.objects.filter(
                widget_id__in=widget_ids,
                dashboard_id=dashboard_id,
                workspace__slug=slug,
            )
        }

        updated_widgets = []

        # Loop over incoming data and update only necessary fields
        for w in widgets_data:
            widget = widget_map.get(str(w["id"]))

            if widget:
                widget.height = w.get("height", widget.height)
                widget.width = w.get("width", widget.width)
                widget.x_axis_coord = w.get("x_axis_coord", widget.x_axis_coord)
                widget.y_axis_coord = w.get("y_axis_coord", widget.y_axis_coord)
                updated_widgets.append(widget)

        # Bulk update
        if updated_widgets:
            DashboardWidget.objects.bulk_update(
                updated_widgets, ["height", "width", "x_axis_coord", "y_axis_coord"]
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
