# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

import calendar
import datetime
import re
import uuid
import zoneinfo
from typing import Any

from django.db.models import CharField, Exists, OuterRef, Q
from django.db.models.functions import Cast
from django.db.models.lookups import StartsWith
from django.utils import timezone

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
from .parser import (
    CYCLE_FUNCTIONS,
    DATE_FUNCTIONS,
    HISTORY_FUNCTIONS,
    STATE_GROUP_FUNCTIONS,
    UNSUPPORTED_EDITION_FIELDS,
    USER_FUNCTIONS,
    parse_pql,
)

VALID_PRIORITIES: frozenset[str] = frozenset({"urgent", "high", "medium", "low", "none"})
VALID_STATE_GROUPS: frozenset[str] = frozenset({"backlog", "unstarted", "started", "completed", "cancelled"})

STATE_GROUP_FUNCTION_VALUES: dict[str, list[str]] = {
    "openStates": ["backlog", "unstarted", "started"],
    "closedStates": ["completed", "cancelled"],
    "activeStates": ["unstarted", "started"],
}

_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

_FK_UUID_FIELDS: dict[str, str] = {
    "state": "state_id",
    "project": "project_id",
    "createdBy": "created_by_id",
    "type": "type_id",
}

_M2M_UUID_FIELDS: dict[str, tuple[str, str]] = {
    "assignee": ("IssueAssignee", "assignee_id"),
    "label": ("IssueLabel", "label_id"),
    "cycle": ("CycleIssue", "cycle_id"),
    "module": ("ModuleIssue", "module_id"),
    "mention": ("IssueMention", "mention_id"),
    "subscriber": ("IssueSubscriber", "subscriber_id"),
}

_USER_UUID_FIELDS: frozenset[str] = frozenset({"assignee", "createdBy", "mention", "subscriber"})


def _get_model(name: str) -> Any:
    from plane.db import models as db_models

    return getattr(db_models, name)


def _resolve_timezone(user_timezone: str | zoneinfo.ZoneInfo | None, user: Any = None) -> zoneinfo.ZoneInfo:
    if isinstance(user_timezone, zoneinfo.ZoneInfo):
        return user_timezone
    tz_name = user_timezone or getattr(user, "user_timezone", None) or "UTC"
    try:
        return zoneinfo.ZoneInfo(str(tz_name))
    except Exception:
        return zoneinfo.ZoneInfo("UTC")


def _add_months(d: datetime.date, months: int, pos: int) -> datetime.date:
    total_months = (d.year * 12 + (d.month - 1)) + months
    year, month_zero = divmod(total_months, 12)
    month = month_zero + 1
    if not (1 <= year <= 9999):
        raise PqlError("Date calculation out of supported range (years 1..9999)", position=pos)
    max_day = calendar.monthrange(year, month)[1]
    return datetime.date(year, month, min(d.day, max_day))


def _parse_uuid(raw: Any, field_name: str, pos: int) -> uuid.UUID:
    if type(raw) is not str:
        raise PqlError(f"Field {field_name!r} requires a UUID string", position=pos)
    try:
        return uuid.UUID(raw)
    except (ValueError, AttributeError) as exc:
        raise PqlError(f"Invalid UUID {raw!r} for field {field_name!r}", position=pos) from exc


def _parse_date_string(raw: Any, field_name: str, pos: int) -> datetime.date:
    if type(raw) is not str or not _DATE_RE.match(raw):
        raise PqlError(
            f"Field {field_name!r} requires a date string in 'YYYY-MM-DD' format or a date function",
            position=pos,
        )
    try:
        return datetime.date.fromisoformat(raw)
    except ValueError as exc:
        raise PqlError(f"Invalid calendar date {raw!r} for field {field_name!r}", position=pos) from exc


