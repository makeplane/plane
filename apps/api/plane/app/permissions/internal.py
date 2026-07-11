# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import hmac

from django.conf import settings
from rest_framework.permissions import BasePermission


class WorkerServicePermission(BasePermission):
    """Authenticates server-to-server calls from the Cloudflare Worker running
    the contracts pipeline (mirrors the LIVE_SERVER_SECRET_KEY pattern used by
    apps/live). The Worker sends the shared secret in X-Plane-Internal-Key.
    """

    def has_permission(self, request, view):
        secret = getattr(settings, "PLANE_INTERNAL_API_SECRET", None)
        if not secret:
            return False
        provided = request.headers.get("X-Plane-Internal-Key", "")
        return hmac.compare_digest(str(provided), str(secret))
