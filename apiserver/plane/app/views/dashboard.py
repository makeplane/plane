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
    Max,
    Subquery,
    JSONField,
)

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from . import BaseAPIView
from plane.db.models import (
    Issue,
    IssueActivity,
    ProjectMember,
    Widget,
    DashboardWidget,
    Dashboard,
    Project,
)
from plane.app.serializers import (
    IssueActivitySerializer,
    DashBoardIssueSerializer,
    DashboardSerializer,
    WidgetSerializer,
)
from plane.utils.issue_filters import issue_filters

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
    filters = issue_filters(request.query_params, "GET")
    # get all the assigned issues
    assigned_issues = Issue.issue_objects.filter(
        workspace__slug=slug, assignees__in=[request.user]
    ).filter(**filters).order_by("created_at")

    # Priority Ordering
    priority_order = ["urgent", "high", "medium", "low", "none"]
    assigned_issues = assigned_issues.annotate(
        priority_order=Case(
            *[When(priority=p, then=Value(i)) for i, p in enumerate(priority_order)],
            output_field=CharField(),
        )
    ).order_by("priority_order")

    # Get counts for different issue categories
    issue_counts = assigned_issues.aggregate(
        upcoming_issues_count=Count(
            Case(
                When(
                    target_date__gte=timezone.now(),
                    state__group__in=["backlog", "unstarted", "started"],
                    then=1,
                ),
                output_field=CharField(),
            )
        ),
        overdue_issues_count=Count(
            Case(
                When(
                    target_date__lt=timezone.now(),
                    state__group__in=["backlog", "unstarted", "started"],
                    then=1,
                ),
                output_field=CharField(),
            )
        ),
        completed_issues_count=Count(
            Case(
                When(state__group__in=["completed"], then=1),
                output_field=CharField(),
            )
        ),
    )

    # Fetch issues directly based on specific criteria
    upcoming_issues = assigned_issues.filter(
        state__group__in=["backlog", "unstarted", "started"],
        target_date__gte=timezone.now(),
    )[:5]
    overdue_issues = assigned_issues.filter(
        target_date__lt=timezone.now(),
        state__group__in=["backlog", "unstarted", "started"],
    )[:5]
    completed_issues = assigned_issues.filter(state__group__in=["completed"])[:5]

    return Response(
        {
            "upcoming_issues": DashBoardIssueSerializer(
                upcoming_issues, many=True
            ).data,
            "overdue_issues": DashBoardIssueSerializer(overdue_issues, many=True).data,
            "completed_issues": DashBoardIssueSerializer(
                completed_issues, many=True
            ).data,
            "upcoming_issues_count": issue_counts["upcoming_issues_count"],
            "overdue_issues_count": issue_counts["overdue_issues_count"],
            "completed_issues_count": issue_counts["completed_issues_count"],
        },
        status=status.HTTP_200_OK,
    )


def dashboard_created_issues(request, slug):
    filters = issue_filters(request.query_params, "GET")
    # get all the created issues
    created_issues = Issue.issue_objects.filter(
        workspace__slug=slug, created_by=request.user
    ).filters(**filters).order_by("created_at")

    # Priority Ordering
    priority_order = ["urgent", "high", "medium", "low", "none"]
    created_issues = created_issues.annotate(
        priority_order=Case(
            *[When(priority=p, then=Value(i)) for i, p in enumerate(priority_order)],
            output_field=CharField(),
        )
    ).order_by("priority_order")

    # Get counts for different issue categories
    issue_counts = created_issues.aggregate(
        upcoming_issues_count=Count(
            Case(
                When(
                    target_date__gte=timezone.now(),
                    state__group__in=["backlog", "unstarted", "started"],
                    then=1,
                ),
                output_field=CharField(),
            )
        ),
        overdue_issues_count=Count(
            Case(
                When(
                    target_date__lt=timezone.now(),
                    state__group__in=["backlog", "unstarted", "started"],
                    then=1,
                ),
                output_field=CharField(),
            )
        ),
        completed_issues_count=Count(
            Case(
                When(state__group__in=["completed"], then=1),
                output_field=CharField(),
            )
        ),
    )

    # Fetch issues directly based on specific criteria
    upcoming_issues = created_issues.filter(
        state__group__in=["backlog", "unstarted", "started"],
        target_date__gte=timezone.now(),
    )[:5]
    overdue_issues = created_issues.filter(
        target_date__lt=timezone.now(),
        state__group__in=["backlog", "unstarted", "started"],
    )[:5]
    completed_issues = created_issues.filter(state__group__in=["completed"])[:5]

    return Response(
        {
            "upcoming_issues": DashBoardIssueSerializer(
                upcoming_issues, many=True
            ).data,
            "overdue_issues": DashBoardIssueSerializer(overdue_issues, many=True).data,
            "completed_issues": DashBoardIssueSerializer(
                completed_issues, many=True
            ).data,
            "upcoming_issues_count": issue_counts["upcoming_issues_count"],
            "overdue_issues_count": issue_counts["overdue_issues_count"],
            "completed_issues_count": issue_counts["completed_issues_count"],
        },
        status=status.HTTP_200_OK,
    )


