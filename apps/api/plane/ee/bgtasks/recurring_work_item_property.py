# Django imports

# Third party imports
from celery import shared_task

# Module imports
from plane.ee.models import (
    RecurringWorkitemTask,
    RecurringWorkItemTaskActivity,
    PropertyTypeEnum,
    IssueProperty,
)
from plane.utils.exception_logger import log_exception


def track_property_text(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    recurring_workitem_task_id,
    user_id,
    epoch,
):
    """
    This function is used to track the text property changes.
    """
    # Case 1: If the existing value is empty and the requested value is not empty
    if not existing_value and requested_value:
        bulk_property_activity.append(
            RecurringWorkItemTaskActivity(
                workspace_id=property.workspace_id,
                project_id=property.project_id,
                field="custom_property",
                property=property,
                recurring_workitem_task_id=recurring_workitem_task_id,
                old_value="",
                new_value=requested_value[0],
                verb="created",
                actor_id=user_id,
                epoch=epoch,
            )
        )
        return

    # Case 2: If the existing value is not empty and the requested value is empty
    if existing_value and requested_value and existing_value[0] != requested_value[0]:
        bulk_property_activity.append(
            RecurringWorkItemTaskActivity(
                workspace_id=property.workspace_id,
                project_id=property.project_id,
                field="custom_property",
                property=property,
                recurring_workitem_task_id=recurring_workitem_task_id,
                old_value=existing_value[0],
                new_value=requested_value[0],
                verb="updated",
                actor_id=user_id,
                epoch=epoch,
            )
        )
        return

    # Case 3: If the existing value is not empty and the requested value is empty
    if existing_value and not requested_value:
        bulk_property_activity.append(
            RecurringWorkItemTaskActivity(
                workspace_id=property.workspace_id,
                project_id=property.project_id,
                field="custom_property",
                property=property,
                recurring_workitem_task_id=recurring_workitem_task_id,
                old_value=existing_value[0],
                new_value="",
                verb="deleted",
                actor_id=user_id,
                epoch=epoch,
            )
        )
        return


def handle_multi_properties(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    recurring_workitem_task_id,
    user_id,
    epoch,
):
    if property.is_multi:
        added_values = set(requested_value) - set(existing_value)
        removed_values = set(existing_value) - set(requested_value)

        # Create the added values
        for value in added_values:
            bulk_property_activity.append(
                RecurringWorkItemTaskActivity(
                    workspace_id=property.workspace_id,
                    project_id=property.project_id,
                    field="custom_property",
                    property=property,
                    recurring_workitem_task_id=recurring_workitem_task_id,
                    old_value="",
                    new_value=value,
                    verb="created",
                    actor_id=user_id,
                    epoch=epoch,
                )
            )

        # Create the removed values
        for value in removed_values:
            bulk_property_activity.append(
                RecurringWorkItemTaskActivity(
                    workspace_id=property.workspace_id,
                    project_id=property.project_id,
                    field="custom_property",
                    property=property,
                    recurring_workitem_task_id=recurring_workitem_task_id,
                    old_value=value,
                    new_value="",
                    verb="deleted",
                    actor_id=user_id,
                    epoch=epoch,
                )
            )
    else:
        # Case 1: If the existing value is empty and the requested value is not empty
        if not existing_value and requested_value:
            bulk_property_activity.append(
                RecurringWorkItemTaskActivity(
                    workspace_id=property.workspace_id,
                    project_id=property.project_id,
                    field="custom_property",
                    property=property,
                    recurring_workitem_task_id=recurring_workitem_task_id,
                    old_value="",
                    new_value=requested_value[0],
                    verb="created",
                    actor_id=user_id,
                    epoch=epoch,
                )
            )
            return

        # Case 2: If the existing value is not empty and the requested value is not empty
        if (
            existing_value
            and requested_value
            and existing_value[0] != requested_value[0]
        ):
            bulk_property_activity.append(
                RecurringWorkItemTaskActivity(
                    workspace_id=property.workspace_id,
                    project_id=property.project_id,
                    field="custom_property",
                    property=property,
                    recurring_workitem_task_id=recurring_workitem_task_id,
                    old_value=existing_value[0],
                    new_value=requested_value[0],
                    verb="updated",
                    actor_id=user_id,
                    epoch=epoch,
                )
            )
            return

        # Case 3: If the existing value is not empty and the requested value is empty
        if existing_value and not requested_value:
            bulk_property_activity.append(
                RecurringWorkItemTaskActivity(
                    workspace_id=property.workspace_id,
                    project_id=property.project_id,
                    field="custom_property",
                    property=property,
                    recurring_workitem_task_id=recurring_workitem_task_id,
                    old_value=existing_value[0],
                    new_value="",
                    verb="deleted",
                    actor_id=user_id,
                    epoch=epoch,
                )
            )
            return


def track_property_datetime(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    recurring_workitem_task_id,
    user_id,
    epoch,
):
    """
    This function is used to track the datetime property changes.
    """
    handle_multi_properties(
        bulk_property_activity=bulk_property_activity,
        property=property,
        existing_value=existing_value,
        requested_value=requested_value,
        recurring_workitem_task_id=recurring_workitem_task_id,
        user_id=user_id,
        epoch=epoch,
    )


