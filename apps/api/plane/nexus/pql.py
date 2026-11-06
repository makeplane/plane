# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""PQL (Plane Query Language) for work item querysets.

The grammar is the one the MCP documents to agents (apps/mcp/plane_mcp/pql_reference.py);
plane-sdk passes it as the `pql` query param.

    expr       := or_expr
    or_expr    := and_expr (OR and_expr)*
    and_expr   := not_expr (AND not_expr)*
    not_expr   := NOT not_expr | primary
    primary    := "(" expr ")" | function "(" args ")" | field operator
    field      := name | cf["<property-uuid>"]
    operator   := (= | != | > | >= | < | <= | ~) value
                | [NOT] IN (list | list-function)
                | IS [NOT] (NULL | EMPTY)
                | BETWEEN value AND value | BETWEEN "(" value "," value ")"
    value      := "string" | 'string' | number | true | false | function "(" args ")"

Precedence is NOT > AND > OR. Keywords are case-insensitive, and so are field and
function names. An invalid query raises PQLError naming the problem; views answer
it with 400 {"error": msg, "pql": [msg]}, the shape the MCP turns into a
correctable answer.

Custom properties (cf["<uuid>"]) compile against plane.nexus WorkItemPropertyValue;
another store can take over with `register_custom_property_filter`.
"""

from __future__ import annotations

import calendar
import re
import uuid
from dataclasses import dataclass, field, replace
from datetime import date, datetime, time, timedelta
from datetime import timezone as dt_timezone
from typing import Any, Callable
from zoneinfo import ZoneInfo

from django.db.models import CharField, F, Q, QuerySet, Value
from django.db.models.functions import Cast, Concat
from django.utils import timezone

__all__ = [
    "PQLError",
    "MAX_CONDITIONS",
    "FIELDS",
    "apply_pql",
    "parse_pql",
    "pql_fields",
    "register_custom_property_filter",
]

# The documented limit is 5. The MCP's own `count` adds a `project = "..."`
# condition to the caller's query, so a hard 5 would refuse a valid 5-condition
# query the agent wrote. Twice the documented limit still bounds the SQL.
MAX_CONDITIONS = 10
MAX_LENGTH = 4000
# Parentheses and NOTs nest at most this deep; the parser and compiler recurse per level.
MAX_DEPTH = 32
# daysAgo(n) and the like: up to n = 10000 every result stays a valid date.
MAX_FUNCTION_ARG = 10000
# Dates PQL compares; the margins keep a day window and any timezone shift in range.
MIN_YEAR, MAX_YEAR = 2, 9998


class PQLError(ValueError):
    """An invalid PQL string. Views answer 400 {"error": str(exc), "pql": [str(exc)]}."""


# --------------------------------------------------------------------------- tokens

_KEYWORDS = {"AND", "OR", "NOT", "IN", "IS", "NULL", "EMPTY", "BETWEEN", "TRUE", "FALSE"}
_OPERATORS = ("!=", ">=", "<=", "=", ">", "<", "~")


@dataclass(frozen=True)
class Token:
    kind: str  # STRING NUMBER NAME KEYWORD OP ( ) [ ] , EOF
    value: Any
    pos: int

    def describe(self) -> str:
        if self.kind == "EOF":
            return "the end of the query"
        if self.kind == "STRING":
            return f'"{self.value}"'
        return f"'{self.value}'"


def _expects_value(tokens: list[Token]) -> bool:
    """A leading '-' is a negative number only where a value can start."""
    if not tokens:
        return True
    last = tokens[-1]
    return last.kind in ("OP", "(", ",") or (last.kind == "KEYWORD" and last.value in ("AND", "BETWEEN", "IN"))


def _is_digit(ch: str) -> bool:
    return "0" <= ch <= "9"


def _is_letter(ch: str) -> bool:
    return ch.isascii() and ch.isalpha()


def _tokenize(text: str) -> list[Token]:
    tokens: list[Token] = []
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if ch.isspace():
            i += 1
            continue
        if ch in "\"'":
            quote, start, i = ch, i, i + 1
            out = []
            while i < n and text[i] != quote:
                if text[i] == "\\" and i + 1 < n:
                    i += 1
                out.append(text[i])
                i += 1
            if i >= n:
                raise PQLError(f"Unterminated string starting at position {start}: add the closing {quote}.")
            tokens.append(Token("STRING", "".join(out), start))
            i += 1
            continue
        if _is_digit(ch) or (ch == "-" and i + 1 < n and _is_digit(text[i + 1]) and _expects_value(tokens)):
            literal = re.match(r"-?[0-9]+(\.[0-9]+)?", text[i:]).group(0)
            tokens.append(Token("NUMBER", float(literal) if "." in literal else int(literal), i))
            i += len(literal)
            if i < n and (text[i].isalpha() or text[i] in "_-"):
                raise PQLError(
                    f"Unexpected '{text[i]}' after the number at position {i - len(literal)}. "
                    'Quote dates and identifiers, e.g. "2024-01-31" or "WEB-5".'
                )
            continue
        if _is_letter(ch) or ch == "_":
            word = re.match(r"[A-Za-z_][A-Za-z0-9_]*", text[i:]).group(0)
            kind = "KEYWORD" if word.upper() in _KEYWORDS else "NAME"
            tokens.append(Token(kind, word.upper() if kind == "KEYWORD" else word, i))
            i += len(word)
            continue
        op = next((o for o in _OPERATORS if text.startswith(o, i)), None)
        if op:
            tokens.append(Token("OP", op, i))
            i += len(op)
            continue
        if ch in "()[],":
            tokens.append(Token(ch, ch, i))
            i += 1
            continue
        if ch == "!":
            raise PQLError(f"Unexpected '!' at position {i}: use != for not-equal, or NOT before a condition.")
        if ch in "+-":
            raise PQLError(
                f"Unexpected '{ch}' at position {i}: PQL has no date arithmetic. "
                "Use daysAgo(n), daysFromNow(n), weeksAgo(n) and the like instead."
            )
        if ch in "&|":
            raise PQLError(f"Unexpected '{ch}' at position {i}: use AND / OR.")
        if not ch.isascii():
            raise PQLError(
                f"Unexpected character '{ch}' at position {i}. Field and function names are plain ASCII; "
                'put any other text in quotes, e.g. name ~ "título".'
            )
        raise PQLError(f"Unexpected character '{ch}' at position {i}.")
    tokens.append(Token("EOF", None, n))
    return tokens


# --------------------------------------------------------------------------- AST


@dataclass
class Literal:
    value: Any  # str | int | float | bool
    pos: int


@dataclass
class Call:
    name: str  # canonical name
    args: list
    pos: int


@dataclass
class ListValue:
    items: list
    pos: int


@dataclass
class Compare:
    field: str  # canonical field name, or "cf"
    op: str  # = != > >= < <= ~ "in" "not in" "is null" "is not null" "is empty" "is not empty" "between"
    value: Any
    pos: int
    property_id: str | None = None


@dataclass
class Predicate:
    call: Call


@dataclass
class BoolOp:
    op: str  # AND | OR
    children: list


@dataclass
class Not:
    child: Any


# --------------------------------------------------------------------------- vocabulary


@dataclass(frozen=True)
class FieldSpec:
    kind: str  # enum bool text identifier date datetime uuid
    column: str = ""
    values: tuple = ()
    user: bool = False  # a user UUID field: accepts currentUser()/membersOf()/workspaceMembers()


PRIORITIES = ("urgent", "high", "medium", "low", "none")
STATE_GROUPS = ("backlog", "unstarted", "started", "completed", "cancelled")

FIELDS: dict[str, FieldSpec] = {
    "priority": FieldSpec("enum", "priority", PRIORITIES),
    "stateGroup": FieldSpec("enum", "state__group", STATE_GROUPS),
    "isDraft": FieldSpec("bool", "is_draft"),
    "isArchived": FieldSpec("bool", "archived_at"),
    "title": FieldSpec("text", "name"),
    "text": FieldSpec("text", "name"),
    "id": FieldSpec("identifier"),
    "dueDate": FieldSpec("date", "target_date"),
    "startDate": FieldSpec("date", "start_date"),
    "createdAt": FieldSpec("datetime", "created_at"),
    "updatedAt": FieldSpec("datetime", "updated_at"),
    "assignee": FieldSpec("uuid", "assignee", user=True),
    "state": FieldSpec("uuid", "state_id"),
    "label": FieldSpec("uuid", "label"),
    "cycle": FieldSpec("uuid", "cycle"),
    "module": FieldSpec("uuid", "module"),
    "project": FieldSpec("uuid", "project_id"),
    "createdBy": FieldSpec("uuid", "created_by_id", user=True),
    "type": FieldSpec("uuid", "type_id"),
    "milestone": FieldSpec("uuid", "milestone"),
    "mention": FieldSpec("uuid", "mention", user=True),
    "subscriber": FieldSpec("uuid", "subscriber", user=True),
    "teamspaceProject": FieldSpec("uuid", "teamspace_project"),
}
_FIELD_LOOKUP = {name.lower(): name for name in FIELDS}
_MANY_VALUED = ("assignee", "label", "cycle", "module", "mention", "subscriber", "milestone")

_DATE_OPS = {"=", "!=", ">", ">=", "<", "<=", "between", "is null", "is not null", "is empty", "is not empty"}
_OPS_BY_KIND = {
    "enum": {"=", "!=", "in", "not in"},
    "bool": {"=", "!="},
    "text": {"=", "!=", "~", "is null", "is not null", "is empty", "is not empty"},
    "identifier": {"=", "!=", "~", "in", "not in"},
    "date": _DATE_OPS,
    "datetime": _DATE_OPS,
    "uuid": {"=", "!=", "in", "not in", "is null", "is not null", "is empty", "is not empty"},
}

DATE_FUNCTIONS = {
    "today": 0, "now": 0, "startOfDay": 0, "endOfDay": 0, "startOfWeek": 0, "endOfWeek": 0,
    "startOfMonth": 0, "endOfMonth": 0, "startOfYear": 0, "endOfYear": 0,
    "daysAgo": 1, "daysFromNow": 1, "weeksAgo": 1, "weeksFromNow": 1, "monthsAgo": 1, "monthsFromNow": 1,
}  # fmt: skip
USER_FUNCTIONS = {"currentUser": 0, "membersOf": 1, "workspaceMembers": 0}
CYCLE_FUNCTIONS = ("activeCycle", "completedCycles", "upcomingCycles")
STATE_FUNCTIONS = {
    "openStates": ("backlog", "unstarted", "started"),
    "closedStates": ("completed", "cancelled"),
    "activeStates": ("unstarted", "started"),
}
PREDICATES = (
    "isOverdue", "hasNoAssignee", "hasNoLabel", "isTopLevel", "isSubWorkItem", "isEpic",
    "hasChildren", "hasStartAndDueDates", "isDraft", "isArchived", "isIntake",
)  # fmt: skip
RELATION_FUNCTIONS = ("childOf", "parentOf", "linkedTo", "blockedBy", "blocks", "duplicateOf")
HISTORY_FUNCTIONS = {
    "wasever", "changedfrom", "changedto", "changed", "updatedby", "commentedby",
    "fieldchangedby", "wasassignedto", "changedafter", "changedbefore", "was",
}  # fmt: skip

_ALL_FUNCTIONS = [
    *DATE_FUNCTIONS, *USER_FUNCTIONS, *CYCLE_FUNCTIONS, *STATE_FUNCTIONS, *PREDICATES, *RELATION_FUNCTIONS,
]  # fmt: skip
_FUNCTION_LOOKUP = {name.lower(): name for name in _ALL_FUNCTIONS}
_STANDALONE = {*PREDICATES, *RELATION_FUNCTIONS}
_LIST_FUNCTIONS = {"currentUser", "membersOf", "workspaceMembers", *CYCLE_FUNCTIONS, *STATE_FUNCTIONS}

_FIELD_HINTS = {
    "state__group": "stateGroup",
    "state_group": "stateGroup",
    "status": "stateGroup or state",
    "name": "title",
    "summary": "title",
    "description": "text",
    "due_date": "dueDate",
    "target_date": "dueDate",
    "targetdate": "dueDate",
    "start_date": "startDate",
    "created_at": "createdAt",
    "updated_at": "updatedAt",
    "assignees": "assignee",
    "labels": "label",
    "created_by": "createdBy",
    "creator": "createdBy",
    "state_id": "state",
    "project_id": "project",
    "type_id": "type",
    "parent": 'childOf("<id>") or isSubWorkItem()',
    "sequence_id": "id",
    "identifier": "id",
    "key": "id",
}


# --------------------------------------------------------------------------- parser


def _example_for(name: str) -> str:
    if name in DATE_FUNCTIONS:
        return f"dueDate < {name}({'7' if DATE_FUNCTIONS[name] else ''})"
    if name in STATE_FUNCTIONS:
        return f"stateGroup IN {name}()"
    if name in CYCLE_FUNCTIONS:
        return f"cycle IN {name}()"
    if name == "membersOf":
        return 'assignee IN membersOf("project:<uuid>")'
    return f"assignee = {name}()" if name == "currentUser" else f"assignee IN {name}()"


def _check_arity(call: Call) -> None:
    name = call.name
    if name in DATE_FUNCTIONS:
        expected = DATE_FUNCTIONS[name]
    elif name in USER_FUNCTIONS:
        expected = USER_FUNCTIONS[name]
    elif name in RELATION_FUNCTIONS:
        expected = 1
    else:
        expected = 0
    if len(call.args) != expected:
        shape = "no arguments" if expected == 0 else "exactly one argument"
        raise PQLError(f"{name}() takes {shape}, got {len(call.args)} (position {call.pos}).")
    if name in DATE_FUNCTIONS and expected:
        arg = call.args[0]
        if not (isinstance(arg, Literal) and isinstance(arg.value, int) and not isinstance(arg.value, bool)):
            raise PQLError(f"{name}(n) needs a whole number, e.g. {name}(7) (position {call.pos}).")
        if arg.value < 0:
            raise PQLError(f"{name}(n) needs a non-negative number (position {call.pos}).")
        if arg.value > MAX_FUNCTION_ARG:
            raise PQLError(f"{name}(n) allows at most {MAX_FUNCTION_ARG} (position {call.pos}).")
    if name in RELATION_FUNCTIONS or name == "membersOf":
        arg = call.args[0]
        if not (isinstance(arg, Literal) and isinstance(arg.value, str)):
            what = '"project:<uuid>"' if name == "membersOf" else 'a quoted work item id such as "WEB-5" or a UUID'
            raise PQLError(f"{name}() needs {what} (position {call.pos}).")


class _Parser:
    def __init__(self, text: str):
        self.tokens = _tokenize(text)
        self.i = 0
        self.conditions = 0
        self.depth = 0

    def peek(self, offset: int = 0) -> Token:
        return self.tokens[min(self.i + offset, len(self.tokens) - 1)]

    def next(self) -> Token:
        tok = self.peek()
        self.i += 1
        return tok

    def at_keyword(self, *words: str) -> bool:
        tok = self.peek()
        return tok.kind == "KEYWORD" and tok.value in words

    def expect(self, kind: str, what: str) -> Token:
        tok = self.peek()
        if tok.kind != kind:
            raise PQLError(f"Expected {what} at position {tok.pos}, found {tok.describe()}.")
        return self.next()

    def descend(self, pos: int) -> None:
        self.depth += 1
        if self.depth > MAX_DEPTH:
            raise PQLError(
                f"The query nests too deeply at position {pos}: PQL allows at most {MAX_DEPTH} levels of "
                "parentheses and NOT."
            )

    def count(self, pos: int) -> None:
        self.conditions += 1
        if self.conditions > MAX_CONDITIONS:
            raise PQLError(
                f"Too many conditions: PQL allows at most {MAX_CONDITIONS} per query (the one at position {pos} "
                f"is number {self.conditions}). Combine values with IN (...) or split the query."
            )

    def parse(self):
        if self.peek().kind == "EOF":
            raise PQLError("The PQL query is empty.")
        node = self.parse_or()
        tok = self.peek()
        if tok.kind != "EOF":
            if tok.kind == ")":
                raise PQLError(f"Unbalanced ')' at position {tok.pos}.")
            hint = ""
            if tok.kind in ("NAME", "(") or (tok.kind == "KEYWORD" and tok.value == "NOT"):
                hint = " Join conditions with AND or OR."
            raise PQLError(f"Unexpected {tok.describe()} at position {tok.pos}.{hint}")
        return node

    def parse_or(self):
        children = [self.parse_and()]
        while self.at_keyword("OR"):
            self.next()
            children.append(self.parse_and())
        return children[0] if len(children) == 1 else BoolOp("OR", children)

    def parse_and(self):
        children = [self.parse_not()]
        while self.at_keyword("AND"):
            self.next()
            children.append(self.parse_not())
        return children[0] if len(children) == 1 else BoolOp("AND", children)

    def parse_not(self):
        if self.at_keyword("NOT"):
            self.descend(self.next().pos)
            node = Not(self.parse_not())
            self.depth -= 1
            return node
        return self.parse_primary()

    def parse_primary(self):
        tok = self.peek()
        if tok.kind == "(":
            self.next()
            self.descend(tok.pos)
            if self.peek().kind == ")":
                raise PQLError(f"Empty parentheses at position {tok.pos}.")
            node = self.parse_or()
            if self.peek().kind != ")":
                raise PQLError(
                    f"Missing ')' for the '(' at position {tok.pos}; found {self.peek().describe()} "
                    f"at position {self.peek().pos}."
                )
            self.next()
            self.depth -= 1
            return node
        if tok.kind == "NAME" and self.peek(1).kind == "(":
            return self.parse_standalone_call()
        if tok.kind == "NAME":
            return self.parse_comparison()
        if tok.kind == "EOF":
            raise PQLError("The query ends where a condition was expected.")
        if tok.kind == "KEYWORD" and tok.value in ("AND", "OR"):
            raise PQLError(f"'{tok.value}' at position {tok.pos} has no condition before it.")
        raise PQLError(
            f"Expected a field, a predicate such as isOverdue(), or '(' at position {tok.pos}, found {tok.describe()}."
        )

    def parse_standalone_call(self):
        call = self.parse_call()
        self.count(call.pos)
        follows_operator = self.peek().kind == "OP" or self.at_keyword("IN", "IS", "BETWEEN", "NOT")
        # `isDraft() = true`: the predicate spelled as the boolean field.
        if call.name in ("isDraft", "isArchived") and self.peek().kind == "OP":
            return self.finish_comparison(call.name, call.pos)
        if call.name not in _STANDALONE:
            raise PQLError(
                f"{call.name}() at position {call.pos} is a value, not a condition. Compare a field with it, "
                f"e.g. {_example_for(call.name)}."
            )
        if follows_operator and not self.at_keyword("NOT"):
            raise PQLError(
                f"{call.name}() at position {call.pos} is a standalone condition; do not compare it with a value."
            )
        return Predicate(call)

    def parse_call(self) -> Call:
        name_tok = self.next()
        raw = name_tok.value
        if raw.lower() in HISTORY_FUNCTIONS:
            raise PQLError(f"{raw}() is a history query, which PQL does not support. Filter on current values instead.")
        canonical = _FUNCTION_LOOKUP.get(raw.lower())
        if canonical is None:
            raise PQLError(
                f"Unknown function '{raw}()' at position {name_tok.pos}. Functions: {', '.join(_ALL_FUNCTIONS)}."
            )
        self.expect("(", f"'(' after {canonical}")
        args = []
        if self.peek().kind != ")":
            args.append(self.parse_value())
            while self.peek().kind == ",":
                self.next()
                args.append(self.parse_value())
        if self.peek().kind != ")":
            raise PQLError(
                f"Expected ')' to close {canonical}( at position {self.peek().pos}, found {self.peek().describe()}."
            )
        self.next()
        call = Call(canonical, args, name_tok.pos)
        _check_arity(call)
        return call

    def parse_comparison(self) -> Compare:
        tok = self.next()
        if tok.value.lower() == "cf" and self.peek().kind == "[":
            self.next()
            key = self.peek()
            if key.kind != "STRING":
                raise PQLError(
                    f'Custom properties are written cf["<property-uuid>"]; position {key.pos} needs a quoted UUID.'
                )
            self.next()
            self.expect("]", "']' to close cf[")
            prop = _as_uuid(key.value)
            if prop is None:
                raise PQLError(
                    f'cf["{key.value}"] needs the property\'s UUID, not its name. '
                    "Look it up with the work item properties tool."
                )
            self.count(tok.pos)
            node = self.finish_comparison("cf", tok.pos)
            node.property_id = prop
            return node
        canonical = _FIELD_LOOKUP.get(tok.value.lower())
        if canonical is None:
            hint = _FIELD_HINTS.get(tok.value.lower())
            if hint:
                raise PQLError(f"Unknown field '{tok.value}' at position {tok.pos}. Use {hint}.")
            raise PQLError(f"Unknown field '{tok.value}' at position {tok.pos}. Fields: {', '.join(FIELDS)}.")
        self.count(tok.pos)
        return self.finish_comparison(canonical, tok.pos)

    def finish_comparison(self, name: str, pos: int) -> Compare:
        tok = self.peek()
        if tok.kind == "OP":
            self.next()
            return Compare(name, tok.value, self.parse_value(), pos)
        if self.at_keyword("NOT"):
            self.next()
            if not self.at_keyword("IN"):
                raise PQLError(f"Expected IN after NOT at position {self.peek().pos} (NOT IN (...)).")
            self.next()
            return Compare(name, "not in", self.parse_list(), pos)
        if self.at_keyword("IN"):
            self.next()
            return Compare(name, "in", self.parse_list(), pos)
        if self.at_keyword("IS"):
            self.next()
            negate = False
            if self.at_keyword("NOT"):
                self.next()
                negate = True
            what = self.peek()
            if not (what.kind == "KEYWORD" and what.value in ("NULL", "EMPTY")):
                raise PQLError(f"Expected NULL or EMPTY after IS at position {what.pos}, found {what.describe()}.")
            self.next()
            return Compare(name, f"is {'not ' if negate else ''}{what.value.lower()}", None, pos)
        if self.at_keyword("BETWEEN"):
            self.next()
            if self.peek().kind == "(":
                open_tok = self.next()
                low = self.parse_value()
                if self.peek().kind != ",":
                    raise PQLError(f"BETWEEN (a, b) at position {open_tok.pos} needs two values separated by a comma.")
                self.next()
                high = self.parse_value()
                self.expect(")", "')' to close BETWEEN (a, b)")
            else:
                low = self.parse_value()
                if not self.at_keyword("AND"):
                    raise PQLError(f"BETWEEN at position {pos} needs AND between its two values.")
                self.next()
                high = self.parse_value()
            return Compare(name, "between", (low, high), pos)
        label = "cf[...]" if name == "cf" else name
        raise PQLError(
            f"Expected an operator after {label} at position {tok.pos}, found {tok.describe()}. "
            "Operators: = != > >= < <= ~ IN, NOT IN, IS [NOT] NULL, IS [NOT] EMPTY, BETWEEN."
        )

    def parse_list(self):
        tok = self.peek()
        if tok.kind == "NAME" and self.peek(1).kind == "(":
            return self.parse_call()
        if tok.kind != "(":
            raise PQLError(
                f'IN at position {tok.pos} needs a list such as ("a", "b") or a list function such as openStates().'
            )
        self.next()
        items = [self.parse_value()]
        while self.peek().kind == ",":
            self.next()
            items.append(self.parse_value())
        if self.peek().kind != ")":
            raise PQLError(
                f"Expected ',' or ')' in the list at position {self.peek().pos}, found {self.peek().describe()}."
            )
        self.next()
        return ListValue(items, tok.pos)

    def parse_value(self):
        tok = self.peek()
        if tok.kind in ("STRING", "NUMBER"):
            self.next()
            return Literal(tok.value, tok.pos)
        if tok.kind == "KEYWORD" and tok.value in ("TRUE", "FALSE"):
            self.next()
            return Literal(tok.value == "TRUE", tok.pos)
        if tok.kind == "KEYWORD" and tok.value == "NULL":
            raise PQLError(f"Use IS NULL / IS NOT NULL rather than comparing with NULL (position {tok.pos}).")
        if tok.kind == "NAME" and self.peek(1).kind == "(":
            return self.parse_call()
        if tok.kind == "NAME":
            raise PQLError(
                f"Unquoted value '{tok.value}' at position {tok.pos}. Quote strings and UUIDs, e.g. \"{tok.value}\"."
            )
        if tok.kind == "EOF":
            raise PQLError("The query ends where a value was expected.")
        raise PQLError(f"Expected a value at position {tok.pos}, found {tok.describe()}.")


def parse_pql(pql: str):
    """Parse PQL into an AST, or raise PQLError."""
    if pql is None or not pql.strip():
        raise PQLError("The PQL query is empty.")
    if len(pql) > MAX_LENGTH:
        raise PQLError(f"The PQL query is too long ({len(pql)} characters; the limit is {MAX_LENGTH}).")
    try:
        return _Parser(pql).parse()
    except (RecursionError, OverflowError) as exc:
        # The checks above should make these unreachable; a query must never become a 500.
        raise PQLError(f"The PQL query could not be read ({type(exc).__name__}). Simplify it.") from exc


def _walk(node):
    yield node
    if isinstance(node, BoolOp):
        for child in node.children:
            yield from _walk(child)
    elif isinstance(node, Not):
        yield from _walk(node.child)


def pql_fields(pql: str | None) -> set[str]:
    """The canonical field and predicate names a query refers to (empty for no query).

    Views use it to widen their default scope: drafts, archived and intake work
    items are only included when the query asks about them.
    """
    if not pql or not pql.strip():
        return set()
    names = set()
    for node in _walk(parse_pql(pql)):
        if isinstance(node, Compare):
            names.add(node.field)
        elif isinstance(node, Predicate):
            names.add(node.call.name)
    return names


# --------------------------------------------------------------------------- custom properties

_custom_property_filter: Callable[..., Q] | None = None


def register_custom_property_filter(builder: Callable[..., Q] | None) -> None:
    """Install the builder for cf["<uuid>"] conditions.

    builder(property_id: str, op: str, value, context) -> Q over Issue, where op is
    one of = != > >= < <= ~ "in" "not in" "is null" "is not null" "is empty"
    "is not empty" "between", and value is a str/int/float/bool/date/datetime,
    a list of those (IN), a (low, high) tuple (BETWEEN) or None (IS ...).
    `context.workspace_slug` and `context.user` are available. It raises PQLError
    for a property or value it cannot filter on.
    """
    global _custom_property_filter
    _custom_property_filter = builder


# --------------------------------------------------------------------------- compiler


@dataclass
class _Context:
    user: Any
    workspace_slug: str | None
    tz: Any
    queryset: QuerySet
    annotations: dict = field(default_factory=dict)

    @property
    def now(self) -> datetime:
        return timezone.now().astimezone(self.tz)

    @property
    def today(self) -> date:
        return self.now.date()


_IDENTIFIER = re.compile(r"^\s*([A-Za-z0-9_]+)-(\d+)\s*$")


def _as_uuid(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    try:
        return str(uuid.UUID(value.strip()))
    except ValueError:
        return None


def _add_months(day: date, months: int) -> date:
    month_index = day.month - 1 + months
    year, month = day.year + month_index // 12, month_index % 12 + 1
    return date(year, month, min(day.day, calendar.monthrange(year, month)[1]))


def _date_function(call: Call, ctx: _Context) -> date | datetime:
    today, n = ctx.today, (call.args[0].value if call.args else 0)
    start_of_week = today - timedelta(days=today.weekday())
    return {
        "today": lambda: today,
        "now": lambda: ctx.now,
        "startOfDay": lambda: datetime.combine(today, time.min, tzinfo=ctx.tz),
        "endOfDay": lambda: datetime.combine(today, time.max, tzinfo=ctx.tz),
        "startOfWeek": lambda: start_of_week,
        "endOfWeek": lambda: start_of_week + timedelta(days=6),
        "startOfMonth": lambda: today.replace(day=1),
        "endOfMonth": lambda: today.replace(day=calendar.monthrange(today.year, today.month)[1]),
        "startOfYear": lambda: date(today.year, 1, 1),
        "endOfYear": lambda: date(today.year, 12, 31),
        "daysAgo": lambda: today - timedelta(days=n),
        "daysFromNow": lambda: today + timedelta(days=n),
        "weeksAgo": lambda: today - timedelta(weeks=n),
        "weeksFromNow": lambda: today + timedelta(weeks=n),
        "monthsAgo": lambda: _add_months(today, -n),
        "monthsFromNow": lambda: _add_months(today, n),
    }[call.name]()


def _parse_date_string(text: str, ctx: _Context, field_name: str, pos: int) -> date | datetime:
    raw = text.strip()
    try:
        parsed = date.fromisoformat(raw) if len(raw) == 10 else datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        raise PQLError(
            f'{field_name} needs a date as "YYYY-MM-DD" (or a date function such as today()), got "{text}" '
            f"(position {pos})."
        )
    if not MIN_YEAR <= parsed.year <= MAX_YEAR:
        raise PQLError(
            f'{field_name}: "{text}" is out of range; dates run from year {MIN_YEAR} to {MAX_YEAR} (position {pos}).'
        )
    if isinstance(parsed, datetime) and not parsed.tzinfo:
        return parsed.replace(tzinfo=ctx.tz)
    return parsed


def _date_value(node, ctx: _Context, field_name: str) -> date | datetime:
    if isinstance(node, Call):
        if node.name not in DATE_FUNCTIONS:
            raise PQLError(
                f"{field_name} compares with a date or a date function, not {node.name}() (position {node.pos})."
            )
        return _date_function(node, ctx)
    if isinstance(node, Literal) and isinstance(node.value, str):
        return _parse_date_string(node.value, ctx, field_name, node.pos)
    raise PQLError(f'{field_name} needs a quoted date such as "2024-01-31" or a date function (position {node.pos}).')


_LOOKUPS = {"=": "exact", ">": "gt", ">=": "gte", "<": "lt", "<=": "lte"}


def _date_cmp(column: str, kind: str, op: str, value: date | datetime, ctx: _Context) -> Q:
    if kind == "date":
        if isinstance(value, datetime):
            value = value.astimezone(ctx.tz).date()
        if op == "!=":
            return ~Q(**{column: value})
        return Q(**{f"{column}__{_LOOKUPS[op]}": value})
    if isinstance(value, datetime):
        if op == "!=":
            return ~Q(**{column: value})
        return Q(**{f"{column}__{_LOOKUPS[op]}": value})
    # A whole day against a timestamp: the day runs from its start to the next day's, in the user's zone.
    start = datetime.combine(value, time.min, tzinfo=ctx.tz)
    end = datetime.combine(value + timedelta(days=1), time.min, tzinfo=ctx.tz)
    return {
        "=": lambda: Q(**{f"{column}__gte": start, f"{column}__lt": end}),
        "!=": lambda: ~Q(**{f"{column}__gte": start, f"{column}__lt": end}),
        ">": lambda: Q(**{f"{column}__gte": end}),
        ">=": lambda: Q(**{f"{column}__gte": start}),
        "<": lambda: Q(**{f"{column}__lt": start}),
        "<=": lambda: Q(**{f"{column}__lt": end}),
    }[op]()


def _compile_date(node: Compare, spec: FieldSpec, ctx: _Context) -> Q:
    column, op = spec.column, node.op
    if isinstance(node.value, ListValue):
        raise PQLError(f"{node.field} does not take a list (position {node.pos}).")
    if op in ("is null", "is empty"):
        return Q(**{f"{column}__isnull": True})
    if op in ("is not null", "is not empty"):
        return Q(**{f"{column}__isnull": False})
    if op == "between":
        low, high = (_date_value(v, ctx, node.field) for v in node.value)
        return _date_cmp(column, spec.kind, ">=", low, ctx) & _date_cmp(column, spec.kind, "<=", high, ctx)
    return _date_cmp(column, spec.kind, op, _date_value(node.value, ctx, node.field), ctx)


def _enum_values(node: Compare, spec: FieldSpec) -> list[str]:
    value = node.value
    if isinstance(value, Call):
        if node.field == "stateGroup" and value.name in STATE_FUNCTIONS:
            return list(STATE_FUNCTIONS[value.name])
        raise PQLError(f"{node.field} cannot be compared with {value.name}() (position {value.pos}).")
    if isinstance(value, Literal) and node.op in ("in", "not in"):
        raise PQLError(f'IN needs a list such as ("a", "b") (position {node.pos}).')
    items = value.items if isinstance(value, ListValue) else [value]
    out = []
    for item in items:
        if not (isinstance(item, Literal) and isinstance(item.value, str)):
            raise PQLError(f"{node.field} takes quoted values: {', '.join(spec.values)} (position {node.pos}).")
        text = item.value.strip().lower()
        if text not in spec.values:
            hint = " Use isIntake() for intake work items." if node.field == "stateGroup" and text == "triage" else ""
            raise PQLError(f'Invalid {node.field} "{item.value}". Valid values: {", ".join(spec.values)}.{hint}')
        out.append(text)
    return out


def _resolve_targets(call: Call, ctx: _Context):
    """The work item ids a relation function's argument names, as a subquery."""
    from plane.db.models import Issue

    arg = call.args[0].value
    as_uuid = _as_uuid(arg)
    if as_uuid:
        qs, label = Issue.objects.filter(pk=as_uuid), arg
    else:
        match = _IDENTIFIER.match(arg)
        if not match:
            raise PQLError(f'{call.name}() needs a work item id such as "WEB-5" or a UUID, got "{arg}". Never a title.')
        qs = Issue.objects.filter(project__identifier__iexact=match.group(1), sequence_id=int(match.group(2)))
        label = arg.strip().upper()
    if ctx.workspace_slug:
        qs = qs.filter(workspace__slug=ctx.workspace_slug)
        if not qs.exists():
            raise PQLError(f"{call.name}(): no work item {label} in this workspace.")
    return qs.values("id")


