from django.contrib.postgres.operations import AddIndexConcurrently
from django.db import migrations, models


class Migration(migrations.Migration):
    # Required by AddIndexConcurrently. A failed build leaves an INVALID index; before retrying, run
    # DROP INDEX CONCURRENTLY IF EXISTS intake_issue_snoozed_till_idx;
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
