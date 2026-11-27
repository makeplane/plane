# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Rules of the decision register (LS-15): states, operations, field checks. Pure functions, no Django.

A decision is one rule of a project. Its states:

- proposed: suggested by an agent session, not in force yet;
- active: in force;
- deferred: not now; back on a date (review_on) or a condition (review_condition);
- done: a one-off decision that was carried out;
- superseded: replaced by one or more newer decisions (split into several rules);
- revoked: withdrawn (a rejected proposal ends here too).

Messages never quote the text of a decision (titles, rationale...): they name the decision number and the field,
so nothing of the content reaches the server logs.
"""

import re
from datetime import date, timedelta

PROPOSED, ACTIVE, DEFERRED, DONE, SUPERSEDED, REVOKED = (
    "proposed",
    "active",
    "deferred",
    "done",
    "superseded",
    "revoked",
)
STATUSES = (PROPOSED, ACTIVE, DEFERRED, DONE, SUPERSEDED, REVOKED)
KINDS = ("product", "architecture", "process", "operations")
USER, AGENT, UNKNOWN = "user", "agent", "unknown"
AUTHORS = (USER, AGENT, UNKNOWN)
APP, API = "app", "api"

QUEUE_CONFIRM, QUEUE_REVIEW, QUEUE_ROLLOUT, QUEUE_PROPOSED, QUEUE_IMPORTED = (
    "confirm",
    "review",
    "rollout",
    "proposed",
    "imported",
)
QUEUES = (QUEUE_CONFIRM, QUEUE_REVIEW, QUEUE_ROLLOUT, QUEUE_PROPOSED, QUEUE_IMPORTED)
# A decision is due for review this many days before its review date (and every day after it)
REVIEW_WINDOW_DAYS = 14

# Why a decision waits for rollout (the coordinator's inbox)
ROLLOUT_REASONS = ("created", "accepted", "supersedes", "revoked", "deferred", "resumed", "corrected")

# Operations: the states they start from. `supersede` excludes proposals (edit or reject them instead).
TRANSITIONS = {
    "accept": (PROPOSED,),
    "confirm": (ACTIVE, DEFERRED, DONE),
    "defer": (ACTIVE,),
    "resume": (DEFERRED,),
    "done": (ACTIVE, DEFERRED),
    "revoke": (PROPOSED, ACTIVE, DEFERRED),
    "supersede": (ACTIVE, DEFERRED, DONE),
    "review": (ACTIVE, DEFERRED),
}
# States an import review may correct a decision to, and from
REVIEW_STATUSES = (ACTIVE, DEFERRED, DONE, REVOKED)

MAX_TITLE = 500
MAX_TEXT = 8000
MAX_CONDITION = 500
MAX_SOURCE = 500
MAX_LIST = 50
MAX_NOTE = 2000
MAX_AREA_KEY = 40
MAX_AREA_NAME = 100

# Fields of a decision as in the import file and the API
RECORD_FIELDS = (
    "number",
    "title",
    "rationale",
    "rejected",
    "area",
    "mechanism",
    "area2",
    "kind",
    "status",
    "decided_by",
    "confirmed",
    "decided_on",
    "review_on",
    "review_condition",
    "issues",
    "sources",
    "supersedes",
    "related",
    "pending_rollout",
    "needs_review",
    "estimated",
    "note",
)
# Fields a PATCH changes in place; the others have their own operations
EDITABLE_FIELDS = (
    "title",
    "rationale",
    "rejected",
    "note",
    "area",
    "mechanism",
    "area2",
    "kind",
    "issues",
    "sources",
    "related",
    "review_on",
    "review_condition",
)
# Fields a PATCH refuses, with the operation to use instead
OPERATION_FIELDS = {
    "status": "accept/, confirm/, defer/, resume/, done/, revoke/ or supersede/",
    "decided_by": "confirm/ or import-review/",
    "decided_on": "import-review/",
    "confirmed": "confirm/",
    "pending_rollout": "ack/",
    "needs_review": "import-review/",
    "estimated": "import-review/",
    "number": None,
    "supersedes": "supersede/",
}

AREA_KEY = re.compile(r"^[a-z0-9][a-z0-9_-]*$")
ISSUE_REF = re.compile(r"^([A-Za-z0-9]{1,12})-(\d{1,9})$")
DECISION_REF = re.compile(r"^(?:(?:[A-Za-z0-9]{1,12}-)?D)?(\d{1,9})$", re.IGNORECASE)


# `code` of 400 responses (the web app shows its own text for each)
ERROR_CODES = (
    "validation_error",  # a field is missing or wrong
    "unknown_field",  # a field this route does not take
    "operation_field",  # a field that has its own operation (status, confirmed...)
    "invalid_transition",  # the operation is not allowed from the current state
    "already_superseded",
    "already_confirmed",
    "not_pending_rollout",  # ack/ of a decision not waiting for rollout
    "not_needs_review",  # import-review/ of a decision not waiting for a review
    "author_required",  # import-review/ through an API key of a decision with an unknown author
    "nothing_to_change",
    "unknown_area",
    "unknown_mechanism",
    "area_exists",
    "issue_not_found",
    "decision_not_found",  # related/ points to a number that does not exist
    "import_rejected",  # the import file has errors (listed in `errors`)
)


class DecisionError(ValueError):
    """A request the client got wrong (400). `number` and `field` say where, `code` what (ERROR_CODES); the message
    never quotes content."""

    def __init__(self, message, field=None, number=None, code="validation_error"):
        super().__init__(message)
        self.field = field
        self.number = number
        self.code = code

    def as_dict(self):
        return {"error": str(self), "code": self.code, "field": self.field, "number": self.number}


def display_id(project_identifier, number):
    return f"{project_identifier}-D{number}"


def parse_decision_ref(value):
    """A decision number from 12, "12", "D12" or "DEMO-D12"."""
    if isinstance(value, int) and not isinstance(value, bool) and value > 0:
        return value
    if isinstance(value, str):
        found = DECISION_REF.match(value.strip())
        if found and int(found.group(1)) > 0:
            return int(found.group(1))
    raise DecisionError("A decision is a number such as 12, D12 or DEMO-D12")


def today_in(zone, now):
    return now.astimezone(zone).date()


# Field checks


def text(value, field, limit, required=False, number=None):
    """A string of at most `limit` characters, stripped; None or "" is None unless required."""
    if value is None or (isinstance(value, str) and not value.strip()):
        if required:
            raise DecisionError(f"'{field}' is required", field, number)
        return None
    if not isinstance(value, str):
        raise DecisionError(f"'{field}' must be text", field, number)
    value = value.strip()
    if len(value) > limit:
        raise DecisionError(f"'{field}' must not be longer than {limit} characters", field, number)
    return value


def choice(value, field, allowed, number=None):
    if value not in allowed:
        raise DecisionError(f"'{field}' must be one of: {', '.join(allowed)}", field, number)
    return value


def boolean(value, field, number=None):
    if not isinstance(value, bool):
        raise DecisionError(f"'{field}' must be true or false", field, number)
    return value


def date_value(value, field, number=None):
    """A YYYY-MM-DD date or None."""
    if value in (None, ""):
        return None
    if isinstance(value, str):
        try:
            return date.fromisoformat(value)
        except ValueError:
            pass
    raise DecisionError(f"'{field}' must be a date in the YYYY-MM-DD format", field, number)


def string_list(value, field, limit=MAX_SOURCE, number=None):
    """A list of non-empty strings (duplicates dropped, order kept)."""
    if value is None:
        return []
    if not isinstance(value, list):
        raise DecisionError(f"'{field}' must be a list", field, number)
    if len(value) > MAX_LIST:
        raise DecisionError(f"'{field}' must not have more than {MAX_LIST} items", field, number)
    result = []
    for item in value:
        if not isinstance(item, str) or not item.strip():
            raise DecisionError(f"'{field}' must be a list of non-empty texts", field, number)
        item = item.strip()
        if len(item) > limit:
            raise DecisionError(f"an item of '{field}' is longer than {limit} characters", field, number)
        if item not in result:
            result.append(item)
    return result


def number_value(value, field, number=None):
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise DecisionError(f"'{field}' must be a positive whole number", field, number)
    return value


def number_list(value, field, number=None):
    if value is None:
        return []
    if not isinstance(value, list):
        raise DecisionError(f"'{field}' must be a list of decision numbers", field, number)
    if len(value) > MAX_LIST:
        raise DecisionError(f"'{field}' must not have more than {MAX_LIST} items", field, number)
    result = []
    for item in value:
        item = number_value(item, field, number)
        if item not in result:
            result.append(item)
    return result


def issue_refs(value, field="issues", number=None):
    """Work item identifiers such as "DEMO-3", upper-cased, duplicates dropped."""
    refs = string_list(value, field, limit=30, number=number)
    result = []
    for ref in refs:
        if not ISSUE_REF.match(ref):
            raise DecisionError(f"'{field}' must hold work item identifiers such as DEMO-3", field, number)
        ref = ref.upper()
        if ref not in result:
            result.append(ref)
    return result


def area_key(value, field, required=False, number=None):
    if value in (None, ""):
        if required:
            raise DecisionError(f"'{field}' is required", field, number)
        return None
    if not isinstance(value, str) or len(value) > MAX_AREA_KEY or not AREA_KEY.match(value):
        raise DecisionError(
            f"'{field}' must be a key of lower-case letters, digits, '-' and '_' (at most {MAX_AREA_KEY})",
            field,
            number,
        )
    return value


def estimated_fields(value, number=None):
    fields = string_list(value, "estimated", number=number)
    for name in fields:
        if name not in RECORD_FIELDS:
            raise DecisionError("'estimated' must list field names of a decision", "estimated", number)
    return fields


def content_fields(data, partial, number=None):
    """The fields a person or an agent writes, checked: title, texts, areas (as keys), kind, lists, review."""
    result = {}
    checks = {
        "title": lambda v: text(v, "title", MAX_TITLE, required=True, number=number),
        "rationale": lambda v: text(v, "rationale", MAX_TEXT, number=number),
        "rejected": lambda v: text(v, "rejected", MAX_TEXT, number=number),
        "note": lambda v: text(v, "note", MAX_TEXT, number=number),
        "area": lambda v: area_key(v, "area", required=True, number=number),
        "mechanism": lambda v: area_key(v, "mechanism", number=number),
        "area2": lambda v: area_key(v, "area2", number=number),
        "kind": lambda v: choice(v, "kind", KINDS, number=number),
        "issues": lambda v: issue_refs(v, number=number),
        "sources": lambda v: string_list(v, "sources", number=number),
        "related": lambda v: number_list(v, "related", number=number),
        "review_on": lambda v: date_value(v, "review_on", number=number),
        "review_condition": lambda v: text(v, "review_condition", MAX_CONDITION, number=number),
    }
    for field, check in checks.items():
        if field in data:
            result[field] = check(data[field])
        elif not partial and field in ("title", "area", "kind"):
            raise DecisionError(f"'{field}' is required", field, number)
    if result.get("area2") and result.get("area2") == result.get("area"):
        raise DecisionError("'area2' must differ from 'area'", "area2", number)
    return result


def check_transition(operation, status, display):
    allowed = TRANSITIONS[operation]
    if status not in allowed:
        raise DecisionError(
            f"Cannot {operation} {display}: it is {status} (allowed from: {', '.join(allowed)})",
            "status",
            code="already_superseded" if status == SUPERSEDED else "invalid_transition",
        )


# Queues


def queues_of(status, decided_by, confirmed, review_on, pending_rollout, needs_review, today):
    """The queues a decision is in (the same conditions as queries.queue_q)."""
    queues = []
    if status == ACTIVE and decided_by != USER and not confirmed:
        queues.append(QUEUE_CONFIRM)
    if status in (ACTIVE, DEFERRED) and review_on is not None and review_on <= today + timedelta(REVIEW_WINDOW_DAYS):
        queues.append(QUEUE_REVIEW)
    if pending_rollout and status != SUPERSEDED:
        queues.append(QUEUE_ROLLOUT)
    if status == PROPOSED:
        queues.append(QUEUE_PROPOSED)
    if needs_review:
        queues.append(QUEUE_IMPORTED)
    return queues


def find_cycle(edges):
    """A number on a cycle of `edges` ({number: number it supersedes}), or None."""
    done = set()
    for start in edges:
        seen = []
        node = start
        while node in edges and node not in done:
            if node in seen:
                return node
            seen.append(node)
            node = edges[node]
        done.update(seen)
    return None
