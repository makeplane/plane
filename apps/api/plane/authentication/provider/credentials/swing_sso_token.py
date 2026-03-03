# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
import os
from lxml import etree

# Third party imports
import requests

# Module imports
from plane.authentication.adapter.credential import CredentialAdapter
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.db.models import User
from plane.license.utils.instance_value import get_configuration_value

logger = logging.getLogger(__name__)


class SwingSSOTokenProvider(CredentialAdapter):
    """Validate a Swing SSO token (XML-based flow).

    Used when user clicks "Open Plane" from Swing portal — portal passes
    a pre-authenticated token which we validate via Swing's XML API.

    Flow: receive token + employee_no → POST XML to Swing token validation
    endpoint → parse RETURNVALUE → lookup Plane user → set session.
    """

    provider = "swing-sso"

    def __init__(self, request, token, employee_no, callback=None):
        super().__init__(request=request, provider=self.provider, callback=callback)

        if not token or not employee_no:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_INVALID_TOKEN"],
                error_message="SWING_SSO_INVALID_TOKEN",
            )

        self.token = token
        self.employee_no = employee_no
        self._load_config()

    def _load_config(self):
        """Load Swing SSO configuration from InstanceConfiguration."""
        (
            IS_SWING_SSO_ENABLED,
            SWING_SSO_URL,
            SWING_SSO_COMPANY_CODE,
        ) = get_configuration_value(
            [
                {"key": "IS_SWING_SSO_ENABLED", "default": os.environ.get("IS_SWING_SSO_ENABLED", "0")},
                {"key": "SWING_SSO_URL", "default": os.environ.get("SWING_SSO_URL", "")},
                {"key": "SWING_SSO_COMPANY_CODE", "default": os.environ.get("SWING_SSO_COMPANY_CODE", "sh")},
            ]
        )

        if IS_SWING_SSO_ENABLED != "1" or not SWING_SSO_URL:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_NOT_CONFIGURED"],
                error_message="SWING_SSO_NOT_CONFIGURED",
            )

        # Token validation uses a separate endpoint — derive from base URL
        # Base URL is the JSON login endpoint; token endpoint is typically
        # the legacy XML auth URL. Use SWING_SSO_TOKEN_URL env if set,
        # otherwise fall back to SWING_SSO_URL (admin can override).
        self.token_url = os.environ.get("SWING_SSO_TOKEN_URL", SWING_SSO_URL)
        self.company_code = SWING_SSO_COMPANY_CODE

    def _build_xml_request(self):
        """Build XML request for token validation.

        Format: <DATA><USERTOKEN>{token}</USERTOKEN><SERVICENAME>{name}</SERVICENAME></DATA>
        """
        root = etree.Element("DATA")
        etree.SubElement(root, "USERTOKEN").text = self.token
        etree.SubElement(root, "SERVICENAME").text = "PLANE"
        return etree.tostring(root, encoding="unicode", xml_declaration=True)

    def _validate_token(self):
        """POST XML to Swing token validation endpoint and return userId."""
        xml_payload = self._build_xml_request()

        try:
            response = requests.post(
                self.token_url,
                data=xml_payload.encode("utf-8"),
                headers={
                    "Content-Type": "text/xml",
                    "Accept-Charset": "UTF-8",
                },
                timeout=10,
            )
            response.raise_for_status()
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_SERVER_UNREACHABLE"],
                error_message="SWING_SSO_SERVER_UNREACHABLE",
            )
        except requests.exceptions.RequestException:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_SERVER_UNREACHABLE"],
                error_message="SWING_SSO_SERVER_UNREACHABLE",
            )

        # Parse XML response — extract RETURNVALUE
        try:
            parser = etree.XMLParser(resolve_entities=False, no_network=True)
            root = etree.fromstring(response.content, parser=parser)
            return_value = root.findtext("RETURNVALUE", default="")
        except etree.XMLSyntaxError:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_INVALID_TOKEN"],
                error_message="SWING_SSO_INVALID_TOKEN",
            )

        # Check for error codes in response
        error_codes = {
            "ACCOUNT_IS_NULL", "USERTOKEN_IS_NULL", "USER_TOKEN_NO_MATCH",
            "CONNECT_SERVER_IS_ACCESS_DENIED", "AUTHENTICATE_EXCEPTION",
        }
        if return_value in error_codes or not return_value:
            logger.warning("Swing token validation failed: %s", return_value)
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_INVALID_TOKEN"],
                error_message="SWING_SSO_INVALID_TOKEN",
            )

        return return_value

    def set_user_data(self):
        """Validate token via Swing XML API and lookup Plane user."""
        # Step 1: Validate token — returns userId on success
        validated_user_id = self._validate_token()
        logger.info("Swing token validated for user: %s", validated_user_id)

        # Step 1b: Verify token belongs to the claimed employee
        # RETURNVALUE from Swing should match the employee_no
        if validated_user_id != self.employee_no:
            logger.warning(
                "Swing token user mismatch: token=%s, claimed=%s",
                validated_user_id,
                self.employee_no,
            )
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_INVALID_TOKEN"],
                error_message="SWING_SSO_INVALID_TOKEN",
            )

        # Step 2: Lookup user in Plane DB
        email = f"sh{self.employee_no}@swing.shinhan.com"
        user = User.objects.filter(email=email).first()

        if not user:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["SWING_SSO_PLANE_USER_NOT_FOUND"],
                error_message="SWING_SSO_PLANE_USER_NOT_FOUND",
            )

        if not user.is_active:
            raise AuthenticationException(
                error_code=AUTHENTICATION_ERROR_CODES["USER_ACCOUNT_DEACTIVATED"],
                error_message="USER_ACCOUNT_DEACTIVATED",
            )

        # Step 3: Set user data for session creation
        super().set_user_data(
            {
                "email": email,
                "user": {
                    "avatar": user.avatar or "",
                    "first_name": user.first_name or "",
                    "last_name": user.last_name or "",
                    "provider_id": self.employee_no,
                    "is_password_autoset": True,
                },
            }
        )
