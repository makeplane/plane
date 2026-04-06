# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import json

# Third Party imports
from celery import shared_task

# Module imports
from plane.db.models import Workspace, User, IssueType, State
from plane.ee.models import (
    WorkflowTransitionActivity,
)
from plane.utils.exception_logger import log_exception
from plane.utils.uuid import is_valid_uuid


def extract_ids(data: dict | None, primary_key: str, fallback_key: str) -> set[str]:
    if not data:
        return set()
    if primary_key in data:
        return {str(x) for x in data.get(primary_key, [])}
    return {str(x) for x in data.get(fallback_key, [])}


class WorkflowActivityEnum:
    # workflow
    RESET = "reset"
    WORKFLOW = "workflow"
    WORKFLOW_TYPE = "workflow_type"
    WORKFLOW_NAME = "workflow_name"
    WORKFLOW_STATE = "workflow_state"
    WORKFLOW_DESCRIPTION = "workflow_description"
    WORKFLOW_IS_ACTIVE = "workflow_is_active"
    WORKFLOW_WORK_ITEM_TYPE = "workflow_work_item_type"
    IS_WORKFLOW_ENABLED = "is_workflow_enabled"
    ALLOW_WORK_ITEM_CREATION = "allow_work_item_creation"

    # transition
    STATE_TRANSITION = "state_transition"
    STATE_APPROVAL = "state_approvers"

    # approval
    APPROVED_STATE = "approved_state"
    REJECTED_STATE = "rejected_state"
    STATE_APPROVAL_APPROVERS = "state_approval_approver"

    # transfer
    WORKFLOW_STATE_TRANSFERRED = "workflow_state_transferred"


def create_workflow_activity(
    requested_data,
    current_instance,
    workflow_id,
    workflow_state_id,
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
            verb="created",
            old_value=None,
            new_value=None,
            field=WorkflowActivityEnum.WORKFLOW,
            workspace_id=workspace_id,
            comment="created the workflow",
            old_identifier=None,
            new_identifier=workflow_id,
            epoch=epoch,
        )
    )


