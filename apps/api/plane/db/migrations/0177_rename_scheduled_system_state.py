from django.db import migrations


def rename_scheduled_state_forward(apps, schema_editor):
    State = apps.get_model("db", "State")
    State.objects.filter(
        name="Scheduled", group="unstarted", deleted_at__isnull=True
    ).update(name="Todo")


def rename_scheduled_state_backward(apps, schema_editor):
    State = apps.get_model("db", "State")
    State.objects.filter(
        name="Todo", group="unstarted", deleted_at__isnull=True
    ).update(name="Scheduled")


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0176_draft_issue_frequency"),
    ]

    operations = [
        migrations.RunPython(
            rename_scheduled_state_forward,
            rename_scheduled_state_backward,
        ),
    ]
