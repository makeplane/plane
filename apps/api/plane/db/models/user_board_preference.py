# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Per-user board preferences.

One row per user. ``settings`` is a JSON object of board preference flags and their
data; a user without a row has every setting at its default (off). ``version``
goes up by one on every write so clients can tell whether their copy is stale.
"""

# Python imports
import uuid

# Django imports
from django.db import models

# Module imports
from ..mixins import TimeAuditModel


class UserBoardPreference(TimeAuditModel):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    user = models.OneToOneField("db.User", on_delete=models.CASCADE, related_name="board_preferences")
    settings = models.JSONField(default=dict)
    version = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "User Board Preference"
        verbose_name_plural = "User Board Preferences"
        db_table = "user_board_preferences"

    def __str__(self):
        return f"board preferences {self.user_id}"
