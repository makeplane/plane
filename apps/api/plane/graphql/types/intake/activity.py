# python imports
from datetime import datetime
from typing import Optional

# Third-party library imports
import strawberry
import strawberry_django
from asgiref.sync import sync_to_async

# Module Imports
from plane.db.models import IntakeIssue, IssueActivity
from plane.graphql.types.user import UserLiteType
from plane.graphql.utils.timezone import user_timezone_converter


@strawberry_django.type(IssueActivity)
class IntakeWorkItemPropertyActivityType:
    id: strawberry.ID
    issue: strawberry.ID
    verb: str
    field: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    comment: str
    attachments: list[str]
    issue_comment: Optional[strawberry.ID]
    actor: Optional[strawberry.ID]
    actor_details: Optional[UserLiteType]
    old_identifier: Optional[strawberry.ID]
    new_identifier: Optional[strawberry.ID]
    epoch: float
    workspace: strawberry.ID
    project: strawberry.ID
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    source: Optional[str]
    source_email: Optional[str]

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def actor(self) -> Optional[strawberry.ID]:
        return self.actor_id if self.actor_id else None

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

    @strawberry.field
    async def source(self, info) -> Optional[str]:
        issue_id = self.issue_id or None
        if issue_id:
            intake_work_item = await sync_to_async(
                lambda: IntakeIssue.objects.get(issue_id=issue_id)
            )()
            return intake_work_item.source if intake_work_item.source else None
        return None

    @strawberry.field
    async def source_email(self) -> Optional[str]:
        issue_id = self.issue_id or None
        if issue_id:
            intake_work_item = await sync_to_async(
                lambda: IntakeIssue.objects.get(issue_id=issue_id)
            )()
            return (
                intake_work_item.source_email if intake_work_item.source_email else None
            )
        return None
