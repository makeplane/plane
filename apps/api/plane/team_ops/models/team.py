# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from plane.db.models.base import BaseModel


class OpsTeam(BaseModel):
    """A group of workspace members managed by workspace admins."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_teams")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Ops Team"
        verbose_name_plural = "Ops Teams"
        db_table = "tops_team"
        ordering = ("name",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="tops_team_unique_name_per_workspace_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return self.name


class OpsTeamMember(BaseModel):
    """Membership of a user in a team. A lead can see and, if allowed, plan for the team."""

    class Role(models.TextChoices):
        LEAD = "LEAD", "Lead"
        MEMBER = "MEMBER", "Member"

    team = models.ForeignKey(OpsTeam, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_ops_team_memberships",
    )
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)

    class Meta:
        verbose_name = "Ops Team Member"
        verbose_name_plural = "Ops Team Members"
        db_table = "tops_team_member"
        constraints = [
            models.UniqueConstraint(
                fields=["team", "user"],
                condition=Q(deleted_at__isnull=True),
                name="tops_team_member_unique_team_user_when_deleted_at_null",
            )
        ]
        indexes = [models.Index(fields=["user", "role"], name="tops_tm_user_role_idx")]

    def __str__(self):
        return f"{self.team_id} {self.user_id} {self.role}"
