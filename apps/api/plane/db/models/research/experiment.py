# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Experiment records, versions and amendments (P1-EXP-01 ~ P1-EXP-14, §4.5).

An experiment is registered once, gets a project wide ``sequence_no`` that is
never reused, and locks its key fields as soon as it starts running. Changing a
submitted record goes through an amendment; an approved amendment appends an
immutable version - nothing is ever overwritten in place.
"""

from django.db import models
from django.db.models import Q

from plane.db.models.base import BaseModel

from .append_only import AppendOnlyModel
from .config import ReportVisibility

# Fields that are frozen once the experiment starts running (P1-EXP-04, G-05).
LOCKED_FIELDS = (
    "molecular_system",
    "smiles",
    "system_composition",
    "method",
    "parameters",
    "environment",
    "started_at",
)

# Fields an amendment may change; the complement of the locked set is explicit
# so a request for anything else is rejected before it reaches the approver.
AMENDABLE_FIELDS = (
    "title",
    "objective",
    "hypothesis",
    "result",
    "metrics",
    "conclusion",
    "failure_reason",
    "status_note",
    "status",
    "completed_at",
)


class ExperimentRecord(BaseModel):
    """One experiment registration (management view, no raw data) — §4.5."""

    class Status(models.TextChoices):
        PLANNED = "PLANNED", "Planned"
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"
        ARCHIVED = "ARCHIVED", "Archived"

    class Source(models.TextChoices):
        MANUAL = "MANUAL", "Manual"
        AUTOMATED = "AUTOMATED", "Automated"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_experiments",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="research_experiments",
    )
    sequence_no = models.PositiveIntegerField()
    stage_instance = models.ForeignKey(
        "db.ResearchStageInstance",
        on_delete=models.SET_NULL,
        related_name="experiments",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255)
    objective = models.TextField(blank=True, default="")
    hypothesis = models.TextField(blank=True, default="")
    molecular_system = models.CharField(max_length=255, blank=True, default="")
    smiles = models.CharField(max_length=500, blank=True, default="")
    system_composition = models.TextField(blank=True, default="")
    method = models.CharField(max_length=255, blank=True, default="")
    parameters = models.JSONField(default=dict, blank=True)
    environment = models.JSONField(default=dict, blank=True)
    result = models.TextField(blank=True, default="")
    metrics = models.JSONField(default=dict, blank=True)
    conclusion = models.TextField(blank=True, default="")
    failure_reason = models.TextField(blank=True, default="")
    # why an unfinished experiment is still open (P1-MID-03)
    status_note = models.TextField(blank=True, default="")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PLANNED)
    source = models.CharField(max_length=16, choices=Source.choices, default=Source.MANUAL)
    owner = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_experiments",
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_locked = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(null=True, blank=True)
    current_version_no = models.PositiveIntegerField(default=1)
    visibility = models.CharField(
        max_length=32,
        choices=ReportVisibility.choices,
        default=ReportVisibility.DIRECT_ADVISOR,
    )

    class Meta:
        verbose_name = "Experiment Record"
        verbose_name_plural = "Experiment Records"
        db_table = "research_experiment_records"
        ordering = ("project", "sequence_no")
        constraints = [
            models.UniqueConstraint(fields=["project", "sequence_no"], name="rsch_experiment_uq_project_seq"),
        ]
        indexes = [
            models.Index(fields=["workspace", "status"], name="rsch_experiment_ws_status_idx"),
            models.Index(fields=["project", "status", "completed_at"], name="rsch_experiment_project_st_idx"),
            models.Index(fields=["project", "created_at"], name="rsch_experiment_project_idx"),
        ]

    def __str__(self):
        return f"{self.project_id}#{self.sequence_no} <{self.title[:40]}>"

    @property
    def is_read_only(self):
        """Submitted records are read only until an amendment is approved."""
        return self.submitted_at is not None and self.status != self.Status.ARCHIVED


class ExperimentRecordVersion(AppendOnlyModel):
    """Append-only snapshot of a submitted or amended experiment (§4.5)."""

    class ChangeSource(models.TextChoices):
        SUBMIT = "SUBMIT", "Submit"
        AMENDMENT = "AMENDMENT", "Amendment"
        ADMIN_OVERRIDE = "ADMIN_OVERRIDE", "Admin override"

    record = models.ForeignKey(
        ExperimentRecord,
        on_delete=models.PROTECT,
        related_name="versions",
    )
    version_no = models.PositiveIntegerField()
    snapshot = models.JSONField(default=dict, blank=True)
    change_source = models.CharField(max_length=16, choices=ChangeSource.choices)
    reason = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_experiment_versions",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Experiment Record Version"
        verbose_name_plural = "Experiment Record Versions"
        db_table = "research_experiment_record_versions"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=["record", "version_no"], name="rsch_experiment_version_uq"),
        ]
        indexes = [
            models.Index(fields=["record", "version_no"], name="rsch_experiment_version_idx"),
        ]

    def __str__(self):
        return f"{self.record_id} v{self.version_no}"


class ExperimentAmendment(BaseModel):
    """A change request for a submitted experiment (§4.5, P1-EXP-05 ~ P1-EXP-08)."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"

    record = models.ForeignKey(
        ExperimentRecord,
        on_delete=models.CASCADE,
        related_name="amendments",
    )
    requested_by = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_experiment_amendments",
    )
    reason = models.TextField()
    change_set = models.JSONField(default=list, blank=True)
    evidence_asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.SET_NULL,
        related_name="research_experiment_amendments",
        null=True,
        blank=True,
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    reviewed_by = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_experiment_amendments_reviewed",
        null=True,
        blank=True,
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_comment = models.TextField(blank=True, default="")
    result_version = models.ForeignKey(
        ExperimentRecordVersion,
        on_delete=models.SET_NULL,
        related_name="amendments",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Experiment Amendment"
        verbose_name_plural = "Experiment Amendments"
        db_table = "research_experiment_amendments"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["record"],
                condition=Q(status="PENDING", deleted_at__isnull=True),
                name="rsch_amendment_uq_pending",
            ),
        ]
        indexes = [
            models.Index(fields=["record", "status"], name="rsch_amendment_record_idx"),
            models.Index(fields=["status", "created_at"], name="rsch_amendment_status_idx"),
        ]

    def __str__(self):
        return f"{self.record_id} <{self.status}>"


