from rest_framework.throttling import SimpleRateThrottle


class AssetRateThrottle(SimpleRateThrottle):
    scope = "asset_id"

    def get_cache_key(self, request, view):
        asset_id = view.kwargs.get("asset_id")
        if not asset_id:
            return None
        return f"throttle_asset_{asset_id}"
