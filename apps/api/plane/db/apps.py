# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.apps import AppConfig


class DbConfig(AppConfig):
    name = "plane.db"

    def ready(self):
        # Connect workspace signals
        import plane.db.signals  # noqa: F401
        # Connect business calendar signals (cache invalidation on Holiday/DayOverride changes)
        import plane.db.models.business_calendar  # noqa: F401
