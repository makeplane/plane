# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from django.db import models
from django.db.models import TextChoices
from plane.db.models.base import BaseModel


class ImportExecutionLog(BaseModel):
    """
    Stores individual execution log records for import jobs
    Replaces the JSONField in ImportReport for better querying and performance
    """

    class ImportExecutionLogLevel(models.TextChoices):
        INFO = (
            "info",
            "Info",
        )
        SUCCESS = (
            "success",
            "Success",
        )
        ERROR = "error", "Error"

    class ImportExecutionLogEntityType(models.TextChoices):
        BOARDS = "BOARDS", "boards"
        PROJECT = "PROJECT", "project"
        USER = "USER", "user"
        CYCLE = "CYCLE", "cycle"
        MODULE = "MODULE", "module"
        WORK_ITEM = "WORK_ITEM", "work_item"
        WORK_LOG = "WORK_LOG", "work_log"
        WORK_ITEM_ATTACHMENT = "WORK_ITEM_ATTACHMENT", "work_item_attachment"
        WORK_ITEM_COMMENT = "WORK_ITEM_COMMENT", "work_item_comment"
        WORK_ITEM_RELATIONS = "WORK_ITEM_RELATIONS", "work_item_relations"
        WORK_ITEM_COMMENT_ATTACHMENT = "WORK_ITEM_COMMENT_ATTACHMENT", "work_item_comment_attachment"
        WORK_ITEM_LINK = "WORK_ITEM_LINK", "work_item_link"
        ISSUE_TYPE = "ISSUE_TYPE", "issue_type"
        ISSUE_PROPERTY = "ISSUE_PROPERTY", "issue_property"
        ISSUE_DEFAULT_PROPERTY = "ISSUE_DEFAULT_PROPERTY", "issue_default_property"
        ISSUE_PROPERTY_OPTION = "ISSUE_PROPERTY_OPTION", "issue_property_option"
        ISSUE_PROPERTY_VALUE = "ISSUE_PROPERTY_VALUE", "issue_property_value"

    # Relationships
    report = models.ForeignKey(
        "ee.ImportReport",
        on_delete=models.CASCADE,
        related_name="execution_logs",
    )

    job = models.ForeignKey(
        "ee.ImportJob",
        on_delete=models.CASCADE,
        related_name="execution_logs",
    )

    # Core fields
    entity_type = models.CharField(
        max_length=50, db_index=True, help_text="Type of the entity (USER, WORK_ITEM_TYPE, WORK_ITEM, etc.)"
    )
    level = models.CharField(
        max_length=20,
        choices=ImportExecutionLogLevel.choices,
        default=ImportExecutionLogLevel.INFO,
        db_index=True,
        help_text="Log level",
    )
    phase = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        db_index=True,
        help_text="Phase of execution (PULL_USERS, PUSH_ISSUES, etc.)",
    )

    # Optional fields
    related_entity = models.CharField(
        max_length=255, null=True, blank=True, help_text="External ID this log relates to"
    )
    related_entity_type = models.CharField(
        max_length=255, null=True, blank=True, help_text="Type of the related entity, USER, WORK_ITEM_TYPE, WORK_ITEM"
    )
    ignore_summarization = models.BooleanField(default=False, help_text="Whether to exclude from summary calculations")

    # Common fields across SUCCESS/ERROR levels (nullable for INFO)
    entity_name = models.CharField(max_length=255, null=True, blank=True)
    entity_plane_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    entity_external_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    already_exists = models.BooleanField(null=True, blank=True)

    # INFO level: metrics
    metrics = models.JSONField(default=dict, help_text="Metrics for INFO logs (total, pulled, imported, etc.)")

    # ERROR level: error details
    is_fatal = models.BooleanField(default=False)
    error = models.JSONField(default=dict, help_text="Error details (message, stack, etc.)")

    # Additional context data
    additional_data = models.JSONField(default=dict, help_text="Additional contextual data")

    class Meta:
        verbose_name = "Import Execution Log"
        verbose_name_plural = "Execution Logs"
        db_table = "import_execution_logs"
        ordering = ("created_at",)


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

    # Summary Asset Id
    summary_asset = models.ForeignKey(
        "db.fileasset",
        on_delete=models.SET_NULL,
        null=True,
        related_name="job_summary_asset",
    )

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
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, null=True, related_name="jobs")
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="jobs")
    initiator = models.ForeignKey("db.User", on_delete=models.SET_NULL, null=True, related_name="initiated_jobs")
    report = models.ForeignKey("ee.ImportReport", on_delete=models.SET_NULL, null=True, related_name="reports")
    status = models.CharField(max_length=20, choices=JobStatus.choices, default=JobStatus.CREATED)
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
