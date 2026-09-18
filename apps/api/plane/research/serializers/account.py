# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import ResearchInviteCode, ResearchUserProfile, UserImportBatch, UserImportRow

from .org import ResearchUserSerializer


class InviteCodeSerializer(serializers.ModelSerializer):
    created_by_detail = ResearchUserSerializer(source="created_by", read_only=True)
    effective_status = serializers.SerializerMethodField()
    register_url = serializers.SerializerMethodField()

    class Meta:
        model = ResearchInviteCode
        fields = [
            "id",
            "code",
            "provisioning_version",
            "org_role",
            "org_unit",
            "profile_category",
            "primary_advisor",
            "max_uses",
            "used_count",
            "expires_at",
            "status",
            "effective_status",
            "note",
            "register_url",
            "created_by",
            "created_by_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "code",
            "provisioning_version",
            "used_count",
            "created_at",
            "updated_at",
            "created_by",
        ]

    def get_effective_status(self, obj):
        return obj.effective_status

    def get_register_url(self, obj):
        return f"/sign-up?invite_code={obj.code}"


class ResearchUserProfileSerializer(serializers.ModelSerializer):
    user_detail = ResearchUserSerializer(source="user", read_only=True)
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    degree_label = serializers.CharField(source="get_degree_display", read_only=True)

    class Meta:
        model = ResearchUserProfile
        fields = [
            "id",
            "user",
            "user_detail",
            "student_no",
            "grade",
            "degree",
            "degree_label",
            "phone",
            "category",
            "category_label",
            "group_label",
            "source_batch",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class UserImportRowSerializer(serializers.ModelSerializer):
    user_detail = ResearchUserSerializer(source="user", read_only=True)

    class Meta:
        model = UserImportRow
        fields = [
            "id",
            "batch",
            "row_number",
            "status",
            "message",
            "display_name",
            "email",
            "student_no",
            "group_label",
            "advisor_name",
            "user",
            "user_detail",
            "org_unit",
            "raw",
            "created_at",
        ]
        read_only_fields = fields


class UserImportBatchSerializer(serializers.ModelSerializer):
    created_by_detail = ResearchUserSerializer(source="created_by", read_only=True)
    rows = serializers.SerializerMethodField()

    class Meta:
        model = UserImportBatch
        fields = [
            "id",
            "source_filename",
            "dry_run",
            "status",
            "rows_total",
            "rows_ok",
            "rows_pending",
            "rows_error",
            "options",
            "summary",
            "created_by_detail",
            "created_at",
            "rows",
        ]
        read_only_fields = fields

    def get_rows(self, obj):
        rows = getattr(obj, "prefetched_rows", None)
        if rows is None:
            rows = obj.rows.all()
        return UserImportRowSerializer(rows, many=True).data


class UserImportBatchSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserImportBatch
        fields = [
            "id",
            "source_filename",
            "dry_run",
            "status",
            "rows_total",
            "rows_ok",
            "rows_pending",
            "rows_error",
            "summary",
            "created_at",
        ]
        read_only_fields = fields
