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
import uuid

from django.db import migrations
from django.db.models import Subquery, OuterRef

logger = logging.getLogger("plane.migrations")


def backfill_workflow_data(apps, schema_editor):
    """Create a default Workflow for each project and link existing WorkflowStates to it."""
    Workflow = apps.get_model("ee", "Workflow")
    WorkflowState = apps.get_model("ee", "WorkflowState")
    WorkflowTransitionActivity = apps.get_model("ee", "WorkflowTransitionActivity")
    ProjectFeature = apps.get_model("ee", "ProjectFeature")

    logger.info("Starting workflow data backfill")

    # Step 1: Get distinct projects from existing WorkflowStates
    project_pairs = list(
        WorkflowState.objects.filter(deleted_at__isnull=True)
        .values_list("project_id", "workspace_id")
        .distinct()
    )
    logger.info(f"Found {len(project_pairs)} projects with workflow states")

    if not project_pairs:
        logger.info("No projects to backfill, skipping")
        return

    # Step 2: Create Workflows and link states/activities in batches
    batch_size = 5000
    total_created = 0
    total_states = 0
    total_activities = 0

    for i in range(0, len(project_pairs), batch_size):
        chunk = project_pairs[i : i + batch_size]
        chunk_project_ids = [p for p, _ in chunk]

        # Feature lookup for this batch only
        feature_map = dict(
            ProjectFeature.objects.filter(
                project_id__in=chunk_project_ids
            ).values_list("project_id", "is_workflow_enabled")
        )

        # Create workflows for this batch
        workflows = [
            Workflow(
                id=uuid.uuid4(),
                name="Default Workflow",
                description="Default workflow for the project",
                project_id=project_id,
                workspace_id=workspace_id,
                is_active=feature_map.get(project_id, False),
                is_default=True,
            )
            for project_id, workspace_id in chunk
        ]
        Workflow.objects.bulk_create(workflows, batch_size=batch_size, ignore_conflicts=True)
        total_created += len(workflows)

        # Link WorkflowStates and Activities for this batch using subquery.
        # Each UPDATE touches ~5000 rows (1000 projects × ~5 states) — well under 2min timeout.
        workflow_subq = Workflow.objects.filter(
            project_id=OuterRef("project_id"), is_default=True
        ).values("id")[:1]

        total_states += WorkflowState.objects.filter(
            project_id__in=chunk_project_ids, workflow_id__isnull=True, deleted_at__isnull=True
        ).update(workflow_id=Subquery(workflow_subq))

        total_activities += WorkflowTransitionActivity.objects.filter(
            project_id__in=chunk_project_ids, workflow_id__isnull=True, deleted_at__isnull=True
        ).update(workflow_id=Subquery(workflow_subq))

        logger.info(f"Processed {total_created}/{len(project_pairs)} projects")

    logger.info(f"Created {total_created} workflows")
    logger.info(f"Linked {total_states} workflow states")
    logger.info(f"Linked {total_activities} workflow transition activities")

    logger.info("Workflow data backfill complete")


def reverse_backfill(apps, schema_editor):
    """Reverse: clear workflow FK references and delete default workflows."""
    Workflow = apps.get_model("ee", "Workflow")
    WorkflowState = apps.get_model("ee", "WorkflowState")
    WorkflowTransitionActivity = apps.get_model("ee", "WorkflowTransitionActivity")

    WorkflowState.objects.all().update(workflow_id=None)
    WorkflowTransitionActivity.objects.all().update(workflow_id=None)
    Workflow.objects.filter(is_default=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("ee", "0072_rename_workflow_workflowstate_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill_workflow_data, reverse_backfill),
    ]
