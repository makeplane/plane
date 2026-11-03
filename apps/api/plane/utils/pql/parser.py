# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from .ast import (
    AndExpr,
    BetweenExpr,
    Comparison,
    Expr,
    FieldRef,
    FunctionCall,
    InExpr,
    IsEmptyExpr,
    IsNullExpr,
    LiteralValue,
    NotExpr,
    OrExpr,
    PqlError,
    PredicateCall,
    ValueNode,
)
from .lexer import Token, TokenType, tokenize

MAX_CONDITIONS = 5
MAX_NESTING_DEPTH = 10

SUPPORTED_FIELDS: frozenset[str] = frozenset(
    {
        "priority",
        "stateGroup",
        "isDraft",
        "isArchived",
        "title",
        "text",
        "id",
        "dueDate",
        "startDate",
        "createdAt",
        "updatedAt",
        "assignee",
        "state",
        "label",
        "cycle",
        "module",
        "project",
        "createdBy",
        "type",
        "mention",
        "subscriber",
    }
)

UNSUPPORTED_EDITION_FIELDS: frozenset[str] = frozenset(
    {
        "milestone",
        "teamspaceProject",
    }
)

KNOWN_FIELDS: frozenset[str] = SUPPORTED_FIELDS | UNSUPPORTED_EDITION_FIELDS
_KNOWN_FIELDS_LOWER: dict[str, str] = {f.lower(): f for f in KNOWN_FIELDS}

ZERO_ARG_DATE_FUNCTIONS: frozenset[str] = frozenset(
    {
        "today",
        "now",
        "startOfDay",
        "endOfDay",
        "startOfWeek",
        "endOfWeek",
        "startOfMonth",
        "endOfMonth",
        "startOfYear",
        "endOfYear",
    }
)

INT_ARG_DATE_FUNCTIONS: frozenset[str] = frozenset(
    {
        "daysAgo",
        "daysFromNow",
        "weeksAgo",
        "weeksFromNow",
        "monthsAgo",
        "monthsFromNow",
    }
)

DATE_FUNCTIONS: frozenset[str] = ZERO_ARG_DATE_FUNCTIONS | INT_ARG_DATE_FUNCTIONS
USER_FUNCTIONS: frozenset[str] = frozenset({"currentUser", "membersOf", "workspaceMembers"})
CYCLE_FUNCTIONS: frozenset[str] = frozenset({"activeCycle", "completedCycles", "upcomingCycles"})
STATE_GROUP_FUNCTIONS: frozenset[str] = frozenset({"openStates", "closedStates", "activeStates"})
VALUE_FUNCTIONS: frozenset[str] = DATE_FUNCTIONS | USER_FUNCTIONS | CYCLE_FUNCTIONS | STATE_GROUP_FUNCTIONS

PREDICATE_FUNCTIONS: frozenset[str] = frozenset(
    {
        "isOverdue",
        "hasNoAssignee",
        "hasNoLabel",
        "isTopLevel",
        "isSubWorkItem",
        "isEpic",
        "hasChildren",
        "hasStartAndDueDates",
        "isDraft",
        "isArchived",
        "isIntake",
    }
)

RELATION_FUNCTIONS: frozenset[str] = frozenset(
    {
        "childOf",
        "parentOf",
        "linkedTo",
        "blockedBy",
        "blocks",
        "duplicateOf",
    }
)

HISTORY_FUNCTIONS: frozenset[str] = frozenset(
    {
        "wasEver",
        "changedFrom",
        "changedTo",
        "changed",
        "updatedBy",
        "commentedBy",
        "fieldChangedBy",
        "wasAssignedTo",
        "changedAfter",
        "changedBefore",
    }
)

_COMPARISON_TOKENS: frozenset[TokenType] = frozenset(
    {
        TokenType.EQ,
        TokenType.NEQ,
        TokenType.GT,
        TokenType.GTE,
        TokenType.LT,
        TokenType.LTE,
        TokenType.CONTAINS,
    }
)


