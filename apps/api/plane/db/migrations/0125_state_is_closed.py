# d2m-plane: ClickUp-like "Closed" state — one per project, in the completed group,
# hidden from work item views unless "Show closed" is enabled.

from django.db import migrations, models
from django.db.models import Max, Q


def create_closed_states(apps, schema_editor):
    Project = apps.get_model("db", "Project")
    State = apps.get_model("db", "State")

    for project in Project.objects.filter(deleted_at__isnull=True).only("id", "workspace_id").iterator():
        states = State.objects.filter(project_id=project.id, deleted_at__isnull=True)
        if states.filter(is_closed=True).exists():
            continue

        # Re-use an existing completed state literally named "Closed"
        existing = states.filter(name="Closed", group="completed").first()
        if existing:
            existing.is_closed = True
            existing.save(update_fields=["is_closed"])
            continue

        name = "Closed"
        if states.filter(name=name).exists():
            name = "Closed (final)"
        last_sequence = states.aggregate(largest=Max("sequence"))["largest"] or 0
        State.objects.create(
            name=name,
            slug="closed",
            color="#A1A1AA",
            group="completed",
            sequence=last_sequence + 15000,
            is_closed=True,
            project_id=project.id,
            workspace_id=project.workspace_id,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0124_project_state_group_order"),
    ]

    operations = [
        migrations.AddField(
            model_name="state",
            name="is_closed",
            field=models.BooleanField(default=False),
        ),
        migrations.AddConstraint(
            model_name="state",
            constraint=models.UniqueConstraint(
                condition=Q(deleted_at__isnull=True, is_closed=True),
                fields=("project",),
                name="state_unique_closed_per_project_when_deleted_at_null",
            ),
        ),
        migrations.RunPython(create_closed_states, migrations.RunPython.noop),
    ]
