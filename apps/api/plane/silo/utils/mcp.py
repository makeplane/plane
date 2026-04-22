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
import logging
import secrets

# Django imports
from django.utils.text import slugify

# Module imports
from plane.silo.models import (
    MCPApplication,
    MCPApplicationOwner,
    MCPConnectionCredentials,
)
from plane.silo.services.mcp_connection import (
    encrypt_auth_config,
    is_token_expired,
    refresh_oauth_token,
)

logger = logging.getLogger("plane.silo.utils.mcp")


def generate_unique_slug(name):
    """Generate a unique slug for an MCP application from its name."""
    base_slug = slugify(name)[:40]
    slug = base_slug
    while MCPApplication.objects.filter(slug=slug).exists():
        suffix = secrets.token_hex(3)
        slug = f"{base_slug[:34]}-{suffix}"
    return slug


def check_mcp_app_owner(mcp_app, workspace, user):
    """Check if the user is the owner of the given MCP application in this workspace."""
    return MCPApplicationOwner.objects.filter(
        mcp_application=mcp_app,
        workspace=workspace,
        user=user,
    ).exists()


def build_mcp_serializer_context(mcp_app, workspace_id, user_id, owned_app_ids=None):
    """Build the serializer context with credentialed and owned app IDs."""
    has_credentials = MCPConnectionCredentials.objects.filter(
        mcp_application=mcp_app,
        workspace_id=workspace_id,
        user_id=user_id,
    ).exists()

    credentialed_app_ids = {mcp_app.id} if has_credentials else set()

    if owned_app_ids is None:
        owned_app_ids = {mcp_app.id}

    return {
        "credentialed_app_ids": credentialed_app_ids,
        "owned_app_ids": owned_app_ids,
        "workspace_id": workspace_id,
        "user_id": user_id,
    }


def save_credentials_and_activate(mcp_app, workspace_id, user_id, auth_config):
    """Create or update credentials and set the MCP app status to ACTIVE."""
    MCPConnectionCredentials.objects.update_or_create(
        mcp_application=mcp_app,
        workspace_id=workspace_id,
        user_id=user_id,
        defaults={"auth_config": auth_config},
    )
    mcp_app.status = MCPApplication.Status.ACTIVE
    mcp_app.save(update_fields=["status"])


def refresh_token_if_expired(credentials, decrypted_config, mcp_url, app_label):
    """
    Auto-refresh an expired OAuth access token (if a refresh_token exists).

    Mutates ``decrypted_config`` in place and persists the updated encrypted
    config to ``credentials``.  Returns the (possibly updated) config.
    """
    if not (is_token_expired(decrypted_config) and decrypted_config.get("refresh_token")):
        return decrypted_config

    try:
        refreshed = refresh_oauth_token(
            token_endpoint=decrypted_config["token_endpoint"],
            refresh_token=decrypted_config["refresh_token"],
            client_id=decrypted_config["client_id"],
            client_secret=decrypted_config.get("client_secret"),
            resource=mcp_url,
            token_endpoint_auth_method=decrypted_config.get(
                "token_endpoint_auth_method", "client_secret_post"
            ),
        )
        decrypted_config["access_token"] = refreshed["access_token"]
        decrypted_config["refresh_token"] = refreshed["refresh_token"]
        decrypted_config["expires_in"] = refreshed["expires_in"]
        decrypted_config["token_issued_at"] = refreshed["token_issued_at"]
        credentials.auth_config = encrypt_auth_config(decrypted_config)
        credentials.save(update_fields=["auth_config"])
        logger.info("Refreshed OAuth token for MCP app %s", app_label)
    except ValueError:
        logger.warning("OAuth token refresh failed for MCP app %s", app_label, exc_info=True)

    return decrypted_config
