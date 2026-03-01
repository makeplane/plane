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

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID


class BaseGroupProvider(ABC):
    """
    Abstract base class for extracting groups from identity providers.

    Each provider (OIDC, SAML, LDAP) implements this interface to extract
    group information in a uniform way for the group sync service.
    """

    @property
    @abstractmethod
    def provider_type(self) -> str:
        """Return the provider type identifier (e.g., 'oidc', 'saml', 'ldap')."""
        pass

    @abstractmethod
    def extract_groups(
        self,
        auth_response: dict,
        group_attribute_key: str,
    ) -> list[str]:
        """
        Extract group names from the authentication response.

        Args:
            auth_response: The raw response from the identity provider
                          (e.g., userinfo response for OIDC, assertion for SAML)
            group_attribute_key: The key/claim name where groups are stored
                                (e.g., 'groups', 'memberOf', 'roles')

        Returns:
            List of group names as strings
        """
        pass

    @abstractmethod
    def can_fetch_groups_offline(self) -> bool:
        """
        Whether this provider supports fetching groups without user interaction.

        Used to determine if background sync is possible for this provider.
        For example:
        - OIDC: May support via refresh token + userinfo endpoint
        - LDAP: Can query directory directly
        - SAML: Typically cannot (assertion only available during login)

        Returns:
            True if offline group fetching is supported
        """
        pass

    @abstractmethod
    def fetch_groups_offline(
        self,
        user_id: UUID,
        workspace_id: UUID,
    ) -> Optional[list[str]]:
        """
        Fetch groups for a user without requiring them to log in.

        This is used for background sync tasks. Only implement if
        can_fetch_groups_offline() returns True.

        Args:
            user_id: The Plane user ID
            workspace_id: The workspace ID (for workspace-specific provider config)

        Returns:
            List of group names, or None if fetching failed
        """
        pass
