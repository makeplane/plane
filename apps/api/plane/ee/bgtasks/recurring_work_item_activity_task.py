# Python imports
import json

# Django imports
from django.utils import timezone

# Third Party imports
from celery import shared_task


# Module imports
from plane.db.models import (
    Project,
    User,
    Label,
    Module,
)
from plane.utils.exception_logger import log_exception
from plane.utils.uuid import is_valid_uuid
from plane.ee.models import RecurringWorkItemTaskActivity
from plane.ee.bgtasks.recurring_work_item_property import (
    recurring_work_item_property_activity,
)


def create_recurring_workitem_activity(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    actor_id,
    workspace_id,
    recurring_work_item_activities,
    epoch,
):
    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    recurring_work_item_activities.append(
        RecurringWorkItemTaskActivity(
            recurring_workitem_task_id=recurring_workitem_task_id,
            project_id=project_id,
            actor_id=actor_id,
            epoch=epoch,
            verb="created",
            workspace_id=workspace_id,
            field="recurring_workitem",
            old_value=None,
            new_value=None,
        )
    )


def track_start_at(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    actor_id,
    workspace_id,
    recurring_work_item_activities,
    epoch,
):
    if requested_data.get("start_at") != current_instance.get("start_at"):
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                project_id=project_id,
                recurring_workitem_task_id=recurring_workitem_task_id,
                actor_id=actor_id,
                epoch=epoch,
                workspace_id=workspace_id,
                verb="updated",
                field="start_at",
                old_value=current_instance.get("start_at"),
                new_value=requested_data.get("start_at"),
            )
        )


def track_interval_type(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    actor_id,
    workspace_id,
    recurring_work_item_activities,
    epoch,
):
    if requested_data.get("interval_type") != current_instance.get("interval_type"):
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                recurring_workitem_task_id=recurring_workitem_task_id,
                project_id=project_id,
                actor_id=actor_id,
                epoch=epoch,
                workspace_id=workspace_id,
                verb="updated",
                field="interval_type",
                old_value=current_instance.get("interval_type"),
                new_value=requested_data.get("interval_type"),
            )
        )


def track_end_at(
    requested_data,
    recurring_workitem_task_id,
    current_instance,
    project_id,
    workspace_id,
    actor_id,
    recurring_work_item_activities,
    epoch,
):
    if requested_data.get("end_at") != current_instance.get("end_at"):
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                recurring_workitem_task_id=recurring_workitem_task_id,
                project_id=project_id,
                actor_id=actor_id,
                epoch=epoch,
                workspace_id=workspace_id,
                verb="updated",
                field="end_at",
                old_value=current_instance.get("end_at"),
                new_value=requested_data.get("end_at"),
            )
        )


def track_name(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    workspace_id,
    actor_id,
    recurring_work_item_activities,
    epoch,
):
    if requested_data.get("name") != current_instance.get("name"):
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                recurring_workitem_task_id=recurring_workitem_task_id,
                project_id=project_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                epoch=epoch,
                verb="updated",
                field="name",
                old_value=current_instance.get("name"),
                new_value=requested_data.get("name"),
            )
        )


def track_priority(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    workspace_id,
    actor_id,
    recurring_work_item_activities,
    epoch,
):

    if requested_data.get("priority") != current_instance.get("priority"):
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                recurring_workitem_task_id=recurring_workitem_task_id,
                project_id=project_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                epoch=epoch,
                verb="updated",
                field="priority",
                old_value=current_instance.get("priority"),
                new_value=requested_data.get("priority"),
            )
        )


def track_state(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    workspace_id,
    actor_id,
    recurring_work_item_activities,
    epoch,
):

    if requested_data.get("state").get("id") != current_instance.get("state").get("id"):
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                recurring_workitem_task_id=recurring_workitem_task_id,
                project_id=project_id,
                workspace_id=workspace_id,
                actor_id=actor_id,
                epoch=epoch,
                verb="updated",
                field="state",
                old_value=current_instance.get("state").get("name"),
                new_value=requested_data.get("state").get("name"),
                old_identifier=current_instance.get("state").get("id"),
                new_identifier=requested_data.get("state").get("id"),
            )
        )


def track_assignees(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    workspace_id,
    actor_id,
    recurring_work_item_activities,
    epoch,
):
    # Get assignee IDs from both requested and current data
    requested_assignees = (
        set([str(asg.get("id")) for asg in requested_data.get("assignees", [])])
        if requested_data is not None
        else set()
    )
    current_assignees = (
        set([str(asg.get("id")) for asg in current_instance.get("assignees", [])])
        if current_instance is not None
        else set()
    )

    added_assignees = requested_assignees - current_assignees
    dropped_assginees = current_assignees - requested_assignees

    for added_assignee in added_assignees:
        # validate uuids
        if not is_valid_uuid(added_assignee):
            continue

        assignee = User.objects.get(pk=added_assignee)
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                recurring_workitem_task_id=recurring_workitem_task_id,
                actor_id=actor_id,
                verb="added",
                old_value="",
                new_value=assignee.display_name,
                field="assignees",
                project_id=project_id,
                workspace_id=workspace_id,
                new_identifier=assignee.id,
                epoch=epoch,
            )
        )

    for dropped_assignee in dropped_assginees:
        # validate uuids
        if not is_valid_uuid(dropped_assignee):
            continue

        assignee = User.objects.get(pk=dropped_assignee)
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                recurring_workitem_task_id=recurring_workitem_task_id,
                actor_id=actor_id,
                verb="removed",
                old_value=assignee.display_name,
                new_value="",
                field="assignees",
                project_id=project_id,
                workspace_id=workspace_id,
                old_identifier=assignee.id,
                epoch=epoch,
            )
        )


