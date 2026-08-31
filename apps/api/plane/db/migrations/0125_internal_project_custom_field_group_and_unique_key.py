# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Internal addition (not part of upstream makeplane/plane): adds the two columns
# needed to auto-seed every project with a standard set of custom fields (see
# apps/api/plane/db/default_data/project_custom_fields.py) and to display them
# grouped on the new project-info page. See 0123_internal_project_custom_field.py
# for the upgrade-safety rationale behind this migration's dependency and naming.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0124_internal_project_custom_field_types"),
    ]

    operations = [
        migrations.AddField(
            model_name="projectcustomfield",
            name="group_name",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="projectcustomfield",
            name="is_unique_key",
            field=models.BooleanField(default=False),
        ),
    ]
