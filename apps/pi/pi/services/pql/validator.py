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

"""Lightweight PQL syntax validator using the same Lark grammar as the API backend.
An external API to be provided by the API team"""

from __future__ import annotations

from pathlib import Path

from lark import Lark
from lark.exceptions import LarkError

from pi import logger

log = logger.getChild(__name__)

_GRAMMAR_PATH = Path(__file__).resolve().parent / "grammar.lark"

_parser: Lark | None = None


def _get_parser() -> Lark:
    global _parser  # noqa: PLW0603
    if _parser is None:
        if not _GRAMMAR_PATH.exists():
            raise FileNotFoundError(f"PQL grammar not found at {_GRAMMAR_PATH}")
        _parser = Lark(
            _GRAMMAR_PATH.read_text(),
            parser="lalr",
        )
        log.info("PQL syntax validator initialized from %s", _GRAMMAR_PATH)
    return _parser


def is_valid_pql(pql: str) -> bool:
    """Return True if *pql* is syntactically valid PQL, False otherwise.

    This performs syntax-only validation (no field/function resolution) using
    the exact same Lark grammar that the API backend uses for query execution.
    """
    if not pql or not pql.strip():
        return False
    try:
        _get_parser().parse(pql.strip())
        return True
    except LarkError as exc:
        log.debug("PQL syntax validation failed for %r: %s", pql, exc)
        return False
    except Exception as exc:
        log.warning("Unexpected error during PQL syntax validation for %r: %s", pql, exc)
        return False
