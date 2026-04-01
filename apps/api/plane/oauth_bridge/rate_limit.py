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


# Django imports
from django.conf import settings

# Third party imports
from rest_framework.throttling import SimpleRateThrottle


class ExternalTokenRateThrottle(SimpleRateThrottle):
    """
    Rate throttle for requests authenticated via ExternalOIDCTokenAuthentication.

    Rate is per-provider (set on ExternalTokenProvider.rate_limit).
    Falls back to DEFAULT_API_RATE_LIMIT if the provider has no rate_limit configured.
    """

    scope = "external_token"
    rate = settings.DEFAULT_API_RATE_LIMIT

    def get_cache_key(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return None
        provider_id = request.META.get("EXTERNAL_TOKEN_PROVIDER_ID")
        if provider_id:
            return f"{self.scope}:{provider_id}:{user.pk}"
        return f"{self.scope}:{user.pk}"

    def allow_request(self, request, view):
        provider_rate = request.META.get("EXTERNAL_TOKEN_RATE_LIMIT")
        if provider_rate:
            self.rate = provider_rate
        else:
            self.rate = settings.DEFAULT_API_RATE_LIMIT
        self.num_requests, self.duration = self.parse_rate(self.rate)

        allowed = super().allow_request(request, view)

        if allowed:
            now = self.timer()
            history = self.cache.get(self.key, [])

            while history and history[-1] <= now - self.duration:
                history.pop()

            available = self.num_requests - len(history)

            request.META["X-RateLimit-Remaining"] = max(0, available)
            request.META["X-RateLimit-Reset"] = int(now + self.duration)

        return allowed