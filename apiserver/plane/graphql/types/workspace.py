# Third party imports
from asgiref.sync import sync_to_async
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django
from strawberry import auto

# Module Imports
from plane.db.models import Workspace, WorkspaceMember
from plane.graphql.types.users import UserType


@strawberry_django.type(Workspace)
class WorkspaceType:
    id: auto
    name: str
    slug: str
    logo: Optional[str]
    owner: strawberry.ID
    organization_size: Optional[str]

    @strawberry.field
    def owner(self) -> int:
        return self.owner_id


@strawberry_django.type(WorkspaceMember)
class WorkspaceMemberType:
    id: strawberry.ID
    member: UserType
    role: int
    is_active: bool


# workspace your work
@strawberry.type
class WorkspaceYourWorkType:
    projects: int
    issues: int
    pages: int
