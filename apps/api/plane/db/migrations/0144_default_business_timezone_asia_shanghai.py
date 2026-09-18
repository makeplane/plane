# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

import pytz
from django.db import migrations, models


DEFAULT_TIMEZONE = "Asia/Shanghai"
TIMEZONE_CHOICES = tuple(zip(pytz.common_timezones, pytz.common_timezones))


def set_business_timezones_to_asia_shanghai(apps, schema_editor):
    """Overwrite every existing business timezone with the deployment default.

    This is intentionally irreversible because the previous per-record timezone
    values cannot be reconstructed. Back up the database before deployment.
    Stored datetimes are not changed.
    """

    database_alias = schema_editor.connection.alias
    timezone_fields = (
        ("User", "user_timezone"),
        ("Workspace", "timezone"),
        ("Project", "timezone"),
        ("Cycle", "timezone"),
        ("PeriodicReport", "timezone"),
        ("WorkspaceResearchSetting", "timezone"),
    )
    for model_name, field_name in timezone_fields:
        model = apps.get_model("db", model_name)
        manager = getattr(model, "all_objects", model._base_manager)
        manager.using(database_alias).all().update(**{field_name: DEFAULT_TIMEZONE})


def prevent_timezone_migration_rollback(apps, schema_editor):
    raise RuntimeError("0144 cannot be reversed because previous timezone preferences were overwritten")


class Migration(migrations.Migration):
    dependencies = [("db", "0143_research_account_provisioning_v2")]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="user_timezone",
            field=models.CharField(choices=TIMEZONE_CHOICES, default=DEFAULT_TIMEZONE, max_length=255),
        ),
        migrations.AlterField(
            model_name="workspace",
            name="timezone",
            field=models.CharField(choices=TIMEZONE_CHOICES, default=DEFAULT_TIMEZONE, max_length=255),
        ),
        migrations.AlterField(
            model_name="project",
            name="timezone",
            field=models.CharField(choices=TIMEZONE_CHOICES, default=DEFAULT_TIMEZONE, max_length=255),
        ),
        migrations.AlterField(
            model_name="cycle",
            name="timezone",
            field=models.CharField(choices=TIMEZONE_CHOICES, default=DEFAULT_TIMEZONE, max_length=255),
        ),
        migrations.AlterField(
            model_name="periodicreport",
            name="timezone",
            field=models.CharField(default=DEFAULT_TIMEZONE, max_length=255),
        ),
        migrations.AlterField(
            model_name="workspaceresearchsetting",
            name="timezone",
            field=models.CharField(blank=True, default=DEFAULT_TIMEZONE, max_length=255, null=True),
        ),
        migrations.RunPython(set_business_timezones_to_asia_shanghai, prevent_timezone_migration_rollback),
    ]
