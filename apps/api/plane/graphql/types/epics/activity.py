# python imports
from datetime import datetime
from typing import Optional

# Third-party library imports
import strawberry
import strawberry_django

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Module Imports
from plane.db.models import IssueActivity
from plane.graphql.types.user import UserLiteType
from plane.graphql.utils.timezone import user_timezone_converter


@strawberry_django.type(IssueActivity)
class EpicPropertyActivityType:
    id: strawberry.ID
    issue: strawberry.ID
    verb: str
    field: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    comment: str
    attachments: list[str]
    issue_comment: Optional[strawberry.ID]
    actor: strawberry.ID
    actor_details: Optional[UserLiteType]
    old_identifier: Optional[strawberry.ID]
    new_identifier: Optional[strawberry.ID]
    epoch: float
    workspace: strawberry.ID
    project: strawberry.ID
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def actor(self) -> int:
        return self.actor_id

    @strawberry.field
    async def actor_details(self) -> Optional[UserLiteType]:
        if self.actor:
            return self.actor
        return UserLiteType()

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def issue_comment(self) -> int:
        return self.issue_comment_id

    @strawberry.field
    def issue(self) -> int:
        return self.issue_id

    @strawberry.field
    def created_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date