def _compile_predicate(call: Call, ctx: _Context) -> Q:
    from plane.db.models import IntakeIssue, Issue, IssueAssignee, IssueLabel, IssueRelation

    name = call.name
    if name in RELATION_FUNCTIONS:
        targets = _resolve_targets(call, ctx)
        rel = IssueRelation.objects
        if name == "childOf":
            return Q(parent_id__in=targets)
        if name == "parentOf":
            return Q(id__in=Issue.objects.filter(id__in=targets, parent_id__isnull=False).values("parent_id"))
        if name == "blockedBy":
            return Q(id__in=rel.filter(relation_type="blocked_by", related_issue_id__in=targets).values("issue_id"))
        if name == "blocks":
            return Q(id__in=rel.filter(relation_type="blocked_by", issue_id__in=targets).values("related_issue_id"))
        kind = "relates_to" if name == "linkedTo" else "duplicate"
        return Q(id__in=rel.filter(relation_type=kind, issue_id__in=targets).values("related_issue_id")) | Q(
            id__in=rel.filter(relation_type=kind, related_issue_id__in=targets).values("issue_id")
        )
    return {
        "isOverdue": lambda: Q(target_date__lt=ctx.today, state__group__in=STATE_FUNCTIONS["openStates"]),
        "hasNoAssignee": lambda: ~Q(id__in=IssueAssignee.objects.values("issue_id")),
        "hasNoLabel": lambda: ~Q(id__in=IssueLabel.objects.values("issue_id")),
        "isTopLevel": lambda: Q(parent_id__isnull=True),
        "isSubWorkItem": lambda: Q(parent_id__isnull=False),
        "isEpic": lambda: Q(type__is_epic=True),
        "hasChildren": lambda: Q(id__in=Issue.objects.filter(parent_id__isnull=False).values("parent_id")),
        "hasStartAndDueDates": lambda: Q(start_date__isnull=False, target_date__isnull=False),
        "isDraft": lambda: Q(is_draft=True),
        "isArchived": lambda: Q(archived_at__isnull=False),
        "isIntake": lambda: Q(id__in=IntakeIssue.objects.values("issue_id")),
    }[name]()