class _Compiler:
    def __init__(
        self,
        *,
        workspace_slug: str,
        user: Any = None,
        project_id: str | uuid.UUID | None = None,
        user_timezone: str | zoneinfo.ZoneInfo | None = None,
        now: datetime.datetime | None = None,
    ) -> None:
        self.workspace_slug = workspace_slug
        self.user = user
        self.project_id = project_id
        self.user_tz = _resolve_timezone(user_timezone, user)
        base_now = now if now is not None else timezone.now()
        if timezone.is_naive(base_now):
            base_now = base_now.replace(tzinfo=datetime.timezone.utc)
        self.local_now = base_now.astimezone(self.user_tz)
        self.today = self.local_now.date()

    def _day_start(self, d: datetime.date) -> datetime.datetime:
        return datetime.datetime.combine(d, datetime.time.min, tzinfo=self.user_tz)

    def _day_end(self, d: datetime.date) -> datetime.datetime:
        return datetime.datetime.combine(d, datetime.time.max, tzinfo=self.user_tz)

    def compile(self, node: Expr) -> Q:
        if isinstance(node, OrExpr):
            q = self.compile(node.children[0])
            for child in node.children[1:]:
                q = q | self.compile(child)
            return q
        if isinstance(node, AndExpr):
            q = self.compile(node.children[0])
            for child in node.children[1:]:
                q = q & self.compile(child)
            return q
        if isinstance(node, NotExpr):
            return ~self.compile(node.operand)
        if isinstance(node, Comparison):
            return self._compile_comparison(node)
        if isinstance(node, InExpr):
            return self._compile_in(node)
        if isinstance(node, BetweenExpr):
            return self._compile_between(node)
        if isinstance(node, IsNullExpr):
            return self._compile_is_null(node)
        if isinstance(node, IsEmptyExpr):
            return self._compile_is_empty(node)
        if isinstance(node, PredicateCall):
            return self._compile_predicate_or_relation(node)
        raise PqlError("Unsupported PQL expression", position=getattr(node, "pos", 0))

    def _check_field_available(self, field: FieldRef) -> None:
        if field.custom_property is not None or field.name in UNSUPPORTED_EDITION_FIELDS:
            raise PqlError(f"{field.name} is not available on this edition", position=field.pos)

    def _check_value_function_available(self, val: ValueNode) -> None:
        if isinstance(val, FunctionCall) and val.name in HISTORY_FUNCTIONS:
            raise PqlError(f"{val.name} is not available on this edition", position=val.pos)

    def _compile_comparison(self, node: Comparison) -> Q:
        field = node.field
        self._check_field_available(field)
        self._check_value_function_available(node.value)
        fname = field.name
        op = node.op

        if fname == "priority":
            return self._compile_priority_comparison(op, node.value, node.pos)
        if fname == "stateGroup":
            return self._compile_state_group_comparison(op, node.value, node.pos)
        if fname in ("isDraft", "isArchived"):
            return self._compile_bool_field_comparison(fname, op, node.value, node.pos)
        if fname in ("title", "text"):
            return self._compile_text_comparison(fname, op, node.value, node.pos)
        if fname == "id":
            return self._compile_id_comparison(op, node.value, node.pos)
        if fname in ("dueDate", "startDate"):
            col = "target_date" if fname == "dueDate" else "start_date"
            return self._compile_date_comparison(fname, col, op, node.value, node.pos)
        if fname in ("createdAt", "updatedAt"):
            col = "created_at" if fname == "createdAt" else "updated_at"
            return self._compile_datetime_comparison(fname, col, op, node.value, node.pos)
        if fname in _FK_UUID_FIELDS:
            return self._compile_fk_uuid_comparison(fname, _FK_UUID_FIELDS[fname], op, node.value, node.pos)
        if fname in _M2M_UUID_FIELDS:
            model_name, fk_col = _M2M_UUID_FIELDS[fname]
            return self._compile_m2m_uuid_comparison(fname, _get_model(model_name), fk_col, op, node.value, node.pos)

        raise PqlError(f"Unknown field {fname!r}", position=field.pos)

    def _compile_in(self, node: InExpr) -> Q:
        field = node.field
        self._check_field_available(field)
        if isinstance(node.values, FunctionCall):
            self._check_value_function_available(node.values)
        else:
            for v in node.values:
                self._check_value_function_available(v)

        fname = field.name
        neg = node.negated

        if fname == "priority":
            if isinstance(node.values, FunctionCall):
                raise PqlError(
                    f"Function '{node.values.name}()' cannot be used with field 'priority'",
                    position=node.values.pos,
                )
            vals = [self._validate_priority_literal(v) for v in node.values]
            q = Q(priority__in=vals)
            return ~q if neg else q

        if fname == "stateGroup":
            vals = self._resolve_state_group_list(node.values, node.pos)
            q = Q(state__group__in=vals)
            return ~q if neg else q

        if fname == "id":
            if isinstance(node.values, FunctionCall):
                raise PqlError(
                    f"Function '{node.values.name}()' cannot be used with field 'id'",
                    position=node.values.pos,
                )
            combined = Q()
            for v in node.values:
                proj_ident, seq_id = self._parse_issue_identifier(v, "id")
                combined |= Q(project__identifier__iexact=proj_ident, sequence_id=seq_id)
            return ~combined if neg else combined

        if fname == "title":
            if isinstance(node.values, FunctionCall):
                raise PqlError(
                    f"Function '{node.values.name}()' cannot be used with field 'title'",
                    position=node.values.pos,
                )
            combined = Q()
            for v in node.values:
                if not isinstance(v, LiteralValue) or type(v.value) is not str:
                    raise PqlError("Field 'title' requires string values", position=v.pos)
                combined |= Q(name__iexact=v.value)
            return ~combined if neg else combined

        if fname in ("dueDate", "startDate"):
            col = "target_date" if fname == "dueDate" else "start_date"
            if isinstance(node.values, FunctionCall):
                dates = [self._eval_date_value(node.values, fname)]
            else:
                dates = [self._eval_date_value(v, fname) for v in node.values]
            q = Q(**{f"{col}__in": dates})
            return ~q if neg else q

        if fname in ("createdAt", "updatedAt"):
            col = "created_at" if fname == "createdAt" else "updated_at"
            items = (node.values,) if isinstance(node.values, FunctionCall) else node.values
            combined = Q()
            for v in items:
                combined |= self._compile_datetime_comparison(fname, col, "=", v, v.pos)
            return ~combined if neg else combined

        if fname in _FK_UUID_FIELDS:
            col = _FK_UUID_FIELDS[fname]
            uuids = self._resolve_uuid_list(fname, node.values, node.pos)
            q = Q(**{f"{col}__in": uuids})
            if neg:
                return ~q | Q(**{f"{col}__isnull": True})
            return q

        if fname in _M2M_UUID_FIELDS:
            model_name, fk_col = _M2M_UUID_FIELDS[fname]
            model_cls = _get_model(model_name)
            uuids = self._resolve_uuid_list(fname, node.values, node.pos)
            subq = model_cls.objects.filter(
                issue_id=OuterRef("pk"),
                deleted_at__isnull=True,
                **{f"{fk_col}__in": uuids},
            )
            q = Q(Exists(subq))
            return ~q if neg else q

        raise PqlError(f"Operator 'IN' is not supported for field {fname!r}", position=node.pos)

    def _compile_between(self, node: BetweenExpr) -> Q:
        field = node.field
        self._check_field_available(field)
        self._check_value_function_available(node.low)
        self._check_value_function_available(node.high)
        fname = field.name

        if fname in ("dueDate", "startDate"):
            col = "target_date" if fname == "dueDate" else "start_date"
            low_d = self._eval_date_value(node.low, fname)
            high_d = self._eval_date_value(node.high, fname)
            return Q(**{f"{col}__gte": low_d, f"{col}__lte": high_d})

        if fname in ("createdAt", "updatedAt"):
            col = "created_at" if fname == "createdAt" else "updated_at"
            low_val = self._eval_datetime_or_date(node.low, fname)
            high_val = self._eval_datetime_or_date(node.high, fname)
            low_dt = low_val if isinstance(low_val, datetime.datetime) else self._day_start(low_val)
            high_dt = high_val if isinstance(high_val, datetime.datetime) else self._day_end(high_val)
            return Q(**{f"{col}__gte": low_dt, f"{col}__lte": high_dt})

        raise PqlError(f"Operator 'BETWEEN' is not supported for field {fname!r}", position=node.pos)

    def _compile_is_null(self, node: IsNullExpr) -> Q:
        field = node.field
        self._check_field_available(field)
        fname = field.name
        neg = node.negated

        if fname == "priority":
            q = Q(priority__isnull=True)
            return ~q if neg else q
        if fname == "stateGroup":
            q = Q(state__group__isnull=True)
            return ~q if neg else q
        if fname == "isDraft":
            q = Q(is_draft__isnull=True)
            return ~q if neg else q
        if fname == "isArchived":
            q = Q(archived_at__isnull=True)
            return ~q if neg else q
        if fname == "title":
            q = Q(name__isnull=True)
            return ~q if neg else q
        if fname == "text":
            q = Q(name__isnull=True, description_stripped__isnull=True)
            return ~q if neg else q
        if fname in ("dueDate", "startDate"):
            col = "target_date" if fname == "dueDate" else "start_date"
            return Q(**{f"{col}__isnull": not neg})
        if fname in ("createdAt", "updatedAt"):
            col = "created_at" if fname == "createdAt" else "updated_at"
            return Q(**{f"{col}__isnull": not neg})
        if fname in _FK_UUID_FIELDS:
            col = _FK_UUID_FIELDS[fname]
            return Q(**{f"{col}__isnull": not neg})
        if fname in _M2M_UUID_FIELDS:
            model_name, _ = _M2M_UUID_FIELDS[fname]
            model_cls = _get_model(model_name)
            exists_q = Q(Exists(model_cls.objects.filter(issue_id=OuterRef("pk"), deleted_at__isnull=True)))
            return exists_q if neg else ~exists_q

        raise PqlError(f"Operator 'IS NULL' is not supported for field {fname!r}", position=node.pos)

    def _compile_is_empty(self, node: IsEmptyExpr) -> Q:
        field = node.field
        self._check_field_available(field)
        fname = field.name
        neg = node.negated

        if fname in _M2M_UUID_FIELDS:
            model_name, _ = _M2M_UUID_FIELDS[fname]
            model_cls = _get_model(model_name)
            exists_q = Q(Exists(model_cls.objects.filter(issue_id=OuterRef("pk"), deleted_at__isnull=True)))
            return exists_q if neg else ~exists_q
        if fname in _FK_UUID_FIELDS:
            col = _FK_UUID_FIELDS[fname]
            return Q(**{f"{col}__isnull": not neg})
        if fname == "title":
            empty_q = Q(name__isnull=True) | Q(name="")
            return ~empty_q if neg else empty_q
        if fname == "text":
            empty_q = (Q(name__isnull=True) | Q(name="")) & (
                Q(description_stripped__isnull=True) | Q(description_stripped="")
            )
            return ~empty_q if neg else empty_q

        raise PqlError(f"Operator 'IS EMPTY' is not supported for field {fname!r}", position=node.pos)

    def _validate_priority_literal(self, val: ValueNode) -> str:
        if not isinstance(val, LiteralValue) or type(val.value) is not str:
            raise PqlError(
                "Field 'priority' requires a string value ('urgent', 'high', 'medium', 'low', 'none')",
                position=val.pos,
            )
        if val.value not in VALID_PRIORITIES:
            raise PqlError(
                f"Invalid priority value {val.value!r}; expected one of: urgent, high, medium, low, none",
                position=val.pos,
            )
        return val.value

    def _compile_priority_comparison(self, op: str, val: ValueNode, pos: int) -> Q:
        if op not in ("=", "!="):
            raise PqlError(f"Operator {op!r} is not supported for field 'priority'", position=pos)
        pval = self._validate_priority_literal(val)
        q = Q(priority=pval)
        return ~q if op == "!=" else q

    def _resolve_state_group_list(
        self,
        values: tuple[ValueNode, ...] | FunctionCall,
        pos: int,
    ) -> list[str]:
        if isinstance(values, FunctionCall):
            if values.name not in STATE_GROUP_FUNCTIONS:
                raise PqlError(
                    f"Function '{values.name}()' cannot be used with field 'stateGroup'",
                    position=values.pos,
                )
            return list(STATE_GROUP_FUNCTION_VALUES[values.name])

        result: list[str] = []
        for v in values:
            if isinstance(v, FunctionCall):
                if v.name not in STATE_GROUP_FUNCTIONS:
                    raise PqlError(
                        f"Function '{v.name}()' cannot be used with field 'stateGroup'",
                        position=v.pos,
                    )
                result.extend(STATE_GROUP_FUNCTION_VALUES[v.name])
            elif isinstance(v, LiteralValue) and type(v.value) is str:
                if v.value not in VALID_STATE_GROUPS:
                    raise PqlError(
                        f"Invalid stateGroup value {v.value!r}; expected one of: "
                        "backlog, unstarted, started, completed, cancelled",
                        position=v.pos,
                    )
                result.append(v.value)
            else:
                raise PqlError("Field 'stateGroup' requires string values", position=v.pos)
        return result

    def _compile_state_group_comparison(self, op: str, val: ValueNode, pos: int) -> Q:
        if op not in ("=", "!="):
            raise PqlError(f"Operator {op!r} is not supported for field 'stateGroup'", position=pos)
        if isinstance(val, FunctionCall):
            vals = self._resolve_state_group_list(val, pos)
            q = Q(state__group__in=vals)
            return ~q if op == "!=" else q
        if not isinstance(val, LiteralValue) or type(val.value) is not str:
            raise PqlError("Field 'stateGroup' requires a string value", position=val.pos)
        if val.value not in VALID_STATE_GROUPS:
            raise PqlError(
                f"Invalid stateGroup value {val.value!r}; expected one of: "
                "backlog, unstarted, started, completed, cancelled",
                position=val.pos,
            )
        q = Q(state__group=val.value)
        return ~q if op == "!=" else q

    def _compile_bool_field_comparison(self, fname: str, op: str, val: ValueNode, pos: int) -> Q:
        if op not in ("=", "!="):
            raise PqlError(f"Operator {op!r} is not supported for field {fname!r}", position=pos)
        if not isinstance(val, LiteralValue) or type(val.value) is not bool:
            raise PqlError(f"Field {fname!r} requires a boolean value (true or false)", position=val.pos)
        effective = val.value if op == "=" else (not val.value)
        if fname == "isDraft":
            return Q(is_draft=effective)
        return Q(archived_at__isnull=not effective)

    def _compile_text_comparison(self, fname: str, op: str, val: ValueNode, pos: int) -> Q:
        if not isinstance(val, LiteralValue) or type(val.value) is not str:
            raise PqlError(f"Field {fname!r} requires a string value", position=val.pos)
        text_val = val.value
        if fname == "title":
            if op == "~":
                return Q(name__icontains=text_val)
            if op == "=":
                return Q(name__iexact=text_val)
            if op == "!=":
                return ~Q(name__iexact=text_val)
            raise PqlError(f"Operator {op!r} is not supported for field 'title'", position=pos)

        if op == "~":
            return Q(name__icontains=text_val) | Q(description_stripped__icontains=text_val)
        if op == "=":
            return Q(name__iexact=text_val) | Q(description_stripped__iexact=text_val)
        if op == "!=":
            return ~(Q(name__iexact=text_val) | Q(description_stripped__iexact=text_val))
        raise PqlError(f"Operator {op!r} is not supported for field 'text'", position=pos)

    def _parse_issue_identifier(self, val: ValueNode, fname: str) -> tuple[str, int]:
        if not isinstance(val, LiteralValue) or type(val.value) is not str:
            raise PqlError(f"Field {fname!r} requires a string identifier 'PROJECT-123'", position=val.pos)
        raw = val.value.strip()
        head, sep, seq = raw.rpartition("-")
        if not sep or not head or not seq.isdecimal():
            raise PqlError(
                f"Invalid work item identifier {val.value!r}; expected format 'PROJECT-123'",
                position=val.pos,
            )
        return head, int(seq)

    def _compile_id_comparison(self, op: str, val: ValueNode, pos: int) -> Q:
        if not isinstance(val, LiteralValue) or type(val.value) is not str:
            raise PqlError("Field 'id' requires a string value", position=val.pos)
        if op in ("=", "!="):
            proj_ident, seq_id = self._parse_issue_identifier(val, "id")
            q = Q(project__identifier__iexact=proj_ident, sequence_id=seq_id)
            return ~q if op == "!=" else q
        if op == "~":
            prefix = val.value.strip()
            if not prefix:
                raise PqlError("Field 'id' prefix cannot be empty", position=val.pos)
            if "-" in prefix:
                head, _, tail = prefix.rpartition("-")
                if not head:
                    raise PqlError(f"Invalid work item identifier prefix {val.value!r}", position=val.pos)
                if tail == "":
                    return Q(project__identifier__iexact=head)
                if tail.isdecimal():
                    # A digit tail is still a prefix: "PQL-1" must also match PQL-10 and PQL-100.
                    return Q(
                        StartsWith(Cast("sequence_id", CharField()), str(int(tail))),
                        project__identifier__iexact=head,
                    )
            return Q(project__identifier__istartswith=prefix)
        raise PqlError(f"Operator {op!r} is not supported for field 'id'", position=pos)

    def _eval_datetime_or_date(self, val: ValueNode, fname: str) -> datetime.date | datetime.datetime:
        if isinstance(val, LiteralValue):
            return _parse_date_string(val.value, fname, val.pos)
        if isinstance(val, FunctionCall):
            if val.name not in DATE_FUNCTIONS:
                raise PqlError(
                    f"Function '{val.name}()' cannot be used with date field {fname!r}",
                    position=val.pos,
                )
            fn = val.name
            if fn == "today":
                return self.today
            if fn == "now":
                return self.local_now
            if fn == "startOfDay":
                return self._day_start(self.today)
            if fn == "endOfDay":
                return self._day_end(self.today)
            if fn == "startOfWeek":
                return self.today - datetime.timedelta(days=self.today.weekday())
            if fn == "endOfWeek":
                monday = self.today - datetime.timedelta(days=self.today.weekday())
                return monday + datetime.timedelta(days=6)
            if fn == "startOfMonth":
                return self.today.replace(day=1)
            if fn == "endOfMonth":
                last_day = calendar.monthrange(self.today.year, self.today.month)[1]
                return self.today.replace(day=last_day)
            if fn == "startOfYear":
                return self.today.replace(month=1, day=1)
            if fn == "endOfYear":
                return self.today.replace(month=12, day=31)

            n = int(val.args[0].value)
            try:
                if fn == "daysAgo":
                    return self.today - datetime.timedelta(days=n)
                if fn == "daysFromNow":
                    return self.today + datetime.timedelta(days=n)
                if fn == "weeksAgo":
                    return self.today - datetime.timedelta(weeks=n)
                if fn == "weeksFromNow":
                    return self.today + datetime.timedelta(weeks=n)
                if fn == "monthsAgo":
                    return _add_months(self.today, -n, val.pos)
                if fn == "monthsFromNow":
                    return _add_months(self.today, n, val.pos)
            except (OverflowError, ValueError) as exc:
                raise PqlError(f"Date offset in '{fn}({n})' is out of range", position=val.pos) from exc

        raise PqlError(f"Invalid date value for field {fname!r}", position=val.pos)

    def _eval_date_value(self, val: ValueNode, fname: str) -> datetime.date:
        res = self._eval_datetime_or_date(val, fname)
        if isinstance(res, datetime.datetime):
            return res.date()
        return res

    def _compile_date_comparison(self, fname: str, col: str, op: str, val: ValueNode, pos: int) -> Q:
        d = self._eval_date_value(val, fname)
        if op == "=":
            return Q(**{col: d})
        if op == "!=":
            return ~Q(**{col: d})
        if op == ">":
            return Q(**{f"{col}__gt": d})
        if op == ">=":
            return Q(**{f"{col}__gte": d})
        if op == "<":
            return Q(**{f"{col}__lt": d})
        if op == "<=":
            return Q(**{f"{col}__lte": d})
        raise PqlError(f"Operator {op!r} is not supported for field {fname!r}", position=pos)

    def _compile_datetime_comparison(self, fname: str, col: str, op: str, val: ValueNode, pos: int) -> Q:
        evaluated = self._eval_datetime_or_date(val, fname)
        if isinstance(evaluated, datetime.datetime):
            d = evaluated.date()
            if op == "=":
                return Q(**{f"{col}__gte": self._day_start(d), f"{col}__lte": self._day_end(d)})
            if op == "!=":
                return ~Q(**{f"{col}__gte": self._day_start(d), f"{col}__lte": self._day_end(d)})
            if op == ">":
                return Q(**{f"{col}__gt": evaluated})
            if op == ">=":
                return Q(**{f"{col}__gte": evaluated})
            if op == "<":
                return Q(**{f"{col}__lt": evaluated})
            if op == "<=":
                return Q(**{f"{col}__lte": evaluated})
            raise PqlError(f"Operator {op!r} is not supported for field {fname!r}", position=pos)

        d = evaluated
        start_dt = self._day_start(d)
        end_dt = self._day_end(d)
        if op == "=":
            return Q(**{f"{col}__gte": start_dt, f"{col}__lte": end_dt})
        if op == "!=":
            return ~Q(**{f"{col}__gte": start_dt, f"{col}__lte": end_dt})
        if op == ">":
            return Q(**{f"{col}__gt": end_dt})
        if op == ">=":
            return Q(**{f"{col}__gte": start_dt})
        if op == "<":
            return Q(**{f"{col}__lt": start_dt})
        if op == "<=":
            return Q(**{f"{col}__lte": end_dt})
        raise PqlError(f"Operator {op!r} is not supported for field {fname!r}", position=pos)

    def _eval_user_function(self, fn: FunctionCall) -> list[uuid.UUID]:
        if fn.name == "currentUser":
            if self.user is None or not getattr(self.user, "id", None):
                raise PqlError("currentUser() requires an authenticated user", position=fn.pos)
            uid = self.user.id if isinstance(self.user.id, uuid.UUID) else uuid.UUID(str(self.user.id))
            return [uid]

        if fn.name == "workspaceMembers":
            workspace_member_cls = _get_model("WorkspaceMember")
            return list(
                workspace_member_cls.objects.filter(
                    workspace__slug=self.workspace_slug,
                    is_active=True,
                ).values_list("member_id", flat=True)
            )

        if fn.name == "membersOf":
            raw_arg = str(fn.args[0].value)
            if raw_arg.startswith("teamspace:"):
                raise PqlError("teamspace is not available on this edition", position=fn.pos)
            if not raw_arg.startswith("project:"):
                raise PqlError(
                    "Invalid argument for membersOf(); expected 'project:<uuid>'",
                    position=fn.pos,
                )
            proj_uuid_str = raw_arg[len("project:") :]
            proj_uuid = _parse_uuid(proj_uuid_str, "membersOf", fn.pos)
            project_cls = _get_model("Project")
            project_member_cls = _get_model("ProjectMember")
            # Projects the user is not a member of resolve like missing ones, so member
            # lists of other projects cannot be probed through the filter.
            if not project_cls.objects.filter(
                workspace__slug=self.workspace_slug,
                pk=proj_uuid,
                project_projectmember__member=self.user,
                project_projectmember__is_active=True,
            ).exists():
                raise PqlError(
                    f"Project '{proj_uuid}' not found in workspace",
                    position=fn.pos,
                )
            return list(
                project_member_cls.objects.filter(
                    workspace__slug=self.workspace_slug,
                    project_id=proj_uuid,
                    is_active=True,
                ).values_list("member_id", flat=True)
            )

        raise PqlError(f"Unsupported user function '{fn.name}()'", position=fn.pos)

    def _eval_cycle_function(self, fn: FunctionCall) -> list[uuid.UUID]:
        cycle_cls = _get_model("Cycle")
        qs = cycle_cls.objects.filter(
            workspace__slug=self.workspace_slug,
            archived_at__isnull=True,
        )
        if self.project_id is not None:
            qs = qs.filter(project_id=self.project_id)

        start_of_today = self._day_start(self.today)
        end_of_today = self._day_end(self.today)

        if fn.name == "activeCycle":
            qs = qs.filter(start_date__lte=end_of_today, end_date__gte=start_of_today)
        elif fn.name == "completedCycles":
            qs = qs.filter(end_date__lt=start_of_today)
        elif fn.name == "upcomingCycles":
            qs = qs.filter(start_date__gt=end_of_today)
        else:
            raise PqlError(f"Unsupported cycle function '{fn.name}()'", position=fn.pos)

        return list(qs.values_list("id", flat=True))

    def _resolve_uuid_value(self, fname: str, val: ValueNode) -> list[uuid.UUID]:
        if isinstance(val, LiteralValue):
            return [_parse_uuid(val.value, fname, val.pos)]
        if isinstance(val, FunctionCall):
            if fname in _USER_UUID_FIELDS and val.name in USER_FUNCTIONS:
                return self._eval_user_function(val)
            if fname == "cycle" and val.name in CYCLE_FUNCTIONS:
                return self._eval_cycle_function(val)
            raise PqlError(
                f"Function '{val.name}()' cannot be used with field {fname!r}",
                position=val.pos,
            )
        raise PqlError(f"Invalid value for field {fname!r}", position=val.pos)

    def _resolve_uuid_list(
        self,
        fname: str,
        values: tuple[ValueNode, ...] | FunctionCall,
        pos: int,
    ) -> list[uuid.UUID]:
        if isinstance(values, FunctionCall):
            return self._resolve_uuid_value(fname, values)
        result: list[uuid.UUID] = []
        for v in values:
            result.extend(self._resolve_uuid_value(fname, v))
        return result

    def _compile_fk_uuid_comparison(self, fname: str, col: str, op: str, val: ValueNode, pos: int) -> Q:
        if op not in ("=", "!="):
            raise PqlError(f"Operator {op!r} is not supported for field {fname!r}", position=pos)
        uuids = self._resolve_uuid_value(fname, val)
        if len(uuids) == 1 and isinstance(val, LiteralValue):
            q = Q(**{col: uuids[0]})
        else:
            q = Q(**{f"{col}__in": uuids})
        if op == "!=":
            return ~q | Q(**{f"{col}__isnull": True})
        return q

    def _compile_m2m_uuid_comparison(
        self,
        fname: str,
        model_cls: Any,
        fk_col: str,
        op: str,
        val: ValueNode,
        pos: int,
    ) -> Q:
        if op not in ("=", "!="):
            raise PqlError(f"Operator {op!r} is not supported for field {fname!r}", position=pos)
        uuids = self._resolve_uuid_value(fname, val)
        if len(uuids) == 1 and isinstance(val, LiteralValue):
            filter_kwargs = {fk_col: uuids[0]}
        else:
            filter_kwargs = {f"{fk_col}__in": uuids}
        subq = model_cls.objects.filter(
            issue_id=OuterRef("pk"),
            deleted_at__isnull=True,
            **filter_kwargs,
        )
        q = Q(Exists(subq))
        return ~q if op == "!=" else q

    def _resolve_relation_target(self, fn_name: str, raw_ref: str, pos: int) -> Any:
        # Imported lazily: plane.api.views.issue imports this package.
        from plane.api.views.issue import visible_issue_q

        issue_cls = _get_model("Issue")
        ref = raw_ref.strip()
        target: Any = None
        try:
            target_uuid = uuid.UUID(ref)
        except ValueError:
            target_uuid = None

        # Targets the requesting user cannot view resolve like missing ones, so the
        # error does not reveal which work items exist in projects they cannot see.
        candidates = issue_cls.objects.filter(
            visible_issue_q(self.user),
            workspace__slug=self.workspace_slug,
            deleted_at__isnull=True,
        )
        if target_uuid is not None:
            target = candidates.filter(pk=target_uuid).only("id", "parent_id").first()
        else:
            head, sep, seq = ref.rpartition("-")
            if not sep or not head or not seq.isdecimal():
                raise PqlError(
                    f"Invalid work item reference {raw_ref!r} in {fn_name}(); expected 'PROJECT-123' or a UUID",
                    position=pos,
                )
            target = (
                candidates.filter(project__identifier__iexact=head, sequence_id=int(seq))
                .only("id", "parent_id")
                .first()
            )

        if target is None:
            raise PqlError(f"Work item {raw_ref!r} not found in workspace", position=pos)
        return target

    def _compile_predicate_or_relation(self, node: PredicateCall) -> Q:
        fn = node.name
        if fn in HISTORY_FUNCTIONS:
            raise PqlError(f"{fn} is not available on this edition", position=node.pos)

        if fn == "isOverdue":
            return Q(
                target_date__lt=self.today,
                state__group__in=["backlog", "unstarted", "started"],
            )
        if fn == "hasNoAssignee":
            issue_assignee_cls = _get_model("IssueAssignee")
            return ~Q(Exists(issue_assignee_cls.objects.filter(issue_id=OuterRef("pk"), deleted_at__isnull=True)))
        if fn == "hasNoLabel":
            issue_label_cls = _get_model("IssueLabel")
            return ~Q(Exists(issue_label_cls.objects.filter(issue_id=OuterRef("pk"), deleted_at__isnull=True)))
        if fn == "isTopLevel":
            return Q(parent_id__isnull=True)
        if fn == "isSubWorkItem":
            return Q(parent_id__isnull=False)
        if fn == "isEpic":
            return Q(type__is_epic=True)
        if fn == "hasChildren":
            # Imported lazily: plane.api.views.issue imports this package.
            from plane.api.views.issue import visible_issue_q

            issue_cls = _get_model("Issue")
            children = issue_cls.objects.filter(parent_id=OuterRef("pk"), deleted_at__isnull=True)
            if self.user is not None:
                # Children the user cannot view must not make a parent match.
                children = children.filter(visible_issue_q(self.user))
            return Q(Exists(children))
        if fn == "hasStartAndDueDates":
            return Q(start_date__isnull=False, target_date__isnull=False)
        if fn == "isDraft":
            return Q(is_draft=True)
        if fn == "isArchived":
            return Q(archived_at__isnull=False)
        if fn == "isIntake":
            intake_issue_cls = _get_model("IntakeIssue")
            return Q(Exists(intake_issue_cls.objects.filter(issue_id=OuterRef("pk"), deleted_at__isnull=True)))

        target = self._resolve_relation_target(fn, str(node.args[0].value), node.pos)
        target_id = target.id
        issue_relation_cls = _get_model("IssueRelation")

        if fn == "childOf":
            return Q(parent_id=target_id)
        if fn == "parentOf":
            if target.parent_id is None:
                return Q(pk__in=[])
            return Q(pk=target.parent_id)
        if fn == "blockedBy":
            # Row (issue=X, related_issue=target, relation_type="blocked_by") means X is blocked by target.
            return Q(
                Exists(
                    issue_relation_cls.objects.filter(
                        issue_id=OuterRef("pk"),
                        related_issue_id=target_id,
                        relation_type="blocked_by",
                        deleted_at__isnull=True,
                    )
                )
            )
        if fn == "blocks":
            # Row (issue=target, related_issue=X, "blocked_by"): target is blocked by X, so X blocks target.
            return Q(
                Exists(
                    issue_relation_cls.objects.filter(
                        issue_id=target_id,
                        related_issue_id=OuterRef("pk"),
                        relation_type="blocked_by",
                        deleted_at__isnull=True,
                    )
                )
            )
        if fn == "duplicateOf":
            return Q(
                Exists(
                    issue_relation_cls.objects.filter(
                        Q(issue_id=OuterRef("pk"), related_issue_id=target_id)
                        | Q(issue_id=target_id, related_issue_id=OuterRef("pk")),
                        relation_type="duplicate",
                        deleted_at__isnull=True,
                    )
                )
            )
        if fn == "linkedTo":
            return Q(
                Exists(
                    issue_relation_cls.objects.filter(
                        Q(issue_id=OuterRef("pk"), related_issue_id=target_id)
                        | Q(issue_id=target_id, related_issue_id=OuterRef("pk")),
                        relation_type="relates_to",
                        deleted_at__isnull=True,
                    )
                )
            )

        raise PqlError(f"Unknown function '{fn}'", position=node.pos)


def compile_pql(
    ast_or_query: Expr | str,
    *,
    workspace_slug: str,
    user: Any = None,
    project_id: str | uuid.UUID | None = None,
    user_timezone: str | zoneinfo.ZoneInfo | None = None,
    now: datetime.datetime | None = None,
) -> Q:
    """Compile a PQL AST (or raw PQL query string) into a Django ``Q`` for ``Issue``."""
    ast = parse_pql(ast_or_query) if isinstance(ast_or_query, str) else ast_or_query
    compiler = _Compiler(
        workspace_slug=workspace_slug,
        user=user,
        project_id=project_id,
        user_timezone=user_timezone,
        now=now,
    )
    return compiler.compile(ast)
