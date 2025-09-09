# Python imports
import json
from typing import Optional

# Third-party imports
import strawberry

# Django imports
from asgiref.sync import sync_to_async
from django.utils import timezone

# Strawberry imports
from strawberry.exceptions import GraphQLError
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import IntakeIssue, Issue, IssueAssignee, IssueLabel
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.helpers import (
    default_work_item_type,
    get_intake_async,
    get_intake_work_item_async,
    get_project,
    get_project_default_state,
    get_project_member,
    get_workspace,
    is_project_intakes_enabled_async,
    is_project_settings_enabled_by_settings_key_async,
    is_project_workflow_enabled,
    is_workflow_create_allowed,
    is_workflow_feature_flagged,
    is_workflow_update_allowed,
)
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.project import ProjectPermission, Roles
from plane.graphql.types.intake.base import (
    IntakeSettingsType,
    IntakeSourceType,
    IntakeWorkItemCreateInputType,
    IntakeWorkItemType,
    IntakeWorkItemUpdateInputType,
)
from plane.graphql.utils.issue_activity import convert_issue_properties_to_activity_dict


@strawberry.type
class IntakeWorkItemMutation:
    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[
                    ProjectPermission([Roles.ADMIN, Roles.MEMBER, Roles.GUEST])
                ]
            )
        ]
    )
    async def create_intake_work_item(
        self,
        info: Info,
        slug: str,
        project: str,
        work_item_input: IntakeWorkItemCreateInputType,
    ) -> IntakeWorkItemType:
        user = info.context.user
        user_id = str(user.id)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = workspace.slug
        workspace_id = str(workspace.id)

        # get the project
        project_details = await get_project(
            workspace_slug=workspace_slug, project_id=project
        )
        project_id = str(project_details.id)

        # check if the intake is enabled for the project
        await is_project_intakes_enabled_async(
            workspace_slug=workspace_slug, project_id=project_id
        )

        # check if the intake is enabled for the project
        intake_in_app_enabled = await is_project_settings_enabled_by_settings_key_async(
            workspace_slug=workspace_slug,
            project_id=project_id,
            settings_key=IntakeSettingsType.IN_APP,
        )
        if not intake_in_app_enabled:
            message = "Intake in app is not enabled"
            extensions = {"code": "INTAKE_IN_APP_NOT_ENABLED", "statusCode": 400}
            raise GraphQLError(message, extensions=extensions)

        # get the intake
        intake = await get_intake_async(
            workspace_slug=workspace_slug, project_id=project_id
        )
        intake_id = str(intake.id)

        work_item_state_id = work_item_input.state or None
        work_item_labels = work_item_input.labels or None
        work_item_assignees = work_item_input.assignees or None

        # check if the workflow is enabled for the project and the state is not passed
        if work_item_state_id is None:
            state = await get_project_default_state(
                workspace_slug=workspace_slug, project_id=project_id
            )
            work_item_state_id = str(state.id)
        else:
            workflow_feature_flagged = await is_workflow_feature_flagged(
                user_id=user_id, workspace_slug=workspace_slug
            )
            if workflow_feature_flagged:
                project_workflow_enabled = await is_project_workflow_enabled(
                    workspace_slug=workspace_slug, project_id=project_id
                )
                if project_workflow_enabled:
                    await is_workflow_create_allowed(
                        workspace_slug=workspace_slug,
                        project_id=project_id,
                        user_id=user_id,
                        state_id=work_item_state_id,
                    )

        # get the issue type
        work_item_type = await default_work_item_type(
            workspace_slug=slug, project_id=project
        )
        work_item_type_id = str(work_item_type.id) if work_item_type else None

        work_item_payload = {
            k: v
            for k, v in {
                "name": work_item_input.name,
                "description_html": work_item_input.description_html,
                "priority": work_item_input.priority,
                "target_date": work_item_input.target_date,
                "state_id": work_item_state_id or work_item_input.state,
            }.items()
            if v is not None
        }

        # create the intake work item
        work_item = await sync_to_async(Issue.objects.create)(
            workspace_id=workspace_id,
            project_id=project_id,
            type_id=work_item_type_id,
            created_by_id=user_id,
            updated_by_id=user_id,
            **work_item_payload,
        )
        work_item_id = str(work_item.id)

        # create the intake work item
        intake_work_item = await sync_to_async(IntakeIssue.objects.create)(
            workspace_id=workspace_id,
            project_id=project_id,
            intake_id=intake_id,
            issue_id=work_item_id,
            created_by_id=user_id,
            updated_by_id=user_id,
            source=IntakeSourceType.IN_APP.value,
        )

        # updating the assignees
        if work_item_assignees is not None and len(work_item_assignees) > 0:
            await sync_to_async(IssueAssignee.objects.bulk_create)(
                [
                    IssueAssignee(
                        workspace_id=workspace_id,
                        project_id=project_id,
                        issue_id=work_item_id,
                        assignee_id=assignee,
                        created_by_id=user_id,
                        updated_by_id=user_id,
                    )
                    for assignee in work_item_assignees
                ],
                batch_size=10,
            )

        # updating the labels
        if work_item_labels is not None and len(work_item_labels) > 0:
            await sync_to_async(IssueLabel.objects.bulk_create)(
                [
                    IssueLabel(
                        workspace_id=workspace_id,
                        project_id=project_id,
                        issue_id=work_item_id,
                        label_id=label,
                        created_by_id=user_id,
                        updated_by_id=user_id,
                    )
                    for label in work_item_labels
                ],
                batch_size=10,
            )

        # activity tacking data
        activity_payload = {}
        for key, value in work_item_payload.items():
            if key in ("target_date") and value is not None:
                activity_payload[key] = value.strftime("%Y-%m-%d")
            else:
                activity_payload[key] = value
        if work_item_labels is not None and len(work_item_labels) > 0:
            activity_payload["label_ids"] = work_item_labels
        if work_item_assignees is not None and len(work_item_assignees) > 0:
            activity_payload["assignee_ids"] = work_item_assignees

        # Track the issue activity
        await sync_to_async(issue_activity.delay)(
            type="issue.activity.created",
            origin=info.context.request.META.get("HTTP_ORIGIN"),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            project_id=str(project),
            issue_id=str(work_item_id),
            actor_id=str(user.id),
            current_instance=None,
            requested_data=json.dumps(activity_payload),
        )

        return intake_work_item

    @strawberry.mutation(
        extensions=[
            PermissionExtension(
                permissions=[
                    ProjectPermission([Roles.ADMIN, Roles.MEMBER, Roles.GUEST])
                ]
            )
        ]
    )
    async def update_intake_work_item(
        self,
        info: Info,
        slug: str,
        project: str,
        intake_work_item: str,
        work_item_input: Optional[IntakeWorkItemUpdateInputType] = None,
    ) -> IntakeWorkItemType:
        user = info.context.user
        user_id = str(user.id)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = workspace.slug
        workspace_id = str(workspace.id)

        # get the project
        project_details = await get_project(
            workspace_slug=workspace_slug, project_id=project
        )
        project_id = str(project_details.id)

        # check if the intake is enabled for the project
        await is_project_intakes_enabled_async(
            workspace_slug=workspace_slug, project_id=project_id
        )

        # intake
        intake_work_item_id = intake_work_item
        intake_work_item = await get_intake_work_item_async(
            workspace_slug=workspace_slug,
            project_id=project_id,
            intake_work_item_id=intake_work_item_id,
        )
        work_item_id = str(intake_work_item.issue_id)
        intake_work_item_created_by_id = str(intake_work_item.created_by_id)

        # check if the intake workitem is created in app
        if intake_work_item.source != IntakeSourceType.IN_APP.value:
            message = "Intake work item is not created in app"
            error_extensions = {
                "code": "INTAKE_WORK_ITEM_NOT_CREATED_IN_APP",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)

        # project member check
        current_user_role = None
        project_member = await get_project_member(
            workspace_slug=workspace_slug,
            project_id=project_id,
            user_id=user_id,
            raise_exception=False,
        )
        if not project_member:
            project_teamspace_filter = await project_member_filter_via_teamspaces_async(
                user_id=user_id,
                workspace_slug=workspace_slug,
            )
            teamspace_project_ids = project_teamspace_filter.teamspace_project_ids
            if project_id not in teamspace_project_ids:
                message = "You are not allowed to access this project"
                error_extensions = {"code": "FORBIDDEN", "statusCode": 403}
                raise GraphQLError(message, extensions=error_extensions)
            current_user_role = Roles.MEMBER.value
        else:
            current_user_role = project_member.role

        if current_user_role in [Roles.GUEST.value, Roles.MEMBER.value]:
            if intake_work_item_created_by_id != user_id:
                message = "You are not allowed to access this intake work item"
                error_extensions = {"code": "FORBIDDEN", "statusCode": 403}
                raise GraphQLError(message, extensions=error_extensions)

        provided_fields = {
            k: v
            for k, v in info.variable_values.get("workItemInput", {}).items()
            if k in info.variable_values.get("workItemInput", {})
        }

        # get the intake work item
        work_item = await sync_to_async(Issue.objects.get)(id=work_item_id)

        # get the current intake work item activity
        current_intake_work_item_activity = (
            await convert_issue_properties_to_activity_dict(work_item)
        )

        # activity tacking data
        current_activity_payload = {}
        activity_payload = {}

        if "name" in provided_fields and work_item_input.name is not None:
            work_item.name = provided_fields["name"]
            activity_payload["name"] = provided_fields["name"]
            current_activity_payload["name"] = current_intake_work_item_activity["name"]

        if "descriptionHtml" in provided_fields:
            work_item.description_html = provided_fields["descriptionHtml"]
            activity_payload["description_html"] = provided_fields["descriptionHtml"]
            current_activity_payload["description_html"] = (
                current_intake_work_item_activity["description_html"]
            )

        if "priority" in provided_fields:
            work_item.priority = provided_fields["priority"]
            activity_payload["priority"] = provided_fields["priority"]
            current_activity_payload["priority"] = current_intake_work_item_activity[
                "priority"
            ]

        if "targetDate" in provided_fields:
            if work_item_input.target_date is not None:
                work_item.target_date = work_item_input.target_date
                activity_payload["target_date"] = work_item_input.target_date.strftime(
                    "%Y-%m-%d"
                )
                current_activity_payload["target_date"] = (
                    current_intake_work_item_activity["target_date"]
                )
            else:
                work_item.target_date = None
                activity_payload["target_date"] = None
                current_activity_payload["target_date"] = (
                    current_intake_work_item_activity["target_date"]
                )

        if "state" in provided_fields:
            work_item.state_id = provided_fields["state"]
            activity_payload["state_id"] = provided_fields["state"]
            current_activity_payload["state_id"] = current_intake_work_item_activity[
                "state_id"
            ]

        if "parent" in provided_fields:
            work_item.parent_id = provided_fields["parent"]
            activity_payload["parent_id"] = provided_fields["parent"]
            current_activity_payload["parent_id"] = current_intake_work_item_activity[
                "parent_id"
            ]

        # validate the workflow if the project has workflows enabled
        state_id = provided_fields["state"] if "state" in provided_fields else None
        if state_id:
            workflow_enabled = await is_workflow_feature_flagged(
                workspace_slug=workspace_slug, user_id=user_id
            )
            if workflow_enabled:
                await is_workflow_update_allowed(
                    workspace_slug=workspace_slug,
                    project_id=project_id,
                    user_id=user_id,
                    current_state_id=work_item.state_id,
                    new_state_id=state_id,
                )

        # updating the intake work item
        work_item.updated_by_id = user_id
        await sync_to_async(work_item.save)()

        # creating or updating the assignees
        assignees = (
            provided_fields["assignees"] if "assignees" in provided_fields else None
        )
        if assignees is not None:
            activity_payload["assignee_ids"] = assignees
            current_activity_payload["assignee_ids"] = (
                current_intake_work_item_activity["assignee_ids"]
            )

            await sync_to_async(IssueAssignee.objects.filter(issue=work_item).delete)()
            if len(assignees) > 0:
                await sync_to_async(IssueAssignee.objects.bulk_create)(
                    [
                        IssueAssignee(
                            workspace_id=workspace_id,
                            project_id=project_id,
                            issue_id=work_item_id,
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
            activity_payload["label_ids"] = labels
            current_activity_payload["label_ids"] = current_intake_work_item_activity[
                "label_ids"
            ]

            await sync_to_async(IssueLabel.objects.filter(issue=work_item).delete)()
            if len(labels) > 0:
                await sync_to_async(IssueLabel.objects.bulk_create)(
                    [
                        IssueLabel(
                            workspace_id=workspace_id,
                            project_id=project_id,
                            issue_id=work_item_id,
                            label_id=label,
                            created_by_id=user_id,
                            updated_by_id=user_id,
                        )
                        for label in labels
                    ],
                    batch_size=10,
                )

        # Track the intake work item activity
        issue_activity.delay(
            type="issue.activity.updated",
            origin=info.context.request.META.get("HTTP_ORIGIN"),
            epoch=int(timezone.now().timestamp()),
            notification=True,
            project_id=str(project),
            issue_id=str(work_item.id),
            actor_id=str(info.context.user.id),
            current_instance=json.dumps(current_intake_work_item_activity),
            requested_data=json.dumps(activity_payload),
        )

        return intake_work_item

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectPermission([Roles.ADMIN])])]
    )
    async def delete_intake_work_item(
        self, info: Info, slug: str, project: str, intake_work_item: str
    ) -> bool:
        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = workspace.slug

        # get the project
        project_details = await get_project(
            workspace_slug=workspace_slug, project_id=project
        )
        project_id = str(project_details.id)

        # check if the intake is enabled for the project
        await is_project_intakes_enabled_async(
            workspace_slug=workspace_slug, project_id=project_id
        )

        intake_work_item = await get_intake_work_item_async(
            workspace_slug=workspace_slug,
            project_id=project_id,
            intake_work_item_id=intake_work_item,
        )

        if intake_work_item:
            if intake_work_item.status in [-2, -1, 0, 2]:
                work_item_id = str(intake_work_item.issue_id)
                await sync_to_async(Issue.objects.filter(id=work_item_id).delete)()
            await sync_to_async(intake_work_item.delete)()
        else:
            message = "Intake work item not found"
            error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)

        return True
