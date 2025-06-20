# Python Imports
from typing import Any, Optional

# Third-Party Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.permission import BasePermission
from strawberry.types import Info

# Local Imports
from plane.db.models import ProjectMember
from plane.ee.models import TeamspaceMember, TeamspaceProject
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.graphql.utils.error_codes import ERROR_CODES
from plane.graphql.utils.feature_flag import _validate_feature_flag
from plane.graphql.utils.roles import Roles

# Permission Mappings
Admin = 20
Member = 15
Viewer = 10
Guest = 5


@sync_to_async
def _validate_project_access_via_teamspaces(
    user_id: str, workspace_slug: str, project_id: Optional[str] = None
) -> bool:
    feature_key = FeatureFlagsTypesEnum.TEAMSPACES.value
    teamspace_feature_flagged = _validate_feature_flag(
        workspace_slug=workspace_slug,
        feature_key=feature_key,
        user_id=user_id,
    )

    if teamspace_feature_flagged:
        # Get all team ids where the user is a member
        teamspace_ids = TeamspaceMember.objects.filter(
            member_id=user_id, workspace__slug=workspace_slug
        ).values_list("team_space_id", flat=True)

        # Get all the projects in the respective teamspaces
        teamspace_project_ids = TeamspaceProject.objects.filter(
            team_space_id__in=teamspace_ids
        ).values_list("project_id", flat=True)
        teamspace_project_ids = [
            str(project_id) for project_id in list(teamspace_project_ids)
        ]

        if project_id is not None and str(project_id) in teamspace_project_ids:
            return True

    return False


class IsAuthenticated(BasePermission):
    message = "User is not authenticated"
    error_extensions = {
        "code": "UNAUTHENTICATED",
        "statusCode": ERROR_CODES["USER_NOT_AUTHENTICATED"],
    }

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        if info.context.user is None:
            return False
        self.user = info.context.user
        return self.user.is_authenticated


class ProjectBasePermission(IsAuthenticated):
    message = "User does not have permission to access this project"
    error_extensions = {
        "code": "UNAUTHORIZED",
        "statusCode": ERROR_CODES["USER_NOT_AUTHORIZED"],
    }

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        # First, check if the user is authenticated by calling the parent class's method
        if not await super().has_permission(source, info, **kwargs):
            self.message = IsAuthenticated.message
            self.error_extensions = IsAuthenticated.error_extensions
            return False

        workspace_slug = kwargs.get("slug")
        project_id = kwargs.get("project")
        user_id = str(self.user.id)

        is_project_member_exists = await sync_to_async(
            ProjectMember.objects.filter(
                member_id=user_id,
                workspace__slug=workspace_slug,
                project_id=project_id,
                is_active=True,
            ).exists,
            thread_sensitive=True,
        )()

        return is_project_member_exists


class ProjectMemberPermission(IsAuthenticated):
    message = "Only project admins or members can perform this action"
    error_extensions = {
        "code": "UNAUTHORIZED",
        "statusCode": ERROR_CODES["USER_NOT_AUTHORIZED"],
    }

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        # First, check if the user is authenticated by calling the parent class's method
        if not await super().has_permission(source, info, **kwargs):
            self.message = IsAuthenticated.message
            self.error_extensions = IsAuthenticated.error_extensions
            return False

        workspace_slug = kwargs.get("slug")
        project_id = kwargs.get("project")
        user_id = str(self.user.id)

        is_project_member_exists = await sync_to_async(
            ProjectMember.objects.filter(
                member_id=user_id,
                workspace__slug=workspace_slug,
                project_id=project_id,
                is_active=True,
                role__in=[Admin, Member],
            ).exists,
            thread_sensitive=True,
        )()

        if not is_project_member_exists:
            is_teamspace_member_exists = await _validate_project_access_via_teamspaces(
                user_id=user_id, workspace_slug=workspace_slug, project_id=project_id
            )
            return is_teamspace_member_exists

        return is_project_member_exists


class ProjectAdminPermission(IsAuthenticated):
    message = "Only admins can perform this action"
    error_extensions = {
        "code": "UNAUTHORIZED",
        "statusCode": ERROR_CODES["USER_NOT_AUTHORIZED"],
    }

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        # First, check if the user is authenticated by calling the parent class's method
        if not await super().has_permission(source, info, **kwargs):
            self.message = IsAuthenticated.message
            self.error_extensions = IsAuthenticated.error_extensions
            return False

        workspace_slug = kwargs.get("slug")
        project_id = kwargs.get("project")
        user_id = str(self.user.id)

        is_project_member_exists = await sync_to_async(
            ProjectMember.objects.filter(
                member_id=user_id,
                workspace__slug=workspace_slug,
                project_id=project_id,
                is_active=True,
                role__in=[Admin],
            ).exists,
            thread_sensitive=True,
        )()

        if not is_project_member_exists:
            is_teamspace_member_exists = await _validate_project_access_via_teamspaces(
                user_id=user_id, workspace_slug=workspace_slug, project_id=project_id
            )
            return is_teamspace_member_exists

        return is_project_member_exists


class ProjectPermission(IsAuthenticated):
    message = "User does not have permission to perform this action"
    error_extensions = {
        "code": "UNAUTHORIZED",
        "statusCode": ERROR_CODES["USER_NOT_AUTHORIZED"],
    }

    roles = [Roles.ADMIN, Roles.MEMBER, Roles.GUEST]

    def __init__(self, roles: Optional[list[str]] = None):
        if roles:
            self.roles = roles

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        if not await super().has_permission(source, info, **kwargs):
            self.message = IsAuthenticated.message
            self.error_extensions = IsAuthenticated.error_extensions
            return False

        allowed_roles = [role.value for role in self.roles]

        workspace_slug = kwargs.get("slug")
        project_id = kwargs.get("project")
        user_id = str(self.user.id)

        is_project_member_exists = await sync_to_async(
            ProjectMember.objects.filter(
                member_id=user_id,
                workspace__slug=workspace_slug,
                project_id=project_id,
                is_active=True,
                role__in=allowed_roles,
            ).exists,
            thread_sensitive=True,
        )()

        if not is_project_member_exists:
            is_teamspace_member_exists = await _validate_project_access_via_teamspaces(
                user_id=user_id, workspace_slug=workspace_slug, project_id=project_id
            )
            return is_teamspace_member_exists

        return is_project_member_exists
