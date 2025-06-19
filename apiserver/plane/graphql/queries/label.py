# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.graphql.types.label import LabelType
from plane.db.models import Label
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.permissions.workspace import WorkspaceBasePermission


@strawberry.type
class WorkspaceLabelQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def workspace_labels(self, info: Info, slug: str) -> list[LabelType]:
        labels = await sync_to_async(list)(
            Label.objects.filter(workspace__slug=slug).filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
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
        labels = await sync_to_async(list)(
            Label.objects.filter(workspace__slug=slug, project_id=project).filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
        )
        return labels
