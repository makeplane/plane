# [FA-CUSTOM] Migration for ImportJob model (file-based CSV/XLSX import)

import plane.db.models.importer_job
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0121_profile_calendar_system"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ImportJob",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Created At"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="Last Modified At"),
                ),
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
                    "token",
                    models.CharField(
                        default=plane.db.models.importer_job.generate_import_token,
                        max_length=255,
                        unique=True,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("uploading", "Uploading"),
                            ("mapping", "Mapping"),
                            ("queued", "Queued"),
                            ("processing", "Processing"),
                            ("completed", "Completed"),
                            ("completed_with_errors", "Completed With Errors"),
                            ("failed", "Failed"),
                        ],
                        default="uploading",
                        max_length=50,
                    ),
                ),
                ("file_name", models.CharField(max_length=500)),
                (
                    "file_format",
                    models.CharField(
                        choices=[("csv", "CSV"), ("xlsx", "XLSX")],
                        max_length=10,
                    ),
                ),
                ("total_rows", models.IntegerField(default=0)),
                (
                    "detected_preset",
                    models.CharField(blank=True, default="", max_length=50),
                ),
                ("column_mapping", models.JSONField(default=dict)),
                ("status_mapping", models.JSONField(default=dict)),
                ("assignee_mapping", models.JSONField(default=dict)),
                ("imported_count", models.IntegerField(default=0)),
                ("skipped_count", models.IntegerField(default=0)),
                ("error_count", models.IntegerField(default=0)),
                ("progress", models.IntegerField(default=0)),
                ("error_log", models.JSONField(default=list)),
                ("parsed_data", models.JSONField(blank=True, default=list)),
                ("preview_rows", models.JSONField(default=list)),
                ("detected_columns", models.JSONField(default=list)),
                ("unique_statuses", models.JSONField(default=list)),
                ("unique_assignees", models.JSONField(default=list)),
                (
                    "deleted_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Deleted At"
                    ),
                ),
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
                    "initiated_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="import_jobs",
                        to=settings.AUTH_USER_MODEL,
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
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_%(class)s",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Import Job",
                "verbose_name_plural": "Import Jobs",
                "db_table": "import_jobs",
                "ordering": ("-created_at",),
            },
        ),
    ]
