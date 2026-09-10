# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.db.models import Q

from plane.utils.search import (
    ISSUE_SEARCH_FIELDS,
    ISSUE_SEQUENCE_FIELDS,
    MAX_SEARCH_TOKENS,
    PAGE_SEARCH_FIELDS,
    build_search_query,
)


def _children(q):
    """Flatten a Q tree into the set of leaf lookups it applies."""
    leaves = set()
    for child in q.children:
        if isinstance(child, Q):
            leaves |= _children(child)
        else:
            leaves.add(child)
    return leaves


@pytest.mark.unit
class TestBuildSearchQuery:
    """Multi-word queries must match on words, not on one contiguous string."""

    def test_empty_query_matches_nothing(self):
        assert build_search_query("", fields=["name"]) == Q()
        assert build_search_query(None, fields=["name"]) == Q()
        assert build_search_query("   ", fields=["name"]) == Q()

    def test_single_token_ors_across_fields(self):
        q = build_search_query("northwind", fields=["name", "description_stripped"])
        assert _children(q) == {
            ("name__icontains", "northwind"),
            ("description_stripped__icontains", "northwind"),
        }
        assert q.connector == Q.OR

    def test_tokens_are_anded_not_matched_as_a_phrase(self):
        q = build_search_query("payment gateway", fields=["name"])
        # Each token contributes its own leaf; the phrase itself is never a leaf
        assert _children(q) == {
            ("name__icontains", "payment"),
            ("name__icontains", "gateway"),
        }
        assert ("name__icontains", "payment gateway") not in _children(q)
        assert q.connector == Q.AND

    def test_word_order_and_interleaving_are_irrelevant(self):
        forward = build_search_query("payment gateway", fields=["name"])
        reversed_ = build_search_query("gateway payment", fields=["name"])
        assert _children(forward) == _children(reversed_)

    def test_repeated_whitespace_does_not_create_empty_tokens(self):
        q = build_search_query("  payment   gateway \n", fields=["name"])
        assert _children(q) == {
            ("name__icontains", "payment"),
            ("name__icontains", "gateway"),
        }

    def test_numeric_token_also_matches_sequence_id(self):
        q = build_search_query(
            "22",
            fields=ISSUE_SEARCH_FIELDS,
            sequence_fields=ISSUE_SEQUENCE_FIELDS,
        )
        assert ("sequence_id", "22") in _children(q)

    def test_sequence_match_is_ored_onto_the_whole_predicate(self):
        """A bare issue number reaches the issue regardless of its title."""
        q = build_search_query(
            "22",
            fields=ISSUE_SEARCH_FIELDS,
            sequence_fields=ISSUE_SEQUENCE_FIELDS,
        )
        assert q.connector == Q.OR
        assert ("sequence_id", "22") in _children(q)

    def test_identifier_and_number_in_one_token_still_matches_by_number(self):
        q = build_search_query(
            "PAY-22",
            fields=ISSUE_SEARCH_FIELDS,
            sequence_fields=ISSUE_SEQUENCE_FIELDS,
        )
        assert ("sequence_id", "22") in _children(q)

    def test_sequence_lookup_still_applies_to_multi_word_queries(self):
        """Unchanged from before this refactor, and deliberately so.

        A number anywhere in the query still matches by sequence id, OR-ed onto
        the whole predicate, so a work item carrying that number is returned
        even when the words do not match it. That is noisy — "level 3 rate"
        returns every work item numbered 3 — but narrowing it would remove
        results that match today, and this change is meant to be a strict
        superset. Pinned here so the behaviour is a decision rather than an
        accident.
        """
        q = build_search_query(
            "level 3 rate",
            fields=ISSUE_SEARCH_FIELDS,
            sequence_fields=ISSUE_SEQUENCE_FIELDS,
        )
        assert ("sequence_id", "3") in _children(q)
        assert q.connector == Q.OR

    def test_decimals_do_not_produce_sequence_matches(self):
        q = build_search_query(
            "3.5",
            fields=ISSUE_SEARCH_FIELDS,
            sequence_fields=ISSUE_SEQUENCE_FIELDS,
        )
        assert ("sequence_id", "3") not in _children(q)
        assert ("sequence_id", "5") not in _children(q)

    def test_leading_dot_decimals_do_not_produce_sequence_matches(self):
        """ ".5" is a decimal, not work item number 5."""
        q = build_search_query(
            ".5",
            fields=ISSUE_SEARCH_FIELDS,
            sequence_fields=ISSUE_SEQUENCE_FIELDS,
        )
        assert ("sequence_id", "5") not in _children(q)

    def test_version_strings_do_not_produce_sequence_matches(self):
        q = build_search_query(
            "v1.4.0",
            fields=ISSUE_SEARCH_FIELDS,
            sequence_fields=ISSUE_SEQUENCE_FIELDS,
        )
        assert not any(lookup == "sequence_id" for lookup, _ in _children(q))

    def test_trailing_punctuation_still_matches_a_sequence_id(self):
        """A trailing dot is sentence punctuation, not a decimal point."""
        q = build_search_query(
            "22.",
            fields=ISSUE_SEARCH_FIELDS,
            sequence_fields=ISSUE_SEQUENCE_FIELDS,
        )
        assert ("sequence_id", "22") in _children(q)

    def test_long_queries_are_not_mined_for_sequence_ids(self):
        query = "the payment gateway on level 3 and its effective rate"
        q = build_search_query(
            query,
            fields=ISSUE_SEARCH_FIELDS,
            sequence_fields=ISSUE_SEQUENCE_FIELDS,
            sequence_query_max_length=20,
        )
        assert ("sequence_id", "3") not in _children(q)

    def test_no_sequence_fields_yields_no_sequence_leaves(self):
        q = build_search_query("22", fields=["name"])
        assert _children(q) == {("name__icontains", "22")}


