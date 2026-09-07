# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Engineering Operations models.

These sit *beside* the Workspaces work tracking rather than inside it. The rule from
PROJECT.md is that nothing here duplicates a Workspaces concept: an operations
ticket is a request that has not yet earned an issue, a work log captures the
day that issue transitions do not describe, a record is a document that was
never work in the first place, and a deployment is what happened to the issues
after they were closed. Every one of them points *at* Workspaces rows; none of them
replace one.
"""

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from workspaces.utils.html_processor import strip_tags

from .base import BaseModel
from .project import ProjectBaseModel


class WorkLog(BaseModel):
    """
    One employee's account of one day.

    Deliberately one row per person per day (enforced below): a work log that
    can be filed twice is a work log nobody can count, and "who is missing a
    log today" is the question the PM dashboard is built around.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="work_logs")
    # The project the day was mostly spent on. Optional, because plenty of days
    # are spent across three of them or on none.
    project = models.ForeignKey(
        "db.Project", on_delete=models.SET_NULL, related_name="work_logs", null=True, blank=True
    )
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="work_logs")

    date = models.DateField(verbose_name="Log Date")

    summary = models.TextField(blank=True, default="")
    worked_on = models.TextField(blank=True, default="")
    meetings = models.TextField(blank=True, default="")
    research = models.TextField(blank=True, default="")
    production_support = models.TextField(blank=True, default="")
    deployment = models.TextField(blank=True, default="")
    blockers = models.TextField(blank=True, default="")
    tomorrow_plan = models.TextField(blank=True, default="")

    # Hours, to two decimals. Self-reported and never reconciled against
    # attendance -- the two measure different things and forcing them to agree
    # would only teach people to round.
    time_spent = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Null until the author says they are done. A draft is still a row so that
    # a half-written log survives a closed tab.
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Work Log"
        verbose_name_plural = "Work Logs"
        db_table = "work_logs"
        ordering = ("-date",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "owner", "date"],
                condition=Q(deleted_at__isnull=True),
                name="work_log_unique_owner_date_when_deleted_at_null",
            )
        ]
        indexes = [
            models.Index(fields=["workspace", "date"], name="work_log_workspace_date_idx"),
            models.Index(fields=["owner", "date"], name="work_log_owner_date_idx"),
        ]

    def __str__(self):
        return f"{self.owner} <{self.date}>"

    @property
    def is_submitted(self):
        return self.submitted_at is not None


