# Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0126_workflow"),
    ]

    operations = [
        migrations.AlterField(
            model_name="exporterhistory",
            name="type",
            field=models.CharField(
                choices=[
                    ("issue_exports", "Issue Exports"),
                    ("issue_worklogs", "Issue Worklogs"),
                    ("project_exports", "Project Exports"),
                    ("project_imports", "Project Imports"),
                ],
                default="issue_exports",
                max_length=50,
            ),
        ),
    ]
