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

# Module imports
from .base import BaseSerializer
from plane.db.models import State, StateGroup
from rest_framework import serializers


class StateSerializer(BaseSerializer):
    """
    Serializer for work item states with default state management.

    Handles state creation and updates including default state validation
    and automatic default state switching for workflow management.
    """

    def validate_name(self, value):
        if value.strip().lower() == "triage":
            raise serializers.ValidationError("Triage is a reserved state name")
        return value

    def validate(self, data):
        # If the default is being provided then make all other states default False
        if data.get("default", False):
            State.objects.filter(project_id=self.context.get("project_id")).update(default=False)

        if data.get("group", None) == StateGroup.TRIAGE.value:
            raise serializers.ValidationError("Cannot create triage state")
        return data

    class Meta:
        model = State
        exclude = ["slug"]
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "workspace",
            "project",
            "deleted_at",
        ]


class StateLiteSerializer(BaseSerializer):
    """
    Lightweight state serializer for minimal data transfer.

    Provides essential state information including visual properties
    and grouping data optimized for UI display and filtering.
    """

    class Meta:
        model = State
        fields = ["id", "name", "color", "group"]
        read_only_fields = fields
