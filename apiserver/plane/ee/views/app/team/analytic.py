# Python imports
from datetime import timedelta

# Django imports
from django.db.models import Case, Count, IntegerField, Q, When, Value, UUIDField, F
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Cycle, Issue, IssueView, Page, IssueRelation, IssueAssignee
from plane.ee.models import (
    TeamSpacePage,
    TeamSpaceProject,
    TeamSpaceView,
    TeamSpaceMember,
)
from plane.ee.permissions import TeamSpacePermission, WorkspaceUserPermission
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.utils.issue_filters import issue_filters
from .base import TeamBaseEndpoint


class TeamSpaceEntitiesEndpoint(TeamBaseEndpoint):
    permission_classes = [WorkspaceUserPermission, TeamSpacePermission]

    @check_feature_flag(FeatureFlag.TEAMS)
    def get(self, request, slug, team_space_id):
        # Get team entities count
        team_page_count = TeamSpacePage.objects.filter(
            team_space_id=team_space_id, page__access=0
        ).count()
        team_view_count = TeamSpaceView.objects.filter(
            team_space_id=team_space_id, view__access=1
        ).count()

        # Get linked entities count
        project_ids = TeamSpaceProject.objects.filter(
            team_space_id=team_space_id
        ).values_list("project_id", flat=True)

        issue_count = Issue.objects.filter(
            project_id__in=project_ids, workspace__slug=slug
        ).count()

        cycles_count = Cycle.objects.filter(
            project_id__in=project_ids, workspace__slug=slug
        ).count()

        pages_count = Page.objects.filter(
            projects__in=project_ids, workspace__slug=slug, access=0
        ).count()

        views_count = IssueView.objects.filter(
            project_id__in=project_ids, workspace__slug=slug, access=1
        ).count()

        return Response(
            {
                "linked_entities": {
                    "projects": project_ids.count(),
                    "issues": issue_count,
                    "cycles": cycles_count,
                    "pages": pages_count,
                    "views": views_count,
                    "total": project_ids.count()
                    + issue_count
                    + cycles_count
                    + pages_count
                    + views_count,
                },
                "team_entities": {
                    "pages": team_page_count,
                    "views": team_view_count,
                    "total": team_page_count + team_view_count,
                },
            },
            status=status.HTTP_200_OK,
        )


class TeamSpaceWorkLoadChartEndpoint(TeamBaseEndpoint):
    def get_date_range(self):
        today = timezone.now().date()
        weekday = today.weekday()

        if weekday >= 5:
            start_of_week = today - timedelta(days=weekday + 7)
            end_of_week = start_of_week + timedelta(days=4)
        else:
            start_of_week = today - timedelta(days=weekday)
            end_of_week = start_of_week + timedelta(days=4)

        return start_of_week, end_of_week

    def generate_date_range_data(self, start_date, end_date, existing_data, key):
        date_range = {}
        current_date = start_date

        while current_date <= end_date:
            date_range[current_date] = {
                key: current_date,
                "overdue": 0,
                "pending": 0,
                "completed": 0,
            }
            current_date += timedelta(days=1)

        for item in existing_data:
            if item[key]:
                date = item[key]
                if date in date_range:
                    date_range[date].update(
                        {
                            "overdue": item["overdue"],
                            "pending": item["pending"],
                            "completed": item["completed"],
                        }
                    )

        return sorted([v for v in date_range.values()], key=lambda x: x[key])

    @check_feature_flag(FeatureFlag.TEAMS)
    def get(self, request, slug, team_space_id):
        project_ids = TeamSpaceProject.objects.filter(
            team_space_id=team_space_id
        ).values_list("project_id", flat=True)

        issues = Issue.issue_objects.filter(
            project_id__in=project_ids, workspace__slug=slug
        )

        x_axis = request.GET.get("x_axis", "target_date")
        y_axis = request.GET.get("y_axis", "issues")

        X_AXIS_MAP = {
            "target_date": "target_date",
            "priority": "priority",
            "state__group": "state__group",
            "start_date": "start_date",
        }

        if x_axis not in X_AXIS_MAP:
            return Response(
                {"error": "Invalid x-axis"}, status=status.HTTP_400_BAD_REQUEST
            )

        start_of_week, end_of_week = self.get_date_range()

        if x_axis == "target_date":
            issues = issues.filter(
                target_date__gte=start_of_week, target_date__lte=end_of_week
            )
        if x_axis == "start_date":
            issues = issues.filter(
                start_date__gte=start_of_week, start_date__lte=end_of_week
            )

        issues_data = issues.values(X_AXIS_MAP[x_axis]).annotate(
            overdue=Count(
                Case(
                    When(
                        Q(state__group__in=["backlog", "unstarted", "started"])
                        & Q(target_date__lt=timezone.now()),
                        then=1,
                    ),
                    output_field=IntegerField(),
                )
            ),
            pending=Count(
                Case(
                    When(
                        Q(state__group__in=["backlog", "started", "unstarted"])
                        & Q(target_date__gte=timezone.now()),
                        then=1,
                    ),
                    output_field=IntegerField(),
                )
            ),
            completed=Count(
                Case(
                    When(state__group="completed", then=1), output_field=IntegerField()
                )
            ),
        )

        if x_axis in ["target_date", "start_date"]:
            distribution = self.generate_date_range_data(
                start_of_week, end_of_week, issues_data, key=X_AXIS_MAP[x_axis]
            )
        else:
            distribution = issues_data

        return Response({"distribution": distribution}, status=status.HTTP_200_OK)


