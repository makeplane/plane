# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression test for authority-relative open-redirect via next_path.

Root cause: urlparse("///example.com/") returns both scheme and netloc
empty (a quirk of Python's URL parser for exactly-three-or-more leading
slashes), so validate_next_path's "extract only the path component" branch
(gated on scheme or netloc being truthy) never fires, and the original,
unmodified "///example.com/" string passes every remaining check unchanged.
Browsers still resolve a leading "//" as authority-relative against an
http(s) base, so the accepted value silently navigates off-domain.

Fixed by rejecting any next_path starting with "//" outright, after the
existing "must start with /" check.
"""

import pytest

from plane.utils.path_validator import validate_next_path

pytestmark = pytest.mark.unit


class TestValidateNextPathAuthorityRelative:
    @pytest.mark.parametrize(
        # Exactly three or more leading slashes: urlparse() returns both
        # scheme and netloc empty for these (the actual bug — verified
        # directly against Python's urlparse before writing this fix), so
        # the existing "extract only the path component" branch never fires
        # and the raw, still-dangerous string must be caught by the new
        # explicit "//" check instead.
        "malicious_next_path",
        [
            "///example.com/",
            "////example.com/",
            "/////example.com/",
        ],
    )
    def test_rejects_authority_relative_paths_urlparse_misses(self, malicious_next_path):
        assert validate_next_path(malicious_next_path) == "", (
            f"{malicious_next_path!r} must be rejected — a browser resolves a leading '//' "
            "as authority-relative and navigates off-domain regardless of what urlparse() made of it"
        )

    def test_exactly_two_slashes_was_already_safely_downgraded(self):
        """Positive control: urlparse() DOES detect a netloc for exactly two
        leading slashes, so the pre-existing branch already strips this down
        to a harmless same-origin path — this case never needed the new
        check and must keep working exactly as before."""
        assert validate_next_path("//example.com/") == "/"

    @pytest.mark.parametrize(
        "safe_next_path",
        [
            "/workspace/abc",
            "/",
            "/projects/123/issues",
        ],
    )
    def test_accepts_genuine_relative_paths(self, safe_next_path):
        assert validate_next_path(safe_next_path) == safe_next_path

    def test_still_downgrades_absolute_urls_with_a_scheme_to_a_safe_path(self):
        """Positive control: the pre-existing scheme/netloc branch already
        strips the host from a fully-qualified URL, leaving only a harmless
        same-origin path — this fix must not change that behavior."""
        assert validate_next_path("https://evil.com/phish") == "/phish"
        assert validate_next_path("http://evil.com/phish") == "/phish"

    @pytest.mark.parametrize(
        # A tab between each slash defeats both urlparse()'s own netloc
        # detection (verified directly: "/\t/\t/evil.com" -> scheme='',
        # netloc='') AND a literal next_path.startswith("//") check, since
        # the second character is a tab, not a slash. Per the WHATWG URL
        # spec, browsers strip every ASCII tab/CR/LF from a URL before
        # parsing it, so what the browser actually navigates on is
        # "///evil.com" — authority-relative, off-origin — even though this
        # function never sees a literal "//" prefix.
        "obfuscated_next_path",
        [
            "/\t/\t/evil.com",
            "/\r/\r/evil.com",
            "/\n/\n/evil.com",
        ],
    )
    def test_rejects_tab_cr_lf_obfuscated_authority_relative_paths(self, obfuscated_next_path):
        assert validate_next_path(obfuscated_next_path) == "", (
            f"{obfuscated_next_path!r} must be rejected — browsers strip tab/CR/LF before parsing, "
            "so this collapses to an authority-relative '///evil.com' navigation"
        )
