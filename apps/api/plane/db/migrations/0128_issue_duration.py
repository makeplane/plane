# Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import migrations, models


def backfill_duration(apps, schema_editor):
    """
    Give existing work items a duration wherever both dates are already known.

    Duration counts both ends, so a work item running from the 1st to the 5th lasts 5 days.
    Done in raw SQL because the tables can hold a large number of rows and this needs a single
    pass rather than one UPDATE per object.
    """
    with schema_editor.connection.cursor() as cursor:
        for table in ("issues", "draft_issues"):
            cursor.execute(
                f"""
                UPDATE {table}
                SET duration = (target_date - start_date) + 1
                WHERE start_date IS NOT NULL
                  AND target_date IS NOT NULL
                  AND target_date >= start_date
                  AND duration IS NULL
                """
            )


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0127_exporterhistory_project_types"),
    ]

    operations = [
        migrations.AddField(
            model_name="issue",
            name="duration",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="draftissue",
            name="duration",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="issueversion",
            name="duration",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.RunPython(backfill_duration, migrations.RunPython.noop),
    ]
