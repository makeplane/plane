from django.db import migrations

DEFAULT_PROJECT_VIEW_DISPLAY_FILTERS = {
    "layout": "spreadsheet",
    "order_by": "-created_at",
    "group_by": None,
    "sub_issue": True,
    "show_empty_groups": True,
    "type": None,
    "calendar_date_range": "",
}

DEFAULT_PROJECT_VIEW_DISPLAY_PROPERTIES = {
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
    "bank_wide_project": True,
    "progress_tracking": True,
    "completed_date": True,
    "reference_link": True,
    "total_log_time": True,
    "department_name": False,
    "project_name": False,
}


def seed_default_project_views(apps, schema_editor):
    Project = apps.get_model("db", "Project")
    IssueView = apps.get_model("db", "IssueView")

    views_to_create = []
    for project in (
        Project.objects.filter(deleted_at__isnull=True)
        .select_related("workspace", "workspace__owner", "created_by")
        .iterator(chunk_size=500)
    ):
        if IssueView.objects.filter(project=project, is_default=True).exists():
            continue
        owned_by = project.created_by or project.workspace.owner
        views_to_create.append(
            IssueView(
                workspace=project.workspace,
                project=project,
                name="Daily Status",
                description="Auto-generated daily status view",
                filters={},
                query={},
                display_filters=DEFAULT_PROJECT_VIEW_DISPLAY_FILTERS,
                display_properties=DEFAULT_PROJECT_VIEW_DISPLAY_PROPERTIES,
                rich_filters={},
                access=1,
                is_default=True,
                is_locked=True,
                owned_by=owned_by,
                logo_props={},
                sort_order=0,
            )
        )
        if len(views_to_create) >= 500:
            IssueView.objects.bulk_create(views_to_create, batch_size=500)
            views_to_create = []

    if views_to_create:
        IssueView.objects.bulk_create(views_to_create, batch_size=500)


def reverse_seed(apps, schema_editor):
    IssueView = apps.get_model("db", "IssueView")
    IssueView.objects.filter(project__isnull=False, is_default=True, name="Daily Status").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0147_update_default_view_rich_filters"),
    ]

    operations = [
        migrations.RunPython(seed_default_project_views, reverse_seed),
    ]
