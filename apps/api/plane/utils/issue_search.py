# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from plane.utils.search import (
    ISSUE_SEARCH_FIELDS,
    ISSUE_SEQUENCE_FIELDS,
    build_search_query,
)

# Queries longer than this are treated as prose and not mined for sequence ids
SEQUENCE_QUERY_MAX_LENGTH = 20


def search_issues(query, queryset):
    return queryset.filter(
        build_search_query(
            query,
            fields=ISSUE_SEARCH_FIELDS,
            sequence_fields=ISSUE_SEQUENCE_FIELDS,
            sequence_query_max_length=SEQUENCE_QUERY_MAX_LENGTH,
        )
    ).distinct()
