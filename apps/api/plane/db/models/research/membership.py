# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Account lifecycle models: invite codes, research profiles and CSV imports.

These models back the system management work stream: administrators issue
invite codes instead of letting users create workspaces, every imported
account carries a research profile, and every bulk import is traceable
through a batch plus its per-row outcome.
"""

import secrets

from django.db import models
from django.db.models import Q
from django.utils import timezone

from plane.db.models.base import BaseModel


def generate_invite_code():
    """URL-safe, human-transcribable invite code."""
    return secrets.token_urlsafe(18)


class ResearchInviteCode(BaseModel):
    """Invite code that lets a new user join the public workspace.

    A code carries the organisation role the new account receives on
    registration, so an administrator can pre-assign "direct advisor" or
    "research owner" without a second step.
    """

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        DISABLED = "DISABLED", "Disabled"

    class EffectiveStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        DISABLED = "DISABLED", "Disabled"
        EXPIRED = "EXPIRED", "Expired"
        EXHAUSTED = "EXHAUSTED", "Used up"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_invite_codes",
    )
    code = models.CharField(max_length=64, unique=True, default=generate_invite_code)
    org_role = models.CharField(max_length=20, blank=True, default="")
    org_unit = models.ForeignKey(
        "db.OrgUnit",
        on_delete=models.SET_NULL,
        related_name="invite_codes",
        null=True,
        blank=True,
    )
    max_uses = models.PositiveSmallIntegerField(default=1)
    used_count = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    note = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        verbose_name = "Research Invite Code"
        verbose_name_plural = "Research Invite Codes"
        db_table = "research_invite_codes"
        ordering = ("-created_at",)
        constraints = [
            models.CheckConstraint(
                condition=Q(max_uses__gte=1),
                name="rsch_invite_max_uses_positive",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "status"], name="rsch_invite_ws_status_idx"),
            models.Index(fields=["code"], name="rsch_invite_code_idx"),
        ]

    def __str__(self):
        return f"{self.workspace_id} <{self.code}>"

    @property
    def effective_status(self):
        return self.status_for(timezone.now())

    def status_for(self, now=None):
        now = now or timezone.now()
        if self.status == self.Status.DISABLED:
            return self.EffectiveStatus.DISABLED
        if self.expires_at and self.expires_at < now:
            return self.EffectiveStatus.EXPIRED
        if self.used_count >= self.max_uses:
            return self.EffectiveStatus.EXHAUSTED
        return self.EffectiveStatus.ACTIVE

    def is_usable(self, now=None):
        return self.status_for(now) == self.EffectiveStatus.ACTIVE


class UserImportBatch(BaseModel):
    """One bulk import run (dry run or committed)."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        IMPORTED = "IMPORTED", "Imported"
        FAILED = "FAILED", "Failed"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="research_import_batches",
    )
    source_filename = models.CharField(max_length=255, blank=True, default="")
    dry_run = models.BooleanField(default=False)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    rows_total = models.PositiveIntegerField(default=0)
    rows_ok = models.PositiveIntegerField(default=0)
    rows_pending = models.PositiveIntegerField(default=0)
    rows_error = models.PositiveIntegerField(default=0)
    options = models.JSONField(default=dict, blank=True)
    summary = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Research User Import Batch"
        verbose_name_plural = "Research User Import Batches"
        db_table = "research_user_import_batches"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace", "-created_at"], name="rsch_import_ws_created_idx"),
        ]

    def __str__(self):
        return f"{self.workspace_id} <{self.source_filename or self.id}>"


class ResearchUserProfile(BaseModel):
    """Research facing attributes of an account (identity card data)."""

    class Degree(models.TextChoices):
        MS = "MS", "Master"
        PHD = "PHD", "Doctor"

    class Category(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        POSTDOC = "POSTDOC", "Postdoc"
        ADVISOR = "ADVISOR", "Advisor"
        PI = "PI", "Principal Investigator"
        STAFF = "STAFF", "Staff"
        OTHER = "OTHER", "Other"

    user = models.OneToOneField(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_profile",
    )
    student_no = models.CharField(max_length=64, blank=True, default="", db_index=True)
    grade = models.CharField(max_length=16, blank=True, default="")
    degree = models.CharField(max_length=8, choices=Degree.choices, blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
    category = models.CharField(max_length=16, choices=Category.choices, default=Category.STUDENT)
    group_label = models.CharField(max_length=128, blank=True, default="")
    source_batch = models.ForeignKey(
        "db.UserImportBatch",
        on_delete=models.SET_NULL,
        related_name="profiles",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Research User Profile"
        verbose_name_plural = "Research User Profiles"
        db_table = "research_user_profiles"
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["student_no"],
                condition=~Q(student_no=""),
                name="rsch_profile_uq_student_no",
            ),
        ]
        indexes = [
            models.Index(fields=["category"], name="rsch_profile_category_idx"),
        ]

    def __str__(self):
        return f"{self.user_id} <{self.student_no or self.category}>"


class UserImportRow(BaseModel):
    """Per-row outcome of an import batch."""

    class Status(models.TextChoices):
        OK = "OK", "Imported"
        PENDING = "PENDING", "Needs input"
        ERROR = "ERROR", "Rejected"

    batch = models.ForeignKey(
        UserImportBatch,
        on_delete=models.CASCADE,
        related_name="rows",
    )
    row_number = models.PositiveIntegerField(default=0)
    raw = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    message = models.CharField(max_length=255, blank=True, default="")
    display_name = models.CharField(max_length=255, blank=True, default="")
    email = models.CharField(max_length=255, blank=True, default="")
    student_no = models.CharField(max_length=64, blank=True, default="")
    group_label = models.CharField(max_length=128, blank=True, default="")
    advisor_name = models.CharField(max_length=255, blank=True, default="")
    user = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_import_rows",
        null=True,
        blank=True,
    )
    org_unit = models.ForeignKey(
        "db.OrgUnit",
        on_delete=models.SET_NULL,
        related_name="import_rows",
        null=True,
        blank=True,
    )
    # One-time credential handed to the account owner through the import
    # report; it is only readable from the administrator surface.
    initial_password = models.CharField(max_length=128, blank=True, default="")

    class Meta:
        verbose_name = "Research User Import Row"
        verbose_name_plural = "Research User Import Rows"
        db_table = "research_user_import_rows"
        ordering = ("row_number", "created_at")
        indexes = [
            models.Index(fields=["batch", "status"], name="rsch_impr_batch_status_idx"),
        ]

    def __str__(self):
        return f"{self.batch_id}#{self.row_number} <{self.status}>"
