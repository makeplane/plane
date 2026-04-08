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
PQL Transformer — converts a Lark AST into a rich filter dict.

The transformer produces a ``PQLResult`` containing a single
``rich_filter`` dict that ``ComplexFilterBackend`` can consume directly.
Predicate, relation, and history functions are represented as
``{"fn": {"function_name": args}}`` leaf nodes in the rich filter tree.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from lark import Transformer, v_args

from .constants import (
    ALL_Q_FUNCTIONS,
    CAMEL_TO_SNAKE_FN,
    FIELD_ALIASES,
    FUNCTIONS,
    ISNULL_FALSE_OPERATORS,
    ISNULL_TRUE_OPERATORS,
    NEGATED_OPERATORS,
    OPERATOR_LOOKUP,
    ORDER_BY_ALIASES,
    PQL_MAX_LIMIT,
    PREDICATE_FUNCTIONS,
)

_UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE)

# Operator → lookup suffix for custom property fields.
# Unlike regular fields, eq/neq must use __exact because the backend
# regex customproperty_(<uuid>)__(.+) requires a __<lookup> suffix.
_CF_OPERATOR_LOOKUP = {
    "eq": "__exact",
    "neq": "__exact",
    "gt": "__gt",
    "gte": "__gte",
    "lt": "__lt",
    "lte": "__lte",
    "in_op": "__in",
    "not_in": "__in",
    "contains": "__icontains",
    "is_null": "__isnull",
    "is_not_null": "__isnull",
    "is_empty": "__isnull",
    "is_not_empty": "__isnull",
    "between": "__range",
}


@dataclass
class CfField:
    """Marker for a custom property field reference."""

    property_id: str


@dataclass
class PQLResult:
    """Container for the output of PQL transformation."""

    rich_filter: dict | None = None
    order_by: list | None = None  # list of (django_field, "ASC"|"DESC") tuples
    limit: int | None = None

    def merge(self, other: PQLResult, operator: str = "and") -> PQLResult:
        """Merge two results under a logical operator.

        order_by and limit are NOT merged — they only exist at the
        top-level query node.
        """
        left = self.rich_filter
        right = other.rich_filter

        if left is not None and right is not None:
            return PQLResult(rich_filter={operator: [left, right]})
        return PQLResult(rich_filter=left if left is not None else right)


