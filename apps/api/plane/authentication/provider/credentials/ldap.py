# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
import os

# Third party imports
import ldap3
from ldap3.utils.conv import escape_filter_chars

# Module imports
from plane.authentication.adapter.credential import CredentialAdapter
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.db.models import User
from plane.license.utils.instance_value import get_configuration_value

logger = logging.getLogger(__name__)


class LDAPProvider(CredentialAdapter):
    """LDAP/Active Directory authentication provider.

    Flow: service bind → search user by sAMAccountName → user bind to verify password
    → lookup Plane user by staff_id email pattern → set session.
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
            LDAP_USE_TLS,
        ) = get_configuration_value(
            [
                {"key": "IS_LDAP_ENABLED", "default": os.environ.get("IS_LDAP_ENABLED", "0")},
                {"key": "LDAP_SERVER_URI", "default": os.environ.get("LDAP_SERVER_URI", "")},
                {"key": "LDAP_BIND_DN", "default": os.environ.get("LDAP_BIND_DN", "")},
                {"key": "LDAP_BIND_PASSWORD", "default": os.environ.get("LDAP_BIND_PASSWORD", "")},
                {"key": "LDAP_USER_SEARCH_BASE", "default": os.environ.get("LDAP_USER_SEARCH_BASE", "")},
                {"key": "LDAP_USER_FILTER", "default": os.environ.get("LDAP_USER_FILTER", "(sAMAccountName=%(user)s)")},
                {"key": "LDAP_USE_TLS", "default": os.environ.get("LDAP_USE_TLS", "0")},
            ]
        )

        if IS_LDAP_ENABLED != "1":
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_NOT_CONFIGURED"],
                error_message="LDAP_NOT_CONFIGURED",
            )

        self.server_uri = LDAP_SERVER_URI
        self.bind_dn = LDAP_BIND_DN
        self.bind_password = LDAP_BIND_PASSWORD
        self.search_base = LDAP_USER_SEARCH_BASE
        self.user_filter = LDAP_USER_FILTER
        self.use_tls = LDAP_USE_TLS == "1"

    def _get_server(self):
        """Create ldap3 Server object with TLS support."""
        use_ssl = self.server_uri.startswith("ldaps://")
        tls = ldap3.Tls() if (use_ssl or self.use_tls) else None
        return ldap3.Server(self.server_uri, use_ssl=use_ssl, tls=tls, connect_timeout=10)

    def _search_user(self):
        """Bind with service account and search for user by sAMAccountName.

        Returns the user's DN if found, raises AuthenticationException otherwise.
        Uses context manager to prevent connection leaks.
        """
        server = self._get_server()
        try:
            with ldap3.Connection(
                server,
                user=self.bind_dn,
                password=self.bind_password,
                auto_bind=True,
                receive_timeout=10,
            ) as conn:
                # Upgrade to TLS if configured and not already SSL
                if self.use_tls and not server.ssl:
                    try:
                        conn.start_tls()
                    except ldap3.core.exceptions.LDAPException:
                        raise AuthenticationException(
                            error_code=AUTHENTICATION_ERROR_CODES["LDAP_SERVER_UNREACHABLE"],
                            error_message="LDAP_SERVER_UNREACHABLE",
                        )

                # Escape user input to prevent LDAP injection
                safe_username = escape_filter_chars(self.username)
                search_filter = self.user_filter.replace("%(user)s", safe_username)

                conn.search(
                    search_base=self.search_base,
                    search_filter=search_filter,
                    search_scope=ldap3.SUBTREE,
                    attributes=[],
                )

                if not conn.entries:
                    raise AuthenticationException(
                        error_code=AUTHENTICATION_ERROR_CODES["LDAP_USER_NOT_FOUND"],
                        error_message="LDAP_USER_NOT_FOUND",
                    )

                return conn.entries[0].entry_dn

        except AuthenticationException:
            raise
        except ldap3.core.exceptions.LDAPBindError:
            logger.warning("LDAP service account bind failed")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_BIND_FAILED"],
                error_message="LDAP_BIND_FAILED",
            )
        except ldap3.core.exceptions.LDAPException:
            logger.warning("LDAP server connection error")
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_SERVER_UNREACHABLE"],
                error_message="LDAP_SERVER_UNREACHABLE",
            )

    def _verify_password(self, user_dn):
        """Verify user password by binding with user DN + password.

        Uses context manager to prevent connection leaks.
        """
        server = self._get_server()
        try:
            with ldap3.Connection(
                server,
                user=user_dn,
                password=self.password,
                auto_bind=True,
                receive_timeout=10,
            ) as conn:
                pass  # Successful bind = password verified
        except ldap3.core.exceptions.LDAPBindError:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_AUTHENTICATION_FAILED"],
                error_message="LDAP_AUTHENTICATION_FAILED",
            )
        except ldap3.core.exceptions.LDAPException:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_SERVER_UNREACHABLE"],
                error_message="LDAP_SERVER_UNREACHABLE",
            )

    def set_user_data(self):
        """Full LDAP auth flow: search user → verify password → find Plane user."""
        # Step 1-2: Service bind + search user in AD
        user_dn = self._search_user()

        # Step 3: Verify user password via user bind
        self._verify_password(user_dn)

        # Step 4: Look up Plane user by staff_id email pattern
        email = f"sh{self.username}@swing.shinhan.com"
        user = User.objects.filter(email=email).first()

        if not user:
            logger.warning("LDAP auth: Plane user not found for staff_id %s", self.username)
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_PLANE_USER_NOT_FOUND"],
                error_message="LDAP_PLANE_USER_NOT_FOUND",
            )

        super().set_user_data(
            {
                "email": email,
                "user": {
                    "avatar": "",
                    "first_name": user.first_name or "",
                    "last_name": user.last_name or "",
                    "provider_id": "",
                    "is_password_autoset": True,
                },
            }
        )
