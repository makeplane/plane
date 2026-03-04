"""
Register time_spent field in Django model state.

The time_spent column was already added to the issues table by the
0126_issue_time_spent migration (from develop branch). This migration
only syncs the Django model state — no database operations are run.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0129_remove_issue_estimate_time"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name="issue",
                    name="time_spent",
                    field=models.PositiveIntegerField(default=0),
                )
            ],
            database_operations=[],  # Column already exists in DB
        )
    ]
