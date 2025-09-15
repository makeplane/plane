# python imports
from datetime import datetime
from typing import Optional

# Third-party library imports
import strawberry
import strawberry_django

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import IssueComment
from plane.graphql.types.user import UserLiteType
from plane.graphql.utils.timezone import user_timezone_converter


@strawberry_django.type(IssueComment)
class IssueCommentActivityType:
    id: strawberry.ID
    comment_stripped: str
    comment_json: JSON
    comment_html: str
    attachments: list[str]
    issue: strawberry.ID
    actor: strawberry.ID
    actor_details: Optional[UserLiteType]
    access: str
    external_source: Optional[str]
    external_id: Optional[str]
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
    def issue(self) -> int:
        return self.issue_id

    @strawberry.field
    def created_by(self) -> Optional[strawberry.ID]:
        return self.created_by_id

    @strawberry.field
    def updated_by(self) -> Optional[strawberry.ID]:
        return self.updated_by_id

    @strawberry.field
    def created_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.created_at)
        return converted_date

    @strawberry.field
    def updated_at(self, info) -> Optional[datetime]:
        converted_date = user_timezone_converter(info.context.user, self.updated_at)
        return converted_date
