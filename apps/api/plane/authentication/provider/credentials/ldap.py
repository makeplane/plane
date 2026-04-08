# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
import os

# Third party imports
import ldap
import ldap.filter

# Module imports
from plane.authentication.adapter.credential import CredentialAdapter
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.license.utils.instance_value import get_configuration_value

logger = logging.getLogger(__name__)


class LDAPProvider(CredentialAdapter):
    """LDAP/Active Directory authentication provider.

    Flow: get connection → service bind → search user → extract attrs
    → user bind to verify password → set session.
    """

    provider = "ldap"

    def __init__(self, request, username, password, callback=None):
        super().__init__(request=request, provider=self.provider, callback=callback)
        # Validate password is not empty and has no null bytes
        if not password or "\x00" in password:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_AUTHENTICATION_FAILED"],
                error_message="LDAP_AUTHENTICATION_FAILED",
            )
        self.username = username
        self.password = password
        self._load_config()

    def _load_config(self):
        """Load LDAP configuration from instance settings."""
        (
            IS_LDAP_ENABLED,
            LDAP_SERVER_URI,
            LDAP_BIND_DN,
            LDAP_BIND_PASSWORD,
            LDAP_USER_SEARCH_BASE,
            LDAP_USER_FILTER,
            LDAP_ATTR_EMAIL,
            LDAP_ATTR_FIRST_NAME,
            LDAP_ATTR_LAST_NAME,
            LDAP_USE_TLS,
        ) = get_configuration_value(
            [
                {"key": "IS_LDAP_ENABLED", "default": os.environ.get("IS_LDAP_ENABLED", "0")},
                {"key": "LDAP_SERVER_URI", "default": os.environ.get("LDAP_SERVER_URI", "")},
                {"key": "LDAP_BIND_DN", "default": os.environ.get("LDAP_BIND_DN", "")},
                {"key": "LDAP_BIND_PASSWORD", "default": os.environ.get("LDAP_BIND_PASSWORD", "")},
                {"key": "LDAP_USER_SEARCH_BASE", "default": os.environ.get("LDAP_USER_SEARCH_BASE", "")},
                {
                    "key": "LDAP_USER_FILTER",
                    "default": os.environ.get("LDAP_USER_FILTER", "(sAMAccountName=%(user)s)"),
                },
                {"key": "LDAP_ATTR_EMAIL", "default": os.environ.get("LDAP_ATTR_EMAIL", "mail")},
                {"key": "LDAP_ATTR_FIRST_NAME", "default": os.environ.get("LDAP_ATTR_FIRST_NAME", "givenName")},
                {"key": "LDAP_ATTR_LAST_NAME", "default": os.environ.get("LDAP_ATTR_LAST_NAME", "sn")},
                {"key": "LDAP_USE_TLS", "default": os.environ.get("LDAP_USE_TLS", "0")},
            ]
        )

        if IS_LDAP_ENABLED != "1" or not LDAP_SERVER_URI or not LDAP_BIND_DN or not LDAP_USER_SEARCH_BASE:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_NOT_CONFIGURED"],
                error_message="LDAP_NOT_CONFIGURED",
            )

        self.server_uri = LDAP_SERVER_URI
        self.bind_dn = LDAP_BIND_DN
        self.bind_password = LDAP_BIND_PASSWORD
        self.search_base = LDAP_USER_SEARCH_BASE
        self.user_filter = LDAP_USER_FILTER
        # Attribute names for user data extraction
        self.attr_email = LDAP_ATTR_EMAIL or "mail"
        self.attr_first_name = LDAP_ATTR_FIRST_NAME or "givenName"
        self.attr_last_name = LDAP_ATTR_LAST_NAME or "sn"
        self.use_tls = LDAP_USE_TLS == "1"

    def _get_ldap_connection(self):
        """Initialize and return an LDAP connection object (not yet bound)."""
        try:
            conn = ldap.initialize(self.server_uri)
            conn.set_option(ldap.OPT_REFERRALS, 0)
            conn.set_option(ldap.OPT_NETWORK_TIMEOUT, 10)
            conn.protocol_version = ldap.VERSION3
            if self.use_tls and not self.server_uri.startswith("ldaps://"):
                conn.start_tls_s()
            return conn
        except ldap.SERVER_DOWN:
            logger.warning("LDAP server is down: %s", self.server_uri)
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_SERVER_UNREACHABLE"],
                error_message="LDAP_SERVER_UNREACHABLE",
            )

    def _search_user(self, conn):
        """Bind with service account and search for user by username.

        Returns (dn, attrs) tuple for the found user entry.
        Filters out LDAP referral entries (None DN).
        """
        try:
            conn.simple_bind_s(self.bind_dn, self.bind_password)
        except ldap.INVALID_CREDENTIALS:
            logger.warning("LDAP service account bind failed")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_BIND_FAILED"],
                error_message="LDAP_BIND_FAILED",
            )
        except ldap.LDAPError:
            logger.warning("LDAP connection error during service bind")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_SERVER_UNREACHABLE"],
                error_message="LDAP_SERVER_UNREACHABLE",
            )

        # Escape user input to prevent LDAP injection
        safe_username = ldap.filter.escape_filter_chars(self.username)
        search_filter = self.user_filter.replace("%(user)s", safe_username)

        results = conn.search_s(
            self.search_base,
            ldap.SCOPE_SUBTREE,
            search_filter,
            [self.attr_email, self.attr_first_name, self.attr_last_name],
        )

        # Filter out referral entries (DN is None for referrals)
        entries = [(dn, attrs) for dn, attrs in results if dn is not None]

        if not entries:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_USER_NOT_FOUND"],
                error_message="LDAP_USER_NOT_FOUND",
            )

        return entries[0]

    def _verify_user_password(self, conn, dn):
        """Verify user password by binding with user DN and provided password."""
        try:
            conn.simple_bind_s(dn, self.password)
        except ldap.INVALID_CREDENTIALS:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_AUTHENTICATION_FAILED"],
                error_message="LDAP_AUTHENTICATION_FAILED",
            )
        except ldap.LDAPError:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_SERVER_UNREACHABLE"],
                error_message="LDAP_SERVER_UNREACHABLE",
            )

    def _get_attr_value(self, attrs, key, default=""):
        """Extract and decode a single LDAP attribute value.

        Handles both bytes (from python-ldap) and plain strings.
        Returns default when key is missing or has no values.
        """
        values = attrs.get(key, [])
        if not values:
            return default
        val = values[0]
        if isinstance(val, bytes):
            return val.decode("utf-8")
        return str(val)

    def set_user_data(self):
        """Full LDAP auth flow: search user → extract attrs → verify password → set session."""
        # Step 1–2: Service bind → search user, extract attributes
        conn = self._get_ldap_connection()
        try:
            dn, attrs = self._search_user(conn)
            email = self._get_attr_value(attrs, self.attr_email).lower().strip()
            if not email:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["LDAP_USER_NOT_FOUND"],
                    error_message="LDAP_USER_NOT_FOUND",
                )
            first_name = self._get_attr_value(attrs, self.attr_first_name)
            last_name = self._get_attr_value(attrs, self.attr_last_name)
        finally:
            conn.unbind_s()

        # Step 3: Verify user password via user bind
        verify_conn = self._get_ldap_connection()
        try:
            self._verify_user_password(verify_conn, dn)
        finally:
            verify_conn.unbind_s()

        # Step 4: Set user session data
        super().set_user_data(
            {
                "email": email,
                "user": {
                    "avatar": "",
                    "first_name": first_name,
                    "last_name": last_name,
                    "provider_id": "",
                    "is_password_autoset": True,
                },
            }
        )
