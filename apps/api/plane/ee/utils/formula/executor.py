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
Executor for walking a validated AST and computing the actual result.

None propagation rule:
    If any field value is None, the entire result is None.
    Exception: IF() only evaluates the branch that will be taken.
"""

from datetime import date, datetime
from typing import Any

from .nodes import (
    BinaryOpNode,
    BooleanNode,
    FieldNode,
    FunctionCallNode,
    NumberNode,
    StringNode,
    UnaryOpNode,
)
from .utils import normalise
from .work_item_properties import WorkItemPropertyFormulaConversionPayload


class ExecutionError(Exception):
    pass


class FormulaExecutor:
    def __init__(self, fields: list[WorkItemPropertyFormulaConversionPayload]):
        self._fields: dict[str, WorkItemPropertyFormulaConversionPayload] = {f.normalised_key: f for f in fields}

    def execute(self, node) -> Any:
        if isinstance(node, NumberNode):
            return node.value
        if isinstance(node, StringNode):
            return node.value
        if isinstance(node, BooleanNode):
            return node.value
        if isinstance(node, FieldNode):
            return self._resolve(node.name)
        if isinstance(node, UnaryOpNode):
            return self._exec_unary(node)
        if isinstance(node, BinaryOpNode):
            return self._exec_binary(node)
        if isinstance(node, FunctionCallNode):
            return self._exec_function(node)
        raise ExecutionError(f"Unknown AST node: {type(node).__name__}")

    def _resolve(self, name: str) -> Any:
        """Look up a field by normalised name. Returns None if value is None."""
        key = normalise(name)
        if key not in self._fields:
            raise ExecutionError(
                f"Field '{name}' not found in payload. Available: {[f.field for f in self._fields.values()]}"
            )
        return self._fields[key].value  # None propagates naturally

    def _exec_unary(self, node: UnaryOpNode) -> Any:
        val = self.execute(node.operand)
        return None if val is None else -val

    def _exec_binary(self, node: BinaryOpNode) -> Any:
        left = self.execute(node.left)
        right = self.execute(node.right)
        if left is None or right is None:
            return None

        op = node.op

        if op == "+":
            if isinstance(left, (date, datetime)) and isinstance(right, (int, float)):
                from datetime import timedelta

                return left + timedelta(days=int(right))
            return left + right

        if op == "-":
            if isinstance(left, (date, datetime)) and isinstance(right, (date, datetime)):
                return (left - right).days
            if isinstance(left, (date, datetime)) and isinstance(right, (int, float)):
                from datetime import timedelta

                return left - timedelta(days=int(right))
            return left - right

        if op == "*":
            return left * right
        if op == "/":
            if right == 0:
                raise ExecutionError("Division by zero")
            return left / right

        if op == "&":
            return self._to_str(left) + self._to_str(right)

        if op == "=":
            return left == right
        if op == "!=":
            return left != right
        if op == "<":
            return left < right
        if op == "<=":
            return left <= right
        if op == ">":
            return left > right
        if op == ">=":
            return left >= right

        raise ExecutionError(f"Unknown operator: '{op}'")

    def _exec_function(self, node: FunctionCallNode) -> Any:
        name = node.name

        # IF is special: only evaluate the branch we need
        if name == "IF":
            return self._exec_if(node)

        args = [self.execute(a) for a in node.args]

        # None propagation for all other functions
        if any(a is None for a in args):
            return None

        if name == "ROUND":
            return round(args[0], int(args[1]))
        if name == "ABS":
            return abs(args[0])
        if name == "UPPER":
            return str(args[0]).upper()
        if name == "LOWER":
            return str(args[0]).lower()
        if name == "LEN":
            return len(str(args[0]))
        if name == "CONCAT":
            return "".join(self._to_str(a) for a in args)
        if name == "TODAY":
            return date.today()
        if name == "NOW":
            return datetime.now()

        raise ExecutionError(f"Unknown function: '{name}'")

    def _exec_if(self, node: FunctionCallNode) -> Any:
        condition = self.execute(node.args[0])
        if condition is None:
            return None
        return self.execute(node.args[1]) if condition else self.execute(node.args[2])

    @staticmethod
    def _to_str(value: Any) -> str:
        """Convert a value to string for & concatenation."""
        if isinstance(value, bool):
            return "true" if value else "false"
        if isinstance(value, float):
            return str(value)
        if isinstance(value, (date, datetime)):
            return value.strftime("%Y-%m-%d")
        return str(value)
