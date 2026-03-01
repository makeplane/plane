# Throttles Module

REST API rate limiting.

## Purpose

Provides rate limiting protection for API endpoints using Django REST Framework throttling.

## Components

### AssetRateThrottle

Rate limiting for asset endpoints.

**Configuration**:

- Scope: `asset`
- Default rate: 5 requests/minute per asset
- Uses asset_id for scope identification

**Implementation**:

```python
class AssetRateThrottle(SimpleRateThrottle):
    scope = 'asset'

    def get_cache_key(self, request, view):
        # Returns key based on asset_id
        ...
```

## Usage

Apply to views:

```python
from plane.throttles.asset import AssetRateThrottle

class AssetView(APIView):
    throttle_classes = [AssetRateThrottle]
```

## Rate Limits

| Scope   | Rate      | Description             |
| ------- | --------- | ----------------------- |
| `asset` | 5/minute  | Per-asset rate limiting |
| `anon`  | 30/minute | Anonymous requests      |

## DRF Integration

Integrates with Django REST Framework's throttling system:

- `SimpleRateThrottle` base class
- Cache-based rate tracking
- Configurable rates via settings

## Configuration

In `settings/common.py`:

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'asset': '5/minute',
        'anon': '30/minute',
    }
}
```
