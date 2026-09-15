# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""External system adapters (P1-D1 base layer, P1-D2 ~ P1-D4 adapters)."""

from .adapters import (
    ADAPTERS,
    PolyAgentClient,
    RagPortalClient,
    SmartAccessClient,
    SpecAgentClient,
    SpecLabOSClient,
    WeKnoraClient,
    client_for,
)
from .base import BaseIntegrationClient, IntegrationResult

__all__ = [
    "ADAPTERS",
    "BaseIntegrationClient",
    "IntegrationResult",
    "PolyAgentClient",
    "RagPortalClient",
    "SmartAccessClient",
    "SpecAgentClient",
    "SpecLabOSClient",
    "WeKnoraClient",
    "client_for",
]
