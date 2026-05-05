from django.db import migrations


def migrate_system_states(apps, schema_editor):
    State = apps.get_model("db", "State")

    OLD_SYSTEM_NAMES = {"Draft", "Todo", "In Progress", "Done", "Cancelled"}

    # Mark existing system states as is_system=True
    State.objects.filter(
        name__in=OLD_SYSTEM_NAMES,
        deleted_at__isnull=True,
    ).update(is_system=True)

    # Unset Draft as default FIRST to avoid potential unique(project, default=True) violation
    State.objects.filter(
        name="Draft",
        deleted_at__isnull=True,
    ).update(default=False)

    # Rename "Todo" → "Scheduled", update group to unstarted, set as new default
    State.objects.filter(
        name="Todo",
        group="unstarted",
        deleted_at__isnull=True,
    ).update(name="Scheduled", default=True)

    # Add missing new states (Internal Review, Postponed) per project
    # NOTE: Triage is NOT added to existing projects — only new projects get all 8 states
    projects_with_system_states = (
        State.objects
        .filter(deleted_at__isnull=True, is_system=True)
        .values("project_id", "workspace_id")
        .distinct()
    )

    new_states = []
    for entry in projects_with_system_states:
        pid = entry["project_id"]
        wid = entry["workspace_id"]

        has_review = State.objects.filter(
            project_id=pid, name="Internal Review", deleted_at__isnull=True
        ).exists()
        has_postponed = State.objects.filter(
            project_id=pid, name="Postponed", deleted_at__isnull=True
        ).exists()

        if not has_review:
            new_states.append(State(
                project_id=pid,
                workspace_id=wid,
                name="Internal Review",
                color="#8B5CF6",
                sequence=35000,
                group="started",
                is_system=True,
                default=False,
            ))
        if not has_postponed:
            new_states.append(State(
                project_id=pid,
                workspace_id=wid,
                name="Postponed",
                color="#9AA4BC",
                sequence=40000,
                group="started",
                is_system=True,
                default=False,
            ))

    if new_states:
        State.objects.bulk_create(new_states, ignore_conflicts=True)


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0139_add_is_system_to_state"),
    ]

    operations = [
        migrations.RunPython(migrate_system_states, reverse_code=migrations.RunPython.noop),
    ]
