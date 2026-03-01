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

import base64
import json
import logging
from datetime import timedelta
from urllib.parse import urlencode

from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory
from django.utils import timezone

from plane.authentication.models import AccessToken
from plane.authentication.views.oauth.auth import OAuthTokenEndpoint
from plane.ee.models.workspace import WorkspaceConnection
from plane.silo.models import ApplicationSecret
from plane.utils.encryption import decrypt

logger = logging.getLogger(__name__)


def generate_token_for_workspace_and_app(workspace_id: str, app_slug: str) -> str | None:
    """
    Get or generate an OAuth access token for a workspace app installation.

    First checks for an existing valid token (expires > 1 hour from now).
    If not found, generates a new token using client credentials.

    Args:
        workspace_id: The ID of the workspace.
        app_slug: The application slug (e.g., "runner").

    Returns:
        The access token string if successful, None if workspace connection not found
        or credentials are missing.
    """
    workspace_connection = WorkspaceConnection.objects.filter(
        workspace_id=workspace_id, connection_type=app_slug
    ).first()
    if not workspace_connection:
        return None

    app_installation_id = workspace_connection.connection_id

    # Check for existing valid token (expires > 1 hour from now)
    min_expiry = timezone.now() + timedelta(hours=1)
    existing_token = AccessToken.objects.filter(
        workspace_id=workspace_id,
        workspace_app_installation_id=app_installation_id,
        expires__gt=min_expiry,
    ).first()

    if existing_token:
        return existing_token.token

    # No valid token found, generate a new one
    application_key_pattern = f"x-{app_slug}-*"

    client_id: str | None = None
    client_secret: str | None = None

    # Get client credentials from application secrets
    app_secrets = ApplicationSecret.objects.filter(key__regex=application_key_pattern)
    for secret in app_secrets:
        if secret.key.endswith("client_id"):
            client_id = secret.value
        elif secret.key.endswith("client_secret"):
            client_secret = secret.value
            if client_secret and secret.is_secured:
                # Parse the encrypted format: iv:ciphertext:tag
                iv, ciphertext, tag = client_secret.split(":")
                client_secret = decrypt({"iv": iv, "ciphertext": ciphertext, "tag": tag})

    if not client_id or not client_secret:
        logger.error(f"Missing client credentials for app: {app_slug}")
        return None

    token_response = generate_bot_token(client_id, client_secret, app_installation_id)
    return token_response.get("access_token")


def generate_bot_token(client_id: str, client_secret: str, app_installation_id: str) -> dict:
    """
    Generate an OAuth bot token using client credentials grant.

    Args:
        client_id: The OAuth application client ID.
        client_secret: The OAuth application client secret.
        app_installation_id: The workspace app installation ID.

    Returns:
        Token response dict containing access_token, expires_in, token_type, and scope.
    """
    # Create Basic Auth header
    credentials = f"{client_id}:{client_secret}"
    basic_auth_token = base64.b64encode(credentials.encode()).decode()

    # Create a mock POST request with form data and headers
    factory = RequestFactory()
    form_data = urlencode(
        {
            "grant_type": "client_credentials",
            "app_installation_id": app_installation_id,
        }
    )
    request = factory.post(
        "/o/token/",
        data=form_data,
        content_type="application/x-www-form-urlencoded",
        HTTP_AUTHORIZATION=f"Basic {basic_auth_token}",
        HTTP_CACHE_CONTROL="no-cache",
    )
    request.user = AnonymousUser()

    # Use DOT's internal OAuthLib logic
    view = OAuthTokenEndpoint.as_view()
    response = view(request)

    return json.loads(response.content)
