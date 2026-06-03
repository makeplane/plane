# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from plane.db.models import ImportJob


class ImportJobSerializer(BaseSerializer):
    """Read serializer for an import job. Never exposes `config` (credentials)."""

    initiated_by_detail = UserLiteSerializer(source="initiated_by", read_only=True)

    class Meta:
        model = ImportJob
        fields = [
            "id",
            "source",
            "status",
            "report",
            "reason",
            "external_id",
            "initiated_by",
            "initiated_by_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
