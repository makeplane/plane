# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Internal addition (not part of upstream makeplane/plane): project-level custom
# fields. Dependency below points at the migration name, not the numeric prefix, so
# renaming this file on a future upstream-number collision does not break the graph.

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0122_alter_draftissue_assignees_alter_issue_assignees_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProjectCustomField",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
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
                (
                    "field_type",
                    models.CharField(
                        choices=[("number", "Number")], default="number", max_length=30
                    ),
                ),
                ("sort_order", models.FloatField(default=65535)),
                ("is_active", models.BooleanField(default=True)),
                ("external_source", models.CharField(blank=True, max_length=255, null=True)),
                ("external_id", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="projectcustomfield_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="projectcustomfield_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_projectcustomfield",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_projectcustomfield",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Project Custom Field",
                "verbose_name_plural": "Project Custom Fields",
                "db_table": "project_custom_fields",
                "ordering": ("sort_order",),
            },
        ),
        migrations.CreateModel(
            name="ProjectCustomFieldValue",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
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
                ("value_decimal", models.DecimalField(blank=True, decimal_places=4, max_digits=20, null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="projectcustomfieldvalue_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="projectcustomfieldvalue_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "custom_field",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="values",
                        to="db.projectcustomfield",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_projectcustomfieldvalue",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_projectcustomfieldvalue",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Project Custom Field Value",
                "verbose_name_plural": "Project Custom Field Values",
                "db_table": "project_custom_field_values",
            },
        ),
        migrations.AddConstraint(
            model_name="projectcustomfield",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("project", "name"),
                name="project_custom_field_unique_project_name_when_not_deleted",
            ),
        ),
        migrations.AddConstraint(
            model_name="projectcustomfieldvalue",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("project", "custom_field"),
                name="project_custom_field_value_unique_project_field_when_not_deleted",
            ),
        ),
    ]
