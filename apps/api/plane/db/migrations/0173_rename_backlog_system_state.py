from django.db import migrations


def rename_draft_backlog_state_forward(apps, schema_editor):
    State = apps.get_model("db", "State")
    State.objects.filter(name="Draft", group="backlog", deleted_at__isnull=True).update(name="Backlog")


def rename_draft_backlog_state_backward(apps, schema_editor):
    State = apps.get_model("db", "State")
    State.objects.filter(name="Backlog", group="backlog", deleted_at__isnull=True).update(name="Draft")


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0172_change_project_issue_views_default_to_false"),
    ]

    operations = [
        migrations.RunPython(
            rename_draft_backlog_state_forward,
            rename_draft_backlog_state_backward,
        ),
    ]
