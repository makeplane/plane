# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Reviewer assignment, review submission and review revisions (P1-REV-01 ~ P1-REV-12).

Assignment is rule driven: the direct advisor and the principal investigator
branch are always represented, manual reviewers are kept, and re-submitting a
stage supersedes both the assignments and the reviews collected so far.
"""

from django.utils import timezone
from rest_framework import status

from plane.db.models import (
    MentorBinding,
    OrgUnitMember,
    ResearchProjectProfile,
    ResearchStageInstance,
    ReviewerRole,
    StageReview,
    StageReviewerAssignment,
    StageReviewRevision,
)
from plane.research.services.stage_service import StageRuleError
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.errors import ResearchErrorCode
from plane.research.utils.review_notifications import (
    notify_review_assigned,
    notify_review_reminded,
    notify_review_submitted,
)

REVIEW_STATUS = ResearchStageInstance.Status.SUBMITTED
ADVISOR_ROLE = ReviewerRole.DIRECT_ADVISOR.value


def research_owner_id(instance):
    return (
        ResearchProjectProfile.objects.filter(project_id=instance.project_id)
        .values_list("owner_id", flat=True)
        .first()
    )


def _active_query(instance):
    return StageReviewerAssignment.objects.filter(
        stage_instance=instance,
        is_active=True,
        deleted_at__isnull=True,
    )


def assign_reviewers(instance, actor=None, request=None):
    """Create the mandatory assignments for a submitted stage (P1-REV-01)."""
    owner_id = research_owner_id(instance)
    created = []
    existing_reviewers = set(_active_query(instance).values_list("reviewer_id", flat=True))

    candidates = []
    if owner_id:
        mentor_ids = (
            MentorBinding.objects.filter(
                deleted_at__isnull=True,
                workspace_id=instance.workspace_id,
                mentee_id=owner_id,
                effective_from__lte=timezone.localdate(),
            )
            .filter(models_q_expired())
            .values_list("mentor_id", flat=True)
        )
        candidates.extend((mentor_id, ADVISOR_ROLE, True) for mentor_id in mentor_ids)

    if instance.org_unit_id:
        pi_ids = OrgUnitMember.objects.filter(
            deleted_at__isnull=True,
            workspace_id=instance.workspace_id,
            org_unit_id=instance.org_unit_id,
            org_role__in=("PI", "OWNER"),
            effective_from__lte=timezone.localdate(),
        ).filter(models_q_expired()).values_list("user_id", flat=True)
        candidates.extend((pi_id, ReviewerRole.PI.value, True) for pi_id in pi_ids)

    for reviewer_id, role, is_required in candidates:
        if reviewer_id is None or reviewer_id == owner_id or reviewer_id in existing_reviewers:
            # the author never reviews their own stage (P1-REV-11)
            continue
        assignment = StageReviewerAssignment.objects.create(
            stage_instance=instance,
            reviewer_id=reviewer_id,
            reviewer_role=role,
            is_required=is_required,
            assignment_kind=StageReviewerAssignment.AssignmentKind.AUTO,
            assigned_by=actor,
            created_by=actor,
        )
        existing_reviewers.add(reviewer_id)
        created.append(assignment)
        if actor is not None:
            notify_review_assigned(instance, assignment, actor)

    if created:
        record_audit_event(
            workspace=instance.workspace,
            action=ResearchAuditAction.REVIEW_ASSIGN,
            resource_type=ResearchResourceType.STAGE_REVIEW_ASSIGNMENT,
            resource_id=instance.id,
            org_unit=instance.org_unit,
            actor=actor,
            metadata={
                "stage": instance.stage,
                "reviewers": [str(assignment.reviewer_id) for assignment in created],
                "kind": "auto",
            },
            request=request,
        )
    return created


def models_q_expired():
    from django.db.models import Q

    return Q(effective_to__isnull=True) | Q(effective_to__gte=timezone.localdate())


def supersede_reviews(instance, actor, request=None):
    """Invalidate the collected reviews when a stage is submitted again (P1-REV-08)."""
    now = timezone.now()
    superseded = StageReview.objects.filter(
        stage_instance=instance,
        is_superseded=False,
        deleted_at__isnull=True,
    ).update(is_superseded=True)
    StageReviewerAssignment.objects.filter(
        stage_instance=instance,
        is_active=True,
        deleted_at__isnull=True,
    ).update(is_active=False, superseded_at=now)
    assign_reviewers(instance, actor, request)
    return superseded


def assignment_for(instance, reviewer_id):
    return next(
        (
            assignment
            for assignment in instance.reviewer_assignments.filter(
                reviewer_id=reviewer_id, deleted_at__isnull=True
            ).select_related("reviewer")
            if assignment.is_active and assignment.superseded_at is None
        ),
        None,
    )


def resolve_reviewer_role(instance, reviewer_id):
    """Role snapshot for a review, taken from the assignment when present."""
    assignment = assignment_for(instance, reviewer_id)
    if assignment is not None:
        return assignment.reviewer_role, assignment
    owner_id = research_owner_id(instance)
    is_mentor = MentorBinding.objects.filter(
        deleted_at__isnull=True,
        workspace_id=instance.workspace_id,
        mentee_id=owner_id,
        mentor_id=reviewer_id,
    ).exists()
    if is_mentor:
        return ADVISOR_ROLE, None
    return ReviewerRole.UNIT_ADMIN.value, None


def submit_review(instance, actor, *, recommendation, comment="", score=None, request=None):
    """Submit one review; a second submission must go through ``revise``."""
    if instance.status != REVIEW_STATUS:
        raise StageRuleError(
            ResearchErrorCode.REVIEW_STATE_CONFLICT,
            "Reviews can only be submitted while the stage is under review.",
        )
    owner_id = research_owner_id(instance)
    if owner_id == actor.id:
        # P1-REV-11: the author never reviews their own stage
        raise StageRuleError(
            ResearchErrorCode.REVIEW_SELF_FORBIDDEN,
            "You cannot review a stage you submitted.",
            http_status=status.HTTP_403_FORBIDDEN,
        )

    recommendation = str(recommendation or "").upper()
    if recommendation not in StageReview.Recommendation.values:
        raise StageRuleError(
            ResearchErrorCode.REVIEW_RECOMMENDATION_INVALID,
            "recommendation must be PASS, REJECT or REVISE.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    if recommendation in ("REJECT", "REVISE") and not str(comment or "").strip():
        raise StageRuleError(
            ResearchErrorCode.REVIEW_COMMENT_REQUIRED,
            "A comment is required for REJECT and REVISE.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    score_value = None
    if score not in (None, ""):
        try:
            score_value = float(score)
        except (TypeError, ValueError):
            raise StageRuleError(
                ResearchErrorCode.REVIEW_SCORE_INVALID,
                "score must be a number between 0 and 100.",
                http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        if score_value < 0 or score_value > 100:
            raise StageRuleError(
                ResearchErrorCode.REVIEW_SCORE_INVALID,
                "score must be a number between 0 and 100.",
                http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

    assignment = assignment_for(instance, actor.id)
    if assignment is None:
        raise StageRuleError(
            ResearchErrorCode.REVIEW_NOT_ASSIGNED,
            "You are not assigned to review this stage.",
            http_status=status.HTTP_403_FORBIDDEN,
        )
    role = assignment.reviewer_role
    if StageReview.objects.filter(
        stage_instance=instance, reviewer=actor, is_superseded=False, deleted_at__isnull=True
    ).exists():
        raise StageRuleError(
            ResearchErrorCode.REVIEW_STATE_CONFLICT,
            "You already reviewed this stage; use revise to change your review.",
        )

    now = timezone.now()
    review = StageReview.objects.create(
        stage_instance=instance,
        reviewer=actor,
        reviewer_role=role,
        recommendation=recommendation,
        score=score_value,
        comment=str(comment or ""),
        revision_no=1,
        submitted_at=now,
        created_by=actor,
    )
    StageReviewRevision.objects.create(
        review=review,
        revision_no=1,
        recommendation=recommendation,
        score=score_value,
        comment=str(comment or ""),
        reason="initial submission",
        created_by=actor,
    )
    record_audit_event(
        workspace=instance.workspace,
        action=ResearchAuditAction.REVIEW_SUBMIT,
        resource_type=ResearchResourceType.STAGE_REVIEW,
        resource_id=review.id,
        org_unit=instance.org_unit,
        actor=actor,
        metadata={
            "stage": instance.stage,
            "recommendation": recommendation,
            "reviewer_role": role,
        },
        request=request,
    )
    notify_review_submitted(instance, review, actor, owner_id)
    return review


def revise_review(review, actor, *, reason, recommendation=None, comment=None, score=None, request=None):
    """Append a new review version; the reason is mandatory (P1-REV-07)."""
    if review.is_superseded:
        raise StageRuleError(
            ResearchErrorCode.REVIEW_STATE_CONFLICT,
            "A superseded review cannot be revised.",
        )
    if not str(reason or "").strip():
        raise StageRuleError(
            ResearchErrorCode.REVIEW_REVISION_REASON_REQUIRED,
            "A reason is required when revising a review.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    next_recommendation = str(recommendation or review.recommendation).upper()
    if next_recommendation not in StageReview.Recommendation.values:
        raise StageRuleError(
            ResearchErrorCode.REVIEW_RECOMMENDATION_INVALID,
            "recommendation must be PASS, REJECT or REVISE.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    next_comment = review.comment if comment is None else str(comment)
    if next_recommendation in ("REJECT", "REVISE") and not next_comment.strip():
        raise StageRuleError(
            ResearchErrorCode.REVIEW_COMMENT_REQUIRED,
            "A comment is required for REJECT and REVISE.",
            http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    next_score = review.score
    if score not in (None, ""):
        try:
            next_score = float(score)
        except (TypeError, ValueError):
            raise StageRuleError(
                ResearchErrorCode.REVIEW_SCORE_INVALID,
                "score must be a number between 0 and 100.",
                http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

    revision_no = (review.revision_no or 1) + 1
    StageReviewRevision.objects.create(
        review=review,
        revision_no=revision_no,
        recommendation=next_recommendation,
        score=next_score,
        comment=next_comment,
        reason=str(reason).strip(),
        created_by=actor,
    )
    review.recommendation = next_recommendation
    review.comment = next_comment
    review.score = next_score
    review.revision_no = revision_no
    review.save(update_fields=["recommendation", "comment", "score", "revision_no", "updated_at"])

    record_audit_event(
        workspace=review.stage_instance.workspace,
        action=ResearchAuditAction.REVIEW_REVISE,
        resource_type=ResearchResourceType.STAGE_REVIEW,
        resource_id=review.id,
        org_unit=review.stage_instance.org_unit,
        actor=actor,
        metadata={
            "stage": review.stage_instance.stage,
            "recommendation": next_recommendation,
            "revision_no": revision_no,
            "reason": str(reason).strip()[:500],
        },
        request=request,
    )
    return review


def remind_reviewer(assignment, actor, message="", request=None):
    """Nudge a pending reviewer through the shared notification channel (P1-REV-09)."""
    if assignment.superseded_at is not None or not assignment.is_active:
        raise StageRuleError(
            ResearchErrorCode.REVIEW_ASSIGNMENT_NOT_FOUND,
            "This reviewer assignment is no longer active.",
            http_status=status.HTTP_409_CONFLICT,
        )
    instance = assignment.stage_instance
    record_audit_event(
        workspace=instance.workspace,
        action=ResearchAuditAction.REVIEW_REMIND,
        resource_type=ResearchResourceType.STAGE_REVIEW_ASSIGNMENT,
        resource_id=assignment.id,
        org_unit=instance.org_unit,
        actor=actor,
        metadata={"stage": instance.stage, "reviewer": str(assignment.reviewer_id)},
        request=request,
    )
    return notify_review_reminded(instance, assignment, actor, message)


def to_me_payload(instance, reviewer_id):
    """Pending reviews of one reviewer, split into required and optional (P1-REV-09)."""
    assignment = assignment_for(instance, reviewer_id)
    if assignment is None:
        return None
    already = StageReview.objects.filter(
        stage_instance=instance,
        reviewer_id=reviewer_id,
        is_superseded=False,
        deleted_at__isnull=True,
    ).exists()
    if already:
        return None
    return {
        "assignment_id": str(assignment.id),
        "stage_id": str(instance.id),
        "stage": instance.stage,
        "project": str(instance.project_id),
        "project_name": getattr(instance.project, "name", ""),
        "reviewer_role": assignment.reviewer_role,
        "is_required": assignment.is_required,
        "assignment_kind": assignment.assignment_kind,
        "valid_until": assignment.valid_until.isoformat() if assignment.valid_until else None,
        "submitted_at": instance.submitted_at.isoformat() if instance.submitted_at else None,
    }
