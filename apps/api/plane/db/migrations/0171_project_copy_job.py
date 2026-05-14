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
        ("db", "0170_capacity_export_job"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ProjectCopyJob",
            fields=[
                # --- AuditModel fields (TimeAuditModel + UserAuditModel + SoftDeleteModel) ---
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
                        related_name="projectcopyjob_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="projectcopyjob_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                # --- ProjectCopyJob-specific fields ---
                (
                    "source_project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="copy_jobs_as_source",
                        to="db.project",
                    ),
                ),
                (
                    "source_workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="copy_jobs_as_source",
                        to="db.workspace",
                    ),
                ),
                (
                    "target_workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="copy_jobs_as_target",
                        to="db.workspace",
                    ),
                ),
                (
                    "initiated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="initiated_project_copy_jobs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("queued", "Queued"),
                            ("processing", "Processing"),
                            ("completed", "Completed"),
                            ("failed", "Failed"),
                        ],
                        db_index=True,
                        default="queued",
                        max_length=20,
                    ),
                ),
                ("identifier", models.CharField(blank=True, default="", max_length=12)),
                ("name_override", models.CharField(blank=True, default="", max_length=255)),
                ("new_project_id", models.UUIDField(blank=True, null=True)),
                ("error", models.TextField(blank=True)),
            ],
            options={
                "verbose_name": "Project Copy Job",
                "verbose_name_plural": "Project Copy Jobs",
                "db_table": "project_copy_jobs",
                "ordering": ["-created_at"],
            },
        ),
    ]
