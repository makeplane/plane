# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.db.models import State
from plane.graphql.types.state import StateType
from plane.graphql.permissions.project import ProjectBasePermission
from plane.graphql.permissions.workspace import WorkspaceBasePermission


@strawberry.type
class WorkspaceStateQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def workspace_states(self, info: Info, slug: str) -> list[StateType]:
        states = await sync_to_async(list)(
            State.objects.filter(workspace__slug=slug)
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .filter(is_triage=False)
        )
        return states


@strawberry.type
class StateQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def states(
        self, info: Info, slug: str, project: strawberry.ID
    ) -> list[StateType]:
        states = await sync_to_async(list)(
            State.objects.filter(workspace__slug=slug, project_id=project)
            .filter(
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .filter(is_triage=False)
        )
        return states
