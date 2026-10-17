# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.utils.content_validator import sanitize_html
from plane.utils.description_conflict import is_description_stale


@pytest.mark.unit
class TestIsDescriptionStale:
    """Test the is_description_stale function"""

    def test_identical_description_is_not_stale(self):
        assert is_description_stale("<p>hello</p>", "<p>hello</p>") is False

    def test_changed_description_is_stale(self):
        assert is_description_stale("<p>hello</p>", "<p>hello</p><p>new image</p>") is True

    def test_empty_values_are_equivalent(self):
        assert is_description_stale("", "<p></p>") is False
        assert is_description_stale(None, "") is False
        assert is_description_stale("<p></p>", None) is False
        assert is_description_stale("  <p>hello</p>\n", "<p>hello</p>") is False

    def test_empty_base_against_filled_description_is_stale(self):
        assert is_description_stale("<p></p>", "<p>someone else's text</p>") is True

    def test_base_matching_after_sanitization_is_not_stale(self):
        # The client's last save is stored sanitized, so its own copy may differ from the stored HTML
        base = '<p onclick="alert(1)">hello</p><script>alert(1)</script>'
        stored = sanitize_html(base)
        assert stored != base
        assert is_description_stale(base, stored) is False
