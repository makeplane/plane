# Python imports
import json
from datetime import datetime

# Third-party imports
from typing import Optional

import strawberry
from asgiref.sync import sync_to_async

# Django imports
from django.core import serializers
from django.utils import timezone

# Strawberry imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module imports
from plane.db.models import (
    CycleIssue,
    Issue,
    IssueAssignee,
    IssueLabel,
    IssueSubscriber,
    IssueType,
    IssueUserProperty,
    ModuleIssue,
    Project,
    Workspace,
)
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.permissions.project import (
    ProjectBasePermission,
    ProjectMemberPermission,
)
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.graphql.types.issues.base import IssuesType
from plane.graphql.types.issues.user_property import IssueUserPropertyType
from plane.graphql.utils.feature_flag import validate_feature_flag
from plane.graphql.utils.issue_activity import convert_issue_properties_to_activity_dict
from plane.graphql.utils.workflow import WorkflowStateManager


@sync_to_async
def validate_workflow_state_issue_create(user_id, slug, project_id, state_id):
    workflow_manager = WorkflowStateManager(
        user_id=user_id, slug=slug, project_id=project_id
    )
    is_issue_creation_allowed = workflow_manager._validate_issue_creation(
        state_id=state_id
    )

    if is_issue_creation_allowed is False:
        message = "You cannot create an issue in this state"
        error_extensions = {"code": "FORBIDDEN", "statusCode": 403}
        raise GraphQLError(message, extensions=error_extensions)

    return is_issue_creation_allowed


@sync_to_async
def validate_workflow_state_issue_update(
    user_id, slug, project_id, current_state_id, new_state_id
):
    workflow_state_manager = WorkflowStateManager(
        user_id=user_id, slug=slug, project_id=project_id
    )
    can_state_update = workflow_state_manager._validate_state_transition(
        current_state_id=current_state_id, new_state_id=new_state_id
    )

    if can_state_update is False:
        message = "You cannot update an issue in this state"
        error_extensions = {"code": "FORBIDDEN", "statusCode": 403}
        raise GraphQLError(message, extensions=error_extensions)

    return can_state_update


