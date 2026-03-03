# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from .base import BaseSerializer
from plane.db.models import State


class StateSerializer(BaseSerializer):
    class Meta:
        model = State
        fields = "__all__"
        read_only_fields = ["workspace", "project"]


class StateLiteSerializer(BaseSerializer):
    class Meta:
        model = State
        fields = ["id", "name", "color", "group"]
        read_only_fields = fields