def track_property_decimal(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    recurring_workitem_task_id,
    user_id,
    epoch,
):
    """
    This function is used to track the decimal property changes.
    """
    handle_multi_properties(
        bulk_property_activity=bulk_property_activity,
        property=property,
        existing_value=existing_value,
        requested_value=requested_value,
        recurring_workitem_task_id=recurring_workitem_task_id,
        user_id=user_id,
        epoch=epoch,
    )


def track_property_option(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    recurring_workitem_task_id,
    user_id,
    epoch,
):
    """
    This function is used to track the option property changes.
    """
    handle_multi_properties(
        bulk_property_activity=bulk_property_activity,
        property=property,
        existing_value=existing_value,
        requested_value=requested_value,
        recurring_workitem_task_id=recurring_workitem_task_id,
        user_id=user_id,
        epoch=epoch,
    )


def track_property_boolean(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    recurring_workitem_task_id,
    user_id,
    epoch,
):
    """
    This function is used to track the boolean property changes.
    """
    handle_multi_properties(
        bulk_property_activity=bulk_property_activity,
        property=property,
        existing_value=existing_value,
        requested_value=requested_value,
        recurring_workitem_task_id=recurring_workitem_task_id,
        user_id=user_id,
        epoch=epoch,
    )


def track_property_relation(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    recurring_workitem_task_id,
    user_id,
    epoch,
):
    """
    This function is used to track the relation property changes.
    """
    handle_multi_properties(
        bulk_property_activity=bulk_property_activity,
        property=property,
        existing_value=existing_value,
        requested_value=requested_value,
        recurring_workitem_task_id=recurring_workitem_task_id,
        user_id=user_id,
        epoch=epoch,
    )


def track_property_email(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    recurring_workitem_task_id,
    user_id,
    epoch,
):
    """
    This function is used to track the email property changes.
    """
    handle_multi_properties(
        bulk_property_activity=bulk_property_activity,
        property=property,
        existing_value=existing_value,
        requested_value=requested_value,
        recurring_workitem_task_id=recurring_workitem_task_id,
        user_id=user_id,
        epoch=epoch,
    )


def track_property_url(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    recurring_workitem_task_id,
    user_id,
    epoch,
):
    """
    This function is used to track the url property changes.
    """
    handle_multi_properties(
        bulk_property_activity=bulk_property_activity,
        property=property,
        existing_value=existing_value,
        requested_value=requested_value,
        recurring_workitem_task_id=recurring_workitem_task_id,
        user_id=user_id,
        epoch=epoch,
    )


def track_property_file(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    recurring_workitem_task_id,
    user_id,
    epoch,
):
    """
    This function is used to track the file property changes.
    """
    handle_multi_properties(
        bulk_property_activity=bulk_property_activity,
        property=property,
        existing_value=existing_value,
        requested_value=requested_value,
        recurring_workitem_task_id=recurring_workitem_task_id,
        user_id=user_id,
        epoch=epoch,
    )


@shared_task
def recurring_work_item_property_activity(
    existing_values, requested_values, recurring_workitem_task_id, user_id, epoch
):
    try:
        """
        This function is used to create an activity for the issue property changes.
        """

        # Get the issue
        recurring_workitem_task = RecurringWorkitemTask.objects.select_related(
            "workitem_blueprint"
        ).get(id=recurring_workitem_task_id)
        issue_type_id = recurring_workitem_task.workitem_blueprint.type.get("id")

        if not issue_type_id:
            return

        # Get the issue type
        properties = IssueProperty.objects.filter(
            workspace_id=recurring_workitem_task.workspace_id,
            project_id=recurring_workitem_task.project_id,
            issue_type_id=issue_type_id,
        )

        # Define the property mapper
        ACTIVITY_MAPPER = {
            PropertyTypeEnum.TEXT: track_property_text,
            PropertyTypeEnum.DATETIME: track_property_datetime,
            PropertyTypeEnum.DECIMAL: track_property_decimal,
            PropertyTypeEnum.OPTION: track_property_option,
            PropertyTypeEnum.BOOLEAN: track_property_boolean,
            PropertyTypeEnum.RELATION: track_property_relation,
            PropertyTypeEnum.EMAIL: track_property_email,
            PropertyTypeEnum.URL: track_property_url,
            PropertyTypeEnum.FILE: track_property_file,
        }
        bulk_property_activity = []
        # Loop through the properties
        for property in properties:
            # Get the existing value
            existing_value = existing_values.get(str(property.id), [])

            # Get the requested value
            requested_value = requested_values.get(str(property.id), existing_value)

            # Get the activity mapper
            func = ACTIVITY_MAPPER.get(property.property_type)

            # Call the function
            if func:
                func(
                    bulk_property_activity=bulk_property_activity,
                    property=property,
                    existing_value=existing_value,
                    requested_value=requested_value,
                    recurring_workitem_task_id=recurring_workitem_task_id,
                    user_id=user_id,
                    epoch=epoch,
                )


        # Create the bulk activity
        RecurringWorkItemTaskActivity.objects.bulk_create(bulk_property_activity)


        return
    except Exception as e:
        log_exception(e)
        return
