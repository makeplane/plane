# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import LiteratureEntry

from .org import ResearchUserSerializer


class LiteratureEntrySerializer(serializers.ModelSerializer):
    owner_detail = ResearchUserSerializer(source="owner", read_only=True)
    is_annotated = serializers.BooleanField(read_only=True)
    has_verifiable_source = serializers.BooleanField(read_only=True)

    class Meta:
        model = LiteratureEntry
        fields = [
            "id",
            "workspace",
            "project",
            "owner",
            "owner_detail",
            "title",
            "authors",
            "year",
            "venue",
            "doi",
            "url",
            "pdf_asset",
            "summary",
            "method_tags",
            "system_tags",
            "gap_notes",
            "relevance_score",
            "status",
            "visibility",
            "stage_instance",
            "is_annotated",
            "has_verifiable_source",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "project", "owner", "created_at", "updated_at"]
