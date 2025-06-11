from django.db import models
from django.db.models import TextChoices
from plane.db.models.base import BaseModel
from .enums import ImporterType


class ImportReport(BaseModel):
    batch_size = models.IntegerField(default=0)
    # batch information
    total_batch_count = models.IntegerField(default=0)
    imported_batch_count = models.IntegerField(default=0)
    errored_batch_count = models.IntegerField(default=0)
    completed_batch_count = models.IntegerField(default=0)
    # issues information
    total_issue_count = models.IntegerField(default=0)
    imported_issue_count = models.IntegerField(default=0)
    errored_issue_count = models.IntegerField(default=0)
    # pages information
    total_page_count = models.IntegerField(default=0)
    imported_page_count = models.IntegerField(default=0)
    errored_page_count = models.IntegerField(default=0)
    # time
    start_time = models.DateTimeField(null=True)
    end_time = models.DateTimeField(null=True)

    class Meta:
        verbose_name = "Import Report"
        verbose_name_plural = "Import Reports"
        db_table = "import_reports"
        ordering = ("-created_at",)


class ImportJob(BaseModel):
    class JobStatus(TextChoices):
        PROGRESSING = "PROGRESSING", "Progressing"
        CREATED = "CREATED", "Created"
        QUEUED = "QUEUED", "Queued"
        INITIATED = "INITIATED", "Initiated"
        PULLING = "PULLING", "Pulling"
        PULLED = "PULLED", "Pulled"
        TRANSFORMING = "TRANSFORMING", "Transforming"
        PUSHING = "PUSHING", "Pushing"
        FINISHED = "FINISHED", "Finished"
        ERROR = "ERROR", "Error"
        CANCELLED = "CANCELLED", "Cancelled"

    source = models.CharField(max_length=20)
    config = models.JSONField(default=dict)
    credential = models.ForeignKey(
        "ee.WorkspaceCredential",
        on_delete=models.SET_NULL,
        null=True,
        related_name="jobs",
    )
    project = models.ForeignKey(
        "db.Project", on_delete=models.CASCADE, null=True, related_name="jobs"
    )
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="jobs"
    )
    initiator = models.ForeignKey(
        "db.User", on_delete=models.SET_NULL, null=True, related_name="initiated_jobs"
    )
    report = models.ForeignKey(
        "ee.ImportReport", on_delete=models.SET_NULL, null=True, related_name="reports"
    )
    status = models.CharField(
        max_length=20, choices=JobStatus.choices, default=JobStatus.CREATED
    )
    with_issue_types = models.BooleanField(default=False)
    cancelled_at = models.DateTimeField(null=True)
    success_metadata = models.JSONField(default=dict)
    error_metadata = models.JSONField(default=dict)

    # relation map
    relation_map = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Import Job"
        verbose_name_plural = "Import Jobs"
        db_table = "import_jobs"
        ordering = ("-created_at",)
