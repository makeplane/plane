# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Conftest that installs a mock 'ldap' module before any test imports it.

This allows tests to run without python-ldap C dependencies installed.
"""

import sys
from unittest.mock import MagicMock

# Build a fake ldap module with the constants/classes the provider references
_mock_ldap = MagicMock()
_mock_ldap.OPT_REFERRALS = 0
_mock_ldap.OPT_NETWORK_TIMEOUT = 1
_mock_ldap.VERSION3 = 3
_mock_ldap.SCOPE_SUBTREE = 2
_mock_ldap.SERVER_DOWN = type("SERVER_DOWN", (Exception,), {})
_mock_ldap.INVALID_CREDENTIALS = type("INVALID_CREDENTIALS", (Exception,), {})
_mock_ldap.LDAPError = type("LDAPError", (Exception,), {})
_mock_ldap.filter.escape_filter_chars = lambda s: s

# Inject the mock module into sys.modules so `import ldap` resolves
sys.modules.setdefault("ldap", _mock_ldap)
sys.modules.setdefault("ldap.filter", _mock_ldap.filter)
