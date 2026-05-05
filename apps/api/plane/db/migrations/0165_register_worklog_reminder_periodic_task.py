from django.db import migrations


def register_worklog_reminder(apps, schema_editor):
    # Import via apps registry to avoid direct model dependency
    try:
        CrontabSchedule = apps.get_model("django_celery_beat", "CrontabSchedule")
        PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")
    except LookupError:
        # django_celery_beat not installed — skip
        return

    schedule, _ = CrontabSchedule.objects.get_or_create(
        minute=0,
        hour=10,  # UTC 10:00 = 5PM Vietnam (UTC+7)
        day_of_week="*",
        day_of_month="*",
        month_of_year="*",
    )
    PeriodicTask.objects.update_or_create(
        name="check-every-day-to-send-worklog-reminder",
        defaults={
            "task": "plane.bgtasks.worklog_reminder_task.worklog_daily_reminder",
            "crontab": schedule,
            "enabled": True,
        },
    )


def deregister_worklog_reminder(apps, schema_editor):
    try:
        PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")
    except LookupError:
        return
    PeriodicTask.objects.filter(
        name="check-every-day-to-send-worklog-reminder"
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0164_change_project_module_views_defaults"),
    ]

    operations = [
        migrations.RunPython(
            register_worklog_reminder,
            reverse_code=deregister_worklog_reminder,
        ),
    ]
