# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0174_ho_export_job"),
    ]

    operations = [
        migrations.AddField(
            model_name="draftissue",
            name="main_task_category",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="draft_issues",
                to="db.maintaskcategory",
            ),
        ),
        migrations.AddField(
            model_name="draftissue",
            name="sub_task_category",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="draft_issues",
                to="db.subtaskcategory",
            ),
        ),
    ]
