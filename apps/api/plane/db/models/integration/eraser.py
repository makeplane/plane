# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import models

from plane.db.models.base import BaseModel


class EraserIntegration(BaseModel):
    workspace = models.OneToOneField(
        "db.Workspace", related_name="eraser_integration", on_delete=models.CASCADE
    )
    encrypted_api_token = models.TextField()

    class Meta:
        db_table = "eraser_integrations"
