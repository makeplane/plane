# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import re

# Django imports
from django.db.models import Q

# Match whole integers only. The lookaround excludes the components of a
# decimal: a plain \b\d+\b treats the dot in "3.5" as a word boundary and
# yields both 3 and 5, so searching a version string surfaced unrelated issues
# by sequence id. Any digit preceded by a dot is part of a decimal too — ".5"
# must not yield 5. A trailing dot not followed by a digit ("issue 22.") is
# sentence punctuation, and 22 stays matchable.
SEQUENCE_PATTERN = re.compile(r"(?<![\d.])\b\d+\b(?!\.\d)")

# Searchable fields per entity, shared by every search endpoint so that the
# global search, the entity search and the project issue search cannot drift
# apart. Adding a field here widens all of them at once.
#
# `description_stripped` is the plain-text projection of an entity's rich-text
# body, maintained on save, so searching it needs no migration and no new
# index. It is what makes a work item findable by anything its author wrote
# rather than only by the words that fit in a title.
WORKSPACE_SEARCH_FIELDS = ["name"]
PROJECT_SEARCH_FIELDS = ["name", "identifier"]
ISSUE_SEARCH_FIELDS = ["name", "description_stripped", "project__identifier"]
ISSUE_SEQUENCE_FIELDS = ["sequence_id"]
CYCLE_SEARCH_FIELDS = ["name"]
MODULE_SEARCH_FIELDS = ["name"]
PAGE_SEARCH_FIELDS = ["name", "description_stripped"]
VIEW_SEARCH_FIELDS = ["name"]
USER_MENTION_SEARCH_FIELDS = [
    "member__first_name",
    "member__last_name",
    "member__display_name",
]


def build_search_query(query, fields, sequence_fields=(), sequence_query_max_length=None):
    """Build a case-insensitive search predicate over ``fields``.

    Tokens are AND-ed and fields are OR-ed: every whitespace-separated token in
    ``query`` must appear in at least one of ``fields``. Matching the query as a
    single contiguous string instead — which is what a bare ``__icontains``
    does — means "payment gateway review" fails against a record titled
    "Select the payment gateway on Level 3 capability", because the three words
    never appear adjacently. Tokenizing makes word order and interleaving
    irrelevant.

    ``sequence_fields`` are integer columns (an issue's ``sequence_id``) matched
    exactly against any numeric token. They are OR-ed onto the whole predicate
    rather than folded into the per-token AND so that a query mixing words and a
    number keeps surfacing that record by number, as it did before tokenizing.

    ``sequence_query_max_length`` skips sequence matching for queries longer
    than the given length, so prose does not get mined for stray digits.

    An empty query returns an empty ``Q()``, which filters nothing — callers
    rely on that to mean "no search term supplied".
    """
    if not query:
        return Q()

    tokens = query.split()
    if not tokens:
        return Q()

    text_query = Q()
    for token in tokens:
        token_query = Q()
        for field in fields:
            token_query |= Q(**{f"{field}__icontains": token})
        text_query &= token_query

    sequence_query = Q()
    if sequence_fields and (sequence_query_max_length is None or len(query) <= sequence_query_max_length):
        for sequence_id in SEQUENCE_PATTERN.findall(query):
            for field in sequence_fields:
                sequence_query |= Q(**{field: sequence_id})

    if sequence_query:
        return text_query | sequence_query

    return text_query
