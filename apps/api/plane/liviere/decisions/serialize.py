# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The shape of decisions in API responses. Areas, mechanisms and related decisions are keys and numbers, as in
the import file; `related` is symmetric and `superseded_by` a list (a decision split into several rules has
several successors). A fixed number of queries per page whatever its size."""

from collections import defaultdict

from django.db.models import Q

from plane.liviere.decisions import issues as issue_links
from plane.liviere.decisions.queries import chain
from plane.liviere.decisions.rules import display_id, queues_of
from plane.liviere.models import Decision, DecisionArea, DecisionEvent, DecisionIssue, DecisionRelation


def _user(user):
    return {"id": str(user.id), "display_name": user.display_name} if user else None


def _date(value):
    return value.isoformat() if value else None


def serialize_decisions(decisions, slug, viewer, today):
    decisions = list(decisions)
    if not decisions:
        return []
    ids = [d.id for d in decisions]

    links = defaultdict(list)
    for link in DecisionIssue.objects.filter(decision_id__in=ids).select_related("issue__project").order_by("id"):
        links[link.decision_id].append(link.issue)
    visible = issue_links.visible_ids(slug, viewer, {i.id for issues in links.values() for i in issues})

    related = defaultdict(set)
    for low_id, high_id, low_number, high_number in DecisionRelation.objects.filter(
        Q(low_id__in=ids) | Q(high_id__in=ids)
    ).values_list("low_id", "high_id", "low__number", "high__number"):
        related[low_id].add(high_number)
        related[high_id].add(low_number)

    successors = defaultdict(list)
    for supersedes_id, number in (
        Decision.objects.filter(supersedes_id__in=ids).order_by("number").values_list("supersedes_id", "number")
    ):
        successors[supersedes_id].append(number)

    return [_decision(d, links[d.id], visible, sorted(related[d.id]), successors[d.id], today) for d in decisions]


def _decision(d, issues, visible, related, successors, today):
    rollout = None
    if d.pending_rollout:
        rollout = {
            "reason": d.rollout_reason,
            "at": d.rollout_at.isoformat() if d.rollout_at else None,
            "by": _user(d.rollout_by),
            "channel": d.rollout_channel,
        }
    return {
        "id": d.id,
        "number": d.number,
        "identifier": display_id(d.project.identifier, d.number),
        "title": d.title,
        "rationale": d.rationale,
        "rejected": d.rejected,
        "area": d.area.key,
        "mechanism": d.mechanism.key if d.mechanism_id else None,
        "area2": d.area2.key if d.area2_id else None,
        "kind": d.kind,
        "status": d.status,
        "decided_by": d.decided_by,
        "confirmed": d.confirmed,
        "decided_on": _date(d.decided_on),
        "review_on": _date(d.review_on),
        "review_condition": d.review_condition,
        "issues": [issue_links.serialize_link(issue, issue.id in visible) for issue in issues],
        "sources": d.sources,
        "supersedes": d.supersedes.number if d.supersedes_id else None,
        "superseded_by": successors,
        "related": related,
        "pending_rollout": d.pending_rollout,
        "rollout": rollout,
        "needs_review": d.needs_review,
        "estimated": d.estimated,
        "note": d.note,
        "queues": queues_of(d.status, d.decided_by, d.confirmed, d.review_on, d.pending_rollout, d.needs_review, today),
        "created_by": _user(d.created_by),
        "created_at": d.created_at.isoformat(),
        "updated_at": d.updated_at.isoformat(),
    }


def serialize_detail(decision, slug, viewer, today):
    """One decision with its history (oldest first) and its chain of versions."""
    (data,) = serialize_decisions([decision], slug, viewer, today)
    events = DecisionEvent.objects.filter(decision=decision).select_related("actor").order_by("occurred_at", "id")
    data["history"] = [
        {
            "id": event.id,
            "occurred_at": event.occurred_at.isoformat(),
            "kind": event.kind,
            "channel": event.channel,
            "actor": _user(event.actor),
            "changes": event.changes,
            "note": event.note,
        }
        for event in events
    ]
    previous, later = chain(decision)
    for item in previous + later:
        item["identifier"] = display_id(decision.project.identifier, item["number"])
    data["chain"] = {"previous": previous, "next": later}
    return data


def serialize_areas(project_id):
    areas = DecisionArea.objects.filter(project_id=project_id).order_by("sort_order", "key")
    tree = [a for a in areas if a.parent_id is None]
    mechanisms = defaultdict(list)
    for a in areas:
        if a.parent_id is not None:
            mechanisms[a.parent_id].append(a)
    return [
        {
            **serialize_area(area),
            "mechanisms": [serialize_area(m) for m in mechanisms[area.id]],
        }
        for area in tree
    ]


def serialize_area(area):
    return {"id": area.id, "key": area.key, "name": area.name, "sort_order": area.sort_order}
