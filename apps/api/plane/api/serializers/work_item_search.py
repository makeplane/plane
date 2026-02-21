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

#  Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import (
    Issue,
)

from .base import BaseSerializer


class WorkItemAdvancedSearchRequestSerializer(serializers.Serializer):
    """
    Request serializer for work item advanced search endpoint.

    Supports complex filtering using ComplexFilterBackend and IssueFilterSet.
    Filters field accepts JSON structure with logical operators (and, or, not)
    and field filters defined in IssueFilterSet.
    """

    query = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Search query string for text-based search across issue fields",
    )
    filters = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text="Filter JSON passed through to IssueFilterSet for validation and application",
    )
    limit = serializers.IntegerField(
        required=False,
        default=10,
        min_value=1,
        help_text="Maximum number of results to return",
    )
    workspace_search = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Whether to search across all projects in the workspace",
    )
    project_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Optional project ID to filter results to a specific project",
    )


class WorkItemAdvancedSearchResponseSerializer(BaseSerializer):
    """
    Serializer for work item advanced search response.

    Provides list of work items with their identifiers, names, and project context.
    """

    project_identifier = serializers.CharField(source="project.identifier", read_only=True)

    class Meta:
        model = Issue
        fields = [
            "id",
            "name",
            "sequence_id",
            "project_identifier",
            "project_id",
            "workspace_id",
            "type_id",
            "state_id",
            "priority",
            "target_date",
            "start_date",
        ]