def dashboard_issues_by_state_groups(request, slug):
    filters = issue_filters(request.query_params, "GET")
    state_order = ["backlog", "unstarted", "started", "completed", "cancelled"]
    issues_by_state_groups = (
        Issue.issue_objects.filter(
            workspace__slug=slug,
            created_by=request.user,
        ).filter(**filters)
        .values("state__group")
        .annotate(count=Count("id"))
    )

    # default state 
    all_groups = {state: 0 for state in state_order}

    # Update counts for existing groups
    for entry in issues_by_state_groups:
        all_groups[entry['state__group']] = entry['count']

    # Prepare output including all groups with their counts
    output_data = [{'state': group, 'count': count} for group, count in all_groups.items()]

    return Response(output_data, status=status.HTTP_200_OK)


def dashboard_issues_by_priority(request, slug):
    filters = issue_filters(request.query_params, "GET")
    priority_order = ["urgent", "high", "medium", "low", "none"]

    issues_by_priority = (
        Issue.issue_objects.filter(
            workspace__slug=slug,
            created_by=request.user,
        ).filter(**filters)
        .values("priority")
        .annotate(count=Count("id"))
    )

    # default priority 
    all_groups = {priority: 0 for priority in priority_order}

    # Update counts for existing groups
    for entry in issues_by_priority:
        all_groups[entry['priority']] = entry['count']

    # Prepare output including all groups with their counts
    output_data = [{'priority': group, 'count': count} for group, count in all_groups.items()]

    return Response(output_data, status=status.HTTP_200_OK)


def dashboard_recent_activity(request, slug):
    queryset = (
        IssueActivity.objects.filter(
            ~Q(field__in=["comment", "vote", "reaction", "draft"]),
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            actor=request.user,
        )
        .select_related("actor", "workspace", "issue", "project")
        .order_by("updated_at")[:8]
    )

    return Response(
        IssueActivitySerializer(queryset, many=True).data, status=status.HTTP_200_OK
    )


def dashboard_recent_projects(request, slug):
    project_ids = (
        IssueActivity.objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            actor=request.user,
        )
        .values("project_id")
        .annotate(latest_activity=Max("updated_at"))
        .order_by("-latest_activity")[:4]
    )

    project_ids = [activity["project_id"] for activity in project_ids]

    # TODO fetch the projects if the activities are not performed by the user but the part of the project and the projects length in less than 4

    return Response(
        project_ids,
        status=status.HTTP_200_OK,
    )


def dashboard_recent_collaborators(request, slug):
    # Fetch all project IDs where the user belongs to
    user_projects = Project.objects.filter(
        project_projectmember__member=request.user,
        workspace__slug=slug,
    ).values_list("id", flat=True)

    # Fetch all users who have performed an activity in the projects where the user exists
    users_with_activities = (
        IssueActivity.objects.filter(
            workspace__slug=slug,
            project_id__in=user_projects,
        )
        .values("actor")
        .exclude(actor=request.user)
        .annotate(num_activities=Count("actor"))
        .order_by("-num_activities")
    )[:7]

    # Get the count of active issues for each user in users_with_activities
    users_with_active_issues = []
    for user_activity in users_with_activities:
        user_id = user_activity["actor"]
        active_issue_count = Issue.objects.filter(
            assignees__in=[user_id],
            state__group__in=["backlog", "unstarted", "started"],
        ).count()
        users_with_active_issues.append(
            {"user_id": user_id, "active_issue_count": active_issue_count}
        )

    # Insert the logged-in user's ID and their active issue count at the beginning
    active_issue_count = Issue.objects.filter(
        assignees__in=[request.user],
        state__group__in=["unstarted", "started"],
    ).count()
    users_with_active_issues.insert(
        0, {"user_id": request.user.id, "active_issue_count": active_issue_count}
    )

    return Response(users_with_active_issues, status=status.HTTP_200_OK)


class DashboardEndpoint(BaseAPIView):
    def create(self, request, slug):
        serializer = DashboardSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, slug, pk):
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
                    type=dashboard_type, owned_by=request.user, is_default=True
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

                    DashboardWidget.objects.bulk_create(
                        updated_dashboard_widgets, batch_size=100
                    )

                widgets = (
                    Widget.objects.annotate(
                        is_visible=Exists(
                            DashboardWidget.objects.filter(
                                widget_id=OuterRef("pk"),
                                dashboard_id=dashboard.id,
                                is_visible=True,
                            )
                        )
                    )
                    .annotate(
                        dashboard_filters=Subquery(
                            DashboardWidget.objects.filter(
                                widget_id=OuterRef("pk"),
                                dashboard_id=dashboard.id,
                                filters__isnull=False,
                            ).values("filters")[:1]
                        )
                    )
                    .annotate(
                        widget_filters=Case(
                            When(
                                dashboard_filters__isnull=False,
                                then=F("dashboard_filters"),
                            ),
                            default=F("filters"),
                            output_field=JSONField(),
                        )
                    )
                )
                return Response(
                    {
                        "dashboard": DashboardSerializer(dashboard).data,
                        "widgets": WidgetSerializer(widgets, many=True).data,
                    },
                    status=status.HTTP_200_OK,
                )
            return Response(
                {"error": "Please specify a valid dashboard type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        widget_key = request.GET.get("widget_key", "overview_stats")

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

        func = WIDGETS_MAPPER.get(widget_key)
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
