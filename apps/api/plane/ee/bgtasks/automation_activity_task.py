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
import logging

# Third Party imports
from celery import shared_task

# Module imports
from plane.db.models import Workspace
from plane.ee.models import (
    AutomationActivity,
    Automation,
)
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")


def create_automation_activity(
    requested_data,
    current_instance,
    automation,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    logger.debug("Recording create activity for automation=%s", automation.id)
    requested_data = json.loads(requested_data) if requested_data is not None else None
    automation_activities.append(
        AutomationActivity(
            automation=automation,
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
    actor_id,
    automation_activities,
    epoch,
):
    logger.debug("Recording delete activity for automation=%s", automation.id)
    current_instance = json.loads(current_instance) if current_instance is not None else None
    automation_activities.append(
        AutomationActivity(
            automation=automation,
            actor_id=actor_id,
            verb="deleted",
            field="automation",
            workspace_id=workspace_id,
            epoch=epoch,
        )
    )


def track_automation_field_change(
    field_name,
    requested_data,
    current_instance,
    automation,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    """Generic function to track changes in any field"""
    old_val = current_instance.get(field_name)
    new_val = requested_data.get(field_name)

    if isinstance(old_val, list) and isinstance(new_val, list):
        old_val = set(old_val)
        new_val = set(new_val)
        logger.debug(
            "Field '%s' changed for automation=%s: %s -> %s",
            field_name, automation.id, old_val, new_val,
        )
        added_items = new_val - old_val
        dropped_items = old_val - new_val

        # Create separate activity entries for added and dropped items in the list
        if added_items:
            automation_activities.extend(
                [
                    AutomationActivity(
                        automation=automation,
                        actor_id=actor_id,
                        verb="added",
                        field=field_name,
                        workspace_id=workspace_id,
                        new_value=added_item,
                        epoch=epoch,
                    )
                    for added_item in added_items
                ]
            )

        # Create separate activity entries for removed items in the list
        if dropped_items:
            automation_activities.extend(
                [
                    AutomationActivity(
                        automation=automation,
                        actor_id=actor_id,
                        verb="removed",
                        field=field_name,
                        workspace_id=workspace_id,
                        old_value=dropped_item,
                        epoch=epoch,
                    )
                    for dropped_item in dropped_items
                ]
            )

    else:
        if old_val != new_val:
            logger.debug(
                "Field '%s' changed for automation=%s: %s -> %s",
                field_name, automation.id, old_val, new_val,
            )
            automation_activities.append(
                AutomationActivity(
                    automation=automation,
                    actor_id=actor_id,
                    verb="updated",
                    field=field_name,
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
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    # List of fields to track for changes
    TRACKED_FIELDS = [
        "name",
        "description",
        "status",
        "scope",
        "is_enabled",
        "project_ids",
    ]

    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = json.loads(current_instance) if current_instance is not None else None

    logger.debug(
        "Tracking update activity for automation=%s, fields in request: %s",
        automation.id, list(requested_data.keys()) if requested_data else [],
    )

    # Track changes for each field present in the requested data
    for field_name in requested_data:
        if field_name in TRACKED_FIELDS:
            track_automation_field_change(
                field_name=field_name,
                requested_data=requested_data,
                current_instance=current_instance,
                automation=automation,
                workspace_id=workspace_id,
                actor_id=actor_id,
                automation_activities=automation_activities,
                epoch=epoch,
            )


def create_automation_node_activity(
    requested_data,
    current_instance,
    automation,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    logger.debug(
        "Recording node create activity for automation=%s node_id=%s node_type=%s",
        automation.id, requested_data.get("id"), requested_data.get("node_type"),
    )

    automation_activities.append(
        AutomationActivity(
            automation=automation,
            automation_node_id=requested_data.get("id"),
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
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    if current_instance.get(field_name) != requested_data.get(field_name):
        logger.debug(
            "Node field '%s' changed for automation=%s node_id=%s: %s -> %s",
            field_name, automation.id, current_instance.get("id"),
            current_instance.get(field_name), requested_data.get(field_name),
        )
        automation_activities.append(
            AutomationActivity(
                automation=automation,
                automation_node_id=current_instance.get("id"),
                actor_id=actor_id,
                verb="updated",
                field=f"automation.node.{current_instance.get('node_type')}.{field_name}",
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
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    TRACKED_FIELDS = ["name", "node_type", "is_enabled", "handler_name", "config"]

    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = json.loads(current_instance) if current_instance is not None else None

    logger.debug(
        "Tracking node update activity for automation=%s node_id=%s, fields in request: %s",
        automation.id, current_instance.get("id") if current_instance else None,
        list(requested_data.keys()) if requested_data else [],
    )

    for field_name in requested_data:
        if field_name in TRACKED_FIELDS:
            track_automation_node_field_change(
                field_name=field_name,
                requested_data=requested_data,
                current_instance=current_instance,
                automation=automation,
                workspace_id=workspace_id,
                actor_id=actor_id,
                automation_activities=automation_activities,
                epoch=epoch,
            )


def delete_automation_node_activity(
    requested_data,
    current_instance,
    automation,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    logger.debug(
        "Recording node delete activity for automation=%s node_id=%s node_type=%s",
        automation.id, requested_data.get("id"), requested_data.get("node_type"),
    )
    automation_activities.append(
        AutomationActivity(
            automation=automation,
            automation_node_id=requested_data.get("id"),
            actor_id=actor_id,
            verb="deleted",
            field=f"automation.node.{requested_data.get('node_type')}",
            workspace_id=workspace_id,
            epoch=epoch,
        )
    )


def create_automation_edge_activity(
    requested_data,
    current_instance,
    automation,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    logger.debug("Recording edge create activity for automation=%s", automation.id)
    automation_activities.append(
        AutomationActivity(
            automation=automation,
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
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    if current_instance.get(field_name) != requested_data.get(field_name):
        logger.debug(
            "Edge field '%s' changed for automation=%s: %s -> %s",
            field_name, automation.id,
            current_instance.get(field_name), requested_data.get(field_name),
        )
        automation_activities.append(
            AutomationActivity(
                automation=automation,
                automation_edge_id=requested_data.get("id"),
                actor_id=actor_id,
                verb="updated",
                field=f"edge.{field_name}",
                workspace_id=workspace_id,
                old_value=current_instance.get(field_name),
                new_value=requested_data.get(field_name),
                old_identifier=(
                    current_instance.get(field_name) if field_name in ["target_node", "source_node"] else None
                ),
                new_identifier=(
                    requested_data.get(field_name) if field_name in ["target_node", "source_node"] else None
                ),
                epoch=epoch,
            )
        )


def update_automation_edge_activity(
    requested_data,
    current_instance,
    automation,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    TRACKED_FIELDS = ["target_node", "source_node", "execution_order"]
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = json.loads(current_instance) if current_instance is not None else None

    logger.debug(
        "Tracking edge update activity for automation=%s, fields in request: %s",
        automation.id, list(requested_data.keys()) if requested_data else [],
    )

    for field_name in requested_data:
        if field_name in TRACKED_FIELDS:
            track_automation_edge_field_change(
                field_name=field_name,
                requested_data=requested_data,
                current_instance=current_instance,
                automation=automation,
                workspace_id=workspace_id,
                actor_id=actor_id,
                automation_activities=automation_activities,
                epoch=epoch,
            )


def delete_automation_edge_activity(
    requested_data,
    current_instance,
    automation,
    workspace_id,
    actor_id,
    automation_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    logger.debug(
        "Recording edge delete activity for automation=%s edge_id=%s",
        automation.id, requested_data.get("id"),
    )
    automation_activities.append(
        AutomationActivity(
            automation=automation,
            automation_edge_id=requested_data.get("id"),
            actor_id=actor_id,
            verb="deleted",
            field="automation.edge",
            workspace_id=workspace_id,
            epoch=epoch,
        )
    )


@shared_task
def automation_activity(
    type,
    requested_data,
    current_instance,
    automation_id,
    actor_id,
    slug,
    epoch,
):
    try:
        logger.info(
            "Processing automation activity: type=%s automation_id=%s actor_id=%s slug=%s",
            type, automation_id, actor_id, slug,
        )

        automation_activities = []

        logger.debug("Fetching automation %s", automation_id)
        automation = Automation.all_objects.get(id=automation_id)

        logger.debug("Fetching workspace with slug=%s", slug)
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
            logger.debug("Dispatching to handler for type=%s", type)
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                automation=automation,
                workspace_id=workspace.id,
                actor_id=actor_id,
                automation_activities=automation_activities,
                epoch=epoch,
            )
        else:
            logger.info("No handler found for activity type=%s, skipping", type)

        # Save all the values to database
        if automation_activities:
            _ = AutomationActivity.objects.bulk_create(automation_activities)
            logger.info(
                "Saved %d automation activity records for automation_id=%s",
                len(automation_activities), automation_id,
            )
        else:
            logger.info("No activity records to save for automation_id=%s", automation_id)

        return
    except Exception as e:
        logger.error(
            "Failed to process automation activity: type=%s automation_id=%s error=%s",
            type, automation_id, str(e),
        )
        log_exception(e)
        return
