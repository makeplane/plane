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
PQL Parser — parses a PQL string and returns a PQLResult.

Usage::

    from plane.utils.pql import pql_parse

    result = pql_parse(
        'priority = "high" AND assignee = currentUser()',
        ctx={"request": request, "workspace_slug": "my-workspace"},
    )
    # result.rich_filter  → {"and": [{"priority": "high"}, {"assignee_id": "<uuid>"}]}
"""

from __future__ import annotations

from pathlib import Path

from lark import Lark
from rest_framework.exceptions import ValidationError

from .transformer import PQLResult, PQLTransformer

# Build the Lark parser once at module level (thread-safe, reusable).
_GRAMMAR_PATH = Path(__file__).parent / "grammar.lark"
_parser = Lark(
    _GRAMMAR_PATH.read_text(),
    parser="lalr",
)


def pql_parse(pql_string: str, ctx: dict) -> PQLResult:
    """Parse a PQL query string and return a ``PQLResult``.

    Args:
        pql_string: The PQL query string to parse.
        ctx: Context dict with at least ``request`` and ``workspace_slug``.

    Returns:
        A ``PQLResult`` containing ``rich_filter`` (dict or None).

    Raises:
        ValidationError: If the PQL string is syntactically invalid or
            references unknown fields/functions.
    """
    if not pql_string or not pql_string.strip():
        return PQLResult()

    try:
        tree = _parser.parse(pql_string.strip())
    except Exception as exc:
        raise ValidationError({"pql": f"Invalid PQL syntax: {exc}"}) from exc

    try:
        transformer = PQLTransformer(ctx)
        result = transformer.transform(tree)
    except ValidationError:
        raise
    except Exception as exc:
        raise ValidationError({"pql": f"PQL evaluation error: {exc}"}) from exc

    if not isinstance(result, PQLResult):
        raise ValidationError({"pql": "PQL transformation produced an unexpected result."})

    return result
