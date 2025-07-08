# Third-Party Imports
import strawberry

# Django Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import ProjectMember
from plane.ee.models import TeamspaceMember, TeamspaceProject
from plane.graphql.helpers.teamspace import (
    is_teamspace_enabled_async,
    is_teamspace_feature_flagged_async,
)
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.roles import UserProjectRolesType
from plane.graphql.utils.roles import Roles


@strawberry.type
class UserProjectRolesQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def user_project_roles(
        self,
        info: Info,
        slug: str,
        project: str,
    ) -> UserProjectRolesType:
        user = info.context.user
        user_id = str(user.id)

        user_project_roles = UserProjectRolesType(
            project_id=str(project),
            role=None,
            project_role=None,
            teamspace_role=None,
        )

        # # project members with project role
        project_member = await sync_to_async(list)(
            ProjectMember.objects.filter(
                member_id=user_id,
                workspace__slug=slug,
                project_id=project,
                is_active=True,
                member__is_bot=False,
                project__archived_at__isnull=True,
            ).order_by("sort_order")
        )

        if project_member and len(project_member) > 0:
            project_member = project_member[0]
            user_project_roles.role = project_member.role
            user_project_roles.project_role = project_member.role
            user_project_roles.teamspace_role = None

        # teamspace role validation
        teamspace_feature_flagged = await is_teamspace_feature_flagged_async(
            slug, user_id
        )
        if teamspace_feature_flagged:
            teamspace_enabled = await is_teamspace_enabled_async(slug)
            if teamspace_enabled:
                teamspace_ids = await sync_to_async(list)(
                    TeamspaceProject.objects.filter(
                        workspace__slug=slug, project_id=project
                    ).values_list("team_space_id", flat=True)
                )
                teamspace_ids = [str(teamspace_id) for teamspace_id in teamspace_ids]

                teamspace_members = await sync_to_async(list)(
                    TeamspaceMember.objects.filter(
                        workspace__slug=slug,
                        member_id=user_id,
                        team_space_id__in=teamspace_ids,
                    ).order_by("sort_order")
                )

                if teamspace_members and len(teamspace_members) > 0:
                    user_project_roles.teamspace_role = Roles.MEMBER.value

        user_project_roles.role = max(
            user_project_roles.project_role or 0,
            user_project_roles.teamspace_role or 0,
        )

        return user_project_roles
