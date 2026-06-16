# Django imports
from django.conf import settings
from django.db import models, connection, transaction

# Module imports
from .project import ProjectBaseModel
from .base import BaseModel
from plane.utils.uuid import convert_uuid_to_integer


# ---------------------------------------------------------------------------
# Choices
# ---------------------------------------------------------------------------

CHANGE_TYPE_CHOICES = (
    ("normal", "Normal"),
    ("standard", "Standard"),
)

CHANGE_STATE_CHOICES = (
    ("new", "New"),
    ("assess", "Assess"),
    ("authorize", "Authorize"),
    ("scheduled", "Scheduled"),
    ("implement", "Implement"),
    ("review", "Review"),
    ("closed", "Closed"),
    ("cancelled", "Cancelled"),
)

CHANGE_PRIORITY_CHOICES = (
    ("1_critical", "Critical"),
    ("2_high", "High"),
    ("3_moderate", "Moderate"),
    ("4_low", "Low"),
)

CHANGE_RISK_CHOICES = (
    ("1_critical", "Critical"),
    ("2_high", "High"),
    ("3_moderate", "Moderate"),
    ("4_low", "Low"),
)

CHANGE_IMPACT_CHOICES = (
    ("1_high", "High"),
    ("2_medium", "Medium"),
    ("3_low", "Low"),
)

CHANGE_CATEGORY_CHOICES = (
    ("hardware", "Hardware"),
    ("software", "Software"),
    ("network", "Network"),
    ("security", "Security"),
    ("database", "Database"),
    ("application", "Application"),
    ("other", "Other"),
)

CONFLICT_STATUS_CHOICES = (
    ("no_conflicts", "No Conflicts"),
    ("conflicts_detected", "Conflicts Detected"),
    ("not_run", "Not Run"),
    ("running", "Running"),
)

CLOSE_CODE_CHOICES = (
    ("successful", "Successful"),
    ("successful_with_issues", "Successful with Issues"),
    ("unsuccessful", "Unsuccessful"),
    ("skipped", "Skipped"),
)

APPROVAL_LEVEL_CHOICES = (
    ("peer_review", "Peer Review"),
    ("cab", "CAB"),
)

APPROVAL_STATUS_CHOICES = (
    ("pending", "Pending"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
    ("voided", "Voided"),
)

TASK_TYPE_CHOICES = (
    ("implementation", "Implementation"),
    ("testing", "Testing"),
    ("review", "Review"),
    ("other", "Other"),
)

TASK_STATE_CHOICES = (
    ("pending", "Pending"),
    ("in_progress", "In Progress"),
    ("closed_complete", "Closed Complete"),
    ("closed_incomplete", "Closed Incomplete"),
    ("closed_skipped", "Closed Skipped"),
)


# ---------------------------------------------------------------------------
# Assignment Groups
# ---------------------------------------------------------------------------

class AssignmentGroup(BaseModel):
    """
    Workspace-level assignment groups for change management routing.
    """
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="assignment_groups",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="AssignmentGroupMember",
        through_fields=("assignment_group", "member"),
        related_name="assigned_groups",
    )

    class Meta:
        db_table = "assignment_groups"
        unique_together = ("workspace", "name")
        ordering = ("name",)

    def __str__(self):
        return self.name


class AssignmentGroupMember(BaseModel):
    """
    Through model connecting users to assignment groups.
    """
    assignment_group = models.ForeignKey(
        AssignmentGroup,
        on_delete=models.CASCADE,
        related_name="group_members",
    )
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="group_memberships",
    )

    class Meta:
        db_table = "assignment_group_members"
        unique_together = ("assignment_group", "member")

    def __str__(self):
        return f"{self.assignment_group.name} - {self.member.email}"


# ---------------------------------------------------------------------------
# CAB Groups
# ---------------------------------------------------------------------------

