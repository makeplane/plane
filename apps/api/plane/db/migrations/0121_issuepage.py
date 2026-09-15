# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("db", "0120_issueview_archived_at"),
    ]

    operations = [
        migrations.CreateModel(
            name="IssuePage",
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
                    "deleted_at",
                    models.DateTimeField(blank=True, null=True, verbose_name="Deleted At"),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="issuepage_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="issuepage_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "issue",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="issue_pages",
                        to="db.issue",
                    ),
                ),
                (
                    "page",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="issue_pages",
                        to="db.page",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_issuepage",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_issuepage",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Issue Page",
                "verbose_name_plural": "Issue Pages",
                "db_table": "issue_pages",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AlterUniqueTogether(
            name="issuepage",
            unique_together={("issue", "page", "deleted_at")},
        ),
        migrations.AddConstraint(
            model_name="issuepage",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("issue", "page"),
                name="issue_page_unique_issue_page_when_deleted_at_null",
            ),
        ),
    ]
