# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Writes of the decision register, each in one transaction with a history entry.

Numbers: the DecisionSettings row of the project (created when the feature is enabled) is locked with
select_for_update and its `last_number` taken, in the transaction of the write; so two parallel writes get
different numbers and a number is never handed out again. Lock order is always the counter first, then the
decision row; operations lock the decision row and check its state after the lock, so of two parallel
operations on one decision the second sees the first one's result (e.g. "already superseded" → 400).

Channel: "app" is the browser session (the person deciding is the owner: decided_by "user", confirmed, and
changes to what is in force wait for rollout), "api" an API key (agents: decided_by "agent", not confirmed,
unless the call says `"by": "user"`; rollout only with `"rollout": true`). See rules.py and LIVIERE.md.
"""

from dataclasses import dataclass, field
from datetime import date, datetime
from zoneinfo import ZoneInfo

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from plane.liviere.decisions import issues as issue_links
from plane.liviere.decisions.rules import (
    ACTIVE,
    AGENT,
    APP,
    DEFERRED,
    DONE,
    EDITABLE_FIELDS,
    MAX_AREA_NAME,
    MAX_CONDITION,
    MAX_NOTE,
    OPERATION_FIELDS,
    PROPOSED,
    REVIEW_STATUSES,
    REVOKED,
    SUPERSEDED,
    UNKNOWN,
    USER,
    DecisionError,
    area_key,
    boolean,
    check_transition,
    choice,
    content_fields,
    date_value,
    display_id,
    issue_refs,
    string_list,
    text,
    today_in,
)
from plane.liviere.models import (
    Decision,
    DecisionArea,
    DecisionEvent,
    DecisionIssue,
    DecisionRelation,
    DecisionSettings,
)

MAX_SPLIT = 10


class DecisionNotFound(Exception):
    pass


@dataclass
class Context:
    project: object
    user: object
    channel: str
    slug: str
    now: datetime = field(default_factory=timezone.now)

    @property
    def today(self):
        return today_in(ZoneInfo(self.project.timezone or "UTC"), self.now)

    def display(self, number):
        return display_id(self.project.identifier, number)


def _json(value):
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, DecisionArea):
        return value.key
    return value


def _event(ctx, decision, kind, changes=None, note=None):
    return DecisionEvent.objects.create(
        decision=decision,
        project_id=ctx.project.id,
        actor=ctx.user,
        channel=ctx.channel,
        kind=kind,
        changes={name: [_json(old), _json(new)] for name, (old, new) in (changes or {}).items()},
        note=note,
        occurred_at=ctx.now,
    )


def _object(data):
    if not isinstance(data, dict):
        raise DecisionError("The body must be a JSON object")
    return data


def _only(data, allowed):
    for name in data:
        if name in allowed:
            continue
        if name in OPERATION_FIELDS:
            operation = OPERATION_FIELDS[name]
            hint = f": use {operation}" if operation else ""
            raise DecisionError(f"'{name}' cannot be changed here{hint}", name, code="operation_field")
        raise DecisionError(f"Unknown field '{name}'", name, code="unknown_field")


# Settings and numbers


def settings_of(project_id):
    return DecisionSettings.objects.filter(project_id=project_id).first()


def is_enabled(project_id):
    return DecisionSettings.objects.filter(project_id=project_id, enabled=True).exists()


def set_enabled(project_id, user, enabled):
    obj, _ = DecisionSettings.objects.update_or_create(
        project_id=project_id, defaults={"enabled": enabled, "updated_by": user}
    )
    return obj


def _locked_settings(project_id):
    return DecisionSettings.objects.select_for_update().get(project_id=project_id)


def _take_numbers(project_id, count):
    counter = _locked_settings(project_id)
    first = counter.last_number + 1
    counter.last_number += count
    counter.save(update_fields=["last_number", "updated_at"])
    return list(range(first, first + count))


def _get(ctx, number, lock=False):
    rows = Decision.objects.filter(project_id=ctx.project.id, number=number)
    if lock:
        rows = rows.select_for_update()
    decision = rows.first()
    if decision is None:
        raise DecisionNotFound(f"{ctx.display(number)} not found")
    return decision


# Field helpers


def _areas(ctx, area_key, mechanism_key, area2_key, number=None):
    keys = {key for key in (area_key, area2_key) if key}
    areas = {
        a.key: a for a in DecisionArea.objects.filter(project_id=ctx.project.id, parent__isnull=True, key__in=keys)
    }
    if area_key not in areas:
        raise DecisionError(f"Unknown area '{area_key}'", "area", number, code="unknown_area")
    area = areas[area_key]
    mechanism = None
    if mechanism_key:
        mechanism = DecisionArea.objects.filter(parent=area, key=mechanism_key).first()
        if mechanism is None:
            raise DecisionError(
                f"Unknown mechanism '{mechanism_key}' of area '{area_key}'",
                "mechanism",
                number,
                code="unknown_mechanism",
            )
    area2 = None
    if area2_key:
        if area2_key not in areas:
            raise DecisionError(f"Unknown area '{area2_key}'", "area2", number, code="unknown_area")
        if area2_key == area_key:
            raise DecisionError("'area2' must differ from 'area'", "area2", number)
        area2 = areas[area2_key]
    return area, mechanism, area2


def _author(ctx, data):
    """decided_by and confirmed of a decision written now (rules in the module docstring)."""
    if ctx.channel == APP:
        return USER, True
    by = data.get("by")
    if by in (None, AGENT):
        return AGENT, False
    if by == USER:
        return USER, True
    raise DecisionError("'by' must be 'user' or 'agent'", "by")


def _rollout_requested(ctx, data):
    if ctx.channel == APP:
        return True
    if "rollout" in data:
        return boolean(data["rollout"], "rollout")
    return False


def _set_rollout(ctx, decision, reason):
    decision.pending_rollout = True
    decision.rollout_reason = reason
    decision.rollout_at = ctx.now
    decision.rollout_by = ctx.user
    decision.rollout_channel = ctx.channel


def _clear_rollout(decision):
    decision.pending_rollout = False
    decision.rollout_reason = None
    decision.rollout_at = None
    decision.rollout_by = None
    decision.rollout_channel = None


def _issues(ctx, refs, number=None):
    found = issue_links.resolve(ctx.slug, ctx.user, refs)
    missing = [ref for ref in refs if ref not in found]
    if missing:
        raise DecisionError(f"Work item {missing[0]} not found", "issues", number, code="issue_not_found")
    return [found[ref] for ref in refs]


def _linked_issues(decision):
    return [link.issue for link in DecisionIssue.objects.filter(decision=decision).select_related("issue__project")]


def _issue_identifiers(issues):
    return [issue_links.identifier(issue) for issue in issues]


def _set_issues(decision, issues):
    keep = {issue.id for issue in issues}
    DecisionIssue.objects.filter(decision=decision).exclude(issue_id__in=keep).delete()
    _add_issues(decision, issues)


def _add_issues(decision, issues):
    DecisionIssue.objects.bulk_create(
        [DecisionIssue(decision=decision, issue=issue) for issue in issues], ignore_conflicts=True
    )


def _related(decision):
    rows = DecisionRelation.objects.filter(Q(low=decision) | Q(high=decision)).values_list(
        "low__number", "high__number"
    )
    return sorted({high if low == decision.number else low for low, high in rows})


def _set_related(ctx, decision, numbers):
    if decision.number in numbers:
        raise DecisionError("A decision cannot be related to itself", "related", decision.number)
    others = {d.number: d for d in Decision.objects.filter(project_id=ctx.project.id, number__in=numbers)}
    missing = [n for n in numbers if n not in others]
    if missing:
        raise DecisionError(
            f"{ctx.display(missing[0])} not found", "related", decision.number, code="decision_not_found"
        )
    DecisionRelation.objects.filter(Q(low=decision) | Q(high=decision)).exclude(
        Q(low__number__in=numbers) | Q(high__number__in=numbers)
    ).delete()
    pairs = []
    for other in others.values():
        low, high = (decision, other) if decision.number < other.number else (other, decision)
        pairs.append(DecisionRelation(low=low, high=high))
    DecisionRelation.objects.bulk_create(pairs, ignore_conflicts=True)


def _check_related_exist(ctx, numbers, number=None):
    found = set(Decision.objects.filter(project_id=ctx.project.id, number__in=numbers).values_list("number", flat=True))
    missing = [n for n in numbers if n not in found]
    if missing:
        raise DecisionError(f"{ctx.display(missing[0])} not found", "related", number, code="decision_not_found")


# Writes

NEW_FIELDS = (*EDITABLE_FIELDS, "decided_on", "by", "rollout")


def create(ctx, data, proposed=False):
    """A new decision: in force (POST decisions/) or a proposal (POST decisions/propose/)."""
    data = _object(data)
    _only(data, NEW_FIELDS)
    fields = content_fields(data, partial=False)
    decided_on = date_value(data.get("decided_on"), "decided_on") or ctx.today
    area, mechanism, area2 = _areas(ctx, fields["area"], fields.get("mechanism"), fields.get("area2"))
    issues = _issues(ctx, fields.get("issues", []))
    related = fields.get("related", [])
    _check_related_exist(ctx, related)
    if proposed:
        decided_by, confirmed, rollout = (USER if ctx.channel == APP else AGENT), False, False
    else:
        decided_by, confirmed = _author(ctx, data)
        rollout = _rollout_requested(ctx, data)

    with transaction.atomic():
        (number,) = _take_numbers(ctx.project.id, 1)
        decision = Decision(
            workspace_id=ctx.project.workspace_id,
            project_id=ctx.project.id,
            number=number,
            title=fields["title"],
            rationale=fields.get("rationale"),
            rejected=fields.get("rejected"),
            note=fields.get("note"),
            area=area,
            mechanism=mechanism,
            area2=area2,
            kind=fields["kind"],
            status=PROPOSED if proposed else ACTIVE,
            decided_by=decided_by,
            confirmed=confirmed,
            decided_on=decided_on,
            review_on=fields.get("review_on"),
            review_condition=fields.get("review_condition"),
            sources=fields.get("sources", []),
            created_by=ctx.user,
            updated_by=ctx.user,
        )
        if rollout:
            _set_rollout(ctx, decision, "created")
        decision.save()
        _add_issues(decision, issues)
        _set_related(ctx, decision, related)
        _event(ctx, decision, "proposed" if proposed else "created", {"status": (None, decision.status)})
    return decision


def edit(ctx, number, data):
    """Changes in place (PATCH): a correction of the title and the descriptive fields, always with history."""
    data = _object(data)
    _only(data, (*EDITABLE_FIELDS, "rollout"))
    fields = content_fields(data, partial=True)
    rollout = _rollout_requested(ctx, data) if ctx.channel != APP else False
    with transaction.atomic():
        decision = _get(ctx, number, lock=True)
        changes = {}
        for name in ("title", "rationale", "rejected", "note", "kind", "review_on", "review_condition"):
            if name in fields and fields[name] != getattr(decision, name):
                changes[name] = (getattr(decision, name), fields[name])
        if name_in_any(fields, ("area", "mechanism", "area2")):
            area_key = fields.get("area", decision.area.key)
            # A mechanism belongs to its area: a new area without a mechanism leaves none
            if "mechanism" in fields:
                mechanism_key = fields["mechanism"]
            elif "area" in fields and fields["area"] != decision.area.key:
                mechanism_key = None
            else:
                mechanism_key = decision.mechanism.key if decision.mechanism_id else None
            area2_key = fields["area2"] if "area2" in fields else (decision.area2.key if decision.area2_id else None)
            area, mechanism, area2 = _areas(ctx, area_key, mechanism_key, area2_key, number)
            for name, value in (("area", area), ("mechanism", mechanism), ("area2", area2)):
                if getattr(decision, f"{name}_id") != (value.id if value else None):
                    changes[name] = (getattr(decision, name), value)
        if "sources" in fields and fields["sources"] != decision.sources:
            changes["sources"] = (decision.sources, fields["sources"])
        new_issues = None
        if "issues" in fields:
            current = _issue_identifiers(_linked_issues(decision))
            new_issues = _issues(ctx, fields["issues"], number)
            if sorted(current) != sorted(_issue_identifiers(new_issues)):
                changes["issues"] = (current, _issue_identifiers(new_issues))
        if "related" in fields:
            current = _related(decision)
            if sorted(fields["related"]) != current:
                _set_related(ctx, decision, fields["related"])
                changes["related"] = (current, sorted(fields["related"]))
        if not changes:
            return decision
        for name, (_, new) in changes.items():
            if name not in ("issues", "related"):
                setattr(decision, name, new)
        if new_issues is not None and "issues" in changes:
            _set_issues(decision, new_issues)
        # A value set by hand is no longer an estimate
        decision.estimated = [name for name in decision.estimated if name not in changes]
        if "title" in changes and decision.status in (ACTIVE, DEFERRED) and (ctx.channel == APP or rollout):
            _set_rollout(ctx, decision, "corrected")
        decision.updated_by = ctx.user
        decision.save()
        _event(ctx, decision, "edited", changes)
    return decision


def name_in_any(data, names):
    return any(name in data for name in names)


def link(ctx, number, data):
    """Adds work items and/or sources to a decision without sending the whole list."""
    data = _object(data)
    _only(data, ("issues", "sources"))
    refs = issue_refs(data.get("issues"))
    sources = string_list(data.get("sources"), "sources")
    if not refs and not sources:
        raise DecisionError("Send 'issues' and/or 'sources' to add", code="nothing_to_change")
    issues = _issues(ctx, refs, number)
    with transaction.atomic():
        decision = _get(ctx, number, lock=True)
        changes = _add_links(decision, issues, sources)
        if changes:
            decision.updated_by = ctx.user
            decision.save()
            _event(ctx, decision, "linked", changes)
    return decision


def _add_links(decision, issues, sources):
    changes = {}
    if issues:
        current = _issue_identifiers(_linked_issues(decision))
        new = current + [i for i in _issue_identifiers(issues) if i not in current]
        if new != current:
            _add_issues(decision, issues)
            changes["issues"] = (current, new)
    if sources:
        new_sources = decision.sources + [s for s in sources if s not in decision.sources]
        if new_sources != decision.sources:
            changes["sources"] = (decision.sources, new_sources)
            decision.sources = new_sources
    return changes


def ack(ctx, number, data):
    """The coordinator carried the change into rules and code: "waiting for rollout" off, optional work items."""
    data = _object(data or {})
    _only(data, ("issues",))
    issues = _issues(ctx, issue_refs(data.get("issues")), number)
    with transaction.atomic():
        decision = _get(ctx, number, lock=True)
        if not decision.pending_rollout:
            raise DecisionError(
                f"{ctx.display(number)} is not waiting for rollout", "pending_rollout", code="not_pending_rollout"
            )
        changes = {"pending_rollout": (True, False)}
        changes.update(_add_links(decision, issues, []))
        _clear_rollout(decision)
        decision.updated_by = ctx.user
        decision.save()
        _event(ctx, decision, "rollout_ack", changes)
    return decision


def transition(ctx, number, operation, data):
    """accept, confirm, defer, resume, done, revoke, review (see the operation matrix in LIVIERE.md)."""
    data = _object(data or {})
    allowed = {
        "accept": ("by", "rollout", "title", "rationale"),
        "confirm": (),
        "defer": ("review_on", "review_condition", "rollout"),
        "resume": ("rollout",),
        "done": (),
        "revoke": ("reason", "rollout"),
        "review": ("review_on", "review_condition"),
    }[operation]
    _only(data, allowed)
    with transaction.atomic():
        decision = _get(ctx, number, lock=True)
        check_transition(operation, decision.status, ctx.display(number))
        before = {
            name: getattr(decision, name)
            for name in ("status", "decided_by", "confirmed", "review_on", "review_condition", "pending_rollout")
        }
        kind, note, reason = operation, None, None
        if operation == "accept":
            # "Change and accept": a corrected title and rationale of the proposal, in the same history entry
            corrected = content_fields({k: data[k] for k in ("title", "rationale") if k in data}, partial=True)
            for name, value in corrected.items():
                if value != getattr(decision, name):
                    before[name] = getattr(decision, name)
                    setattr(decision, name, value)
            decision.status = ACTIVE
            if ctx.channel == APP or data.get("by") is not None:
                decision.decided_by, decision.confirmed = _author(ctx, data)
            reason = "accepted"
            kind = "accepted"
        elif operation == "confirm":
            if decision.confirmed:
                raise DecisionError(
                    f"{ctx.display(number)} is already confirmed", "confirmed", code="already_confirmed"
                )
            # Confirming is always the owner's word (also through an API key)
            decision.decided_by, decision.confirmed = USER, True
            decision.estimated = [name for name in decision.estimated if name != "decided_by"]
            kind = "confirmed"
        elif operation == "defer":
            review_on = date_value(data.get("review_on"), "review_on")
            condition = text(data.get("review_condition"), "review_condition", MAX_CONDITION)
            if review_on is None and condition is None:
                raise DecisionError("Deferring needs 'review_on' and/or 'review_condition'", "review_on")
            decision.status, decision.review_on, decision.review_condition = DEFERRED, review_on, condition
            reason, kind = "deferred", "deferred"
        elif operation == "resume":
            decision.status, decision.review_on, decision.review_condition = ACTIVE, None, None
            reason, kind = "resumed", "resumed"
        elif operation == "done":
            decision.status, decision.review_on, decision.review_condition = DONE, None, None
            _clear_rollout(decision)
        elif operation == "revoke":
            note = text(data.get("reason"), "reason", MAX_NOTE)
            if decision.status == PROPOSED:
                kind = "rejected"
            else:
                kind, reason = "revoked", "revoked"
            decision.status = REVOKED
        elif operation == "review":
            if decision.review_on is None and decision.review_condition is None:
                raise DecisionError(
                    f"{ctx.display(number)} has nothing to review", "review_on", code="nothing_to_change"
                )
            decision.review_on = date_value(data.get("review_on"), "review_on")
            decision.review_condition = text(data.get("review_condition"), "review_condition", MAX_CONDITION)
            kind = "reviewed"
        if reason and _rollout_requested(ctx, data):
            _set_rollout(ctx, decision, reason)
        changes = {
            name: (old, getattr(decision, name)) for name, old in before.items() if old != getattr(decision, name)
        }
        decision.updated_by = ctx.user
        decision.save()
        _event(ctx, decision, kind, changes, note=note)
    return decision


def import_review(ctx, number, data):
    """An imported decision checked by a person: optional corrections, `needs_review` and `estimated` cleared."""
    data = _object(data or {})
    _only(data, ("decided_by", "decided_on", "status"))
    with transaction.atomic():
        decision = _get(ctx, number, lock=True)
        if not decision.needs_review:
            raise DecisionError(
                f"{ctx.display(number)} is not waiting for a review after import",
                "needs_review",
                code="not_needs_review",
            )
        before = {
            name: getattr(decision, name)
            for name in ("decided_by", "confirmed", "decided_on", "status", "needs_review", "estimated")
        }
        if "decided_by" in data:
            decision.decided_by = choice(data["decided_by"], "decided_by", (USER, AGENT), number)
            decision.confirmed = decision.decided_by == USER or decision.confirmed
        elif decision.decided_by == UNKNOWN:
            if ctx.channel != APP:
                raise DecisionError(
                    f"{ctx.display(number)} has an unknown author: send 'decided_by'",
                    "decided_by",
                    number,
                    code="author_required",
                )
            # From the browser this is "my decision"
            decision.decided_by, decision.confirmed = USER, True
        if "decided_on" in data:
            decision.decided_on = date_value(data["decided_on"], "decided_on", number)
        if "status" in data:
            status = choice(data["status"], "status", REVIEW_STATUSES, number)
            if decision.status not in REVIEW_STATUSES:
                raise DecisionError(
                    f"The state of {ctx.display(number)} ({decision.status}) cannot be corrected here", "status", number
                )
            decision.status = status
        decision.needs_review = False
        decision.estimated = []
        changes = {
            name: (old, getattr(decision, name)) for name, old in before.items() if old != getattr(decision, name)
        }
        decision.updated_by = ctx.user
        decision.save()
        _event(ctx, decision, "import_reviewed", changes)
    return decision


def supersede(ctx, number, data):
    """New decisions in place of an old one, in one transaction: one new decision, or several (a split)."""
    data = _object(data)
    if "decisions" in data:
        _only(data, ("decisions", "by", "rollout"))
        items = data["decisions"]
        if not isinstance(items, list) or not 1 <= len(items) <= MAX_SPLIT:
            raise DecisionError(f"'decisions' must be a list of 1 to {MAX_SPLIT} new decisions", "decisions")
    else:
        items = [{k: v for k, v in data.items() if k not in ("by", "rollout")}]
    checked = []
    for item in items:
        item = _object(item)
        _only(item, (*EDITABLE_FIELDS, "decided_on"))
        fields = content_fields(item, partial=True)
        if not fields.get("title"):
            raise DecisionError("'title' is required", "title")
        fields["decided_on"] = date_value(item.get("decided_on"), "decided_on") or ctx.today
        checked.append(fields)
    decided_by, confirmed = _author(ctx, data)
    rollout = _rollout_requested(ctx, data)

    with transaction.atomic():
        numbers = _take_numbers(ctx.project.id, len(checked))
        old = _get(ctx, number, lock=True)
        if old.status == SUPERSEDED:
            raise DecisionError(f"{ctx.display(number)} is already superseded", "status", code="already_superseded")
        check_transition("supersede", old.status, ctx.display(number))
        old_issues = _linked_issues(old)
        old_related = _related(old)
        created = []
        for new_number, fields in zip(numbers, checked):
            if "area" in fields or "mechanism" in fields or "area2" in fields:
                area_key = fields.get("area", old.area.key)
                mechanism_key = fields.get(
                    "mechanism",
                    None if "area" in fields else (old.mechanism.key if old.mechanism_id else None),
                )
                area2_key = fields.get("area2", old.area2.key if old.area2_id else None)
                area, mechanism, area2 = _areas(ctx, area_key, mechanism_key, area2_key)
            else:
                area, mechanism, area2 = old.area, old.mechanism, old.area2
            issues = _issues(ctx, fields["issues"]) if "issues" in fields else old_issues
            related = fields["related"] if "related" in fields else old_related
            new = Decision(
                workspace_id=ctx.project.workspace_id,
                project_id=ctx.project.id,
                number=new_number,
                title=fields["title"],
                rationale=fields["rationale"] if "rationale" in fields else old.rationale,
                rejected=fields.get("rejected"),
                note=fields.get("note"),
                area=area,
                mechanism=mechanism,
                area2=area2,
                kind=fields.get("kind", old.kind),
                status=ACTIVE,
                decided_by=decided_by,
                confirmed=confirmed,
                decided_on=fields["decided_on"],
                review_on=fields.get("review_on"),
                review_condition=fields.get("review_condition"),
                sources=fields.get("sources", []),
                supersedes=old,
                created_by=ctx.user,
                updated_by=ctx.user,
            )
            if rollout:
                _set_rollout(ctx, new, "supersedes")
            new.save()
            _add_issues(new, issues)
            _set_related(ctx, new, [n for n in related if n != old.number])
            _event(ctx, new, "created", {"status": (None, ACTIVE), "supersedes": (None, old.number)})
            created.append(new)
        changes = {"status": (old.status, SUPERSEDED), "superseded_by": ([], numbers)}
        if old.pending_rollout:
            changes["pending_rollout"] = (True, False)
        old.status = SUPERSEDED
        _clear_rollout(old)
        old.updated_by = ctx.user
        old.save()
        _event(ctx, old, "superseded", changes)
    return old, created


# Areas


def create_area(ctx, data):
    data = _object(data)
    _only(data, ("key", "name", "parent", "sort_order"))
    key = area_key(data.get("key"), "key", required=True)
    name = text(data.get("name"), "name", MAX_AREA_NAME, required=True)
    parent_key = area_key(data.get("parent"), "parent")
    sort_order = data.get("sort_order")
    if sort_order is not None and (isinstance(sort_order, bool) or not isinstance(sort_order, int)):
        raise DecisionError("'sort_order' must be a whole number", "sort_order")
    with transaction.atomic():
        parent = None
        siblings = DecisionArea.objects.filter(project_id=ctx.project.id, parent__isnull=True)
        if parent_key:
            parent = siblings.filter(key=parent_key).first()
            if parent is None:
                raise DecisionError(f"Unknown area '{parent_key}'", "parent", code="unknown_area")
            siblings = DecisionArea.objects.filter(parent=parent)
        if siblings.filter(key=key).exists():
            raise DecisionError(f"'{key}' already exists", "key", code="area_exists")
        if sort_order is None:
            last = siblings.order_by("-sort_order").values_list("sort_order", flat=True).first()
            sort_order = (last or 0) + 1
        return DecisionArea.objects.create(
            workspace_id=ctx.project.workspace_id,
            project_id=ctx.project.id,
            parent=parent,
            key=key,
            name=name,
            sort_order=sort_order,
        )


def update_area(ctx, area_id, data):
    data = _object(data)
    _only(data, ("name", "sort_order"))
    area = DecisionArea.objects.filter(project_id=ctx.project.id, id=area_id).first()
    if area is None:
        raise DecisionNotFound("Area not found")
    if "name" in data:
        area.name = text(data["name"], "name", MAX_AREA_NAME, required=True)
    if "sort_order" in data:
        value = data["sort_order"]
        if isinstance(value, bool) or not isinstance(value, int):
            raise DecisionError("'sort_order' must be a whole number", "sort_order")
        area.sort_order = value
    if not data:
        raise DecisionError("Nothing to change: send 'name' and/or 'sort_order'", code="nothing_to_change")
    area.save()
    return area
