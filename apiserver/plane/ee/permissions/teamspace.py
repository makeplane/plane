# Third party imports
from rest_framework.permissions import BasePermission

# Module imports
from plane.ee.models import TeamspaceMember


class TeamspacePermission(BasePermission):
    def has_permission(self, request, view):
        # Check if the user is a member of the team space
        return TeamspaceMember.objects.filter(
            workspace__slug=view.workspace_slug,
            team_space_id=view.team_space_id,
            member_id=request.user.id,
        ).exists()
