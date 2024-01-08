# Django imports
from django.utils import timezone
from django.db.models import (
    Q,
    Case,
    When,
    Value,
    CharField,
    Count,
    BooleanField,
    F,
    Exists,
    OuterRef,
)

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from . import BaseAPIView, BaseViewSet
from plane.db.models import (
    Issue,
    IssueActivity,
    ProjectMember,
    Widget,
    DashboardWidget,
    Dashboard,
)
from plane.app.serializers import (
    IssueActivitySerializer,
    DashBoardIssueSerializer,
    DashboardSerializer,
    WidgetSerializer,
)


def dashboard_overview_stats(request, slug):
    assigned_issues = Issue.issue_objects.filter(
        workspace__slug=slug, assignees__in=[request.user]
    ).count()

    pending_issues_count = Issue.issue_objects.filter(
        ~Q(state__group__in=["completed", "cancelled"]),
        workspace__slug=slug,
        assignees__in=[request.user],
    ).count()

    created_issues_count = Issue.issue_objects.filter(
        workspace__slug=slug,
        created_by_id=request.user.id,
    ).count()

    completed_issues_count = Issue.issue_objects.filter(
        workspace__slug=slug,
        assignees__in=[request.user],
        state__group="completed",
    ).count()

    return Response(
        {
            "assigned_issues_count": assigned_issues,
            "pending_issues_count": pending_issues_count,
            "completed_issues_count": completed_issues_count,
            "created_issues_count": created_issues_count,
        },
        status=status.HTTP_200_OK,
    )


def dashboard_assigned_issues(request, slug):
    # get all the assigned issues
    assigned_issues = Issue.issue_objects.filter(
        workspace__slug=slug, assignees__in=[request.user]
    ).order_by("created_at")

    # # Priority Ordering
    priority_order = ["urgent", "high", "medium", "low", "none"]
    assigned_issues = assigned_issues.annotate(
        priority_order=Case(
            *[When(priority=p, then=Value(i)) for i, p in enumerate(priority_order)],
            output_field=CharField(),
        )
    ).order_by("priority_order")

    upcoming_issues = assigned_issues.filter(start_date__gt=timezone.now())[:5]
    upcoming_issues_count = assigned_issues.filter(
        start_date__gt=timezone.now()
    ).count()

    overdue_issues = assigned_issues.filter(
        target_date__lt=timezone.now(),
        state__group__in=["backlog", "unstarted", "started"],
    )[:5]
    overdue_issues_count = assigned_issues.filter(
        target_date__lt=timezone.now(),
        state__group__in=["backlog", "unstarted", "started"],
    ).count()

    completed_issues = assigned_issues.filter(state__group__in=["completed"])[:5]
    completed_issues_count = assigned_issues.filter(
        state__group__in=["completed"]
    ).count()

    return Response(
        {
            "upcoming_issues": DashBoardIssueSerializer(
                upcoming_issues, many=True
            ).data,
            "overdue_issues": DashBoardIssueSerializer(overdue_issues, many=True).data,
            "completed_issues": DashBoardIssueSerializer(
                completed_issues, many=True
            ).data,
            "upcoming_issues_count": upcoming_issues_count,
            "overdue_issues_count": overdue_issues_count,
            "completed_issues_count": completed_issues_count,
        },
        status=status.HTTP_200_OK,
    )


def dashboard_created_issues(request, slug):
    # get all the created issues
    created_issues = Issue.issue_objects.filter(
        workspace__slug=slug, created_by=request.user
    ).order_by("created_at")

    # # Priority Ordering
    priority_order = ["urgent", "high", "medium", "low", "none"]
    created_issues = created_issues.annotate(
        priority_order=Case(
            *[When(priority=p, then=Value(i)) for i, p in enumerate(priority_order)],
            output_field=CharField(),
        )
    ).order_by("priority_order")

    upcoming_issues = created_issues.filter(start_date__gt=timezone.now())[:5]
    upcoming_issues_count = created_issues.filter(start_date__gt=timezone.now()).count()

    overdue_issues = created_issues.filter(
        target_date__lt=timezone.now(),
        state__group__in=["backlog", "unstarted", "started"],
    )[:5]
    overdue_issues_count = created_issues.filter(
        target_date__lt=timezone.now(),
        state__group__in=["backlog", "unstarted", "started"],
    ).count()

    completed_issues = created_issues.filter(state__group__in=["completed"])[:5]
    completed_issues_count = created_issues.filter(
        state__group__in=["completed"]
    ).count()

    return Response(
        {
            "upcoming_issues": DashBoardIssueSerializer(
                upcoming_issues, many=True
            ).data,
            "overdue_issues": DashBoardIssueSerializer(overdue_issues, many=True).data,
            "completed_issues": DashBoardIssueSerializer(
                completed_issues, many=True
            ).data,
            "upcoming_issues_count": upcoming_issues_count,
            "overdue_issues_count": overdue_issues_count,
            "completed_issues_count": completed_issues_count,
        },
        status=status.HTTP_200_OK,
    )


def dashboard_issues_by_state_groups(request, slug):
    issues_by_state_groups = (
        Issue.issue_objects.filter(
            workspace__slug=slug,
            created_by=request.user,
        )
        .values("state__group")
        .annotate(count=Count("id"))
    )
    return Response(issues_by_state_groups, status=status.HTTP_200_OK)


