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

from typing import Optional

from .base import BaseGroupProvider
from .oidc import OIDCGroupProvider, OIDCGroupCloudProvider


class GroupProviderRegistry:
    """
    Registry for group providers.

    Maps provider types (oidc, saml, ldap) to their implementations.
    Supports both self-hosted (instance-level) and cloud (workspace-level) configurations.
    """

    # Self-hosted providers (use instance-level config)
    _providers: dict[str, type[BaseGroupProvider]] = {
        "oidc": OIDCGroupProvider,
        # Future providers:
        # "saml": SAMLGroupProvider,
        # "ldap": LDAPGroupProvider,
    }

    # Cloud providers (use workspace-level config)
    _cloud_providers: dict[str, type[BaseGroupProvider]] = {
        "oidc": OIDCGroupCloudProvider,
        # Future providers:
        # "saml": SAMLGroupCloudProvider,
    }

    _instances: dict[str, BaseGroupProvider] = {}
    _cloud_instances: dict[str, BaseGroupProvider] = {}

    @classmethod
    def get_provider(
        cls,
        provider_type: str,
        is_cloud: bool = False,
    ) -> Optional[BaseGroupProvider]:
        """
        Get a group provider instance by type.

        Args:
            provider_type: The provider type (e.g., 'oidc', 'saml', 'ldap')
            is_cloud: If True, returns cloud provider (workspace-level config)
                      If False, returns self-hosted provider (instance-level config)

        Returns:
            The group provider instance, or None if not found
        """
        if is_cloud:
            if provider_type not in cls._cloud_providers:
                return None
            if provider_type not in cls._cloud_instances:
                cls._cloud_instances[provider_type] = cls._cloud_providers[provider_type]()
            return cls._cloud_instances[provider_type]
        else:
            if provider_type not in cls._providers:
                return None
            if provider_type not in cls._instances:
                cls._instances[provider_type] = cls._providers[provider_type]()
            return cls._instances[provider_type]

    @classmethod
    def register_provider(
        cls,
        provider_type: str,
        provider_class: type[BaseGroupProvider],
        is_cloud: bool = False,
    ) -> None:
        """
        Register a new group provider.

        Args:
            provider_type: The provider type identifier
            provider_class: The provider class (must inherit from BaseGroupProvider)
            is_cloud: If True, registers as cloud provider
        """
        if is_cloud:
            cls._cloud_providers[provider_type] = provider_class
            cls._cloud_instances.pop(provider_type, None)
        else:
            cls._providers[provider_type] = provider_class
            cls._instances.pop(provider_type, None)

    @classmethod
    def get_supported_providers(cls, is_cloud: bool = False) -> list[str]:
        """Get list of supported provider types."""
        if is_cloud:
            return list(cls._cloud_providers.keys())
        return list(cls._providers.keys())
