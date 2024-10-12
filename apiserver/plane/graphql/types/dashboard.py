# strawberry imports
import strawberry

# module imports
from plane.graphql.types.users import UserType
from plane.graphql.types.workspace import WorkspaceType


@strawberry.type
class UserInformationType:
    user: UserType
    workspace: WorkspaceType
