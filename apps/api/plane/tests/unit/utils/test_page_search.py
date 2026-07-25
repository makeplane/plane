# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for the page search snippet helper."""

import pytest

from plane.utils.page_search import (
    SNIPPET_LEAD_CHARS,
    SNIPPET_MAX_LENGTH,
    build_page_snippet,
)


@pytest.mark.unit
class TestBuildPageSnippet:
    def test_empty_or_none_text_returns_empty(self):
        assert build_page_snippet(None, "anything") == ""
        assert build_page_snippet("", "anything") == ""
        assert build_page_snippet("   \n\t ", "anything") == ""

    def test_match_at_start_has_no_leading_ellipsis(self):
        text = "Budget review notes for the quarter."
        snippet = build_page_snippet(text, "budget")
        assert not snippet.startswith("…")
        assert "budget" in snippet.lower()

    def test_match_in_middle_is_surrounded_by_context(self):
        text = "x" * 300 + " needle " + "y" * 300
        snippet = build_page_snippet(text, "needle")
        assert "needle" in snippet
        assert snippet.startswith("…")
        assert snippet.endswith("…")
        # Leading context is bounded by SNIPPET_LEAD_CHARS (plus the ellipsis char).
        assert snippet.index("needle") <= SNIPPET_LEAD_CHARS + 1

    def test_length_is_capped(self):
        text = "word " * 500
        snippet = build_page_snippet(text, "word")
        assert len(snippet) <= SNIPPET_MAX_LENGTH

    @pytest.mark.parametrize(
        "text,query",
        [
            ("word " * 500, "word"),  # match at the start
            ("x" * 300 + " needle " + "y" * 300, "needle"),  # match in the middle
            ("a" * 500, "absent-term"),  # no content match
            ("b" * 500 + " tail", "tail"),  # match at the very end
        ],
    )
    def test_ellipses_are_paid_for_out_of_the_budget(self, text, query):
        """The ellipsis markers must never push the snippet past max_length."""
        assert len(build_page_snippet(text, query)) <= SNIPPET_MAX_LENGTH

    def test_no_content_match_excerpts_from_start(self):
        text = "The introduction paragraph explains the overall context here."
        snippet = build_page_snippet(text, "term-not-present")
        assert snippet.startswith("The introduction")

    def test_empty_query_excerpts_from_start(self):
        text = "Some leading content that should be previewed."
        snippet = build_page_snippet(text, "")
        assert snippet.startswith("Some leading content")

    def test_whitespace_is_collapsed(self):
        text = "alpha\n\n   beta\t\tgamma"
        snippet = build_page_snippet(text, "beta")
        assert "\n" not in snippet
        assert "  " not in snippet

    def test_short_text_has_no_ellipsis(self):
        text = "tiny doc"
        snippet = build_page_snippet(text, "tiny")
        assert snippet == "tiny doc"

    def test_case_insensitive_match(self):
        text = "The Budget Review is scheduled."
        snippet = build_page_snippet(text, "budget review")
        assert "Budget Review" in snippet

    def test_unicode_expanding_char_keeps_match_in_window(self):
        # "İ".lower() == "i̇" (length 2); indexing text.lower() would drift the
        # window right and could push the match out. The match must survive.
        text = "İ " * 60 + "needle tail"
        snippet = build_page_snippet(text, "needle")
        assert "needle" in snippet

    def test_regex_metacharacters_in_query_are_literal(self):
        text = "Price is $5 (approx) for the item."
        snippet = build_page_snippet(text, "$5 (approx)")
        assert "$5 (approx)" in snippet
