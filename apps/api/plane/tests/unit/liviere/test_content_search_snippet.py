# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Fragments of content search results (plane/liviere/search/queries.py) and parameter rules. Made-up texts.

import pytest

from plane.liviere.search.privacy import is_private_api_path
from plane.liviere.search.queries import SearchError, parse_params, snippet


@pytest.mark.unit
class TestSnippet:
    def test_whole_text_when_short(self):
        assert snippet("Limit of 60 requests", "60 req") == ("Limit of 60 requests", [9, 15])

    def test_cut_on_both_sides(self):
        text = "x" * 100 + "needle" + "y" * 100
        fragment, (start, end) = snippet(text, "needle", radius=10)
        assert fragment == "…" + "x" * 10 + "needle" + "y" * 10 + "…"
        assert fragment[start:end] == "needle"

    def test_cut_only_at_the_end(self):
        fragment, highlight = snippet("needle " + "z" * 50, "needle", radius=5)
        assert fragment == "needle zzzz…" and highlight == [0, 6]

    def test_case_insensitive_with_polish_letters(self):
        fragment, (start, end) = snippet("Limit 60 zapytań na minutę", "ZAPYTAŃ")
        assert fragment[start:end] == "zapytań"

    def test_whitespace_is_collapsed(self):
        fragment, (start, end) = snippet("first\n\n  line   and\tsecond", "line and")
        assert fragment == "first line and second" and fragment[start:end] == "line and"

    def test_spaces_at_the_cut_are_trimmed(self):
        assert snippet("aaaa      needle      bbbb", "needle", radius=1) == ("…needle…", [1, 7])

    def test_no_match_gives_the_start(self):
        assert snippet("abc " * 100, "zzz", radius=5) == ("abc abc ab…", None)
        assert snippet("", "zzz") == ("", None)

    def test_whole_title(self):
        title = "A" * 300 + " needle"
        assert snippet(title, "needle", radius=None) == (title, [301, 307])

    def test_regex_characters_are_literal(self):
        assert snippet("price (50%) [net]", "(50%)")[1] == [6, 11]


@pytest.mark.unit
class TestParams:
    def test_defaults(self):
        assert parse_params({"q": "  rate limit "}) == {
            "q": "rate limit",
            "project": None,
            "limit": 20,
            "archived": True,
        }

    def test_values(self):
        params = parse_params({"q": "abc", "project": " LS ", "limit": "7", "archived": False})
        assert params == {"q": "abc", "project": "LS", "limit": 7, "archived": False}

    @pytest.mark.parametrize("data", [None, [], {"q": "ab"}, {"q": "abc", "limit": 1.5}, {"q": "abc", "archived": 0}])
    def test_errors(self, data):
        with pytest.raises(SearchError):
            parse_params(data)


@pytest.mark.unit
def test_private_paths():
    assert is_private_api_path("/api/v1/workspaces/liviere-studio/liviere/search/")
    assert not is_private_api_path("/api/v1/workspaces/liviere-studio/projects/")
    assert not is_private_api_path("/api/workspaces/liviere-studio/liviere/search/")
    assert not is_private_api_path(None)
