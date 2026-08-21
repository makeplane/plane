# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import migrations


def mark_inactive_members_revoked(apps, schema_editor):
    WorkspaceMember = apps.get_model("db", "WorkspaceMember")
    ProjectMember = apps.get_model("db", "ProjectMember")
    WorkspaceMember.objects.filter(is_active=False).update(access_revoked=True)
    ProjectMember.objects.filter(is_active=False).update(access_revoked=True)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0124_workspacemember_access_revoked"),
    ]

    operations = [
        migrations.RunPython(mark_inactive_members_revoked, noop_reverse),
    ]
