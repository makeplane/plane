# Python imports
from typing import Any

# Django imports
from django.db.models import Prefetch, Q
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkSpaceBasePermission, allow_permission, ROLE
from plane.app.serializers.dashboard import DashboardSerializer, DashboardWidgetSerializer
from plane.db.models import Dashboard, DashboardWidget, Project, Workspace
from plane.app.views.base import BaseViewSet, BaseAPIView


class DashboardViewSet(BaseViewSet):
    """
    Dashboard API ViewSet for internal web application.
    """
    serializer_class = DashboardSerializer
    model = Dashboard
    permission_classes = [
        WorkSpaceBasePermission,
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(Q(created_by=self.request.user) | Q(access=1))
            .select_related("workspace")
            .prefetch_related("projects", "widgets")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        project_ids = request.data.pop("project_ids", [])
        
        serializer = DashboardSerializer(data=request.data)
        if serializer.is_valid():
            dashboard = serializer.save(workspace=workspace)
            if project_ids:
                projects = Project.objects.filter(id__in=project_ids, workspace=workspace)
                dashboard.projects.set(projects)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, slug, pk=None):
        dashboard = self.get_queryset().get(pk=pk)
        project_ids = request.data.pop("project_ids", None)
        
        serializer = DashboardSerializer(dashboard, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            if project_ids is not None:
                projects = Project.objects.filter(id__in=project_ids, workspace__slug=slug)
                dashboard.projects.set(projects)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DashboardWidgetViewSet(BaseViewSet):
    """
    Dashboard Widget API ViewSet.
    """
    serializer_class = DashboardWidgetSerializer
    model = DashboardWidget
    permission_classes = [
        WorkSpaceBasePermission,
    ]

    def get_queryset(self):
        # Verify the user has access to the parent dashboard (creator or public)
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                dashboard_id=self.kwargs.get("dashboard_id"),
            )
            .filter(
                Q(dashboard__created_by=self.request.user) | Q(dashboard__access=1)
            )
            .select_related("workspace", "dashboard")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug, dashboard_id):
        workspace = Workspace.objects.get(slug=slug)
        dashboard = Dashboard.objects.get(pk=dashboard_id, workspace=workspace)
        
        serializer = DashboardWidgetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace=workspace, dashboard=dashboard)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, slug, dashboard_id, pk=None):
        widget = self.get_queryset().get(pk=pk)
        serializer = DashboardWidgetSerializer(widget, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DashboardWidgetChartEndpoint(BaseAPIView):
    """
    Evaluates dashboard widgets and returns aggregated metrics intended for UI charting.
    """
    permission_classes = [
        WorkSpaceBasePermission,
    ]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, dashboard_id, widget_id):
        from django.db.models import Count, Sum
        from django.db.models.functions import Coalesce
        from plane.db.models import Issue, DashboardWidget
        
        try:
            widget = DashboardWidget.objects.select_related("dashboard").get(
                pk=widget_id, dashboard_id=dashboard_id, workspace__slug=slug
            )
        except DashboardWidget.DoesNotExist:
            return Response({"error": "Widget not found"}, status=status.HTTP_404_NOT_FOUND)

        dashboard = widget.dashboard

        # Verify user has access to the parent dashboard
        if dashboard.created_by != request.user and dashboard.access != 1:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        # 1. Base Query constrainted by workspace and dashboard projects
        base_qs = Issue.issue_objects.filter(
            workspace__slug=slug, 
            project_id__in=dashboard.projects.all()
        )

        # 2. Strict Filter Whitelist Injection (Secured logic)
        filter_mapping = {
            "priority": "priority__in",
            "assignees": "assignees__id__in",
            "labels": "labels__id__in",
            "state": "state_id__in",
            "state_group": "state__group__in",
            "created_by": "created_by_id__in"
        }
        
        query_kwargs = {}
        widget_filters = widget.filters or {}
        for rule_key, rules in widget_filters.items():
            if rule_key in filter_mapping and rules:
                query_kwargs[filter_mapping[rule_key]] = rules

        base_qs = base_qs.filter(**query_kwargs)

        # 3. Y-Axis Metric selection mapping Phase 6
        # Supports both frontend lowercase keys and legacy uppercase keys
        metrics_map = {
            "count": {"count": Count("id")},
            "WORK_ITEM_COUNT": {"count": Count("id")},
            "estimate_points": {"count": Coalesce(Sum("estimate_point"), 0)},
            "ESTIMATE_POINTS": {"count": Coalesce(Sum("estimate_point"), 0)},
            "PENDING_WORK_ITEMS": {"count": Count("id", filter=Q(state__group__in=["unstarted", "backlog"]))},
            "COMPLETED_WORK_ITEMS": {"count": Count("id", filter=Q(state__group="completed"))},
            "IN_PROGRESS_WORK_ITEMS": {"count": Count("id", filter=Q(state__group="started"))},
            "BLOCKED_WORK_ITEMS": {"count": Count("issue_relation__id", filter=Q(issue_relation__relation_type="blocked_by"), distinct=True)},
        }

        # Date Metrics handling
        now_date = timezone.now().date()
        if widget.y_axis_metric == "WORK_ITEMS_DUE_TODAY":
            base_qs = base_qs.filter(target_date=now_date).exclude(state__group="completed")
            aggregation = {"count": Count("id")}
        elif widget.y_axis_metric == "WORK_ITEMS_DUE_THIS_WEEK":
            start_of_week = now_date - timezone.timedelta(days=now_date.weekday())
            end_of_week = start_of_week + timezone.timedelta(days=6)
            base_qs = base_qs.filter(target_date__range=(start_of_week, end_of_week)).exclude(state__group="completed")
            aggregation = {"count": Count("id")}
        else:
            aggregation = metrics_map.get(widget.y_axis_metric, {"count": Count("id")})

        # Base Number widget check
        if widget.chart_type == "NUMBER":
            result = base_qs.aggregate(**aggregation)
            return Response({"data": [result]})

        # X-Axis Map — supports frontend lowercase keys and legacy uppercase
        x_axis_map = {
            "state": ("state_id", "state__name"),
            "STATES": ("state_id", "state__name"),
            "state_group": ("state__group",),
            "STATE_GROUPS": ("state__group",),
            "assignee": ("assignees__id", "assignees__display_name"),
            "ASSIGNEES": ("assignees__id", "assignees__display_name"),
            "project": ("project_id", "project__name"),
            "PROJECTS": ("project_id", "project__name"),
            "priority": ("priority",),
            "PRIORITIES": ("priority",),
            "labels": ("labels__id", "labels__name"),
            "LABELS": ("labels__id", "labels__name"),
        }

        group_fields = x_axis_map.get(widget.x_axis_property, ("state_id",))

        # Secondary Group-By Evaluation (Chart Models)
        is_grouped = widget.chart_model == "GROUPED" and widget.group_by
        if is_grouped:
            secondary_group = x_axis_map.get(widget.group_by, ("priority",))
            group_fields = group_fields + secondary_group

        # Execute Groups
        qs_results = base_qs.values(*group_fields).annotate(**aggregation)

        # Structure normalized JSON
        formatted_data = []

        if not is_grouped:
            for item in qs_results:
                formatted_data.append({
                    "name": item.get(group_fields[-1]) or "None",
                    "count": item.get("count", 0)
                })
        else:
            # Flatten 2D array to 1D object dict
            group_dict = {}
            primary_key = group_fields[1] if len(x_axis_map.get(widget.x_axis_property, [])) > 1 else group_fields[0]
            secondary_key = group_fields[-1]

            for item in qs_results:
                p_val = item.get(primary_key) or "None"
                s_val = item.get(secondary_key) or "None"
                
                if p_val not in group_dict:
                    group_dict[p_val] = {"name": p_val}
                
                group_dict[p_val][str(s_val)] = item.get("count", 0)
            
            formatted_data = list(group_dict.values())

        return Response({"data": formatted_data})
