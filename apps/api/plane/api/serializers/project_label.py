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
from plane.api.serializers.base import BaseSerializer
from plane.ee.models import ProjectLabel


class ProjectLabelSerializer(BaseSerializer):
    """Serializer for project labels with complete metadata"""

    class Meta:
        model = ProjectLabel
        fields = [
            "id",
            "name",
            "description",
            "color",
            "sort_order",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]


class ProjectLabelCreateUpdateSerializer(BaseSerializer):
    """Serializer for creating and updating project labels"""

    class Meta:
        model = ProjectLabel
        fields = [
            "name",
            "description",
            "color",
            "sort_order",
        ]

    def validate_name(self, name):
        """Validate that the label name is unique within the workspace"""
        project_label_id = self.instance.id if self.instance else None
        workspace_id = self.context.get("workspace_id")

        project_labels = ProjectLabel.objects.filter(
            name__iexact=name,
            workspace_id=workspace_id,
        )

        if project_label_id:
            project_labels = project_labels.exclude(id=project_label_id)

        if project_labels.exists():
            raise serializers.ValidationError(detail="PROJECT_LABEL_NAME_ALREADY_EXISTS")

        return name
