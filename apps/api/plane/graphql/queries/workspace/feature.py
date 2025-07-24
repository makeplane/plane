# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.ee.models import WorkspaceFeature
from plane.graphql.permissions.workspace import WorkspacePermission
from plane.graphql.types.workspace import WorkspaceFeatureType


# workspace issues information query
@strawberry.type
class WorkspaceFeatureQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspacePermission()])]
    )
    async def workspace_features(
        self,
        info: Info,
        slug: str,
    ) -> WorkspaceFeatureType:
        try:
            user = info.context.user
            user_id = str(user.id)

            workspace_feature = await sync_to_async(WorkspaceFeature.objects.get)(
                workspace__slug=slug,
                workspace__workspace_member__member=user_id,
                workspace__workspace_member__is_active=True,
            )
        except WorkspaceFeature.DoesNotExist:
            return WorkspaceFeatureType(
                is_project_grouping_enabled=False,
                is_initiative_enabled=False,
                is_teams_enabled=False,
                is_customer_enabled=False,
            )

        return WorkspaceFeatureType(
            is_project_grouping_enabled=workspace_feature.is_project_grouping_enabled,
            is_initiative_enabled=workspace_feature.is_initiative_enabled,
            is_teams_enabled=workspace_feature.is_teams_enabled,
            is_customer_enabled=workspace_feature.is_customer_enabled,
        )
