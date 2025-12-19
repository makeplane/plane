# python imports
import os

# Third party imports
from rest_framework.throttling import SimpleRateThrottle
from plane.db.models import APIToken


class ApiKeyRateThrottle(SimpleRateThrottle):
    scope = "api_key"
    rate = os.environ.get("API_KEY_RATE_LIMIT", "60/minute")

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
    rate = "60/minute"

    def get_cache_key(self, request, view):
        api_key = request.headers.get("X-Api-Key")
        if not api_key:
            return None

        return f"{self.scope}:{api_key}"

    def allow_request(self, request, view):
        api_key = request.headers.get("X-Api-Key")

        if api_key:
            token = APIToken.objects.filter(token=api_key).only("allowed_rate_limit").first()
            if token and token.allowed_rate_limit:
                self.rate = token.allowed_rate_limit
                # Must re-parse to update num_requests and duration
                self.num_requests, self.duration = self.parse_rate(self.rate)

        return super().allow_request(request, view)