@pytest.mark.unit
class TestTokenBudget:
    """One predicate per token per field, so the token count has to be bounded.

    The predicate this replaced was a single icontains over the whole query —
    constant size no matter how long the query was. Tokenizing removes that
    property, so a request could otherwise build arbitrarily large SQL.
    """

    def test_predicate_size_is_proportional_to_tokens(self):
        fields = ["name", "description_stripped"]
        q = build_search_query("alpha beta gamma", fields=fields)
        assert len(_children(q)) == 3 * len(fields)

    def test_tokens_at_the_limit_are_all_used(self):
        fields = ["name"]
        tokens = [f"t{i}" for i in range(MAX_SEARCH_TOKENS)]
        q = build_search_query(" ".join(tokens), fields=fields)
        assert len(_children(q)) == MAX_SEARCH_TOKENS

    def test_tokens_beyond_the_limit_are_dropped(self):
        fields = ["name"]
        tokens = [f"t{i}" for i in range(MAX_SEARCH_TOKENS + 50)]
        q = build_search_query(" ".join(tokens), fields=fields)
        assert len(_children(q)) == MAX_SEARCH_TOKENS

    def test_a_pathological_query_stays_bounded(self):
        """The case the bound exists for: thousands of tokens, many fields."""
        fields = ISSUE_SEARCH_FIELDS
        q = build_search_query(" ".join(str(i) for i in range(5000)), fields=fields)
        assert len(_children(q)) <= MAX_SEARCH_TOKENS * len(fields)


@pytest.mark.unit
class TestSearchableFields:
    """Bodies are searchable, not just titles."""

    def test_issues_search_their_description(self):
        assert "description_stripped" in ISSUE_SEARCH_FIELDS

    def test_pages_search_their_description(self):
        assert "description_stripped" in PAGE_SEARCH_FIELDS

    def test_a_word_only_in_the_body_is_matchable(self):
        q = build_search_query(
            "northwind",
            fields=ISSUE_SEARCH_FIELDS,
            sequence_fields=ISSUE_SEQUENCE_FIELDS,
        )
        assert ("description_stripped__icontains", "northwind") in _children(q)

    def test_words_split_across_title_and_body_still_match(self):
        """ "payment" and "gateway" from the title, "review" from the body."""
        q = build_search_query("payment gateway review", fields=ISSUE_SEARCH_FIELDS)
        leaves = _children(q)
        for token in ("payment", "gateway", "review"):
            assert ("name__icontains", token) in leaves
            assert ("description_stripped__icontains", token) in leaves