class CabGroup(BaseModel):
    """
    Workspace-level CAB (Change Advisory Board) groups.
    Used during the Authorize stage of Normal changes.
    """
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="cab_groups",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="CabGroupMember",
        through_fields=("cab_group", "member"),
        related_name="cab_groups",
    )

    class Meta:
        db_table = "cab_groups"
        unique_together = ("workspace", "name")
        ordering = ("name",)

    def __str__(self):
        return self.name


class CabGroupMember(BaseModel):
    """
    Through model connecting users to CAB groups.
    """
    cab_group = models.ForeignKey(
        CabGroup,
        on_delete=models.CASCADE,
        related_name="group_members",
    )
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cab_group_memberships",
    )

    class Meta:
        db_table = "cab_group_members"
        unique_together = ("cab_group", "member")

    def __str__(self):
        return f"{self.cab_group.name} - {self.member.email}"


# ---------------------------------------------------------------------------
# ChangeRequest
# ---------------------------------------------------------------------------

class ChangeRequest(ProjectBaseModel):
    """
    A change request record for IT change management.
    Numbers follow the format CHG-WINJIT-#00001 and are globally
    unique across the workspace.
    """

    # -- Identification --
    sequence_number = models.PositiveBigIntegerField(
        default=1,
        verbose_name="Sequence Number",
    )
    number = models.CharField(
        max_length=30,
        unique=True,
        db_index=True,
        verbose_name="Change Number",
        help_text="Display identifier, e.g. CHG-WINJIT-#00001",
    )
    type = models.CharField(
        max_length=20,
        choices=CHANGE_TYPE_CHOICES,
        default="normal",
    )
    state = models.CharField(
        max_length=20,
        choices=CHANGE_STATE_CHOICES,
        default="new",
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=CHANGE_PRIORITY_CHOICES,
        default="3_moderate",
    )
    risk = models.CharField(
        max_length=20,
        choices=CHANGE_RISK_CHOICES,
        default="3_moderate",
    )
    impact = models.CharField(
        max_length=20,
        choices=CHANGE_IMPACT_CHOICES,
        default="2_medium",
    )
    category = models.CharField(
        max_length=20,
        choices=CHANGE_CATEGORY_CHOICES,
        default="other",
    )

    # -- Text / Description --
    short_description = models.CharField(max_length=500)
    description_html = models.TextField(
        blank=True, default="<p></p>"
    )
    service = models.CharField(
        max_length=255, blank=True, null=True,
        verbose_name="Affected Service",
    )
    configuration_item = models.CharField(
        max_length=255, blank=True, null=True,
        verbose_name="Configuration Item",
    )

    # -- Conflict --
    conflict_status = models.CharField(
        max_length=20,
        choices=CONFLICT_STATUS_CHOICES,
        default="not_run",
    )
    conflict_last_run = models.DateTimeField(blank=True, null=True)

    # -- People --
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="requested_changes",
    )

    assignment_group = models.ForeignKey(
        AssignmentGroup,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="change_requests",
    )

    # -- Planning tab --
    justification = models.TextField(blank=True, null=True)
    implementation_plan = models.TextField(blank=True, null=True)
    risk_and_impact_analysis = models.TextField(blank=True, null=True)
    backout_plan = models.TextField(blank=True, null=True)
    test_plan = models.TextField(blank=True, null=True)

    # -- Schedule tab --
    planned_start_date = models.DateTimeField(blank=True, null=True)
    planned_end_date = models.DateTimeField(blank=True, null=True)
    actual_start_date = models.DateTimeField(blank=True, null=True)
    actual_end_date = models.DateTimeField(blank=True, null=True)
    cab_required = models.BooleanField(default=False)
    cab_date = models.DateTimeField(blank=True, null=True)
    cab_delegate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="cab_delegated_changes",
    )
    cab_recommendation = models.TextField(blank=True, null=True)

    # -- Closure tab --
    close_code = models.CharField(
        max_length=30,
        choices=CLOSE_CODE_CHOICES,
        blank=True,
        null=True,
    )
    close_notes = models.TextField(blank=True, null=True)

    # -- Meta --
    on_hold = models.BooleanField(default=False)
    on_hold_reason = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Change Request"
        verbose_name_plural = "Change Requests"
        db_table = "change_requests"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        if self._state.adding:
            with transaction.atomic():
                # Use a global advisory lock (number is globally unique)
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT pg_advisory_xact_lock(%s)",
                        [2000001],  # fixed global lock key for change numbers
                    )

                # Use all_objects to include soft-deleted records.
                # The `number` column has a DB-level unique constraint
                # that applies to ALL rows including soft-deleted ones,
                # so we must consider them when computing the next seq.
                last_seq = (
                    ChangeRequest.all_objects.aggregate(
                        largest=models.Max("sequence_number")
                    )
                )["largest"]
                self.sequence_number = (last_seq + 1) if last_seq else 1

                # Build the display number
                self.number = (
                    f"CHG-WINJIT-#{str(self.sequence_number).zfill(5)}"
                )

                super(ChangeRequest, self).save(*args, **kwargs)
        else:
            super(ChangeRequest, self).save(*args, **kwargs)

    def __str__(self):
        return f"{self.number} — {self.short_description[:60]}"


