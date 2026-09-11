# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for Celery task imports configuration.
"""

import pytest
from django.conf import settings
from celery import current_app


@pytest.mark.unit
class TestCeleryImports:
    def test_celery_imports_contains_logger_and_webhook_tasks(self):
        assert "plane.bgtasks.logger_task" in settings.CELERY_IMPORTS
        assert "plane.bgtasks.webhook_task" in settings.CELERY_IMPORTS

    def test_logger_and_webhook_tasks_are_registered(self):
        # Force celery to import registered modules
        current_app.loader.import_default_modules()

        assert "plane.bgtasks.logger_task.process_logs" in current_app.tasks
        assert "plane.bgtasks.webhook_task.webhook_send_task" in current_app.tasks