def _relation_rows(column: str):
    """(model, value column) for a many-valued UUID field; the managers drop soft-deleted rows."""
    from plane.db.models import CycleIssue, IssueAssignee, IssueLabel, IssueMention, IssueSubscriber, ModuleIssue

    if column == "milestone":
        from plane.nexus.models import MilestoneWorkItem

        return MilestoneWorkItem, "milestone_id"
    return {
        "assignee": (IssueAssignee, "assignee_id"),
        "label": (IssueLabel, "label_id"),
        "cycle": (CycleIssue, "cycle_id"),
        "module": (ModuleIssue, "module_id"),
        "mention": (IssueMention, "mention_id"),
        "subscriber": (IssueSubscriber, "subscriber_id"),
    }[column]


def _uuid_function(call: Call, node: Compare, spec: FieldSpec, ctx: _Context):
    from plane.db.models import Cycle, ProjectMember, WorkspaceMember

    name = call.name
    if name in USER_FUNCTIONS and not spec.user:
        raise PQLError(f"{name}() returns users; {node.field} is not a user field (position {call.pos}).")
    if name in CYCLE_FUNCTIONS and node.field != "cycle":
        raise PQLError(f"{name}() returns cycles; use it with the cycle field (position {call.pos}).")
    if name == "currentUser":
        if ctx.user is None or getattr(ctx.user, "is_anonymous", False):
            raise PQLError("currentUser() needs an authenticated user.")
        return [str(ctx.user.id)]
    if name == "workspaceMembers":
        members = WorkspaceMember.objects.filter(is_active=True)
        if ctx.workspace_slug:
            return members.filter(workspace__slug=ctx.workspace_slug).values("member_id")
        return members.filter(workspace_id__in=ctx.queryset.values("workspace_id")).values("member_id")
    if name == "membersOf":
        scope, _, ident = call.args[0].value.partition(":")
        if scope.strip().lower() == "teamspace":
            raise PQLError('membersOf("teamspace:...") is not available: this deployment has no teamspaces.')
        project_id = _as_uuid(ident)
        if scope.strip().lower() != "project" or project_id is None:
            raise PQLError(f'membersOf() takes "project:<uuid>", got "{call.args[0].value}".')
        members = ProjectMember.objects.filter(project_id=project_id, is_active=True)
        if ctx.workspace_slug:
            members = members.filter(workspace__slug=ctx.workspace_slug)
        return members.values("member_id")
    if name in CYCLE_FUNCTIONS:
        now = timezone.now()
        cycles = Cycle.objects.all()
        if ctx.workspace_slug:
            cycles = cycles.filter(workspace__slug=ctx.workspace_slug)
        if name == "activeCycle":
            cycles = cycles.filter(start_date__lte=now, end_date__gte=now)
        elif name == "completedCycles":
            cycles = cycles.filter(end_date__lt=now)
        else:
            cycles = cycles.filter(start_date__gt=now)
        return cycles.values("id")
    raise PQLError(f"{node.field} cannot be compared with {name}() (position {call.pos}).")


