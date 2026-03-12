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

import logging
from pathlib import Path

from lark import Lark
from rest_framework.exceptions import ValidationError

from .transformer import PQLResult, PQLTransformer

logger = logging.getLogger("plane.api")

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

    # Log the raw PQL string for debugging (but not the transformed result, which may contain sensitive info).
    logger.debug("Parsing PQL query: %r", pql_string)

    try:
        # Parse the PQL string into a parse tree. This may raise exceptions for syntax errors.
        tree = _parser.parse(pql_string.strip())
        logger.debug("PQL parse tree for query %r: %s", pql_string, tree.pretty())
    except Exception as exc:
        logger.warning("PQL syntax error for query %r: %s", pql_string, exc)
        raise ValidationError({"pql": "Invalid PQL query."}) from exc

    try:
        # Log the parse tree for debugging (may be verbose, but useful for diagnosing parsing issues).
        transformer = PQLTransformer(ctx)
        result = transformer.transform(tree)
        logger.debug("PQL transformation result for query %r: %s", pql_string, result)
        # Transform the parse tree into a PQLResult. 
        # This may raise ValidationError if the query references unknown fields/functions.
    except ValidationError:
        raise
    except Exception as exc:
        logger.warning("PQL evaluation error for query %r: %s", pql_string, exc)
        raise ValidationError({"pql": "Invalid PQL query."}) from exc

    if not isinstance(result, PQLResult):
        logger.warning("PQL transformation produced unexpected result for query %r", pql_string)
        raise ValidationError({"pql": "Invalid PQL query."})

    return result
