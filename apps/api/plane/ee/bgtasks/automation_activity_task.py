# Python imports
import json

# Third Party imports
from celery import shared_task

# Module imports
from plane.db.models import Workspace
from plane.ee.models import (
    AutomationActivity,
    Automation,
)
from plane.utils.exception_logger import log_exception


def create_automation_activity(
    requested_data,
    current_instance,
    automation,
    project_id,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    automation_activities.append(
        AutomationActivity(
            automation=automation,
            project_id=project_id,
            automation_version=automation.current_version,
            actor_id=actor_id,
            verb="created",
            field="automation",
            workspace_id=workspace_id,
            epoch=epoch,
        )
    )


def delete_automation_activity(
    requested_data,
    current_instance,
    automation,
    workspace_id,
    project_id,
    actor_id,
    automation_activities,
    epoch,
):
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )
    automation_activities.append(
        AutomationActivity(
            automation=automation,
            actor_id=actor_id,
            verb="deleted",
            field="automation",
            workspace_id=workspace_id,
            project_id=project_id,
            epoch=epoch,
        )
    )


def track_automation_field_change(
    field_name,
    requested_data,
    current_instance,
    automation,
    project_id,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    """Generic function to track changes in any field"""
    if current_instance.get(field_name) != requested_data.get(field_name):
        automation_activities.append(
            AutomationActivity(
                automation=automation,
                actor_id=actor_id,
                verb="updated",
                field=field_name,
                project_id=project_id,
                workspace_id=workspace_id,
                old_value=current_instance.get(field_name),
                new_value=requested_data.get(field_name),
                epoch=epoch,
            )
        )


def update_automation_activity(
    requested_data,
    current_instance,
    automation,
    project_id,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    # List of fields to track for changes
    TRACKED_FIELDS = ["name", "description", "status", "scope", "is_enabled"]

    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    # Track changes for each field present in the requested data
    for field_name in requested_data:
        if field_name in TRACKED_FIELDS:
            track_automation_field_change(
                field_name=field_name,
                requested_data=requested_data,
                current_instance=current_instance,
                automation=automation,
                project_id=project_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                automation_activities=automation_activities,
                epoch=epoch,
            )


def create_automation_node_activity(
    requested_data,
    current_instance,
    automation,
    project_id,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None

    automation_activities.append(
        AutomationActivity(
            automation=automation,
            automation_node_id=requested_data.get("id"),
            project_id=project_id,
            automation_version=automation.current_version,
            actor_id=actor_id,
            verb="created",
            field=f"automation.node.{requested_data.get('node_type')}",
            workspace_id=workspace_id,
            epoch=epoch,
        )
    )


def track_automation_node_field_change(
    field_name,
    requested_data,
    current_instance,
    automation,
    project_id,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    if current_instance.get(field_name) != requested_data.get(field_name):
        automation_activities.append(
            AutomationActivity(
                automation=automation,
                automation_node_id=current_instance.get("id"),
                actor_id=actor_id,
                verb="updated",
                field=f"automation.node.{current_instance.get('node_type')}.{field_name}",
                project_id=project_id,
                workspace_id=workspace_id,
                old_value=current_instance.get(field_name),
                new_value=requested_data.get(field_name),
                epoch=epoch,
            )
        )


def update_automation_node_activity(
    requested_data,
    current_instance,
    automation,
    project_id,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    TRACKED_FIELDS = ["name", "node_type", "is_enabled", "handler_name", "config"]

    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    for field_name in requested_data:
        if field_name in TRACKED_FIELDS:
            track_automation_node_field_change(
                field_name=field_name,
                requested_data=requested_data,
                current_instance=current_instance,
                automation=automation,
                project_id=project_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                automation_activities=automation_activities,
                epoch=epoch,
            )


def delete_automation_node_activity(
    requested_data,
    current_instance,
    automation,
    project_id,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    automation_activities.append(
        AutomationActivity(
            automation=automation,
            automation_node_id=requested_data.get("id"),
            actor_id=actor_id,
            verb="deleted",
            field=f"automation.node.{requested_data.get('node_type')}",
            workspace_id=workspace_id,
            project_id=project_id,
            epoch=epoch,
        )
    )


def create_automation_edge_activity(
    requested_data,
    current_instance,
    automation,
    project_id,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    automation_activities.append(
        AutomationActivity(
            automation=automation,
            project_id=project_id,
            automation_version=automation.current_version,
            actor_id=actor_id,
            verb="created",
            field="automation.edge",
            workspace_id=workspace_id,
            epoch=epoch,
        )
    )


def track_automation_edge_field_change(
    field_name,
    requested_data,
    current_instance,
    automation,
    project_id,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    if current_instance.get(field_name) != requested_data.get(field_name):
        automation_activities.append(
            AutomationActivity(
                automation=automation,
                automation_edge_id=requested_data.get("id"),
                actor_id=actor_id,
                verb="updated",
                field=f"edge.{field_name}",
                project_id=project_id,
                workspace_id=workspace_id,
                old_value=current_instance.get(field_name),
                new_value=requested_data.get(field_name),
                old_identifier=(
                    current_instance.get(field_name)
                    if field_name in ["target_node", "source_node"]
                    else None
                ),
                new_identifier=(
                    requested_data.get(field_name)
                    if field_name in ["target_node", "source_node"]
                    else None
                ),
                epoch=epoch,
            )
        )


def update_automation_edge_activity(
    requested_data,
    current_instance,
    automation,
    project_id,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    TRACKED_FIELDS = ["target_node", "source_node", "execution_order"]
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    for field_name in requested_data:
        if field_name in TRACKED_FIELDS:
            track_automation_edge_field_change(
                field_name=field_name,
                requested_data=requested_data,
                current_instance=current_instance,
                automation=automation,
                project_id=project_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                automation_activities=automation_activities,
                epoch=epoch,
            )


def delete_automation_edge_activity(
    requested_data,
    current_instance,
    automation,
    project_id,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    automation_activities.append(
        AutomationActivity(
            automation=automation,
            automation_edge_id=requested_data.get("id"),
            actor_id=actor_id,
            verb="deleted",
            field="automation.edge",
            workspace_id=workspace_id,
            project_id=project_id,
            epoch=epoch,
        )
    )


@shared_task
def automation_activity(
    type,
    requested_data,
    current_instance,
    automation_id,
    project_id,
    actor_id,
    slug,
    epoch,
):
    try:
        automation_activities = []

        automation = Automation.all_objects.get(id=automation_id)

        workspace = Workspace.objects.get(slug=slug)

        ACTIVITY_MAPPER = {
            "automation.activity.created": create_automation_activity,
            "automation.activity.updated": update_automation_activity,
            "automation.activity.deleted": delete_automation_activity,
            "automation.node.activity.created": create_automation_node_activity,
            "automation.node.activity.updated": update_automation_node_activity,
            "automation.node.activity.deleted": delete_automation_node_activity,
            "automation.edge.activity.created": create_automation_edge_activity,
            "automation.edge.activity.updated": update_automation_edge_activity,
            "automation.edge.activity.deleted": delete_automation_edge_activity,
        }

        func = ACTIVITY_MAPPER.get(type)
        if func is not None:
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                automation=automation,
                workspace_id=workspace.id,
                actor_id=actor_id,
                project_id=project_id,
                automation_activities=automation_activities,
                epoch=epoch,
            )

        # Save all the values to database
        _ = AutomationActivity.objects.bulk_create(automation_activities)

        return
    except Exception as e:
        log_exception(e)
        return
