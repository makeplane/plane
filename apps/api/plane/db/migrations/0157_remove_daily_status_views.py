"""
Data migration: remove all auto-generated "Daily Status" default views from every workspace.
"""

from django.db import migrations


def remove_daily_status_views(apps, schema_editor):
    IssueView = apps.get_model("db", "IssueView")
    IssueView.objects.filter(is_default=True, name="Daily Status", project__isnull=True).delete()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0156_merge_daily_status_fix_and_opinion_removal"),
    ]

    operations = [
        migrations.RunPython(remove_daily_status_views, reverse_code=noop),
    ]
