from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0109_issue_category_issue_level_issue_program_issue_sport_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="issue",
            name="sg_event_id",
            field=models.BigIntegerField(blank=True, db_index=True, null=True),
        ),
    ]
