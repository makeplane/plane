# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Root conftest.py — runs before Django setup.

Stubs optional dependencies that may not be installed in the local dev venv.
These stubs prevent ImportError when the test runner loads URL configurations
that reference optional authentication providers (e.g. LDAP).
"""

import sys
from unittest.mock import MagicMock


def _stub_module(name: str) -> None:
    """Insert a MagicMock stub into sys.modules for *name* and all sub-paths."""
    if name not in sys.modules:
        stub = MagicMock()
        stub.__spec__ = None
        sys.modules[name] = stub


# Stub python-ldap (optional enterprise auth provider not installed in dev)
_stub_module("ldap")
_stub_module("ldap.filter")
_stub_module("ldap.ldapobject")
