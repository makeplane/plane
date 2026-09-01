# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Internal addition (not part of upstream makeplane/plane): workspace-scoped
# Contract master + ContractProject join table, the new home for the contract-
# side columns (F/G/H/I/J) that used to live as ProjectCustomFieldValue rows on
# every Project. See docs/internal-contract-project-relationship.md for the
# full design and docs/internal-project-custom-fields.md for the custom-field
# side of the same change.
#
# Dependency below points at the migration name, not the numeric prefix, so
# renaming this file on a future upstream-number collision does not break the
# graph.
#
# After running this migration in dev/staging, also run the in-place companion
# data migration that flips the retired "合同号&项目号" project's
# is_unique_key flag back to False (and removes the field from any project that
# already carries the new "项目序号" one). That cleanup is OUT OF SCOPE here:
# it requires a real database to enumerate project rows, so it lives in a
# separate RunPython migration that's tracked in the worktree notes rather
# than this auto-generated schema migration.

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0125_internal_project_custom_field_group_and_unique_key"),
    ]

    operations = [
        migrations.CreateModel(
            name="Contract",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("contract_no", models.CharField(max_length=64)),
                ("contract_name", models.CharField(blank=True, max_length=255)),
                ("contract_type", models.CharField(blank=True, max_length=64)),
                ("customer", models.CharField(blank=True, max_length=255)),
                ("sign_date", models.DateField(blank=True, null=True)),
                ("start_date", models.DateField(blank=True, null=True)),
                ("end_date", models.DateField(blank=True, null=True)),
                (
                    "total_amount",
                    models.DecimalField(blank=True, decimal_places=4, max_digits=20, null=True),
                ),
                ("tax_rate", models.DecimalField(blank=True, decimal_places=4, max_digits=7, null=True)),
                ("status", models.CharField(blank=True, max_length=64)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="contract_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="contract_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Updated By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="contracts",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Contract",
                "verbose_name_plural": "Contracts",
                "db_table": "contracts",
                "ordering": ("workspace_id", "contract_no"),
            },
        ),
        migrations.CreateModel(
            name="ContractProject",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                (
                    "allocation_ratio",
                    models.DecimalField(blank=True, decimal_places=4, max_digits=7, null=True),
                ),
                ("relation_type", models.CharField(blank=True, max_length=64)),
                ("relation_role", models.CharField(blank=True, max_length=32)),
                (
                    "allocated_amount",
                    models.DecimalField(blank=True, decimal_places=4, max_digits=20, null=True),
                ),
                ("scope_description", models.TextField(blank=True)),
                ("start_date", models.DateField(blank=True, null=True)),
                ("end_date", models.DateField(blank=True, null=True)),
                ("status", models.CharField(blank=True, max_length=64)),
                ("remark", models.TextField(blank=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="contractproject_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="contractproject_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Updated By",
                    ),
                ),
                (
                    "contract",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_links",
                        to="db.contract",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_contractproject",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_contractproject",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Contract Project",
                "verbose_name_plural": "Contract Projects",
                "db_table": "contract_projects",
                "ordering": ("project_id", "contract_id"),
            },
        ),
        migrations.AddConstraint(
            model_name="contract",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("workspace", "contract_no"),
                name="contract_unique_workspace_contract_no_when_not_deleted",
            ),
        ),
        migrations.AddConstraint(
            model_name="contractproject",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("contract", "project"),
                name="contract_project_unique_contract_project_when_not_deleted",
            ),
        ),
        migrations.AddIndex(
            model_name="contractproject",
            index=models.Index(fields=["project"], name="contract_pro_project_idx"),
        ),
    ]