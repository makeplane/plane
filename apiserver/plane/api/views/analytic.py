# Django imports
from django.db.models import (
    Count,
    Sum,
    F,
)
from django.db.models.functions import ExtractMonth

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

# Module imports
from plane.api.views import BaseAPIView, BaseViewSet
from plane.api.permissions import WorkSpaceAdminPermission
from plane.db.models import Issue, AnalyticView, Workspace, State, Label
from plane.api.serializers import AnalyticViewSerializer
from plane.utils.analytics_plot import build_graph_plot
from plane.bgtasks.analytic_plot_export import analytic_export_task
from plane.utils.issue_filters import issue_filters


class AnalyticsEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get(self, request, slug):
        try:
            x_axis = request.GET.get("x_axis", False)
            y_axis = request.GET.get("y_axis", False)

            if not x_axis or not y_axis:
                return Response(
                    {"error": "x-axis and y-axis dimensions are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            segment = request.GET.get("segment", False)
            filters = issue_filters(request.GET, "GET")

            queryset = Issue.objects.filter(workspace__slug=slug, **filters)

            total_issues = queryset.count()
            distribution = build_graph_plot(
                queryset=queryset, x_axis=x_axis, y_axis=y_axis, segment=segment
            )

            colors = dict()
            if x_axis in ["state__name", "state__group"] or segment in [
                "state__name",
                "state__group",
            ]:
                if x_axis in ["state__name", "state__group"]:
                    key = "name" if x_axis == "state__name" else "group"
                else:
                    key = "name" if segment == "state__name" else "group"

                colors = (
                    State.objects.filter(
                        workspace__slug=slug, project_id__in=filters.get("project__in")
                    ).values(key, "color")
                    if filters.get("project__in", False)
                    else State.objects.filter(workspace__slug=slug).values(key, "color")
                )

            if x_axis in ["labels__name"] or segment in ["labels__name"]:
                colors = (
                    Label.objects.filter(
                        workspace__slug=slug, project_id__in=filters.get("project__in")
                    ).values("name", "color")
                    if filters.get("project__in", False)
                    else Label.objects.filter(workspace__slug=slug).values(
                        "name", "color"
                    )
                )

            assignee_avatars = {}
            if x_axis in ["assignees__email"]:
                assignee_avatars = Issue.objects.filter(
                    workspace__slug=slug, **filters
                ).values("assignees__avatar")

            return Response(
                {
                    "total": total_issues,
                    "distribution": distribution,
                    "extras": {"colors": colors, "assignee_avatars": assignee_avatars},
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
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
            super().get_queryset().filter(workspace__slug=self.kwargs.get("slug"))
        )


class SavedAnalyticEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get(self, request, slug, analytic_id):
        try:
            analytic_view = AnalyticView.objects.get(
                pk=analytic_id, workspace__slug=slug
            )

            filter = analytic_view.query
            queryset = Issue.objects.filter(**filter)

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

        except AnalyticView.DoesNotExist:
            return Response(
                {"error": "Analytic View Does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ExportAnalyticsEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def post(self, request, slug):
        try:
            x_axis = request.data.get("x_axis", False)
            y_axis = request.data.get("y_axis", False)

            if not x_axis or not y_axis:
                return Response(
                    {"error": "x-axis and y-axis dimensions are required"},
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
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class DefaultAnalyticsEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get(self, request, slug):
        try:
            filters = issue_filters(request.GET, "GET")

            queryset = Issue.objects.filter(workspace__slug=slug, **filters)

            total_issues = queryset.count()

            total_issues_classified = (
                queryset.annotate(state_group=F("state__group"))
                .values("state_group")
                .annotate(state_count=Count("state_group"))
                .order_by("state_group")
            )

            open_issues = queryset.filter(
                state__group__in=["backlog", "unstarted", "started"]
            ).count()

            open_issues_classified = (
                queryset.filter(state__group__in=["backlog", "unstarted", "started"])
                .annotate(state_group=F("state__group"))
                .values("state_group")
                .annotate(state_count=Count("state_group"))
                .order_by("state_group")
            )

            issue_completed_month_wise = (
                queryset.filter(completed_at__isnull=False)
                .annotate(month=ExtractMonth("completed_at"))
                .values("month")
                .annotate(count=Count("*"))
                .order_by("month")
            )
            most_issue_created_user = (
                queryset.exclude(created_by=None)
                .values("created_by__first_name", "created_by__last_name", "created_by__avatar")
                .annotate(count=Count("id"))
                .order_by("-count")
            )[:5]

            most_issue_closed_user = (
                queryset.filter(completed_at__isnull=False, assignees__isnull=False)
                .values("assignees__first_name", "assignees__last_name", "assignees__avatar")
                .annotate(count=Count("id"))
                .order_by("-count")
            )[:5]

            pending_issue_user = (
                queryset.filter(completed_at__isnull=True)
                .values("assignees__first_name", "assignees__last_name", "assignees__avatar")
                .annotate(count=Count("id"))
                .order_by("-count")
            )

            open_estimate_sum = (
                Issue.objects.filter(
                    state__group__in=["backlog", "unstarted", "started"]
                ).aggregate(open_estimate_sum=Sum("estimate_point"))
            )["open_estimate_sum"]
            total_estimate_sum = Issue.objects.aggregate(
                total_estimate_sum=Sum("estimate_point")
            )["total_estimate_sum"]

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

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
