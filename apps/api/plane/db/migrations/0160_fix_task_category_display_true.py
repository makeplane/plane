"""
Fix-up migration: set main_task_category and sub_task_category to True on all
project default views. Migration 0159 incorrectly set them to False, hiding
the columns. getComputedDisplayProperties defaults both to True when absent,
so the explicit value must also be True to match expected behavior.
"""

from django.db import migrations


def fix_task_category_props(apps, schema_editor):
    IssueView = apps.get_model("db", "IssueView")
    views = IssueView.objects.filter(
        project__isnull=False,
        is_default=True,
    ).only("id", "display_properties")

    to_update = []
    for view in views:
        props = dict(view.display_properties or {})
        changed = False
        if props.get("main_task_category") is False:
            props["main_task_category"] = True
            changed = True
        if props.get("sub_task_category") is False:
            props["sub_task_category"] = True
            changed = True
        if changed:
            view.display_properties = props
            to_update.append(view)

    if to_update:
        IssueView.objects.bulk_update(to_update, ["display_properties"], batch_size=500)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0159_add_task_category_to_default_views"),
    ]

    operations = [
        migrations.RunPython(fix_task_category_props, reverse_code=noop),
    ]
