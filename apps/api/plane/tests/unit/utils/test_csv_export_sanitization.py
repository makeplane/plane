# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import csv
from io import StringIO

import pytest

from plane.utils.porters.formatters import CSVFormatter


def _read_rows(content):
    return list(csv.reader(StringIO(content)))


@pytest.mark.unit
class TestPorterCSVFormatterSanitization:
    """CSV exports must not emit formula-triggering values, including in header rows."""

    def test_data_values_are_sanitized(self):
        content = CSVFormatter().encode([{"name": "=1+2"}])
        rows = _read_rows(content)
        assert rows[1][0] == "'=1+2"

    def test_prettified_headers_are_sanitized(self):
        content = CSVFormatter().encode([{"=evil_header": "value"}])
        rows = _read_rows(content)
        assert rows[0][0] == "'=Evil Header"

    def test_raw_headers_are_sanitized(self):
        content = CSVFormatter(prettify_headers=False).encode([{"=evil": "value"}])
        rows = _read_rows(content)
        assert rows[0][0] == "'=evil"
