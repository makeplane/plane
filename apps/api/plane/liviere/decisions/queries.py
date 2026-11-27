# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Reading the decision register: list filters, the five queues, the phrase search and the chain of versions.

The search is a case-insensitive substring per word (`icontains`, `UPPER(...) LIKE UPPER(...)`) on the title,
rationale, rejected options and note, the words joined with AND; like the content search (LS-5) there is no
`unaccent`, so agents search by the stem with Polish letters. The list shows decisions in force by default, the
search every state (a session checks whether an old rule it found in a note still holds).
"""

from datetime import timedelta

from django.db.models import Q

from plane.liviere.decisions.rules import (
    ACTIVE,
    DEFERRED,
    KINDS,
    PROPOSED,
    QUEUE_CONFIRM,
    QUEUE_IMPORTED,
    QUEUE_PROPOSED,
    QUEUE_REVIEW,
    QUEUE_ROLLOUT,
    QUEUES,
    REVIEW_WINDOW_DAYS,
    STATUSES,
    SUPERSEDED,
    USER,
    DecisionError,
    area_key,
)
from plane.liviere.models import Decision

MIN_QUERY_LENGTH = 3
MAX_QUERY_LENGTH = 200
DEFAULT_SEARCH_LIMIT = 50
MAX_SEARCH_LIMIT = 200
SEARCH_FIELDS = ("title", "rationale", "rejected", "note")
MAX_CHAIN = 200
DECISION_RELATED = ("project", "area", "mechanism", "area2", "supersedes", "rollout_by", "created_by")


def decisions_of(project_id):
    return Decision.objects.filter(project_id=project_id).select_related(*DECISION_RELATED)


def queue_q(queue, today):
    if queue == QUEUE_CONFIRM:
        return Q(status=ACTIVE, confirmed=False) & ~Q(decided_by=USER)
    if queue == QUEUE_REVIEW:
        return Q(
            status__in=(ACTIVE, DEFERRED),
            review_on__isnull=False,
            review_on__lte=today + timedelta(REVIEW_WINDOW_DAYS),
        )
    if queue == QUEUE_ROLLOUT:
        return Q(pending_rollout=True) & ~Q(status=SUPERSEDED)
    if queue == QUEUE_PROPOSED:
        return Q(status=PROPOSED)
    if queue == QUEUE_IMPORTED:
        return Q(needs_review=True)
    raise DecisionError(f"'queue' must be one of: {', '.join(QUEUES)}", "queue")


def queue_counts(project_id, today):
    rows = Decision.objects.filter(project_id=project_id)
    return {queue: rows.filter(queue_q(queue, today)).count() for queue in QUEUES}


def _list_values(value, field, allowed):
    if value is None or value == "":
        return None
    values = value if isinstance(value, list) else str(value).split(",")
    values = [v.strip() for v in values if isinstance(v, str) and v.strip()]
    for v in values:
        if v not in allowed:
            raise DecisionError(f"'{field}' must be one of: {', '.join(allowed)}", field)
    return values


def parse_filters(params, default_status):
    """Filters of the list (query parameters) or of the search (body): area, mechanism, status, kind, queue."""
    filters = {
        "area": area_key(params.get("area"), "area"),
        "mechanism": area_key(params.get("mechanism"), "mechanism"),
        "kind": _list_values(params.get("kind"), "kind", KINDS),
        "queue": None,
    }
    queue = params.get("queue")
    if queue not in (None, ""):
        if queue not in QUEUES:
            raise DecisionError(f"'queue' must be one of: {', '.join(QUEUES)}", "queue")
        filters["queue"] = queue
    status = params.get("status")
    if status == "all":
        filters["status"] = None
    else:
        filters["status"] = _list_values(status, "status", STATUSES)
        # A queue has its own states; otherwise the default (the list: decisions in force)
        if filters["status"] is None and filters["queue"] is None:
            filters["status"] = default_status
    return filters


def apply_filters(rows, filters, today):
    if filters["area"]:
        rows = rows.filter(Q(area__key=filters["area"]) | Q(area2__key=filters["area"]))
    if filters["mechanism"]:
        rows = rows.filter(mechanism__key=filters["mechanism"])
        if filters["area"]:
            rows = rows.filter(mechanism__parent__key=filters["area"])
    if filters["status"]:
        rows = rows.filter(status__in=filters["status"])
    if filters["kind"]:
        rows = rows.filter(kind__in=filters["kind"])
    if filters["queue"]:
        rows = rows.filter(queue_q(filters["queue"], today))
    return rows


def parse_search(data):
    if not isinstance(data, dict):
        raise DecisionError("The body must be a JSON object")
    q = data.get("q")
    if not isinstance(q, str):
        raise DecisionError("'q' is required", "q")
    q = " ".join(q.split())
    if len(q) < MIN_QUERY_LENGTH:
        raise DecisionError(f"'q' must be at least {MIN_QUERY_LENGTH} characters", "q")
    if len(q) > MAX_QUERY_LENGTH:
        raise DecisionError(f"'q' must be at most {MAX_QUERY_LENGTH} characters", "q")
    limit = data.get("limit", DEFAULT_SEARCH_LIMIT)
    if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= MAX_SEARCH_LIMIT:
        raise DecisionError(f"'limit' must be a whole number from 1 to {MAX_SEARCH_LIMIT}", "limit")
    unknown = set(data) - {"q", "limit", "area", "mechanism", "status", "kind", "queue"}
    if unknown:
        raise DecisionError(f"Unknown field '{sorted(unknown)[0]}'", sorted(unknown)[0], code="unknown_field")
    return q, limit, parse_filters(data, default_status=None)


def search_q(q):
    match = Q()
    for word in q.split():
        any_field = Q()
        for name in SEARCH_FIELDS:
            any_field |= Q(**{f"{name}__icontains": word})
        match &= any_field
    return match


def chain(decision):
    """Earlier versions (oldest first) and later ones (every successor, also of splits, in number order)."""
    previous = []
    node = decision
    while node.supersedes_id and len(previous) < MAX_CHAIN:
        node = Decision.objects.filter(id=node.supersedes_id).first()
        if node is None:
            break
        previous.insert(0, node)
    later = []
    frontier = [decision.id]
    seen = {decision.id}
    while frontier and len(later) < MAX_CHAIN:
        successors = list(Decision.objects.filter(supersedes_id__in=frontier).order_by("number"))
        successors = [s for s in successors if s.id not in seen]
        seen.update(s.id for s in successors)
        later.extend(successors)
        frontier = [s.id for s in successors]
    supersedes_numbers = dict(
        Decision.objects.filter(id__in=[d.supersedes_id for d in previous + later if d.supersedes_id]).values_list(
            "id", "number"
        )
    )
    supersedes_numbers[decision.id] = decision.number

    def short(d):
        return {
            "number": d.number,
            "title": d.title,
            "status": d.status,
            "decided_on": d.decided_on.isoformat() if d.decided_on else None,
            "supersedes": supersedes_numbers.get(d.supersedes_id) if d.supersedes_id else None,
        }

    return [short(d) for d in previous], [short(d) for d in later]
