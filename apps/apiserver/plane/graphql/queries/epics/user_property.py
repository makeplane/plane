# Python Standard Library Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.ee.models import EpicUserProperties
from plane.graphql.helpers import is_epic_feature_flagged, is_project_epics_enabled
from plane.graphql.permissions.project import ProjectPermission
from plane.graphql.types.epics.user_property import EpicUserPropertyType


@strawberry.type
class EpicUserPropertyQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectPermission()])]
    )
    async def epic_user_property(
        self, info: Info, slug: str, project: str
    ) -> EpicUserPropertyType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        epic_user_property, _ = await sync_to_async(
            EpicUserProperties.objects.get_or_create
        )(workspace__slug=slug, project_id=project, user_id=user_id)

        return epic_user_property
