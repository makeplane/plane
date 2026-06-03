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
        ("db", "0169_project_field_permission"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CapacityExportJob",
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
                        related_name="capacityexportjob_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="capacityexportjob_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="capacity_export_jobs",
                        to="db.workspace",
                    ),
                ),
                (
                    "requested_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="capacity_export_jobs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("date_from", models.DateField(verbose_name="Date From")),
                ("date_to", models.DateField(verbose_name="Date To")),
                ("member_ids", models.JSONField(default=list, blank=True)),
                ("cross_workspace", models.BooleanField(default=False)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("queued", "Queued"),
                            ("processing", "Processing"),
                            ("ready", "Ready"),
                            ("failed", "Failed"),
                            ("expired", "Expired"),
                        ],
                        default="queued",
                        max_length=20,
                    ),
                ),
                ("file_key", models.CharField(max_length=800, null=True, blank=True)),
                ("file_url", models.TextField(null=True, blank=True)),
                ("file_size", models.BigIntegerField(default=0)),
                ("row_count", models.IntegerField(default=0)),
                ("error_message", models.TextField(blank=True, default="")),
                ("expires_at", models.DateTimeField(null=True, blank=True)),
                ("completed_at", models.DateTimeField(null=True, blank=True)),
            ],
            options={
                "verbose_name": "Capacity Export Job",
                "verbose_name_plural": "Capacity Export Jobs",
                "db_table": "capacity_export_jobs",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="capacityexportjob",
            index=models.Index(
                fields=["requested_by", "-created_at"],
                name="cap_exp_requester_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="capacityexportjob",
            index=models.Index(
                fields=["workspace", "status"],
                name="cap_exp_workspace_status_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="capacityexportjob",
            index=models.Index(
                fields=["expires_at"],
                name="cap_exp_expires_at_idx",
            ),
        ),
    ]