class _Parser:
    def __init__(self, tokens: list[Token]) -> None:
        self.tokens = tokens
        self.idx = 0
        self.condition_count = 0

    def current(self) -> Token:
        return self.tokens[self.idx]

    def peek(self, offset: int = 1) -> Token:
        target = self.idx + offset
        if target >= len(self.tokens):
            return self.tokens[-1]
        return self.tokens[target]

    def advance(self) -> Token:
        tok = self.tokens[self.idx]
        if tok.type != TokenType.EOF:
            self.idx += 1
        return tok

    def expect(self, token_type: TokenType, description: str | None = None) -> Token:
        tok = self.current()
        if tok.type != token_type:
            expected = description or token_type.value
            got = "end of query" if tok.type == TokenType.EOF else repr(tok.value)
            raise PqlError(f"Expected {expected}, got {got}", position=tok.pos)
        return self.advance()

    def _record_condition(self, pos: int) -> None:
        self.condition_count += 1
        if self.condition_count > MAX_CONDITIONS:
            raise PqlError(
                f"PQL query exceeds maximum of {MAX_CONDITIONS} conditions",
                position=pos,
            )

    def _check_depth(self, depth: int, pos: int) -> None:
        if depth > MAX_NESTING_DEPTH:
            raise PqlError(
                f"PQL query exceeds maximum nesting depth of {MAX_NESTING_DEPTH}",
                position=pos,
            )

    def parse(self) -> Expr:
        if self.current().type == TokenType.EOF:
            raise PqlError("PQL query cannot be empty", position=0)
        expr = self._parse_or(depth=0)
        if self.current().type != TokenType.EOF:
            tok = self.current()
            raise PqlError(f"Unexpected token {tok.value!r}", position=tok.pos)
        return expr

    def _parse_or(self, depth: int) -> Expr:
        first = self._parse_and(depth)
        children = [first]
        while self.current().type == TokenType.OR:
            self.advance()
            children.append(self._parse_and(depth))
        if len(children) == 1:
            return first
        return OrExpr(children=tuple(children), pos=first.pos)

    def _parse_and(self, depth: int) -> Expr:
        first = self._parse_not(depth)
        children = [first]
        while self.current().type == TokenType.AND:
            self.advance()
            children.append(self._parse_not(depth))
        if len(children) == 1:
            return first
        return AndExpr(children=tuple(children), pos=first.pos)

    def _parse_not(self, depth: int) -> Expr:
        if self.current().type == TokenType.NOT:
            not_tok = self.advance()
            self._check_depth(depth + 1, not_tok.pos)
            operand = self._parse_not(depth + 1)
            return NotExpr(operand=operand, pos=not_tok.pos)
        return self._parse_primary(depth)

    def _parse_primary(self, depth: int) -> Expr:
        tok = self.current()
        if tok.type == TokenType.LPAREN:
            self._check_depth(depth + 1, tok.pos)
            self.advance()
            if self.current().type == TokenType.RPAREN:
                raise PqlError("Empty parentheses are not allowed", position=tok.pos)
            inner = self._parse_or(depth + 1)
            self.expect(TokenType.RPAREN, "')'")
            return inner
        return self._parse_condition()

    def _parse_condition(self) -> Expr:
        tok = self.current()
        if tok.type != TokenType.IDENT:
            got = "end of query" if tok.type == TokenType.EOF else repr(tok.value)
            raise PqlError(f"Expected field name or function call, got {got}", position=tok.pos)

        ident = tok.value
        pos = tok.pos
        self.advance()

        if self.current().type == TokenType.LPAREN:
            self._record_condition(pos)
            args = self._parse_function_args(ident, pos)
            self._validate_standalone_function(ident, args, pos)
            return PredicateCall(name=ident, args=args, pos=pos)

        field = self._resolve_field(ident, pos)
        self._record_condition(pos)
        return self._parse_field_operation(field)

    def _resolve_field(self, ident: str, pos: int) -> FieldRef:
        if ident == "cf":
            if self.current().type != TokenType.LBRACKET:
                raise PqlError('Custom field must use syntax cf["<property-uuid>"]', position=pos)
            self.advance()
            prop_tok = self.expect(TokenType.STRING, "custom property UUID string")
            if not prop_tok.value:
                raise PqlError("Custom property identifier cannot be empty", position=prop_tok.pos)
            self.expect(TokenType.RBRACKET, "']'")
            return FieldRef(name=f'cf["{prop_tok.value}"]', custom_property=prop_tok.value, pos=pos)

        if ident in KNOWN_FIELDS:
            return FieldRef(name=ident, pos=pos)

        suggestion = _KNOWN_FIELDS_LOWER.get(ident.lower())
        if suggestion:
            raise PqlError(
                f"Unknown field {ident!r}; did you mean {suggestion!r}? Field names are case-sensitive",
                position=pos,
            )
        raise PqlError(f"Unknown field {ident!r}", position=pos)

    def _parse_field_operation(self, field: FieldRef) -> Expr:
        op_tok = self.current()

        if op_tok.type in _COMPARISON_TOKENS:
            self.advance()
            val = self._parse_value()
            return Comparison(field=field, op=op_tok.value, value=val, pos=op_tok.pos)

        if op_tok.type == TokenType.IN:
            self.advance()
            return self._parse_in_rhs(field, negated=False, pos=op_tok.pos)

        if op_tok.type == TokenType.NOT:
            self.advance()
            if self.current().type != TokenType.IN:
                raise PqlError("Expected 'IN' after 'NOT'", position=self.current().pos)
            self.advance()
            return self._parse_in_rhs(field, negated=True, pos=op_tok.pos)

        if op_tok.type == TokenType.IS:
            self.advance()
            negated = False
            if self.current().type == TokenType.NOT:
                negated = True
                self.advance()
            target_tok = self.current()
            if target_tok.type == TokenType.NULL:
                self.advance()
                return IsNullExpr(field=field, negated=negated, pos=op_tok.pos)
            if target_tok.type == TokenType.EMPTY:
                self.advance()
                return IsEmptyExpr(field=field, negated=negated, pos=op_tok.pos)
            got = "end of query" if target_tok.type == TokenType.EOF else repr(target_tok.value)
            raise PqlError(f"Expected 'NULL' or 'EMPTY' after 'IS', got {got}", position=target_tok.pos)

        if op_tok.type == TokenType.BETWEEN:
            self.advance()
            return self._parse_between_rhs(field, pos=op_tok.pos)

        got = "end of query" if op_tok.type == TokenType.EOF else repr(op_tok.value)
        raise PqlError(
            f"Expected comparison operator after field {field.name!r}, got {got}",
            position=op_tok.pos,
        )

    def _parse_in_rhs(self, field: FieldRef, *, negated: bool, pos: int) -> InExpr:
        tok = self.current()
        if tok.type == TokenType.IDENT and self.peek().type == TokenType.LPAREN:
            fn_call = self._parse_value_function()
            return InExpr(field=field, values=fn_call, negated=negated, pos=pos)

        self.expect(TokenType.LPAREN, "'(' or function call after IN")
        if self.current().type == TokenType.RPAREN:
            raise PqlError("IN list cannot be empty", position=self.current().pos)

        values: list[ValueNode] = [self._parse_value()]
        while self.current().type == TokenType.COMMA:
            self.advance()
            values.append(self._parse_value())
        self.expect(TokenType.RPAREN, "')'")

        if len(values) == 1 and isinstance(values[0], FunctionCall):
            return InExpr(field=field, values=values[0], negated=negated, pos=pos)
        return InExpr(field=field, values=tuple(values), negated=negated, pos=pos)

    def _parse_between_rhs(self, field: FieldRef, *, pos: int) -> BetweenExpr:
        if self.current().type == TokenType.LPAREN:
            self.advance()
            low = self._parse_value()
            if self.current().type in (TokenType.COMMA, TokenType.AND):
                self.advance()
            else:
                raise PqlError(
                    "Expected ',' in BETWEEN (low, high)",
                    position=self.current().pos,
                )
            high = self._parse_value()
            self.expect(TokenType.RPAREN, "')'")
            return BetweenExpr(field=field, low=low, high=high, pos=pos)

        low = self._parse_value()
        self.expect(TokenType.AND, "'AND' in BETWEEN low AND high")
        high = self._parse_value()
        return BetweenExpr(field=field, low=low, high=high, pos=pos)

    def _parse_value(self) -> ValueNode:
        tok = self.current()
        if tok.type in (TokenType.STRING, TokenType.NUMBER, TokenType.BOOL):
            self.advance()
            return LiteralValue(value=tok.value, pos=tok.pos)
        if tok.type == TokenType.IDENT and self.peek().type == TokenType.LPAREN:
            return self._parse_value_function()
        if tok.type == TokenType.NULL:
            raise PqlError("Use 'IS NULL' or 'IS NOT NULL' instead of comparing with NULL", position=tok.pos)
        got = "end of query" if tok.type == TokenType.EOF else repr(tok.value)
        raise PqlError(f"Expected value or function call, got {got}", position=tok.pos)

    def _parse_value_function(self) -> FunctionCall:
        tok = self.expect(TokenType.IDENT, "function name")
        fn_name = tok.value
        pos = tok.pos
        args = self._parse_function_args(fn_name, pos)
        self._validate_value_function(fn_name, args, pos)
        return FunctionCall(name=fn_name, args=args, pos=pos)

    def _parse_function_args(self, fn_name: str, pos: int) -> tuple[LiteralValue, ...]:
        self.expect(TokenType.LPAREN, "'('")
        if fn_name in HISTORY_FUNCTIONS:
            # Argument shapes of history functions are not specified; they are rejected later as unavailable.
            level = 1
            while level:
                tok = self.advance()
                if tok.type == TokenType.EOF:
                    raise PqlError("Expected ')'", position=tok.pos)
                level += (tok.type == TokenType.LPAREN) - (tok.type == TokenType.RPAREN)
            return ()
        args: list[LiteralValue] = []
        if self.current().type != TokenType.RPAREN:
            args.append(self._parse_literal_arg(fn_name))
            while self.current().type == TokenType.COMMA:
                self.advance()
                args.append(self._parse_literal_arg(fn_name))
        self.expect(TokenType.RPAREN, "')'")
        return tuple(args)

    def _parse_literal_arg(self, fn_name: str) -> LiteralValue:
        tok = self.current()
        if tok.type in (TokenType.STRING, TokenType.NUMBER, TokenType.BOOL):
            self.advance()
            return LiteralValue(value=tok.value, pos=tok.pos)
        got = "end of query" if tok.type == TokenType.EOF else repr(tok.value)
        raise PqlError(
            f"Invalid argument {got} in function '{fn_name}()'",
            position=tok.pos,
        )

    def _validate_standalone_function(
        self,
        fn_name: str,
        args: tuple[LiteralValue, ...],
        pos: int,
    ) -> None:
        if fn_name in HISTORY_FUNCTIONS:
            return
        if fn_name in PREDICATE_FUNCTIONS:
            if len(args) != 0:
                raise PqlError(f"Function '{fn_name}()' takes no arguments", position=pos)
            return
        if fn_name in RELATION_FUNCTIONS:
            if len(args) != 1 or type(args[0].value) is not str or not args[0].value.strip():
                raise PqlError(
                    f"Function '{fn_name}()' requires a single work item ID or UUID string argument",
                    position=pos,
                )
            return
        if fn_name in VALUE_FUNCTIONS:
            raise PqlError(
                f"Function '{fn_name}()' cannot be used as a standalone condition",
                position=pos,
            )
        raise PqlError(f"Unknown function '{fn_name}'", position=pos)

    def _validate_value_function(
        self,
        fn_name: str,
        args: tuple[LiteralValue, ...],
        pos: int,
    ) -> None:
        if fn_name in HISTORY_FUNCTIONS:
            return
        if fn_name in ZERO_ARG_DATE_FUNCTIONS | CYCLE_FUNCTIONS | STATE_GROUP_FUNCTIONS | {
            "currentUser",
            "workspaceMembers",
        }:
            if len(args) != 0:
                raise PqlError(f"Function '{fn_name}()' takes no arguments", position=pos)
            return
        if fn_name in INT_ARG_DATE_FUNCTIONS:
            if len(args) != 1 or type(args[0].value) is not int or args[0].value < 0:
                raise PqlError(
                    f"Function '{fn_name}()' requires a single non-negative integer argument",
                    position=pos,
                )
            return
        if fn_name == "membersOf":
            if len(args) != 1 or type(args[0].value) is not str:
                raise PqlError(
                    "Function 'membersOf()' requires a single string argument 'project:<uuid>'",
                    position=pos,
                )
            return
        if fn_name in PREDICATE_FUNCTIONS | RELATION_FUNCTIONS:
            raise PqlError(
                f"Standalone function '{fn_name}()' cannot be used as a value",
                position=pos,
            )
        raise PqlError(f"Unknown function '{fn_name}'", position=pos)


def parse_pql(query: str) -> Expr:
    """Tokenize and parse a PQL query string into an AST."""
    tokens = tokenize(query)
    return _Parser(tokens).parse()
