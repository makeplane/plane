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
from django.db.models import Q

from plane.ee.models import IssueProperty, IssueTypeProperty, IssuePropertyValue
from plane.db.models import Workspace

logger = logging.getLogger("plane.silo.bgtasks")


@shared_task
def toggle_workspace_issue_property_by_usage(
    payload: dict, job_id: str, project_id: str, user_id: str | None = None, slug: str | None = None, **kwargs
):
    """
    Toggle workspace-level issue properties that have no values associated
    with any work item in the workspace.

    Args:
        slug: The slug of the workspace to process.
    """
    try:
        workspace = Workspace.objects.get(slug=slug)
        workspace_id = workspace.id

        logger.info(f"Starting deletion of unused workspace issue properties for workspace {workspace_id}")

        # PHASE 1: Collect used property IDs (Workspace Scope)
        all_used_property_ids = (
            IssuePropertyValue.objects.filter(issue__workspace_id=workspace_id)
            .values_list("property_id", flat=True)
            .distinct()
        )

        # PHASE 2: IssueTypeProperty (Workspace Scope)
        # Delete associations for workspace-level IMPORTED properties that have no values used
        deletion_result = (
            IssueTypeProperty.objects.filter(
                workspace_id=workspace_id,
                property__project__isnull=True,  # Workspace-level properties
            )
            # Restrict to associations whose underlying property was created via import
            .filter(
                Q(property__external_id__isnull=False) | Q(property__external_source__isnull=False)
            )
            .exclude(property__external_id="")
            .exclude(property__external_source="")
            .exclude(property_id__in=all_used_property_ids)
            .delete()
        )
        deleted_type_count = deletion_result[0] if isinstance(deletion_result, (list, tuple)) else deletion_result

        if deleted_type_count > 0:
            logger.info(f"Deleted {deleted_type_count} unused IssueTypeProperty records for workspace {workspace_id}")

        # PHASE 3: IssueProperty (Workspace Scope)
        # Delete IssueProperty records that are workspace-level IMPORTED properties and have NO values used
        deletion_result = (
            IssueProperty.objects.filter(
                workspace_id=workspace_id,
                project__isnull=True,  # Workspace-level properties
            )
            # Restrict to properties that were created via import
            .filter(
                Q(external_id__isnull=False) | Q(external_source__isnull=False)
            )
            .exclude(external_id="")
            .exclude(external_source="")
            .exclude(id__in=all_used_property_ids)
            .delete()
        )
        deleted_props_count = deletion_result[0] if isinstance(deletion_result, (list, tuple)) else deletion_result

        if deleted_props_count > 0:
            logger.info(f"Deleted {deleted_props_count} unused IssueProperty records for workspace {workspace_id}")

        logger.info(f"Completed deletion of unused workspace issue properties for workspace {workspace_id}")
    except Exception as e:
        workspace_id = workspace.id if "workspace" in locals() else slug
        logger.error(
            f"Failed to delete unused workspace issue properties for workspace {workspace_id}: {str(e)}"
        )

