"""Seed the Integration rows the CE frontend expects.

The model lives in plane.db (it's an orphan from upstream's commercial
extraction). We just insert two rows: Slack and GitHub. Idempotent —
re-running is a no-op because of update_or_create on `provider`.
"""

from django.db import migrations


SEED = [
    {
        "provider": "slack",
        "title": "Slack",
        "author": "Plane",
        "description": {
            "text": "Slack integration for Plane. Receive Plane notifications "
            "in Slack channels and create work items from Slack messages."
        },
        "network": 1,
        "verified": True,
        "avatar_url": "",
        "metadata": {},
    },
    {
        "provider": "github",
        "title": "GitHub",
        "author": "Plane",
        "description": {
            "text": "Two-way sync between Plane work items and GitHub issues."
        },
        "network": 1,
        "verified": True,
        "avatar_url": "",
        "metadata": {},
    },
]


def seed(apps, schema_editor):
    Integration = apps.get_model("db", "Integration")
    for row in SEED:
        Integration.objects.update_or_create(provider=row["provider"], defaults=row)


def unseed(apps, schema_editor):
    Integration = apps.get_model("db", "Integration")
    Integration.objects.filter(provider__in=[r["provider"] for r in SEED]).delete()


class Migration(migrations.Migration):
    # Depend on the `db` app being fully migrated so the Integration table exists.
    # Pin to the latest db migration at the time we wrote this; bump if needed.
    dependencies = [("db", "0121_alter_estimate_type")]

    operations = [migrations.RunPython(seed, unseed)]