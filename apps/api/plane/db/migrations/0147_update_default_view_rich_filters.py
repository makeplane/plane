"""
Data migration: populate rich_filters for existing default "Daily Status" workspace views.
Idempotent — only updates views where rich_filters is currently empty {}.
"""

from django.db import migrations

DEFAULT_RICH_FILTERS = {
    "start_date": ["today;after_including;"],
    "target_date": ["today;before_including;"],
}


def update_default_view_rich_filters(apps, schema_editor):
    IssueView = apps.get_model("db", "IssueView")
    IssueView.objects.filter(
        is_default=True,
        project__isnull=True,
        rich_filters={},
    ).update(rich_filters=DEFAULT_RICH_FILTERS)


def reverse_update(apps, schema_editor):
    IssueView = apps.get_model("db", "IssueView")
    IssueView.objects.filter(
        is_default=True,
        project__isnull=True,
        rich_filters=DEFAULT_RICH_FILTERS,
    ).update(rich_filters={})


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0146_seed_default_workspace_views"),
    ]

    operations = [
        migrations.RunPython(update_default_view_rich_filters, reverse_code=reverse_update),
    ]