def dashboard_issues_by_priority(request, slug):
    issues_by_priority = (
        Issue.issue_objects.filter(
            workspace__slug=slug,
            created_by=request.user,
        )
        .values("priority")
        .annotate(count=Count("id"))
    )

    return Response(issues_by_priority, status=status.HTTP_200_OK)


def dashboard_recent_activity(request, slug):
    queryset = (
        IssueActivity.objects.filter(
            ~Q(field__in=["comment", "vote", "reaction", "draft"]),
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            actor=request.user,
        )
        .select_related("actor", "workspace", "issue", "project")
        .order_by("updated_at")[:10]
    )

    return Response(
        IssueActivitySerializer(queryset, many=True).data, status=status.HTTP_200_OK
    )


def dashboard_recent_projects(request, slug):
    # first get all the projects in which the user is part of
    projects = ProjectMember.objects.filter(
        member=request.user,
        is_active=True,
    ).values_list("project_id", flat=True)

    # now order the projects by the last activity change
    recent_projects = (
        IssueActivity.objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            project_id__in=projects,
            actor=request.user,
        )
        .select_related("project")
        .order_by("updated_at")[:5]
    )

    # just return all the project ids
    return Response(
        {
            "recent_projects": DashBoardIssueSerializer(
                recent_projects, many=True
            ).data,
        },
        status=status.HTTP_200_OK,
    )


def dashboard_recent_collaborators(request, slug):
    recent_collaborators = Issue.issue_objects.filter(
        workspace__slug=slug,
        created_by=request.user,
    ).order_by("-updated_at")[:5]

    return Response(
        {
            "recent_collaborators": DashBoardIssueSerializer(
                recent_collaborators, many=True
            ).data,
        },
        status=status.HTTP_200_OK,
    )


class DashboardEndpoint(BaseAPIView):
    def create(self, request, slug):
        serializer = DashboardSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, slug, pk):
        # dashboard = Dashboard.objects.get(pk=pk, )
        serializer = DashboardSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, pk):
        serializer = DashboardSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, slug, dashboard_id=None):
        if not dashboard_id:
            dashboard_type = request.GET.get("dashboard_type", None)
            if dashboard_type == "home":
                dashboard, created = Dashboard.objects.get_or_create(
                    type=dashboard_type,
                    owned_by=request.user,
                    is_default=True
                )

                if created:
                    widgets_to_fetch = [
                        "overview_stats",
                        "assigned_issues",
                        "created_issues",
                        "issues_by_state_groups",
                        "issues_by_priority",
                        "recent_activity",
                        "recent_projects",
                        "recent_collaborators",
                    ]

                    updated_dashboard_widgets = []
                    for widget_key in widgets_to_fetch:
                        widget = Widget.objects.filter(key=widget_key).first()
                        if widget:
                            updated_dashboard_widgets.append(
                                DashboardWidget(
                                    widget_id=widget.id,
                                    dashboard_id=dashboard.id,
                                    is_visible=True,
                                )
                            )

                    DashboardWidget.objects.bulk_create(updated_dashboard_widgets, batch_size=100)

                return Response(
                    DashboardSerializer(dashboard).data, status=status.HTTP_200_OK
                )
            return Response(
                {"error": "Please specify a valid dashboard type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        widget_type = request.GET.get("widget_type", "overview_stats")

        WIDGETS_MAPPER = {
            "overview_stats": dashboard_overview_stats,
            "assigned_issues": dashboard_assigned_issues,
            "created_issues": dashboard_created_issues,
            "issues_by_state_groups": dashboard_issues_by_state_groups,
            "issues_by_priority": dashboard_issues_by_priority,
            "recent_activity": dashboard_recent_activity,
            "recent_projects": dashboard_recent_projects,
            "recent_collaborators": dashboard_recent_collaborators,
        }

        func = WIDGETS_MAPPER.get(widget_type)
        if func is not None:
            response = func(
                request=request,
                slug=slug,
            )
            if isinstance(response, Response):
                return response

        return Response(
            {"error": "Please specify a valid widget key"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class WidgetsEndpoint(BaseAPIView):
    def get(self, request, dashboard_id):
        # get all the widgets for the dashboard
        widgets = Widget.objects.annotate(
            is_visible=Exists(
                DashboardWidget.objects.filter(
                    widget_id=OuterRef("pk"), dashboard_id=dashboard_id, is_visible=True
                )
            )
        )
        return Response(
            WidgetSerializer(widgets, many=True).data, status=status.HTTP_200_OK
        )

    def patch(self, request, dashboard_id, widget_id):
        dashboard_widget = DashboardWidget.objects.filter(
            widget_id=widget_id,
            dashboard_id=dashboard_id,
        ).first()
        dashboard_widget.is_visible = request.data.get(
            "is_visible", dashboard_widget.is_visible
        )
        dashboard_widget.sort_order = request.data.get(
            "sort_order", dashboard_widget.sort_order
        )
        dashboard_widget.filters = request.data.get("filters", dashboard_widget.filters)
        dashboard_widget.save()
        return Response({"message": "successfully updated"}, status=status.HTTP_200_OK)