def _uuid_values(node: Compare, spec: FieldSpec, ctx: _Context):
    """A list of UUID strings, or a subquery of ids, for a UUID field's value(s)."""
    value = node.value
    if isinstance(value, Call):
        return _uuid_function(value, node, spec, ctx)
    if isinstance(value, Literal) and node.op in ("in", "not in"):
        raise PQLError(f'IN needs a list such as ("<uuid>", "<uuid>") (position {node.pos}).')
    out = []
    for item in value.items if isinstance(value, ListValue) else [value]:
        if isinstance(item, Call):
            resolved = _uuid_function(item, node, spec, ctx)
            if not isinstance(resolved, list):
                raise PQLError(f"{item.name}() cannot be used inside a list; write {node.field} IN {item.name}().")
            out.extend(resolved)
            continue
        as_uuid = _as_uuid(item.value)
        if as_uuid is None:
            raise PQLError(
                f'{node.field} needs a UUID, got "{item.value}" (position {item.pos}). Resolve the name to its '
                "UUID with the matching list tool first."
            )
        out.append(as_uuid)
    return out


def _compile_uuid(node: Compare, spec: FieldSpec, ctx: _Context) -> Q:
    op = node.op
    if node.field == "teamspaceProject":
        raise PQLError("teamspaceProject is not available: this deployment has no teamspaces.")
    many = spec.column in _MANY_VALUED
    if op.startswith("is "):
        if many:
            model, _ = _relation_rows(spec.column)
            q = Q(id__in=model.objects.values("issue_id"))
        else:
            q = Q(**{f"{spec.column}__isnull": False})
        return q if "not" in op else ~q
    values = _uuid_values(node, spec, ctx)
    if many:
        model, column = _relation_rows(spec.column)
        q = Q(id__in=model.objects.filter(**{f"{column}__in": values}).values("issue_id"))
    else:
        q = Q(**{f"{spec.column}__in": values})
    return ~q if op in ("!=", "not in") else q


