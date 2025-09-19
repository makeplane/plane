# python imports
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

# Strawberry imports
import strawberry
import strawberry_django

# Third-party library imports
from asgiref.sync import sync_to_async
from strawberry import auto
from strawberry.types import Info

# Module Imports
from plane.db.models import Workspace, WorkspaceMember
from plane.graphql.types.user import UserType
from plane.graphql.utils.timezone import user_timezone_converter


@strawberry.input
@dataclass
class WorkspaceSlugVerificationInputType:
    slug: str = field()


@strawberry.input
@dataclass
class WorkspaceCreateInputType:
    name: str = field()
    slug: str = field()
    organization_size: Optional[str] = field(default_factory=lambda: "small")


@strawberry.input
@dataclass
class WorkspaceUpdateInputType:
    name: Optional[str] = field(default_factory=lambda: None)
    organization_size: Optional[str] = field(default_factory=lambda: None)


@strawberry_django.type(Workspace)
class WorkspaceType:
    id: auto
    name: str
    slug: str
    logo: Optional[str]
    owner: strawberry.ID
    organization_size: Optional[str]
    logo_url: Optional[str]
    deleted_at: Optional[datetime]

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

    @strawberry.field
    def deleted_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.deleted_at)
        return converted_date


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
