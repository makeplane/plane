# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Generated migration — rename to next sequential number at PR merge time if conflict detected.

import uuid

import django.db.models.deletion

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0168_add_issue_workitems_index"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ProjectFieldPermission",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(null=True, blank=True, verbose_name="Deleted At")),
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        unique=True,
                        db_index=True,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="projectfieldpermission_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="projectfieldpermission_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_projectfieldpermission",
                        to="db.workspace",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_projectfieldpermission",
                        to="db.project",
                    ),
                ),
                ("allow_member_modify_completed_date", models.BooleanField(default=False)),
                ("allow_member_modify_target_date", models.BooleanField(default=False)),
                ("allow_member_modify_start_date", models.BooleanField(default=False)),
                ("allow_member_delete_work_item", models.BooleanField(default=False)),
            ],
            options={
                "verbose_name": "Project Field Permission",
                "verbose_name_plural": "Project Field Permissions",
                "db_table": "project_field_permissions",
            },
        ),
        migrations.AddConstraint(
            model_name="projectfieldpermission",
            constraint=models.UniqueConstraint(
                fields=["project"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_field_permission_unique_project_when_undeleted",
            ),
        ),
    ]
