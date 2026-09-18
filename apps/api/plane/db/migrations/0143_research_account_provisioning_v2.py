# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("db", "0142_pilab_brand_labels")]

    operations = [
        migrations.AddField(
            model_name="researchinvitecode",
            name="provisioning_version",
            field=models.PositiveSmallIntegerField(default=1),
        ),
        migrations.AddField(
            model_name="researchinvitecode",
            name="profile_category",
            field=models.CharField(blank=True, default="", max_length=16),
        ),
        migrations.AddField(
            model_name="researchinvitecode",
            name="primary_advisor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="research_invite_codes_as_primary_advisor",
                to="db.user",
            ),
        ),
    ]
