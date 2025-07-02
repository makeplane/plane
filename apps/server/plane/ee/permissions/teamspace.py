# Third party imports
from rest_framework.permissions import BasePermission
from rest_framework.request import Request

# Module imports
from plane.ee.models import TeamspaceMember, TeamspaceProject
from plane.ee.views.base import BaseAPIView, BaseViewSet


class TeamspacePermission(BasePermission):
    def has_permission(self, request, view):
        # Check if the user is a member of the team space
        return TeamspaceMember.objects.filter(
            workspace__slug=view.workspace_slug,
            team_space_id=view.team_space_id,
            member_id=request.user.id,
        ).exists()


class TeamspaceMemberProjectPermission(BasePermission):
    """
    Permission class for checking if the user is a member of the team space and has access to the project.
    """

    def has_permission(self, request: Request, view: BaseAPIView | BaseViewSet):
        # Check if the user is a member of the team space
        project_id = getattr(view, "project_id", None)

        # If the project id is not provided, return False
        if not project_id:
            return False

        # Get the team space ids for the given project
        teamspace_ids = TeamspaceProject.objects.filter(
            workspace__slug=view.workspace_slug, project_id=project_id
        ).values_list("team_space_id", flat=True)

        # Check if the user is a member of the team space
        return TeamspaceMember.objects.filter(
            team_space_id__in=teamspace_ids, member_id=request.user.id
        ).exists()
