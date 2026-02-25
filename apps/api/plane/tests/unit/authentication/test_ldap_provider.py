# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for LDAP authentication provider.

All tests mock python-ldap so no real LDAP server is needed.
"""

import pytest
from unittest.mock import patch, MagicMock

from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

LDAP_CONFIG_DEFAULTS = (
    "1",                                        # IS_LDAP_ENABLED
    "ldap://ldap.example.com",                  # LDAP_SERVER_URI
    "cn=admin,dc=example,dc=com",               # LDAP_BIND_DN
    "admin-password",                           # LDAP_BIND_PASSWORD
    "ou=users,dc=example,dc=com",               # LDAP_USER_SEARCH_BASE
    "(sAMAccountName=%(user)s)",                # LDAP_USER_FILTER
    "mail",                                     # LDAP_ATTR_EMAIL
    "givenName",                                # LDAP_ATTR_FIRST_NAME
    "sn",                                       # LDAP_ATTR_LAST_NAME
    "0",                                        # LDAP_USE_TLS
)

SAMPLE_LDAP_ENTRY = (
    "cn=jdoe,ou=users,dc=example,dc=com",
    {
        "mail": [b"jdoe@example.com"],
        "givenName": [b"John"],
        "sn": [b"Doe"],
    },
)

CONFIG_PATCH = "plane.authentication.provider.credentials.ldap.get_configuration_value"
LDAP_MOD_PATCH = "plane.authentication.provider.credentials.ldap.ldap"


def _mock_request():
    """Return a minimal mock Django request."""
    req = MagicMock()
    req.META = {"REMOTE_ADDR": "127.0.0.1", "HTTP_USER_AGENT": "test-agent"}
    return req


def _build_provider(config=LDAP_CONFIG_DEFAULTS, username="jdoe", password="secret"):
    """Instantiate LDAPProvider with mocked config."""
    with patch(CONFIG_PATCH, return_value=config):
        from plane.authentication.provider.credentials.ldap import LDAPProvider

        return LDAPProvider(
            request=_mock_request(),
            username=username,
            password=password,
            callback=MagicMock(),
        )


# ===========================================================================
# LDAPProvider.__init__ tests
# ===========================================================================


@pytest.mark.unit
class TestLDAPProviderInit:
    """Verify constructor validation of LDAP configuration."""

    def test_raises_when_ldap_disabled(self):
        disabled_config = ("0",) + LDAP_CONFIG_DEFAULTS[1:]
        with pytest.raises(AuthenticationException) as exc_info:
            _build_provider(config=disabled_config)
        assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES["LDAP_NOT_CONFIGURED"]

    def test_raises_when_server_uri_missing(self):
        bad_config = list(LDAP_CONFIG_DEFAULTS)
        bad_config[1] = ""  # empty server URI
        with pytest.raises(AuthenticationException) as exc_info:
            _build_provider(config=tuple(bad_config))
        assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES["LDAP_NOT_CONFIGURED"]

    def test_raises_when_bind_dn_missing(self):
        bad_config = list(LDAP_CONFIG_DEFAULTS)
        bad_config[2] = ""  # empty bind DN
        with pytest.raises(AuthenticationException) as exc_info:
            _build_provider(config=tuple(bad_config))
        assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES["LDAP_NOT_CONFIGURED"]

    def test_raises_when_search_base_missing(self):
        bad_config = list(LDAP_CONFIG_DEFAULTS)
        bad_config[4] = ""  # empty search base
        with pytest.raises(AuthenticationException) as exc_info:
            _build_provider(config=tuple(bad_config))
        assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES["LDAP_NOT_CONFIGURED"]

    def test_success_with_valid_config(self):
        provider = _build_provider()
        assert provider.server_uri == "ldap://ldap.example.com"
        assert provider.username == "jdoe"


# ===========================================================================
# _get_ldap_connection tests
# ===========================================================================


@pytest.mark.unit
class TestGetLDAPConnection:
    """Test LDAP connection initialization."""

    def test_returns_connection_object(self):
        provider = _build_provider()
        mock_conn = MagicMock()
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            mock_ldap.initialize.return_value = mock_conn
            mock_ldap.OPT_REFERRALS = 0
            mock_ldap.OPT_NETWORK_TIMEOUT = 1
            mock_ldap.VERSION3 = 3
            conn = provider._get_ldap_connection()
        assert conn is mock_conn

    def test_starts_tls_when_enabled(self):
        tls_config = list(LDAP_CONFIG_DEFAULTS)
        tls_config[9] = "1"  # LDAP_USE_TLS
        provider = _build_provider(config=tuple(tls_config))
        mock_conn = MagicMock()
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            mock_ldap.initialize.return_value = mock_conn
            mock_ldap.OPT_REFERRALS = 0
            mock_ldap.OPT_NETWORK_TIMEOUT = 1
            mock_ldap.VERSION3 = 3
            provider._get_ldap_connection()
        mock_conn.start_tls_s.assert_called_once()

    def test_skips_tls_for_ldaps_uri(self):
        """TLS should not be started when using ldaps:// even if flag is on."""
        tls_config = list(LDAP_CONFIG_DEFAULTS)
        tls_config[1] = "ldaps://ldap.example.com"
        tls_config[9] = "1"
        provider = _build_provider(config=tuple(tls_config))
        mock_conn = MagicMock()
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            mock_ldap.initialize.return_value = mock_conn
            mock_ldap.OPT_REFERRALS = 0
            mock_ldap.OPT_NETWORK_TIMEOUT = 1
            mock_ldap.VERSION3 = 3
            provider._get_ldap_connection()
        mock_conn.start_tls_s.assert_not_called()

    def test_raises_on_server_down(self):
        provider = _build_provider()
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            import builtins

            # Create a real exception class for SERVER_DOWN
            server_down_exc = type("SERVER_DOWN", (Exception,), {})
            mock_ldap.SERVER_DOWN = server_down_exc
            mock_ldap.LDAPError = Exception
            mock_ldap.initialize.side_effect = server_down_exc("down")
            mock_ldap.OPT_REFERRALS = 0
            mock_ldap.OPT_NETWORK_TIMEOUT = 1
            mock_ldap.VERSION3 = 3
            with pytest.raises(AuthenticationException) as exc_info:
                provider._get_ldap_connection()
            assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES["LDAP_SERVER_UNREACHABLE"]


