# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from .base import BaseSerializer
from rest_framework import serializers

from plane.db.models import State, StateGroup


class StateSerializer(BaseSerializer):
    order = serializers.FloatField(required=False)

    class Meta:
        model = State
        fields = [
            "id",
            "project_id",
            "workspace_id",
            "name",
            "color",
            "group",
            "default",
            "is_closed",
            "description",
            "sequence",
            "order",
        ]
        # Defaults only change through mark_as_default, which also clears the old one
        read_only_fields = ["workspace", "project", "default", "is_closed"]

    def validate(self, attrs):
        if attrs.get("group") == StateGroup.TRIAGE.value:
            raise serializers.ValidationError("Cannot create triage state")
        # d2m-plane: the Closed state must stay in the completed group
        new_group = attrs.get("group", StateGroup.COMPLETED.value)
        if self.instance and self.instance.is_closed and new_group != StateGroup.COMPLETED.value:
            raise serializers.ValidationError("The Closed state must stay in the completed group")
        return attrs


class StateLiteSerializer(BaseSerializer):
    class Meta:
        model = State
        fields = ["id", "name", "color", "group"]
        read_only_fields = fields
