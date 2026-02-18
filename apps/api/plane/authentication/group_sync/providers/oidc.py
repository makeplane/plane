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

import logging
import os
from typing import Optional
from uuid import UUID

import requests
from django.utils import timezone

from plane.authentication.models import IdentityProvider
from plane.db.models import Account
from plane.license.utils.instance_value import get_configuration_value

from .base import BaseGroupProvider


logger = logging.getLogger("plane.authentication")


class OIDCGroupProvider(BaseGroupProvider):
    """
    Group provider for OIDC identity providers (self-hosted).

    Extracts groups from the OIDC userinfo response or ID token claims.
    Uses instance-level OIDC configuration from environment variables.
    """

    @property
    def provider_type(self) -> str:
        return "oidc"

    def extract_groups(
        self,
        auth_response: dict,
        group_attribute_key: str,
    ) -> list[str]:
        """
        Extract groups from OIDC userinfo response.

        Args:
            auth_response: The userinfo response from the OIDC provider
            group_attribute_key: The claim name for groups (e.g., 'groups', 'roles')

        Returns:
            List of group names
        """
        groups = auth_response.get(group_attribute_key, [])

        # Handle case where groups might be a string (single group)
        if isinstance(groups, str):
            groups = [groups]

        # Ensure all groups are strings
        return [str(g) for g in groups if g]

    def can_fetch_groups_offline(self) -> bool:
        """OIDC can fetch groups offline if user has a valid refresh token."""
        return True

    def _get_provider_settings(self) -> dict:
        """Get OIDC settings from instance configuration (self-hosted)."""
        (
            OIDC_CLIENT_ID,
            OIDC_CLIENT_SECRET,
            OIDC_TOKEN_URL,
            OIDC_USERINFO_URL,
        ) = get_configuration_value(
            [
                {"key": "OIDC_CLIENT_ID", "default": os.environ.get("OIDC_CLIENT_ID")},
                {"key": "OIDC_CLIENT_SECRET", "default": os.environ.get("OIDC_CLIENT_SECRET")},
                {"key": "OIDC_TOKEN_URL", "default": os.environ.get("OIDC_TOKEN_URL")},
                {"key": "OIDC_USERINFO_URL", "default": os.environ.get("OIDC_USERINFO_URL")},
            ]
        )

        return {
            "client_id": OIDC_CLIENT_ID,
            "client_secret": OIDC_CLIENT_SECRET,
            "token_url": OIDC_TOKEN_URL,
            "userinfo_url": OIDC_USERINFO_URL,
        }

    def fetch_groups_offline(
        self,
        user_id: UUID,
        workspace_id: UUID,
    ) -> Optional[list[str]]:
        """
        Fetch groups for a user using their stored refresh token (self-hosted).

        Args:
            user_id: The Plane user ID
            workspace_id: The workspace ID

        Returns:
            List of group names, or None if fetching failed
        """
        try:
            # Get instance-level OIDC settings
            settings = self._get_provider_settings()
            if not settings.get("token_url") or not settings.get("userinfo_url"):
                logger.debug("OIDC not configured at instance level")
                return None

            # Get the user's OIDC account with refresh token
            account = Account.objects.filter(
                user_id=user_id,
                provider="oidc",
                refresh_token__isnull=False,
            ).first()

            if not account or not account.refresh_token:
                logger.debug(
                    "No OIDC account with refresh token found",
                    extra={"user_id": str(user_id)},
                )
                return None

            # Refresh the access token
            token_response = self._refresh_access_token(account, settings)
            if not token_response:
                return None

            # Fetch userinfo with new access token
            access_token = token_response.get("access_token")
            userinfo = self._fetch_userinfo(access_token, settings["userinfo_url"])
            if not userinfo:
                return None

            # Get group attribute key from config
            from plane.authentication.models import GroupSyncConfig

            config = GroupSyncConfig.objects.filter(
                workspace_id=workspace_id,
                is_enabled=True,
            ).first()

            group_attribute_key = config.group_attribute_key if config else "groups"

            return self.extract_groups(userinfo, group_attribute_key)

        except Exception as e:
            logger.warning(
                "Failed to fetch groups offline for OIDC",
                extra={
                    "user_id": str(user_id),
                    "workspace_id": str(workspace_id),
                    "error": str(e),
                },
            )
            return None

    def _refresh_access_token(
        self,
        account: Account,
        settings: dict,
    ) -> Optional[dict]:
        """Refresh the access token using the refresh token."""
        # Check if refresh token is known to be expired
        if account.refresh_token_expired_at and account.refresh_token_expired_at < timezone.now():
            logger.debug(
                "Refresh token expired, user needs to re-authenticate",
                extra={"user_id": str(account.user_id)},
            )
            return None

        try:
            response = requests.post(
                settings["token_url"],
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": account.refresh_token,
                    "client_id": settings["client_id"],
                    "client_secret": settings["client_secret"],
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                verify=os.environ.get("SSL_VERIFY", "1") == "1",
                timeout=10,
            )
            response.raise_for_status()
            token_data = response.json()

            # Update stored tokens
            account.access_token = token_data.get("access_token")
            if token_data.get("refresh_token"):
                account.refresh_token = token_data.get("refresh_token")
            account.save()

            return token_data

        except requests.RequestException as e:
            # Check if the refresh token is invalid (401/403 response)
            if hasattr(e, "response") and e.response is not None:
                if e.response.status_code in (400, 401, 403):
                    logger.warning(
                        "Refresh token invalid or revoked, clearing token - user needs to re-authenticate",
                        extra={"user_id": str(account.user_id), "status_code": e.response.status_code},
                    )
                    # Clear the invalid refresh token so we don't keep retrying
                    account.refresh_token = None
                    account.save(update_fields=["refresh_token", "updated_at"])
                    return None

            logger.warning(
                "Failed to refresh OIDC access token",
                extra={"user_id": str(account.user_id), "error": str(e)},
            )
            return None

    def _fetch_userinfo(
        self,
        access_token: str,
        userinfo_url: str,
    ) -> Optional[dict]:
        """Fetch userinfo from the OIDC provider."""
        try:
            response = requests.get(
                userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"},
                verify=os.environ.get("SSL_VERIFY", "1") == "1",
                timeout=10,
            )
            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            logger.warning(
                "Failed to fetch OIDC userinfo",
                extra={"error": str(e)},
            )
            return None


