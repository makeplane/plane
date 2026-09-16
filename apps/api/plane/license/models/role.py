# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Instance level administrator tags.

The platform defines three administrator tags that the default instance
administrator (``admin@ai4ms.local``) hands out to registered users:
development, operations and main PI. Holding any of them grants the whole
configuration surface of the research module, while business data keeps
following the organisation ACL (a tag never widens data visibility).

The same table is also used to enumerate the members of the main PI
workspace, which is why ``role`` is a plain text choice instead of a
workspace membership flag.
"""

from django.conf import settings
from django.db import models
from django.db.models import Q

from plane.db.models import BaseModel


class InstanceRoleAssignment(BaseModel):
    """Administrator tag granted to a user on this instance."""

    class AdminRole(models.TextChoices):
        DEV_ADMIN = "DEV_ADMIN", "Development Admin"
        OPS_ADMIN = "OPS_ADMIN", "Operations Admin"
        MAIN_PI = "MAIN_PI", "Main PI"

    instance = models.ForeignKey(
        "license.Instance",
        on_delete=models.CASCADE,
        related_name="role_assignments",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="instance_role_assignments",
    )
    role = models.CharField(max_length=20, choices=AdminRole.choices)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="assigned_instance_roles",
        null=True,
        blank=True,
    )
    note = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        verbose_name = "Instance Role Assignment"
        verbose_name_plural = "Instance Role Assignments"
        db_table = "instance_role_assignments"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["user", "role"],
                condition=Q(deleted_at__isnull=True),
                name="inst_role_uq_user_role",
            ),
        ]
        indexes = [
            models.Index(fields=["user"], name="inst_role_user_idx"),
            models.Index(fields=["role"], name="inst_role_role_idx"),
        ]

    def __str__(self):
        return f"{self.user_id} <{self.role}>"