# ---------------------------------------------------------------------------
# ChangeApproval
# ---------------------------------------------------------------------------

class ChangeApproval(BaseModel):
    """Approval record for a change request."""

    change_request = models.ForeignKey(
        ChangeRequest,
        on_delete=models.CASCADE,
        related_name="approvals",
    )
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="change_approvals",
    )
    approval_level = models.CharField(
        max_length=20,
        choices=APPROVAL_LEVEL_CHOICES,
    )
    status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default="pending",
    )
    comments = models.TextField(blank=True, null=True)
    decided_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Change Approval"
        verbose_name_plural = "Change Approvals"
        db_table = "change_approvals"
        ordering = ("-created_at",)

    def __str__(self):
        return (
            f"{self.change_request.number} — "
            f"{self.get_approval_level_display()} — "
            f"{self.get_status_display()}"
        )


# ---------------------------------------------------------------------------
# ChangeTask
# ---------------------------------------------------------------------------

class ChangeTask(BaseModel):
    """Implementation / review task for a change request."""

    change_request = models.ForeignKey(
        ChangeRequest,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    short_description = models.CharField(
        max_length=255,
        default="",
        verbose_name="Short Description",
    )
    task_type = models.CharField(
        max_length=40,
        choices=TASK_TYPE_CHOICES,
        default="other",
    )
    state = models.CharField(
        max_length=20,
        choices=TASK_STATE_CHOICES,
        default="pending",
    )
    assignment_group = models.ForeignKey(
        AssignmentGroup,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="change_tasks",
    )
    description = models.TextField(blank=True, null=True)
    due_date = models.DateTimeField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    closed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Change Task"
        verbose_name_plural = "Change Tasks"
        db_table = "change_tasks"
        ordering = ("order", "created_at")

    def __str__(self):
        return (
            f"{self.change_request.number} — "
            f"{self.short_description[:60]} — "
            f"{self.get_state_display()}"
        )


# ---------------------------------------------------------------------------
# ChangeActivity
# ---------------------------------------------------------------------------

class ChangeActivity(BaseModel):
    """Audit trail for a change request."""

    VERB_CHOICES = (
        ("state_changed", "State Changed"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("field_updated", "Field Updated"),
        ("commented", "Commented"),
        ("task_completed", "Task Completed"),
    )

    change_request = models.ForeignKey(
        ChangeRequest,
        on_delete=models.CASCADE,
        related_name="activities",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="change_activities",
    )
    verb = models.CharField(max_length=30, choices=VERB_CHOICES)
    field = models.CharField(max_length=100, blank=True, null=True)
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    comment = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Change Activity"
        verbose_name_plural = "Change Activities"
        db_table = "change_activities"
        ordering = ("-created_at",)

    def __str__(self):
        return (
            f"{self.change_request.number} — "
            f"{self.get_verb_display()}"
        )
