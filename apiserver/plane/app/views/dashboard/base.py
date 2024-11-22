# Django imports
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models import (
    Case,
    CharField,
    Count,
    Exists,
    F,
    Func,
    IntegerField,
    JSONField,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    UUIDField,
    Value,
    When,
)
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import status

# Third Party imports
from rest_framework.response import Response

from plane.app.serializers import (
    DashboardSerializer,
    IssueActivitySerializer,
    IssueSerializer,
    WidgetSerializer,
)
from plane.db.models import (
    Dashboard,
    DashboardWidget,
    Issue,
    IssueActivity,
    FileAsset,
    IssueLink,
    IssueRelation,
    Project,
    Widget,
    WorkspaceMember,
    CycleIssue,
)
from plane.utils.issue_filters import issue_filters

# Module imports
from .. import BaseAPIView


def dashboard_overview_stats(self, request, slug):
    assigned_issues = (
        Issue.issue_objects.filter(
            project__project_projectmember__is_active=True,
            project__project_projectmember__member=request.user,
            workspace__slug=slug,
            assignees__in=[request.user],
        )
        .filter(
            Q(
                project__project_projectmember__role=5,
                project__guest_view_all_features=True,
            )
            | Q(
                project__project_projectmember__role=5,
                project__guest_view_all_features=False,
                created_by=self.request.user,
            )
            |
            # For other roles (role < 5), show all issues
            Q(project__project_projectmember__role__gt=5),
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
        )
        .count()
    )

    pending_issues_count = (
        Issue.issue_objects.filter(
            ~Q(state__group__in=["completed", "cancelled"]),
            target_date__lt=timezone.now().date(),
            project__project_projectmember__is_active=True,
            project__project_projectmember__member=request.user,
            workspace__slug=slug,
            assignees__in=[request.user],
        )
        .filter(
            Q(
                project__project_projectmember__role=5,
                project__guest_view_all_features=True,
            )
            | Q(
                project__project_projectmember__role=5,
                project__guest_view_all_features=False,
                created_by=self.request.user,
            )
            |
            # For other roles (role < 5), show all issues
            Q(project__project_projectmember__role__gt=5),
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
        )
        .count()
    )

    created_issues_count = (
        Issue.issue_objects.filter(
            workspace__slug=slug,
            project__project_projectmember__is_active=True,
            project__project_projectmember__member=request.user,
            created_by_id=request.user.id,
        )
        .filter(
            Q(
                project__project_projectmember__role=5,
                project__guest_view_all_features=True,
            )
            | Q(
                project__project_projectmember__role=5,
                project__guest_view_all_features=False,
                created_by=self.request.user,
            )
            |
            # For other roles (role < 5), show all issues
            Q(project__project_projectmember__role__gt=5),
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
        )
        .count()
    )

    completed_issues_count = (
        Issue.issue_objects.filter(
            workspace__slug=slug,
            project__project_projectmember__is_active=True,
            project__project_projectmember__member=request.user,
            assignees__in=[request.user],
            state__group="completed",
        )
        .filter(
            Q(
                project__project_projectmember__role=5,
                project__guest_view_all_features=True,
            )
            | Q(
                project__project_projectmember__role=5,
                project__guest_view_all_features=False,
                created_by=self.request.user,
            )
            |
            # For other roles (role < 5), show all issues
            Q(project__project_projectmember__role__gt=5),
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
        )
        .count()
    )

    return Response(
        {
            "assigned_issues_count": assigned_issues,
            "pending_issues_count": pending_issues_count,
            "completed_issues_count": completed_issues_count,
            "created_issues_count": created_issues_count,
        },
        status=status.HTTP_200_OK,
    )


