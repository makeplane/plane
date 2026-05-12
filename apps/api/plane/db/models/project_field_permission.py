# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import models

# Module imports
from .project import ProjectBaseModel


class ProjectFieldPermission(ProjectBaseModel):
    """Stores per-project boolean toggles controlling which fields members can modify.

    One row per project (enforced via UniqueConstraint on active/un-deleted rows).
    All fields default to False — admin-only until explicitly unlocked.
    """

    allow_member_modify_completed_date = models.BooleanField(default=False)
    allow_member_modify_target_date = models.BooleanField(default=False)
    allow_member_modify_start_date = models.BooleanField(default=False)
    allow_member_delete_work_item = models.BooleanField(default=False)

    class Meta:
        db_table = "project_field_permissions"
        verbose_name = "Project Field Permission"
        verbose_name_plural = "Project Field Permissions"
        constraints = [
            models.UniqueConstraint(
                fields=["project"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_field_permission_unique_project_when_undeleted",
            )
        ]

    def __str__(self):
        return f"ProjectFieldPermission <project={self.project_id}>"
