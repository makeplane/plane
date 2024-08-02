# python imports
from typing import Optional
from datetime import date, datetime

# Third-party library imports
from asgiref.sync import sync_to_async

# Strawberry imports
import strawberry
import strawberry_django
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import (
    Issue,
    IssueUserProperty,
    IssueActivity,
    IssueComment,
)


@strawberry_django.type(Issue)
class IssueType:
    id: strawberry.ID
    workspace: strawberry.ID
    project: strawberry.ID
    parent: Optional[strawberry.ID]
    state: strawberry.ID
    point: Optional[int]
    estimate_point: Optional[strawberry.ID]
    name: str
    description: Optional[JSON]
    description_html: Optional[str]
    description_stripped: Optional[str]
    description_binary: Optional[str]
    priority: str
    start_date: Optional[date]
    target_date: Optional[date]
    sequence_id: int
    sort_order: float
    completed_at: Optional[date]
    archived_at: Optional[date]
    is_draft: bool
    external_source: Optional[str]
    external_id: Optional[str]
    created_by: strawberry.ID
    updated_by: strawberry.ID
    created_at: datetime
    updated_at: datetime
    sequence_id: int

    @strawberry.field
    def state(self) -> int:
        return self.state_id

    @strawberry.field
    def parent(self) -> int:
        return self.parent_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def estimate_point(self) -> int:
        return self.estimate_point_id

    @strawberry.field
    def created_by(self) -> int:
        return self.created_by_id

    @strawberry.field
    async def assignees(self) -> Optional[list[strawberry.ID]]:
        assignees = await sync_to_async(list)(self.assignees.all())
        return [assignee.id for assignee in assignees]

    @strawberry.field
    async def labels(self) -> Optional[list[strawberry.ID]]:
        labels = await sync_to_async(list)(self.labels.all())
        return [label.id for label in labels]

    # @strawberry.field
    # async def attachments(self) -> list[JSON]:
    #     return await sync_to_async(list) list(
    #         IssueAttachment.objects.filter(issue_id=self.id).values(
    #             "id", "attributes", "asset"
    #         )
    #     )


@strawberry_django.type(IssueUserProperty)
class IssueUserPropertyType:
    display_filters: JSON
    display_properties: JSON
    filters: JSON
    id: strawberry.ID
    project: strawberry.ID
    user: strawberry.ID
    workspace: strawberry.ID

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def user(self) -> int:
        return self.user_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id


@strawberry_django.type(IssueActivity)
class IssuePropertyActivityType:
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
    old_identifier: Optional[strawberry.ID]
    new_identifier: Optional[strawberry.ID]
    epoch: float
    workspace: strawberry.ID
    project: strawberry.ID
    created_at: datetime
    updated_at: datetime

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def actor(self) -> int:
        return self.actor_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def issue_comment(self) -> int:
        return self.issue_comment_id

    @strawberry.field
    def issue(self) -> int:
        return self.issue_id


@strawberry_django.type(IssueComment)
class IssueCommentActivityType:
    id: strawberry.ID
    comment_stripped: str
    comment_json: JSON
    comment_html: str
    attachments: list[str]
    issue: strawberry.ID
    actor: strawberry.ID
    access: str
    external_source: Optional[str]
    external_id: Optional[str]
    workspace: strawberry.ID
    project: strawberry.ID
    created_at: datetime
    updated_at: datetime

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def actor(self) -> int:
        return self.actor_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    def issue(self) -> int:
        return self.issue_id


@strawberry_django.type(Issue)
class IssueLiteType:
    id: strawberry.ID
    name: str
    sequence_id: int
    workspace: strawberry.ID
    project: strawberry.ID
    project__identifier: str

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    # @strawberry.field
    # def project(self) -> int:
    #     return self.project_id
