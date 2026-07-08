# Generated manually for the work-item-properties module.

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0123_issue_pages"),
    ]

    operations = [
        migrations.CreateModel(
            name="IssueProperty",
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
                ("display_name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                (
                    "property_type",
                    models.CharField(
                        choices=[
                            ("TEXT", "Text"),
                            ("DECIMAL", "Decimal"),
                            ("BOOLEAN", "Boolean"),
                            ("DATETIME", "Datetime"),
                            ("OPTION", "Option"),
                            ("RELATION", "Relation"),
                            ("URL", "URL"),
                            ("EMAIL", "Email"),
                            ("FILE", "File"),
                            ("FORMULA", "Formula"),
                        ],
                        max_length=255,
                    ),
                ),
                (
                    "relation_type",
                    models.CharField(
                        blank=True,
                        choices=[("USER", "User"), ("ISSUE", "Issue")],
                        max_length=255,
                        null=True,
                    ),
                ),
                ("is_required", models.BooleanField(default=False)),
                ("is_multi", models.BooleanField(default=False)),
                ("is_active", models.BooleanField(default=True)),
                ("default_value", models.TextField(blank=True, null=True)),
                ("settings", models.JSONField(default=dict)),
                ("sort_order", models.FloatField(default=65535)),
                ("external_source", models.CharField(blank=True, max_length=255, null=True)),
                ("external_id", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "issue_type",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="properties",
                        to="db.issuetype",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_%(class)s",
                        to="db.project",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_%(class)s",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Issue Property",
                "verbose_name_plural": "Issue Properties",
                "db_table": "issue_properties",
                "ordering": ("sort_order",),
            },
        ),
        migrations.CreateModel(
            name="IssuePropertyOption",
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
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("is_default", models.BooleanField(default=False)),
                ("sort_order", models.FloatField(default=65535)),
                ("logo_props", models.JSONField(default=dict)),
                ("external_source", models.CharField(blank=True, max_length=255, null=True)),
                ("external_id", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "property",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="options",
                        to="db.issueproperty",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_%(class)s",
                        to="db.project",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_%(class)s",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Issue Property Option",
                "verbose_name_plural": "Issue Property Options",
                "db_table": "issue_property_options",
                "ordering": ("sort_order",),
            },
        ),
        migrations.CreateModel(
            name="IssuePropertyValue",
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
                ("value_text", models.TextField(blank=True, null=True)),
                ("value_boolean", models.BooleanField(blank=True, null=True)),
                (
                    "value_decimal",
                    models.DecimalField(blank=True, decimal_places=10, max_digits=30, null=True),
                ),
                ("value_datetime", models.DateTimeField(blank=True, null=True)),
                ("value_uuid", models.UUIDField(blank=True, null=True)),
                ("external_source", models.CharField(blank=True, max_length=255, null=True)),
                ("external_id", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "issue",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="property_values",
                        to="db.issue",
                    ),
                ),
                (
                    "property",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="values",
                        to="db.issueproperty",
                    ),
                ),
                (
                    "value_option",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="property_values",
                        to="db.issuepropertyoption",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_%(class)s",
                        to="db.project",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_%(class)s",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Issue Property Value",
                "verbose_name_plural": "Issue Property Values",
                "db_table": "issue_property_values",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="issueproperty",
            index=models.Index(fields=["issue_type", "project"], name="issue_prop_type_project_idx"),
        ),
        migrations.AddIndex(
            model_name="issuepropertyoption",
            index=models.Index(fields=["property", "project"], name="issue_prop_opt_prop_proj_idx"),
        ),
        migrations.AddIndex(
            model_name="issuepropertyvalue",
            index=models.Index(fields=["issue", "property"], name="issue_prop_val_issue_prop_idx"),
        ),
    ]
