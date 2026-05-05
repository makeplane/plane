# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0142_issueopinion"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="is_bank_wide",
            field=models.BooleanField(
                default=False, verbose_name="Is Bank-wide Project"
            ),
        ),
    ]
