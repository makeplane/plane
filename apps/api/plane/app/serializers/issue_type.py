# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import IssueType


class IssueTypeSerializer(BaseSerializer):
    project_ids = serializers.SerializerMethodField()

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
            "project_ids",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["workspace", "created_by", "updated_by", "created_at", "updated_at"]

    def get_project_ids(self, obj):
        return [str(project_issue_type.project_id) for project_issue_type in obj.project_issue_types.all()]
