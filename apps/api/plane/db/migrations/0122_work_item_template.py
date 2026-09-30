# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0121_alter_estimate_type"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkItemTemplate",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Created At"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True,
                        verbose_name="Last Modified At",
                    ),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(
                        blank=True,
                        null=True,
                        verbose_name="Deleted At",
                    ),
                ),
                (
                    "id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("payload", models.JSONField(default=dict)),
                ("sort_order", models.FloatField(default=65535)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_%(class)s",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_%(class)s",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "work_item_templates",
                "verbose_name": "Work item template",
                "verbose_name_plural": "Work item templates",
                "ordering": ("-sort_order", "-created_at"),
            },
        ),
        migrations.AddConstraint(
            model_name="workitemtemplate",
            constraint=models.UniqueConstraint(
                condition=models.Q(
                    ("project__isnull", True),
                    ("deleted_at__isnull", True),
                ),
                fields=("workspace", "name"),
                name="unique_work_item_template_name_ws_global_not_deleted",
            ),
        ),
        migrations.AddConstraint(
            model_name="workitemtemplate",
            constraint=models.UniqueConstraint(
                condition=models.Q(
                    ("project__isnull", False),
                    ("deleted_at__isnull", True),
                ),
                fields=("workspace", "project", "name"),
                name="unique_work_item_template_name_per_project_not_deleted",
            ),
        ),
    ]