class WorkLogIssue(BaseModel):
    """A Workspaces issue this day's work went into."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="work_log_issues")
    work_log = models.ForeignKey(WorkLog, on_delete=models.CASCADE, related_name="work_log_issues")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="work_log_issues")

    class Meta:
        verbose_name = "Work Log Issue"
        verbose_name_plural = "Work Log Issues"
        db_table = "work_log_issues"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["work_log", "issue"],
                condition=Q(deleted_at__isnull=True),
                name="work_log_issue_unique_log_issue_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.work_log} -> {self.issue_id}"


class OperationsTicketStatus(models.TextChoices):
    """
    The lifecycle from PROJECT.md, verbatim.

    ``NEED_INFO`` is a real state and not a flag: a request bounced back to
    Sales is not the same thing as one nobody has looked at yet, and the
    Operations dashboard counts them separately.
    """

    NEW = "new", "New"
    PM_REVIEW = "pm_review", "PM Review"
    NEED_INFO = "need_info", "Need More Information"
    APPROVED = "approved", "Approved"
    CONVERTED = "converted", "Converted"
    REJECTED = "rejected", "Rejected"
    CLOSED = "closed", "Closed"


# Statuses that no longer wait on anybody. Used by the dashboards and by the
# "pending requests" counters so the definition lives in exactly one place.
OPERATIONS_TICKET_TERMINAL_STATUSES = [
    OperationsTicketStatus.CONVERTED,
    OperationsTicketStatus.REJECTED,
    OperationsTicketStatus.CLOSED,
]


class OperationsTicketSource(models.TextChoices):
    SALES = "sales", "Sales"
    OPERATIONS = "operations", "Operations"
    QA = "qa", "QA"
    MANAGEMENT = "management", "Management"
    CUSTOMER = "customer", "Customer"
    INTERNAL = "internal", "Internal"


class OperationsTicket(BaseModel):
    """
    A request that has not yet earned a Workspaces issue.

    Operations keeps tracking the request after conversion; engineering tracks
    the implementation. ``converted_issue`` is the seam between the two and is
    written exactly once.
    """

    PRIORITY_CHOICES = (
        ("urgent", "Urgent"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
        ("none", "None"),
    )

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="operations_tickets")
    # Human-facing handle, per workspace: "OPS-14". Allocated on create.
    sequence_id = models.PositiveIntegerField(default=1)

    name = models.CharField(max_length=255, verbose_name="Ticket Title")
    description_json = models.JSONField(blank=True, default=dict)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)

    status = models.CharField(max_length=30, choices=OperationsTicketStatus.choices, default=OperationsTicketStatus.NEW)
    source = models.CharField(
        max_length=30, choices=OperationsTicketSource.choices, default=OperationsTicketSource.INTERNAL
    )
    priority = models.CharField(max_length=30, choices=PRIORITY_CHOICES, default="none")

    # Who asked. A workspace member when the request came from inside, and a
    # free-text pair when it came from a customer who will never have a login.
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="requested_operations_tickets",
        null=True,
        blank=True,
    )
    requester_name = models.CharField(max_length=255, blank=True, default="")
    requester_email = models.CharField(max_length=255, blank=True, default="")

    # The PM who owns the review.
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="assigned_operations_tickets",
        null=True,
        blank=True,
    )

    # Where it would land if approved; required by the time it is converted.
    project = models.ForeignKey(
        "db.Project", on_delete=models.SET_NULL, related_name="operations_tickets", null=True, blank=True
    )
    module = models.ForeignKey(
        "db.Module", on_delete=models.SET_NULL, related_name="operations_tickets", null=True, blank=True
    )

    converted_issue = models.OneToOneField(
        "db.Issue", on_delete=models.SET_NULL, related_name="operations_ticket", null=True, blank=True
    )
    converted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Operations Ticket"
        verbose_name_plural = "Operations Tickets"
        db_table = "operations_tickets"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "sequence_id"],
                condition=Q(deleted_at__isnull=True),
                name="operations_ticket_unique_sequence_when_deleted_at_null",
            )
        ]
        indexes = [
            models.Index(fields=["workspace", "status"], name="ops_ticket_ws_status_idx"),
        ]

    def __str__(self):
        return f"OPS-{self.sequence_id} {self.name}"

    def save(self, *args, **kwargs):
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )
        if self._state.adding:
            # Allocated here rather than by a DB sequence so that the number is
            # per workspace and legible ("OPS-14"), the way the Workspaces issue
            # keys are. The unique constraint above is what actually makes two
            # racing creates safe -- the loser retries.
            largest = OperationsTicket.objects.filter(workspace=self.workspace).aggregate(
                largest=models.Max("sequence_id")
            )["largest"]
            if largest is not None:
                self.sequence_id = largest + 1
        super().save(*args, **kwargs)


class OperationsTicketComment(BaseModel):
    """A note on a ticket. The conversation Sales and the PM have."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="operations_ticket_comments")
    ticket = models.ForeignKey(OperationsTicket, on_delete=models.CASCADE, related_name="comments")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="operations_ticket_comments", null=True
    )
    comment_json = models.JSONField(blank=True, default=dict)
    comment_html = models.TextField(blank=True, default="<p></p>")
    comment_stripped = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Operations Ticket Comment"
        verbose_name_plural = "Operations Ticket Comments"
        db_table = "operations_ticket_comments"
        ordering = ("created_at",)

    def save(self, *args, **kwargs):
        self.comment_stripped = (
            None if (self.comment_html == "" or self.comment_html is None) else strip_tags(self.comment_html)
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_id} comment"


