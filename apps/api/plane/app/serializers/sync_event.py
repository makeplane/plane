# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.db.models import SyncEvent

from .base import BaseSerializer


class SyncEventSerializer(BaseSerializer):
    class Meta:
        model = SyncEvent
        fields = ["id", "seq", "entity_type", "entity_id", "action", "actor", "payload", "created_at"]
        read_only_fields = fields
