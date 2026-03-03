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

# Python imports
from enum import Enum, auto


class TokenType(Enum):
    # Literals
    NUMBER = auto()  # 100, 3.14
    STRING = auto()  # "days", " - "
    BOOLEAN = auto()  # TRUE, FALSE

    # Dynamic field reference  {{field_name}}
    FIELD = auto()

    # Math
    PLUS = auto()  # +
    MINUS = auto()  # -
    MULTIPLY = auto()  # *
    DIVIDE = auto()  # /

    # Concatenation
    AMPERSAND = auto()  # &

    # Comparison
    EQ = auto()  # =
    NEQ = auto()  # !=
    LT = auto()  # <
    LTE = auto()  # <=
    GT = auto()  # >
    GTE = auto()  # >=

    # Punctuation
    LPAREN = auto()  # (
    RPAREN = auto()  # )
    COMMA = auto()  # ,

    # Functions
    FUNCTION = auto()  # IF, ROUND, UPPER, TODAY ...

    EOF = auto()


class Token:
    def __init__(self, type: TokenType, value, pos: int):
        self.type = type
        self.value = value
        self.pos = pos

    def __repr__(self):
        return f"Token({self.type.name}, {self.value!r}, pos={self.pos})"
