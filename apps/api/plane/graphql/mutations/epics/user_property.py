# Third-party imports
import strawberry
from dataclasses import asdict

# Django imports
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info
from strawberry.exceptions import GraphQLError

# Module imports
from plane.ee.models import EpicUserProperties
from plane.graphql.permissions.project import ProjectPermission, Roles
from plane.graphql.types.epics.user_property import (
    EpicUserPropertyType,
    EpicUserPropertyCreateInputType,
)
from plane.graphql.helpers import is_project_epics_enabled, is_epic_feature_flagged


@strawberry.type
class EpicUserPropertyMutation:
    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[ProjectPermission([Roles.ADMIN, Roles.MEMBER])]
            )
        ]
    )
    async def update_epic_user_properties(
        self,
        info: Info,
        slug: str,
        project: str,
        user_properties: EpicUserPropertyCreateInputType,
    ) -> EpicUserPropertyType:
        try:
            user = info.context.user
            user_id = str(user.id)

            # Check if the epic feature flag is enabled for the workspace
            await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

            # check if the epic is enabled for the project
            await is_project_epics_enabled(workspace_slug=slug, project_id=project)

            epic_properties = await sync_to_async(EpicUserProperties.objects.get)(
                workspace__slug=slug, project_id=project, user_id=user_id
            )

            for key, value in asdict(user_properties).items():
                if value is not None:
                    setattr(epic_properties, key, value)

            await sync_to_async(epic_properties.save)()

            return epic_properties
        except EpicUserProperties.DoesNotExist:
            message = "Epic user properties not found"
            error_extensions = {
                "code": "EPIC_USER_PROPERTY_UPDATE_FAILED",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)
        except Exception:
            message = "Failed to update epic user properties"
            error_extensions = {
                "code": "EPIC_USER_PROPERTY_UPDATE_FAILED",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)
