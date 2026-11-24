# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models

# Module imports
from .base import BaseModel


class Portfolio(BaseModel):
    """Group of projects owned by one team."""

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="workspace_portfolios")
    team = models.ForeignKey("db.Team", on_delete=models.CASCADE, related_name="portfolios")
    lead = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="portfolio_leads", null=True, blank=True
    )
    logo_props = models.JSONField(default=dict)
    sort_order = models.FloatField(default=65535)
    archived_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        self.workspace_id = self.team.workspace_id
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} <{self.team_id}>"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["team", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="portfolio_unique_name_team_when_deleted_at_null",
            )
        ]
        verbose_name = "Portfolio"
        verbose_name_plural = "Portfolios"
        db_table = "portfolios"
        ordering = ("sort_order", "-created_at")
