"""
Data migration: add main_task_category and sub_task_category keys to
display_properties of all existing project default ("Daily Status") views.
Set to True so columns are visible by default (matches getComputedDisplayProperties default).
"""

from django.db import migrations


def add_task_category_props(apps, schema_editor):
    IssueView = apps.get_model("db", "IssueView")
    views = IssueView.objects.filter(
        project__isnull=False,
        is_default=True,
    ).only("id", "display_properties")

    to_update = []
    for view in views:
        props = dict(view.display_properties or {})
        changed = False
        if "main_task_category" not in props:
            props["main_task_category"] = True
            changed = True
        if "sub_task_category" not in props:
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
        ("db", "0158_add_task_category_models"),
    ]

    operations = [
        migrations.RunPython(add_task_category_props, reverse_code=noop),
    ]
