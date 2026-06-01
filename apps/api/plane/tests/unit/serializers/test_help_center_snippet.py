# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.app.serializers.help_center import SNIPPET_WINDOW, build_search_snippet
from plane.db.models.help_center import fold_accents


@pytest.mark.unit
class TestBuildSearchSnippet:
    """Search snippet is centered on the (accent-folded) match so the result row
    shows why it matched, with a head-of-body fallback when that is not possible."""

    def test_empty_body_returns_empty(self):
        assert build_search_snippet("", fold_accents("anything")) == ""
        assert build_search_snippet(None, fold_accents("anything")) == ""

    def test_match_at_start_returns_head_without_leading_ellipsis(self):
        body = "Phần mở đầu nói về cấu hình. " * 10
        result = build_search_snippet(body, fold_accents("phần"))
        assert not result.startswith("… ")
        assert result == body[:SNIPPET_WINDOW]

    def test_deep_match_is_centered_and_contains_the_term(self):
        body = "x" * 60 + " mục tiêu phê duyệt ngân sách nội bộ " + "y" * 200
        result = build_search_snippet(body, fold_accents("phê duyệt"))
        assert result.startswith("… ")
        assert "phê duyệt" in result
        assert result.endswith("…")
        # bounded to the window (+ the two ellipsis affixes)
        assert len(result) <= SNIPPET_WINDOW + 4

    def test_accent_insensitive_query_matches_accented_body(self):
        body = "x" * 60 + " cấu hình ngân sách phê duyệt nội bộ " + "y" * 200
        # user types without diacritics
        result = build_search_snippet(body, fold_accents("ngan sach"))
        assert "ngân sách" in result

    def test_title_only_match_falls_back_to_head(self):
        # term is in the title (search_text) but not the body -> head of body
        body = "Nội dung không chứa từ khoá của tiêu đề ở đây. " * 5
        result = build_search_snippet(body, fold_accents("xyzkhongton"))
        assert result == body[:SNIPPET_WINDOW]

    def test_short_body_shown_in_full(self):
        body = "Một đoạn ngắn nói về phê duyệt."
        result = build_search_snippet(body, fold_accents("phê duyệt"))
        assert "phê duyệt" in result
        assert not result.endswith("…")
