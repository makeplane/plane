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
Formula engine for validating and executing formulas.
"""

from dataclasses import dataclass, field
from typing import Any, Optional

from .executor import ExecutionError, FormulaExecutor
from .lexer import Lexer, LexerError
from .parser import ParseError, Parser
from .utils import normalise
from .validator import DataType, FormulaValidator, ValidationError
from .work_item_properties import WorkItemPropertyFormulaConversionPayload


@dataclass
class ValidationResult:
    valid: bool
    result_type: Optional[DataType] = None
    error: Optional[str] = None
    referenced_fields: set = field(default_factory=set)


@dataclass
class ExecutionResult:
    success: bool
    result_type: Optional[str] = None
    value: Optional[Any] = None
    error: Optional[str] = None


def _build_field_types(fields: list[WorkItemPropertyFormulaConversionPayload]) -> dict[str, DataType]:
    """
    Converts payload list → {normalised_name: DataType}.
    Normalised keys ensure {{start_date}} matches payload "Start Date".
    """

    result = {}
    for f in fields:
        normalised_field = normalise(str(f.field))
        result[normalised_field] = f.type
    return result


def _collect_referenced_fields(ast) -> set[str]:
    from .nodes import BinaryOpNode, FieldNode, FunctionCallNode, UnaryOpNode

    fields = set()

    def walk(node):
        if isinstance(node, FieldNode):
            fields.add(node.name)
        elif isinstance(node, BinaryOpNode):
            walk(node.left)
            walk(node.right)
        elif isinstance(node, UnaryOpNode):
            walk(node.operand)
        elif isinstance(node, FunctionCallNode):
            for arg in node.args:
                walk(arg)

    walk(ast)
    return fields


def validate_formula(
    formula: str,
    work_item_properties: list[WorkItemPropertyFormulaConversionPayload],
) -> ValidationResult:
    """Validate syntax + types. No values needed."""

    try:
        field_types = _build_field_types(work_item_properties)
        tokens = Lexer(formula).tokenize()
        ast = Parser(tokens).parse()
        result_type = FormulaValidator(field_types).validate(ast)
        return ValidationResult(
            valid=True,
            result_type=result_type.name.lower(),
            referenced_fields=_collect_referenced_fields(ast),
        )
    except (LexerError, ParseError, ValidationError) as e:
        return ValidationResult(valid=False, error=str(e))


def execute_formula(
    formula: str,
    work_item_properties: list[WorkItemPropertyFormulaConversionPayload],
) -> ExecutionResult:
    """Validate AND execute. Returns the computed result."""
    try:
        field_types = _build_field_types(work_item_properties)
        tokens = Lexer(formula).tokenize()
        ast = Parser(tokens).parse()
        result_type = FormulaValidator(field_types).validate(ast)
        value = FormulaExecutor(work_item_properties).execute(ast)
        return ExecutionResult(
            success=True,
            result_type=result_type.name.lower(),
            value=value,
        )
    except (LexerError, ParseError, ValidationError) as e:
        return ExecutionResult(success=False, error=f"Validation error: {e}")
    except ExecutionError as e:
        return ExecutionResult(success=False, error=f"Execution error: {e}")
    except Exception as e:
        return ExecutionResult(success=False, error=f"Unexpected error: {e}")
