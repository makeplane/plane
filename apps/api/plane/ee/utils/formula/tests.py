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

"""
execution_tests.py — run with:  python execution_tests.py
Tests execute_formula() with {{field_name}} syntax.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import date
from .engine import execute_formula
from .work_item_properties import WorkItemPropertyFormulaConversionPayload


def F(field, type_, value=None):
    return WorkItemPropertyFormulaConversionPayload(field=field, type=type_, value=value)


UUID_FIELD = "wi_cp_5c015e36-011f-4c2f-9633-a0df16900e93"

TESTS = [
    # ── Your exact example ─────────────────────────────────────────────────────
    (
        'Original: (start_date - target_date) & " days"',
        '({{start_date}} - {{target_date}}) & " days"',
        [
            F("start_date", "date", date(2024, 1, 13)),
            F("target_date", "date", date(2024, 1, 1)),
        ],
        True,
        "12 days",
    ),
    # ── UUID field name ────────────────────────────────────────────────────────
    (
        "UUID field name",
        f"{{{{ {UUID_FIELD} }}}} + {{{{cost_price}}}}",
        [
            F(UUID_FIELD, "number", 50),
            F("cost_price", "number", 50),
        ],
        True,
        100,
    ),
    # ── Case insensitive matching ──────────────────────────────────────────────
    (
        "{{start_date}} matches payload 'Start Date'",
        '({{start_date}} - {{target_date}}) & " days"',
        [
            F("Start Date", "date", date(2024, 1, 13)),
            F("TARGET_DATE", "date", date(2024, 1, 1)),
        ],
        True,
        "12 days",
    ),
    # ── Profit percentage ──────────────────────────────────────────────────────
    (
        "Profit % with ROUND",
        'ROUND((({{selling_price}} - {{cost_price}}) / {{cost_price}}) * 100, 2) & "%"',
        [
            F("selling_price", "number", 133),
            F("cost_price", "number", 100),
        ],
        True,
        "33.0%",
    ),
    # ── IF ─────────────────────────────────────────────────────────────────────
    (
        "IF: profit path",
        'IF({{selling_price}} > {{cost_price}}, ROUND((({{selling_price}} - {{cost_price}}) / {{cost_price}}) * 100, 2) & "%", "No profit")',  # noqa: E501
        [
            F("selling_price", "number", 133),
            F("cost_price", "number", 100),
        ],
        True,
        "33.0%",
    ),
    (
        "IF: no profit path",
        'IF({{selling_price}} > {{cost_price}}, ROUND((({{selling_price}} - {{cost_price}}) / {{cost_price}}) * 100, 2) & "%", "No profit")',  # noqa: E501
        [
            F("selling_price", "number", 80),
            F("cost_price", "number", 100),
        ],
        True,
        "No profit",
    ),
    # ── Text functions ─────────────────────────────────────────────────────────
    (
        "UPPER + concat",
        'UPPER({{project_name}}) & " (" & {{client_name}} & ")"',
        [
            F("project_name", "text", "website redesign"),
            F("client_name", "text", "Acme Co"),
        ],
        True,
        "WEBSITE REDESIGN (Acme Co)",
    ),
    (
        "LEN",
        "LEN({{project_name}})",
        [F("project_name", "text", "hello")],
        True,
        5,
    ),
    # ── Date arithmetic ────────────────────────────────────────────────────────
    (
        "Date + number",
        "{{start_date}} + 30",
        [F("start_date", "date", date(2024, 1, 1))],
        True,
        date(2024, 1, 31),
    ),
    (
        "Date range string",
        '({{end_date}} - {{start_date}}) & " days (" & ROUND(({{end_date}} - {{start_date}}) / 7, 1) & " weeks)"',
        [
            F("end_date", "date", date(2024, 2, 1)),
            F("start_date", "date", date(2024, 1, 1)),
        ],
        True,
        "31 days (4.4 weeks)",
    ),
    # ── None propagation ───────────────────────────────────────────────────────
    (
        "None value → result is None",
        '({{start_date}} - {{target_date}}) & " days"',
        [
            F("start_date", "date", None),
            F("target_date", "date", date(2024, 1, 1)),
        ],
        True,
        None,
    ),
    # ── Errors ─────────────────────────────────────────────────────────────────
    (
        "Division by zero",
        "{{selling_price}} / {{quantity}}",
        [
            F("selling_price", "number", 100),
            F("quantity", "number", 0),
        ],
        False,
        None,
    ),
    (
        "Unknown field",
        '{{unknown_field}} & " test"',
        [F("selling_price", "number", 100)],
        False,
        None,
    ),
    (
        "Type mismatch",
        "{{project_name}} + {{cost_price}}",
        [
            F("project_name", "text", "Website"),
            F("cost_price", "number", 100),
        ],
        False,
        None,
    ),
    (
        "Unclosed field reference",
        "{{start_date} + 1",
        [F("start_date", "date", date(2024, 1, 1))],
        False,
        None,
    ),
    (
        "Empty field reference",
        "{{}} + 1",
        [F("start_date", "date", date(2024, 1, 1))],
        False,
        None,
    ),
]

# ── Runner ─────────────────────────────────────────────────────────────────────


def run():
    passed = failed = 0
    print(f"\n{'─' * 80}")
    print(f"  execute_formula() with {{{{field}}}} syntax — {len(TESTS)} tests")
    print(f"{'─' * 80}\n")

    for desc, formula, fields, should_succeed, expected in TESTS:
        result = execute_formula(formula, fields)

        ok = (result.success and result.value == expected) if should_succeed else (not result.success)

        symbol = "✅" if ok else "❌"
        if ok:
            passed += 1
            detail = f"→ {repr(result.value)}" if result.success else "→ ERROR (expected)"
        else:
            failed += 1
            if should_succeed and not result.success:
                detail = f"Expected {expected!r}, got ERROR: {result.error}"
            elif not should_succeed and result.success:
                detail = f"Expected FAIL, got {result.value!r}"
            else:
                detail = f"Expected {expected!r}, got {result.value!r}"

        print(f"  {symbol}  {desc:<50}  {detail}")

    print(f"\n{'─' * 80}")
    print(f"  {passed}/{len(TESTS)} passed", end="")
    print("  — All passed ✅" if not failed else f"  — {failed} FAILED ❌")
    print(f"{'─' * 80}\n")
    return failed == 0


if __name__ == "__main__":
    sys.exit(0 if run() else 1)
