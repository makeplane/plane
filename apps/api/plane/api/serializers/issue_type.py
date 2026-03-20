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
from plane.ee.serializers import BaseSerializer
from plane.db.models import IssueType, ProjectIssueType, Issue
from plane.utils.issue_type_hierarchy import validate_type_hierarchy

class IssueTypeAPISerializer(BaseSerializer):
    project_ids = serializers.ListField(child=serializers.UUIDField(), required=False, read_only=True)

    def validate(self, data):
        update_case = self.instance is not None

        # Check the validation for level
        if "level" in data:
            # level cannot be negative
            if data["level"] < 0:
                raise serializers.ValidationError("Level must be a non-negative integer.")

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
            Issue.objects.filter(type=self.instance, parent__isnull=False)
            .select_related("parent__type")
            .first()
        )
        if issue_with_parent:
            parent_level = self._get_type_level(issue_with_parent.parent)
            if parent_level != 0:
                is_valid, error_msg = validate_type_hierarchy(parent_level, new_level)
                if not is_valid:
                    raise serializers.ValidationError({"level": error_msg})

        # Check child compatibility
        child_issue = (
            Issue.objects.filter(parent__type=self.instance)
            .select_related("type")
            .first()
        )
        if child_issue:
            child_level = self._get_type_level(child_issue)
            if child_level != 0:
                is_valid, error_msg = validate_type_hierarchy(new_level, child_level)
                if not is_valid:
                    raise serializers.ValidationError({"level": error_msg})


    class Meta:
        model = IssueType
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "logo_props",
            "is_default",
            "level",
            "deleted_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]


class ProjectIssueTypeAPISerializer(BaseSerializer):
    class Meta:
        model = ProjectIssueType
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "level",
            "is_default",
            "deleted_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
