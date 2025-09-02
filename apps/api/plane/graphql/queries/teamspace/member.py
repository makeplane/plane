# Third-Party Imports
import strawberry

# Django Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.ee.models import TeamspaceMember
from plane.graphql.helpers import (
    is_teamspace_enabled_async,
    is_teamspace_feature_flagged_async,
)
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.teamspace import TeamspaceMemberType


@strawberry.type
class TeamspaceMemberQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def teamspace_members_by_project(
        self, info: Info, slug: str, project: str
    ) -> list[TeamspaceMemberType]:
        try:
            user = info.context.user
            user_id = str(user.id)

            # check if teamspace feature flag is enabled
            teamspace_feature_flagged = await is_teamspace_feature_flagged_async(
                workspace_slug=slug, user_id=user_id
            )
            if not teamspace_feature_flagged:
                message = "Teamspace feature flag is not enabled for the workspace"
                error_extensions = {
                    "code": "TEAMSPACE_FEATURE_FLAG_NOT_ENABLED",
                    "statusCode": 400,
                }
                raise GraphQLError(message, extensions=error_extensions)

            # check if teamspace is enabled
            teamspace_enabled = await is_teamspace_enabled_async(workspace_slug=slug)
            if not teamspace_enabled:
                message = "Teamspace is not enabled for the workspace"
                error_extensions = {
                    "code": "TEAMSPACE_NOT_ENABLED",
                    "statusCode": 400,
                }
                raise GraphQLError(message, extensions=error_extensions)

            teamspace_members = await sync_to_async(list)(
                TeamspaceMember.objects.filter(
                    member_id=user_id,
                    workspace__slug=slug,
                    team_space__projects__project_id=project,
                )
            )

            return teamspace_members
        except Exception as e:
            message = e.message or "Something went wrong"
            error_extensions = e.extensions or {
                "code": "SOMETHING_WENT_WRONG",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)
