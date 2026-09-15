# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import (
    ResearchStageInstance,
    ResearchStageRequirement,
    StageReview,
    StageReviewerAssignment,
    StageReviewRevision,
    StageMaterial,
    StageMaterialVersion,
    StageTransition,
)

from .org import ResearchUserSerializer


class ResearchStageInstanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchStageInstance
        fields = [
            "id",
            "workspace",
            "project",
            "stage",
            "status",
            "sort_order",
            "entered_at",
            "submitted_at",
            "passed_at",
            "gate_result",
            "attempt_count",
            "org_unit",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class StageTransitionSerializer(serializers.ModelSerializer):
    actor_detail = ResearchUserSerializer(source="actor", read_only=True)

    class Meta:
        model = StageTransition
        fields = [
            "id",
            "stage_instance",
            "actor",
            "actor_detail",
            "action",
            "from_status",
            "to_status",
            "reason",
            "gate_snapshot",
            "review_snapshot",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields


class StageMaterialSerializer(serializers.ModelSerializer):
    owner_detail = ResearchUserSerializer(source="owner", read_only=True)

    class Meta:
        model = StageMaterial
        fields = [
            "id",
            "stage_instance",
            "material_type",
            "page",
            "status",
            "visibility",
            "is_required",
            "submitted_at",
            "last_version_no",
            "owner",
            "owner_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "stage_instance", "last_version_no", "created_at", "updated_at"]


class StageMaterialVersionSerializer(serializers.ModelSerializer):
    created_by_detail = ResearchUserSerializer(source="created_by", read_only=True)

    class Meta:
        model = StageMaterialVersion
        fields = [
            "id",
            "material",
            "version_no",
            "snapshot",
            "change_source",
            "reason",
            "diff_summary",
            "created_by",
            "created_by_detail",
            "created_at",
        ]
        read_only_fields = fields


class ResearchStageRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchStageRequirement
        fields = [
            "id",
            "workspace",
            "stage",
            "code",
            "requirement_type",
            "threshold",
            "is_blocking",
            "is_active",
            "org_unit",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "created_at", "updated_at"]


class StageReviewerAssignmentSerializer(serializers.ModelSerializer):
    reviewer_detail = ResearchUserSerializer(source="reviewer", read_only=True)
    assigned_by_detail = ResearchUserSerializer(source="assigned_by", read_only=True)

    class Meta:
        model = StageReviewerAssignment
        fields = [
            "id",
            "stage_instance",
            "reviewer",
            "reviewer_detail",
            "reviewer_role",
            "is_required",
            "assignment_kind",
            "assigned_by",
            "assigned_by_detail",
            "is_active",
            "superseded_at",
            "valid_until",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "stage_instance",
            "assigned_by",
            "is_active",
            "superseded_at",
            "created_at",
            "updated_at",
        ]


class StageReviewSerializer(serializers.ModelSerializer):
    reviewer_detail = ResearchUserSerializer(source="reviewer", read_only=True)

    class Meta:
        model = StageReview
        fields = [
            "id",
            "stage_instance",
            "reviewer",
            "reviewer_detail",
            "reviewer_role",
            "recommendation",
            "score",
            "comment",
            "revision_no",
            "is_superseded",
            "submitted_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "stage_instance",
            "reviewer",
            "reviewer_role",
            "revision_no",
            "is_superseded",
            "created_at",
            "updated_at",
        ]


class StageReviewRevisionSerializer(serializers.ModelSerializer):
    created_by_detail = ResearchUserSerializer(source="created_by", read_only=True)

    class Meta:
        model = StageReviewRevision
        fields = [
            "id",
            "review",
            "revision_no",
            "recommendation",
            "score",
            "comment",
            "reason",
            "created_by",
            "created_by_detail",
            "created_at",
        ]
        read_only_fields = fields
