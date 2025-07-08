# Python imports
import uuid

# Module imports
from plane.ee.models import TeamspaceProject, TeamspaceMember
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag


def check_if_current_user_is_teamspace_member(
    user_id: uuid.UUID, slug: str, project_id: uuid.UUID
) -> bool:
    """
    Check if the current user is a member of the teamspace.

    Args:
        user_id (uuid.UUID): The ID of the user.
        slug (str): The slug of the workspace.
        project_id (uuid.UUID): The ID of the project.

    Returns:
        bool: True if the user is a member of the teamspace, False otherwise.
    """
    if check_workspace_feature_flag(
        feature_key=FeatureFlag.TEAMSPACES, user_id=user_id, slug=slug
    ):
        # Get all the projects in the respective teamspaces
        teamspace_ids = TeamspaceProject.objects.filter(
            project_id=project_id
        ).values_list("team_space_id", flat=True)
        
        # Check if the user is a member of the teamspace
        return TeamspaceMember.objects.filter(
            member_id=user_id,
            team_space_id__in=teamspace_ids,
        ).exists()
    else:
        return False
