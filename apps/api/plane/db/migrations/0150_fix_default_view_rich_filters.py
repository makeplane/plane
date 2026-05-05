"""
Fix: Reset rich_filters to {} for all default workspace views.

Migration 0147 set rich_filters = {start_date: [...], target_date: [...]} which is
an unsupported format by the frontend filter adapter. The adapter expects field__operator
style keys (e.g. start_date__after_including) or and/not logical groups.

Per the original design decision, rich_filters should be empty — the frontend handles
date resolution dynamically if needed.
"""

from django.db import migrations


def fix_default_view_rich_filters(apps, schema_editor):
    IssueView = apps.get_model("db", "IssueView")
    IssueView.objects.filter(
        is_default=True,
        project__isnull=True,
    ).update(rich_filters={})


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0149_merge_migrations"),
    ]

    operations = [
        migrations.RunPython(fix_default_view_rich_filters, reverse_code=migrations.RunPython.noop),
    ]
