from typing import Optional

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension


# Module Imports
from plane.db.models import Workspace, Profile, Device
from plane.graphql.types.dashboard import UserInformationType
from plane.graphql.permissions.workspace import IsAuthenticated


@strawberry.type
class userInformationQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def userInformation(
        self, info: Info, device_id: Optional[str]
    ) -> UserInformationType:
        profile = await sync_to_async(Profile.objects.get)(
            user=info.context.user
        )

        # fetch workspace
        workspace = None
        workspace_id = (
            profile.last_workspace_id if profile.last_workspace_id else None
        )
        if workspace_id:
            try:
                workspace = await sync_to_async(Workspace.objects.get)(
                    id=workspace_id
                )
            except Exception:
                workspace = None

        # fetch firebase notification token
        device_information = None
        if device_id:
            try:
                device_information = await sync_to_async(Device.objects.get)(
                    user=info.context.user, device_id=device_id
                )
            except Exception:
                device_information = None

        return UserInformationType(
            user=info.context.user,
            workspace=workspace,
            device_info=device_information,
        )
