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
    if isinstance(value, str) and value:
        stripped = value.lstrip()
        if stripped and stripped[0] in _CSV_FORMULA_TRIGGERS:
            return "'" + value
    return value


def sanitize_csv_row(row):
    """Sanitize all values in a CSV row."""
    return [sanitize_csv_value(v) for v in row]
