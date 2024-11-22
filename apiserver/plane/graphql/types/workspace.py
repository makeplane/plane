# Third party imports
from typing import Optional

# Third-party library imports
from asgiref.sync import sync_to_async


# Strawberry imports
import strawberry
import strawberry_django
from strawberry import auto
from strawberry.types import Info

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
    logo_url: Optional[str]

    @strawberry.field
    def owner(self) -> int:
        return self.owner_id

    @strawberry_django.field
    async def role(self, info: Info) -> Optional[int]:
        workspace_member = await sync_to_async(
            WorkspaceMember.objects.filter(
                workspace=self.id, member=info.context.user.id
            ).first
        )()
        if workspace_member:
            return str(workspace_member.role)
        return None


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