def dashboard_assigned_issues(self, request, slug):
    filters = issue_filters(request.query_params, "GET")
    issue_type = request.GET.get("issue_type", None)

    # get all the assigned issues
    assigned_issues = (
        Issue.issue_objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
            assignees__in=[request.user],
        )
        .filter(**filters)
        .select_related("workspace", "project", "state", "parent")
        .prefetch_related("assignees", "labels", "issue_module__module")
        .prefetch_related(
            Prefetch(
                "issue_relation",
                queryset=IssueRelation.objects.select_related(
                    "related_issue"
                ).select_related("issue"),
            )
        )
        .annotate(
            cycle_id=Subquery(
                CycleIssue.objects.filter(
                    issue=OuterRef("id"), deleted_at__isnull=True
                ).values("cycle_id")[:1]
            )
        )
        .annotate(
            link_count=IssueLink.objects.filter(issue=OuterRef("id"))
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )
        .annotate(
            attachment_count=FileAsset.objects.filter(
                issue_id=OuterRef("id"),
                entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            )
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )
        .annotate(
            sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )
        .annotate(
            label_ids=Coalesce(
                ArrayAgg(
                    "labels__id",
                    distinct=True,
                    filter=Q(
                        ~Q(labels__id__isnull=True)
                        & Q(label_issue__deleted_at__isnull=True)
                    ),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            assignee_ids=Coalesce(
                ArrayAgg(
                    "assignees__id",
                    distinct=True,
                    filter=Q(
                        ~Q(assignees__id__isnull=True)
                        & Q(assignees__member_project__is_active=True)
                        & Q(issue_assignee__deleted_at__isnull=True)
                    ),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            module_ids=Coalesce(
                ArrayAgg(
                    "issue_module__module_id",
                    distinct=True,
                    filter=Q(
                        ~Q(issue_module__module_id__isnull=True)
                        & Q(issue_module__module__archived_at__isnull=True)
                        & Q(issue_module__deleted_at__isnull=True)
                    ),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
        )
    )

    if WorkspaceMember.objects.filter(
        workspace__slug=slug, member=request.user, role=5, is_active=True
    ).exists():
        assigned_issues = assigned_issues.filter(created_by=request.user)

    # Priority Ordering
    priority_order = ["urgent", "high", "medium", "low", "none"]
    assigned_issues = assigned_issues.annotate(
        priority_order=Case(
            *[When(priority=p, then=Value(i)) for i, p in enumerate(priority_order)],
            output_field=CharField(),
        )
    ).order_by("priority_order")

    if issue_type == "pending":
        pending_issues_count = assigned_issues.filter(
            state__group__in=["backlog", "started", "unstarted"]
        ).count()
        pending_issues = assigned_issues.filter(
            state__group__in=["backlog", "started", "unstarted"]
        )[:5]
        return Response(
            {
                "issues": IssueSerializer(
                    pending_issues, many=True, expand=self.expand
                ).data,
                "count": pending_issues_count,
            },
            status=status.HTTP_200_OK,
        )

    if issue_type == "completed":
        completed_issues_count = assigned_issues.filter(
            state__group__in=["completed"]
        ).count()
        completed_issues = assigned_issues.filter(state__group__in=["completed"])[:5]
        return Response(
            {
                "issues": IssueSerializer(
                    completed_issues, many=True, expand=self.expand
                ).data,
                "count": completed_issues_count,
            },
            status=status.HTTP_200_OK,
        )

    if issue_type == "overdue":
        overdue_issues_count = assigned_issues.filter(
            state__group__in=["backlog", "unstarted", "started"],
            target_date__lt=timezone.now(),
        ).count()
        overdue_issues = assigned_issues.filter(
            state__group__in=["backlog", "unstarted", "started"],
            target_date__lt=timezone.now(),
        )[:5]
        return Response(
            {
                "issues": IssueSerializer(
                    overdue_issues, many=True, expand=self.expand
                ).data,
                "count": overdue_issues_count,
            },
            status=status.HTTP_200_OK,
        )

    if issue_type == "upcoming":
        upcoming_issues_count = assigned_issues.filter(
            state__group__in=["backlog", "unstarted", "started"],
            target_date__gte=timezone.now(),
        ).count()
        upcoming_issues = assigned_issues.filter(
            state__group__in=["backlog", "unstarted", "started"],
            target_date__gte=timezone.now(),
        )[:5]
        return Response(
            {
                "issues": IssueSerializer(
                    upcoming_issues, many=True, expand=self.expand
                ).data,
                "count": upcoming_issues_count,
            },
            status=status.HTTP_200_OK,
        )

    return Response(
        {"error": "Please specify a valid issue type"},
        status=status.HTTP_400_BAD_REQUEST,
    )


def dashboard_created_issues(self, request, slug):
    filters = issue_filters(request.query_params, "GET")
    issue_type = request.GET.get("issue_type", None)

    # get all the assigned issues
    created_issues = (
        Issue.issue_objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
            created_by=request.user,
        )
        .filter(**filters)
        .select_related("workspace", "project", "state", "parent")
        .prefetch_related("assignees", "labels", "issue_module__module")
        .annotate(
            cycle_id=Subquery(
                CycleIssue.objects.filter(
                    issue=OuterRef("id"), deleted_at__isnull=True
                ).values("cycle_id")[:1]
            )
        )
        .annotate(
            link_count=IssueLink.objects.filter(issue=OuterRef("id"))
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )
        .annotate(
            attachment_count=FileAsset.objects.filter(
                issue_id=OuterRef("id"),
                entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            )
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )
        .annotate(
            sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
            .order_by()
            .annotate(count=Func(F("id"), function="Count"))
            .values("count")
        )
        .annotate(
            label_ids=Coalesce(
                ArrayAgg(
                    "labels__id",
                    distinct=True,
                    filter=Q(
                        ~Q(labels__id__isnull=True)
                        & Q(label_issue__deleted_at__isnull=True)
                    ),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            assignee_ids=Coalesce(
                ArrayAgg(
                    "assignees__id",
                    distinct=True,
                    filter=Q(
                        ~Q(assignees__id__isnull=True)
                        & Q(assignees__member_project__is_active=True)
                        & Q(issue_assignee__deleted_at__isnull=True)
                    ),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
            module_ids=Coalesce(
                ArrayAgg(
                    "issue_module__module_id",
                    distinct=True,
                    filter=Q(
                        ~Q(issue_module__module_id__isnull=True)
                        & Q(issue_module__module__archived_at__isnull=True)
                        & Q(issue_module__deleted_at__isnull=True)
                    ),
                ),
                Value([], output_field=ArrayField(UUIDField())),
            ),
        )
        .order_by("created_at")
    )

    # Priority Ordering
    priority_order = ["urgent", "high", "medium", "low", "none"]
    created_issues = created_issues.annotate(
        priority_order=Case(
            *[When(priority=p, then=Value(i)) for i, p in enumerate(priority_order)],
            output_field=CharField(),
        )
    ).order_by("priority_order")

    if issue_type == "pending":
        pending_issues_count = created_issues.filter(
            state__group__in=["backlog", "started", "unstarted"]
        ).count()
        pending_issues = created_issues.filter(
            state__group__in=["backlog", "started", "unstarted"]
        )[:5]
        return Response(
            {
                "issues": IssueSerializer(
                    pending_issues, many=True, expand=self.expand
                ).data,
                "count": pending_issues_count,
            },
            status=status.HTTP_200_OK,
        )

    if issue_type == "completed":
        completed_issues_count = created_issues.filter(
            state__group__in=["completed"]
        ).count()
        completed_issues = created_issues.filter(state__group__in=["completed"])[:5]
        return Response(
            {
                "issues": IssueSerializer(completed_issues, many=True).data,
                "count": completed_issues_count,
            },
            status=status.HTTP_200_OK,
        )

    if issue_type == "overdue":
        overdue_issues_count = created_issues.filter(
            state__group__in=["backlog", "unstarted", "started"],
            target_date__lt=timezone.now(),
        ).count()
        overdue_issues = created_issues.filter(
            state__group__in=["backlog", "unstarted", "started"],
            target_date__lt=timezone.now(),
        )[:5]
        return Response(
            {
                "issues": IssueSerializer(overdue_issues, many=True).data,
                "count": overdue_issues_count,
            },
            status=status.HTTP_200_OK,
        )

    if issue_type == "upcoming":
        upcoming_issues_count = created_issues.filter(
            state__group__in=["backlog", "unstarted", "started"],
            target_date__gte=timezone.now(),
        ).count()
        upcoming_issues = created_issues.filter(
            state__group__in=["backlog", "unstarted", "started"],
            target_date__gte=timezone.now(),
        )[:5]
        return Response(
            {
                "issues": IssueSerializer(upcoming_issues, many=True).data,
                "count": upcoming_issues_count,
            },
            status=status.HTTP_200_OK,
        )

    return Response(
        {"error": "Please specify a valid issue type"},
        status=status.HTTP_400_BAD_REQUEST,
    )


def dashboard_issues_by_state_groups(self, request, slug):
    filters = issue_filters(request.query_params, "GET")
    state_order = ["backlog", "unstarted", "started", "completed", "cancelled"]
    extra_filters = {}

    if WorkspaceMember.objects.filter(
        workspace__slug=slug, member=request.user, role=5, is_active=True
    ).exists():
        extra_filters = {"created_by": request.user}

    issues_by_state_groups = (
        Issue.issue_objects.filter(
            workspace__slug=slug,
            project__project_projectmember__is_active=True,
            project__project_projectmember__member=request.user,
            assignees__in=[request.user],
        )
        .filter(**filters, **extra_filters)
        .values("state__group")
        .annotate(count=Count("id"))
    )

    # default state
    all_groups = {state: 0 for state in state_order}

    # Update counts for existing groups
    for entry in issues_by_state_groups:
        all_groups[entry["state__group"]] = entry["count"]

    # Prepare output including all groups with their counts
    output_data = [
        {"state": group, "count": count} for group, count in all_groups.items()
    ]

    return Response(output_data, status=status.HTTP_200_OK)


def dashboard_issues_by_priority(self, request, slug):
    filters = issue_filters(request.query_params, "GET")
    priority_order = ["urgent", "high", "medium", "low", "none"]
    extra_filters = {}

    if WorkspaceMember.objects.filter(
        workspace__slug=slug, member=request.user, role=5, is_active=True
    ).exists():
        extra_filters = {"created_by": request.user}

    issues_by_priority = (
        Issue.issue_objects.filter(
            workspace__slug=slug,
            project__project_projectmember__is_active=True,
            project__project_projectmember__member=request.user,
            assignees__in=[request.user],
        )
        .filter(**filters, **extra_filters)
        .values("priority")
        .annotate(count=Count("id"))
    )

    # default priority
    all_groups = {priority: 0 for priority in priority_order}

    # Update counts for existing groups
    for entry in issues_by_priority:
        all_groups[entry["priority"]] = entry["count"]

    # Prepare output including all groups with their counts
    output_data = [
        {"priority": group, "count": count} for group, count in all_groups.items()
    ]

    return Response(output_data, status=status.HTTP_200_OK)


def dashboard_recent_activity(self, request, slug):
    queryset = IssueActivity.objects.filter(
        ~Q(field__in=["comment", "vote", "reaction", "draft"]),
        workspace__slug=slug,
        project__project_projectmember__member=request.user,
        project__project_projectmember__is_active=True,
        project__archived_at__isnull=True,
        actor=request.user,
    ).select_related("actor", "workspace", "issue", "project")[:8]

    return Response(
        IssueActivitySerializer(queryset, many=True).data, status=status.HTTP_200_OK
    )


def dashboard_recent_projects(self, request, slug):
    project_ids = (
        IssueActivity.objects.filter(
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
            actor=request.user,
        )
        .values_list("project_id", flat=True)
        .distinct()
    )

    # Extract project IDs from the recent projects
    unique_project_ids = set(project_id for project_id in project_ids)

    # Fetch additional projects only if needed
    if len(unique_project_ids) < 4:
        additional_projects = Project.objects.filter(
            project_projectmember__member=request.user,
            project_projectmember__is_active=True,
            archived_at__isnull=True,
            workspace__slug=slug,
        ).exclude(id__in=unique_project_ids)

        # Append additional project IDs to the existing list
        unique_project_ids.update(additional_projects.values_list("id", flat=True))

    return Response(list(unique_project_ids)[:4], status=status.HTTP_200_OK)


def dashboard_recent_collaborators(self, request, slug):
    project_members_with_activities = (
        WorkspaceMember.objects.filter(workspace__slug=slug, is_active=True)
        .annotate(
            active_issue_count=Count(
                Case(
                    When(
                        member__issue_assignee__issue__state__group__in=[
                            "unstarted",
                            "started",
                        ],
                        member__issue_assignee__issue__workspace__slug=slug,
                        member__issue_assignee__issue__project__project_projectmember__member=request.user,
                        member__issue_assignee__issue__project__project_projectmember__is_active=True,
                        then=F("member__issue_assignee__issue__id"),
                    ),
                    distinct=True,
                    output_field=IntegerField(),
                ),
                distinct=True,
            ),
            user_id=F("member_id"),
        )
        .values("user_id", "active_issue_count")
        .order_by("-active_issue_count")
        .distinct()
    )
    return Response((project_members_with_activities), status=status.HTTP_200_OK)


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
                    type_identifier=dashboard_type,
                    owned_by=request.user,
                    is_default=True,
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
                        widget = Widget.objects.filter(key=widget_key).values_list(
                            "id", flat=True
                        )
                        if widget:
                            updated_dashboard_widgets.append(
                                DashboardWidget(
                                    widget_id=widget, dashboard_id=dashboard.id
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
                            )
                            .exclude(filters={})
                            .values("filters")[:1]
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
            response = func(self, request=request, slug=slug)
            if isinstance(response, Response):
                return response

        return Response(
            {"error": "Please specify a valid widget key"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class WidgetsEndpoint(BaseAPIView):
    def patch(self, request, dashboard_id, widget_id):
        dashboard_widget = DashboardWidget.objects.filter(
            widget_id=widget_id, dashboard_id=dashboard_id
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
