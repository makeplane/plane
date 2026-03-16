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
from typing import Optional
from uuid import UUID

from .base import BaseGroupProvider


logger = logging.getLogger("plane.authentication")


class SAMLGroupProvider(BaseGroupProvider):
    """
    Group provider for SAML identity providers (self-hosted).

    Extracts groups from the SAML assertion attributes.
    SAML attributes are typically formatted as:
        {"groups": ["engineering", "product"], "email": ["user@example.com"]}
    """

    @property
    def provider_type(self) -> str:
        return "saml"

    def extract_groups(
        self,
        auth_response: dict,
        group_attribute_key: str,
    ) -> list[str]:
        """
        Extract groups from SAML assertion attributes.

        Args:
            auth_response: The SAML attributes dict from the assertion
            group_attribute_key: The attribute name for groups (e.g., 'groups', 'memberOf')

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
        """SAML assertions are only available during login, no offline fetching."""
        return False

    def fetch_groups_offline(
        self,
        user_id: UUID,
        workspace_id: UUID,
    ) -> Optional[list[str]]:
        """SAML does not support offline group fetching."""
        return None


class SAMLGroupCloudProvider(SAMLGroupProvider):
    """
    Group provider for SAML identity providers (cloud).

    Uses workspace-specific SAML configuration from IdentityProvider model.
    Behavior is identical to self-hosted since SAML cannot fetch groups offline.
    """

    pass