def _compile_text(node: Compare) -> Q:
    op = node.op
    columns = ["name", "description_stripped"] if node.field == "text" else ["name"]
    if op.startswith("is "):
        empty = Q()
        for column in columns:
            empty &= Q(**{f"{column}__isnull": True}) | Q(**{column: ""})
        return ~empty if "not" in op else empty
    if not (isinstance(node.value, Literal) and isinstance(node.value.value, str)):
        raise PQLError(
            f'{node.field} compares with a quoted string, e.g. {node.field} ~ "keyword" (position {node.pos}).'
        )
    lookup = "icontains" if op == "~" else "iexact"
    q = Q()
    for column in columns:
        q |= Q(**{f"{column}__{lookup}": node.value.value})
    return ~q if op == "!=" else q


def _compile_identifier(node: Compare, ctx: _Context) -> Q:
    op, value = node.op, node.value
    if isinstance(value, Call):
        raise PQLError(f'id compares with a work item id such as "WEB-5" (position {node.pos}).')
    if isinstance(value, Literal) and op in ("in", "not in"):
        raise PQLError(f'IN needs a list such as ("WEB-1", "WEB-2") (position {node.pos}).')
    texts = []
    for item in value.items if isinstance(value, ListValue) else [value]:
        if not (isinstance(item, Literal) and isinstance(item.value, str)):
            raise PQLError(f'id takes a quoted work item id such as "WEB-5" (position {item.pos}).')
        texts.append(item.value.strip())
    if op == "~":
        ctx.annotations["_pql_identifier"] = Concat(
            F("project__identifier"), Value("-"), Cast("sequence_id", CharField()), output_field=CharField()
        )
        return Q(_pql_identifier__istartswith=texts[0])
    q = Q(pk__in=[])
    for text in texts:
        as_uuid = _as_uuid(text)
        if as_uuid:
            q |= Q(pk=as_uuid)
            continue
        match = _IDENTIFIER.match(text)
        if not match:
            raise PQLError(f'id needs a work item id such as "WEB-5" (project identifier, dash, number), got "{text}".')
        q |= Q(project__identifier__iexact=match.group(1), sequence_id=int(match.group(2)))
    return ~q if op in ("!=", "not in") else q


