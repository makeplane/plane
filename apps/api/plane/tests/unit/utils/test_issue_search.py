"""Tests for issue search helpers."""

# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.utils.issue_search import build_search_snippet


@pytest.mark.unit
class TestBuildSearchSnippet:
    def test_returns_none_when_query_is_not_in_content(self):
        assert build_search_snippet("A short description", "missing") is None

    def test_returns_normalized_content_when_it_fits(self):
        assert build_search_snippet("  Search   result\ncontent  ", "result") == "Search result content"

    def test_returns_content_when_all_keywords_match_the_description(self):
        content = "The alpha keyword and beta keyword are both present."

        assert build_search_snippet(content, "  alpha   beta ") == content

    def test_centers_on_the_first_matching_keyword(self):
        content = "prefix " + ("x" * 140) + " beta " + ("y" * 140) + " alpha"

        snippet = build_search_snippet(content, "alpha beta")

        assert snippet is not None
        assert "beta" in snippet.lower()

    def test_centers_first_match_and_marks_truncated_edges(self):
        content = "prefix " + ("x" * 140) + " keyword " + ("y" * 140)

        snippet = build_search_snippet(content, "KEYWORD")

        assert snippet is not None
        assert "keyword" in snippet.lower()
        assert snippet.startswith("…")
        assert snippet.endswith("…")
