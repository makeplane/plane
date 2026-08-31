# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Internal addition (not part of upstream makeplane/plane): Phase 2 of project
# custom fields, adding text/date/dropdown/member field types. See
# 0123_internal_project_custom_field.py for the upgrade-safety rationale behind
# this migration's dependency and naming.

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0123_internal_project_custom_field"),
    ]

    operations = [
        migrations.AlterField(
            model_name="projectcustomfield",
            name="field_type",
            field=models.CharField(
                choices=[
                    ("number", "Number"),
                    ("text", "Text"),
                    ("date", "Date"),
                    ("dropdown", "Dropdown"),
                    ("member", "Member"),
                ],
                default="number",
                max_length=30,
            ),
        ),
        migrations.CreateModel(
            name="ProjectCustomFieldOption",
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
                ("sort_order", models.FloatField(default=65535)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="projectcustomfieldoption_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="projectcustomfieldoption_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "custom_field",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="options",
                        to="db.projectcustomfield",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_projectcustomfieldoption",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_projectcustomfieldoption",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Project Custom Field Option",
                "verbose_name_plural": "Project Custom Field Options",
                "db_table": "project_custom_field_options",
                "ordering": ("sort_order",),
            },
        ),
        migrations.AddField(
            model_name="projectcustomfieldvalue",
            name="value_text",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="projectcustomfieldvalue",
            name="value_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="projectcustomfieldvalue",
            name="value_option",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="values",
                to="db.projectcustomfieldoption",
            ),
        ),
        migrations.AddField(
            model_name="projectcustomfieldvalue",
            name="value_member",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="project_custom_field_values",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddConstraint(
            model_name="projectcustomfieldoption",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("custom_field", "name"),
                name="project_custom_field_option_unique_field_name_when_not_deleted",
            ),
        ),
        # Mirrors ProjectCustomFieldValueSerializer.validate() at the DB layer: at
        # most one of the five value_* columns may be set per row (all-null is the
        # valid pre-write state from the upsert view's get_or_create). See
        # project_custom_field.py's _single_value_column_check for the model-side
        # source of truth this constraint must stay identical to.
        migrations.AddConstraint(
            model_name="projectcustomfieldvalue",
            constraint=models.CheckConstraint(
                check=(
                    models.Q(
                        value_decimal__isnull=True,
                        value_text__isnull=True,
                        value_date__isnull=True,
                        value_option__isnull=True,
                        value_member__isnull=True,
                    )
                    | (
                        models.Q(value_decimal__isnull=False)
                        & models.Q(
                            value_text__isnull=True,
                            value_date__isnull=True,
                            value_option__isnull=True,
                            value_member__isnull=True,
                        )
                    )
                    | (
                        models.Q(value_text__isnull=False)
                        & models.Q(
                            value_decimal__isnull=True,
                            value_date__isnull=True,
                            value_option__isnull=True,
                            value_member__isnull=True,
                        )
                    )
                    | (
                        models.Q(value_date__isnull=False)
                        & models.Q(
                            value_decimal__isnull=True,
                            value_text__isnull=True,
                            value_option__isnull=True,
                            value_member__isnull=True,
                        )
                    )
                    | (
                        models.Q(value_option__isnull=False)
                        & models.Q(
                            value_decimal__isnull=True,
                            value_text__isnull=True,
                            value_date__isnull=True,
                            value_member__isnull=True,
                        )
                    )
                    | (
                        models.Q(value_member__isnull=False)
                        & models.Q(
                            value_decimal__isnull=True,
                            value_text__isnull=True,
                            value_date__isnull=True,
                            value_option__isnull=True,
                        )
                    )
                ),
                name="project_custom_field_value_single_value_column",
            ),
        ),
    ]