def _plain_value(node: Compare, ctx: _Context):
    """A cf[] condition's value as plain Python for the registered builder."""

    def one(item):
        if isinstance(item, Literal):
            return item.value
        if item.name in DATE_FUNCTIONS:
            return _date_function(item, ctx)
        if item.name == "currentUser" and ctx.user is not None:
            return str(ctx.user.id)
        raise PQLError(f"{item.name}() cannot be used with a custom property (position {item.pos}).")

    if node.op == "between":
        return tuple(one(v) for v in node.value)
    if isinstance(node.value, ListValue):
        return [one(v) for v in node.value.items]
    return None if node.value is None else one(node.value)


_CF_OPS = {
    "TEXT": {"=", "!=", "~", "is null", "is not null", "is empty", "is not empty"},
    "URL": {"=", "!=", "~", "is null", "is not null", "is empty", "is not empty"},
    "OPTION": {"=", "!=", "in", "not in", "is null", "is not null"},
    "RELATION": {"=", "!=", "in", "not in", "is null", "is not null"},
    "DECIMAL": {"=", "!=", ">", ">=", "<", "<=", "between", "is null", "is not null"},
    "DATETIME": {"=", "!=", ">", ">=", "<", "<=", "between", "is null", "is not null"},
    "BOOLEAN": {"=", "is null", "is not null"},
}


