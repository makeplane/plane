# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0175_draft_issue_categories"),
    ]

    operations = [
        migrations.AddField(
            model_name="draftissue",
            name="frequency",
            field=models.CharField(
                blank=True,
                choices=[
                    ("daily", "Daily"),
                    ("weekly", "Weekly"),
                    ("bi_weekly", "Bi-weekly"),
                    ("monthly", "Monthly"),
                    ("quarterly", "Quarterly"),
                    ("half_year", "Half-year"),
                    ("yearly", "Yearly"),
                    ("ad_hoc", "Ad-hoc"),
                ],
                max_length=20,
                null=True,
                verbose_name="Draft Issue Frequency",
            ),
        ),
    ]
