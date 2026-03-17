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
validator.py — walks the AST, infers and checks types.

Extension points:
  New field type    → add to DataType enum
  New operator rule → add a row to OP_TYPE_RULES
  New function      → add entry to FUNCTION_REGISTRY + name to FUNCTION_NAMES in lexer.py
"""

from enum import Enum, auto

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


class DataType(Enum):
    NUMBER = auto()
    TEXT = auto()
    DATE = auto()
    BOOLEAN = auto()


N = DataType.NUMBER
T = DataType.TEXT
D = DataType.DATE
B = DataType.BOOLEAN

# ── Operator type rules ────────────────────────────────────────────────────────
# (operator, left_type, right_type) → result_type
# Add new combinations here — nothing else needs changing.

OP_TYPE_RULES: dict[tuple, DataType] = {
    # Math
    ("+", N, N): N,
    ("-", N, N): N,
    ("*", N, N): N,
    ("/", N, N): N,
    # Date arithmetic
    ("-", D, D): N,  # date - date = days
    ("+", D, N): D,  # date + n    = shifted date
    ("-", D, N): D,  # date - n    = shifted date
    # Concatenation
    ("&", T, T): T,
    ("&", N, T): T,
    ("&", T, N): T,
    ("&", D, T): T,
    ("&", T, D): T,
    ("&", N, N): T,
    ("&", B, T): T,
    ("&", T, B): T,
    # Numeric comparisons
    ("=", N, N): B,
    ("!=", N, N): B,
    ("<", N, N): B,
    ("<=", N, N): B,
    (">", N, N): B,
    (">=", N, N): B,
    # Date comparisons
    ("=", D, D): B,
    ("!=", D, D): B,
    ("<", D, D): B,
    ("<=", D, D): B,
    (">", D, D): B,
    (">=", D, D): B,
    # Text comparisons
    ("=", T, T): B,
    ("!=", T, T): B,
    # Boolean comparisons
    ("=", B, B): B,
    ("!=", B, B): B,
}

# ── Function registry ──────────────────────────────────────────────────────────

FUNCTION_REGISTRY: dict[str, dict] = {
    "IF": {"arg_types": [B, None, None], "return_type": None, "special": "if"},
    "ROUND": {"arg_types": [N, N], "return_type": N},
    "ABS": {"arg_types": [N], "return_type": N},
    "UPPER": {"arg_types": [T], "return_type": T},
    "LOWER": {"arg_types": [T], "return_type": T},
    "LEN": {"arg_types": [T], "return_type": N},
    "CONCAT": {"arg_types": None, "return_type": T, "special": "concat"},
    "TODAY": {"arg_types": [], "return_type": D},
    "NOW": {"arg_types": [], "return_type": D},
}


class ValidationError(Exception):
    pass


class FormulaValidator:
    """
    Recursively walks an AST and returns the DataType of the root expression.

    field_types must have NORMALISED keys (underscore→space, lowercase).
    The engine.py handles normalising the payload before passing here.
    We normalise node.name at lookup time to match.
    """

    def __init__(self, field_types: dict[str, DataType]):
        self.field_types = field_types

    def validate(self, node) -> DataType:
        if isinstance(node, NumberNode):
            return N
        if isinstance(node, StringNode):
            return T
        if isinstance(node, BooleanNode):
            return B
        if isinstance(node, FieldNode):
            return self._validate_field(node)
        if isinstance(node, UnaryOpNode):
            return self._validate_unary(node)
        if isinstance(node, BinaryOpNode):
            return self._validate_binary(node)
        if isinstance(node, FunctionCallNode):
            return self._validate_function(node)
        raise ValidationError(f"Unknown AST node: {type(node).__name__}")

    def _validate_field(self, node: FieldNode) -> DataType:
        # normalise() here matches the normalised keys built by engine._build_field_types()
        key = normalise(node.name)
        if key not in self.field_types:
            raise ValidationError(
                f"Unknown field '{{{{ {node.name} }}}}'. Available fields: {sorted(self.field_types.keys())}"
            )
        return self.field_types[key]

    def _validate_unary(self, node: UnaryOpNode) -> DataType:
        t = self.validate(node.operand)
        if t != N:
            raise ValidationError(f"Unary '-' requires a NUMBER, got {t.name}")
        return N

    def _validate_binary(self, node: BinaryOpNode) -> DataType:
        left_type = self.validate(node.left)
        right_type = self.validate(node.right)
        key = (node.op, left_type, right_type)
        if key not in OP_TYPE_RULES:
            raise ValidationError(
                f"Cannot apply '{node.op}' to {left_type.name} and {right_type.name}. "
                f"Hint: {_op_hint(node.op, left_type, right_type)}"
            )
        return OP_TYPE_RULES[key]

    def _validate_function(self, node: FunctionCallNode) -> DataType:
        name = node.name
        if name not in FUNCTION_REGISTRY:
            raise ValidationError(f"Unknown function '{name}'. Supported: {sorted(FUNCTION_REGISTRY.keys())}")
        spec = FUNCTION_REGISTRY[name]
        if spec.get("special") == "if":
            return self._validate_if(node)
        if spec.get("special") == "concat":
            return self._validate_concat(node)

        expected = spec["arg_types"]
        if len(node.args) != len(expected):
            raise ValidationError(f"{name}() expects {len(expected)} argument(s), got {len(node.args)}")
        for i, (arg, exp_type) in enumerate(zip(node.args, expected), start=1):
            actual = self.validate(arg)
            if exp_type is not None and actual != exp_type:
                raise ValidationError(f"{name}(): argument {i} must be {exp_type.name}, got {actual.name}")
        return spec["return_type"]

    def _validate_if(self, node: FunctionCallNode) -> DataType:
        if len(node.args) != 3:
            raise ValidationError(
                f"IF() requires exactly 3 arguments: IF(condition, true_value, false_value). Got {len(node.args)}."
            )
        cond_type = self.validate(node.args[0])
        true_type = self.validate(node.args[1])
        false_type = self.validate(node.args[2])
        if cond_type != B:
            raise ValidationError(
                f"IF() condition must be BOOLEAN, got {cond_type.name}. "
                f"Hint: use a comparison like '{{{{selling_price}}}} > {{{{cost_price}}}}'"
            )
        if true_type != false_type:
            raise ValidationError(
                f"IF() branches must return the same type. "
                f"True branch is {true_type.name}, false branch is {false_type.name}."
            )
        return true_type

    def _validate_concat(self, node: FunctionCallNode) -> DataType:
        if len(node.args) < 2:
            raise ValidationError("CONCAT() requires at least 2 arguments")
        for i, arg in enumerate(node.args, start=1):
            t = self.validate(arg)
            if t != T:
                raise ValidationError(f"CONCAT(): argument {i} must be TEXT, got {t.name}")
        return T


def _op_hint(op: str, left: DataType, right: DataType) -> str:
    if op in ("+", "-", "*", "/") and T in (left, right):
        return "Math operators don't work on text. Use & to join text."
    if op == "+" and left == D and right == D:
        return "Can't add two dates. Add a NUMBER to a DATE to shift it forward."
    if op in ("<", "<=", ">", ">=") and T in (left, right):
        return "Text can only be compared with = or !="
    return "Check that both sides of the operator are compatible types."
