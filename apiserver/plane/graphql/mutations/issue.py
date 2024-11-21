# Python imports
from datetime import datetime
import json
import requests

# Django imports
from django.utils import timezone
from django.conf import settings

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
    FileAsset,
    IssueSubscriber,
    IssueType,
)
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.utils.issue_activity import (
    convert_issue_properties_to_activity_dict,
)


@sync_to_async
def get_feature_flag(workspace_slug: str, user_id: str, flag_key: str):
    url = f"{settings.FEATURE_FLAG_SERVER_BASE_URL}/api/feature-flags/"
    json = {
        "workspace_slug": workspace_slug,
        "user_id": user_id,
        "flag_key": flag_key,
    }
    headers = {
        "content-type": "application/json",
        "x-api-key": settings.FEATURE_FLAG_SERVER_AUTH_TOKEN,
    }
    response = requests.post(url, json=json, headers=headers)
    response.raise_for_status()
    return response.json().get("value", False)


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
        slug: str,
        project: str,
        name: str,
        state: str,
        priority: str,
        labels: Optional[list[strawberry.ID]] = None,
        assignees: Optional[list[strawberry.ID]] = None,
        descriptionHtml: Optional[str] = None,
        parent: Optional[str] = None,
        estimatePoint: Optional[str] = None,
        startDate: Optional[datetime] = None,
        targetDate: Optional[datetime] = None,
    ) -> IssuesType:
        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)

        issue_type_id = None
        # validating issue type and assigning thr default issue type
        is_feature_flagged = await get_feature_flag(
            workspace.slug,
            str(info.context.user.id),
            "ISSUE_TYPE_DISPLAY",
        )

        if is_feature_flagged:
            try:
                issue_type = await sync_to_async(IssueType.objects.get)(
                    workspace__slug=slug,
                    project_issue_types__project=project,
                    is_default=True,
                )
                if issue_type is not None:
                    issue_type_id = issue_type.id
            except IssueType.DoesNotExist:
                pass

        issue = await sync_to_async(Issue.objects.create)(
            name=name,
            project_id=project,
            priority=priority,
            state_id=state,
            description_html=descriptionHtml
            if descriptionHtml is not None
            else "<p></p>",
            parent_id=parent,
            estimate_point_id=estimatePoint,
            start_date=startDate,
            target_date=targetDate,
            workspace=workspace,
            type_id=issue_type_id,
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

        activity_payload = {}
        if name is not None:
            activity_payload["name"] = name
        if descriptionHtml is not None:
            activity_payload["description_html"] = descriptionHtml
        else:
            activity_payload["description_html"] = "<p></p>"
        if priority is not None:
            activity_payload["priority"] = priority
        if state is not None:
            activity_payload["state_id"] = state
        if parent is not None:
            activity_payload["parent_id"] = parent
        if estimatePoint is not None:
            activity_payload["estimate_point"] = estimatePoint
        if startDate is not None:
            activity_payload["start_date"] = startDate.strftime("%Y-%m-%d")
        if targetDate is not None:
            activity_payload["target_date"] = targetDate.strftime("%Y-%m-%d")
        if labels is not None:
            activity_payload["label_ids"] = labels
        if assignees is not None:
            activity_payload["assignee_ids"] = assignees

        # Track the issue
        await sync_to_async(issue_activity.delay)(
            type="issue.activity.created",
            origin=info.context.request.META.get("HTTP_ORIGIN"),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            project_id=str(project),
            issue_id=str(issue.id),
            actor_id=str(info.context.user.id),
            current_instance=None,
            requested_data=json.dumps(activity_payload),
        )

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
        descriptionHtml: Optional[str] = None,
        parent: Optional[str] = None,
        estimatePoint: Optional[str] = None,
        startDate: Optional[datetime] = None,
        targetDate: Optional[datetime] = None,
    ) -> IssuesType:
        issue = await sync_to_async(Issue.objects.get)(id=id)

        # activity tacking data
        current_issue_activity = (
            await convert_issue_properties_to_activity_dict(issue)
        )
        activity_payload = {}

        if name is not None:
            issue.name = name
            activity_payload["name"] = name
        if priority is not None:
            issue.priority = priority
            activity_payload["priority"] = priority
        if state is not None:
            issue.state_id = state
            activity_payload["state_id"] = state
        if descriptionHtml is not None:
            issue.description_html = descriptionHtml
            activity_payload["description_html"] = descriptionHtml
        if parent is not None:
            issue.parent_id = parent
            activity_payload["parent_id"] = parent
        if estimatePoint is not None:
            issue.estimate_point_id = estimatePoint
            activity_payload["estimate_point"] = estimatePoint
        if startDate is not None:
            issue.start_date = startDate
            activity_payload["start_date"] = startDate.strftime("%Y-%m-%d")
        if targetDate is not None:
            issue.target_date = targetDate
            activity_payload["target_date"] = targetDate.strftime("%Y-%m-%d")

        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)

        # updating the issue
        await sync_to_async(issue.save)()

        # creating or updating the assignees
        if assignees is not None:
            activity_payload["assignee_ids"] = assignees
            await sync_to_async(
                IssueAssignee.objects.filter(issue=issue).delete
            )()
            if len(assignees) > 0:
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

        # creating or updating the labels
        if labels is not None:
            activity_payload["label_ids"] = labels
            await sync_to_async(IssueLabel.objects.filter(issue=id).delete)()
            if len(labels) > 0:
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
        issue_activity.delay(
            type="issue.activity.updated",
            origin=info.context.request.META.get("HTTP_ORIGIN"),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            project_id=str(project),
            issue_id=str(issue.id),
            actor_id=str(info.context.user.id),
            current_instance=json.dumps(current_issue_activity),
            requested_data=json.dumps(activity_payload),
        )

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

        if issue.created_by_id != info.context.user.id:
            raise Exception("You are not authorized to delete this issue")

        # activity tracking data
        current_issue_activity = (
            await convert_issue_properties_to_activity_dict(issue)
        )
        await sync_to_async(issue.delete)()

        # Track the issue
        issue_activity.delay(
            type="issue.activity.deleted",
            requested_data=json.dumps({"issue_id": str(issue)}),
            actor_id=str(info.context.user.id),
            issue_id=str(issue),
            project_id=str(project),
            current_instance=current_issue_activity,
            epoch=int(timezone.now().timestamp()),
            origin=info.context.request.META.get("HTTP_ORIGIN"),
        )

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
        issue_attachment = await sync_to_async(FileAsset.objects.get)(
            id=attachment,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            entity_identifier=issue,
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