def track_labels(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    workspace_id,
    actor_id,
    recurring_work_item_activities,
    epoch,
):
    # Get label IDs from both requested and current data
    requested_labels = (
        set([str(lbl.get("id")) for lbl in requested_data.get("labels", [])])
        if requested_data is not None
        else set()
    )
    current_labels = (
        set([str(lbl.get("id")) for lbl in current_instance.get("labels", [])])
        if current_instance is not None
        else set()
    )

    added_labels = requested_labels - current_labels
    dropped_labels = current_labels - requested_labels

    for added_label in added_labels:
        # validate uuids
        if not is_valid_uuid(added_label):
            continue

        label = Label.objects.get(pk=added_label)
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                recurring_workitem_task_id=recurring_workitem_task_id,
                actor_id=actor_id,
                verb="added",
                old_value="",
                new_value=label.name,
                field="labels",
                project_id=project_id,
                workspace_id=workspace_id,
                new_identifier=label.id,
                epoch=epoch,
            )
        )

    for dropped_label in dropped_labels:
        # validate uuids
        if not is_valid_uuid(dropped_label):
            continue

        label = Label.objects.get(pk=dropped_label)
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                recurring_workitem_task_id=recurring_workitem_task_id,
                actor_id=actor_id,
                verb="removed",
                old_value=label.name,
                new_value="",
                field="labels",
                project_id=project_id,
                workspace_id=workspace_id,
                old_identifier=label.id,
                epoch=epoch,
            )
        )


def track_modules(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    workspace_id,
    actor_id,
    recurring_work_item_activities,
    epoch,
):
    # Get label IDs from both requested and current data
    requested_modules = (
        set([str(lbl.get("id")) for lbl in requested_data.get("modules", [])])
        if requested_data is not None
        else set()
    )
    current_modules = (
        set([str(lbl.get("id")) for lbl in current_instance.get("modules", [])])
        if current_instance is not None
        else set()
    )

    added_modules = requested_modules - current_modules
    dropped_modules = current_modules - requested_modules

    for added_module in added_modules:
        # validate uuids
        if not is_valid_uuid(added_module):
            continue

        module = Module.objects.get(pk=added_module)
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                recurring_workitem_task_id=recurring_workitem_task_id,
                actor_id=actor_id,
                verb="added",
                old_value="",
                new_value=module.name,
                field="modules",
                project_id=project_id,
                workspace_id=workspace_id,
                new_identifier=module.id,
                epoch=epoch,
            )
        )

    for dropped_module in dropped_modules:
        # validate uuids
        if not is_valid_uuid(dropped_module):
            continue

        module = Module.objects.get(pk=dropped_module)
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                recurring_workitem_task_id=recurring_workitem_task_id,
                actor_id=actor_id,
                verb="removed",
                old_value=module.name,
                new_value="",
                field="modules",
                project_id=project_id,
                workspace_id=workspace_id,
                old_identifier=module.id,
                epoch=epoch,
            )
        )


def track_type(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    workspace_id,
    actor_id,
    recurring_work_item_activities,
    epoch,
):

    if requested_data.get("type").get("id") != current_instance.get("type").get("id"):
        new_type_id = (
            requested_data.get("type").get("id") if requested_data.get("type") else None
        )
        old_type_id = (
            current_instance.get("type").get("id")
            if current_instance.get("type")
            else None
        )
        new_type_name = (
            requested_data.get("type").get("name")
            if requested_data.get("type")
            else None
        )
        old_type_name = (
            current_instance.get("type").get("name")
            if current_instance.get("type")
            else None
        )
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                project_id=project_id,
                workspace_id=workspace_id,
                recurring_workitem_task_id=recurring_workitem_task_id,
                actor_id=actor_id,
                epoch=epoch,
                verb="updated",
                field="type",
                old_value=old_type_name,
                new_value=new_type_name,
                old_identifier=old_type_id,
                new_identifier=new_type_id,
            )
        )


def track_parent(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    workspace_id,
    actor_id,
    recurring_work_item_activities,
    epoch,
):
    if requested_data.get("parent") != current_instance.get("parent"):
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                project_id=project_id,
                workspace_id=workspace_id,
                recurring_workitem_task_id=recurring_workitem_task_id,
                actor_id=actor_id,
                epoch=epoch,
                verb="updated",
                field="parent",
                old_value=current_instance.get("parent"),
                new_value=requested_data.get("parent"),
            )
        )


