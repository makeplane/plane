# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Keyset pagination for messages.

Plane's `OffsetPaginator` counts rows from the start, so its pages shift as new
messages arrive. Messages are instead paged by their position in the order
`(created_at, id)`, using a message ID as the cursor:

- no cursor: the newest `limit` messages;
- `before=<id>`: the `limit` messages just older than that message (scrolling back);
- `after=<id>`: the `limit` messages just newer than it (catching up after a reconnect).

`before` and `after` together are a 400. Every page is ordered oldest to newest,
and `has_more` says whether there are more messages in the direction asked for
(older for the first page and `before`, newer for `after`). Removed messages stay
in the order as tombstones, so a removed message is still a valid cursor.
"""

import uuid

from django.db.models import Q

from plane.chat.exceptions import BadRequest

DEFAULT_LIMIT = 50
MAX_LIMIT = 100


def _limit(raw):
    if raw in (None, ""):
        return DEFAULT_LIMIT
    try:
        limit = int(raw)
    except (TypeError, ValueError):
        raise BadRequest("limit must be a whole number.")
    if not 1 <= limit <= MAX_LIMIT:
        raise BadRequest(f"limit must be between 1 and {MAX_LIMIT}.")
    return limit


def _cursor(queryset, raw, name):
    try:
        cursor_id = uuid.UUID(raw)
    except (TypeError, ValueError):
        raise BadRequest(f"{name} must be a message ID.")
    cursor = queryset.filter(pk=cursor_id).values("created_at", "id").first()
    if cursor is None:
        raise BadRequest(f"{name} is not a message in this list.")
    return cursor


def paginate_messages(queryset, params):
    """Return `(messages, has_more)` for one page of `queryset`, which must already be scoped to one list."""
    before, after = params.get("before"), params.get("after")
    if before and after:
        raise BadRequest("Pass either before or after, not both.")
    limit = _limit(params.get("limit"))

    if after:
        cursor = _cursor(queryset, after, "after")
        newer = Q(created_at__gt=cursor["created_at"]) | Q(created_at=cursor["created_at"], id__gt=cursor["id"])
        page = list(queryset.filter(newer).order_by("created_at", "id")[: limit + 1])
        return page[:limit], len(page) > limit

    if before:
        cursor = _cursor(queryset, before, "before")
        older = Q(created_at__lt=cursor["created_at"]) | Q(created_at=cursor["created_at"], id__lt=cursor["id"])
        queryset = queryset.filter(older)
    page = list(queryset.order_by("-created_at", "-id")[: limit + 1])
    return page[:limit][::-1], len(page) > limit
