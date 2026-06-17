# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0121_alter_estimate_type"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="IssueWorkLog",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Created At"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="Last Modified At"),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(blank=True, null=True, verbose_name="Deleted At"),
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
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_%(class)s",
                        to="db.workspace",
                        verbose_name="Workspace",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_%(class)s",
                        to="db.project",
                        verbose_name="Project",
                    ),
                ),
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
                    "issue",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="worklogs",
                        to="db.issue",
                    ),
                ),
                (
                    "logged_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="issue_worklogs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "duration",
                    models.PositiveIntegerField(blank=True, null=True),
                ),
                (
                    "started_at",
                    models.DateTimeField(blank=True, null=True),
                ),
                (
                    "logged_at",
                    models.DateTimeField(default=django.utils.timezone.now),
                ),
                (
                    "description",
                    models.TextField(blank=True, null=True),
                ),
            ],
            options={
                "verbose_name": "Issue Work Log",
                "verbose_name_plural": "Issue Work Logs",
                "db_table": "issue_work_logs",
                "ordering": ("-logged_at",),
            },
        ),
        migrations.AddConstraint(
            model_name="issueworklog",
            constraint=models.UniqueConstraint(
                condition=models.Q(duration__isnull=True),
                fields=["logged_by"],
                name="unique_active_timer_per_user",
            ),
        ),
    ]
