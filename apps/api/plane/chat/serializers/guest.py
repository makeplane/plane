# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.app.serializers.base import BaseSerializer
from plane.chat.models import ChatGuestPermission


class ChatGuestPermissionSerializer(BaseSerializer):
    """One guest's chat grants: `created_by` first granted them, `updated_by` (if set) last changed them."""

    class Meta:
        model = ChatGuestPermission
        fields = ["id", "workspace", "user", "can_open_dms", "created_at", "created_by", "updated_at", "updated_by"]
        read_only_fields = fields
