# [FA-CUSTOM] File-based CSV/XLSX import job tracking
# This model is intentionally separate from the existing Importer model
# (which is designed for API-based GitHub/Jira imports with an APIToken FK).

from uuid import uuid4

from django.conf import settings
from django.db import models

from .project import ProjectBaseModel


def generate_import_token():
    return uuid4().hex


class ImportJob(ProjectBaseModel):
    """
    Tracks a single file-based import operation (CSV/XLSX → issues).
    Mirrors ExporterHistory pattern but project-scoped.
    """

    token = models.CharField(
        max_length=255, default=generate_import_token, unique=True
    )
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="import_jobs",
    )
    status = models.CharField(
        max_length=50,
        choices=(
            ("uploading", "Uploading"),
            ("mapping", "Mapping"),
            ("queued", "Queued"),
            ("processing", "Processing"),
            ("completed", "Completed"),
            ("completed_with_errors", "Completed With Errors"),
            ("failed", "Failed"),
        ),
        default="uploading",
    )

    # File metadata
    file_name = models.CharField(max_length=500)
    file_format = models.CharField(
        max_length=10,
        choices=(("csv", "CSV"), ("xlsx", "XLSX")),
    )
    total_rows = models.IntegerField(default=0)

    # Source tool detection
    detected_preset = models.CharField(max_length=50, blank=True, default="")

    # User-provided mapping configuration (set during wizard steps 2-4)
    column_mapping = models.JSONField(default=dict)
    status_mapping = models.JSONField(default=dict)
    assignee_mapping = models.JSONField(default=dict)

    # Import results
    imported_count = models.IntegerField(default=0)
    skipped_count = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)

    # Progress tracking for polling (0-100)
    progress = models.IntegerField(default=0)

    # Error log stored as JSON array
    error_log = models.JSONField(default=list)

    # Parsed data cached as JSON (temporary, cleared after import)
    parsed_data = models.JSONField(default=list, blank=True)

    # Preview data (first 5 rows for frontend display)
    preview_rows = models.JSONField(default=list)

    # All detected column headers from the file
    detected_columns = models.JSONField(default=list)

    # Unique values found in status and assignee columns
    unique_statuses = models.JSONField(default=list)
    unique_assignees = models.JSONField(default=list)

    class Meta:
        verbose_name = "Import Job"
        verbose_name_plural = "Import Jobs"
        db_table = "import_jobs"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.file_name} <{self.project.name}> ({self.status})"
