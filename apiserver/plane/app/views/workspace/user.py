# Python imports
from datetime import date
from dateutil.relativedelta import relativedelta

# Django imports
from django.utils import timezone
from django.db.models import (
    OuterRef,
    Func,
    F,
    Q,
    Count,
    Case,
    Value,
    CharField,
    When,
    Max,
    IntegerField,
    UUIDField,
)
from django.db.models.functions import ExtractWeek, Cast
from django.db.models.fields import DateField
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce

# Third party modules
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers import (
    WorkSpaceSerializer,
    ProjectMemberSerializer,
    IssueActivitySerializer,
    IssueSerializer,
    WorkspaceUserPropertiesSerializer,
)
from plane.app.views.base import BaseAPIView
from plane.db.models import (
    User,
    Workspace,
    ProjectMember,
    IssueActivity,
    Issue,
    IssueLink,
    IssueAttachment,
    IssueSubscriber,
    Project,
    WorkspaceMember,
    CycleIssue,
    WorkspaceUserProperties,
)
from plane.app.permissions import (
    WorkspaceEntityPermission,
    WorkspaceViewerPermission,
)
from plane.utils.issue_filters import issue_filters


class UserLastProjectWithWorkspaceEndpoint(BaseAPIView):
    def get(self, request):
        user = User.objects.get(pk=request.user.id)

        last_workspace_id = user.last_workspace_id

        if last_workspace_id is None:
            return Response(
                {
                    "project_details": [],
                    "workspace_details": {},
                },
                status=status.HTTP_200_OK,
            )

        workspace = Workspace.objects.get(pk=last_workspace_id)
        workspace_serializer = WorkSpaceSerializer(workspace)

        project_member = ProjectMember.objects.filter(
            workspace_id=last_workspace_id, member=request.user
        ).select_related("workspace", "project", "member", "workspace__owner")

        project_member_serializer = ProjectMemberSerializer(
            project_member, many=True
        )

        return Response(
            {
                "workspace_details": workspace_serializer.data,
                "project_details": project_member_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceUserProfileIssuesEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceViewerPermission,
    ]

    def get(self, request, slug, user_id):
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]
        filters = issue_filters(request.query_params, "GET")

        # Custom ordering for priority and state
        priority_order = ["urgent", "high", "medium", "low", "none"]
        state_order = [
            "backlog",
            "unstarted",
            "started",
            "completed",
            "cancelled",
        ]

        order_by_param = request.GET.get("order_by", "-created_at")
        issue_queryset = (
            Issue.issue_objects.filter(
                Q(assignees__in=[user_id])
                | Q(created_by_id=user_id)
                | Q(issue_subscribers__subscriber_id=user_id),
                workspace__slug=slug,
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(**filters)
            .select_related("workspace", "project", "state", "parent")
            .prefetch_related("assignees", "labels", "issue_module__module")
            .annotate(cycle_id=F("issue_cycle__cycle_id"))
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=IssueAttachment.objects.filter(
                    issue=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                label_ids=Coalesce(
                    ArrayAgg(
                        "labels__id",
                        distinct=True,
                        filter=~Q(labels__id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                assignee_ids=Coalesce(
                    ArrayAgg(
                        "assignees__id",
                        distinct=True,
                        filter=~Q(assignees__id__isnull=True)
                        & Q(assignees__member_project__is_active=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
                module_ids=Coalesce(
                    ArrayAgg(
                        "issue_module__module_id",
                        distinct=True,
                        filter=~Q(issue_module__module_id__isnull=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .order_by("created_at")
        ).distinct()

        # Priority Ordering
        if order_by_param == "priority" or order_by_param == "-priority":
            priority_order = (
                priority_order
                if order_by_param == "priority"
                else priority_order[::-1]
            )
            issue_queryset = issue_queryset.annotate(
                priority_order=Case(
                    *[
                        When(priority=p, then=Value(i))
                        for i, p in enumerate(priority_order)
                    ],
                    output_field=CharField(),
                )
            ).order_by("priority_order")

        # State Ordering
        elif order_by_param in [
            "state__name",
            "state__group",
            "-state__name",
            "-state__group",
        ]:
            state_order = (
                state_order
                if order_by_param in ["state__name", "state__group"]
                else state_order[::-1]
            )
            issue_queryset = issue_queryset.annotate(
                state_order=Case(
                    *[
                        When(state__group=state_group, then=Value(i))
                        for i, state_group in enumerate(state_order)
                    ],
                    default=Value(len(state_order)),
                    output_field=CharField(),
                )
            ).order_by("state_order")
        # assignee and label ordering
        elif order_by_param in [
            "labels__name",
            "-labels__name",
            "assignees__first_name",
            "-assignees__first_name",
        ]:
            issue_queryset = issue_queryset.annotate(
                max_values=Max(
                    order_by_param[1::]
                    if order_by_param.startswith("-")
                    else order_by_param
                )
            ).order_by(
                "-max_values"
                if order_by_param.startswith("-")
                else "max_values"
            )
        else:
            issue_queryset = issue_queryset.order_by(order_by_param)

        issues = IssueSerializer(
            issue_queryset, many=True, fields=fields if fields else None
        ).data
        return Response(issues, status=status.HTTP_200_OK)


class WorkspaceUserPropertiesEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceViewerPermission,
    ]

    def patch(self, request, slug):
        workspace_properties = WorkspaceUserProperties.objects.get(
            user=request.user,
            workspace__slug=slug,
        )

        workspace_properties.filters = request.data.get(
            "filters", workspace_properties.filters
        )
        workspace_properties.display_filters = request.data.get(
            "display_filters", workspace_properties.display_filters
        )
        workspace_properties.display_properties = request.data.get(
            "display_properties", workspace_properties.display_properties
        )
        workspace_properties.save()

        serializer = WorkspaceUserPropertiesSerializer(workspace_properties)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request, slug):
        (
            workspace_properties,
            _,
        ) = WorkspaceUserProperties.objects.get_or_create(
            user=request.user, workspace__slug=slug
        )
        serializer = WorkspaceUserPropertiesSerializer(workspace_properties)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspaceUserProfileEndpoint(BaseAPIView):
    def get(self, request, slug, user_id):
        user_data = User.objects.get(pk=user_id)

        requesting_workspace_member = WorkspaceMember.objects.get(
            workspace__slug=slug,
            member=request.user,
            is_active=True,
        )
        projects = []
        if requesting_workspace_member.role >= 10:
            projects = (
                Project.objects.filter(
                    workspace__slug=slug,
                    project_projectmember__member=request.user,
                    project_projectmember__is_active=True,
                    archived_at__isnull=True,
                )
                .annotate(
                    created_issues=Count(
                        "project_issue",
                        filter=Q(
                            project_issue__created_by_id=user_id,
                            project_issue__archived_at__isnull=True,
                            project_issue__is_draft=False,
                        ),
                    )
                )
                .annotate(
                    assigned_issues=Count(
                        "project_issue",
                        filter=Q(
                            project_issue__assignees__in=[user_id],
                            project_issue__archived_at__isnull=True,
                            project_issue__is_draft=False,
                        ),
                    )
                )
                .annotate(
                    completed_issues=Count(
                        "project_issue",
                        filter=Q(
                            project_issue__completed_at__isnull=False,
                            project_issue__assignees__in=[user_id],
                            project_issue__archived_at__isnull=True,
                            project_issue__is_draft=False,
                        ),
                    )
                )
                .annotate(
                    pending_issues=Count(
                        "project_issue",
                        filter=Q(
                            project_issue__state__group__in=[
                                "backlog",
                                "unstarted",
                                "started",
                            ],
                            project_issue__assignees__in=[user_id],
                            project_issue__archived_at__isnull=True,
                            project_issue__is_draft=False,
                        ),
                    )
                )
                .values(
                    "id",
                    "logo_props",
                    "created_issues",
                    "assigned_issues",
                    "completed_issues",
                    "pending_issues",
                )
            )

        return Response(
            {
                "project_data": projects,
                "user_data": {
                    "email": user_data.email,
                    "first_name": user_data.first_name,
                    "last_name": user_data.last_name,
                    "avatar": user_data.avatar,
                    "cover_image": user_data.cover_image,
                    "date_joined": user_data.date_joined,
                    "user_timezone": user_data.user_timezone,
                    "display_name": user_data.display_name,
                },
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceUserActivityEndpoint(BaseAPIView):
    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def get(self, request, slug, user_id):
        projects = request.query_params.getlist("project", [])

        queryset = IssueActivity.objects.filter(
            ~Q(field__in=["comment", "vote", "reaction", "draft"]),
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
            actor=user_id,
        ).select_related("actor", "workspace", "issue", "project")

        if projects:
            queryset = queryset.filter(project__in=projects)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda issue_activities: IssueActivitySerializer(
                issue_activities, many=True
            ).data,
        )


class WorkspaceUserProfileStatsEndpoint(BaseAPIView):
    def get(self, request, slug, user_id):
        filters = issue_filters(request.query_params, "GET")

        state_distribution = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                assignees__in=[user_id],
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(**filters)
            .annotate(state_group=F("state__group"))
            .values("state_group")
            .annotate(state_count=Count("state_group"))
            .order_by("state_group")
        )

        priority_order = ["urgent", "high", "medium", "low", "none"]

        priority_distribution = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                assignees__in=[user_id],
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(**filters)
            .values("priority")
            .annotate(priority_count=Count("priority"))
            .filter(priority_count__gte=1)
            .annotate(
                priority_order=Case(
                    *[
                        When(priority=p, then=Value(i))
                        for i, p in enumerate(priority_order)
                    ],
                    default=Value(len(priority_order)),
                    output_field=IntegerField(),
                )
            )
            .order_by("priority_order")
        )

        created_issues = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
                created_by_id=user_id,
            )
            .filter(**filters)
            .count()
        )

        assigned_issues_count = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                assignees__in=[user_id],
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(**filters)
            .count()
        )

        pending_issues_count = (
            Issue.issue_objects.filter(
                ~Q(state__group__in=["completed", "cancelled"]),
                workspace__slug=slug,
                assignees__in=[user_id],
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(**filters)
            .count()
        )

        completed_issues_count = (
            Issue.issue_objects.filter(
                workspace__slug=slug,
                assignees__in=[user_id],
                state__group="completed",
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(**filters)
            .count()
        )

        subscribed_issues_count = (
            IssueSubscriber.objects.filter(
                workspace__slug=slug,
                subscriber_id=user_id,
                project__project_projectmember__member=request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .filter(**filters)
            .count()
        )

        upcoming_cycles = CycleIssue.objects.filter(
            workspace__slug=slug,
            cycle__start_date__gt=timezone.now().date(),
            issue__assignees__in=[
                user_id,
            ],
        ).values("cycle__name", "cycle__id", "cycle__project_id")

        present_cycle = CycleIssue.objects.filter(
            workspace__slug=slug,
            cycle__start_date__lt=timezone.now().date(),
            cycle__end_date__gt=timezone.now().date(),
            issue__assignees__in=[
                user_id,
            ],
        ).values("cycle__name", "cycle__id", "cycle__project_id")

        return Response(
            {
                "state_distribution": state_distribution,
                "priority_distribution": priority_distribution,
                "created_issues": created_issues,
                "assigned_issues": assigned_issues_count,
                "completed_issues": completed_issues_count,
                "pending_issues": pending_issues_count,
                "subscribed_issues": subscribed_issues_count,
                "present_cycles": present_cycle,
                "upcoming_cycles": upcoming_cycles,
            }
        )


class UserActivityGraphEndpoint(BaseAPIView):
    def get(self, request, slug):
        issue_activities = (
            IssueActivity.objects.filter(
                actor=request.user,
                workspace__slug=slug,
                created_at__date__gte=date.today() + relativedelta(months=-6),
            )
            .annotate(created_date=Cast("created_at", DateField()))
            .values("created_date")
            .annotate(activity_count=Count("created_date"))
            .order_by("created_date")
        )

        return Response(issue_activities, status=status.HTTP_200_OK)


class UserIssueCompletedGraphEndpoint(BaseAPIView):
    def get(self, request, slug):
        month = request.GET.get("month", 1)

        issues = (
            Issue.issue_objects.filter(
                assignees__in=[request.user],
                workspace__slug=slug,
                completed_at__month=month,
                completed_at__isnull=False,
            )
            .annotate(completed_week=ExtractWeek("completed_at"))
            .annotate(week=F("completed_week") % 4)
            .values("week")
            .annotate(completed_count=Count("completed_week"))
            .order_by("week")
        )

        return Response(issues, status=status.HTTP_200_OK)
