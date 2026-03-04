# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0127_drop_analytics_dashboard_tables"),
    ]

    operations = [
        migrations.AddField(
            model_name="usernotificationpreference",
            name="worklog_reminder",
            field=models.BooleanField(default=True),
        ),
    ]
