# Data migration: add "Bi-weekly" default label to all existing projects.
from django.db import migrations


def add_biweekly_label(apps, schema_editor):
    Label = apps.get_model("db", "Label")
    Project = apps.get_model("db", "Project")
    for project in Project.objects.all():
        Label.objects.get_or_create(
            name="Bi-weekly",
            project=project,
            defaults={
                "color": "#7057FF",
                "sort_order": 90535,
                "workspace": project.workspace,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0133_workflow_models"),
    ]
    operations = [
        migrations.RunPython(add_biweekly_label, migrations.RunPython.noop),
    ]