class OperationsTicketActivity(BaseModel):
    """
    The audit trail PROJECT.md asks for on the ticket lifecycle.

    Written by the view layer on every transition, never by a signal: a
    transition that happens without somebody deciding it should not exist.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="operations_ticket_activities")
    ticket = models.ForeignKey(OperationsTicket, on_delete=models.CASCADE, related_name="activities")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="operations_ticket_activities", null=True
    )
    verb = models.CharField(max_length=255, default="updated")
    field = models.CharField(max_length=255, null=True, blank=True)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    comment = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Operations Ticket Activity"
        verbose_name_plural = "Operations Ticket Activities"
        db_table = "operations_ticket_activities"
        ordering = ("created_at",)

    def __str__(self):
        return f"{self.ticket_id} {self.verb} {self.field or ''}".strip()


class OperationsRecordType(models.TextChoices):
    """The record kinds listed in PROJECT.md."""

    INCIDENT = "incident", "Incident Report"
    OUTAGE = "outage", "Production Outage"
    ADR = "adr", "Architecture Decision"
    MEETING_NOTES = "meeting_notes", "Meeting Notes"
    RCA = "rca", "RCA Document"
    VENDOR_MEETING = "vendor_meeting", "Vendor Meeting"
    CLIENT_MEETING = "client_meeting", "Client Meeting"
    DEPLOYMENT_RECORD = "deployment_record", "Deployment Record"
    INFRA_CHANGE = "infra_change", "Infrastructure Change"
    SECURITY_FINDING = "security_finding", "Security Finding"
    RESEARCH_NOTE = "research_note", "Research Note"


class OperationsRecord(BaseModel):
    """
    A structured document that is not work.

    An RCA is not an issue: it has no assignee, no state and no sprint, and
    filing one as an issue pollutes every delivery metric in the analytics
    module. It still has to be searchable and auditable, which is why it is a
    row rather than a page.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="operations_records")
    project = models.ForeignKey(
        "db.Project", on_delete=models.SET_NULL, related_name="operations_records", null=True, blank=True
    )

    record_type = models.CharField(
        max_length=40, choices=OperationsRecordType.choices, default=OperationsRecordType.MEETING_NOTES
    )
    name = models.CharField(max_length=255, verbose_name="Record Title")
    description_json = models.JSONField(blank=True, default=dict)
    description_html = models.TextField(blank=True, default="<p></p>")
    description_stripped = models.TextField(blank=True, null=True)

    occurred_at = models.DateTimeField(null=True, blank=True)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="operations_records",
        blank=True,
        through="OperationsRecordParticipant",
        through_fields=("record", "member"),
    )
    # Free-form and per-type: severity and downtime for an outage, the options
    # considered for an ADR. Kept out of the columns because every type would
    # otherwise add three nullable fields that ten types never use.
    metadata = models.JSONField(default=dict, blank=True)
    linked_issues = models.ManyToManyField(
        "db.Issue",
        related_name="operations_records",
        blank=True,
        through="OperationsRecordIssue",
        through_fields=("record", "issue"),
    )

    class Meta:
        verbose_name = "Operations Record"
        verbose_name_plural = "Operations Records"
        db_table = "operations_records"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace", "record_type"], name="ops_record_workspace_type_idx"),
        ]

    def save(self, *args, **kwargs):
        self.description_stripped = (
            None
            if (self.description_html == "" or self.description_html is None)
            else strip_tags(self.description_html)
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class OperationsRecordParticipant(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="operations_record_participants"
    )
    record = models.ForeignKey(OperationsRecord, on_delete=models.CASCADE, related_name="record_participants")
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="operations_record_participants"
    )

    class Meta:
        verbose_name = "Operations Record Participant"
        verbose_name_plural = "Operations Record Participants"
        db_table = "operations_record_participants"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["record", "member"],
                condition=Q(deleted_at__isnull=True),
                name="ops_record_participant_unique_when_deleted_at_null",
            )
        ]


