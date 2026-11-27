# Liviere/plane fork: periods the activity time report leaves out (plane/liviere/activity/skips.py). Only a
# new table of our own.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0125_reset_project_deploy_board_identity"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("liviere", "0008_activity_day_summaries"),
    ]

    operations = [
        migrations.CreateModel(
            name="ActivitySkipPeriod",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("starts_at", models.DateTimeField()),
                ("ends_at", models.DateTimeField()),
                ("description", models.CharField(blank=True, default="", max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="+", to="db.project"),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="+", to="db.workspace"
                    ),
                ),
            ],
            options={
                "db_table": "liviere_activity_skip_periods",
                "indexes": [models.Index(fields=["project", "starts_at"], name="liviere_skip_project_start")],
            },
        ),
    ]
