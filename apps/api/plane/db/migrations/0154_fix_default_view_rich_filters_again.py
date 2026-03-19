"""
Fix: Reset rich_filters to {} for ALL default workspace views created after migration 0150.

Workspaces created between 0150 and the workspace.py signal fix still received
rich_filters = {start_date: [...], target_date: [...]} which is unsupported by
the frontend filter adapter. This migration is idempotent — safe to run multiple times.
"""

from django.db import migrations


def fix_default_view_rich_filters(apps, schema_editor):
    IssueView = apps.get_model("db", "IssueView")
    IssueView.objects.filter(
        is_default=True,
        project__isnull=True,
    ).exclude(rich_filters={}).update(rich_filters={})


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0153_add_project_lead_to_default_views"),
    ]

    operations = [
        migrations.RunPython(fix_default_view_rich_filters, reverse_code=migrations.RunPython.noop),
    ]
