from django.contrib.postgres.operations import AddIndexConcurrently
from django.db import migrations, models


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("db", "0123_remove_apitoken_is_service_and_allowed_rate_limit"),
    ]

    operations = [
        AddIndexConcurrently(
            model_name="intakeissue",
            index=models.Index(
                condition=models.Q(("status", 0)), fields=["snoozed_till"], name="intake_issue_snoozed_till_idx"
            ),
        ),
    ]
