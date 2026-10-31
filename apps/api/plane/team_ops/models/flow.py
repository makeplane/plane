# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from plane.db.models.base import BaseModel


class Flow(BaseModel):
    """Who works with whom on a project, drawn by an admin as stages: the people of stage 1, then stage 2, and so on."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="team_ops_flows")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="team_ops_flows")
    name = models.CharField(max_length=200)

    class Meta:
        verbose_name = "Flow"
        verbose_name_plural = "Flows"
        db_table = "tops_flow"
        ordering = ("name",)


class FlowStage(BaseModel):
    flow = models.ForeignKey(Flow, on_delete=models.CASCADE, related_name="stages")
    position = models.PositiveIntegerField()
    name = models.CharField(max_length=200)

    class Meta:
        db_table = "tops_flow_stage"
        ordering = ("position",)


class FlowStageMember(BaseModel):
    stage = models.ForeignKey(FlowStage, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")

    class Meta:
        db_table = "tops_flow_stage_member"
        constraints = [
            models.UniqueConstraint(
                fields=["stage", "user"], condition=Q(deleted_at__isnull=True), name="tops_flow_stage_member_once"
            )
        ]
