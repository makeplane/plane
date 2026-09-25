# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Test fixtures for the observability package.

`configure_otel()` is gated by environment variables and a module-level
`_CONFIGURED` flag. Tests must start from a clean slate every time, so:

- `_CONFIGURED` is reset before every test (otherwise the second test
  would always be a no-op because the first one flipped the flag).
- Every `OTEL_*` env var is stripped before the test, so what
  `_apply_defaults()` writes in one test doesn't leak into the next (it
  writes to `os.environ` directly, bypassing monkeypatch's bookkeeping).

The stripping goes through `monkeypatch.delenv` rather than a manual
save/restore: this fixture depends on `monkeypatch`, so `monkeypatch.undo()`
runs *after* any post-yield teardown here. A manual restore would be undone
again by that later `undo()`, permanently stripping any `OTEL_*` var the
developer had exported in their shell.
"""

import os

import pytest


@pytest.fixture(autouse=True)
def isolate_otel_state(monkeypatch):
    from plane.observability import setup as otel_setup

    monkeypatch.setattr(otel_setup, "_CONFIGURED", False, raising=False)
    monkeypatch.setattr(otel_setup, "_PROVIDERS_READY", False, raising=False)
    monkeypatch.setattr(otel_setup, "_TRACER_PROVIDER", None, raising=False)
    monkeypatch.setattr(otel_setup, "_METER_PROVIDER", None, raising=False)

    for key in [k for k in os.environ if k.startswith("OTEL_")]:
        monkeypatch.delenv(key, raising=False)

    yield

    # Drop whatever `_apply_defaults()` wrote directly into os.environ during
    # the test — monkeypatch knows nothing about those keys and would leave
    # them behind. This is a delete-only teardown: the developer's original
    # values are restored by monkeypatch.undo(), which runs after this.
    for key in [k for k in os.environ if k.startswith("OTEL_")]:
        del os.environ[key]
