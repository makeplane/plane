# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Research stage workflow models (P1-STG-01 ~ P1-STG-13).

The stage sequence is fixed and cannot be configured: ``PRE_OPENING`` ->
``OPENING`` -> ``MIDTERM`` -> ``FINAL``. Every research project owns exactly
one instance per stage; the instance carries the state, the gate outcome and
the attempt counter used to invalidate reviews on re-submission.
"""

from django.db import models
from django.db.models import Q

from plane.db.models.base import BaseModel

from .append_only import AppendOnlyModel
from .config import ReportVisibility


class StageType(models.TextChoices):
    """The fixed stage sequence (P1-STG-01)."""

    PRE_OPENING = "PRE_OPENING", "Pre-opening"
    OPENING = "OPENING", "Opening"
    MIDTERM = "MIDTERM", "Midterm"
    FINAL = "FINAL", "Final"


STAGE_SEQUENCE = (
    StageType.PRE_OPENING.value,
    StageType.OPENING.value,
    StageType.MIDTERM.value,
    StageType.FINAL.value,
)

STAGE_SORT_ORDER = {stage: index + 1 for index, stage in enumerate(STAGE_SEQUENCE)}


class StageMaterialType:
    """Material type codes per stage (§4.2). Codes are stable identifiers."""

    # PRE_OPENING
    TOPIC_DESCRIPTION = "TOPIC_DESCRIPTION"
    GAP_ANALYSIS = "GAP_ANALYSIS"
    # OPENING
    RESEARCH_QUESTION = "RESEARCH_QUESTION"
    LITERATURE_REVIEW = "LITERATURE_REVIEW"
    HYPOTHESIS = "HYPOTHESIS"
    TECHNICAL_ROUTE = "TECHNICAL_ROUTE"
    EXPERIMENT_DESIGN = "EXPERIMENT_DESIGN"
    DATA_AND_METRICS = "DATA_AND_METRICS"
    TIME_PLAN = "TIME_PLAN"
    RISK_AND_BACKUP = "RISK_AND_BACKUP"
    CODE_PLAN = "CODE_PLAN"
    EXPERIMENT_RECORD_PLAN = "EXPERIMENT_RECORD_PLAN"
    # MIDTERM
    GOAL_COMPLETION = "GOAL_COMPLETION"
    COMPLETED_EXPERIMENTS = "COMPLETED_EXPERIMENTS"
    FAILED_EXPERIMENTS = "FAILED_EXPERIMENTS"
    DATA_SUMMARY = "DATA_SUMMARY"
    CODE_PROGRESS = "CODE_PROGRESS"
    PAPER_PROGRESS = "PAPER_PROGRESS"
    RISK_ADJUSTMENT = "RISK_ADJUSTMENT"
    # FINAL
    FINAL_REPORT = "FINAL_REPORT"
    THESIS_OR_OUTPUT = "THESIS_OR_OUTPUT"
    FULL_RESEARCH_CHAIN = "FULL_RESEARCH_CHAIN"
    EXPERIMENT_SUMMARY = "EXPERIMENT_SUMMARY"
    CODE_AND_SNAPSHOT = "CODE_AND_SNAPSHOT"
    DATA_AND_ATTACHMENT_LIST = "DATA_AND_ATTACHMENT_LIST"
    ADVISOR_OPINION = "ADVISOR_OPINION"


MATERIAL_TYPES_BY_STAGE = {
    StageType.PRE_OPENING.value: (
        StageMaterialType.TOPIC_DESCRIPTION,
        StageMaterialType.GAP_ANALYSIS,
    ),
    StageType.OPENING.value: (
        StageMaterialType.RESEARCH_QUESTION,
        StageMaterialType.LITERATURE_REVIEW,
        StageMaterialType.HYPOTHESIS,
        StageMaterialType.TECHNICAL_ROUTE,
        StageMaterialType.EXPERIMENT_DESIGN,
        StageMaterialType.DATA_AND_METRICS,
        StageMaterialType.TIME_PLAN,
        StageMaterialType.RISK_AND_BACKUP,
        StageMaterialType.CODE_PLAN,
        StageMaterialType.EXPERIMENT_RECORD_PLAN,
    ),
    StageType.MIDTERM.value: (
        StageMaterialType.GOAL_COMPLETION,
        StageMaterialType.COMPLETED_EXPERIMENTS,
        StageMaterialType.FAILED_EXPERIMENTS,
        StageMaterialType.DATA_SUMMARY,
        StageMaterialType.CODE_PROGRESS,
        StageMaterialType.PAPER_PROGRESS,
        StageMaterialType.RISK_ADJUSTMENT,
    ),
    StageType.FINAL.value: (
        StageMaterialType.FINAL_REPORT,
        StageMaterialType.THESIS_OR_OUTPUT,
        StageMaterialType.FULL_RESEARCH_CHAIN,
        StageMaterialType.EXPERIMENT_SUMMARY,
        StageMaterialType.CODE_AND_SNAPSHOT,
        StageMaterialType.DATA_AND_ATTACHMENT_LIST,
        StageMaterialType.ADVISOR_OPINION,
    ),
}

ALL_MATERIAL_TYPES = tuple(code for codes in MATERIAL_TYPES_BY_STAGE.values() for code in codes)

# Material states that count towards "the material set is complete" (D-06).
MATERIAL_SET_COMPLETE_STATES = ("DRAFT", "SUBMITTED", "ACCEPTED")


class ResearchStageInstance(BaseModel):
    """One stage run on one research project (P1-STG-02, §4.2)."""

    class Status(models.TextChoices):
        NOT_STARTED = "NOT_STARTED", "Not started"
        IN_PROGRESS = "IN_PROGRESS", "In progress"
        SUBMITTED = "SUBMITTED", "Submitted"
        NEEDS_REVISION = "NEEDS_REVISION", "Needs revision"
        PASSED = "PASSED", "Passed"

    class GateResult(models.TextChoices):
        PASS = "PASS", "Pass"
        BLOCKED = "BLOCKED", "Blocked"
        WAIVED = "WAIVED", "Waived"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.PROTECT,
        related_name="research_stage_instances",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="research_stage_instances",
    )
    stage = models.CharField(max_length=16, choices=StageType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOT_STARTED)
    sort_order = models.PositiveSmallIntegerField()
    entered_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    passed_at = models.DateTimeField(null=True, blank=True)
    gate_result = models.CharField(max_length=16, choices=GateResult.choices, null=True, blank=True)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    org_unit = models.ForeignKey(
        "db.OrgUnit",
        on_delete=models.SET_NULL,
        related_name="research_stage_instances",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Research Stage Instance"
        verbose_name_plural = "Research Stage Instances"
        db_table = "research_stage_instances"
        ordering = ("project", "sort_order")
        constraints = [
            models.UniqueConstraint(fields=["project", "stage"], name="rsch_stage_uq_project_stage"),
        ]
        indexes = [
            models.Index(fields=["workspace", "stage", "status"], name="rsch_stage_ws_stage_st_idx"),
            models.Index(fields=["project", "sort_order"], name="rsch_stage_project_order_idx"),
            models.Index(fields=["workspace", "status", "updated_at"], name="rsch_stage_ws_status_up_idx"),
        ]

    def __str__(self):
        return f"{self.project_id} <{self.stage}:{self.status}>"

    @property
    def previous_stage(self):
        index = STAGE_SEQUENCE.index(self.stage)
        return STAGE_SEQUENCE[index - 1] if index > 0 else None

    @property
    def next_stage(self):
        index = STAGE_SEQUENCE.index(self.stage)
        return STAGE_SEQUENCE[index + 1] if index + 1 < len(STAGE_SEQUENCE) else None


class StageTransition(AppendOnlyModel):
    """Append-only record of every stage state change (P1-STG-08, P1-STG-10)."""

    class Action(models.TextChoices):
        ENTER = "ENTER", "Enter"
        SUBMIT = "SUBMIT", "Submit"
        RETURN = "RETURN", "Return"
        PASS = "PASS", "Pass"
        REOPEN = "REOPEN", "Reopen"
        OVERRIDE = "OVERRIDE", "Override"

    stage_instance = models.ForeignKey(
        ResearchStageInstance,
        on_delete=models.PROTECT,
        related_name="transitions",
    )
    actor = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_stage_transitions",
        null=True,
        blank=True,
    )
    action = models.CharField(max_length=32, choices=Action.choices)
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    reason = models.TextField(blank=True, default="")
    gate_snapshot = models.JSONField(default=dict, blank=True)
    review_snapshot = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Research Stage Transition"
        verbose_name_plural = "Research Stage Transitions"
        db_table = "research_stage_transitions"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["stage_instance", "created_at"], name="rsch_transition_stage_idx"),
            models.Index(fields=["action"], name="rsch_transition_action_idx"),
        ]

    def __str__(self):
        return f"{self.stage_instance_id} {self.action}"


class ResearchStageRequirement(BaseModel):
    """Configurable gate requirement (§4.2, P1-STG-07)."""

    class RequirementType(models.TextChoices):
        MANUAL = "MANUAL", "Manual"
        LITERATURE_COUNT = "LITERATURE_COUNT", "Literature count"
        EXPERIMENT_LINKED = "EXPERIMENT_LINKED", "Experiment linked"
        CODE_REPO = "CODE_REPO", "Code repository"
        OUTCOME_COUNT = "OUTCOME_COUNT", "Outcome count"
        MATERIAL_SET = "MATERIAL_SET", "Material set"
        REVIEW_RULE = "REVIEW_RULE", "Review rule"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_stage_requirements",
    )
    stage = models.CharField(max_length=16, choices=StageType.choices)
    code = models.CharField(max_length=64)
    requirement_type = models.CharField(max_length=24, choices=RequirementType.choices)
    threshold = models.PositiveIntegerField(null=True, blank=True)
    is_blocking = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    org_unit = models.ForeignKey(
        "db.OrgUnit",
        on_delete=models.SET_NULL,
        related_name="research_stage_requirements",
        null=True,
        blank=True,
    )
    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Research Stage Requirement"
        verbose_name_plural = "Research Stage Requirements"
        db_table = "research_stage_requirements"
        ordering = ("stage", "sort_order")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "stage", "code"],
                condition=Q(org_unit__isnull=True),
                name="rsch_req_uq_ws_stage_code",
            ),
            models.UniqueConstraint(
                fields=["workspace", "stage", "code", "org_unit"],
                condition=Q(org_unit__isnull=False),
                name="rsch_req_uq_ws_stage_code_unit",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "stage"], name="rsch_req_ws_stage_idx"),
        ]

    def __str__(self):
        return f"{self.stage}:{self.code}"


class StageMaterial(BaseModel):
    """A stage deliverable; the body always lives in a Plane Page (P1-OPN-04)."""

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"

    stage_instance = models.ForeignKey(
        ResearchStageInstance,
        on_delete=models.CASCADE,
        related_name="materials",
    )
    material_type = models.CharField(max_length=48)
    page = models.ForeignKey(
        "db.Page",
        on_delete=models.SET_NULL,
        related_name="research_stage_materials",
        null=True,
        blank=True,
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    visibility = models.CharField(
        max_length=32,
        choices=ReportVisibility.choices,
        default=ReportVisibility.DIRECT_ADVISOR,
    )
    is_required = models.BooleanField(default=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    last_version_no = models.PositiveIntegerField(default=0)
    owner = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_stage_materials",
    )

    class Meta:
        verbose_name = "Research Stage Material"
        verbose_name_plural = "Research Stage Materials"
        db_table = "research_stage_materials"
        ordering = ("stage_instance", "material_type")
        constraints = [
            models.UniqueConstraint(
                fields=["stage_instance", "material_type"],
                name="rsch_material_uq_stage_type",
            ),
        ]
        indexes = [
            models.Index(fields=["stage_instance", "status"], name="rsch_material_stage_status_idx"),
            models.Index(fields=["owner", "status"], name="rsch_material_owner_status_idx"),
        ]

    def __str__(self):
        return f"{self.stage_instance_id} <{self.material_type}>"


class StageMaterialVersion(AppendOnlyModel):
    """Append-only material version trail (P1-OPN-05, P1-OPN-06)."""

    class ChangeSource(models.TextChoices):
        MANUAL = "MANUAL", "Manual"
        ADMIN_OVERRIDE = "ADMIN_OVERRIDE", "Admin override"
        STAGE_REOPEN = "STAGE_REOPEN", "Stage reopen"

    material = models.ForeignKey(
        StageMaterial,
        on_delete=models.PROTECT,
        related_name="versions",
    )
    version_no = models.PositiveIntegerField()
    snapshot = models.JSONField(default=dict, blank=True)
    change_source = models.CharField(max_length=16, choices=ChangeSource.choices, default=ChangeSource.MANUAL)
    reason = models.TextField(blank=True, default="")
    diff_summary = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_stage_material_versions",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Research Stage Material Version"
        verbose_name_plural = "Research Stage Material Versions"
        db_table = "research_stage_material_versions"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=["material", "version_no"], name="rsch_material_version_uq"),
        ]
        indexes = [
            models.Index(fields=["material", "version_no"], name="rsch_material_version_idx"),
        ]

    def __str__(self):
        return f"{self.material_id} v{self.version_no}"
