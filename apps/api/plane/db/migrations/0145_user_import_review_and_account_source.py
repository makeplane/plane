# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("db", "0144_default_business_timezone_asia_shanghai")]

    operations = [
        migrations.AddField(model_name="userimportbatch", name="advisor_mapping", field=models.JSONField(blank=True, default=dict)),
        migrations.AddField(model_name="userimportbatch", name="rejection_reason", field=models.TextField(blank=True, default="")),
        migrations.AddField(model_name="userimportbatch", name="reviewed_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(
            model_name="userimportbatch",
            name="reviewed_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reviewed_research_import_batches", to="db.user"),
        ),
        migrations.AlterField(
            model_name="userimportbatch",
            name="status",
            field=models.CharField(choices=[("PENDING_REVIEW", "Pending review"), ("PENDING", "Pending"), ("IMPORTED", "Imported"), ("REJECTED", "Rejected"), ("FAILED", "Failed")], default="PENDING_REVIEW", max_length=16),
        ),
        migrations.AddField(model_name="userimportrow", name="business_category", field=models.CharField(blank=True, default="", max_length=32)),
        migrations.AddField(model_name="userimportrow", name="category", field=models.CharField(blank=True, default="", max_length=16)),
        migrations.AddField(model_name="userimportrow", name="co_advisor_1_email", field=models.CharField(blank=True, default="", max_length=255)),
        migrations.AddField(model_name="userimportrow", name="co_advisor_1_name", field=models.CharField(blank=True, default="", max_length=255)),
        migrations.AddField(model_name="userimportrow", name="co_advisor_2_email", field=models.CharField(blank=True, default="", max_length=255)),
        migrations.AddField(model_name="userimportrow", name="co_advisor_2_name", field=models.CharField(blank=True, default="", max_length=255)),
        migrations.AddField(model_name="userimportrow", name="degree", field=models.CharField(blank=True, default="", max_length=8)),
        migrations.AddField(model_name="userimportrow", name="edited_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="userimportrow", name="grade", field=models.CharField(blank=True, default="", max_length=16)),
        migrations.AddField(model_name="userimportrow", name="phone", field=models.CharField(blank=True, default="", max_length=32)),
        migrations.AddField(model_name="userimportrow", name="primary_advisor_email", field=models.CharField(blank=True, default="", max_length=255)),
        migrations.AddField(model_name="userimportrow", name="review_decision", field=models.CharField(choices=[("PENDING", "Pending"), ("INCLUDED", "Included"), ("EXCLUDED", "Excluded")], default="PENDING", max_length=16)),
        migrations.AddField(model_name="userimportrow", name="review_note", field=models.CharField(blank=True, default="", max_length=500)),
        migrations.CreateModel(
            name="UserImportAccountSource",
            fields=[
                ("id", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("kind", models.CharField(choices=[("ROSTER", "Roster"), ("ADVISOR", "Advisor")], max_length=16)),
                ("initial_password", models.CharField(blank=True, default="", max_length=128)),
                ("deactivated_workspace_ids", models.JSONField(blank=True, default=list)),
                ("deactivated_at", models.DateTimeField(blank=True, null=True)),
                ("batch", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="created_accounts", to="db.userimportbatch")),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to="db.user", verbose_name="Created By")),
                ("deactivated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="deactivated_import_accounts", to="db.user")),
                ("row", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_accounts", to="db.userimportrow")),
                ("updated_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to="db.user", verbose_name="Last Modified By")),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="import_account_source", to="db.user")),
            ],
            options={"verbose_name": "Imported Account Source", "verbose_name_plural": "Imported Account Sources", "db_table": "research_user_import_account_sources"},
        ),
        migrations.AddIndex(model_name="userimportaccountsource", index=models.Index(fields=["batch", "kind"], name="rsch_impa_batch_kind_idx")),
    ]
