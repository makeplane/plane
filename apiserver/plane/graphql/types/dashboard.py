from typing import Optional

# strawberry imports
import strawberry

# module imports
from plane.graphql.types.users import UserType
from plane.graphql.types.workspace import WorkspaceType
from plane.graphql.types.device import DeviceInformationType


@strawberry.type
class UserInformationType:
    user: UserType
    workspace: Optional[WorkspaceType]
    device_info: Optional[DeviceInformationType]
