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

# Third party imports
from celery import shared_task

# Module imports
from plane.ee.models import IssuePropertyActivity, PropertyTypeEnum, RelationTypeEnum, IssueProperty
from plane.db.models import Issue, IssueSubscriber, ProjectMember


def track_property_text(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    issue_id,
    user_id,
    project_id,
    epoch,
):
    """
    This function is used to track the text property changes.
    """
    # Case 1: If the existing value is empty and the requested value is not empty
    if not existing_value and requested_value:
        bulk_property_activity.append(
            IssuePropertyActivity(
                workspace_id=property.workspace_id,
                project_id=project_id,
                property=property,
                issue_id=issue_id,
                old_value="",
                new_value=requested_value[0],
                action="created",
                actor_id=user_id,
                epoch=epoch,
                comment=f"added the {property.property_type}",
            )
        )
        return

    # Case 2: If the existing value is not empty and the requested value is empty
    if existing_value and requested_value and existing_value[0] != requested_value[0]:
        bulk_property_activity.append(
            IssuePropertyActivity(
                workspace_id=property.workspace_id,
                project_id=project_id,
                property=property,
                issue_id=issue_id,
                old_value=existing_value[0],
                new_value=requested_value[0],
                action="updated",
                actor_id=user_id,
                epoch=epoch,
                comment=f"updated the {property.property_type}",
            )
        )
        return

    # Case 3: If the existing value is not empty and the requested value is empty
    if existing_value and not requested_value:
        bulk_property_activity.append(
            IssuePropertyActivity(
                workspace_id=property.workspace_id,
                project_id=project_id,
                property=property,
                issue_id=issue_id,
                old_value=existing_value[0],
                new_value="",
                action="deleted",
                actor_id=user_id,
                epoch=epoch,
                comment=f"deleted the {property.property_type}",
            )
        )
        return


def handle_multi_properties(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    issue_id,
    user_id,
    project_id,
    epoch,
):
    if property.is_multi:
        added_values = set(requested_value) - set(existing_value)
        removed_values = set(existing_value) - set(requested_value)

        # Create the added values
        for value in added_values:
            bulk_property_activity.append(
                IssuePropertyActivity(
                    workspace_id=property.workspace_id,
                    project_id=project_id,
                    property=property,
                    issue_id=issue_id,
                    old_value="",
                    new_value=value,
                    action="created",
                    actor_id=user_id,
                    epoch=epoch,
                    comment=f"added the {property.property_type}",
                )
            )

        # Create the removed values
        for value in removed_values:
            bulk_property_activity.append(
                IssuePropertyActivity(
                    workspace_id=property.workspace_id,
                    project_id=project_id,
                    property=property,
                    issue_id=issue_id,
                    old_value=value,
                    new_value="",
                    action="deleted",
                    actor_id=user_id,
                    epoch=epoch,
                    comment=f"removed the {property.property_type}",
                )
            )
    else:
        # Case 1: If the existing value is empty and the requested value is not empty
        if not existing_value and requested_value:
            bulk_property_activity.append(
                IssuePropertyActivity(
                    workspace_id=property.workspace_id,
                    project_id=project_id,
                    property=property,
                    issue_id=issue_id,
                    old_value="",
                    new_value=requested_value[0],
                    action="created",
                    actor_id=user_id,
                    epoch=epoch,
                    comment=f"added the {property.property_type}",
                )
            )
            return

        # Case 2: If the existing value is not empty and the requested value is not empty
        if existing_value and requested_value and existing_value[0] != requested_value[0]:
            bulk_property_activity.append(
                IssuePropertyActivity(
                    workspace_id=property.workspace_id,
                    project_id=project_id,
                    property=property,
                    issue_id=issue_id,
                    old_value=existing_value[0],
                    new_value=requested_value[0],
                    action="updated",
                    actor_id=user_id,
                    epoch=epoch,
                    comment=f"added the {property.property_type}",
                )
            )
            return

        # Case 3: If the existing value is not empty and the requested value is empty
        if existing_value and not requested_value:
            bulk_property_activity.append(
                IssuePropertyActivity(
                    workspace_id=property.workspace_id,
                    project_id=project_id,
                    property=property,
                    issue_id=issue_id,
                    old_value=existing_value[0],
                    new_value="",
                    action="deleted",
                    actor_id=user_id,
                    epoch=epoch,
                    comment=f"deleted the {property.property_type}",
                )
            )
            return


