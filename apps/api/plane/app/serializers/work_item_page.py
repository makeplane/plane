# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.db.models import Page, WorkItemPage


class PageSummarySerializer(serializers.ModelSerializer):
    project_ids = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "access",
            "is_locked",
            "archived_at",
            "workspace",
            "owned_by",
            "project_ids",
        ]
        read_only_fields = fields

    def get_project_ids(self, obj):
        return list(obj.projects.values_list("id", flat=True))


class WorkItemPageCreateSerializer(serializers.Serializer):
    page_id = serializers.UUIDField(required=True)


class WorkItemPageSerializer(serializers.ModelSerializer):
    page = PageSummarySerializer(read_only=True)

    class Meta:
        model = WorkItemPage
        fields = [
            "id",
            "page",
            "issue",
            "project",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = fields
