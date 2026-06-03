# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from .base import BaseSerializer
from plane.db.models import IssueType, ProjectIssueType


class IssueTypeSerializer(BaseSerializer):
    class Meta:
        model = IssueType
        fields = [
            "id",
            "name",
            "description",
            "logo_props",
            "is_epic",
            "is_default",
            "is_active",
            "level",
            "workspace",
            "external_source",
            "external_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace", "external_source", "external_id"]


class ProjectIssueTypeSerializer(BaseSerializer):
    issue_type_detail = IssueTypeSerializer(source="issue_type", read_only=True)

    class Meta:
        model = ProjectIssueType
        fields = [
            "id",
            "project",
            "issue_type",
            "issue_type_detail",
            "level",
            "is_default",
        ]
        read_only_fields = ["workspace", "project"]
