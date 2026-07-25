# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for the page search snippet helper."""

import re

import pytest

from plane.utils import page_search
from plane.utils.page_search import (
    SNIPPET_LEAD_CHARS,
    SNIPPET_MAX_LENGTH,
    build_page_snippet,
)

_ELLIPSIS = "…"


def _reference_snippet(stripped_text, query, max_length=SNIPPET_MAX_LENGTH, lead=SNIPPET_LEAD_CHARS):
    """Straightforward implementation used as an oracle: normalize the whole
    document, then excerpt around the match. The shipped version must agree with
    this while only normalizing a bounded window."""
    if not stripped_text or max_length <= 0:
        return ""
    text = re.sub(r"\s+", " ", stripped_text).strip()
    if not text:
        return ""

    tokens = [re.escape(token) for token in query.split()]
    match = re.search(r"\s+".join(tokens), text, re.IGNORECASE) if tokens else None

    if match is None:
        if len(text) <= max_length:
            return text
        return text[: max_length - len(_ELLIPSIS)] + _ELLIPSIS

    start = max(0, match.start() - lead)
    prefix = _ELLIPSIS if start > 0 else ""
    budget = max_length - len(prefix)
    if start + budget < len(text):
        budget -= len(_ELLIPSIS)
    if budget <= 0:
        return _ELLIPSIS[:max_length]
    end = min(len(text), start + budget)
    suffix = _ELLIPSIS if end < len(text) else ""
    return prefix + text[start:end] + suffix


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

    @pytest.mark.parametrize("max_length", [-5, -1, 0])
    def test_non_positive_max_length_returns_empty(self, max_length):
        """A non-positive budget must yield nothing. Previously the negative
        slice bound (text[:max_length - 1]) returned nearly the whole document."""
        text = "The quarterly budget review covers spend across every team."
        assert build_page_snippet(text, "budget", max_length=max_length) == ""
        assert build_page_snippet(text, "absent-term", max_length=max_length) == ""

    def test_match_is_found_across_whitespace_runs(self):
        """The document is only normalized in a window, so the search itself runs
        against raw text where the query's words may straddle newlines."""
        text = "intro\n\nThe budget\n   review happens Friday."
        snippet = build_page_snippet(text, "budget review")
        assert "budget review" in snippet.lower()
        assert "\n" not in snippet

    def test_only_a_bounded_window_is_normalized(self, monkeypatch):
        """A large document must not be rewritten in full for a single snippet.

        Checked by observing what the whitespace normalizer is handed rather than
        by elapsed time, which would depend on CI hardware and load."""
        real_pattern = page_search._WHITESPACE_RE
        normalized_sizes = []

        class RecordingPattern:
            def sub(self, repl, string):
                normalized_sizes.append(len(string))
                return real_pattern.sub(repl, string)

        monkeypatch.setattr(page_search, "_WHITESPACE_RE", RecordingPattern())

        text = "a" * 5_000_000 + " needle tail"
        snippet = build_page_snippet(text, "needle")

        assert "needle" in snippet
        assert len(snippet) <= SNIPPET_MAX_LENGTH
        assert normalized_sizes, "the normalizer was never called"
        # With the default budget the window is ~1.3 KB; the bound below is loose
        # enough to survive tuning but still orders of magnitude under the 5 MB
        # document, so collapsing everything would fail the test.
        assert max(normalized_sizes) <= 10_000, (
            f"normalizer received {max(normalized_sizes)} characters — the whole document was likely collapsed"
        )

    @pytest.mark.parametrize(
        "text,query",
        [
            ("word " * 500, "word"),
            ("x" * 300 + " needle " + "y" * 300, "needle"),
            ("a" * 500, "absent-term"),
            ("b" * 500 + " tail", "tail"),
            ("   \n\n  leading whitespace then needle here", "needle"),
            ("needle at the very start of the document", "needle"),
            ("trailing match needle   \n\n   ", "needle"),
            ("\n\n".join(["para " * 40] * 30) + " needle", "needle"),
            ("tiny", "tiny"),
            ("no match at all here", "absent"),
            ("İ" * 100 + " needle", "needle"),
        ],
    )
    def test_matches_naive_full_normalization(self, text, query):
        """The windowed implementation must agree with the obvious one that
        normalizes the entire document up front."""
        assert build_page_snippet(text, query) == _reference_snippet(text, query)

    @pytest.mark.parametrize("max_length", range(1, 12))
    def test_small_max_length_stays_within_budget(self, max_length):
        """Tiny budgets degrade to a marker rather than overflowing, for a match
        at the start, a match far into the text, and no match at all."""
        long_text = "z" * 400
        cases = [
            ("budget review is here, " + long_text, "budget"),  # match at start
            (long_text + " budget review", "budget"),  # match far in (leading ellipsis)
            (long_text, "absent-term"),  # no match
        ]
        for text, query in cases:
            snippet = build_page_snippet(text, query, max_length=max_length)
            assert len(snippet) <= max_length, (max_length, query, repr(snippet))

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
