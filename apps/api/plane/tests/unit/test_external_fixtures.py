# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import MagicMock

import pytest
from celery.app.task import Task

from plane.settings import redis as redis_settings


@pytest.mark.unit
def test_mock_redis_patches_redis_instance(mock_redis):
    assert isinstance(mock_redis, MagicMock)
    assert redis_settings.redis_instance() is mock_redis


@pytest.mark.unit
def test_mock_celery_patches_task_delay(mock_celery):
    assert Task.delay is mock_celery
    assert Task.delay().id == "mock-task-id"
