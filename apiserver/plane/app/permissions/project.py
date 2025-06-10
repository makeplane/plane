# Third Party imports
from rest_framework.permissions import SAFE_METHODS, BasePermission
from rest_framework.request import Request

# Module import
from plane.db.models import ProjectMember, WorkspaceMember
from plane.ee.models import TeamspaceProject, TeamspaceMember
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag


# Permission Role Levels
# These constants define the permission levels in the system
Admin: int = 20  # Administrator level access
Member: int = 15  # Regular member level access
Guest: int = 5  # Guest/restricted level access

def check_teamspace_membership(view, request: Request) -> bool:
    """
    Check if the user is a member of any teamspace associated with the project.

    Args:
        view: The view instance containing workspace_slug and project_id
        request (Request): The incoming request object containing user information

    Returns:
        bool: True if user is a member of any associated teamspace, False otherwise

    Note:
        This function first checks if teamspaces feature is enabled for the workspace
        before performing the membership check.
    """
    # check the user is part of the teamspace if the project is attached to any.
    if check_workspace_feature_flag(
        feature_key=FeatureFlag.TEAMSPACES,
        slug=view.workspace_slug,
        user_id=request.user.id,
    ):
        ## Get all the teamspace ids that the project is attached to.
        teamspace_ids = TeamspaceProject.objects.filter(
            workspace__slug=view.workspace_slug, project_id=view.project_id
        ).values_list("team_space_id", flat=True)

        # return True if the user is a member of any of the teamspace
        return TeamspaceMember.objects.filter(
            member=request.user, team_space_id__in=teamspace_ids
        ).exists()
    return False


class ProjectBasePermission(BasePermission):
    """
    Base permission class for project-related operations.

    This class implements basic permission checks for project access:
    - Anonymous users are denied access
    - READ operations require workspace membership
    - CREATE operations require workspace admin/member role
    - UPDATE operations require project admin role
    """
    def has_permission(self, request, view) -> bool:
        if request.user.is_anonymous:
            return False

        ## Safe Methods -> Handle the filtering logic in queryset
        if request.method in SAFE_METHODS:
            return WorkspaceMember.objects.filter(
                workspace__slug=view.workspace_slug, member=request.user, is_active=True
            ).exists()

        ## Only workspace owners or admins can create the projects
        if request.method == "POST":
            return WorkspaceMember.objects.filter(
                workspace__slug=view.workspace_slug,
                member=request.user,
                role__in=[Admin, Member],
                is_active=True,
            ).exists()

        ## Only Project Admins can update project attributes
        return ProjectMember.objects.filter(
            workspace__slug=view.workspace_slug,
            member=request.user,
            role=Admin,
            project_id=view.project_id,
            is_active=True,
        ).exists()


class ProjectMemberPermission(BasePermission):
    """
    Permission class for project member operations.

    Extends the base permissions with additional checks:
    - Allows teamspace members access if the project is associated with their teamspace
    - Provides different permission levels for different operations
    """

    def has_permission(self, request, view) -> bool:
        if request.user.is_anonymous:
            return False

        ## Safe Methods -> Handle the filtering logic in queryset
        if request.method in SAFE_METHODS:
            return ProjectMember.objects.filter(
                workspace__slug=view.workspace_slug, member=request.user, is_active=True
            ).exists()
        ## Only workspace owners or admins can create the projects
        if request.method == "POST":
            return WorkspaceMember.objects.filter(
                workspace__slug=view.workspace_slug,
                member=request.user,
                role__in=[Admin, Member],
                is_active=True,
            ).exists()

        ## Only Project Admins can update project attributes
        is_project_member = ProjectMember.objects.filter(
            workspace__slug=view.workspace_slug,
            member=request.user,
            role__in=[Admin, Member],
            project_id=view.project_id,
            is_active=True,
        ).exists()

        # If the user is already an admin or member return True
        if is_project_member:
            return True

        # check the user is part of the teamspace if the project is attached to any.
        return check_teamspace_membership(view=view, request=request)


class ProjectEntityPermission(BasePermission):
    """
    Permission class for project entity operations.

    Handles permissions for project-related entities with additional features:
    - Supports project identification by identifier
    - Implements teamspace-based access control
    - Different permission levels for read/write operations
    """

    def has_permission(self, request, view) -> bool:
        if request.user.is_anonymous:
            return False

        # Handle requests based on project__identifier
        if hasattr(view, "project__identifier") and view.project__identifier:
            if request.method in SAFE_METHODS:
                is_project_member = ProjectMember.objects.filter(
                    workspace__slug=view.workspace_slug,
                    member=request.user,
                    project__identifier=view.project__identifier,
                    is_active=True,
                ).exists()

                if is_project_member:
                    return True
                else:
                    return check_teamspace_membership(view=view, request=request)

        ## Safe Methods -> Handle the filtering logic in queryset
        if request.method in SAFE_METHODS:
            is_project_member = ProjectMember.objects.filter(
                workspace__slug=view.workspace_slug,
                member=request.user,
                project_id=view.project_id,
                is_active=True,
            ).exists()

            if is_project_member:
                return True
            else:
                return check_teamspace_membership(view=view, request=request)

        ## Only project members or admins can create and edit the project attributes
        is_project_member = ProjectMember.objects.filter(
            workspace__slug=view.workspace_slug,
            member=request.user,
            role__in=[Admin, Member],
            project_id=view.project_id,
            is_active=True,
        ).exists()

        if is_project_member:
            return True
        else:
            return check_teamspace_membership(view=view, request=request)


class ProjectLitePermission(BasePermission):
    """
    Lightweight permission class for basic project access control.

    Implements simplified permission checks:
    - Verifies project membership
    - Falls back to teamspace membership check
    """
    def has_permission(self, request, view) -> bool:
        if request.user.is_anonymous:
            return False

        is_project_member = ProjectMember.objects.filter(
            workspace__slug=view.workspace_slug,
            member=request.user,
            project_id=view.project_id,
            is_active=True,
        ).exists()

        if is_project_member:
            return True
        else:
            return check_teamspace_membership(view=view, request=request)
