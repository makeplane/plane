# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Tests for the worker_init hook that creates providers for non-forking pools.

Celery worker processes defer provider creation at import. Only the prefork pool
forks children and dispatches worker_process_init, so every other pool must get
its providers from worker_init, using the pool Celery actually resolved.
"""

from types import SimpleNamespace

import pytest

from plane.celery import init_otel_for_non_forking_pool


@pytest.mark.unit
@pytest.mark.parametrize(
    "pool,creates_providers",
    [
        ("prefork", False),
        ("processes", False),  # Celery's compat alias for prefork
        ("threads", True),
        ("solo", True),
    ],
)
def test_worker_init_creates_providers_only_for_non_forking_pools(pool, creates_providers, monkeypatch):
    calls = []
    monkeypatch.setattr("plane.celery.init_process_providers", lambda: calls.append(pool))
    init_otel_for_non_forking_pool(sender=SimpleNamespace(pool_cls=pool))
    assert bool(calls) is creates_providers
