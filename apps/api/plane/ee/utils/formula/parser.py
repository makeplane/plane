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
Parser for converting token list into AST.

Operator precedence (lowest → highest):
    1. concat_expr    &
    2. compare_expr   =  !=  <  <=  >  >=
    3. add_expr       +  -
    4. mul_expr       *  /
    5. unary          - (negative)
    6. primary        literals · {{fields}} · function calls · (parens)
"""

from .nodes import (
    BinaryOpNode,
    BooleanNode,
    FieldNode,
    FunctionCallNode,
    NumberNode,
    StringNode,
    UnaryOpNode,
)
from .tokens import Token, TokenType


class ParseError(Exception):
    def __init__(self, message: str, pos: int = None):
        suffix = f" (at position {pos})" if pos is not None else ""
        super().__init__(f"{message}{suffix}")
        self.pos = pos


class Parser:
    def __init__(self, tokens: list[Token]):
        self.tokens = tokens
        self.pos = 0

    def current(self) -> Token:
        return self.tokens[self.pos]

    def eat(self, expected: TokenType) -> Token:
        tok = self.current()
        if tok.type != expected:
            raise ParseError(
                f"Expected {expected.name}, got {tok.type.name} ({tok.value!r})",
                tok.pos,
            )
        self.pos += 1
        return tok

    def match(self, *types: TokenType) -> bool:
        return self.current().type in types

    def parse(self):
        node = self.expression()
        if not self.match(TokenType.EOF):
            tok = self.current()
            raise ParseError(
                f"Unexpected token '{tok.value}' — formula did not end cleanly",
                tok.pos,
            )
        return node

    def expression(self):
        return self.concat_expr()

    def concat_expr(self):
        node = self.compare_expr()
        while self.match(TokenType.AMPERSAND):
            op = self.current().value
            self.pos += 1
            node = BinaryOpNode(left=node, op=op, right=self.compare_expr())
        return node

    COMPARISON_OPS = {
        TokenType.EQ,
        TokenType.NEQ,
        TokenType.LT,
        TokenType.LTE,
        TokenType.GT,
        TokenType.GTE,
    }

    def compare_expr(self):
        node = self.add_expr()
        while self.match(*self.COMPARISON_OPS):
            op = self.current().value
            self.pos += 1
            node = BinaryOpNode(left=node, op=op, right=self.add_expr())
        return node

    def add_expr(self):
        node = self.mul_expr()
        while self.match(TokenType.PLUS, TokenType.MINUS):
            op = self.current().value
            self.pos += 1
            node = BinaryOpNode(left=node, op=op, right=self.mul_expr())
        return node

    def mul_expr(self):
        node = self.unary()
        while self.match(TokenType.MULTIPLY, TokenType.DIVIDE):
            op = self.current().value
            self.pos += 1
            node = BinaryOpNode(left=node, op=op, right=self.unary())
        return node

    def unary(self):
        if self.match(TokenType.MINUS):
            self.pos += 1
            return UnaryOpNode(op="-", operand=self.unary())
        return self.primary()

    def primary(self):
        tok = self.current()

        if tok.type == TokenType.NUMBER:
            self.pos += 1
            return NumberNode(tok.value)

        if tok.type == TokenType.STRING:
            self.pos += 1
            return StringNode(tok.value)

        if tok.type == TokenType.BOOLEAN:
            self.pos += 1
            return BooleanNode(tok.value)

        if tok.type == TokenType.FIELD:
            self.pos += 1
            return FieldNode(tok.value)

        if tok.type == TokenType.FUNCTION:
            return self.function_call()

        if tok.type == TokenType.LPAREN:
            self.eat(TokenType.LPAREN)
            node = self.expression()
            self.eat(TokenType.RPAREN)
            return node

        raise ParseError(
            f"Expected a value, got {tok.type.name} ({tok.value!r})",
            tok.pos,
        )

    def function_call(self) -> FunctionCallNode:
        name_tok = self.eat(TokenType.FUNCTION)
        self.eat(TokenType.LPAREN)
        args = []
        if not self.match(TokenType.RPAREN):
            args.append(self.expression())
            while self.match(TokenType.COMMA):
                self.eat(TokenType.COMMA)
                args.append(self.expression())
        self.eat(TokenType.RPAREN)
        return FunctionCallNode(name=name_tok.value, args=args)
