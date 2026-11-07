# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import hmac

# Django imports
from django.conf import settings

# Third party imports
from rest_framework.permissions import BasePermission

AGENT_BRIDGE_SECRET_HEADER = "X-Agent-Bridge-Secret"


class AgentBridgeSecretPermission(BasePermission):
    """Service-to-service auth for the agent bridge.

    Grants access only when the ``X-Agent-Bridge-Secret`` header equals
    ``settings.AGENT_BRIDGE_SECRET`` (constant-time compare). When the setting is
    empty every request is rejected, so the endpoints are off by default.
    """

    message = "Invalid agent bridge credentials."

    def has_permission(self, request, view):
        expected = getattr(settings, "AGENT_BRIDGE_SECRET", "") or ""
        if not expected:
            return False
        provided = request.headers.get(AGENT_BRIDGE_SECRET_HEADER) or ""
        if not provided:
            return False
        return hmac.compare_digest(provided.encode("utf-8"), expected.encode("utf-8"))
