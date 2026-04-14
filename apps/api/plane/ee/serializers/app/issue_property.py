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


class WorkspaceWorkItemTypeSerializer(BaseSerializer):
    project_ids = serializers.ListField(child=serializers.UUIDField(), read_only=True)
    properties = serializers.SerializerMethodField()

    def validate(self, data):
        update_case = self.instance is not None

        # Check the validation for level
        if "level" in data:
            # level cannot be negative
            if data["level"] < 0:
                raise serializers.ValidationError({"level": "Level cannot be negative."})

            # the values of the levels should be in between 0 and the max level + 1 allowed for the workspace
            max_level = (
                IssueType.objects.filter(
                    workspace_id=self.context["workspace_id"],
                ).aggregate(max_level=models.Max("level"))["max_level"]
                or 0
            )
            if data["level"] > max_level + 1:
                raise serializers.ValidationError(
                    {"level": f"Level must be between 0 and {max_level + 1} for this workspace."}
                )

            # If update case, validate that existing issues of this type
            # remain valid with their parents/children
            if update_case:
                new_level = data["level"]
                if new_level != self.instance.level:
                    self._validate_issue_type_hierarchy(new_level)

        return data

    def _get_type_level(self, issue):
        """Get the type level for an issue, returns 0 if unset."""
        return issue.type.level if issue.type_id and issue.type else 0

    def _validate_issue_type_hierarchy(self, new_level):
        """Validate that changing this type's level doesn't break existing
        parent-child relationships. Skips validation against level 0 types
        since they are unpositioned in the hierarchy."""
        # Check parent compatibility
        issue_with_parent = (
            Issue.objects.filter(type=self.instance, parent__isnull=False).select_related("parent__type").first()
        )
        if issue_with_parent:
            parent_level = self._get_type_level(issue_with_parent.parent)
            if parent_level != 0:
                is_valid, error_msg = validate_type_hierarchy(parent_level, new_level)
                if not is_valid:
                    raise serializers.ValidationError({"level": error_msg})

        # Check child compatibility
        child_issue = Issue.objects.filter(parent__type=self.instance).select_related("type").first()
        if child_issue:
            child_level = self._get_type_level(child_issue)
            if child_level != 0:
                is_valid, error_msg = validate_type_hierarchy(new_level, child_level)
                if not is_valid:
                    raise serializers.ValidationError({"level": error_msg})

    class Meta:
        model = IssueType
        fields = "__all__"
        read_only_fields = ["workspace", "project", "deleted_at", "is_default", "is_epic"]

    def get_properties(self, obj):
        return {str(itp.property_id): itp.sort_order for itp in obj.issue_type_properties.all()}


class IssueTypeSerializer(BaseSerializer):
    project_ids = serializers.ListField(child=serializers.UUIDField(), read_only=True)

    class Meta:
        model = IssueType
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "deleted_at",
            "level",
            "is_default",
            "is_epic",
        ]


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
