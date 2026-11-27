# Liviere/plane fork: schedules the copy of work item history into activity events (every minute,
# django_celery_beat's DatabaseScheduler) and copies the history that exists already.

from django.db import migrations

TASK_NAME = "plane.liviere.tasks.sync_issue_activity_events"
SCHEDULE_NAME = "liviere: sync issue activity to activity events"


def schedule_sync(apps, schema_editor):
    IntervalSchedule = apps.get_model("django_celery_beat", "IntervalSchedule")
    PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")
    every_minute, _ = IntervalSchedule.objects.get_or_create(every=1, period="minutes")
    PeriodicTask.objects.update_or_create(
        name=SCHEDULE_NAME,
        defaults={"task": TASK_NAME, "interval": every_minute, "enabled": True},
    )


def unschedule_sync(apps, schema_editor):
    PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")
    PeriodicTask.objects.filter(name=SCHEDULE_NAME).delete()


def copy_history(apps, schema_editor):
    from plane.liviere.activity.record import sync_issue_activity

    sync_issue_activity(apps.get_model("db", "IssueActivity"), apps.get_model("liviere", "ActivityEvent"))


class Migration(migrations.Migration):
    dependencies = [
        ("liviere", "0001_initial"),
        ("django_celery_beat", "0019_alter_periodictasks_options"),
    ]

    operations = [
        migrations.RunPython(schedule_sync, unschedule_sync),
        migrations.RunPython(copy_history, migrations.RunPython.noop),
    ]