# ===========================================================================
# _search_user tests
# ===========================================================================


@pytest.mark.unit
class TestSearchUser:
    """Test user search via service-account bind."""

    def test_successful_search(self):
        provider = _build_provider()
        mock_conn = MagicMock()
        mock_conn.search_s.return_value = [SAMPLE_LDAP_ENTRY]
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            mock_ldap.SCOPE_SUBTREE = 2
            mock_ldap.filter.escape_filter_chars = lambda s: s
            mock_ldap.INVALID_CREDENTIALS = type("INVALID_CREDENTIALS", (Exception,), {})
            mock_ldap.LDAPError = Exception
            dn, attrs = provider._search_user(mock_conn)
        assert dn == SAMPLE_LDAP_ENTRY[0]
        assert attrs["mail"] == [b"jdoe@example.com"]

    def test_raises_on_invalid_bind_credentials(self):
        provider = _build_provider()
        mock_conn = MagicMock()
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            invalid_creds_exc = type("INVALID_CREDENTIALS", (Exception,), {})
            mock_ldap.INVALID_CREDENTIALS = invalid_creds_exc
            mock_ldap.LDAPError = Exception
            mock_conn.simple_bind_s.side_effect = invalid_creds_exc("bad creds")
            with pytest.raises(AuthenticationException) as exc_info:
                provider._search_user(mock_conn)
            assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES["LDAP_BIND_FAILED"]

    def test_raises_when_user_not_found(self):
        provider = _build_provider()
        mock_conn = MagicMock()
        mock_conn.search_s.return_value = []  # no results
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            mock_ldap.SCOPE_SUBTREE = 2
            mock_ldap.filter.escape_filter_chars = lambda s: s
            mock_ldap.INVALID_CREDENTIALS = type("INVALID_CREDENTIALS", (Exception,), {})
            mock_ldap.LDAPError = Exception
            with pytest.raises(AuthenticationException) as exc_info:
                provider._search_user(mock_conn)
            assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES["LDAP_USER_NOT_FOUND"]

    def test_filters_referral_entries(self):
        """Entries with None DN (referrals) should be skipped."""
        provider = _build_provider()
        mock_conn = MagicMock()
        mock_conn.search_s.return_value = [
            (None, {"ref": [b"ldap://other"]}),  # referral
            SAMPLE_LDAP_ENTRY,
        ]
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            mock_ldap.SCOPE_SUBTREE = 2
            mock_ldap.filter.escape_filter_chars = lambda s: s
            mock_ldap.INVALID_CREDENTIALS = type("INVALID_CREDENTIALS", (Exception,), {})
            mock_ldap.LDAPError = Exception
            dn, _ = provider._search_user(mock_conn)
        assert dn == SAMPLE_LDAP_ENTRY[0]

    def test_special_chars_in_username_are_escaped(self):
        """Verify filter.escape_filter_chars is called on the username."""
        provider = _build_provider(username="j*doe(test)")
        mock_conn = MagicMock()
        mock_conn.search_s.return_value = [SAMPLE_LDAP_ENTRY]
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            mock_ldap.SCOPE_SUBTREE = 2
            mock_ldap.filter.escape_filter_chars = MagicMock(return_value="j\\2adoe\\28test\\29")
            mock_ldap.INVALID_CREDENTIALS = type("INVALID_CREDENTIALS", (Exception,), {})
            mock_ldap.LDAPError = Exception
            provider._search_user(mock_conn)
        mock_ldap.filter.escape_filter_chars.assert_called_once_with("j*doe(test)")


