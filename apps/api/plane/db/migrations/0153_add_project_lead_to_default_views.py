"""
Data migration: add project_lead display property to existing default "Daily Status" views.
Idempotent — skips views that already have project_lead set.
"""

from django.db import migrations


def add_project_lead_to_default_views(apps, schema_editor):
    IssueView = apps.get_model("db", "IssueView")

    # Workspace-level default views: project_lead enabled
    workspace_views = IssueView.objects.filter(
        is_default=True,
        project__isnull=True,
    ).exclude(display_properties__has_key="project_lead")

    for view in workspace_views:
        view.display_properties["project_lead"] = True
        view.save(update_fields=["display_properties"])

    # Project-level default views: project_lead disabled (redundant in single-project context)
    project_views = IssueView.objects.filter(
        is_default=True,
        project__isnull=False,
    ).exclude(display_properties__has_key="project_lead")

    for view in project_views:
        view.display_properties["project_lead"] = False
        view.save(update_fields=["display_properties"])


def remove_project_lead_from_default_views(apps, schema_editor):
    IssueView = apps.get_model("db", "IssueView")
    for view in IssueView.objects.filter(is_default=True):
        view.display_properties.pop("project_lead", None)
        view.save(update_fields=["display_properties"])


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0152_add_module_activity_model"),
    ]

    operations = [
        migrations.RunPython(
            add_project_lead_to_default_views,
            remove_project_lead_from_default_views,
        ),
    ]