class ExperimentAssetLink(BaseModel):
    """Reference to an external data asset; no bytes are stored here (§4.5)."""

    class SourceSystem(models.TextChoices):
        PLANE = "PLANE", "PiLab"
        SPECLABOS = "SPECLABOS", "SpecLabOS"
        SMARTACCESS = "SMARTACCESS", "SmartAccess"
        RAGPORTAL = "RAGPORTAL", "RAGPortal"
        POLY_AGENT = "POLY_AGENT", "Poly_Agent"
        SPEC_AGENT = "SPEC_AGENT", "Spec_Agent"
        OTHER = "OTHER", "Other"

    class Relation(models.TextChoices):
        INPUT = "INPUT", "Input"
        OUTPUT = "OUTPUT", "Output"
        REFERENCE = "REFERENCE", "Reference"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        UNAVAILABLE = "UNAVAILABLE", "Unavailable"
        REVOKED = "REVOKED", "Revoked"
        DEGRADED = "DEGRADED", "Degraded"

    record = models.ForeignKey(
        ExperimentRecord,
        on_delete=models.CASCADE,
        related_name="asset_links",
    )
    relation = models.CharField(max_length=16, choices=Relation.choices, default=Relation.INPUT)
    source_system = models.CharField(max_length=24, choices=SourceSystem.choices, default=SourceSystem.SPECLABOS)
    external_asset_id = models.CharField(max_length=255)
    external_file_id = models.CharField(max_length=255, blank=True, default="")
    external_run_id = models.CharField(max_length=255, blank=True, default="")
    display_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=128, blank=True, default="")
    size_bytes = models.BigIntegerField(null=True, blank=True)
    external_url = models.URLField(max_length=500, blank=True, default="")
    last_verified_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        verbose_name = "Experiment Asset Link"
        verbose_name_plural = "Experiment Asset Links"
        db_table = "research_experiment_asset_links"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["record", "source_system", "external_asset_id"],
                name="rsch_asset_uq_record_system_asset",
            ),
        ]
        indexes = [
            models.Index(fields=["record", "relation"], name="rsch_asset_record_relation_idx"),
            models.Index(fields=["source_system", "external_asset_id"], name="rsch_asset_external_idx"),
        ]

    def __str__(self):
        return f"{self.record_id} {self.source_system}:{self.external_asset_id}"