def _wall_clock(moment: datetime, ctx: _Context) -> datetime:
    """`moment` as the user's wall-clock time, labelled UTC like stored DATETIME values."""
    return moment.astimezone(ctx.tz).replace(tzinfo=dt_timezone.utc)


def _custom_property_q(property_id: str, op: str, value, ctx: _Context) -> Q:
    """cf["<uuid>"] against plane.nexus WorkItemPropertyValue rows (one row per value)."""
    from plane.nexus.models import WorkItemProperty, WorkItemPropertyValue

    props = WorkItemProperty.objects.filter(pk=property_id)
    if ctx.workspace_slug:
        props = props.filter(workspace__slug=ctx.workspace_slug)
    prop = props.first()
    if prop is None:
        raise PQLError(f'cf["{property_id}"]: no such custom property in this workspace.')
    kind = prop.property_type
    label = f'cf["{property_id}"] ({prop.display_name}, {kind})'
    if kind not in _CF_OPS:
        raise PQLError(f"{label} cannot be filtered; leave this condition out.")
    if op not in _CF_OPS[kind]:
        raise PQLError(
            f"{label} does not support {op.upper()}. Allowed: {', '.join(sorted(o.upper() for o in _CF_OPS[kind]))}."
        )
    rows = WorkItemPropertyValue.objects.filter(property_id=property_id)

    def having(**lookup) -> Q:
        return Q(id__in=rows.filter(**lookup).values("issue_id"))

    if op.startswith("is "):
        if kind in ("TEXT", "URL") and "empty" in op:
            present = having(value_text__gt="")
        else:
            present = Q(id__in=rows.values("issue_id"))
        return present if "not" in op else ~present

    def scalar(item):
        if kind in ("OPTION", "RELATION"):
            as_uuid = _as_uuid(item)
            if as_uuid is None:
                raise PQLError(f"{label} takes a quoted UUID (an option or entity id, not its name), got {item!r}.")
            return as_uuid
        if kind == "DECIMAL":
            if isinstance(item, bool) or not isinstance(item, (int, float)):
                raise PQLError(f"{label} takes a bare number, e.g. = 42 (not quoted), got {item!r}.")
            return item
        if kind == "BOOLEAN":
            if not isinstance(item, bool):
                raise PQLError(f"{label} takes bare true or false (not quoted), got {item!r}.")
            return item
        if kind == "DATETIME":
            if isinstance(item, str):
                item = _parse_date_string(item, ctx, label, 0)
            if isinstance(item, datetime):
                return _wall_clock(item, ctx)
            if isinstance(item, date):
                return item
            raise PQLError(f'{label} takes a quoted "YYYY-MM-DD" date or a date function, got {item!r}.')
        if not isinstance(item, str):
            raise PQLError(f"{label} takes a quoted string, got {item!r}.")
        return item

    column = {
        "TEXT": "value_text",
        "URL": "value_text",
        "OPTION": "value_option_id",
        "RELATION": "value_uuid",
        "DECIMAL": "value_decimal",
        "DATETIME": "value_datetime",
        "BOOLEAN": "value_boolean",
    }[kind]
    if op in ("in", "not in"):
        if not isinstance(value, list):
            raise PQLError(f'{label}: IN needs a list such as ("<uuid>", "<uuid>").')
        q = having(**{f"{column}__in": [scalar(v) for v in value]})
        return ~q if op == "not in" else q
    if isinstance(value, list):
        raise PQLError(f"{label}: {op} takes one value, not a list.")
    # DATETIME values are wall-clock times stored with a UTC label (see work_item_type's
    # value parsing), so whole days are compared in UTC too, and the query's own times
    # have been turned into the user's wall clock by scalar().
    wall_ctx = replace(ctx, tz=dt_timezone.utc)
    if op == "between":
        low, high = (scalar(v) for v in value)
        if kind == "DATETIME":
            window = _date_cmp(column, "datetime", ">=", low, wall_ctx) & _date_cmp(
                column, "datetime", "<=", high, wall_ctx
            )
            return Q(id__in=rows.filter(window).values("issue_id"))
        return having(**{f"{column}__gte": low, f"{column}__lte": high})
    item = scalar(value)
    if kind == "DATETIME":
        positive = "=" if op == "!=" else op
        q = Q(id__in=rows.filter(_date_cmp(column, "datetime", positive, item, wall_ctx)).values("issue_id"))
    elif op == "~":
        q = having(**{f"{column}__icontains": item})
    elif kind in ("TEXT", "URL") and op in ("=", "!="):
        q = having(**{f"{column}__iexact": item})
    else:
        q = having(**{f"{column}__{_LOOKUPS['=' if op == '!=' else op]}": item})
    return ~q if op == "!=" else q


