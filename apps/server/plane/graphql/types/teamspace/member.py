# python imports
from datetime import datetime
from typing import Optional

# strawberry imports
import strawberry
import strawberry_django
from strawberry.types import Info

# module imports
from plane.ee.models import TeamspaceMember
from plane.graphql.utils.timezone import user_timezone_converter


@strawberry_django.type(TeamspaceMember)
class TeamspaceMemberType:
    id: strawberry.ID
    member: Optional[str]
    workspace: Optional[str]
    team_space: Optional[str]
    sort_order: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    @strawberry.field
    def member(self) -> Optional[str]:
        return self.member_id

    @strawberry.field
    def workspace(self) -> Optional[str]:
        return self.workspace_id

    @strawberry.field
    def team_space(self) -> Optional[str]:
        return self.team_space_id

    @strawberry.field
    def created_at(self, info: Info) -> Optional[datetime]:
        if self.created_at:
            user = info.context.user
            converted_date = user_timezone_converter(user, self.created_at)
            return converted_date
        return None

    @strawberry.field
    def updated_at(self, info: Info) -> Optional[datetime]:
        if self.updated_at:
            user = info.context.user
            converted_date = user_timezone_converter(user, self.updated_at)
            return converted_date
        return None
