# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Chat abilities a workspace admin grants to one guest at a time.

Workspace members and admins can always open DMs. A guest can only once a workspace
admin has granted it here; without the grant they can still read and reply in DMs
that others open with them. Revoking sets the flag back to False rather than
deleting the row, so `created_by` (who first granted it) and `updated_by` (who last
changed it) are kept. A grant also ends when its guest stops being an active guest
(see `plane.chat.signals`).
"""

from django.db import models
from django.db.models import Q

from plane.db.models import BaseModel

__all__ = ["ChatGuestPermission"]


class ChatGuestPermission(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="chat_guest_permissions")
    user = models.ForeignKey("db.User", on_delete=models.CASCADE, related_name="chat_guest_permissions")
    can_open_dms = models.BooleanField(default=False)

    class Meta:
        db_table = "chat_guest_permissions"
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user"], condition=Q(deleted_at__isnull=True), name="chat_guest_permission_unique"
            ),
        ]

    def __str__(self):
        return f"{self.user_id} in {self.workspace_id}"