class OperationsRecordIssue(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="operations_record_issues")
    record = models.ForeignKey(OperationsRecord, on_delete=models.CASCADE, related_name="record_issues")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="operations_record_issues")

    class Meta:
        verbose_name = "Operations Record Issue"
        verbose_name_plural = "Operations Record Issues"
        db_table = "operations_record_issues"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["record", "issue"],
                condition=Q(deleted_at__isnull=True),
                name="ops_record_issue_unique_when_deleted_at_null",
            )
        ]


class DeploymentEnvironment(models.TextChoices):
    DEVELOPMENT = "development", "Development"
    TEST = "test", "Test"
    STAGING = "staging", "Staging"
    PRODUCTION = "production", "Production"


class DeploymentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    IN_PROGRESS = "in_progress", "In Progress"
    DEPLOYED = "deployed", "Deployed"
    FAILED = "failed", "Failed"
    ROLLED_BACK = "rolled_back", "Rolled Back"


class Deployment(ProjectBaseModel):
    """
    One release of one project to one environment.

    Project-scoped, unlike everything else here, because a deployment without a
    project is not a thing anybody can act on -- and it makes the DevOps
    dashboard's project filter free.
    """

    version = models.CharField(max_length=255, verbose_name="Release Version")
    environment = models.CharField(
        max_length=30, choices=DeploymentEnvironment.choices, default=DeploymentEnvironment.PRODUCTION
    )
    status = models.CharField(max_length=30, choices=DeploymentStatus.choices, default=DeploymentStatus.PENDING)

    deployed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="deployments", null=True, blank=True
    )
    scheduled_for = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True, default="")
    release_notes_html = models.TextField(blank=True, default="<p></p>")
    # Set when this deployment undid another one. Points at the deployment that
    # was rolled back, which is what "Rollbacks" on the DevOps dashboard counts.
    rolled_back_from = models.ForeignKey(
        "self", on_delete=models.SET_NULL, related_name="rollbacks", null=True, blank=True
    )
    issues = models.ManyToManyField(
        "db.Issue",
        related_name="deployments",
        blank=True,
        through="DeploymentIssue",
        through_fields=("deployment", "issue"),
    )

    class Meta:
        verbose_name = "Deployment"
        verbose_name_plural = "Deployments"
        db_table = "deployments"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace", "status"], name="deploy_ws_status_idx"),
            models.Index(fields=["project", "environment"], name="deploy_project_env_idx"),
        ]

    def __str__(self):
        return f"{self.version} -> {self.environment}"


class DeploymentIssue(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="deployment_issues")
    deployment = models.ForeignKey(Deployment, on_delete=models.CASCADE, related_name="deployment_issues")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="deployment_issues")

    class Meta:
        verbose_name = "Deployment Issue"
        verbose_name_plural = "Deployment Issues"
        db_table = "deployment_issues"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["deployment", "issue"],
                condition=Q(deleted_at__isnull=True),
                name="deployment_issue_unique_when_deleted_at_null",
            )
        ]


class OperationsSetting(BaseModel):
    """
    Per-workspace configuration for the operations layer.

    Chiefly the state-name mapping. The dashboards need to know which of a
    project's states means "waiting on QA", and the honest answer is that only
    the workspace knows -- ``bootstrap_engineering_ops`` creates the names from
    PROJECT.md, but an existing workspace will have its own. One row, one JSON
    blob, so adding a knob never needs a migration.
    """

    workspace = models.OneToOneField("db.Workspace", on_delete=models.CASCADE, related_name="operations_setting")
    config = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Operations Setting"
        verbose_name_plural = "Operations Settings"
        db_table = "operations_settings"

    def __str__(self):
        return f"{self.workspace_id} operations settings"
