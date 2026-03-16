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

import ldap
import ldap.filter

from plane.db.models import Account
from plane.license.utils.instance_value import get_configuration_value

from .base import BaseGroupProvider


logger = logging.getLogger("plane.authentication")


def _extract_cn_from_dn(dn_string: str) -> Optional[str]:
    """
    Extract CN (Common Name) from an LDAP DN string.

    Example: "cn=engineering,ou=groups,dc=example,dc=com" -> "engineering"
    """
    for part in dn_string.split(","):
        key_value = part.strip().split("=", 1)
        if len(key_value) == 2 and key_value[0].strip().lower() == "cn":
            return key_value[1].strip()
    return None


class LDAPGroupProvider(BaseGroupProvider):
    """
    Group provider for LDAP identity providers (self-hosted only).

    Extracts groups from the LDAP user entry attributes.
    LDAP group attributes typically come in two formats:

    1. DN format (memberOf): [b"cn=engineering,ou=groups,dc=example,dc=com", ...]
       -> Extracts the CN component as the group name.

    2. Flat format: [b"engineering", b"product", ...]
       -> Uses the values directly as group names.
    """

    @property
    def provider_type(self) -> str:
        return "ldap"

    def extract_groups(
        self,
        auth_response: dict,
        group_attribute_key: str,
    ) -> list[str]:
        """
        Extract groups from LDAP user attributes.

        Args:
            auth_response: The LDAP attributes dict from the user entry
            group_attribute_key: The attribute name for groups (e.g., 'memberOf', 'groups')

        Returns:
            List of group names
        """
        raw_groups = auth_response.get(group_attribute_key, [])

        if not raw_groups:
            return []

        # Handle case where groups might be a single value
        if isinstance(raw_groups, (str, bytes)):
            raw_groups = [raw_groups]

        groups = []
        for raw_group in raw_groups:
            if not raw_group:
                continue

            # Decode bytes to string if necessary
            if isinstance(raw_group, bytes):
                try:
                    raw_group = raw_group.decode("utf-8")
                except UnicodeDecodeError:
                    continue

            raw_group = str(raw_group)

            # Check if this looks like a DN (contains "=" and ",")
            if "=" in raw_group and "," in raw_group:
                cn = _extract_cn_from_dn(raw_group)
                if cn:
                    groups.append(cn)
            else:
                # Flat group name
                groups.append(raw_group)

        return groups

    def can_fetch_groups_offline(self) -> bool:
        """LDAP can be queried anytime using the service account credentials."""
        return True

    def _get_ldap_settings(self) -> dict:
        """Get LDAP settings from instance configuration."""
        (
            LDAP_SERVER_URI,
            LDAP_BIND_DN,
            LDAP_BIND_PASSWORD,
            LDAP_USER_SEARCH_BASE,
            LDAP_GROUP_SYNC_SEARCH_FILTER,
        ) = get_configuration_value(
            [
                {"key": "LDAP_SERVER_URI", "default": os.environ.get("LDAP_SERVER_URI")},
                {"key": "LDAP_BIND_DN", "default": os.environ.get("LDAP_BIND_DN")},
                {"key": "LDAP_BIND_PASSWORD", "default": os.environ.get("LDAP_BIND_PASSWORD")},
                {"key": "LDAP_USER_SEARCH_BASE", "default": os.environ.get("LDAP_USER_SEARCH_BASE")},
                {
                    "key": "LDAP_GROUP_SYNC_SEARCH_FILTER",
                    "default": os.environ.get("LDAP_GROUP_SYNC_SEARCH_FILTER", "(mail={email})"),
                },
            ]
        )

        return {
            "server_uri": LDAP_SERVER_URI,
            "bind_dn": LDAP_BIND_DN,
            "bind_password": LDAP_BIND_PASSWORD,
            "search_base": LDAP_USER_SEARCH_BASE,
            "group_sync_search_filter": LDAP_GROUP_SYNC_SEARCH_FILTER,
        }

    def fetch_groups_offline(
        self,
        user_id: UUID,
        workspace_id: UUID,
    ) -> Optional[list[str]]:
        """
        Fetch groups for a user by querying the LDAP directory with the service account.

        Args:
            user_id: The Plane user ID
            workspace_id: The workspace ID

        Returns:
            List of group names, or None if fetching failed
        """
        try:
            settings = self._get_ldap_settings()
            if not settings.get("server_uri") or not settings.get("bind_dn"):
                logger.debug("LDAP not configured at instance level")
                return None

            # Get the user's email to search LDAP
            account = Account.objects.filter(
                user_id=user_id,
                provider="ldap",
            ).first()

            if not account:
                logger.debug(
                    "No LDAP account found for user",
                    extra={"user_id": str(user_id)},
                )
                return None

            # Get the user's email from the User model
            from plane.db.models import User

            user = User.objects.filter(id=user_id).first()
            if not user or not user.email:
                logger.debug(
                    "No email found for user",
                    extra={"user_id": str(user_id)},
                )
                return None

            # Get group attribute key from config
            from plane.authentication.models import GroupSyncConfig

            config = GroupSyncConfig.objects.filter(
                workspace_id=workspace_id,
                is_enabled=True,
            ).first()

            group_attribute_key = config.group_attribute_key if config else "memberOf"

            # Connect to LDAP and search for the user
            conn = self._connect_to_ldap(settings)
            if not conn:
                return None

            try:
                # Build search filter using the configured template with escaped email
                safe_email = ldap.filter.escape_filter_chars(user.email)
                search_filter = settings["group_sync_search_filter"].format(email=safe_email)
                result = conn.search_ext_s(
                    settings["search_base"],
                    ldap.SCOPE_SUBTREE,
                    search_filter,
                    [group_attribute_key],
                    sizelimit=1,
                )

                # Filter out referrals
                result = [(dn, attrs) for dn, attrs in result if attrs is not None]

                if not result:
                    logger.debug(
                        "User not found in LDAP for offline sync",
                        extra={"user_id": str(user_id), "email": user.email},
                    )
                    return None

                _, ldap_attrs = result[0]
                return self.extract_groups(ldap_attrs, group_attribute_key)

            finally:
                conn.unbind_s()

        except Exception as e:
            logger.warning(
                "Failed to fetch groups offline for LDAP",
                extra={
                    "user_id": str(user_id),
                    "workspace_id": str(workspace_id),
                    "error": str(e),
                },
            )
            return None

    def _connect_to_ldap(self, settings: dict):
        """Establish connection to LDAP server using service account."""
        try:
            ldap.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, ldap.OPT_X_TLS_NEVER)
            ldap.set_option(ldap.OPT_REFERRALS, 0)

            conn = ldap.initialize(settings["server_uri"])
            conn.set_option(ldap.OPT_PROTOCOL_VERSION, 3)
            conn.set_option(ldap.OPT_REFERRALS, 0)
            conn.set_option(ldap.OPT_NETWORK_TIMEOUT, 10.0)
            conn.simple_bind_s(settings["bind_dn"], settings["bind_password"])
            return conn

        except Exception as e:
            logger.warning(
                "Failed to connect to LDAP for offline group sync",
                extra={"error": str(e)},
            )
            return None
