from django.contrib.postgres.operations import AddIndexConcurrently
from django.db import migrations, models


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("db", "0122_alter_draftissue_assignees_alter_issue_assignees_and_more"),
    ]

    # Index first: non-atomic, so if the concurrent build fails nothing else has run yet.
    operations = [
        AddIndexConcurrently(
            model_name="intakeissue",
            index=models.Index(
                condition=models.Q(("status", 0)), fields=["snoozed_till"], name="intake_issue_snoozed_till_idx"
            ),
        ),
        migrations.RemoveField(
            model_name="apitoken",
            name="is_service",
        ),
        migrations.RemoveField(
            model_name="apitoken",
            name="allowed_rate_limit",
        ),
    ]
