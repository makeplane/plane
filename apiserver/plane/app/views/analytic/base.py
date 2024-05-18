# Django imports
from django.db.models import Count, F, Sum
from django.db.models.functions import ExtractMonth
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import WorkSpaceAdminPermission
from plane.app.serializers import AnalyticViewSerializer

# Module imports
from plane.app.views.base import BaseAPIView, BaseViewSet
from plane.bgtasks.analytic_plot_export import analytic_export_task
from plane.db.models import AnalyticView, Issue, Workspace
from plane.utils.analytics_plot import build_graph_plot
from plane.utils.issue_filters import issue_filters


class AnalyticsEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get(self, request, slug):
        x_axis = request.GET.get("x_axis", False)
        y_axis = request.GET.get("y_axis", False)
        segment = request.GET.get("segment", False)

        valid_xaxis_segment = [
            "state_id",
            "state__group",
            "labels__id",
            "assignees__id",
            "estimate_point",
            "issue_cycle__cycle_id",
            "issue_module__module_id",
            "priority",
            "start_date",
            "target_date",
            "created_at",
            "completed_at",
        ]

        valid_yaxis = [
            "issue_count",
            "estimate",
        ]

        # Check for x-axis and y-axis as thery are required parameters
        if (
            not x_axis
            or not y_axis
            or x_axis not in valid_xaxis_segment
            or y_axis not in valid_yaxis
        ):
            return Response(
                {
                    "error": "x-axis and y-axis dimensions are required and the values should be valid"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If segment is present it cannot be same as x-axis
        if segment and (
            segment not in valid_xaxis_segment or x_axis == segment
        ):
            return Response(
                {
                    "error": "Both segment and x axis cannot be same and segment should be valid"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Additional filters that need to be applied
        filters = issue_filters(request.GET, "GET")

        # Get the issues for the workspace with the additional filters applied
        queryset = Issue.issue_objects.filter(workspace__slug=slug, **filters)

        # Get the total issue count
        total_issues = queryset.count()

        # Build the graph payload
        distribution = build_graph_plot(
            queryset=queryset, x_axis=x_axis, y_axis=y_axis, segment=segment
        )

        state_details = {}
        if x_axis in ["state_id"] or segment in ["state_id"]:
            state_details = (
                Issue.issue_objects.filter(
                    workspace__slug=slug,
                    **filters,
                )
                .distinct("state_id")
                .order_by("state_id")
                .values("state_id", "state__name", "state__color")
            )

        label_details = {}
        if x_axis in ["labels__id"] or segment in ["labels__id"]:
            label_details = (
                Issue.objects.filter(
                    workspace__slug=slug, **filters, labels__id__isnull=False
                )
                .distinct("labels__id")
                .order_by("labels__id")
                .values("labels__id", "labels__color", "labels__name")
            )

        assignee_details = {}
        if x_axis in ["assignees__id"] or segment in ["assignees__id"]:
            assignee_details = (
                Issue.issue_objects.filter(
                    workspace__slug=slug,
                    **filters,
                    assignees__avatar__isnull=False,
                )
                .order_by("assignees__id")
                .distinct("assignees__id")
                .values(
                    "assignees__avatar",
                    "assignees__display_name",
                    "assignees__first_name",
                    "assignees__last_name",
                    "assignees__id",
                )
            )

        cycle_details = {}
        if x_axis in ["issue_cycle__cycle_id"] or segment in [
            "issue_cycle__cycle_id"
        ]:
            cycle_details = (
                Issue.issue_objects.filter(
                    workspace__slug=slug,
                    **filters,
                    issue_cycle__cycle_id__isnull=False,
                )
                .distinct("issue_cycle__cycle_id")
                .order_by("issue_cycle__cycle_id")
                .values(
                    "issue_cycle__cycle_id",
                    "issue_cycle__cycle__name",
                )
            )

        module_details = {}
        if x_axis in ["issue_module__module_id"] or segment in [
            "issue_module__module_id"
        ]:
            module_details = (
                Issue.issue_objects.filter(
                    workspace__slug=slug,
                    **filters,
                    issue_module__module_id__isnull=False,
                )
                .distinct("issue_module__module_id")
                .order_by("issue_module__module_id")
                .values(
                    "issue_module__module_id",
                    "issue_module__module__name",
                )
            )

        return Response(
            {
                "total": total_issues,
                "distribution": distribution,
                "extras": {
                    "state_details": state_details,
                    "assignee_details": assignee_details,
                    "label_details": label_details,
                    "cycle_details": cycle_details,
                    "module_details": module_details,
                },
            },
            status=status.HTTP_200_OK,
        )


class AnalyticViewViewset(BaseViewSet):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]
    model = AnalyticView
    serializer_class = AnalyticViewSerializer

    def perform_create(self, serializer):
        workspace = Workspace.objects.get(slug=self.kwargs.get("slug"))
        serializer.save(workspace_id=workspace.id)

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
        )


class SavedAnalyticEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get(self, request, slug, analytic_id):
        analytic_view = AnalyticView.objects.get(
            pk=analytic_id, workspace__slug=slug
        )

        filter = analytic_view.query
        queryset = Issue.issue_objects.filter(**filter)

        x_axis = analytic_view.query_dict.get("x_axis", False)
        y_axis = analytic_view.query_dict.get("y_axis", False)

        if not x_axis or not y_axis:
            return Response(
                {"error": "x-axis and y-axis dimensions are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        segment = request.GET.get("segment", False)
        distribution = build_graph_plot(
            queryset=queryset, x_axis=x_axis, y_axis=y_axis, segment=segment
        )
        total_issues = queryset.count()
        return Response(
            {"total": total_issues, "distribution": distribution},
            status=status.HTTP_200_OK,
        )


class ExportAnalyticsEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def post(self, request, slug):
        x_axis = request.data.get("x_axis", False)
        y_axis = request.data.get("y_axis", False)
        segment = request.data.get("segment", False)

        valid_xaxis_segment = [
            "state_id",
            "state__group",
            "labels__id",
            "assignees__id",
            "estimate_point",
            "issue_cycle__cycle_id",
            "issue_module__module_id",
            "priority",
            "start_date",
            "target_date",
            "created_at",
            "completed_at",
        ]

        valid_yaxis = [
            "issue_count",
            "estimate",
        ]

        # Check for x-axis and y-axis as thery are required parameters
        if (
            not x_axis
            or not y_axis
            or x_axis not in valid_xaxis_segment
            or y_axis not in valid_yaxis
        ):
            return Response(
                {
                    "error": "x-axis and y-axis dimensions are required and the values should be valid"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If segment is present it cannot be same as x-axis
        if segment and (
            segment not in valid_xaxis_segment or x_axis == segment
        ):
            return Response(
                {
                    "error": "Both segment and x axis cannot be same and segment should be valid"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        analytic_export_task.delay(
            email=request.user.email, data=request.data, slug=slug
        )

        return Response(
            {
                "message": f"Once the export is ready it will be emailed to you at {str(request.user.email)}"
            },
            status=status.HTTP_200_OK,
        )


class DefaultAnalyticsEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get(self, request, slug):
        filters = issue_filters(request.GET, "GET")
        base_issues = Issue.issue_objects.filter(
            workspace__slug=slug, **filters
        )

        total_issues = base_issues.count()

        state_groups = base_issues.annotate(state_group=F("state__group"))

        total_issues_classified = (
            state_groups.values("state_group")
            .annotate(state_count=Count("state_group"))
            .order_by("state_group")
        )

        open_issues_groups = ["backlog", "unstarted", "started"]
        open_issues_queryset = state_groups.filter(
            state__group__in=open_issues_groups
        )

        open_issues = open_issues_queryset.count()
        open_issues_classified = (
            open_issues_queryset.values("state_group")
            .annotate(state_count=Count("state_group"))
            .order_by("state_group")
        )

        current_year = timezone.now().year
        issue_completed_month_wise = (
            base_issues.filter(completed_at__year=current_year)
            .annotate(month=ExtractMonth("completed_at"))
            .values("month")
            .annotate(count=Count("*"))
            .order_by("month")
        )

        user_details = [
            "created_by__first_name",
            "created_by__last_name",
            "created_by__avatar",
            "created_by__display_name",
            "created_by__id",
        ]

        most_issue_created_user = (
            base_issues.exclude(created_by=None)
            .values(*user_details)
            .annotate(count=Count("id"))
            .order_by("-count")[:5]
        )

        user_assignee_details = [
            "assignees__first_name",
            "assignees__last_name",
            "assignees__avatar",
            "assignees__display_name",
            "assignees__id",
        ]

        most_issue_closed_user = (
            base_issues.filter(completed_at__isnull=False)
            .exclude(assignees=None)
            .values(*user_assignee_details)
            .annotate(count=Count("id"))
            .order_by("-count")[:5]
        )

        pending_issue_user = (
            base_issues.filter(completed_at__isnull=True)
            .values(*user_assignee_details)
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        open_estimate_sum = open_issues_queryset.aggregate(
            sum=Sum("estimate_point")
        )["sum"]
        total_estimate_sum = base_issues.aggregate(sum=Sum("estimate_point"))[
            "sum"
        ]

        return Response(
            {
                "total_issues": total_issues,
                "total_issues_classified": total_issues_classified,
                "open_issues": open_issues,
                "open_issues_classified": open_issues_classified,
                "issue_completed_month_wise": issue_completed_month_wise,
                "most_issue_created_user": most_issue_created_user,
                "most_issue_closed_user": most_issue_closed_user,
                "pending_issue_user": pending_issue_user,
                "open_estimate_sum": open_estimate_sum,
                "total_estimate_sum": total_estimate_sum,
            },
            status=status.HTTP_200_OK,
        )
