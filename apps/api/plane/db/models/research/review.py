# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Stage review models (P1-REV-01 ~ P1-REV-12, §4.3).

A stage is reviewed by a set of assignments: the direct advisor is mandatory,
the principal investigator branch (the PI itself or a delegated reviewer) is
mandatory, and any number of additional reviewers may be added. Submitted
reviews are never overwritten - a change goes through ``StageReviewRevision``.
"""

from django.db import models
from django.db.models import Q

from plane.db.models.base import BaseModel

from .append_only import AppendOnlyModel
from .stage import ResearchStageInstance

DEFAULT_MIN_REVIEWERS = 3
DEFAULT_PASS_RATIO = 0.5


class ReviewerRole(models.TextChoices):
    DIRECT_ADVISOR = "DIRECT_ADVISOR", "Direct advisor"
    PI = "PI", "Principal investigator"
    REVIEWER = "REVIEWER", "Reviewer"
    UNIT_ADMIN = "UNIT_ADMIN", "Unit admin"


class PI_BRANCH_ROLES:
    """The principal investigator itself; a delegated reviewer also qualifies.

    A plain ``REVIEWER`` or ``UNIT_ADMIN`` assignment is an extra reviewer, not
    the PI branch (P1-REV-03): the branch is covered either by the PI or by an
    authorised delegate whose assignment kind is ``DELEGATED``.
    """

    VALUES = ("PI",)


class StageReviewerAssignment(BaseModel):
    """Who has to (or may) review one stage instance (§4.3)."""

    class AssignmentKind(models.TextChoices):
        AUTO = "AUTO", "Automatic"
        MANUAL = "MANUAL", "Manual"
        DELEGATED = "DELEGATED", "Delegated"

    stage_instance = models.ForeignKey(
        ResearchStageInstance,
        on_delete=models.CASCADE,
        related_name="reviewer_assignments",
    )
    reviewer = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_stage_assignments",
    )
    reviewer_role = models.CharField(max_length=20, choices=ReviewerRole.choices)
    is_required = models.BooleanField(default=True)
    assignment_kind = models.CharField(
        max_length=16,
        choices=AssignmentKind.choices,
        default=AssignmentKind.AUTO,
    )
    assigned_by = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_stage_assignments_made",
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    superseded_at = models.DateTimeField(null=True, blank=True)
    # Delegated reviewers may be time boxed; empty means "until revoked".
    valid_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Stage Reviewer Assignment"
        verbose_name_plural = "Stage Reviewer Assignments"
        db_table = "research_stage_reviewer_assignments"
        ordering = ("-is_required", "reviewer_role", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["stage_instance", "reviewer"],
                condition=Q(is_active=True, deleted_at__isnull=True),
                name="rsch_assignment_uq_stage_reviewer",
            ),
        ]
        indexes = [
            models.Index(fields=["reviewer", "is_active"], name="rsch_assignment_reviewer_idx"),
            models.Index(fields=["stage_instance", "is_active"], name="rsch_assignment_stage_idx"),
        ]

    def __str__(self):
        return f"{self.stage_instance_id} <{self.reviewer_role}>"


class StageReview(BaseModel):
    """A submitted review; the current version lives here, history beside it."""

    class Recommendation(models.TextChoices):
        PASS = "PASS", "Pass"
        REJECT = "REJECT", "Reject"
        REVISE = "REVISE", "Revise"

    stage_instance = models.ForeignKey(
        ResearchStageInstance,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    reviewer = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="research_stage_reviews",
    )
    reviewer_role = models.CharField(max_length=20, choices=ReviewerRole.choices)
    recommendation = models.CharField(max_length=16, choices=Recommendation.choices)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    comment = models.TextField(blank=True, default="")
    revision_no = models.PositiveIntegerField(default=1)
    is_superseded = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Stage Review"
        verbose_name_plural = "Stage Reviews"
        db_table = "research_stage_reviews"
        ordering = ("submitted_at", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["stage_instance", "reviewer"],
                condition=Q(is_superseded=False, deleted_at__isnull=True),
                name="rsch_review_uq_stage_reviewer",
            ),
        ]
        indexes = [
            models.Index(fields=["stage_instance", "recommendation"], name="rsch_review_stage_rec_idx"),
            models.Index(fields=["reviewer", "submitted_at"], name="rsch_review_reviewer_idx"),
        ]

    def __str__(self):
        return f"{self.stage_instance_id} <{self.recommendation}>"


class StageReviewRevision(AppendOnlyModel):
    """Append-only review revisions: a review is corrected, never overwritten."""

    review = models.ForeignKey(
        StageReview,
        on_delete=models.PROTECT,
        related_name="revisions",
    )
    revision_no = models.PositiveIntegerField()
    recommendation = models.CharField(max_length=16, choices=StageReview.Recommendation.choices)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    comment = models.TextField(blank=True, default="")
    reason = models.TextField()
    created_by = models.ForeignKey(
        "db.User",
        on_delete=models.SET_NULL,
        related_name="research_stage_review_revisions",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Stage Review Revision"
        verbose_name_plural = "Stage Review Revisions"
        db_table = "research_stage_review_revisions"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=["review", "revision_no"], name="rsch_review_revision_uq"),
        ]
        indexes = [
            models.Index(fields=["review", "revision_no"], name="rsch_review_revision_idx"),
        ]

    def __str__(self):
        return f"{self.review_id} r{self.revision_no}"
