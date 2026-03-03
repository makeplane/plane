# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# CSV utility functions for safe export
# Characters that trigger formula evaluation in spreadsheet applications
_CSV_FORMULA_TRIGGERS = frozenset(("=", "+", "-", "@", "\t", "\r", "\n"))


def sanitize_csv_value(value):
    """Sanitize a value for CSV export to prevent formula injection.

    Prefixes string values starting with formula-triggering characters
    with a single quote so spreadsheet applications treat them as text
    instead of evaluating them as formulas.

    See: https://owasp.org/www-community/attacks/CSV_Injection
    """
    if isinstance(value, str) and value and value[0] in _CSV_FORMULA_TRIGGERS:
        return "'" + value
    return value


def sanitize_csv_row(row):
    """Sanitize all values in a CSV row."""
    return [sanitize_csv_value(v) for v in row]
