# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.apps import AppConfig


class TimeTrackingConfig(AppConfig):
    name = "plane.time_tracking"
    label = "time_tracking"
    verbose_name = "Time tracking"

    def ready(self):
        # Connect the lifecycle signal handlers (member removed, project archived)
        from . import signals  # noqa: F401
