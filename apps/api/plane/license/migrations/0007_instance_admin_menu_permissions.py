# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import migrations, models

from plane.license.menu_registry import ALL_PERMISSION_KEYS


def backfill_super_admins(apps, schema_editor):
    """Stamp every pre-existing loginable admin as super with all menus.

    Preserves today's all-access behavior for current admins. Ghost rows
    (user SET_NULL'd) are deliberately excluded — a login-less row must
    never satisfy the at-least-one-super invariant.
    """
    InstanceAdmin = apps.get_model("license", "InstanceAdmin")
    InstanceAdmin.objects.filter(user__isnull=False).update(
        is_super_admin=True, allowed_menus=list(ALL_PERMISSION_KEYS)
    )


def revert_backfill(apps, schema_editor):
    InstanceAdmin = apps.get_model("license", "InstanceAdmin")
    InstanceAdmin.objects.update(is_super_admin=False, allowed_menus=[])


class Migration(migrations.Migration):
    dependencies = [
        ("license", "0006_instance_is_current_version_deprecated"),
    ]

    operations = [
        migrations.AddField(
            model_name="instanceadmin",
            name="is_super_admin",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="instanceadmin",
            name="allowed_menus",
            field=models.JSONField(default=list),
        ),
        migrations.RunPython(backfill_super_admins, revert_backfill),
    ]
