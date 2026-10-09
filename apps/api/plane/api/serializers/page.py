# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.utils.page_search import build_page_snippet


class PageSearchSerializer(serializers.Serializer):
    """
    Serializer for page search result data formatting.

    Provides a lightweight, read-only projection of a page for search
    responses: identity, project and parent context, last-modified time, and a
    short text snippet extracted around the query match.
    """

    id = serializers.UUIDField(read_only=True, help_text="Page ID")
    name = serializers.CharField(read_only=True, help_text="Page name")
    project_id = serializers.UUIDField(
        source="matched_project_id",
        read_only=True,
        allow_null=True,
        help_text="ID of an accessible project the page belongs to",
    )
    parent_id = serializers.UUIDField(read_only=True, allow_null=True, help_text="Parent page ID")
    updated_at = serializers.DateTimeField(read_only=True, help_text="Last modified timestamp")
    snippet = serializers.SerializerMethodField(help_text="Short text excerpt around the search match")

    def get_snippet(self, obj) -> str:
        query = self.context.get("query") or ""
        return build_page_snippet(obj.description_stripped, query)