def delete_workflow_activity(
    requested_data,
    current_instance,
    workflow_id,
    workflow_state_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    current_instance = json.loads(current_instance) if current_instance is not None else {}
    workflow_activities.append(
        WorkflowTransitionActivity(
            workflow_id=workflow_id,
            project_id=project_id,
            actor_id=actor_id,
            verb="deleted",
            old_value=current_instance.get("name"),
            new_value=None,
            field=WorkflowActivityEnum.WORKFLOW,
            workspace_id=workspace_id,
            comment="deleted the workflow",
            old_identifier=None,
            new_identifier=None,
            epoch=epoch,
        )
    )


def create_workflow_transition_activity(
    requested_data,
    current_instance,
    workflow_id,
    workflow_state_id,
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
            workflow_state_id=workflow_state_id,
            project_id=project_id,
            actor_id=actor_id,
            verb="added",
            old_value=None,
            new_value=requested_data.get("transition_state_id"),
            field=WorkflowActivityEnum.STATE_TRANSITION,
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
    workflow_state_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = json.loads(current_instance) if current_instance is not None else None

    if not requested_data:
        return

    new_transition_state = requested_data.get("transition_state_id")
    old_transition_state = current_instance.get("transition_state_id") if current_instance else None
    new_rejection_state = requested_data.get("rejection_state_id")
    old_rejection_state = current_instance.get("rejection_state_id") if current_instance else None

    if new_transition_state and new_transition_state != old_transition_state:
        workflow_activities.append(
            WorkflowTransitionActivity(
                workflow_id=workflow_id,
                workflow_state_id=workflow_state_id,
                project_id=project_id,
                actor_id=actor_id,
                verb="updated",
                old_value=old_transition_state,
                new_value=new_transition_state,
                field=WorkflowActivityEnum.STATE_TRANSITION,
                workspace_id=workspace_id,
                comment="updated the state transition",
                old_identifier=old_transition_state,
                new_identifier=new_transition_state,
                epoch=epoch,
            )
        )

    if new_rejection_state and new_rejection_state != old_rejection_state:
        workflow_activities.append(
            WorkflowTransitionActivity(
                workflow_id=workflow_id,
                workflow_state_id=workflow_state_id,
                project_id=project_id,
                actor_id=actor_id,
                verb="updated",
                old_value=old_rejection_state,
                new_value=new_rejection_state,
                field=WorkflowActivityEnum.REJECTED_STATE,
                workspace_id=workspace_id,
                comment="updated the rejection state",
                old_identifier=old_rejection_state,
                new_identifier=new_rejection_state,
                epoch=epoch,
            )
        )


def delete_workflow_transition_activity(
    requested_data,
    current_instance,
    workflow_state_id,
    workspace_id,
    workflow_id,
    project_id,
    actor_id,
    workflow_activities,
    epoch,
):
    current_instance = json.loads(current_instance) if current_instance is not None else None
    workflow_activities.append(
        WorkflowTransitionActivity(
            workflow_id=workflow_id,
            workflow_state_id=workflow_state_id,
            actor_id=actor_id,
            verb="removed",
            old_value=current_instance.get("transition_state_id"),
            new_value=None,
            field=WorkflowActivityEnum.STATE_TRANSITION,
            workspace_id=workspace_id,
            project_id=project_id,
            comment="removed the state transition",
            old_identifier=current_instance.get("transition_state_id"),
            new_identifier=None,
            epoch=epoch,
        )
    )


# Track changes in issue assignees
def update_workflow_approver_activity(
    requested_data,
    current_instance,
    workflow_state_id,
    project_id,
    workspace_id,
    workflow_id,
    actor_id,
    workflow_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    added_approvers = requested_data.get("added_approver_ids", None) if requested_data else []
    removed_approvers = requested_data.get("removed_approver_ids", None) if requested_data else []
    if added_approvers is not None:
        added_approvers = User.objects.filter(pk__in=added_approvers).values("display_name", "id")
        for approver in added_approvers:
            workflow_activities.append(
                WorkflowTransitionActivity(
                    workflow_id=workflow_id,
                    workflow_state_id=workflow_state_id,
                    actor_id=actor_id,
                    verb="added",
                    old_value="",
                    new_value=approver["display_name"],
                    field=WorkflowActivityEnum.STATE_APPROVAL,
                    project_id=project_id,
                    workspace_id=workspace_id,
                    comment="added approver ",
                    new_identifier=approver["id"],
                    epoch=epoch,
                )
            )

    if removed_approvers is not None:
        removed_approvers = User.objects.filter(pk__in=removed_approvers).values("display_name", "id")
        for approver in removed_approvers:
            workflow_activities.append(
                WorkflowTransitionActivity(
                    workflow_state_id=workflow_state_id,
                    workflow_id=workflow_id,
                    actor_id=actor_id,
                    verb="removed",
                    old_value=approver["display_name"],
                    new_value="",
                    field=WorkflowActivityEnum.STATE_APPROVAL,
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
    workflow_state_id,
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
            workflow_state_id=workflow_state_id,
            actor_id=actor_id,
            verb="updated",
            old_value=None,
            new_value="",
            field=WorkflowActivityEnum.RESET,
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
    workflow_state_id,
    workflow_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    current_instance = json.loads(current_instance) if current_instance is not None else None
    requested_data = json.loads(requested_data) if requested_data is not None else None
    workflow_activities.append(
        WorkflowTransitionActivity(
            workflow_id=workflow_id,
            workflow_state_id=workflow_state_id,
            actor_id=actor_id,
            verb=("enabled" if requested_data.get("is_workflow_enabled") else "disabled"),
            old_value=current_instance.get("is_workflow_enabled"),
            new_value=requested_data.get("is_workflow_enabled"),
            field=WorkflowActivityEnum.IS_WORKFLOW_ENABLED,
            workspace_id=workspace_id,
            project_id=project_id,
            comment="",
            old_identifier=None,
            new_identifier=None,
            epoch=epoch,
        )
    )


# Track Changes in name
def track_name(
    requested_data,
    current_instance,
    workflow_id,
    workflow_state_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    if current_instance.get("name") != requested_data.get("name"):
        workflow_activities.append(
            WorkflowTransitionActivity(
                workflow_id=workflow_id,
                project_id=project_id,
                workspace_id=workspace_id,
                workflow_state_id=workflow_state_id,
                actor_id=actor_id,
                verb="updated",
                old_value=current_instance.get("name"),
                new_value=requested_data.get("name"),
                field=WorkflowActivityEnum.WORKFLOW_NAME,
                comment="updated the name to",
                old_identifier=None,
                new_identifier=None,
                epoch=epoch,
            )
        )


def track_description(
    requested_data,
    current_instance,
    workflow_id,
    workflow_state_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    if current_instance.get("description") != requested_data.get("description"):
        workflow_activities.append(
            WorkflowTransitionActivity(
                workflow_id=workflow_id,
                project_id=project_id,
                workspace_id=workspace_id,
                workflow_state_id=workflow_state_id,
                actor_id=actor_id,
                verb="updated",
                old_value=None,
                new_value=None,
                field=WorkflowActivityEnum.WORKFLOW_DESCRIPTION,
                comment="updated the description to",
                old_identifier=None,
                new_identifier=None,
                epoch=epoch,
            )
        )


def track_is_active(
    requested_data,
    current_instance,
    workflow_id,
    workflow_state_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    if current_instance.get("is_active") != requested_data.get("is_active"):
        workflow_activities.append(
            WorkflowTransitionActivity(
                workflow_id=workflow_id,
                workflow_state_id=workflow_state_id,
                actor_id=actor_id,
                project_id=project_id,
                workspace_id=workspace_id,
                verb="updated",
                old_value=True if current_instance.get("is_active") else False,
                new_value=True if requested_data.get("is_active") else False,
                field=WorkflowActivityEnum.WORKFLOW_IS_ACTIVE,
                comment="updated the is active to",
                old_identifier=None,
                new_identifier=None,
                epoch=epoch,
            )
        )


# Track changes in workflow work item type ids
def track_work_item_type_ids(
    requested_data,
    current_instance,
    workflow_id,
    workflow_state_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    # Assignees
    requested_work_item_type_ids = extract_ids(requested_data, "work_item_type_ids", "work_item_types")
    current_work_item_type_ids = extract_ids(current_instance, "work_item_type_ids", "work_item_types")

    added_work_item_type_ids = requested_work_item_type_ids - current_work_item_type_ids
    dropped_work_item_type_ids = current_work_item_type_ids - requested_work_item_type_ids

    for added_work_item_type_id in added_work_item_type_ids:
        # validate uuids
        if not is_valid_uuid(added_work_item_type_id):
            continue

        work_item_type = IssueType.objects.get(pk=added_work_item_type_id)
        workflow_activities.append(
            WorkflowTransitionActivity(
                workflow_id=workflow_id,
                project_id=project_id,
                workflow_state_id=workflow_state_id,
                actor_id=actor_id,
                verb="added",
                old_value=None,
                new_value=work_item_type.name,
                field=WorkflowActivityEnum.WORKFLOW_WORK_ITEM_TYPE,
                workspace_id=workspace_id,
                comment="added work item type ",
                new_identifier=work_item_type.id,
                epoch=epoch,
            )
        )

    for dropped_work_item_type_id in dropped_work_item_type_ids:
        # validate uuids
        if not is_valid_uuid(dropped_work_item_type_id):
            continue

        work_item_type = IssueType.objects.get(pk=dropped_work_item_type_id)
        workflow_activities.append(
            WorkflowTransitionActivity(
                workflow_id=workflow_id,
                workflow_state_id=workflow_state_id,
                actor_id=actor_id,
                verb="removed",
                old_value=work_item_type.name,
                new_value="",
                field=WorkflowActivityEnum.WORKFLOW_WORK_ITEM_TYPE,
                project_id=project_id,
                workspace_id=workspace_id,
                comment="removed assignee ",
                old_identifier=work_item_type.id,
                epoch=epoch,
            )
        )


def update_workflow_state_transition_activity(
    requested_data,
    current_instance,
    workflow_id,
    workflow_state_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    ISSUE_ACTIVITY_MAPPER = {
        "name": track_name,
        "description": track_description,
        "is_active": track_is_active,
        "work_item_type_ids": track_work_item_type_ids,
    }

    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = json.loads(current_instance) if current_instance is not None else None

    for key in requested_data:
        func = ISSUE_ACTIVITY_MAPPER.get(key)
        if func is not None:
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                workflow_id=workflow_id,
                workflow_state_id=workflow_state_id,
                project_id=project_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                workflow_activities=workflow_activities,
                epoch=epoch,
            )


def create_workflow_state_activity(
    requested_data,
    current_instance,
    workflow_id,
    workflow_state_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = json.loads(current_instance) if current_instance is not None else None

    requested_state_ids = extract_ids(requested_data, "state_ids", "state_ids")
    current_state_ids = extract_ids(current_instance, "state_ids", "state_ids")

    added_state_ids = requested_state_ids - current_state_ids

    for added_state_id in added_state_ids:
        if not is_valid_uuid(added_state_id):
            continue

        state = State.objects.filter(pk=added_state_id).values("name", "id").first()
        if not state:
            continue

        workflow_activities.append(
            WorkflowTransitionActivity(
                workflow_id=workflow_id,
                workflow_state_id=workflow_state_id,
                project_id=project_id,
                actor_id=actor_id,
                verb="added",
                old_value=None,
                new_value=state["name"],
                field=WorkflowActivityEnum.WORKFLOW_STATE,
                workspace_id=workspace_id,
                comment="added state to workflow",
                old_identifier=None,
                new_identifier=state["id"],
                epoch=epoch,
            )
        )


def update_workflow_state_activity(
    requested_data,
    current_instance,
    workflow_id,
    workflow_state_id,
    workspace_id,
    project_id,
    actor_id,
    workflow_activities,
    epoch,
):
    current_instance = json.loads(current_instance) if current_instance is not None else {}
    requested_data = json.loads(requested_data) if requested_data is not None else {}

    if "allow_issue_creation" in requested_data:
        if current_instance.get("allow_issue_creation") != requested_data.get("allow_issue_creation"):
            workflow_activities.append(
                WorkflowTransitionActivity(
                    workflow_id=workflow_id,
                    workflow_state_id=workflow_state_id,
                    actor_id=actor_id,
                    verb=("enabled" if requested_data.get("allow_issue_creation") else "disabled"),
                    old_value=current_instance.get("allow_issue_creation"),
                    new_value=requested_data.get("allow_issue_creation"),
                    field=WorkflowActivityEnum.ALLOW_WORK_ITEM_CREATION,
                    workspace_id=workspace_id,
                    project_id=project_id,
                    comment="",
                    old_identifier=None,
                    new_identifier=None,
                    epoch=epoch,
                )
            )

    if "type" in requested_data:
        if current_instance.get("type") != requested_data.get("type"):
            workflow_activities.append(
                WorkflowTransitionActivity(
                    workflow_id=workflow_id,
                    workflow_state_id=workflow_state_id,
                    actor_id=actor_id,
                    verb="updated",
                    old_value=current_instance.get("type"),
                    new_value=requested_data.get("type"),
                    field=WorkflowActivityEnum.WORKFLOW_TYPE,
                    workspace_id=workspace_id,
                    project_id=project_id,
                    comment="",
                    old_identifier=None,
                    new_identifier=None,
                    epoch=epoch,
                )
            )


def delete_workflow_state_activity(
    requested_data,
    current_instance,
    workflow_id,
    workflow_state_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    current_instance = json.loads(current_instance) if current_instance is not None else None

    state_id = current_instance.get("state_id") if current_instance else None
    state_name = None
    if state_id and is_valid_uuid(str(state_id)):
        state = State.objects.filter(pk=state_id).values("name").first()
        state_name = state["name"] if state else None

    workflow_activities.append(
        WorkflowTransitionActivity(
            workflow_id=workflow_id,
            workflow_state_id=workflow_state_id,
            project_id=project_id,
            actor_id=actor_id,
            verb="removed",
            old_value=state_name,
            new_value=None,
            field=WorkflowActivityEnum.WORKFLOW_STATE,
            workspace_id=workspace_id,
            comment="removed state from workflow",
            old_identifier=state_id,
            new_identifier=None,
            epoch=epoch,
        )
    )


def create_workflow_state_transferred_activity(
    requested_data,
    current_instance,
    workflow_id,
    workflow_state_id,
    project_id,
    workspace_id,
    actor_id,
    workflow_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else {}
    current_instance = json.loads(current_instance) if current_instance is not None else {}

    old_state_id = current_instance.get("state_id")
    new_state_id = requested_data.get("new_state_id")
    affected_count = requested_data.get("affected_count", 0)

    old_state = State.objects.filter(pk=old_state_id).values("name", "id").first() if old_state_id else None
    new_state = State.objects.filter(pk=new_state_id).values("name", "id").first() if new_state_id else None

    workflow_activities.append(
        WorkflowTransitionActivity(
            workflow_id=workflow_id,
            workflow_state_id=workflow_state_id,
            project_id=project_id,
            actor_id=actor_id,
            verb="updated",
            old_value=old_state["name"] if old_state else None,
            new_value=new_state["name"] if new_state else None,
            field=WorkflowActivityEnum.WORKFLOW_STATE_TRANSFERRED,
            workspace_id=workspace_id,
            comment=str(affected_count),
            old_identifier=old_state["id"] if old_state else None,
            new_identifier=new_state["id"] if new_state else None,
            epoch=epoch,
        )
    )


# Receive message from room group
@shared_task
def workflow_activity(
    type,
    requested_data,
    current_instance,
    workflow_state_id,
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
            "workflow.activity.created": create_workflow_activity,
            "workflow.activity.updated": update_workflow_state_transition_activity,
            "workflow.activity.deleted": delete_workflow_activity,
            "workflow_state.activity.created": create_workflow_state_activity,
            "workflow_state.activity.updated": update_workflow_state_activity,
            "workflow_state.activity.deleted": delete_workflow_state_activity,
            "workflow_transition.activity.created": create_workflow_transition_activity,
            "workflow_transition.activity.updated": update_workflow_transition_activity,
            "workflow_transition.activity.deleted": delete_workflow_transition_activity,
            "workflow_approver.activity.updated": update_workflow_approver_activity,
            "workflow_reset.activity.updated": reset_workflow,
            "workflow_transition_enable.activity.updated": enable_workflow_transition,
            "workflow_state.activity.transferred": create_workflow_state_transferred_activity,
        }

        func = ACTIVITY_MAPPER.get(type)
        if func is not None:
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                workflow_state_id=workflow_state_id,
                workspace_id=workspace.id,
                actor_id=actor_id,
                project_id=project_id,
                workflow_activities=workflow_activities,
                workflow_id=workflow_id,
                epoch=epoch,
            )

        # Save all the values to database
        _ = WorkflowTransitionActivity.objects.bulk_create(workflow_activities)

        return
    except Exception as e:
        log_exception(e)
        return