# Track issue description
def track_description_html(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    workspace_id,
    actor_id,
    recurring_work_item_activities,
    epoch,
):
    if current_instance.get("description_html") != requested_data.get(
        "description_html"
    ):
        recurring_work_item_activities.append(
            RecurringWorkItemTaskActivity(
                recurring_workitem_task_id=recurring_workitem_task_id,
                actor_id=actor_id,
                verb="updated",
                old_value=None,
                new_value=None,
                field="description",
                project_id=project_id,
                workspace_id=workspace_id,
                epoch=epoch,
            )
        )


def track_properties(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    workspace_id,
    actor_id,
    recurring_work_item_activities,
    epoch,
):

    # Handle both dictionary and list formats for properties
    requested_properties_data = requested_data.get("properties", [])
    current_properties_data = current_instance.get("properties", [])
    requested_values = {}

    # Convert properties to the expected dictionary format
    if isinstance(requested_properties_data, list):
        requested_values = {
            str(prop.get("id")): prop.get("values", [])
            for prop in requested_properties_data
            if prop.get("id")
        }

    if isinstance(current_properties_data, list):
        current_values = {
            str(prop.get("id")): prop.get("values", [])
            for prop in current_properties_data
            if prop.get("id")
        }

    # Log the activity
    recurring_work_item_property_activity.delay(
        existing_values=current_values,
        requested_values=requested_values,
        recurring_workitem_task_id=recurring_workitem_task_id,
        user_id=actor_id,
        epoch=int(timezone.now().timestamp()),
    )


def delete_recurring_workitem_activity(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    workspace_id,
    actor_id,
    recurring_work_item_activities,
    epoch,
):
    recurring_work_item_activities.append(
        RecurringWorkItemTaskActivity(
            project_id=project_id,
            workspace_id=workspace_id,
            recurring_workitem_task_id=recurring_workitem_task_id,
            actor_id=actor_id,
            epoch=epoch,
            verb="deleted",
            field="recurring_workitem",
            old_value=None,
            new_value=None,
        )
    )


def update_recurring_workitem_activity(
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    project_id,
    workspace_id,
    actor_id,
    recurring_work_item_activities,
    epoch,
):

    requested_data = json.loads(requested_data) if requested_data is not None else None
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    RECURRING_WORKITEM_TEMPLATE_ACTIVITY_MAPPER = {
        "name": track_name,
        "priority": track_priority,
        "description_html": track_description_html,
        "state": track_state,
        "assignees": track_assignees,
        "labels": track_labels,
        "type": track_type,
        "parent": track_parent,
        "modules": track_modules,
        "properties": track_properties,
    }

    RECURRING_WORKITEM_ACTIVITY_MAPPER = {
        "start_at": track_start_at,
        "end_at": track_end_at,
        "interval_type": track_interval_type,
    }

    if requested_data.get("workitem_blueprint") is not None:

        for key in requested_data.get("workitem_blueprint", {}).keys():

            func = RECURRING_WORKITEM_TEMPLATE_ACTIVITY_MAPPER.get(key)
            if func is not None:
                func(
                    requested_data=requested_data.get("workitem_blueprint"),
                    current_instance=current_instance.get("workitem_blueprint"),
                    recurring_workitem_task_id=recurring_workitem_task_id,
                    project_id=project_id,
                    workspace_id=workspace_id,
                    actor_id=actor_id,
                    recurring_work_item_activities=recurring_work_item_activities,
                    epoch=epoch,
                )

    for key in requested_data:
        func = RECURRING_WORKITEM_ACTIVITY_MAPPER.get(key)
        if func is not None:
            func(
                requested_data=requested_data,
                current_instance=current_instance,
                recurring_workitem_task_id=recurring_workitem_task_id,
                workspace_id=workspace_id,
                project_id=project_id,
                actor_id=actor_id,
                recurring_work_item_activities=recurring_work_item_activities,
                epoch=epoch,
            )


# Receive message from room group
@shared_task
def recurring_work_item_activity(
    type,
    requested_data,
    current_instance,
    recurring_workitem_task_id,
    actor_id,
    project_id,
    epoch,
):
    try:
        recurring_work_item_activities = []

        project = Project.objects.get(pk=project_id)
        workspace_id = project.workspace_id

        ACTIVITY_MAPPER = {
            "recurring_workitem.activity.created": create_recurring_workitem_activity,
            "recurring_workitem.activity.updated": update_recurring_workitem_activity,
            "recurring_workitem.activity.deleted": delete_recurring_workitem_activity,
        }

        func = ACTIVITY_MAPPER.get(type)
        if func is not None:
            func(
                actor_id=actor_id,
                project_id=project_id,
                workspace_id=str(workspace_id),
                requested_data=requested_data,
                current_instance=current_instance,
                recurring_workitem_task_id=recurring_workitem_task_id,
                recurring_work_item_activities=recurring_work_item_activities,
                epoch=epoch,
            )

        # Save all the values to database
        RecurringWorkItemTaskActivity.objects.bulk_create(
            recurring_work_item_activities
        )

        return
    except Exception as e:
        log_exception(e)
        return
