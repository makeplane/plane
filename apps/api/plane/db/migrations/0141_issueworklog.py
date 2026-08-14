# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0140_alter_importer_status_cancelled"),
    ]

    operations = [
        migrations.CreateModel(
            name="IssueWorklog",
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
                    "duration",
                    models.PositiveIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(36000000),
                        ],
                        verbose_name="Duration (seconds)",
                    ),
                ),
                ("description", models.TextField(blank=True, default="")),
                ("logged_at", models.DateTimeField()),
                (
                    "actor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="issue_worklogs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="issueworklog_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "issue",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="issue_worklogs",
                        to="db.issue",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_issueworklog",
                        to="db.project",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="issueworklog_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_issueworklog",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Issue Worklog",
                "verbose_name_plural": "Issue Worklogs",
                "db_table": "issue_worklogs",
                "ordering": ("-logged_at", "-created_at"),
                "indexes": [
                    models.Index(fields=["issue", "logged_at"], name="worklog_issue_logged_idx"),
                    models.Index(fields=["actor", "logged_at"], name="worklog_actor_logged_idx"),
                    models.Index(fields=["project", "logged_at"], name="worklog_proj_logged_idx"),
                    models.Index(fields=["workspace", "logged_at"], name="worklog_ws_logged_idx"),
                ],
            },
        ),
    ]
