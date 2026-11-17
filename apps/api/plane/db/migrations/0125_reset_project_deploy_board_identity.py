from django.db import migrations
from django.db.models import F
from django.utils import timezone


def reset_project_deploy_board_identity(apps, schema_editor):
    """Point every project board, soft-deleted ones included, at its own project.

    Only one live board may publish a project, so when a project already has one the extra board is
    unpublished instead. Mismatched boards are rare, so they are handled one by one.
    """
    boards = apps.get_model("db", "DeployBoard")._base_manager.filter(entity_name="project")
    mismatched = list(boards.exclude(entity_identifier=F("project_id")).order_by("-created_at"))
    # Release the identifiers these boards hold first, so they can be reassigned in any order.
    boards.filter(pk__in=[board.pk for board in mismatched]).update(entity_identifier=None)
    for board in mismatched:
        if not boards.filter(entity_identifier=board.project_id, deleted_at=board.deleted_at).exists():
            boards.filter(pk=board.pk).update(entity_identifier=board.project_id)
        elif board.deleted_at is None:
            boards.filter(pk=board.pk).update(deleted_at=timezone.now())


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0124_intakeissue_intake_issue_snoozed_till_idx"),
    ]

    operations = [
        migrations.RunPython(reset_project_deploy_board_identity, migrations.RunPython.noop),
    ]
