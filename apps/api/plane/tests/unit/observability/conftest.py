# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Test fixtures for the observability package.

`configure_otel()` is gated by environment variables and a module-level
`_CONFIGURED` flag. Tests must start from a clean slate every time, so:

- `_CONFIGURED` is reset before every test (otherwise the second test
  would always be a no-op because the first one flipped the flag).
- Every `OTEL_*` env var is stripped before the test and restored after,
  so what `_apply_defaults()` writes in one test doesn't leak into the
  next (it uses `os.environ.setdefault`, which bypasses monkeypatch's
  bookkeeping).
"""

import os

import pytest


@pytest.fixture(autouse=True)
def isolate_otel_state(monkeypatch):
    from plane.observability import setup as otel_setup

    monkeypatch.setattr(otel_setup, "_CONFIGURED", False, raising=False)
    monkeypatch.setattr(otel_setup, "_TRACER_PROVIDER", None, raising=False)
    monkeypatch.setattr(otel_setup, "_METER_PROVIDER", None, raising=False)

    saved = {k: v for k, v in os.environ.items() if k.startswith("OTEL_")}
    for key in list(saved.keys()):
        del os.environ[key]

    yield

    for key in [k for k in os.environ if k.startswith("OTEL_")]:
        del os.environ[key]
    os.environ.update(saved)
