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
from django.db.models import Exists, OuterRef

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
        logger.info(f"Starting deletion of unused issue properties for project {project_id}")

        # PHASE 1: Collect used property IDs (Project Scope)
        all_used_property_ids = (
            IssuePropertyValue.objects.filter(issue__project_id=project_id)
            .values_list("property_id", flat=True)
            .distinct()
        )

        # PHASE 2: IssueTypeProperty (IssueType Scope)
        # Optimized Bulk Delete: Delete associations that have no values for that specific type
        # Subquery to check for usage of a property for a specific issue type
        used_subquery = IssuePropertyValue.objects.filter(
            issue__type_id=OuterRef("issue_type_id"),
            property_id=OuterRef("property_id"),
            issue__project_id=project_id,
        )

        deletion_result = (
            IssueTypeProperty.objects.filter(
                property__project_id=project_id,
                external_id__isnull=False,
                external_source__isnull=False,
            )
            .exclude(external_id="")
            .exclude(external_source="")
            .annotate(has_values=Exists(used_subquery))
            .filter(has_values=False)
            .delete()
        )
        deleted_type_count = deletion_result[0] if isinstance(deletion_result, (list, tuple)) else deletion_result

        if deleted_type_count > 0:
            logger.info(f"Deleted {deleted_type_count} unused IssueTypeProperty records for project {project_id}")

        # PHASE 3: IssueProperty (Global/Project Scope)
        # Delete IssueProperty records that have NO values anywhere in the project
        deletion_result = (
            IssueProperty.objects.filter(
                project_id=project_id,
                external_id__isnull=False,
                external_source__isnull=False,
            )
            .exclude(external_id="")
            .exclude(external_source="")
            .exclude(id__in=all_used_property_ids)
            .delete()
        )
        deleted_props_count = deletion_result[0] if isinstance(deletion_result, (list, tuple)) else deletion_result

        if deleted_props_count > 0:
            logger.info(f"Deleted {deleted_props_count} unused IssueProperty records for project {project_id}")

        logger.info(f"Completed deletion of unused issue properties for project {project_id}")
    except Exception as e:
        logger.error(f"Failed to delete unused issue properties for project {project_id}: {str(e)}")
