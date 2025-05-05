# Python imports
import json
from typing import Optional

# Third-party imports
import strawberry
from asgiref.sync import sync_to_async

# Django imports
from django.core import serializers
from django.utils import timezone

# Strawberry imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import (
    CycleIssue,
    Issue,
    IssueAssignee,
    IssueLabel,
    IssueType,
    ModuleIssue,
    Project,
    State,
    Workspace,
)
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.permissions.project import ProjectMemberPermission
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.graphql.types.issues.base import (
    IssueCreateInputType,
    IssuesType,
    IssueUpdateInputType,
)
from plane.graphql.utils.feature_flag import validate_feature_flag
from plane.graphql.utils.issue_activity import convert_issue_properties_to_activity_dict
from plane.graphql.utils.workflow import WorkflowStateManager


@sync_to_async
def get_workspace(slug):
    try:
        return Workspace.objects.get(slug=slug)
    except Workspace.DoesNotExist:
        message = "Workspace not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_project(project_id):
    try:
        return Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        message = "Project not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_project_default_state(project_id):
    try:
        return State.objects.get(project_id=project_id, default=True)
    except State.DoesNotExist:
        message = "Default state not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_issue(issue_id):
    try:
        issue = Issue.objects.get(id=issue_id)
        return issue
    except Issue.DoesNotExist:
        message = "Issue not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


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
class IssueMutationV2:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def create_issue_v2(
        self, info: Info, slug: str, project: str, issue_input: IssueCreateInputType
    ) -> IssuesType:
        user = info.context.user
        user_id = str(user.id)

        workspace = await get_workspace(slug)
        workspace_slug = workspace.slug
        workspace_id = str(workspace.id)

        project_details = await get_project(project)
        project_id = str(project_details.id)

        issue_state_id = issue_input.state or None
        issue_labels = issue_input.labels or None
        issue_assignees = issue_input.assignees or None
        issue_cycle_id = issue_input.cycle_id or None
        issue_module_ids = issue_input.module_ids or None

        issue_payload = {
            k: v
            for k, v in {
                "name": issue_input.name,
                "description_html": issue_input.description_html,
                "priority": issue_input.priority,
                "start_date": issue_input.start_date,
                "target_date": issue_input.target_date,
                "state_id": issue_input.state,
                "parent_id": issue_input.parent,
                "estimate_point_id": issue_input.estimate_point,
            }.items()
            if v is not None
        }

        # if the state id is not passed, get the default state
        if issue_state_id is None:
            state = await get_project_default_state(project_id)
            issue_state_id = str(state.id)
            issue_payload["state_id"] = issue_state_id

        # validate the workflow if the project has workflows enabled
        if issue_state_id is not None:
            is_feature_flagged = await validate_feature_flag(
                user_id=user_id,
                slug=workspace_slug,
                feature_key=FeatureFlagsTypesEnum.WORKFLOWS.value,
                default_value=False,
            )
            if is_feature_flagged:
                await validate_workflow_state_issue_create(
                    user_id=user_id,
                    slug=workspace_slug,
                    project_id=project_id,
                    state_id=issue_state_id,
                )

        # validate the issue type if the project has issue types enabled
        issue_type_id = None
        is_feature_flagged = await validate_feature_flag(
            slug=workspace_slug,
            user_id=user_id,
            feature_key=FeatureFlagsTypesEnum.ISSUE_TYPES.value,
            default_value=False,
        )
        if is_feature_flagged:
            try:
                issue_type = await sync_to_async(IssueType.objects.get)(
                    workspace_id=workspace_id,
                    project_issue_types__project_id=project_id,
                    is_default=True,
                )
                if issue_type is not None:
                    issue_type_id = issue_type.id
            except IssueType.DoesNotExist:
                pass

        # create the issue
        issue = await sync_to_async(Issue.objects.create)(
            workspace_id=workspace_id,
            project_id=project_id,
            type_id=issue_type_id,
            **issue_payload,
        )
        issue_id = str(issue.id)

        # updating the assignees
        if issue_assignees is not None and len(issue_assignees) > 0:
            await sync_to_async(IssueAssignee.objects.bulk_create)(
                [
                    IssueAssignee(
                        workspace_id=workspace_id,
                        project_id=project_id,
                        issue_id=issue_id,
                        assignee_id=assignee,
                        created_by_id=user_id,
                        updated_by_id=user_id,
                    )
                    for assignee in issue_assignees
                ],
                batch_size=10,
            )

        # updating the labels
        if issue_labels is not None and len(issue_labels) > 0:
            await sync_to_async(IssueLabel.objects.bulk_create)(
                [
                    IssueLabel(
                        workspace_id=workspace_id,
                        project_id=project_id,
                        issue_id=issue_id,
                        label_id=label,
                        created_by_id=user_id,
                        updated_by_id=user_id,
                    )
                    for label in issue_labels
                ],
                batch_size=10,
            )

        # activity tacking data
        activity_payload = {}
        for key, value in issue_payload.items():
            if key == "estimate_point_id":
                activity_payload["estimate_point"] = value
            elif key in ("start_date", "target_date") and value is not None:
                activity_payload["start_date"] = value.strftime("%Y-%m-%d")
            else:
                activity_payload[key] = value
        if issue_labels is not None and len(issue_labels) > 0:
            activity_payload["label_ids"] = issue_labels
        if issue_assignees is not None and len(issue_assignees) > 0:
            activity_payload["assignee_ids"] = issue_assignees

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

        # creating the cycle and cycle activity with the cycle id
        if issue_cycle_id is not None:
            created_cycle = await sync_to_async(CycleIssue.objects.create)(
                workspace_id=workspace_id,
                project_id=project_id,
                issue_id=issue_id,
                cycle_id=issue_cycle_id,
                created_by_id=user_id,
                updated_by_id=user_id,
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

        # creating the modules and module activity with the module ids
        if issue_module_ids and len(issue_module_ids) > 0:
            await sync_to_async(
                lambda: ModuleIssue.objects.bulk_create(
                    [
                        ModuleIssue(
                            workspace_id=workspace_id,
                            project_id=project_id,
                            issue_id=issue_id,
                            module_id=module_id,
                            created_by_id=user_id,
                            updated_by_id=user_id,
                        )
                        for module_id in issue_module_ids
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
                    for module_id in issue_module_ids
                ]
            )()

        return issue

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def update_issue_v2(
        self,
        info: Info,
        slug: str,
        project: str,
        id: str,
        issue_input: Optional[IssueUpdateInputType] = None,
    ) -> IssuesType:
        user = info.context.user
        user_id = str(user.id)

        workspace = await get_workspace(slug)
        workspace_id = str(workspace.id)

        project_details = await get_project(project)
        project_id = str(project_details.id)

        provided_fields = {
            k: v
            for k, v in info.variable_values.get("issueInput", {}).items()
            if k in info.variable_values.get("issueInput", {})
        }

        # get the issue
        issue = await get_issue(issue_id=id)
        issue_id = str(issue.id)

        # get the current state id
        current_state_id = str(issue.state_id)

        # get the current issue activity
        current_issue_activity = await convert_issue_properties_to_activity_dict(issue)

        # activity tacking data
        current_activity_payload = {}
        activity_payload = {}

        if "name" in provided_fields and issue_input.name is not None:
            issue.name = provided_fields["name"]
            activity_payload["name"] = provided_fields["name"]
            current_activity_payload["name"] = current_issue_activity["name"]

        if "descriptionHtml" in provided_fields:
            issue.description_html = provided_fields["descriptionHtml"]
            activity_payload["description_html"] = provided_fields["descriptionHtml"]
            current_activity_payload["description_html"] = current_issue_activity[
                "description_html"
            ]

        if "priority" in provided_fields:
            issue.priority = provided_fields["priority"]
            activity_payload["priority"] = provided_fields["priority"]
            current_activity_payload["priority"] = current_issue_activity["priority"]

        if "startDate" in provided_fields:
            if issue_input.start_date is not None:
                issue.start_date = issue_input.start_date
                activity_payload["start_date"] = issue_input.start_date.strftime(
                    "%Y-%m-%d"
                )
                current_activity_payload["start_date"] = current_issue_activity[
                    "start_date"
                ]
            else:
                issue.start_date = None
                activity_payload["start_date"] = None
                current_activity_payload["start_date"] = current_issue_activity[
                    "start_date"
                ]

        if "targetDate" in provided_fields:
            if issue_input.target_date is not None:
                issue.target_date = issue_input.target_date
                activity_payload["target_date"] = issue_input.target_date.strftime(
                    "%Y-%m-%d"
                )
                current_activity_payload["target_date"] = current_issue_activity[
                    "target_date"
                ]
            else:
                issue.target_date = None
                activity_payload["target_date"] = None
                current_activity_payload["target_date"] = current_issue_activity[
                    "target_date"
                ]

        if "state" in provided_fields:
            issue.state_id = provided_fields["state"]
            activity_payload["state_id"] = provided_fields["state"]
            current_activity_payload["state_id"] = current_issue_activity["state_id"]

        if "parent" in provided_fields:
            issue.parent_id = provided_fields["parent"]
            activity_payload["parent_id"] = provided_fields["parent"]
            current_activity_payload["parent_id"] = current_issue_activity["parent_id"]

        if "estimate_point" in provided_fields:
            issue.estimate_point_id = provided_fields["estimate_point"]
            activity_payload["estimate_point"] = provided_fields["estimate_point"]
            current_activity_payload["estimate_point"] = current_issue_activity[
                "estimate_point"
            ]

        # validate the workflow if the project has workflows enabled
        state_id = provided_fields["state"] if "state" in provided_fields else None
        if state_id:
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
                    current_state_id=current_state_id,
                    new_state_id=state_id,
                )

        # updating the issue
        await sync_to_async(issue.save)()

        # creating or updating the assignees
        assignees = (
            provided_fields["assignees"] if "assignees" in provided_fields else None
        )
        if assignees is not None:
            current_activity_payload["assignee_ids"] = current_issue_activity[
                "assignee_ids"
            ]
            activity_payload["assignee_ids"] = assignees

            await sync_to_async(
                IssueAssignee.objects.filter(issue_id=issue_id).delete
            )()
            if len(assignees) > 0:
                await sync_to_async(IssueAssignee.objects.bulk_create)(
                    [
                        IssueAssignee(
                            workspace_id=workspace_id,
                            project_id=project_id,
                            issue_id=issue_id,
                            assignee_id=assignee,
                            created_by_id=user_id,
                            updated_by_id=user_id,
                        )
                        for assignee in assignees
                    ],
                    batch_size=10,
                )

        # creating or updating the labels
        labels = provided_fields["labels"] if "labels" in provided_fields else None
        if labels is not None:
            current_activity_payload["label_ids"] = current_issue_activity["label_ids"]
            activity_payload["label_ids"] = labels

            await sync_to_async(IssueLabel.objects.filter(issue_id=issue_id).delete)()
            if len(labels) > 0:
                await sync_to_async(IssueLabel.objects.bulk_create)(
                    [
                        IssueLabel(
                            workspace_id=workspace_id,
                            project_id=project_id,
                            issue_id=issue_id,
                            label_id=label,
                            created_by_id=user_id,
                            updated_by_id=user_id,
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
            project_id=project_id,
            issue_id=issue_id,
            actor_id=user_id,
            current_instance=json.dumps(current_activity_payload),
            requested_data=json.dumps(activity_payload),
        )

        return issue
