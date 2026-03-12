# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.db.models import IssueOpinion
from .base import BaseSerializer


class IssueOpinionSerializer(BaseSerializer):
    class Meta:
        model = IssueOpinion
        fields = [
            "id",
            "activity",
            "actor",
            "sentiment",
            "content",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "activity",
            "actor",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
