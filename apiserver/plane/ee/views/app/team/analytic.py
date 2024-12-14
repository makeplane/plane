# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import TeamBaseEndpoint
from plane.ee.permissions import WorkspaceUserPermission, TeamSpacePermission
from plane.db.models import Issue, Cycle, Page, IssueView
from plane.ee.models import (
    TeamSpaceProject,
    TeamSpacePage,
    TeamSpaceView,
)
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class TeamSpaceEntitiesEndpoint(TeamBaseEndpoint):
    permission_classes = [
        WorkspaceUserPermission,
        TeamSpacePermission,
    ]

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
            team_space_id=team_space_id,
        ).values_list("project_id", flat=True)

        issue_count = Issue.objects.filter(
            project_id__in=project_ids,
            workspace__slug=slug,
        ).count()

        cycles_count = Cycle.objects.filter(
            project_id__in=project_ids,
            workspace__slug=slug,
        ).count()

        pages_count = Page.objects.filter(
            projects__in=project_ids,
            workspace__slug=slug,
            access=0,
        ).count()

        views_count = IssueView.objects.filter(
            project_id__in=project_ids,
            workspace__slug=slug,
            access=1,
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
