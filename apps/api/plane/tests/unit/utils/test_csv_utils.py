# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import pytest
from plane.utils.csv_utils import sanitize_csv_row, sanitize_csv_value


@pytest.mark.unit
class TestSanitizeCsvValue:
    """Test the sanitize_csv_value function"""

    def test_equals_trigger(self):
        assert sanitize_csv_value("=SUM(A1)") == "'=SUM(A1)"

    def test_plus_trigger(self):
        assert sanitize_csv_value("+1234567890") == "'+1234567890"

    def test_minus_trigger(self):
        assert sanitize_csv_value("-1+1") == "'-1+1"

    def test_at_trigger(self):
        assert sanitize_csv_value("@SUM(A1)") == "'@SUM(A1)"

    def test_tab_trigger(self):
        assert sanitize_csv_value("\t=CMD('calc')") == "'\t=CMD('calc')"

    def test_carriage_return_trigger(self):
        assert sanitize_csv_value("\r=CMD('calc')") == "'\r=CMD('calc')"

    def test_newline_trigger(self):
        assert sanitize_csv_value("\n=CMD('calc')") == "'\n=CMD('calc')"

    def test_safe_string_unchanged(self):
        assert sanitize_csv_value("Hello world") == "Hello world"

    def test_empty_string_unchanged(self):
        assert sanitize_csv_value("") == ""

    def test_none_unchanged(self):
        assert sanitize_csv_value(None) is None

    def test_integer_unchanged(self):
        assert sanitize_csv_value(42) == 42

    def test_float_unchanged(self):
        assert sanitize_csv_value(3.14) == 3.14

    def test_boolean_unchanged(self):
        assert sanitize_csv_value(True) is True

    def test_already_sanitized_value(self):
        """A value that was previously sanitized gets double-prefixed, which is safe."""
        assert sanitize_csv_value("'=SUM(A1)") == "'=SUM(A1)"

    def test_trigger_char_only(self):
        assert sanitize_csv_value("=") == "'="
        assert sanitize_csv_value("+") == "'+"
        assert sanitize_csv_value("-") == "'-"
        assert sanitize_csv_value("@") == "'@"

    def test_trigger_char_mid_string(self):
        """Trigger characters that appear after the first position are safe."""
        assert sanitize_csv_value("A=B") == "A=B"
        assert sanitize_csv_value("foo+bar") == "foo+bar"
        assert sanitize_csv_value("user@example.com") == "user@example.com"

    def test_leading_space_with_trigger(self):
        """Excel trims whitespace before evaluating; leading spaces must be caught."""
        assert sanitize_csv_value(" =SUM(A1)") == "' =SUM(A1)"

    def test_multiple_leading_spaces_with_trigger(self):
        assert sanitize_csv_value("   +cmd") == "'   +cmd"

    def test_leading_space_safe_value(self):
        """Leading spaces followed by a non-trigger character are left alone."""
        assert sanitize_csv_value("  hello") == "  hello"

    def test_whitespace_only_unchanged(self):
        """A string of only spaces has no non-whitespace trigger to match."""
        assert sanitize_csv_value("   ") == "   "

    def test_multiline_payload(self):
        """Real-world multi-line injection payload."""
        payload = "=HYPERLINK(\"http://evil.com\",\"Click\")"
        assert sanitize_csv_value(payload) == "'" + payload


@pytest.mark.unit
class TestSanitizeCsvRow:
    """Test the sanitize_csv_row function"""

    def test_mixed_row(self):
        row = ["Name", "=SUM(A1)", 42, None, "+cmd"]
        assert sanitize_csv_row(row) == ["Name", "'=SUM(A1)", 42, None, "'+cmd"]

    def test_empty_row(self):
        assert sanitize_csv_row([]) == []

    def test_all_safe_values(self):
        row = ["Alice", "Bob", "Charlie"]
        assert sanitize_csv_row(row) == ["Alice", "Bob", "Charlie"]

    def test_all_trigger_values(self):
        row = ["=a", "+b", "-c", "@d"]
        assert sanitize_csv_row(row) == ["'=a", "'+b", "'-c", "'@d"]

    def test_header_like_row(self):
        """Headers derived from custom field labels could contain triggers."""
        row = ["Issue ID", "Priority", "=Custom Formula Field"]
        assert sanitize_csv_row(row) == ["Issue ID", "Priority", "'=Custom Formula Field"]
