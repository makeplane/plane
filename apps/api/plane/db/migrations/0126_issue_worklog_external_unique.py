# Generated manually for the work-item-time-tracking module (security review BK-2).

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0125_issue_worklogs"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="issueworklog",
            constraint=models.UniqueConstraint(
                fields=["project", "external_source", "external_id"],
                condition=models.Q(
                    deleted_at__isnull=True,
                    external_source__isnull=False,
                    external_id__isnull=False,
                ),
                name="worklog_unique_external_id_when_deleted_at_null",
            ),
        ),
    ]
