# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture
def mock_redis():
    """
    Mock Redis for testing without actual Redis connection.

    This fixture patches the redis_instance function to return a MagicMock
    that behaves like a Redis client.
    """
    mock_redis_client = MagicMock()

    # Configure the mock to handle common Redis operations
    mock_redis_client.get.return_value = None
    mock_redis_client.set.return_value = True
    mock_redis_client.delete.return_value = True
    mock_redis_client.exists.return_value = 0
    mock_redis_client.ttl.return_value = -1

    # Start the patch
    with patch("plane.settings.redis.redis_instance", return_value=mock_redis_client):
        yield mock_redis_client


@pytest.fixture
def mock_celery():
    """
    Mock Celery for testing without actual task execution.

    This fixture patches Celery's task.delay() to prevent actual task execution.
    """
    # Start the patch
    with patch("celery.app.task.Task.delay") as mock_delay:
        mock_delay.return_value = MagicMock(id="mock-task-id")
        yield mock_delay
