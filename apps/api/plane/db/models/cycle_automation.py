# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Cycle automation rules.

A rule moves the work items of a cycle that are in one of ``from_state_ids`` to ``to_state`` when the cycle starts
(``cycle_started``) or completes (``cycle_completed``). A rule fires at most once per cycle: every firing, and the
baseline taken when a rule is enabled, is a ``CycleAutomationRun`` row, unique per (cycle, rule).
"""

# Python imports
import uuid

# Django imports
from django.contrib.postgres.fields import ArrayField
from django.db import models

# Module imports
from ..mixins import TimeAuditModel
from .project import ProjectBaseModel


class CycleAutomationTrigger(models.TextChoices):
    CYCLE_STARTED = "cycle_started", "Cycle started"
    CYCLE_COMPLETED = "cycle_completed", "Cycle completed"


class CycleAutomationRule(ProjectBaseModel):
    trigger = models.CharField(max_length=30, choices=CycleAutomationTrigger.choices)
    from_state_ids = ArrayField(models.UUIDField(), default=list, blank=True)
    to_state = models.ForeignKey(
        "db.State", on_delete=models.SET_NULL, null=True, blank=True, related_name="cycle_automation_rules"
    )
    is_enabled = models.BooleanField(default=False)
    enabled_at = models.DateTimeField(null=True, blank=True)
    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Cycle Automation Rule"
        verbose_name_plural = "Cycle Automation Rules"
        db_table = "cycle_automation_rules"
        ordering = ("sort_order", "created_at")

    def __str__(self):
        return f"{self.project_id} {self.trigger} -> {self.to_state_id}"


class CycleAutomationRun(TimeAuditModel):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)
    cycle = models.ForeignKey("db.Cycle", on_delete=models.CASCADE, related_name="automation_runs")
    rule = models.ForeignKey(CycleAutomationRule, on_delete=models.CASCADE, related_name="runs")
    # True when the run was recorded as a baseline (the cycle already met the trigger when the rule was enabled)
    baseline = models.BooleanField(default=False)
    moved_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Cycle Automation Run"
        verbose_name_plural = "Cycle Automation Runs"
        db_table = "cycle_automation_runs"
        constraints = [
            models.UniqueConstraint(fields=["cycle", "rule"], name="cycle_automation_run_unique_cycle_rule"),
        ]

    def __str__(self):
        return f"{self.cycle_id} {self.rule_id}"
