# [FA-CUSTOM] Migration for dual calendar system support
# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0120_issueview_archived_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="calendar_system",
            field=models.CharField(
                choices=[("gregorian", "Gregorian"), ("jalali", "Jalali")],
                default="gregorian",
                max_length=20,
            ),
        ),
    ]
