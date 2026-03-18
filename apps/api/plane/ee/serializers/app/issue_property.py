# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers import UserLiteSerializer
from plane.db.models import IssueType
from plane.ee.models import IssueProperty, IssuePropertyActivity, IssuePropertyOption
from plane.ee.serializers import BaseSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.utils.constants import (
    RESTRICTED_ISSUE_PROPERTY_DISPLAY_NAMES,
)


class IssueTypeSerializer(BaseSerializer):
    project_ids = serializers.ListField(child=serializers.UUIDField(), read_only=True)
    properties = serializers.SerializerMethodField()

    class Meta:
        model = IssueType
        fields = "__all__"
        read_only_fields = ["workspace", "project", "is_default", "deleted_at"]

    def get_properties(self, obj):
        return {str(itp.property_id): itp.sort_order for itp in obj.issue_type_properties.all()}


class IssuePropertySerializer(BaseSerializer):
    formula = serializers.SerializerMethodField()
    example_output = serializers.SerializerMethodField()

    class Meta:
        model = IssueProperty
        fields = "__all__"
        read_only_fields = ["name", "issue_type", "workspace", "deleted_at", "formula_config"]

    # getting the formula for the issue property
    def get_formula(self, obj):
        workspace_slug = obj.workspace.slug
        feature_flag = FeatureFlag.WORKITEM_TYPE_FORMULA_FIELD
        if not check_workspace_feature_flag(feature_key=feature_flag, slug=workspace_slug):
            return ""

        return obj.formula_config.formula if obj.formula_config and obj.formula_config.formula else ""

    # getting the example output for the issue property
    def get_example_output(self, obj):
        workspace_slug = obj.workspace.slug
        feature_flag = FeatureFlag.WORKITEM_TYPE_FORMULA_FIELD
        if not check_workspace_feature_flag(feature_key=feature_flag, slug=workspace_slug):
            return ""

        return obj.formula_config.example_output if obj.formula_config and obj.formula_config.example_output else ""

    def validate_display_name(self, value):
        if value in RESTRICTED_ISSUE_PROPERTY_DISPLAY_NAMES:
            raise serializers.ValidationError(f"Display name cannot be the {value}")
        return value


class IssuePropertyOptionSerializer(BaseSerializer):
    class Meta:
        model = IssuePropertyOption
        fields = "__all__"
        read_only_fields = ["property", "workspace", "deleted_at"]


class IssuePropertyActivitySerializer(BaseSerializer):
    actor_detail = UserLiteSerializer(read_only=True, source="actor")

    class Meta:
        model = IssuePropertyActivity
        fields = "__all__"
        read_only_fields = ["workspace", "project", "issue", "deleted_at"]
