from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0129_remove_issue_estimate_time"),
    ]

    operations = [
        migrations.AddField(
            model_name="issue",
            name="time_spent",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
