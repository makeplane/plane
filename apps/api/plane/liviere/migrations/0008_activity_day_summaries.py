# Liviere/plane fork: day summaries of the project activity (plane/liviere/activity/summaries.py), one per
# project, day and author. Only a new table of our own.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0125_reset_project_deploy_board_identity"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("liviere", "0007_activity_report_settings"),
    ]

    operations = [
        migrations.CreateModel(
            name="ActivityDaySummary",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("day", models.DateField()),
                ("text", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "author",
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
                "db_table": "liviere_activity_day_summaries",
                "indexes": [models.Index(fields=["project", "day"], name="liviere_day_summary_day")],
                "constraints": [
                    models.UniqueConstraint(
                        condition=models.Q(("author__isnull", False)),
                        fields=("project", "day", "author"),
                        name="liviere_day_summary_unique_author",
                    )
                ],
            },
        ),
    ]
