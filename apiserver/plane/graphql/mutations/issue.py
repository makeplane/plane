# Python imports
import json
from datetime import datetime

# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.scalars import JSON
from strawberry.permission import PermissionExtension

# Third-party imports
from typing import Optional
from asgiref.sync import sync_to_async

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Module imports
from plane.graphql.types.issue import IssueType, IssueUserPropertyType
from plane.graphql.permissions.project import (
    ProjectBasePermission,
    ProjectMemberPermission,
)
from plane.db.models import (
    Issue,
    IssueProperty,
    IssueAssignee,
    IssueLabel,
    Workspace,
)
from plane.graphql.bgtasks.issue_activity_task import issue_activity


@strawberry.type
class IssueMutation:

    @strawberry.mutation(
        extensions=[
            PermissionExtension(permissions=[ProjectMemberPermission()])
        ]
    )
    async def createIssue(
        self,
        info: Info,
        name: str,
        project: str,
        state: str,
        slug: str,
        priority: str,
        labels: Optional[list[strawberry.ID]] = None,
        assignees: Optional[list[strawberry.ID]] = None,
        description: Optional[str] = {},
        parent: Optional[str] = None,
        estimatePoint: Optional[str] = None,
        startDate: Optional[datetime] = None,
        targetDate: Optional[datetime] = None,
    ) -> IssueType:
        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)
        issue = await sync_to_async(Issue.objects.create)(
            name=name,
            project_id=project,
            priority=priority,
            state_id=state,
            description=description,
            parent_id=parent,
            estimate_point_id=estimatePoint,
            start_date=startDate,
            target_date=targetDate,
            workspace=workspace,
        )

        if assignees is not None and len(assignees):
            await sync_to_async(IssueAssignee.objects.bulk_create)(
                [
                    IssueAssignee(
                        assignee_id=user,
                        issue=issue,
                        workspace=workspace,
                        project_id=project,
                        created_by_id=info.context.user.id,
                        updated_by_id=info.context.user.id,
                    )
                    for user in assignees
                ],
                batch_size=10,
            )

        if labels is not None and len(labels):
            await sync_to_async(IssueLabel.objects.bulk_create)(
                [
                    IssueLabel(
                        label_id=label,
                        issue=issue,
                        project_id=project,
                        workspace=workspace,
                        created_by_id=info.context.user.id,
                        updated_by_id=info.context.user.id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        # # Track the issue
        # issue_activity.delay(
        #     type="issue.activity.created",
        #     requested_data=json.dumps(
        #         self.request.data, cls=DjangoJSONEncoder
        #     ),
        #     actor_id=str(info.context.user.id),
        #     issue_id=str(issue.id),
        #     project_id=str(project),
        #     current_instance=None,
        #     epoch=int(timezone.now().timestamp()),
        #     notification=True,
        #     origin=info.context.request.META.get("HTTP_ORIGIN"),
        # )

        return issue

    @strawberry.mutation(
        extensions=[
            PermissionExtension(permissions=[ProjectMemberPermission()])
        ]
    )
    async def updateIssue(
        self,
        info: Info,
        id: strawberry.ID,
        name: str,
        project: str,
        state: str,
        slug: str,
        priority: str,
        labels: list[strawberry.ID] = None,
        assignees: list[strawberry.ID] = None,
        description: Optional[str] = {},
        parent: Optional[str] = None,
        estimatePoint: Optional[str] = None,
        startDate: Optional[datetime] = None,
        targetDate: Optional[datetime] = None,
    ) -> IssueType:
        issue = await sync_to_async(Issue.objects.get)(id=id)

        # Update the fields
        issue.name = name
        issue.priority = priority
        issue.state_id = state
        issue.description = description
        issue.parent_id = parent
        issue.estimate_point_id = estimatePoint
        issue.start_date = startDate
        issue.target_date = targetDate

        # Save the updated issue
        await sync_to_async(issue.save)()
        if assignees is not None and len(assignees):
            IssueAssignee.objects.bulk_create(
                [
                    IssueAssignee(
                        assignee_id=user,
                        issue=issue,
                        project_id=project,
                        created_by_id=info.context.user.id,
                        updated_by_id=info.context.user.id,
                    )
                    for user in assignees
                ],
                batch_size=10,
            )

        if labels is not None and len(labels):
            IssueLabel.objects.bulk_create(
                [
                    IssueLabel(
                        label_id=label,
                        issue=issue,
                        project_id=project,
                        created_by_id=info.context.user.id,
                        updated_by_id=info.context.user.id,
                    )
                    for label in labels
                ],
                batch_size=10,
            )

        # Track the issue
        # issue_activity.delay(
        #     type="issue.activity.created",
        #     requested_data=json.dumps(
        #         self.request.data, cls=DjangoJSONEncoder
        #     ),
        #     actor_id=str(info.context.user.id),
        #     issue_id=str(issue.id),
        #     project_id=str(project),
        #     current_instance=None,
        #     epoch=int(timezone.now().timestamp()),
        #     notification=True,
        #     origin=info.context.request.META.get("HTTP_ORIGIN"),
        # )

        return issue

    @strawberry.mutation(
        extensions=[
            PermissionExtension(permissions=[ProjectMemberPermission()])
        ]
    )
    async def deleteIssue(
        self,
        info: Info,
        slug: str,
        project: str,
        issue: str,
    ) -> bool:
        issue = await sync_to_async(Issue.issue_objects.get)(
            id=issue, project_id=project, workspace__slug=slug
        )
        await sync_to_async(issue.delete)()

        return True


@strawberry.type
class IssueUserPropertyMutation:

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def update_user_properties(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        filters: JSON,
        display_filters: JSON,
        display_properties: JSON,
    ) -> IssueUserPropertyType:
        issue_properties = await sync_to_async(IssueProperty.objects.get)(
            workspace__slug=slug, project_id=project, user=info.context.user
        )
        issue_properties.filters = filters
        issue_properties.display_filters = display_filters
        issue_properties.display_properties = display_properties

        await sync_to_async(issue_properties.save)()
        return issue_properties
