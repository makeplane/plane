# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import (
    ExperimentAmendment,
    ExperimentAssetLink,
    ExperimentRecord,
    ExperimentRecordVersion,
)

from .org import ResearchUserSerializer


class ExperimentRecordSerializer(serializers.ModelSerializer):
    owner_detail = ResearchUserSerializer(source="owner", read_only=True)

    class Meta:
        model = ExperimentRecord
        fields = [
            "id",
            "workspace",
            "project",
            "sequence_no",
            "stage_instance",
            "title",
            "objective",
            "hypothesis",
            "molecular_system",
            "smiles",
            "system_composition",
            "method",
            "parameters",
            "environment",
            "result",
            "metrics",
            "conclusion",
            "failure_reason",
            "status_note",
            "status",
            "source",
            "owner",
            "owner_detail",
            "started_at",
            "completed_at",
            "is_locked",
            "submitted_at",
            "current_version_no",
            "visibility",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "sequence_no",
            "owner",
            "is_locked",
            "submitted_at",
            "current_version_no",
            "created_at",
            "updated_at",
        ]


class ExperimentRecordVersionSerializer(serializers.ModelSerializer):
    created_by_detail = ResearchUserSerializer(source="created_by", read_only=True)

    class Meta:
        model = ExperimentRecordVersion
        fields = [
            "id",
            "record",
            "version_no",
            "snapshot",
            "change_source",
            "reason",
            "created_by",
            "created_by_detail",
            "created_at",
        ]
        read_only_fields = fields


class ExperimentAmendmentSerializer(serializers.ModelSerializer):
    requested_by_detail = ResearchUserSerializer(source="requested_by", read_only=True)
    reviewed_by_detail = ResearchUserSerializer(source="reviewed_by", read_only=True)

    class Meta:
        model = ExperimentAmendment
        fields = [
            "id",
            "record",
            "requested_by",
            "requested_by_detail",
            "reason",
            "change_set",
            "evidence_asset",
            "status",
            "reviewed_by",
            "reviewed_by_detail",
            "reviewed_at",
            "review_comment",
            "result_version",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "requested_by",
            "status",
            "reviewed_by",
            "reviewed_at",
            "review_comment",
            "result_version",
            "created_at",
            "updated_at",
        ]


class ExperimentAssetLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperimentAssetLink
        fields = [
            "id",
            "record",
            "relation",
            "source_system",
            "external_asset_id",
            "external_file_id",
            "external_run_id",
            "display_name",
            "mime_type",
            "size_bytes",
            "external_url",
            "last_verified_at",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "record", "created_at", "updated_at"]
