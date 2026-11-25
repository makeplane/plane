# Liviere/plane fork: thresholds of the series of actions counted by the activity time report
# (plane/liviere/activity/report.py). Only new columns with defaults in our own table.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("liviere", "0006_unread_membership_states"),
    ]

    operations = [
        migrations.AddField(
            model_name="projectactivitysettings",
            name="series_gap_minutes",
            field=models.PositiveSmallIntegerField(default=15),
        ),
        migrations.AddField(
            model_name="projectactivitysettings",
            name="series_padding_minutes",
            field=models.PositiveSmallIntegerField(default=5),
        ),
    ]
