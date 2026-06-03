# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from .base import BaseSerializer
from plane.db.models import ProjectCopyJob


class ProjectCopyJobSerializer(BaseSerializer):
    class Meta:
        model = ProjectCopyJob
        fields = [
            "id",
            "source_project_id",
            "target_workspace_id",
            "initiated_by_id",
            "identifier",
            "name_override",
            "status",
            "new_project_id",
            "error",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
