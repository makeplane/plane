# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.apps import AppConfig
from django.conf import settings


class TeamOpsConfig(AppConfig):
    name = "plane.team_ops"
    label = "team_ops"
    verbose_name = "Team Ops"

    def ready(self):
        if not settings.TEAM_OPS_ENABLED:
            return
        # Registered here, not in plane/celery.py, so the feature stays out of Core files.
        from celery.schedules import crontab

        from plane.celery import app

        app.conf.beat_schedule["team-ops-extend-calendar-weekly-plans"] = {
            "task": "plane.team_ops.tasks.extend_weekly_plans_task",
            "schedule": crontab(hour=0, minute=30),  # UTC 00:30
        }
