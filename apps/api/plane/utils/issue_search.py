# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import re

# Django imports
from django.db.models import Q

# Module imports


def build_search_snippet(content, query, max_length=120):
    """Return a plain-text snippet centered around the first query match."""
    normalized_content = " ".join((content or "").split())
    normalized_query = " ".join((query or "").split())

    if not normalized_content or not normalized_query:
        return None

    match_index = normalized_content.casefold().find(normalized_query.casefold())
    if match_index == -1:
        return None

    snippet_length = max(max_length, len(normalized_query))
    if len(normalized_content) <= snippet_length:
        return normalized_content

    context_before = max(0, (snippet_length - len(normalized_query)) // 2)
    start_index = max(0, match_index - context_before)
    end_index = min(len(normalized_content), start_index + snippet_length)

    # Keep the requested length when the match is close to the end of the text.
    if end_index - start_index < snippet_length:
        start_index = max(0, end_index - snippet_length)

    prefix = "…" if start_index > 0 else ""
    suffix = "…" if end_index < len(normalized_content) else ""
    return f"{prefix}{normalized_content[start_index:end_index]}{suffix}"


def search_issues(query, queryset):
    fields = ["name", "sequence_id", "project__identifier"]
    q = Q()
    for field in fields:
        if field == "sequence_id" and len(query) <= 20:
            sequences = re.findall(r"\b\d+\b", query)
            for sequence_id in sequences:
                q |= Q(**{"sequence_id": sequence_id})
        else:
            q |= Q(**{f"{field}__icontains": query})
    return queryset.filter(q).distinct()
