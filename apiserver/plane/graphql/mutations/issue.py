# Python imports
from datetime import datetime

# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.scalars import JSON
from strawberry.permission import PermissionExtension

# Third-party imports
from typing import Optional
from asgiref.sync import sync_to_async


# Module imports
from plane.graphql.types.issue import IssuesType, IssueUserPropertyType
from plane.graphql.permissions.project import (
    ProjectBasePermission,
    ProjectMemberPermission,
)
from plane.db.models import (
    Issue,
    IssueUserProperty,
    IssueAssignee,
    IssueLabel,
    Workspace,
    IssueAttachment,
    IssueSubscriber,
)


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
    ) -> IssuesType:
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
        project: str,
        slug: str,
        name: Optional[str] = None,
        state: Optional[str] = None,
        priority: Optional[str] = None,
        labels: Optional[list[strawberry.ID]] = None,
        assignees: Optional[list[strawberry.ID]] = None,
        description: Optional[str] = None,
        parent: Optional[str] = None,
        estimatePoint: Optional[str] = None,
        startDate: Optional[datetime] = None,
        targetDate: Optional[datetime] = None,
    ) -> IssuesType:
        issue = await sync_to_async(Issue.objects.get)(id=id)

        if name is not None:
            issue.name = name
        if priority is not None:
            issue.priority = priority
        if state is not None:
            issue.state_id = state
        if description is not None:
            issue.description = description
        if parent is not None:
            issue.parent_id = parent
        if estimatePoint is not None:
            issue.estimate_point_id = estimatePoint
        if startDate is not None:
            issue.start_date = startDate
        if targetDate is not None:
            issue.target_date = targetDate

        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)
        # Save the updated issue
        await sync_to_async(issue.save)()

        if assignees is not None:
            await sync_to_async(
                IssueAssignee.objects.filter(issue=issue).delete
            )()
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

        if labels is not None:
            await sync_to_async(
                IssueLabel.objects.filter(issue=issue).delete
            )()
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
        issue_properties = await sync_to_async(IssueUserProperty.objects.get)(
            workspace__slug=slug, project_id=project, user=info.context.user
        )
        issue_properties.filters = filters
        issue_properties.display_filters = display_filters
        issue_properties.display_properties = display_properties

        await sync_to_async(issue_properties.save)()
        return issue_properties


@strawberry.type
class IssueAttachmentMutation:

    # @strawberry.mutation(
    #     extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    # )
    # def upload_file(self, file: Upload, info: Info) -> bool:
    #     content = file.read()
    #     filename = file.filename
#     @strawberry.mutation(
#         extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
#     )
#     async def upload_file(self, file: Upload, info: Info) -> bool:
#         content = await sync_to_async(file.read)()
#         filename = file.filename

#         # Save the file using Django's file storage
#         await sync_to_async(default_storage.save)(filename, content)

#         return True

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def deleteIssueAttachment(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
        attachment: strawberry.ID,
    ) -> bool:
        issue_attachment = await sync_to_async(IssueAttachment.objects.get)(
            id=attachment,
            issue_id=issue,
            project_id=project,
            workspace__slug=slug,
        )
        await sync_to_async(issue_attachment.delete)()
        return True


@strawberry.type
class IssueSubscriptionMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def subscribeIssue(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
    ) -> bool:
        issue = await sync_to_async(IssueSubscriber.objects.create)(
            issue_id=issue, project_id=project, subscriber=info.context.user
        )
        return True

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def unSubscribeIssue(
        self,
        info: Info,
        slug: str,
        project: strawberry.ID,
        issue: strawberry.ID,
    ) -> bool:
        issue_subscriber = await sync_to_async(IssueSubscriber.objects.get)(
            issue_id=issue,
            subscriber=info.context.user,
            project_id=project,
            workspace__slug=slug,
        )
        await sync_to_async(issue_subscriber.delete)()
        return True
