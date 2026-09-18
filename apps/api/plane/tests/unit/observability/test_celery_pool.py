# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Tests for the Celery pool detection that gates OTel provider deferral.

Only the prefork pool forks task children after plane/celery.py is imported, and
only it dispatches worker_process_init. Getting this wrong in either direction
loses telemetry: deferring for a non-forking pool leaves the providers
uninitialized, and not deferring for prefork hands children an inherited gRPC
channel that is not fork-safe.
"""

import pytest

from plane.celery import _effective_pool, _is_prefork_worker


@pytest.mark.unit
@pytest.mark.parametrize(
    "argv,expected",
    [
        (["celery", "-A", "plane", "worker", "-l", "info"], True),
        (["celery", "-A", "plane", "worker", "-P", "prefork"], True),
        (["celery", "-A", "plane", "worker", "--pool=prefork"], True),
        (["celery", "-A", "plane", "worker", "-P", "solo"], False),
        (["celery", "-A", "plane", "worker", "--pool=gevent"], False),
        (["celery", "-A", "plane", "worker", "--pool=threads"], False),
        (["celery", "-A", "plane", "beat", "-l", "info"], False),
        (["manage.py", "migrate"], False),
        (["gunicorn", "plane.asgi:application"], False),
    ],
)
def test_is_prefork_worker_from_argv(argv, expected, monkeypatch):
    monkeypatch.setattr("sys.argv", argv)
    assert _is_prefork_worker() is expected


@pytest.mark.unit
def test_settings_configured_pool_is_honored(monkeypatch, settings):
    # A pool selected through CELERY_WORKER_POOL rather than the CLI must still
    # be detected: `threads` runs tasks in the main process and never dispatches
    # worker_process_init, so deferring the providers would export nothing.
    monkeypatch.setattr("sys.argv", ["celery", "-A", "plane", "worker", "-l", "info"])
    settings.CELERY_WORKER_POOL = "threads"
    assert _effective_pool() == "threads"
    assert _is_prefork_worker() is False


@pytest.mark.unit
def test_cli_pool_wins_over_settings(monkeypatch, settings):
    monkeypatch.setattr("sys.argv", ["celery", "-A", "plane", "worker", "--pool=prefork"])
    settings.CELERY_WORKER_POOL = "threads"
    assert _effective_pool() == "prefork"
    assert _is_prefork_worker() is True


@pytest.mark.unit
def test_defaults_to_prefork_when_nothing_is_configured(monkeypatch):
    monkeypatch.setattr("sys.argv", ["celery", "-A", "plane", "worker"])
    assert _effective_pool() == "prefork"
