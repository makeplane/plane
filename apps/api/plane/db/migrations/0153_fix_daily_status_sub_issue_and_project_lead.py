"""
Data migration: fix Daily Status default views.
- Set sub_issue=False (was True) to default sub-work items to hidden
- Add project_lead=True to display_properties (was missing from migration 0146)
Idempotent — safe to re-run.
"""

from django.db import migrations


def fix_daily_status_views(apps, schema_editor):
    IssueView = apps.get_model("db", "IssueView")

    default_views = IssueView.objects.filter(
        is_default=True,
        project__isnull=True,
        name="Daily Status",
        deleted_at__isnull=True,
    )

    for view in default_views.iterator(chunk_size=500):
        updated = False

        # Fix sub_issue: set to False
        display_filters = dict(view.display_filters or {})
        if display_filters.get("sub_issue") is not False:
            display_filters["sub_issue"] = False
            view.display_filters = display_filters
            updated = True

        # Add project_lead if missing
        display_properties = dict(view.display_properties or {})
        if "project_lead" not in display_properties:
            display_properties["project_lead"] = True
            view.display_properties = display_properties
            updated = True

        if updated:
            view.save(update_fields=["display_filters", "display_properties"])


def reverse_fix(apps, schema_editor):
    # Reversing sub_issue back to True; project_lead removal is not safe
    IssueView = apps.get_model("db", "IssueView")

    default_views = IssueView.objects.filter(
        is_default=True,
        project__isnull=True,
        name="Daily Status",
        deleted_at__isnull=True,
    )

    for view in default_views.iterator(chunk_size=500):
        display_filters = dict(view.display_filters or {})
        display_filters["sub_issue"] = True
        view.display_filters = display_filters
        view.save(update_fields=["display_filters"])


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0152_add_module_activity_model"),
    ]

    operations = [
        migrations.RunPython(fix_daily_status_views, reverse_code=reverse_fix),
    ]
