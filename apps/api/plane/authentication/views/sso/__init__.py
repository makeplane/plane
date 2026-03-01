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

from .provider import IdentityProviderEndpoint
from .domain import DomainEndpoint, DomainVerificationEndpoint
from .oidc import OIDCAuthCloudCallbackEndpoint
from .saml import (
    SAMLAuthCloudMetadataEndpoint,
    SAMLAuthCloudCallbackEndpoint,
    SAMLAuthCloudLogoutEndpoint,
)
from .auth import SSOAuthInitiateEndpoint
from .group_sync import (
    GroupSyncConfigEndpoint,
    GroupMappingEndpoint,
)

__all__ = [
    "SSOAuthInitiateEndpoint",
    "IdentityProviderEndpoint",
    "DomainEndpoint",
    "DomainVerificationEndpoint",
    # OIDC
    "OIDCAuthCloudCallbackEndpoint",
    # SAML
    "SAMLAuthCloudMetadataEndpoint",
    "SAMLAuthCloudCallbackEndpoint",
    "SAMLAuthCloudLogoutEndpoint",
    # Group Sync
    "GroupSyncConfigEndpoint",
    "GroupMappingEndpoint",
]
