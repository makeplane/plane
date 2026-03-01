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

# python imports

# Django imports
from django.conf import settings

# Third party imports
from rest_framework.throttling import SimpleRateThrottle
from plane.db.models import APIToken


class ApiKeyRateThrottle(SimpleRateThrottle):
    scope = "api_key"
    rate = settings.DEFAULT_API_RATE_LIMIT

    def get_cache_key(self, request, view):
        # Retrieve the API key from the request header
        api_key = request.headers.get("X-Api-Key")
        if not api_key:
            return None  # Allow the request if there's no API key

        # Use the API key as part of the cache key
        return f"{self.scope}:{api_key}"

    def allow_request(self, request, view):
        allowed = super().allow_request(request, view)

        if allowed:
            now = self.timer()
            # Calculate the remaining limit and reset time
            history = self.cache.get(self.key, [])

            # Remove old histories
            while history and history[-1] <= now - self.duration:
                history.pop()

            # Calculate the requests
            num_requests = len(history)

            # Check available requests
            available = self.num_requests - num_requests

            # Unix timestamp for when the rate limit will reset
            reset_time = int(now + self.duration)

            # Add headers
            request.META["X-RateLimit-Remaining"] = max(0, available)
            request.META["X-RateLimit-Reset"] = reset_time

        return allowed


class ServiceTokenRateThrottle(SimpleRateThrottle):
    scope = "service_token"
    rate = "300/minute"

    def get_cache_key(self, request, view):
        # Retrieve the API key from the request header
        api_key = request.headers.get("X-Api-Key")
        if not api_key:
            return None  # Allow the request if there's no API key

        # Use the API key as part of the cache key
        return f"{self.scope}:{api_key}"

    def allow_request(self, request, view):
        allowed = super().allow_request(request, view)

        if allowed:
            now = self.timer()
            # Calculate the remaining limit and reset time
            history = self.cache.get(self.key, [])

            # Remove old histories
            while history and history[-1] <= now - self.duration:
                history.pop()

            # Calculate the requests
            num_requests = len(history)

            # Check available requests
            available = self.num_requests - num_requests

            # Unix timestamp for when the rate limit will reset
            reset_time = int(now + self.duration)

            # Add headers
            request.META["X-RateLimit-Remaining"] = max(0, available)
            request.META["X-RateLimit-Reset"] = reset_time

        return allowed


class WorkspaceTokenRateThrottle(SimpleRateThrottle):
    scope = "workspace_token"
    rate = settings.DEFAULT_API_RATE_LIMIT

    def get_cache_key(self, request, view):
        api_key = request.headers.get("X-Api-Key")
        if not api_key:
            return None

        return f"{self.scope}:{api_key}"

    def allow_request(self, request, view):
        api_key = request.headers.get("X-Api-Key")

        if api_key:
            if settings.IS_SELF_MANAGED:
                self.rate = settings.DEFAULT_API_RATE_LIMIT
            else:
                token = APIToken.objects.filter(token=api_key).only("allowed_rate_limit").first()
                if token and token.allowed_rate_limit:
                    self.rate = token.allowed_rate_limit

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
