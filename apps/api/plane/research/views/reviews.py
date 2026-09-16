# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Review endpoints (§5.3)."""

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    ResearchStageInstance,
    ReviewerRole,
    StageReview,
    StageReviewerAssignment,
)
from plane.research.serializers import (
    StageReviewerAssignmentSerializer,
    StageReviewRevisionSerializer,
    StageReviewSerializer,
)
from plane.research.services.review_rules import (
    effective_assignments,
    evaluate_review_rule,
    resolve_review_rules,
    review_rule_version,
    review_summary,
    valid_reviews,
)
from plane.research.services.review_service import (
    remind_reviewer,
    research_owner_id,
    revise_review,
    submit_review,
    to_me_payload,
)
from plane.research.services.stage_service import StageRuleError
from plane.research.utils.acl import build_actor_context, check_access
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.capabilities import NAV_REVIEWS
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_conflict,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.org import is_workspace_admin
from plane.research.utils.stages import stage_resource
from plane.research.views.base import ResearchAPIView, resolve_user
from plane.research.views.stages import stage_rule_error_response

SECTION = "stages"
REVIEW_SCOPES = ("to_me", "mine", "completed")


def visible_stage(request, workspace, stage_id, action="view"):
    instance = (
        ResearchStageInstance.objects.filter(workspace=workspace, pk=stage_id, deleted_at__isnull=True)
        .select_related("project", "org_unit")
        .first()
    )
    if instance is None:
        return None, research_not_found(ResearchErrorCode.STAGE_NOT_FOUND, "Stage not found.")
    context = build_actor_context(request.user, workspace.id)
    if not check_access(request.user, action, stage_resource(instance, with_reviewers=True), context=context):
        if action == "view":
            return None, research_not_found(ResearchErrorCode.STAGE_NOT_FOUND, "Stage not found.")
        return None, research_permission_denied()
    return instance, None


class ResearchStageReviewerListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/stages/<stage_id>/reviewers/``"""

    def get(self, request, slug, stage_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        instance, error = visible_stage(request, workspace, stage_id)
        if error:
            return error
        assignments = effective_assignments(instance)
        reviews = {str(review.reviewer_id): review for review in valid_reviews(instance)}
        payload = []
        for assignment in assignments:
            data = StageReviewerAssignmentSerializer(assignment).data
            review = reviews.get(str(assignment.reviewer_id))
            data["reviewed"] = review is not None
            data["recommendation"] = review.recommendation if review else None
            data["review_id"] = str(review.id) if review else None
            payload.append(data)
        return Response({"results": payload, "count": len(payload)}, status=status.HTTP_200_OK)

    def post(self, request, slug, stage_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        instance, error = visible_stage(request, workspace, stage_id)
        if error:
            return error
        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, "review", stage_resource(instance), context=context):
            return research_permission_denied()

        reviewer = resolve_user(request.data.get("reviewer"))
        if reviewer is None:
            return research_error(ResearchErrorCode.USER_NOT_FOUND, "Reviewer not found.")
        role = str(request.data.get("reviewer_role") or ReviewerRole.REVIEWER.value).upper()
        if role not in ReviewerRole.values:
            return research_error(
                ResearchErrorCode.REVIEW_ASSIGNMENT_EXISTS,
                "Unknown reviewer role.",
            )
        if StageReviewerAssignment.objects.filter(
            stage_instance=instance,
            reviewer=reviewer,
            is_active=True,
            deleted_at__isnull=True,
        ).exists():
            return research_conflict(
                ResearchErrorCode.REVIEW_ASSIGNMENT_EXISTS,
                "This reviewer is already assigned to the stage.",
            )

        assignment_kind = str(request.data.get("assignment_kind") or "MANUAL").upper()
        if assignment_kind not in StageReviewerAssignment.AssignmentKind.values:
            assignment_kind = StageReviewerAssignment.AssignmentKind.MANUAL
        assignment = StageReviewerAssignment.objects.create(
            stage_instance=instance,
            reviewer=reviewer,
            reviewer_role=role,
            is_required=bool(request.data.get("is_required", False)),
            assignment_kind=assignment_kind,
            assigned_by=request.user,
            valid_until=request.data.get("valid_until") or None,
            created_by=request.user,
        )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.REVIEW_ASSIGN,
            resource_type=ResearchResourceType.STAGE_REVIEW_ASSIGNMENT,
            resource_id=assignment.id,
            org_unit=instance.org_unit,
            actor=request.user,
            metadata={
                "stage": instance.stage,
                "reviewer": str(reviewer.id),
                "reviewer_role": role,
                "kind": assignment_kind,
            },
            request=request,
        )
        return Response(
            StageReviewerAssignmentSerializer(assignment).data,
            status=status.HTTP_201_CREATED,
        )


class ResearchStageReviewerDetailEndpoint(ResearchAPIView):
    """``DELETE /api/research/workspaces/<slug>/reviewers/<assignment_id>/``"""

    def delete(self, request, slug, assignment_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        assignment = (
            StageReviewerAssignment.objects.filter(
                pk=assignment_id,
                stage_instance__workspace=workspace,
                deleted_at__isnull=True,
            )
            .select_related("stage_instance")
            .first()
        )
        if assignment is None:
            return research_not_found(
                ResearchErrorCode.REVIEW_ASSIGNMENT_NOT_FOUND,
                "Reviewer assignment not found.",
            )
        instance = assignment.stage_instance
        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, "review", stage_resource(instance), context=context):
            return research_permission_denied()

        assignment.is_active = False
        assignment.superseded_at = timezone.now()
        assignment.save(update_fields=["is_active", "superseded_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.REVIEW_UNASSIGN,
            resource_type=ResearchResourceType.STAGE_REVIEW_ASSIGNMENT,
            resource_id=assignment.id,
            org_unit=instance.org_unit,
            actor=request.user,
            metadata={"stage": instance.stage, "reviewer": str(assignment.reviewer_id)},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResearchStageReviewerRemindEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/reviewers/<assignment_id>/remind/``"""

    def post(self, request, slug, assignment_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        assignment = (
            StageReviewerAssignment.objects.filter(
                pk=assignment_id,
                stage_instance__workspace=workspace,
                deleted_at__isnull=True,
            )
            .select_related("stage_instance")
            .first()
        )
        if assignment is None:
            return research_not_found(
                ResearchErrorCode.REVIEW_ASSIGNMENT_NOT_FOUND,
                "Reviewer assignment not found.",
            )
        instance = assignment.stage_instance
        context = build_actor_context(request.user, workspace.id)
        if not check_access(request.user, "review", stage_resource(instance), context=context):
            return research_permission_denied()
        try:
            notify = remind_reviewer(assignment, request.user, str(request.data.get("message") or ""), request)
        except StageRuleError as exc:
            return stage_rule_error_response(exc)
        return Response({"notified": len(notify)}, status=status.HTTP_200_OK)


class ResearchStageReviewListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/stages/<stage_id>/reviews/``"""

    def get(self, request, slug, stage_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        instance, error = visible_stage(request, workspace, stage_id)
        if error:
            return error
        include_superseded = str(request.GET.get("include_superseded", "")).lower() in ("1", "true")
        query = StageReview.objects.filter(stage_instance=instance, deleted_at__isnull=True).select_related("reviewer")
        if not include_superseded:
            query = query.filter(is_superseded=False)
        reviews = list(query.order_by("submitted_at", "created_at"))
        return Response(
            {"results": StageReviewSerializer(reviews, many=True).data, "count": len(reviews)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug, stage_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        instance, error = visible_stage(request, workspace, stage_id)
        if error:
            return error
        if research_owner_id(instance) == request.user.id:
            return research_error(
                ResearchErrorCode.REVIEW_SELF_FORBIDDEN,
                "You cannot review a stage you submitted.",
                status.HTTP_403_FORBIDDEN,
            )
        context = build_actor_context(request.user, workspace.id)
        if not check_access(
            request.user, "review", stage_resource(instance, with_reviewers=True), context=context
        ):
            return research_permission_denied()
        try:
            review = submit_review(
                instance,
                request.user,
                recommendation=request.data.get("recommendation"),
                comment=request.data.get("comment"),
                score=request.data.get("score"),
                request=request,
            )
        except StageRuleError as exc:
            return stage_rule_error_response(exc)
        return Response(StageReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class ResearchStageReviewDetailEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/reviews/<review_id>/``"""

    def get(self, request, slug, review_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        review = (
            StageReview.objects.filter(
                pk=review_id,
                stage_instance__workspace=workspace,
                deleted_at__isnull=True,
            )
            .select_related("reviewer", "stage_instance")
            .first()
        )
        if review is None:
            return research_not_found(ResearchErrorCode.REVIEW_NOT_FOUND, "Review not found.")
        name, error = visible_stage(request, workspace, review.stage_instance_id)
        if error:
            return error
        data = StageReviewSerializer(review).data
        data["revisions"] = StageReviewRevisionSerializer(
            review.revisions.select_related("created_by"), many=True
        ).data
        return Response(data, status=status.HTTP_200_OK)


class ResearchStageReviewRevisionEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/reviews/<review_id>/revise/``"""

    def post(self, request, slug, review_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        review = (
            StageReview.objects.filter(
                pk=review_id,
                stage_instance__workspace=workspace,
                deleted_at__isnull=True,
            )
            .select_related("reviewer", "stage_instance")
            .first()
        )
        if review is None:
            return research_not_found(ResearchErrorCode.REVIEW_NOT_FOUND, "Review not found.")
        if review.reviewer_id != request.user.id and not is_workspace_admin(request.user, workspace):
            return research_permission_denied()
        try:
            revise_review(
                review,
                request.user,
                reason=request.data.get("reason"),
                recommendation=request.data.get("recommendation"),
                comment=request.data.get("comment"),
                score=request.data.get("score"),
                request=request,
            )
        except StageRuleError as exc:
            return stage_rule_error_response(exc)
        return Response(StageReviewSerializer(review).data, status=status.HTTP_200_OK)


class ResearchStageReviewRevisionListEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/reviews/<review_id>/revisions/``"""

    def get(self, request, slug, review_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        review = (
            StageReview.objects.filter(
                pk=review_id,
                stage_instance__workspace=workspace,
                deleted_at__isnull=True,
            )
            .select_related("stage_instance")
            .first()
        )
        if review is None:
            return research_not_found(ResearchErrorCode.REVIEW_NOT_FOUND, "Review not found.")
        name, error = visible_stage(request, workspace, review.stage_instance_id)
        if error:
            return error
        revisions = list(review.revisions.select_related("created_by"))
        return Response(
            {
                "results": StageReviewRevisionSerializer(revisions, many=True).data,
                "count": len(revisions),
            },
            status=status.HTTP_200_OK,
        )


class ResearchStageReviewSummaryEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/stages/<stage_id>/review-summary/``"""

    def get(self, request, slug, stage_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        instance, error = visible_stage(request, workspace, stage_id)
        if error:
            return error
        rules, sources = resolve_review_rules(instance.workspace, instance.stage, instance.org_unit_id)
        return Response(
            {
                "stage": instance.stage,
                "stage_id": str(instance.id),
                "rules": rules,
                "rule_sources": sources,
                "rule_version": review_rule_version(rules),
                "decision": evaluate_review_rule(instance),
                "summary": review_summary(instance),
            },
            status=status.HTTP_200_OK,
        )


class ResearchReviewListEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/reviews/?scope=to_me|mine|completed``

    The inbox is the only review surface the level gates: project scoped stage
    reviews stay on the project ACL, because a reviewer may sit at any level
    (v2.5.0).
    """

    nav_capability = NAV_REVIEWS

    def get(self, request, slug):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        scope = str(request.GET.get("scope") or "to_me").lower()
        if scope not in REVIEW_SCOPES:
            return research_error(
                ResearchErrorCode.REVIEW_STATE_CONFLICT,
                "scope must be to_me, mine or completed.",
            )

        if scope == "to_me":
            assignments = StageReviewerAssignment.objects.filter(
                reviewer=request.user,
                is_active=True,
                superseded_at__isnull=True,
                deleted_at__isnull=True,
                stage_instance__workspace=workspace,
                stage_instance__status=ResearchStageInstance.Status.SUBMITTED,
                stage_instance__deleted_at__isnull=True,
            ).select_related("stage_instance", "stage_instance__project")
            results = []
            for assignment in assignments:
                payload = to_me_payload(assignment.stage_instance, request.user.id)
                if payload is not None:
                    results.append(payload)
            required = [item for item in results if item["is_required"]]
            optional = [item for item in results if not item["is_required"]]
            return Response(
                {"results": results, "count": len(results), "required": required, "optional": optional},
                status=status.HTTP_200_OK,
            )

        query = StageReview.objects.filter(
            stage_instance__workspace=workspace,
            deleted_at__isnull=True,
        ).select_related("reviewer", "stage_instance", "stage_instance__project")
        if scope == "mine":
            query = query.filter(reviewer=request.user, is_superseded=False)
        else:
            query = query.filter(is_superseded=False, stage_instance__status=ResearchStageInstance.Status.PASSED)
        reviews = list(query.order_by("-submitted_at")[:200])
        return Response(
            {"results": StageReviewSerializer(reviews, many=True).data, "count": len(reviews)},
            status=status.HTTP_200_OK,
        )
