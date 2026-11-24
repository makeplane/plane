# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.apps import AppConfig


class LiviereConfig(AppConfig):
    """Django app of the Liviere/plane fork: our models, migrations, signals and Celery tasks."""

    name = "plane.liviere"
    label = "liviere"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        from plane.liviere.activity import signals
        from plane.liviere.push import signals as push_signals

        signals.connect()
        push_signals.connect()
