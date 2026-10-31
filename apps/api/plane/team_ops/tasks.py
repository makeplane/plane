# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from celery import shared_task

# Module imports
from plane.team_ops.services.weekly_plan import extend_weekly_plans


@shared_task
def extend_weekly_plans_task():
    """Write every active weekly plan out to the end of its workspace's horizon."""
    return extend_weekly_plans()
