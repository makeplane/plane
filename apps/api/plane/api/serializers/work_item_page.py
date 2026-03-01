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
from plane.db.models import Page
from plane.ee.models import WorkItemPage
from .base import BaseSerializer


class WorkItemPageLiteSerializer(BaseSerializer):
    """
    Lightweight page serializer for work item page links.

    Provides essential page information including identifiers,
    name, timestamps, and visual properties for work item page associations.
    """

    class Meta:
        model = Page
        fields = [
            "id",
            "name",
            "created_at",
            "updated_at",
            "created_by",
            "is_global",
            "logo_props",
        ]
        read_only_fields = fields


class WorkItemPageCreateSerializer(serializers.Serializer):
    """
    Serializer for creating work item page links.

    Handles page link creation with validation for page_id.
    """

    page_id = serializers.UUIDField(
        required=True,
        help_text="ID of the page to link to the work item",
    )


class WorkItemPageSerializer(BaseSerializer):
    """
    Full serializer for work item page links.

    Provides complete page link information including expanded page details,
    timestamps, and workspace context for work item page associations.
    """

    page = WorkItemPageLiteSerializer(read_only=True)

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
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "issue",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
