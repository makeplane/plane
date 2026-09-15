# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("db", "0121_issuepage"),
    ]

    operations = [
        # sync the base model related names with 0121 (state only, no SQL)
        migrations.AlterField(
            model_name="issuepage",
            name="created_by",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="%(class)s_created_by",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Created By",
            ),
        ),
        migrations.AlterField(
            model_name="issuepage",
            name="project",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="project_%(class)s",
                to="db.project",
            ),
        ),
        migrations.AlterField(
            model_name="issuepage",
            name="updated_by",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="%(class)s_updated_by",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Last Modified By",
            ),
        ),
        migrations.AlterField(
            model_name="issuepage",
            name="workspace",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="workspace_%(class)s",
                to="db.workspace",
            ),
        ),
        migrations.AddConstraint(
            model_name="issuepage",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("issue",),
                name="issue_page_unique_issue_when_deleted_at_null",
            ),
        ),
    ]
