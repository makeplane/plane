# Liviere/plane fork: activity log entries (ActivityEvent with source "log", a text and an optional
# end of their time range). Projects with saved activity settings start counting them too.

from django.db import migrations, models

LOG_ENTRY = "log.entry"


def count_log_entries(apps, schema_editor):
    ProjectActivitySettings = apps.get_model("liviere", "ProjectActivitySettings")
    for settings in ProjectActivitySettings.objects.all():
        if LOG_ENTRY not in settings.kinds:
            settings.kinds = [*settings.kinds, LOG_ENTRY]
            settings.save(update_fields=["kinds"])


def stop_counting_log_entries(apps, schema_editor):
    ProjectActivitySettings = apps.get_model("liviere", "ProjectActivitySettings")
    for settings in ProjectActivitySettings.objects.all():
        if LOG_ENTRY in settings.kinds:
            settings.kinds = [kind for kind in settings.kinds if kind != LOG_ENTRY]
            settings.save(update_fields=["kinds"])


class Migration(migrations.Migration):
    dependencies = [
        ("liviere", "0002_activity_sync_schedule_and_history"),
    ]

    operations = [
        migrations.AddField(
            model_name="activityevent",
            name="ended_at",
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name="activityevent",
            name="note",
            field=models.TextField(null=True),
        ),
        migrations.AddField(
            model_name="activityevent",
            name="updated_at",
            field=models.DateTimeField(null=True),
        ),
        migrations.AddIndex(
            model_name="activityevent",
            index=models.Index(
                condition=models.Q(("ended_at__isnull", False)),
                fields=["project", "ended_at"],
                name="liviere_act_project_range",
            ),
        ),
        migrations.RunPython(count_log_entries, stop_counting_log_entries),
    ]