class OIDCGroupCloudProvider(OIDCGroupProvider):
    """
    Group provider for OIDC identity providers (cloud).

    Uses workspace-specific OIDC configuration from IdentityProvider model.
    """

    def _get_workspace_provider(self, workspace_id: UUID) -> Optional[IdentityProvider]:
        """Get the OIDC provider configuration for a workspace."""
        return IdentityProvider.objects.filter(
            workspace_id=workspace_id,
            provider=IdentityProvider.OIDC,
            is_enabled=True,
        ).first()

    def fetch_groups_offline(
        self,
        user_id: UUID,
        workspace_id: UUID,
    ) -> Optional[list[str]]:
        """
        Fetch groups for a user using their stored refresh token (cloud).

        Uses workspace-specific OIDC provider configuration.

        Args:
            user_id: The Plane user ID
            workspace_id: The workspace ID

        Returns:
            List of group names, or None if fetching failed
        """
        try:
            # Get the OIDC provider configuration for the workspace
            provider = self._get_workspace_provider(workspace_id)
            if not provider:
                logger.debug(
                    "No OIDC provider configured for workspace",
                    extra={"workspace_id": str(workspace_id)},
                )
                return None

            # Get the user's OIDC account with refresh token
            account = Account.objects.filter(
                user_id=user_id,
                provider="oidc",
                refresh_token__isnull=False,
            ).first()

            if not account or not account.refresh_token:
                logger.debug(
                    "No OIDC account with refresh token found",
                    extra={"user_id": str(user_id)},
                )
                return None

            # Build settings from workspace provider
            settings = {
                "client_id": provider.client_id,
                "client_secret": provider.client_secret,
                "token_url": provider.token_url,
                "userinfo_url": provider.userinfo_url,
            }

            # Refresh the access token
            token_response = self._refresh_access_token(account, settings)
            if not token_response:
                return None

            # Fetch userinfo with new access token
            access_token = token_response.get("access_token")
            userinfo = self._fetch_userinfo(access_token, provider.userinfo_url)
            if not userinfo:
                return None

            # Get group attribute key from config
            from plane.authentication.models import GroupSyncConfig

            config = GroupSyncConfig.objects.filter(
                workspace_id=workspace_id,
                is_enabled=True,
            ).first()

            group_attribute_key = config.group_attribute_key if config else "groups"

            return self.extract_groups(userinfo, group_attribute_key)

        except Exception as e:
            logger.warning(
                "Failed to fetch groups offline for OIDC (cloud)",
                extra={
                    "user_id": str(user_id),
                    "workspace_id": str(workspace_id),
                    "error": str(e),
                },
            )
            return None
