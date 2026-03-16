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
import time

# Django imports
from django.conf import settings

# Third party imports
from celery import shared_task

# Module imports
from plane.authentication.models import GroupSyncConfig
from plane.authentication.group_sync.service import GroupSyncService
from plane.authentication.group_sync.providers.registry import GroupProviderRegistry
from plane.db.models import WorkspaceMember
from plane.utils.exception_logger import log_exception


logger = logging.getLogger("plane.worker")


# Rate limiting: delay between IdP API calls to avoid hitting rate limits
# Can be configured via settings, defaults to 0.5 seconds
def _get_rate_limit_delay() -> float:
    """Get rate limit delay, handling string values from environment variables."""
    value = getattr(settings, "IDP_SYNC_RATE_LIMIT_DELAY", 0.5)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.5


IDP_SYNC_RATE_LIMIT_DELAY = _get_rate_limit_delay()


@shared_task
def sync_idp_groups_offline():
    """Periodic task to sync IdP groups for all enabled workspaces (OIDC, LDAP)."""
    try:
        # Get all enabled group sync configs
        configs = GroupSyncConfig.objects.filter(is_enabled=True, sync_offline=True)
        for config in configs:
            sync_workspace_groups(config)

    except Exception as e:
        log_exception(e)
        raise


def _detect_provider_type_self_managed() -> str:
    """
    Detect which SSO provider is enabled at instance level (self-managed).

    Uses the IS_*_ENABLED flags from instance configuration.
    """
    import os
    from plane.license.utils.instance_value import get_configuration_value

    (IS_OIDC_ENABLED, IS_SAML_ENABLED, IS_LDAP_ENABLED) = get_configuration_value(
        [
            {"key": "IS_OIDC_ENABLED", "default": os.environ.get("IS_OIDC_ENABLED", "0")},
            {"key": "IS_SAML_ENABLED", "default": os.environ.get("IS_SAML_ENABLED", "0")},
            {"key": "IS_LDAP_ENABLED", "default": os.environ.get("IS_LDAP_ENABLED", "0")},
        ]
    )

    if IS_LDAP_ENABLED == "1":
        return "ldap"
    if IS_SAML_ENABLED == "1":
        return "saml"
    if IS_OIDC_ENABLED == "1":
        return "oidc"

    return "oidc"


def _detect_provider_type_cloud(workspace_id) -> str:
    """
    Detect which SSO provider is configured for a workspace (cloud).

    Cloud instances store per-workspace SSO config in the IdentityProvider model.
    """
    from plane.authentication.models.sso import IdentityProvider

    idp = IdentityProvider.objects.filter(
        workspace_id=workspace_id,
        is_enabled=True,
    ).first()

    if idp:
        if idp.provider == IdentityProvider.OIDC:
            return "oidc"
        elif idp.provider == IdentityProvider.SAML:
            return "saml"

    return "oidc"


def sync_workspace_groups(config: GroupSyncConfig):
    """Sync groups for all users in a workspace."""
    workspace_id = config.workspace_id
    is_cloud = not settings.IS_SELF_MANAGED

    # Detect which provider type is active
    if is_cloud:
        provider_type = _detect_provider_type_cloud(workspace_id)
    else:
        provider_type = _detect_provider_type_self_managed()

    # Get the appropriate provider from the registry
    provider = GroupProviderRegistry.get_provider(provider_type, is_cloud=is_cloud)
    if not provider:
        logger.warning(
            "No group provider found for type '%s'",
            provider_type,
            extra={"workspace_id": str(workspace_id)},
        )
        return

    # Skip workspaces using providers that don't support offline sync (e.g., SAML)
    if not provider.can_fetch_groups_offline():
        logger.debug(
            "Provider '%s' does not support offline group fetching, skipping",
            provider_type,
            extra={"workspace_id": str(workspace_id)},
        )
        return

    # Initialize the group sync service
    sync_service = GroupSyncService()

    # Get active workspace members
    members = WorkspaceMember.objects.filter(workspace_id=workspace_id, is_active=True)

    for member in members:
        try:
            # Fetch groups offline
            groups = provider.fetch_groups_offline(user_id=member.member_id, workspace_id=workspace_id)

            if groups is None:
                logger.warning("Could not fetch groups for user %s", member.member_id)
                continue

            # Sync memberships
            result = sync_service.sync_user_memberships(
                user_id=member.member_id, workspace_id=workspace_id, groups=groups
            )

            logger.info("Synced user %s: %s", member.member_id, result)

        except Exception as e:
            logger.error("Failed to sync user %s: %s", member.member_id, e)
            continue
        finally:
            # Rate limiting: pause between users to avoid hitting IdP rate limits
            if IDP_SYNC_RATE_LIMIT_DELAY > 0:
                time.sleep(IDP_SYNC_RATE_LIMIT_DELAY)
