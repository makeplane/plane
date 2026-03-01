# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import os
import ldap
import logging
from typing import Optional, Callable


# Module imports
from plane.authentication.adapter.credential import CredentialAdapter
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.license.utils.instance_value import get_configuration_value
from plane.utils.exception_logger import log_exception


logger = logging.getLogger("plane.authentication")


class LDAPProvider(CredentialAdapter):
    provider = "ldap"

    def __init__(
        self,
        request,
        key: Optional[str] = None,
        code: Optional[str] = None,
        is_signup: Optional[bool] = False,
        callback: Optional[Callable] = None,
        invitation_id: Optional[str] = None,
    ):
        super().__init__(request=request, provider=self.provider, callback=callback)
        self.key = key
        self.code = code
        self.is_signup = is_signup

        # Get LDAP configuration
        (
            LDAP_SERVER_URI,
            LDAP_BIND_DN,
            LDAP_BIND_PASSWORD,
            LDAP_USER_SEARCH_BASE,
            LDAP_USER_SEARCH_FILTER,
            LDAP_USER_ATTRIBUTES,
        ) = get_configuration_value(
            [
                {
                    "key": "LDAP_SERVER_URI",
                    "default": os.environ.get("LDAP_SERVER_URI"),
                },
                {
                    "key": "LDAP_BIND_DN",
                    "default": os.environ.get("LDAP_BIND_DN"),
                },
                {
                    "key": "LDAP_BIND_PASSWORD",
                    "default": os.environ.get("LDAP_BIND_PASSWORD"),
                },
                {
                    "key": "LDAP_USER_SEARCH_BASE",
                    "default": os.environ.get("LDAP_USER_SEARCH_BASE"),
                },
                {
                    "key": "LDAP_USER_SEARCH_FILTER",
                    "default": os.environ.get("LDAP_USER_SEARCH_FILTER", "(uid={username})"),
                },
                {
                    "key": "LDAP_USER_ATTRIBUTES",
                    "default": os.environ.get("LDAP_USER_ATTRIBUTES", "mail,cn,givenName,sn"),
                },
            ]
        )

        # Check if LDAP is configured
        if not (LDAP_SERVER_URI and LDAP_BIND_DN and LDAP_BIND_PASSWORD and LDAP_USER_SEARCH_BASE):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_NOT_CONFIGURED"],
                error_message="LDAP_NOT_CONFIGURED",
            )

        self.ldap_server_uri = LDAP_SERVER_URI
        self.ldap_bind_dn = LDAP_BIND_DN
        self.ldap_bind_password = LDAP_BIND_PASSWORD
        self.ldap_user_search_base = LDAP_USER_SEARCH_BASE
        self.ldap_user_search_filter = LDAP_USER_SEARCH_FILTER
        self.ldap_user_attributes = LDAP_USER_ATTRIBUTES.split(",")

        self.exception_payload = {
            "username": self.key,
        }
        if invitation_id:
            self.exception_payload["invitation_id"] = invitation_id

    def _connect_to_ldap(self):
        """Establish connection to LDAP server"""
        try:
            # Set global options before initialization
            ldap.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, ldap.OPT_X_TLS_NEVER)
            ldap.set_option(ldap.OPT_REFERRALS, 0)

            # Initialize LDAP connection
            conn = ldap.initialize(self.ldap_server_uri)
            conn.set_option(ldap.OPT_PROTOCOL_VERSION, 3)
            conn.set_option(ldap.OPT_REFERRALS, 0)
            conn.set_option(ldap.OPT_NETWORK_TIMEOUT, 10.0)
            conn.simple_bind_s(self.ldap_bind_dn, self.ldap_bind_password)
            return conn
        except ldap.INVALID_CREDENTIALS:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_BIND_FAILED"],
                error_message="LDAP_BIND_FAILED",
                payload=self.exception_payload,
            )
        except ldap.SERVER_DOWN:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_SERVER_DOWN"],
                error_message="LDAP_SERVER_DOWN",
                payload=self.exception_payload,
            )
        except Exception:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_CONNECTION_ERROR"],
                error_message="LDAP_CONNECTION_ERROR",
                payload=self.exception_payload,
            )

    def _search_user(self, conn, username):
        """Search for user in LDAP directory"""
        try:
            search_filter = self.ldap_user_search_filter.format(username=username)

            # Validate that search filter is not empty
            if not search_filter or not search_filter.strip():
                logger.error(
                    "LDAP search filter is empty. Please set LDAP_USER_SEARCH_FILTER (e.g., '(cn={username})' for Authentik or '(uid={username})' for OpenLDAP)"  # noqa: E501
                )
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["LDAP_SEARCH_ERROR"],
                    error_message="LDAP_SEARCH_ERROR",
                    payload=self.exception_payload,
                )

            logger.info(
                f"LDAP Search - Base: {self.ldap_user_search_base}, Filter: {search_filter}, Attrs: {self.ldap_user_attributes}"  # noqa: E501
            )

            # Use search_ext_s with explicit parameters for better compatibility
            result = conn.search_ext_s(
                self.ldap_user_search_base,
                ldap.SCOPE_SUBTREE,
                search_filter,
                self.ldap_user_attributes,
                sizelimit=1,
            )

            # Filter out referrals (entries with None as attributes)
            result = [(dn, attrs) for dn, attrs in result if attrs is not None]

            if not result:
                return None

            return result[0]  # Return first match (dn, attributes)
        except ldap.OPERATIONS_ERROR as e:
            logger.error(
                f"LDAP OPERATIONS_ERROR - This often means the bind user lacks search permissions or the search base is incorrect. Error: {e}"  # noqa: E501
            )
            log_exception(e)
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_SEARCH_ERROR"],
                error_message="LDAP_SEARCH_ERROR",
                payload=self.exception_payload,
            )
        except Exception as e:
            log_exception(e)
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["LDAP_SEARCH_ERROR"],
                error_message="LDAP_SEARCH_ERROR",
                payload=self.exception_payload,
            )

    def _extract_user_attributes(self, ldap_attrs):
        """Extract user attributes from LDAP response"""
        email = ""
        first_name = ""
        last_name = ""

        # Extract email
        if "mail" in ldap_attrs:
            email = ldap_attrs["mail"][0].decode("utf-8")
        elif "userPrincipalName" in ldap_attrs:
            email = ldap_attrs["userPrincipalName"][0].decode("utf-8")

        # Extract first name
        if "givenName" in ldap_attrs:
            first_name = ldap_attrs["givenName"][0].decode("utf-8")
        elif "cn" in ldap_attrs:
            # Try to extract first name from cn
            cn = ldap_attrs["cn"][0].decode("utf-8")
            name_parts = cn.split()
            if name_parts:
                first_name = name_parts[0]

        # Extract last name
        if "sn" in ldap_attrs:
            last_name = ldap_attrs["sn"][0].decode("utf-8")
        elif "cn" in ldap_attrs:
            # Try to extract last name from cn
            cn = ldap_attrs["cn"][0].decode("utf-8")
            name_parts = cn.split()
            if len(name_parts) > 1:
                last_name = name_parts[-1]

        return email, first_name, last_name

    def _authenticate_user(self, conn, user_dn, password):
        """Authenticate user in LDAP"""
        try:
            conn.simple_bind_s(user_dn, password)
            return True
        except ldap.INVALID_CREDENTIALS:
            return False
        except ldap.SERVER_DOWN:
            return False
        except Exception:
            return False

    def set_user_data(self):
        # Connect to LDAP
        conn = self._connect_to_ldap()

        try:
            # Search for user
            user_result = self._search_user(conn, self.key)
            if not user_result:
                raise AuthenticationException(
                    error_message="LDAP_USER_NOT_FOUND",
                    error_code=AUTHENTICATION_ERROR_CODES["LDAP_USER_NOT_FOUND"],
                    payload=self.exception_payload,
                )

            user_dn, ldap_attrs = user_result

            # Authenticate user
            if not self._authenticate_user(conn, user_dn, self.code):
                raise AuthenticationException(
                    error_message="LDAP_AUTHENTICATION_FAILED",
                    error_code=AUTHENTICATION_ERROR_CODES["LDAP_AUTHENTICATION_FAILED"],
                    payload=self.exception_payload,
                )

            # Extract user attributes
            email, first_name, last_name = self._extract_user_attributes(ldap_attrs)

            if not email:
                raise AuthenticationException(
                    error_message="LDAP_NO_EMAIL_FOUND",
                    error_code=AUTHENTICATION_ERROR_CODES["LDAP_NO_EMAIL_FOUND"],
                    payload=self.exception_payload,
                )

            super().set_user_data(
                {
                    "email": email,
                    "user": {
                        "avatar": "",
                        "first_name": first_name,
                        "last_name": last_name,
                        "provider_id": user_dn,
                        "is_password_autoset": True,  # LDAP users don't use local passwords
                    },
                }
            )
            return

        finally:
            conn.unbind_s()