@strawberry.type
class IssueMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
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
        cycle_id: Optional[strawberry.ID] = None,
        module_ids: Optional[list[strawberry.ID]] = None,
    ) -> IssuesType:
        user = info.context.user
        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)
        project_details = await sync_to_async(Project.objects.get)(id=project)

        if state is not None:
            is_feature_flagged = await validate_feature_flag(
                user_id=str(user.id),
                slug=slug,
                feature_key=FeatureFlagsTypesEnum.WORKFLOWS.value,
                default_value=False,
            )
            if is_feature_flagged:
                await validate_workflow_state_issue_create(
                    user_id=user.id, slug=slug, project_id=project, state_id=state
                )

        # validating issue type and assigning thr default issue type
        issue_type_id = None
        is_feature_flagged = await validate_feature_flag(
            slug=workspace.slug,
            user_id=str(user.id),
            feature_key=FeatureFlagsTypesEnum.ISSUE_TYPES.value,
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
                        assignee_id=assignee,
                        issue=issue,
                        workspace=workspace,
                        project_id=project,
                        created_by_id=user.id,
                        updated_by_id=user.id,
                    )
                    for assignee in assignees
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
                        created_by_id=user.id,
                        updated_by_id=user.id,
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
            actor_id=str(user.id),
            current_instance=None,
            requested_data=json.dumps(activity_payload),
        )

        issue_id = issue.id
        project_id = project_details.id
        # creating the cycle for the issue
        if cycle_id is not None:
            created_cycle = await sync_to_async(CycleIssue.objects.create)(
                issue_id=issue_id,
                cycle_id=cycle_id,
                project_id=project_details.id,
                workspace_id=workspace.id,
                created_by_id=user.id,
                updated_by_id=user.id,
            )

            issue_activity.delay(
                type="cycle.activity.created",
                requested_data=json.dumps({"cycles_list": list(str(issue_id))}),
                actor_id=str(user.id),
                issue_id=None,
                project_id=str(project_id),
                current_instance=json.dumps(
                    {
                        "updated_cycle_issues": [],
                        "created_cycle_issues": serializers.serialize(
                            "json", [created_cycle]
                        ),
                    }
                ),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=info.context.request.META.get("HTTP_ORIGIN"),
            )

        # creating the modules for the issue
        if module_ids and len(module_ids) > 0:
            await sync_to_async(
                lambda: ModuleIssue.objects.bulk_create(
                    [
                        ModuleIssue(
                            issue_id=issue_id,
                            module_id=module_id,
                            project_id=project_id,
                            workspace_id=workspace.id,
                            created_by_id=user.id,
                            updated_by_id=user.id,
                        )
                        for module_id in module_ids
                    ],
                    batch_size=10,
                    ignore_conflicts=True,
                )
            )()

            await sync_to_async(
                lambda: [
                    issue_activity.delay(
                        type="module.activity.created",
                        requested_data=json.dumps({"module_id": str(module_id)}),
                        actor_id=str(user.id),
                        issue_id=str(issue_id),
                        project_id=str(project_id),
                        current_instance=None,
                        epoch=int(timezone.now().timestamp()),
                        notification=True,
                        origin=info.context.request.META.get("HTTP_ORIGIN"),
                    )
                    for module_id in module_ids
                ]
            )()

        return issue

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
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
        user = info.context.user
        issue = await sync_to_async(Issue.objects.get)(id=id)

        issue_state_id = issue.state_id
        if state and str(issue_state_id) != str(state):
            is_feature_flagged = await validate_feature_flag(
                user_id=str(user.id),
                slug=slug,
                feature_key=FeatureFlagsTypesEnum.WORKFLOWS.value,
                default_value=False,
            )
            if is_feature_flagged:
                await validate_workflow_state_issue_update(
                    user_id=user.id,
                    slug=slug,
                    project_id=project,
                    current_state_id=issue.state_id,
                    new_state_id=state,
                )

        # activity tacking data
        current_issue_activity = await convert_issue_properties_to_activity_dict(issue)
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
        else:
            issue.start_date = None
            activity_payload["start_date"] = None

        if targetDate is not None:
            issue.target_date = targetDate
            activity_payload["target_date"] = targetDate.strftime("%Y-%m-%d")
        else:
            issue.target_date = None
            activity_payload["target_date"] = None

        workspace = await sync_to_async(Workspace.objects.get)(slug=slug)

        # updating the issue
        await sync_to_async(issue.save)()

        # creating or updating the assignees
        if assignees is not None:
            activity_payload["assignee_ids"] = assignees
            await sync_to_async(IssueAssignee.objects.filter(issue=issue).delete)()
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
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def deleteIssue(
        self, info: Info, slug: str, project: str, issue: str
    ) -> bool:
        issue = await sync_to_async(Issue.issue_objects.get)(
            id=issue, project_id=project, workspace__slug=slug
        )

        if issue.created_by_id != info.context.user.id:
            raise Exception("You are not authorized to delete this issue")

        # activity tracking data
        current_issue_activity = await convert_issue_properties_to_activity_dict(issue)
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
class IssueSubscriptionMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def subscribeIssue(
        self, info: Info, slug: str, project: strawberry.ID, issue: strawberry.ID
    ) -> bool:
        issue = await sync_to_async(IssueSubscriber.objects.create)(
            issue_id=issue, project_id=project, subscriber=info.context.user
        )
        return True

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectBasePermission()])]
    )
    async def unSubscribeIssue(
        self, info: Info, slug: str, project: strawberry.ID, issue: strawberry.ID
    ) -> bool:
        issue_subscriber = await sync_to_async(IssueSubscriber.objects.get)(
            issue_id=issue,
            subscriber=info.context.user,
            project_id=project,
            workspace__slug=slug,
        )
        await sync_to_async(issue_subscriber.delete)()
        return True
