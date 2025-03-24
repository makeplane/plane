# Python imports
import json

# Third Party imports
from celery import shared_task

# Module imports
from plane.db.models import Workspace, User
from plane.ee.models import (
    WorkflowTransitionActivity,
)
from plane.utils.exception_logger import log_exception


def create_workflow_transition_activity(
    requested_data,
    current_instance,
    workflow_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    workflow_activities.append(
        WorkflowTransitionActivity(
            workflow_id=workflow_id,
            project_id=project_id,
            actor_id=actor_id,
            verb="added",
            old_value=None,
            new_value=requested_data.get("transition_state_id"),
            field="state_transition",
            workspace_id=workspace_id,
            comment="added the state transition",
            old_identifier=None,
            new_identifier=requested_data.get("transition_state_id"),
            epoch=epoch,
        )
    )


def update_workflow_transition_activity(
    requested_data,
    current_instance,
    workflow_id,
    workspace_id,
    project_id,
    actor_id,
    workflow_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    requested_data = json.loads(requested_data) if requested_data is not None else None
    workflow_activities.append(
        WorkflowTransitionActivity(
            workflow_id=workflow_id,
            actor_id=actor_id,
            verb=(
                "enabled" if requested_data.get("allow_issue_creation") else "disabled"
            ),
            old_value=current_instance.get("allow_issue_creation"),
            new_value=requested_data.get("allow_issue_creation"),
            field="allow_work_item_creation",
            workspace_id=workspace_id,
            project_id=project_id,
            comment="",
            old_identifier=None,
            new_identifier=None,
            epoch=epoch,
        )
    )


def delete_workflow_transition_activity(
    requested_data,
    current_instance,
    workflow_id,
    workspace_id,
    project_id,
    actor_id,
    workflow_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    workflow_activities.append(
        WorkflowTransitionActivity(
            workflow_id=workflow_id,
            actor_id=actor_id,
            verb="removed",
            old_value=current_instance.get("transition_state_id"),
            new_value=None,
            field="state_transition",
            workspace_id=workspace_id,
            project_id=project_id,
            comment="added the state transition",
            old_identifier=current_instance.get("transition_state_id"),
            new_identifier=None,
            epoch=epoch,
        )
    )


# Track changes in issue assignees
def update_workflow_approver_activity(
    requested_data,
    current_instance,
    workflow_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    added_approvers = (
        requested_data.get("added_approver_ids", None) if requested_data else []
    )
    removed_approvers = (
        requested_data.get("removed_approver_ids", None) if requested_data else []
    )
    if added_approvers is not None:
        added_approvers = User.objects.filter(pk__in=added_approvers).values(
            "display_name", "id"
        )
        for approver in added_approvers:
            workflow_activities.append(
                WorkflowTransitionActivity(
                    workflow_id=workflow_id,
                    actor_id=actor_id,
                    verb="added",
                    old_value="",
                    new_value=approver["display_name"],
                    field="state_transition_approver",
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment="added approver ",
                    new_identifier=approver["id"],
                    epoch=epoch,
                )
            )

    if removed_approvers is not None:
        removed_approvers = User.objects.filter(pk__in=removed_approvers).values(
            "display_name", "id"
        )
        for approver in removed_approvers:
            workflow_activities.append(
                WorkflowTransitionActivity(
                    workflow_id=workflow_id,
                    actor_id=actor_id,
                    verb="removed",
                    old_value=approver["display_name"],
                    new_value="",
                    field="state_transition_approver",
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment="removed approver ",
                    old_identifier=approver["id"],
                    epoch=epoch,
                )
            )


def reset_workflow(
    requested_data,
    current_instance,
    workflow_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    workflow_activities.append(
        WorkflowTransitionActivity(
            workflow_id=workflow_id,
            actor_id=actor_id,
            verb="updated",
            old_value=None,
            new_value="",
            field="reset",
            project_id=project_id,
            workspace_id=workspace_id,
            comment="reset the workflow",
            old_identifier=None,
            epoch=epoch,
        )
    )


def enable_workflow_transition(
    requested_data,
    current_instance,
    workflow_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    requested_data = json.loads(requested_data) if requested_data is not None else None
    workflow_activities.append(
        WorkflowTransitionActivity(
            workflow_id=workflow_id,
            actor_id=actor_id,
            verb=(
                "enabled" if requested_data.get("is_workflow_enabled") else "disabled"
            ),
            old_value=current_instance.get("is_workflow_enabled"),
            new_value=requested_data.get("is_workflow_enabled"),
            field="is_workflow_enabled",
            workspace_id=workspace_id,
            project_id=project_id,
            comment="",
            old_identifier=None,
            new_identifier=None,
            epoch=epoch,
        )
    )


# Receive message from room group
@shared_task
def workflow_activity(
    type,
    requested_data,
    current_instance,
    workflow_id,
    project_id,
    actor_id,
    slug,
    epoch,
):
    try:
        workflow_activities = []

        workspace = Workspace.objects.get(slug=slug)

        ACTIVITY_MAPPER = {
            "workflow_transition.activity.created": create_workflow_transition_activity,
            "workflow_transition.activity.updated": update_workflow_transition_activity,
            "workflow_transition.activity.deleted": delete_workflow_transition_activity,
            "workflow_approver.activity.updated": update_workflow_approver_activity,
            "workflow_reset.activity.updated": reset_workflow,
            "workflow_transition_enable.activity.updated": enable_workflow_transition,
        }

        func = ACTIVITY_MAPPER.get(type)
        if func is not None:
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                workflow_id=workflow_id,
                workspace_id=workspace.id,
                actor_id=actor_id,
                project_id=project_id,
                workflow_activities=workflow_activities,
                epoch=epoch,
            )

        # Save all the values to database
        _ = WorkflowTransitionActivity.objects.bulk_create(workflow_activities)

        return
    except Exception as e:
        log_exception(e)
        return