@v_args(inline=True)
class PQLTransformer(Transformer):
    """Transform PQL parse tree into PQLResult objects."""

    def __init__(self, ctx: dict):
        super().__init__()
        self.ctx = ctx

    # ------------------------------------------------------------------
    # Logical operators
    # ------------------------------------------------------------------

    def and_expr(self, left: PQLResult, right: PQLResult) -> PQLResult:
        return left.merge(right, "and")

    def or_expr(self, left: PQLResult, right: PQLResult) -> PQLResult:
        return left.merge(right, "or")

    def not_expr(self, operand: PQLResult) -> PQLResult:
        if operand.rich_filter is not None:
            return PQLResult(rich_filter={"not": operand.rich_filter})
        return PQLResult()

    def paren_expr(self, inner: PQLResult) -> PQLResult:
        return inner

    def start(self, result: PQLResult) -> PQLResult:
        return result

    # ------------------------------------------------------------------
    # Query: expr? order_clause? limit_clause?
    # ------------------------------------------------------------------

    def query(self, *children) -> PQLResult:
        """Assemble final PQLResult from filter, order, and limit."""
        rich_filter = None
        order_by = None
        limit = None

        for child in children:
            if isinstance(child, PQLResult):
                rich_filter = child.rich_filter
            elif isinstance(child, list):
                order_by = child
            elif isinstance(child, int):
                limit = child

        return PQLResult(rich_filter=rich_filter, order_by=order_by, limit=limit)

    def order_clause(self, *order_fields) -> list:
        """Collect order field tuples into a list."""
        return list(order_fields)

    def order_field(self, field, direction=None) -> tuple:
        """Resolve an order field to (django_field, direction)."""
        if isinstance(field, CfField):
            raise ValueError("Custom property fields cannot be used in ORDER BY")

        field_name = field
        django_field = ORDER_BY_ALIASES.get(field_name)
        if django_field is None:
            raise ValueError(f"Cannot order by field: {field_name}")

        dir_str = direction if direction else "ASC"
        return (django_field, dir_str)

    def asc(self) -> str:
        return "ASC"

    def desc(self) -> str:
        return "DESC"

    def limit_clause(self, token) -> int:
        value = int(str(token))
        if value > PQL_MAX_LIMIT:
            raise ValueError(f"LIMIT cannot exceed {PQL_MAX_LIMIT}")
        return value

    # ------------------------------------------------------------------
    # Conditions: field <op> value
    # ------------------------------------------------------------------

    def _build_condition(self, field, op: str, value: Any) -> PQLResult:
        """Build a PQLResult for a field comparison."""
        if isinstance(field, CfField):
            return self._build_cf_condition(field, op, value)

        field_name = field
        rich_key = FIELD_ALIASES.get(field_name, field_name)

        # Handle "text" pseudo-field: name OR description_stripped
        if rich_key == "text" and op in ("eq", "contains"):
            lookup = "__icontains"
            return PQLResult(
                rich_filter={
                    "or": [
                        {f"name{lookup}": value},
                        {f"description_stripped{lookup}": value},
                    ]
                }
            )

        # Handle "id" pseudo-field: dispatches to fn node
        if field_name == "id" and op in ("eq", "neq", "in_op", "not_in", "contains"):
            fn_value = value if isinstance(value, list) else value
            condition = {"fn": {"work_item_identifier": [op, fn_value]}}
            if op in NEGATED_OPERATORS:
                condition = {"not": {"fn": {"work_item_identifier": [op, fn_value]}}}
            return PQLResult(rich_filter=condition)

        lookup = OPERATOR_LOOKUP.get(op, "")
        filter_key = f"{rich_key}{lookup}"

        # Determine the value
        if op in ISNULL_TRUE_OPERATORS:
            filter_value = True
        elif op in ISNULL_FALSE_OPERATORS:
            filter_value = False
        elif isinstance(value, list):
            # Serialize lists as comma-separated strings so that
            # django_filters' BaseCSVWidget (used by __in and __range
            # filters) can parse them via value.split(",").
            filter_value = ",".join(str(v) for v in value)
        else:
            filter_value = value

        condition = {filter_key: filter_value}

        # Wrap in NOT for negated operators
        if op in NEGATED_OPERATORS:
            condition = {"not": condition}

        return PQLResult(rich_filter=condition)

    def _build_cf_condition(self, cf: CfField, op: str, value: Any) -> PQLResult:
        """Build a PQLResult for a custom property field comparison."""
        lookup = _CF_OPERATOR_LOOKUP.get(op, "__exact")
        filter_key = f"customproperty_{cf.property_id}{lookup}"

        if op in ISNULL_TRUE_OPERATORS:
            filter_value = True
        elif op in ISNULL_FALSE_OPERATORS:
            filter_value = False
        elif isinstance(value, list):
            filter_value = ",".join(str(v) for v in value)
        else:
            filter_value = value

        condition = {filter_key: filter_value}

        if op in NEGATED_OPERATORS:
            condition = {"not": condition}

        return PQLResult(rich_filter=condition)

    def plain_field(self, token) -> str:
        return str(token)

    def cf_field(self, string_token) -> CfField:
        uuid_str = str(string_token)[1:-1]  # strip quotes from ESCAPED_STRING
        if not _UUID_RE.match(uuid_str):
            raise ValueError(f"Invalid UUID in cf field: {uuid_str}")
        return CfField(property_id=uuid_str)

    def cf_val(self, cf: CfField) -> str:
        """Serialize cf field reference as a marker string for fn args."""
        return f"cf:{cf.property_id}"

    def eq(self, field, value) -> PQLResult:
        return self._build_condition(field, "eq", value)

    def neq(self, field, value) -> PQLResult:
        return self._build_condition(field, "neq", value)

    def gt(self, field, value) -> PQLResult:
        return self._build_condition(field, "gt", value)

    def gte(self, field, value) -> PQLResult:
        return self._build_condition(field, "gte", value)

    def lt(self, field, value) -> PQLResult:
        return self._build_condition(field, "lt", value)

    def lte(self, field, value) -> PQLResult:
        return self._build_condition(field, "lte", value)

    def contains(self, field, value) -> PQLResult:
        return self._build_condition(field, "contains", value)

    def in_op(self, field, values) -> PQLResult:
        return self._build_condition(field, "in_op", values)

    def not_in(self, field, values) -> PQLResult:
        return self._build_condition(field, "not_in", values)

    def is_null(self, field) -> PQLResult:
        return self._build_condition(field, "is_null", None)

    def is_not_null(self, field) -> PQLResult:
        return self._build_condition(field, "is_not_null", None)

    def is_empty(self, field) -> PQLResult:
        return self._build_condition(field, "is_empty", None)

    def is_not_empty(self, field) -> PQLResult:
        return self._build_condition(field, "is_not_empty", None)

    def between(self, field, low, high) -> PQLResult:
        return self._build_condition(field, "between", [low, high])

    # ------------------------------------------------------------------
    # Values
    # ------------------------------------------------------------------

    def string_val(self, token) -> str:
        # Strip surrounding quotes from ESCAPED_STRING
        return str(token)[1:-1]

    def number_val(self, token) -> int | float:
        s = str(token)
        return int(s) if "." not in s else float(s)

    def true_val(self) -> bool:
        return True

    def false_val(self) -> bool:
        return False

    def null_val(self) -> None:
        return None

    def value_list(self, *values) -> list:
        return list(values)

    # ------------------------------------------------------------------
    # Function calls (value-producing)
    # ------------------------------------------------------------------

    def func_call(self, name_token, *args) -> Any:
        func_name = str(name_token)
        func_args = args[0] if args else []

        # Value functions return simple values (strings, lists, etc.)
        if func_name in FUNCTIONS:
            return FUNCTIONS[func_name](self.ctx, *func_args)

        # Q-producing functions must be used as standalone predicates
        if func_name in ALL_Q_FUNCTIONS or func_name in PREDICATE_FUNCTIONS:
            raise ValueError(
                f"Function '{func_name}' must be used as a standalone condition, not as a value in a comparison"
            )

        raise ValueError(f"Unknown function: {func_name}")

    def func_args(self, *args) -> list:
        return list(args)

    def func_val(self, result) -> Any:
        """Handle function call used as a value in a condition."""
        return result

    # ------------------------------------------------------------------
    # Predicate functions (standalone boolean conditions)
    # ------------------------------------------------------------------

    def _build_fn_value(self, snake_name: str, func_args: list) -> dict:
        """Build the value dict for an ``fn`` rich filter node."""
        if not func_args:
            return {snake_name: True}
        if len(func_args) == 1:
            return {snake_name: func_args[0]}
        return {snake_name: list(func_args)}

    def predicate_call(self, name_token, *args) -> PQLResult:
        func_name = str(name_token)
        func_args = args[0] if args else []

        snake_name = CAMEL_TO_SNAKE_FN.get(func_name)
        if snake_name is None:
            raise ValueError(f"Unknown predicate function: {func_name}")

        fn_value = self._build_fn_value(snake_name, func_args)
        return PQLResult(rich_filter={"fn": fn_value})
