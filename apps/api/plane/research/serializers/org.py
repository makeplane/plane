# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import IdentityMapping, MentorBinding, OrgUnit, OrgUnitMember, User


class ResearchUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "display_name",
            "avatar",
            "avatar_url",
            "is_active",
        ]
        read_only_fields = fields


class OrgUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = [
            "id",
            "name",
            "parent",
            "path",
            "depth",
            "unit_type",
            "business_category",
            "sort_order",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "path", "depth", "created_at", "updated_at"]


class OrgUnitMemberSerializer(serializers.ModelSerializer):
    member_detail = ResearchUserSerializer(source="user", read_only=True)
    profile_category = serializers.SerializerMethodField()

    def get_profile_category(self, obj):
        profile = getattr(obj.user, "research_profile", None)
        return profile.category if profile else None

    class Meta:
        model = OrgUnitMember
        fields = [
            "id",
            "org_unit",
            "user",
            "member_detail",
            "profile_category",
            "org_role",
            "is_primary",
            "effective_from",
            "effective_to",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "created_at", "updated_at"]


class MentorBindingSerializer(serializers.ModelSerializer):
    mentee_detail = ResearchUserSerializer(source="mentee", read_only=True)
    mentor_detail = ResearchUserSerializer(source="mentor", read_only=True)

    class Meta:
        model = MentorBinding
        fields = [
            "id",
            "mentee",
            "mentor",
            "mentee_detail",
            "mentor_detail",
            "org_unit",
            "effective_from",
            "effective_to",
            "is_primary_advisor",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "created_at", "updated_at"]


class IdentityMappingSerializer(serializers.ModelSerializer):
    user_detail = ResearchUserSerializer(source="user", read_only=True)

    class Meta:
        model = IdentityMapping
        fields = [
            "id",
            "user",
            "user_detail",
            "provider",
            "subject",
            "email_snapshot",
            "employee_id",
            "status",
            "last_login_at",
            "last_login_ip",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