def track_property_datetime(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    issue_id,
    user_id,
    project_id,
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
        issue_id=issue_id,
        user_id=user_id,
        project_id=project_id,
        epoch=epoch,
    )


def track_property_decimal(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    issue_id,
    user_id,
    project_id,
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
        issue_id=issue_id,
        user_id=user_id,
        project_id=project_id,
        epoch=epoch,
    )


def track_property_option(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    issue_id,
    user_id,
    project_id,
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
        issue_id=issue_id,
        user_id=user_id,
        project_id=project_id,
        epoch=epoch,
    )


def track_property_boolean(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    issue_id,
    user_id,
    project_id,
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
        issue_id=issue_id,
        user_id=user_id,
        project_id=project_id,
        epoch=epoch,
    )


def track_property_relation(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    issue_id,
    user_id,
    project_id,
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
        issue_id=issue_id,
        user_id=user_id,
        project_id=project_id,
        epoch=epoch,
    )


def track_property_email(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    issue_id,
    user_id,
    project_id,
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
        issue_id=issue_id,
        user_id=user_id,
        project_id=project_id,
        epoch=epoch,
    )


def track_property_url(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    issue_id,
    user_id,
    project_id,
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
        issue_id=issue_id,
        user_id=user_id,
        project_id=project_id,
        epoch=epoch,
    )


def track_property_file(
    bulk_property_activity,
    property,
    existing_value,
    requested_value,
    issue_id,
    user_id,
    project_id,
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
        issue_id=issue_id,
        user_id=user_id,
        project_id=project_id,
        epoch=epoch,
    )


@shared_task
def issue_property_activity(existing_values, requested_values, issue_id, user_id, epoch):
    """
    This function is used to create an activity for the issue property changes.
    """

    # Get the issue
    issue = Issue.objects.get(id=issue_id)
    project_id = issue.project_id

    # Get the issue type
    properties = IssueProperty.objects.filter(
        workspace_id=issue.workspace_id,
        issue_type_properties__issue_type_id=issue.type_id,
        issue_type_properties__deleted_at__isnull=True,
    ).distinct()

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
                issue_id=issue_id,
                user_id=user_id,
                project_id=project_id,
                epoch=epoch,
            )

    # Create the bulk activity
    IssuePropertyActivity.objects.bulk_create(bulk_property_activity)

    # For RELATION/USER (member picker) properties, subscribe newly added members
    user_relation_properties = properties.filter(
        property_type=PropertyTypeEnum.RELATION,
        relation_type=RelationTypeEnum.USER,
    )

    bulk_subscribers = []
    for property in user_relation_properties:
        prop_id_str = str(property.id)
        existing_user_ids = existing_values.get(prop_id_str, [])
        requested_user_ids = requested_values.get(prop_id_str, existing_user_ids)

        added_user_ids = set(requested_user_ids) - set(existing_user_ids)

        # check user exists in the project or not
        project_users = ProjectMember.objects.filter(
            project_id=project_id,
            member_id__in=added_user_ids,
            deleted_at__isnull=True,
            is_active=True,
        ).values_list("member_id", flat=True)

        bulk_subscribers.extend(
            IssueSubscriber(
                subscriber_id=user_id,
                issue_id=issue_id,
                workspace_id=issue.workspace_id,
                project_id=project_id,
                created_by_id=user_id,
                updated_by_id=user_id,
            )
            for user_id in project_users
        )

    if bulk_subscribers:
        IssueSubscriber.objects.bulk_create(bulk_subscribers, batch_size=10, ignore_conflicts=True)
