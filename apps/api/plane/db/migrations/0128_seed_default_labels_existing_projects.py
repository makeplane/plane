# Data migration: backfill default labels for all existing projects.
# Inlined label data — do NOT import from app models to keep migration self-contained.
from django.db import migrations

_DEFAULT_LABELS = [
    {"name": "Bank-wide Project", "color": "#0E8A16", "sort_order": 65535},
    {"name": "Daily",             "color": "#0075CA", "sort_order": 75535},
    {"name": "Weekly",            "color": "#E4E669", "sort_order": 85535},
    {"name": "Monthly",           "color": "#D93F0B", "sort_order": 95535},
    {"name": "Quarterly",         "color": "#0693E3", "sort_order": 105535},
    {"name": "Half-year",         "color": "#FBCA04", "sort_order": 115535},
    {"name": "Yearly",            "color": "#B60205", "sort_order": 125535},
    {"name": "Ad-hoc",            "color": "#D876E3", "sort_order": 135535},
]


def seed_default_labels(apps, schema_editor):
    Label = apps.get_model("db", "Label")
    Project = apps.get_model("db", "Project")
    for project in Project.objects.all():
        # created_by intentionally omitted — no request user context in migrations
        Label.objects.bulk_create(
            [
                Label(
                    name=lbl["name"],
                    color=lbl["color"],
                    sort_order=lbl["sort_order"],
                    project=project,
                    workspace=project.workspace,
                )
                for lbl in _DEFAULT_LABELS
            ],
            ignore_conflicts=True,
        )


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0127_drop_analytics_dashboard_tables"),
    ]
    operations = [
        migrations.RunPython(seed_default_labels, migrations.RunPython.noop),
    ]