class TeamSpaceWorkloadSummaryEndpoint(TeamBaseEndpoint):
    def get(self, request, slug, team_space_id):
        project_ids = TeamSpaceProject.objects.filter(
            team_space_id=team_space_id
        ).values_list("project_id", flat=True)

        issues = Issue.issue_objects.filter(
            project_id__in=project_ids, workspace__slug=slug
        )

        # Get the count of completed, pending, backlog, cancelled issues
        completed_issues = issues.filter(state__group="completed").count()
        pending_issues = issues.filter(
            state__group__in=["backlog", "unstarted", "started"]
        ).count()

        # Get the count of overdue issues
        overdue_issues = issues.filter(
            state__group__in=["backlog", "unstarted", "started"],
            target_date__lt=timezone.now(),
        ).count()

        # Get the count of issues in each state
        backlog_issues = issues.filter(state__group="backlog").count()
        cancelled_issues = issues.filter(state__group="cancelled").count()

        no_due_date_issues = issues.filter(target_date__isnull=True).count()

        return Response(
            {
                "backlog_issues": backlog_issues,
                "cancelled_issues": cancelled_issues,
                "completed_issues": completed_issues,
                "pending_issues": pending_issues,
                "overdue_issues": overdue_issues,
                "no_due_date_issues": no_due_date_issues,
            },
            status=status.HTTP_200_OK,
        )


class TeamSpaceDependencyEndpoint(TeamBaseEndpoint):
    @check_feature_flag(FeatureFlag.TEAMS)
    def get(self, request, slug, team_space_id):
        # Get all the project ids
        project_ids = TeamSpaceProject.objects.filter(
            team_space_id=team_space_id
        ).values_list("project_id", flat=True)

        # Get the issues assigned to the user
        assigned_issue_ids = IssueAssignee.objects.filter(
            project_id__in=project_ids,
            workspace__slug=slug,
            assignee_id=request.user.id,
        ).values_list("issue_id", flat=True)

        # Filter the issues based on the dependency type
        blocking_issue_ids = IssueRelation.objects.filter(
            relation_type="blocked_by", related_issue_id__in=assigned_issue_ids
        ).values_list("issue_id", flat=True)

        blocked_by_issue_ids = IssueRelation.objects.filter(
            relation_type="blocked_by", issue_id__in=assigned_issue_ids
        ).values_list("related_issue_id", flat=True)

        blocking_issues = (
            Issue.issue_objects.filter(
                id__in=blocking_issue_ids, assignees__id__isnull=False
            )
            .values(
                "id",
                "name",
                "state__group",
                "priority",
                "project_id",
                "sequence_id",
                "type_id",
                "archived_at",
            )
            .annotate(
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
                )
            )
        )[:5]

        blocked_by_issues = (
            Issue.issue_objects.filter(
                id__in=blocked_by_issue_ids, assignees__id__isnull=False
            )
            .values(
                "id",
                "name",
                "state__group",
                "priority",
                "project_id",
                "sequence_id",
                "type_id",
                "archived_at",
            )
            .annotate(
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
                )
            )
        )[:5]

        return Response(
            {
                "blocking_issues": blocking_issues,
                "blocked_by_issues": blocked_by_issues,
            },
            status=status.HTTP_200_OK,
        )


class TeamSpaceStatisticsEndpoint(TeamBaseEndpoint):
    def project_tree(self, project_ids, filters):
        issue_map = (
            Issue.issue_objects.filter(project_id__in=project_ids)
            .filter(**filters)
            .annotate(identifier=F("project_id"))
            .values("identifier")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        return Response(issue_map, status=status.HTTP_200_OK)

    def member_tree(self, team_space_id, project_ids, filters):
        # Get all team member ids
        team_member_ids = TeamSpaceMember.objects.filter(
            team_space_id=team_space_id
        ).values_list("member_id", flat=True)

        issue_ids = (
            Issue.issue_objects.filter(project_id__in=project_ids)
            .filter(**filters)
            .values_list("id", flat=True)
        )
        # Get the issue map:
        issue_map = (
            IssueAssignee.objects.filter(
                issue__in=issue_ids, assignee_id__in=team_member_ids
            )
            .annotate(identifier=F("assignee_id"))
            .values("identifier")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        return Response(issue_map, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.TEAMS)
    def get(self, request, slug, team_space_id):
        # Get all the project ids
        project_ids = TeamSpaceProject.objects.filter(
            team_space_id=team_space_id
        ).values_list("project_id", flat=True)

        # Get the tab
        data_key = request.GET.get("data_key", "projects")
        filters = issue_filters(request.query_params, "GET")

        # Get the tree map based on the data_key
        if data_key == "projects":
            return self.project_tree(project_ids, filters)
        else:
            return self.member_tree(team_space_id, project_ids, filters)
