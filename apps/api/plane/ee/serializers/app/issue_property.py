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
# Django imports
from django.db import models


# Third party imports
from rest_framework import serializers

# Module imports
from plane.app.serializers import UserLiteSerializer
from plane.db.models import Issue, IssueType
from plane.ee.models import IssueProperty, IssuePropertyActivity, IssuePropertyOption
from plane.ee.serializers import BaseSerializer
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.utils.constants import (
    RESTRICTED_ISSUE_PROPERTY_DISPLAY_NAMES,
)
from plane.utils.issue_type_hierarchy import validate_type_hierarchy


class IssueTypeSerializer(BaseSerializer):
    project_ids = serializers.ListField(child=serializers.UUIDField(), read_only=True)
    properties = serializers.SerializerMethodField()

    def validate(self, data):
        update_case = self.instance is not None

        # Check the validation for level
        if data.get("level"):
            # level cannot be negative
            if data["level"] < 0:
                raise serializers.ValidationError("Level must be a non-negative integer.")

            # level can be either 0 or should be 1 greater than the current max level for the workspace
            workspace_id = self.context["workspace_id"]
            max_level = IssueType.objects.filter(workspace_id=workspace_id).aggregate(max_level=models.Max("level"))[
                "max_level"
            ]
            if data["level"] != 0 and data["level"] != max_level + 1:
                raise serializers.ValidationError(
                    f"Level must be either 0 or 1 greater than the current max level ({max_level}) for the workspace."
                )

            # If update case, validate that existing issues of this type remain valid with their parents/children
            if update_case:
                new_level = data["level"]
                current_level = self.instance.level

                if new_level != current_level:
                    # Check parent compatibility: get the parent type level for any issue of this type that has a parent
                    issue_with_parent = (
                        Issue.objects.filter(
                            type=self.instance,
                            parent__isnull=False,
                        )
                        .select_related("parent__type")
                        .first()
                    )

                    if issue_with_parent:
                        parent = issue_with_parent.parent
                        parent_level = parent.type.level if parent.type_id and parent.type else 0
                        is_valid, error_msg = validate_type_hierarchy(parent_level, new_level)
                        if not is_valid:
                            raise serializers.ValidationError(
                                f"Cannot change level to {new_level}. "
                                f"Issues of this type have a parent with type level {parent_level}. {error_msg}"
                            )

                    # Check child compatibility: get the child type level for any issue of this type that has sub-workitems
                    child_issue = (
                        Issue.objects.filter(
                            parent__type=self.instance,
                        )
                        .select_related("type")
                        .first()
                    )

                    if child_issue:
                        child_level = child_issue.type.level if child_issue.type_id and child_issue.type else 0
                        is_valid, error_msg = validate_type_hierarchy(new_level, child_level)
                        if not is_valid:
                            raise serializers.ValidationError(
                                f"Cannot change level to {new_level}. "
                                f"Issues of this type have sub-work items with type level {child_level}. {error_msg}"
                            )

        return data

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