# ===========================================================================
# _verify_user_password tests
# ===========================================================================


@pytest.mark.unit
class TestVerifyUserPassword:
    """Test user-bind password verification."""

    def test_success(self):
        provider = _build_provider()
        mock_conn = MagicMock()
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            mock_ldap.INVALID_CREDENTIALS = type("INVALID_CREDENTIALS", (Exception,), {})
            mock_ldap.LDAPError = Exception
            # Should not raise
            provider._verify_user_password(mock_conn, "cn=jdoe,ou=users,dc=example,dc=com")
        mock_conn.simple_bind_s.assert_called_once_with(
            "cn=jdoe,ou=users,dc=example,dc=com", "secret"
        )

    def test_wrong_password(self):
        provider = _build_provider()
        mock_conn = MagicMock()
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            invalid_creds_exc = type("INVALID_CREDENTIALS", (Exception,), {})
            mock_ldap.INVALID_CREDENTIALS = invalid_creds_exc
            mock_ldap.LDAPError = Exception
            mock_conn.simple_bind_s.side_effect = invalid_creds_exc("wrong pw")
            with pytest.raises(AuthenticationException) as exc_info:
                provider._verify_user_password(mock_conn, "cn=jdoe,ou=users,dc=example,dc=com")
            assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES["LDAP_AUTHENTICATION_FAILED"]


# ===========================================================================
# _get_attr_value tests
# ===========================================================================


@pytest.mark.unit
class TestGetAttrValue:
    """Test LDAP attribute extraction helper."""

    def test_returns_decoded_bytes(self):
        provider = _build_provider()
        assert provider._get_attr_value({"mail": [b"a@b.com"]}, "mail") == "a@b.com"

    def test_returns_string_value(self):
        provider = _build_provider()
        assert provider._get_attr_value({"mail": ["a@b.com"]}, "mail") == "a@b.com"

    def test_returns_default_when_key_missing(self):
        provider = _build_provider()
        assert provider._get_attr_value({}, "mail") == ""
        assert provider._get_attr_value({}, "mail", "fallback") == "fallback"

    def test_returns_default_when_values_empty(self):
        provider = _build_provider()
        assert provider._get_attr_value({"mail": []}, "mail") == ""


