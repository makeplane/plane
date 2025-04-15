# Python imports
import os

# Third party imports
from rest_framework.throttling import AnonRateThrottle


class SpaceRateThrottle(AnonRateThrottle):
    rate = os.environ.get("SPACE_RATE_LIMIT", "5/minute")
    scope = "space"


class AnchorBasedRateThrottle(AnonRateThrottle):
    rate = os.environ.get("SPACE_ANCHOR_RATE_LIMIT", "5/minute")

    def get_cache_key(self, request, view):
        # Get the anchor from the URL parameters
        anchor = view.kwargs.get("anchor", "")
        # Combine anchor and IP for the cache key
        return f"anchor_throttle_{anchor}"
