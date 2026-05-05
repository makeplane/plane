"""
Data migration: seed a default "Daily Status" view for every existing workspace.
Idempotent — skips workspaces that already have an is_default view.
"""

import uuid
from django.db import migrations


def get_default_display_properties():
    return {
        "assignee": True,
        "start_date": True,
        "due_date": True,
        "labels": False,
        "key": True,
        "priority": True,
        "state": True,
        "sub_issue_count": True,
        "link": False,
        "attachment_count": False,
        "estimate": False,
        "created_on": False,
        "updated_on": False,
        "modules": True,
        "cycle": True,
        "issue_type": False,
        # CE extended properties
        "department_name": True,
        "project_name": True,
        "bank_wide_project": True,
        "progress_tracking": True,
        "completed_date": True,
        "reference_link": True,
        "total_log_time": True,
    }


def get_default_display_filters():
    return {
        "layout": "spreadsheet",
        "order_by": "-created_at",
        "group_by": None,
        "sub_issue": True,
        "show_empty_groups": True,
        "type": None,
        "calendar_date_range": "",
    }


def get_default_filters():
    """
    Filters are intentionally empty in the DB.
    The frontend resolves "today" dynamically into YYYY-MM-DD;after / YYYY-MM-DD;before
    query params at fetch time via the resolveDefaultViewFilters helper.
    """
    return {}


def seed_default_views(apps, schema_editor):
    Workspace = apps.get_model("db", "Workspace")
    IssueView = apps.get_model("db", "IssueView")

    workspaces = Workspace.objects.filter(deleted_at__isnull=True).values("id", "owner_id")

    # Batch-process in chunks of 1000
    batch_size = 1000
    views_to_create = []

    # Get workspace IDs already having a default view
    existing_defaults = set(
        IssueView.objects.filter(is_default=True, project__isnull=True).values_list(
            "workspace_id", flat=True
        )
    )

    for workspace in workspaces.iterator(chunk_size=batch_size):
        workspace_id = workspace["id"]
        if workspace_id in existing_defaults:
            continue

        views_to_create.append(
            IssueView(
                id=uuid.uuid4(),
                workspace_id=workspace_id,
                name="Daily Status",
                description="Auto-generated daily status view",
                filters=get_default_filters(),
                query={},
                display_filters=get_default_display_filters(),
                display_properties=get_default_display_properties(),
                rich_filters={},
                access=1,  # Public
                is_default=True,
                is_locked=True,
                owned_by_id=workspace["owner_id"],
                logo_props={},
                sort_order=0,
            )
        )

        if len(views_to_create) >= batch_size:
            IssueView.objects.bulk_create(views_to_create, ignore_conflicts=True)
            views_to_create = []

    if views_to_create:
        IssueView.objects.bulk_create(views_to_create, ignore_conflicts=True)


def reverse_seed(apps, schema_editor):
    IssueView = apps.get_model("db", "IssueView")
    IssueView.objects.filter(is_default=True, name="Daily Status", project__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0145_issueview_is_default"),
    ]

    operations = [
        migrations.RunPython(seed_default_views, reverse_code=reverse_seed),
    ]
