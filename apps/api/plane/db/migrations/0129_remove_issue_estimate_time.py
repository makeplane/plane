from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0128_usernotificationpreference_worklog_reminder"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="issue",
            name="estimate_time",
        ),
    ]
