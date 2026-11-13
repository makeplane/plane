# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Additive only: creates cycle_automation_rules and cycle_automation_runs.

import uuid

import django.contrib.postgres.fields
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0125_reset_project_deploy_board_identity"),
    ]

    operations = [
        migrations.CreateModel(
            name="CycleAutomationRule",
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
                (
                    "trigger",
                    models.CharField(
                        choices=[("cycle_started", "Cycle started"), ("cycle_completed", "Cycle completed")],
                        max_length=30,
                    ),
                ),
                (
                    "from_state_ids",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.UUIDField(), blank=True, default=list, size=None
                    ),
                ),
                ("is_enabled", models.BooleanField(default=False)),
                ("enabled_at", models.DateTimeField(blank=True, null=True)),
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
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_%(class)s",
                        to="db.project",
                    ),
                ),
                (
                    "to_state",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="cycle_automation_rules",
                        to="db.state",
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
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_%(class)s",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Cycle Automation Rule",
                "verbose_name_plural": "Cycle Automation Rules",
                "db_table": "cycle_automation_rules",
                "ordering": ("sort_order", "created_at"),
            },
        ),
        migrations.CreateModel(
            name="CycleAutomationRun",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
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
                ("baseline", models.BooleanField(default=False)),
                ("moved_count", models.PositiveIntegerField(default=0)),
                (
                    "cycle",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_runs",
                        to="db.cycle",
                    ),
                ),
                (
                    "rule",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="runs",
                        to="db.cycleautomationrule",
                    ),
                ),
            ],
            options={
                "verbose_name": "Cycle Automation Run",
                "verbose_name_plural": "Cycle Automation Runs",
                "db_table": "cycle_automation_runs",
            },
        ),
        migrations.AddConstraint(
            model_name="cycleautomationrun",
            constraint=models.UniqueConstraint(fields=("cycle", "rule"), name="cycle_automation_run_unique_cycle_rule"),
        ),
    ]
