# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from dataclasses import dataclass
from typing import Union


class PqlError(ValueError):
    """Raised when a PQL query cannot be lexed, parsed, or compiled."""

    def __init__(self, message: str, position: int | None = None) -> None:
        self.raw_message = message
        self.position = position
        if position is not None and "position" not in message:
            full_message = f"{message} (at position {position})"
        else:
            full_message = message
        super().__init__(full_message)


@dataclass(frozen=True)
class FieldRef:
    name: str
    custom_property: str | None = None
    pos: int = 0


@dataclass(frozen=True)
class LiteralValue:
    value: str | int | float | bool
    pos: int = 0


@dataclass(frozen=True)
class FunctionCall:
    name: str
    args: tuple[LiteralValue, ...] = ()
    pos: int = 0


ValueNode = Union[LiteralValue, FunctionCall]


@dataclass(frozen=True)
class Comparison:
    field: FieldRef
    op: str
    value: ValueNode
    pos: int = 0


@dataclass(frozen=True)
class InExpr:
    field: FieldRef
    values: tuple[ValueNode, ...] | FunctionCall
    negated: bool = False
    pos: int = 0


@dataclass(frozen=True)
class BetweenExpr:
    field: FieldRef
    low: ValueNode
    high: ValueNode
    pos: int = 0


@dataclass(frozen=True)
class IsNullExpr:
    field: FieldRef
    negated: bool = False
    pos: int = 0


@dataclass(frozen=True)
class IsEmptyExpr:
    field: FieldRef
    negated: bool = False
    pos: int = 0


@dataclass(frozen=True)
class PredicateCall:
    name: str
    args: tuple[LiteralValue, ...] = ()
    pos: int = 0


@dataclass(frozen=True)
class NotExpr:
    operand: Expr
    pos: int = 0


@dataclass(frozen=True)
class AndExpr:
    children: tuple[Expr, ...]
    pos: int = 0


@dataclass(frozen=True)
class OrExpr:
    children: tuple[Expr, ...]
    pos: int = 0


Expr = Union[
    OrExpr,
    AndExpr,
    NotExpr,
    Comparison,
    InExpr,
    BetweenExpr,
    IsNullExpr,
    IsEmptyExpr,
    PredicateCall,
]