def _compile_compare(node: Compare, ctx: _Context) -> Q:
    if node.field == "cf":
        builder = _custom_property_filter or _custom_property_q
        return builder(node.property_id, node.op, _plain_value(node, ctx), ctx)
    spec = FIELDS[node.field]
    if node.op not in _OPS_BY_KIND[spec.kind]:
        allowed = ", ".join(sorted(o.upper() for o in _OPS_BY_KIND[spec.kind]))
        raise PQLError(f"{node.field} does not support {node.op.upper()}. Allowed: {allowed}.")
    if isinstance(node.value, Call) and node.op in ("in", "not in") and node.value.name not in _LIST_FUNCTIONS:
        raise PQLError(
            f"{node.value.name}() is not a list; IN needs a list or a list function (position {node.value.pos})."
        )
    if spec.kind == "enum":
        q = Q(**{f"{spec.column}__in": _enum_values(node, spec)})
        return ~q if node.op in ("!=", "not in") else q
    if spec.kind == "bool":
        if not (isinstance(node.value, Literal) and isinstance(node.value.value, bool)):
            raise PQLError(f"{node.field} takes unquoted true or false (position {node.pos}).")
        truthy = node.value.value if node.op == "=" else not node.value.value
        return Q(archived_at__isnull=not truthy) if node.field == "isArchived" else Q(is_draft=truthy)
    if spec.kind == "text":
        return _compile_text(node)
    if spec.kind == "identifier":
        return _compile_identifier(node, ctx)
    if spec.kind in ("date", "datetime"):
        return _compile_date(node, spec, ctx)
    return _compile_uuid(node, spec, ctx)


def _compile(node, ctx: _Context) -> Q:
    if isinstance(node, BoolOp):
        q = _compile(node.children[0], ctx)
        for child in node.children[1:]:
            q = (q & _compile(child, ctx)) if node.op == "AND" else (q | _compile(child, ctx))
        return q
    if isinstance(node, Not):
        return ~_compile(node.child, ctx)
    if isinstance(node, Predicate):
        return _compile_predicate(node.call, ctx)
    return _compile_compare(node, ctx)


def _user_tz(user) -> Any:
    try:
        return ZoneInfo(getattr(user, "user_timezone", None) or "UTC")
    except Exception:
        return ZoneInfo("UTC")


def apply_pql(queryset: QuerySet, pql: str | None, *, user=None, workspace_slug: str | None = None) -> QuerySet:
    """Filter an Issue queryset by a PQL expression. Empty or None returns it unchanged.

    `user` resolves currentUser() and the user's timezone for date functions (it
    defaults to the request user); `workspace_slug` scopes the lookups functions
    make (members, cycles, work item ids) and turns an unknown work item id into
    an error instead of an empty match.
    """
    if not pql or not pql.strip():
        return queryset
    if user is None:
        from crum import get_current_user

        user = get_current_user()
    ctx = _Context(user=user, workspace_slug=workspace_slug, tz=_user_tz(user), queryset=queryset)
    try:
        q = _compile(parse_pql(pql), ctx)
    except (RecursionError, OverflowError) as exc:
        # The parser's limits should make these unreachable; a query must never become a 500.
        raise PQLError(f"The PQL query could not be compiled ({type(exc).__name__}). Simplify it.") from exc
    if ctx.annotations:
        queryset = queryset.annotate(**ctx.annotations)
    return queryset.filter(q)