# ===========================================================================
# set_user_data (full flow) tests
# ===========================================================================


@pytest.mark.unit
class TestSetUserData:
    """Integration-style tests for the full set_user_data flow."""

    def _setup_mocks(self, mock_ldap, search_result=None, verify_raises=None):
        """Wire up mock ldap module for a complete flow."""
        mock_conn = MagicMock()
        mock_verify_conn = MagicMock()

        # Make initialize return different conns on successive calls
        mock_ldap.initialize.side_effect = [mock_conn, mock_verify_conn]
        mock_ldap.OPT_REFERRALS = 0
        mock_ldap.OPT_NETWORK_TIMEOUT = 1
        mock_ldap.VERSION3 = 3
        mock_ldap.SCOPE_SUBTREE = 2
        mock_ldap.filter.escape_filter_chars = lambda s: s

        invalid_creds_exc = type("INVALID_CREDENTIALS", (Exception,), {})
        mock_ldap.INVALID_CREDENTIALS = invalid_creds_exc
        mock_ldap.LDAPError = Exception
        mock_ldap.SERVER_DOWN = type("SERVER_DOWN", (Exception,), {})

        mock_conn.search_s.return_value = search_result or [SAMPLE_LDAP_ENTRY]

        if verify_raises:
            mock_verify_conn.simple_bind_s.side_effect = verify_raises

        return mock_conn, mock_verify_conn

    @patch("plane.authentication.adapter.base.Adapter.set_user_data")
    def test_successful_full_flow(self, mock_super_set, db):
        provider = _build_provider()
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            self._setup_mocks(mock_ldap)
            provider.set_user_data()
        mock_super_set.assert_called_once()
        call_data = mock_super_set.call_args[0][0]
        assert call_data["email"] == "jdoe@example.com"
        assert call_data["user"]["first_name"] == "John"
        assert call_data["user"]["last_name"] == "Doe"
        assert call_data["user"]["is_password_autoset"] is True

    @patch("plane.authentication.adapter.base.Adapter.set_user_data")
    def test_email_is_lowered_and_stripped(self, mock_super_set, db):
        entry = (
            "cn=jdoe,ou=users,dc=example,dc=com",
            {
                "mail": [b"  JDoe@Example.COM  "],
                "givenName": [b"John"],
                "sn": [b"Doe"],
            },
        )
        provider = _build_provider()
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            self._setup_mocks(mock_ldap, search_result=[entry])
            provider.set_user_data()
        call_data = mock_super_set.call_args[0][0]
        assert call_data["email"] == "jdoe@example.com"

    def test_raises_when_email_attr_empty(self, db):
        entry = (
            "cn=jdoe,ou=users,dc=example,dc=com",
            {
                "mail": [],
                "givenName": [b"John"],
                "sn": [b"Doe"],
            },
        )
        provider = _build_provider()
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            self._setup_mocks(mock_ldap, search_result=[entry])
            with pytest.raises(AuthenticationException) as exc_info:
                provider.set_user_data()
            assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES["LDAP_USER_NOT_FOUND"]

    def test_wrong_password_raises(self, db):
        provider = _build_provider()
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            invalid_creds_exc = type("INVALID_CREDENTIALS", (Exception,), {})
            mock_ldap.INVALID_CREDENTIALS = invalid_creds_exc
            self._setup_mocks(mock_ldap, verify_raises=invalid_creds_exc("bad"))
            with pytest.raises(AuthenticationException) as exc_info:
                provider.set_user_data()
            assert exc_info.value.error_code == AUTHENTICATION_ERROR_CODES["LDAP_AUTHENTICATION_FAILED"]

    def test_connections_are_unbound(self, db):
        """Both search and verify connections must be unbound."""
        provider = _build_provider()
        with patch(LDAP_MOD_PATCH) as mock_ldap:
            mock_conn, mock_verify_conn = self._setup_mocks(mock_ldap)
            with patch("plane.authentication.adapter.base.Adapter.set_user_data"):
                provider.set_user_data()
        mock_conn.unbind_s.assert_called_once()
        mock_verify_conn.unbind_s.assert_called_once()
