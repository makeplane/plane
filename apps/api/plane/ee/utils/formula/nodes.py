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
nodes.py — AST node definitions. Pure data, zero logic.

To add a new construct: add a new dataclass here.
"""

from dataclasses import dataclass, field
from typing import Any, Union


@dataclass
class NumberNode:
    value: Union[int, float]


@dataclass
class StringNode:
    value: str


@dataclass
class BooleanNode:
    value: bool


@dataclass
class FieldNode:
    """
    A dynamic field reference from {{field_name}}.
    name is the RAW string inside the braces — e.g. "start_date", "Selling Price",
    "wi_cp_5c015e36-011f-4c2f-9633-a0df16900e93".
    Normalisation is done at validation/execution time, not here.
    """

    name: str


@dataclass
class BinaryOpNode:
    """+ - * /  &  = != < <= > >="""

    left: Any
    op: str
    right: Any


@dataclass
class UnaryOpNode:
    """Unary minus: -{{cost_price}}"""

    op: str
    operand: Any


@dataclass
class FunctionCallNode:
    """IF(cond, a, b)  ROUND(x, 2)  TODAY()  UPPER(text)"""

    name: str
    args: list = field(default_factory=list)
