# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import uuid
from typing import Any

from django.db.models import QuerySet
from rest_framework import status
from rest_framework.response import Response

from .ast import PqlError
from .compiler import compile_pql
from .lexer import tokenize
from .parser import parse_pql

__all__ = [
    "PqlError",
    "apply_pql",
    "compile_pql",
    "parse_pql",
    "tokenize",
]


def apply_pql(
    queryset: QuerySet,
    request: Any,
    slug: str,
    project_id: str | uuid.UUID | None = None,
) -> QuerySet | Response:
    """Apply the ``pql`` query parameter to an ``Issue`` queryset, or return a 400 ``Response``."""
    pql_query = request.GET.get("pql")
    if not pql_query:
        return queryset

    cache_attr = "_pql_compiled_q_cache"
    cache_key = (pql_query, str(slug), str(project_id) if project_id is not None else None)
    cached = getattr(request, cache_attr, None)
    if isinstance(cached, dict) and cache_key in cached:
        return queryset.filter(cached[cache_key])

    try:
        user = getattr(request, "user", None)
        user_tz = getattr(request, "user_timezone", None) or getattr(user, "user_timezone", None)
        q = compile_pql(
            pql_query,
            workspace_slug=slug,
            user=user,
            project_id=project_id,
            user_timezone=user_tz,
        )
    except PqlError as exc:
        return Response({"pql": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    if not isinstance(cached, dict):
        cached = {}
        try:
            setattr(request, cache_attr, cached)
        except Exception:
            pass
    cached[cache_key] = q
    return queryset.filter(q)
