# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import migrations, models


class Migration(migrations.Migration):
    """Add the `page` event subscription flag to Webhook."""

    dependencies = [
        ("db", "0121_alter_estimate_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="webhook",
            name="page",
            field=models.BooleanField(default=False),
        ),
    ]
