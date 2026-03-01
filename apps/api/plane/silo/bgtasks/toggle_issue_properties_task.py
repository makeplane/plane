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

import logging
from celery import shared_task

from plane.ee.models import IssueProperty, IssueTypeProperty, IssuePropertyValue

logger = logging.getLogger("plane.silo.bgtasks")


@shared_task
def toggle_issue_property_by_usage(
    payload: dict, job_id: str, project_id: str, user_id: str | None = None, slug: str | None = None, **kwargs
):
    """
    Toggle issue properties that have no values associated with any work item
    for each issue type in a project.

    Args:
        project_id: The ID of the project to process.
    """
    try:
        logger.info(f"Starting toggle of unused issue properties for project {project_id}")

        # PHASE 1: IssueProperty (Global/Project Scope)
        # Find all properties used by ANY issue in the project
        all_used_property_ids = (
            IssuePropertyValue.objects.filter(issue__project_id=project_id)
            .values_list("property_id", flat=True)
            .distinct()
        )

        # Activate IssueProperty records that have values (Global check)
        activated_props_count = (
            IssueProperty.objects.filter(
                project_id=project_id,
                id__in=all_used_property_ids,
                is_active=False,
                external_id__isnull=False,
                external_source__isnull=False,
            )
            .exclude(external_id="")
            .exclude(external_source="")
            .update(is_active=True)
        )

        if activated_props_count > 0:
            logger.info(f"Activated {activated_props_count} IssueProperty records for project {project_id}")

        # Deactivate IssueProperty records that have NO values anywhere in the project
        deactivated_props_count = (
            IssueProperty.objects.filter(
                project_id=project_id,
                is_active=True,
                external_id__isnull=False,
                external_source__isnull=False,
            )
            .exclude(external_id="")
            .exclude(external_source="")
            .exclude(id__in=all_used_property_ids)
            .update(is_active=False)
        )

        if deactivated_props_count > 0:
            logger.info(f"Deactivated {deactivated_props_count} IssueProperty records for project {project_id}")

        # PHASE 2: IssueTypeProperty (IssueType Scope)
        # Iterate over all Issue Types that have properties in this project
        # We look at IssueTypeProperty to find relevant types
        issue_type_ids = (
            IssueTypeProperty.objects.filter(
                property__project_id=project_id,
                external_id__isnull=False,
                external_source__isnull=False,
            )
            .exclude(external_id="")
            .exclude(external_source="")
            .values_list("issue_type_id", flat=True)
            .distinct()
        )

        for issue_type_id in issue_type_ids:
            # Find properties used by issues of THIS specific type
            type_used_property_ids = (
                IssuePropertyValue.objects.filter(issue__project_id=project_id, issue__type_id=issue_type_id)
                .values_list("property_id", flat=True)
                .distinct()
            )

            # Activate IssueTypeProperty records that have values for this type
            activated_type_count = (
                IssueTypeProperty.objects.filter(
                    property__project_id=project_id,
                    issue_type_id=issue_type_id,
                    is_active=False,
                    property_id__in=type_used_property_ids,
                    external_id__isnull=False,
                    external_source__isnull=False,
                )
                .exclude(external_id="")
                .exclude(external_source="")
                .update(is_active=True)
            )

            if activated_type_count > 0:
                logger.info(
                    f"Activated {activated_type_count} IssueTypeProperty records for project {project_id} "
                    f"and issue type {issue_type_id}"
                )

            # Deactivate IssueTypeProperty records that have NO values for this type
            deactivated_type_count = (
                IssueTypeProperty.objects.filter(
                    property__project_id=project_id,
                    issue_type_id=issue_type_id,
                    is_active=True,
                    external_id__isnull=False,
                    external_source__isnull=False,
                )
                .exclude(external_id="")
                .exclude(external_source="")
                .exclude(property_id__in=type_used_property_ids)
                .update(is_active=False)
            )

            if deactivated_type_count > 0:
                logger.info(
                    f"Deactivated {deactivated_type_count} IssueTypeProperty records for project {project_id} "
                    f"and issue type {issue_type_id}"
                )

        logger.info(f"Completed toggle of unused issue properties for project {project_id}")
    except Exception as e:
        logger.error(f"Failed to toggle unused issue properties for project {project_id}: {str(e)}")
