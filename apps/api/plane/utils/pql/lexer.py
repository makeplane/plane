# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any

from .ast import PqlError

MAX_QUERY_LENGTH = 2000


class TokenType(str, Enum):
    IDENT = "IDENT"
    STRING = "STRING"
    NUMBER = "NUMBER"
    BOOL = "BOOL"
    EQ = "="
    NEQ = "!="
    GT = ">"
    GTE = ">="
    LT = "<"
    LTE = "<="
    CONTAINS = "~"
    LPAREN = "("
    RPAREN = ")"
    LBRACKET = "["
    RBRACKET = "]"
    COMMA = ","
    AND = "AND"
    OR = "OR"
    NOT = "NOT"
    IN = "IN"
    IS = "IS"
    NULL = "NULL"
    EMPTY = "EMPTY"
    BETWEEN = "BETWEEN"
    EOF = "EOF"


_KEYWORDS: dict[str, TokenType] = {
    "AND": TokenType.AND,
    "OR": TokenType.OR,
    "NOT": TokenType.NOT,
    "IN": TokenType.IN,
    "IS": TokenType.IS,
    "NULL": TokenType.NULL,
    "EMPTY": TokenType.EMPTY,
    "BETWEEN": TokenType.BETWEEN,
}

_NEGATIVE_NUMBER_PREDECESSORS: frozenset[TokenType] = frozenset(
    {
        TokenType.EQ,
        TokenType.NEQ,
        TokenType.GT,
        TokenType.GTE,
        TokenType.LT,
        TokenType.LTE,
        TokenType.LPAREN,
        TokenType.COMMA,
        TokenType.BETWEEN,
        TokenType.AND,
    }
)


@dataclass(frozen=True)
class Token:
    type: TokenType
    value: Any
    pos: int


def tokenize(query: str) -> list[Token]:
    if not isinstance(query, str):
        raise PqlError("PQL query must be a string", position=0)
    if len(query) > MAX_QUERY_LENGTH:
        raise PqlError(
            f"PQL query exceeds maximum length of {MAX_QUERY_LENGTH} characters",
            position=MAX_QUERY_LENGTH,
        )

    tokens: list[Token] = []
    n = len(query)
    i = 0

    while i < n:
        ch = query[i]
        if ch.isspace():
            i += 1
            continue

        start = i

        if ch in ('"', "'"):
            quote = ch
            i += 1
            buf: list[str] = []
            closed = False
            while i < n:
                c = query[i]
                if c == "\\":
                    i += 1
                    if i >= n:
                        raise PqlError("Unterminated string literal", position=start)
                    esc = query[i]
                    if esc == "n":
                        buf.append("\n")
                    elif esc == "t":
                        buf.append("\t")
                    elif esc == "r":
                        buf.append("\r")
                    else:
                        buf.append(esc)
                    i += 1
                elif c == quote:
                    i += 1
                    closed = True
                    break
                else:
                    buf.append(c)
                    i += 1
            if not closed:
                raise PqlError("Unterminated string literal", position=start)
            tokens.append(Token(TokenType.STRING, "".join(buf), start))
            continue

        if ch == "!" and i + 1 < n and query[i + 1] == "=":
            tokens.append(Token(TokenType.NEQ, "!=", start))
            i += 2
            continue
        if ch == ">" and i + 1 < n and query[i + 1] == "=":
            tokens.append(Token(TokenType.GTE, ">=", start))
            i += 2
            continue
        if ch == "<" and i + 1 < n and query[i + 1] == "=":
            tokens.append(Token(TokenType.LTE, "<=", start))
            i += 2
            continue

        if ch == "=":
            tokens.append(Token(TokenType.EQ, "=", start))
            i += 1
            continue
        if ch == ">":
            tokens.append(Token(TokenType.GT, ">", start))
            i += 1
            continue
        if ch == "<":
            tokens.append(Token(TokenType.LT, "<", start))
            i += 1
            continue
        if ch == "~":
            tokens.append(Token(TokenType.CONTAINS, "~", start))
            i += 1
            continue
        if ch == "(":
            tokens.append(Token(TokenType.LPAREN, "(", start))
            i += 1
            continue
        if ch == ")":
            tokens.append(Token(TokenType.RPAREN, ")", start))
            i += 1
            continue
        if ch == "[":
            tokens.append(Token(TokenType.LBRACKET, "[", start))
            i += 1
            continue
        if ch == "]":
            tokens.append(Token(TokenType.RBRACKET, "]", start))
            i += 1
            continue
        if ch == ",":
            tokens.append(Token(TokenType.COMMA, ",", start))
            i += 1
            continue

        can_start_negative = not tokens or tokens[-1].type in _NEGATIVE_NUMBER_PREDECESSORS
        if ch.isdigit() or (ch == "-" and can_start_negative and i + 1 < n and query[i + 1].isdigit()):
            if ch == "-":
                i += 1
            while i < n and query[i].isdigit():
                i += 1
            is_float = False
            if i < n and query[i] == ".":
                is_float = True
                i += 1
                if i >= n or not query[i].isdigit():
                    raise PqlError(f"Invalid number literal {query[start:i]!r}", position=start)
                while i < n and query[i].isdigit():
                    i += 1
            if i < n and (query[i].isalpha() or query[i] == "_"):
                raise PqlError(f"Invalid number token at {query[start : i + 1]!r}", position=start)
            raw_num = query[start:i]
            num_val: int | float = float(raw_num) if is_float else int(raw_num)
            tokens.append(Token(TokenType.NUMBER, num_val, start))
            continue

        if ch in ("+", "-"):
            raise PqlError(
                f"Arithmetic operator {ch!r} is not supported in PQL",
                position=start,
            )

        if ch.isalpha() or ch == "_":
            while i < n and (query[i].isalnum() or query[i] == "_"):
                i += 1
            word = query[start:i]
            upper = word.upper()
            if upper == "TRUE":
                tokens.append(Token(TokenType.BOOL, True, start))
            elif upper == "FALSE":
                tokens.append(Token(TokenType.BOOL, False, start))
            elif upper in _KEYWORDS:
                tokens.append(Token(_KEYWORDS[upper], upper, start))
            else:
                tokens.append(Token(TokenType.IDENT, word, start))
            continue

        raise PqlError(f"Unexpected character {ch!r}", position=start)

    tokens.append(Token(TokenType.EOF, None, n))
    return tokens
