# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
OAuth2 authentication helper for Microsoft 365 IMAP access.

Uses MSAL (Microsoft Authentication Library) client credentials flow
to obtain an access token, then constructs the XOAUTH2 SASL string
that imaplib.authenticate() expects.

Azure App Registration requirements:
  - API Permission: https://outlook.office365.com/IMAP.AccessAsApp (Application)
  - Admin consent granted
  - Service principal registered in Exchange Online with FullAccess on the target mailbox
"""

import base64
import logging
import os

import msal

logger = logging.getLogger("plane")

# Module-level token cache so the MSAL ConfidentialClientApplication
# can reuse tokens within the same process (Celery worker / management command).
_token_cache = msal.TokenCache()


def _get_oauth_config():
    """Read OAuth configuration from environment variables."""
    tenant_id = os.environ.get("MS_OAUTH_TENANT_ID")
    client_id = os.environ.get("MS_OAUTH_CLIENT_ID")
    client_secret = os.environ.get("MS_OAUTH_CLIENT_SECRET")
    return tenant_id, client_id, client_secret


def get_oauth2_access_token():
    """
    Obtain an OAuth2 access token for IMAP via client credentials flow.

    Returns:
        str: The access token, or None if unavailable.
    """
    tenant_id, client_id, client_secret = _get_oauth_config()

    if not all([tenant_id, client_id, client_secret]):
        logger.warning(
            "MS OAuth config incomplete. Set MS_OAUTH_TENANT_ID, "
            "MS_OAUTH_CLIENT_ID, MS_OAUTH_CLIENT_SECRET."
        )
        return None

    authority = f"https://login.microsoftonline.com/{tenant_id}"
    scopes = ["https://outlook.office365.com/.default"]

    app = msal.ConfidentialClientApplication(
        client_id,
        authority=authority,
        client_credential=client_secret,
        token_cache=_token_cache,
    )

    # Try to get a cached token first
    result = app.acquire_token_silent(scopes, account=None)
    if not result:
        logger.debug("No cached OAuth token, acquiring new one")
        result = app.acquire_token_for_client(scopes=scopes)

    if "access_token" in result:
        logger.info("OAuth2 access token acquired successfully")
        return result["access_token"]

    error = result.get("error", "unknown")
    error_desc = result.get("error_description", "no description")
    logger.error("OAuth2 token acquisition failed: %s — %s", error, error_desc)
    return None


def build_xoauth2_string(user_email, access_token):
    """
    Build the XOAUTH2 SASL authentication string.

    Format: user=<email>\\x01auth=Bearer <token>\\x01\\x01
    """
    auth_string = f"user={user_email}\x01auth=Bearer {access_token}\x01\x01"
    return auth_string


def imap_oauth2_login(mail, user_email):
    """
    Authenticate an IMAP4_SSL connection using XOAUTH2.

    Args:
        mail: An imaplib.IMAP4_SSL connection (already connected, not yet logged in).
        user_email: The email address to authenticate as.

    Returns:
        bool: True if authentication succeeded, False otherwise.

    Raises:
        RuntimeError: If OAuth config is missing or token cannot be acquired.
    """
    access_token = get_oauth2_access_token()
    if not access_token:
        raise RuntimeError(
            "Cannot acquire OAuth2 token. Check MS_OAUTH_TENANT_ID, "
            "MS_OAUTH_CLIENT_ID, MS_OAUTH_CLIENT_SECRET environment variables."
        )

    auth_string = build_xoauth2_string(user_email, access_token)

    # imaplib.authenticate() expects a callable that returns bytes
    mail.authenticate("XOAUTH2", lambda _: auth_string.encode("utf-8"))
    logger.info("IMAP XOAUTH2 authentication successful for %s", user_email)
    return True
