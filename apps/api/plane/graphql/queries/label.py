# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import Label
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.label import LabelType


@strawberry.type
class WorkspaceLabelQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def workspace_labels(self, info: Info, slug: str) -> list[LabelType]:
        user = info.context.user
        user_id = str(user.id)

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
        )
        labels = await sync_to_async(list)(
            Label.objects.filter(workspace__slug=slug)
            .filter(project_teamspace_filter.query)
            .distinct()
        )
        return labels


@strawberry.type
class LabelQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def labels(
        self, info: Info, slug: str, project: strawberry.ID
    ) -> list[LabelType]:
        user = info.context.user
        user_id = str(user.id)

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
        )
        labels = await sync_to_async(list)(
            Label.objects.filter(workspace__slug=slug, project_id=project)
            .filter(project_teamspace_filter.query)
            .distinct()
        )
        return labels
