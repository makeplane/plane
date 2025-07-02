# Python Standard Library Imports
from typing import Optional

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import Workspace
from plane.graphql.permissions.workspace import IsAuthenticated
from plane.graphql.types.user import UserDeleteType
from plane.graphql.utils.roles import Roles


@sync_to_async
def get_workspaces(user_id: str) -> Optional[list[Workspace]]:
    try:
        role = Roles.ADMIN.value
        workspaces = Workspace.objects.filter(
            workspace_member__role=role,
            workspace_member__member_id=user_id,
        )
        return list(workspaces)
    except Exception:
        return []


@strawberry.type
class UserDeleteQuery:
    @strawberry.field(extensions=[PermissionExtension(permissions=[IsAuthenticated()])])
    async def user_delete(self, info: Info) -> UserDeleteType:
        user = info.context.user
        user_id = str(user.id)

        workspaces = await get_workspaces(user_id)

        if workspaces is None or len(workspaces) == 0:
            return UserDeleteType(can_delete=True, workspaces=[])

        return UserDeleteType(can_delete=False, workspaces=workspaces)
