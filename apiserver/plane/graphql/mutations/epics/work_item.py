# Python imports
import json

import strawberry
from asgiref.sync import sync_to_async
from django.core import serializers

# Django imports
from django.utils import timezone

# Strawberry imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module imports
from plane.db.models import CycleIssue, Issue, IssueAssignee, IssueLabel, ModuleIssue
from plane.graphql.bgtasks.issue_activity_task import issue_activity
from plane.graphql.helpers import (
    default_work_item_type,
    get_epic,
    get_project,
    get_project_default_state,
    get_workspace,
    is_epic_feature_flagged,
    is_project_epics_enabled,
    is_work_item_type_feature_flagged,
    is_workflow_create_allowed,
    is_workflow_feature_flagged,
)
from plane.graphql.permissions.project import ProjectMemberPermission
from plane.graphql.types.issues.base import IssueCreateInputType, IssuesType


@sync_to_async
def get_existing_work_items(work_item_ids):
    return list(Issue.issue_objects.filter(id__in=work_item_ids))


@sync_to_async
def bulk_update_work_items(work_items, fields):
    Issue.objects.bulk_update(work_items, fields, batch_size=10)


@strawberry.type
class EpicWorkItemsMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[ProjectMemberPermission()])]
    )
    async def create_epic_work_item(
        self,
        info: Info,
        slug: str,
        project: str,
        epic: str,
        issue_input: IssueCreateInputType,
    ) -> IssuesType:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the epic
        epic_details = await get_epic(
            workspace_slug=slug, project_id=project, epic_id=epic
        )
        epic_id = str(epic_details.id)

        # get the workspace
        workspace = await get_workspace(workspace_slug=slug)
        workspace_slug = workspace.slug
        workspace_id = str(workspace.id)

        # get the project
        project_details = await get_project(
            workspace_slug=workspace_slug, project_id=project
        )
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
            state = await get_project_default_state(
                workspace_slug=workspace_slug, project_id=project_id
            )
            issue_state_id = str(state.id)
            issue_payload["state_id"] = issue_state_id
        else:
            is_feature_flagged = await is_workflow_feature_flagged(
                user_id=user_id, workspace_slug=workspace_slug
            )
            if is_feature_flagged:
                await is_workflow_create_allowed(
                    user_id=user_id,
                    workspace_slug=workspace_slug,
                    project_id=project_id,
                    state_id=issue_state_id,
                )

        # get the issue default type
        issue_default_type_id = None
        work_item_type_feature_flagged = await is_work_item_type_feature_flagged(
            user_id=user_id, workspace_slug=workspace_slug
        )
        if work_item_type_feature_flagged:
            issue_type = await default_work_item_type(
                workspace_slug=workspace_slug, project_id=project_id
            )
            if issue_type is not None:
                issue_default_type_id = issue_type.id

        # create the issue
        issue = await sync_to_async(Issue.objects.create)(
            workspace_id=workspace_id,
            project_id=project_id,
            parent_id=epic_id,
            type_id=issue_default_type_id,
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
    async def add_existing_work_items(
        self, info: Info, slug: str, project: str, epic: str, work_item_ids: list[str]
    ) -> bool:
        user = info.context.user
        user_id = str(user.id)

        # Check if the epic feature flag is enabled for the workspace
        await is_epic_feature_flagged(user_id=user_id, workspace_slug=slug)

        # check if the epic is enabled for the project
        await is_project_epics_enabled(workspace_slug=slug, project_id=project)

        # get the epic
        epic_details = await get_epic(
            workspace_slug=slug, project_id=project, epic_id=epic
        )
        epic_id = str(epic_details.id)

        existing_work_items = await get_existing_work_items(work_item_ids)

        for work_item in existing_work_items:
            work_item.parent_id = epic_id
            work_item.updated_by_id = user_id

        await bulk_update_work_items(existing_work_items, ["parent", "updated_by"])

        _ = [
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps({"parent_id": str(epic_id)}),
                actor_id=str(info.context.user.id),
                issue_id=str(work_item_id),
                project_id=str(project),
                current_instance=json.dumps({"parent_id": None}),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=info.context.request.META.get("HTTP_ORIGIN"),
            )
            for work_item_id in work_item_ids
        ]

        return True
