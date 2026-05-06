# Phase 03: Redis cache for work-items endpoint

**Priority:** P1 | **Status:** TODO | **Effort:** 30 phút | **Owner:** backend dev

## Goal

Cache response của `UserWorkItemsTimelineEndpoint` 30s qua Redis để giảm load DB khi user reload / điều hướng tới-lui profile page.

## Files to modify

- `apps/api/plane/app/views/user/work_items.py` — wrap với cache
- `apps/api/plane/db/models/issue.py` — add post_save signal invalidate (optional)

## Implementation

### 1. Cache wrapper trong endpoint

```python
from django.core.cache import cache
from django.utils import timezone

CACHE_TTL = 30  # seconds
CACHE_VERSION = "v1"

def _cache_key(self, user_id: int, period: str, scope_slug: str | None) -> str:
    today = timezone.now().date().isoformat()
    return f"user_work_items:{CACHE_VERSION}:{user_id}:{period}:{scope_slug or '*'}:{today}"

def get(self, request):
    # ... param validation as Phase 02

    cache_key = self._cache_key(request.user.id, period, scope_slug)
    cached = cache.get(cache_key)
    if cached:
        cached["meta"]["cache_hit"] = True
        return Response(cached)

    # ... compute response as Phase 02

    response_data = {"items": items_data, "lookups": lookups, "meta": meta}
    cache.set(cache_key, response_data, CACHE_TTL)
    return Response(response_data)
```

### 2. Invalidate trên signal (optional, P2)

Khi user create/update/delete issue → invalidate cache cho assignees:

```python
# apps/api/plane/db/signals/issue.py (or in apps.py ready())
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

@receiver([post_save, post_delete], sender=Issue)
def invalidate_work_items_cache(sender, instance, **kwargs):
    """Invalidate work-items cache for all assignees of changed issue."""
    today = timezone.now().date().isoformat()
    for assignee_id in instance.assignees.values_list("id", flat=True):
        for period in ["today", "overdue"]:
            # Invalidate both cross-workspace + scoped versions
            cache.delete_pattern(f"user_work_items:v1:{assignee_id}:{period}:*:{today}")
```

→ Cần `django-redis` `delete_pattern` support. Nếu không, dùng `cache.delete_many` với explicit keys.

**Trade-off:** signal-based invalidate = real-time updates vs 30s TTL = simple + good enough.

→ Recommend skip signal trong Phase 03 (YAGNI), TTL 30s đủ. Add Phase 06 nếu user feedback thấy stale.

### 3. Cache miss tracking

Add metric/log để monitor:

```python
# In get():
if cached:
    logger.debug(f"work_items cache HIT key={cache_key}")
else:
    logger.debug(f"work_items cache MISS key={cache_key}")
```

→ Dùng để tune TTL sau.

## Settings verify

`apps/api/plane/settings/common.py` (hoặc `local.py`):
```python
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}
```

Verify Redis container `planeso-plane-redis-1` đang chạy + Django connect được:
```bash
docker exec planeso-api-1 python -c "from django.core.cache import cache; cache.set('test', 1, 5); print(cache.get('test'))"
```

## Acceptance criteria Phase 03

- [ ] Cache HIT trả response <50ms (so với MISS ~200-500ms)
- [ ] `meta.cache_hit` field trả đúng `true`/`false`
- [ ] TTL 30s verify (sleep 31s → MISS lại)
- [ ] Concurrent cache stampede không xảy ra (1 request compute, others đợi)

## Risks

| Risk | Mitigation |
|------|-----------|
| Stale data sau update issue | TTL 30s ngắn + UI có pull-to-refresh / SWR mutate sau action |
| Cache miss storm khi TTL expire đồng thời | Add jitter ±5s vào TTL: `ttl = 30 + random.randint(-5, 5)` |
| Redis down → endpoint vẫn work | Wrap `cache.get/set` trong try/except, fallback compute |

## Next

→ Phase 04 (frontend) consume endpoint mới
