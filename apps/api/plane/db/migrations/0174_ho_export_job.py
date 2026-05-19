# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

import django.db.models.deletion

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0173_rename_backlog_system_state"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="HoExportJob",
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
                        related_name="hoexportjob_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="hoexportjob_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "requested_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ho_export_jobs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ("filters", models.JSONField(default=dict, blank=True)),
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
                "verbose_name": "HO Export Job",
                "verbose_name_plural": "HO Export Jobs",
                "db_table": "ho_export_jobs",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="hoexportjob",
            index=models.Index(
                fields=["requested_by", "-created_at"],
                name="ho_exp_requester_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="hoexportjob",
            index=models.Index(
                fields=["expires_at"],
                name="ho_exp_expires_at_idx",
            ),
        ),
    ]
