# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Redis cache helpers for BusinessCalendarService.

Cache key pattern: calendar:{schedule_id}:{year}
TTL: 86400 seconds (1 day) — invalidated on Holiday/DayOverride signal.
"""

from __future__ import annotations

import pickle
from typing import Any
from uuid import UUID

from django.core.cache import cache

# 1-day TTL; signals invalidate sooner when admin changes data
_CACHE_TTL_SECONDS = 86_400


def _cache_key(schedule_id: UUID, year: int) -> str:
    return f"calendar:{schedule_id}:{year}"


def get_year_data(schedule_id: UUID, year: int) -> dict[str, Any] | None:
    """Return cached year data or None on cache miss."""
    raw = cache.get(_cache_key(schedule_id, year))
    if raw is None:
        return None
    # django-redis serialises with pickle by default; explicit here for clarity
    return raw if isinstance(raw, dict) else pickle.loads(raw)  # noqa: S301


def set_year_data(schedule_id: UUID, year: int, data: dict[str, Any]) -> None:
    """Store year data in Redis with TTL."""
    cache.set(_cache_key(schedule_id, year), data, _CACHE_TTL_SECONDS)


def delete_year_data(schedule_id: UUID, year: int) -> None:
    """Remove a single year entry (called by signal handlers)."""
    cache.delete(_cache_key(schedule_id, year))
