# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Import of a whole file of decisions (format 2, see LIVIERE.md), all or nothing.

First every check, collecting all errors (decision number and field, never the content); then the write in one
transaction. A dry run (the default) performs the same write and rolls it back, so it also meets the database
constraints. Numbers, dates, states, authors, `confirmed` and chains come in as they are in the file; the channel
does not change `decided_by`; `pending_rollout` is never set. A work item that cannot be found does not reject
the file: the decision comes in without that link and its identifier is added to `sources`.
"""

from collections import Counter, defaultdict

from django.db import DatabaseError, transaction

from plane.liviere.decisions import issues as issue_links
from plane.liviere.decisions.rules import (
    AUTHORS,
    MAX_AREA_NAME,
    MAX_CONDITION,
    MAX_TEXT,
    MAX_TITLE,
    STATUSES,
    SUPERSEDED,
    UNKNOWN,
    DecisionError,
    area_key,
    boolean,
    choice,
    date_value,
    estimated_fields,
    find_cycle,
    issue_refs,
    number_list,
    number_value,
    string_list,
    text,
    KINDS,
)
from plane.liviere.models import (
    Decision,
    DecisionArea,
    DecisionEvent,
    DecisionIssue,
    DecisionRelation,
    DecisionSettings,
)

FORMAT = 2
MAX_DECISIONS = 2000
REQUIRED = ("number", "title", "area", "kind", "status", "decided_by", "sources")
NOT_FOUND = "ticket:{} (not found)"


class _DryRun(Exception):
    pass


class ImportResult:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.decisions = []
        self.areas = []
        self.issues = {}
        self.existing = {}

    def error(self, message, number=None, field=None):
        self.errors.append({"number": number, "field": field, "error": message})

    def warning(self, message, number=None, field=None):
        self.warnings.append({"number": number, "field": field, "warning": message})


def _check_areas(result, data, existing):
    """{key: {"name", "mechanisms": {key: name}, "existing": bool}} of the file and the project."""
    known = {}
    for a in existing:
        mechanisms = {m.key: m.name for m in a.mechanisms.all()}
        known[a.key] = {"name": a.name, "mechanisms": mechanisms, "new": False, "existing_mechanisms": set(mechanisms)}
    areas = data.get("areas", [])
    if not isinstance(areas, list):
        result.error("'areas' must be a list", field="areas")
        return known
    seen = set()
    for item in areas:
        try:
            if not isinstance(item, dict):
                raise DecisionError("every area must be an object", "areas")
            key = area_key(item.get("key"), "areas.key", required=True)
            name = text(item.get("name"), "areas.name", MAX_AREA_NAME, required=True)
            if key in seen:
                raise DecisionError(f"area '{key}' is repeated", "areas.key")
            seen.add(key)
            mechanisms = item.get("mechanisms") or []
            if not isinstance(mechanisms, list):
                raise DecisionError(f"'mechanisms' of area '{key}' must be a list", "areas.mechanisms")
            entry = known.setdefault(key, {"name": name, "mechanisms": {}, "new": True, "existing_mechanisms": set()})
            mechanism_keys = set()
            for mechanism in mechanisms:
                if not isinstance(mechanism, dict):
                    raise DecisionError(f"every mechanism of area '{key}' must be an object", "areas.mechanisms")
                mechanism_key = area_key(mechanism.get("key"), "mechanisms.key", required=True)
                mechanism_name = text(mechanism.get("name"), "mechanisms.name", MAX_AREA_NAME, required=True)
                if mechanism_key in mechanism_keys:
                    raise DecisionError(f"mechanism '{mechanism_key}' of area '{key}' is repeated", "mechanisms.key")
                mechanism_keys.add(mechanism_key)
                entry["mechanisms"].setdefault(mechanism_key, mechanism_name)
        except DecisionError as e:
            result.error(str(e), field=e.field)
    return known


def _check_decision(result, d, areas):
    """The checked values of one decision, or None (errors recorded)."""
    number = d.get("number") if isinstance(d, dict) else None
    if not isinstance(d, dict):
        result.error("every decision must be an object", field="decisions")
        return None
    errors_before = len(result.errors)

    def run(check):
        try:
            return check()
        except DecisionError as e:
            result.error(str(e), number=number, field=e.field)
            return None

    for name in REQUIRED:
        if name not in d:
            result.error(f"'{name}' is missing", number=number, field=name)
    if len(result.errors) > errors_before:
        return None
    number = run(lambda: number_value(d["number"], "number"))
    if number is None:
        return None
    values = {
        "number": number,
        "title": run(lambda: text(d.get("title"), "title", MAX_TITLE, required=True, number=number)),
        "rationale": run(lambda: text(d.get("rationale"), "rationale", MAX_TEXT, number=number)),
        "rejected": run(lambda: text(d.get("rejected"), "rejected", MAX_TEXT, number=number)),
        "note": run(lambda: text(d.get("note"), "note", MAX_TEXT, number=number)),
        "area": run(lambda: area_key(d.get("area"), "area", required=True, number=number)),
        "mechanism": run(lambda: area_key(d.get("mechanism"), "mechanism", number=number)),
        "area2": run(lambda: area_key(d.get("area2"), "area2", number=number)),
        "kind": run(lambda: choice(d.get("kind"), "kind", KINDS, number=number)),
        "status": run(lambda: choice(d.get("status"), "status", STATUSES, number=number)),
        "decided_by": run(lambda: choice(d.get("decided_by"), "decided_by", AUTHORS, number=number)),
        "confirmed": run(lambda: boolean(d.get("confirmed", False), "confirmed", number=number)),
        "decided_on": run(lambda: date_value(d.get("decided_on"), "decided_on", number=number)),
        "review_on": run(lambda: date_value(d.get("review_on"), "review_on", number=number)),
        "review_condition": run(
            lambda: text(d.get("review_condition"), "review_condition", MAX_CONDITION, number=number)
        ),
        "issues": run(lambda: issue_refs(d.get("issues"), number=number)),
        "sources": run(lambda: string_list(d.get("sources"), "sources", number=number)),
        "supersedes": run(
            lambda: None if d.get("supersedes") is None else number_value(d["supersedes"], "supersedes", number)
        ),
        "related": run(lambda: number_list(d.get("related"), "related", number=number)),
        "needs_review": run(lambda: boolean(d.get("needs_review", False), "needs_review", number=number)),
        "estimated": run(lambda: estimated_fields(d.get("estimated"), number=number)),
    }
    if "pending_rollout" in d and d["pending_rollout"] is not False:
        result.warning("'pending_rollout' is ignored: an import never sets it", number, "pending_rollout")
    if len(result.errors) > errors_before:
        return None

    area = areas.get(values["area"])
    if area is None:
        result.error(f"unknown area '{values['area']}'", number, "area")
    elif values["mechanism"] and values["mechanism"] not in area["mechanisms"]:
        result.error(f"unknown mechanism '{values['mechanism']}' of area '{values['area']}'", number, "mechanism")
    if values["area2"] and (values["area2"] not in areas or values["area2"] == values["area"]):
        result.error(f"wrong second area '{values['area2']}'", number, "area2")
    if (values["decided_by"] == UNKNOWN or not values["decided_on"]) and not values["needs_review"]:
        result.error("an unknown author or date needs 'needs_review': true", number, "needs_review")
    if values["supersedes"] == number:
        result.error("a decision cannot supersede itself", number, "supersedes")
    if number in values["related"]:
        result.error("a decision cannot be related to itself", number, "related")
    return values if len(result.errors) == errors_before else None


def check(ctx, data):
    """Every check of the file; ImportResult with errors, warnings and the checked decisions."""
    result = ImportResult()
    if not isinstance(data, dict):
        result.error("The file must be a JSON object")
        return result
    if data.get("format") != FORMAT:
        result.error(f"'format' must be {FORMAT}", field="format")
        return result
    decisions = data.get("decisions")
    if not isinstance(decisions, list) or not decisions:
        result.error("'decisions' must be a non-empty list", field="decisions")
        return result
    if len(decisions) > MAX_DECISIONS:
        result.error(f"at most {MAX_DECISIONS} decisions in one file", field="decisions")
        return result
    if data.get("project") not in (None, ctx.project.identifier):
        result.warning("'project' of the file is not the identifier of this project", field="project")

    existing_areas = list(
        DecisionArea.objects.filter(project_id=ctx.project.id, parent__isnull=True).prefetch_related("mechanisms")
    )
    areas = _check_areas(result, data, existing_areas)
    result.areas = areas

    checked = [_check_decision(result, d, areas) for d in decisions]
    checked = [d for d in checked if d is not None]
    # Numbers and states of the whole file, also of decisions with errors, so that one wrong decision does not
    # make the others point to "a decision that does not exist"
    raw = [
        d
        for d in decisions
        if isinstance(d, dict) and isinstance(d.get("number"), int) and not isinstance(d.get("number"), bool)
    ]
    counts = Counter(d["number"] for d in raw)
    for number, count in sorted(counts.items()):
        if count > 1:
            result.error("the number is repeated in the file", number, "number")
    by_number = {d["number"]: d for d in raw}

    existing = {
        d.number: d
        for d in Decision.objects.filter(project_id=ctx.project.id).only("id", "number", "status", "project_id")
    }
    result.existing = existing
    collisions = sorted(n for n in by_number if n in existing)
    for number in collisions:
        result.error("the number is already used in this project", number, "number")

    for d in checked:
        target = d["supersedes"]
        if target is not None:
            status = (by_number.get(target) or {}).get("status") or getattr(existing.get(target), "status", None)
            if status is None:
                result.error(f"supersedes D{target}, which does not exist", d["number"], "supersedes")
            elif status != SUPERSEDED:
                result.error(f"supersedes D{target}, which is not superseded", d["number"], "supersedes")
        for other in d["related"]:
            if other not in by_number and other not in existing:
                result.error(f"related to D{other}, which does not exist", d["number"], "related")
    cycle = find_cycle({d["number"]: d["supersedes"] for d in checked if d["supersedes"] is not None})
    if cycle is not None:
        result.error("the chain of 'supersedes' has a cycle", cycle, "supersedes")

    refs = sorted({ref for d in checked for ref in d["issues"]})
    result.issues = issue_links.resolve(ctx.slug, ctx.user, refs)
    for d in checked:
        for ref in d["issues"]:
            if ref not in result.issues:
                result.warning(f"work item {ref} not found; kept in 'sources'", d["number"], "issues")
    result.decisions = checked
    return result


def summary(result):
    decisions = result.decisions
    new_areas = [key for key, a in result.areas.items() if a["new"]]
    mechanisms_created = sum(len(set(a["mechanisms"]) - a["existing_mechanisms"]) for a in result.areas.values())
    sources = defaultdict(list)
    for d in sorted(decisions, key=lambda d: d["number"]):
        for source in d["sources"]:
            sources[source].append(d["number"])
    links = sum(1 for d in decisions for ref in d["issues"] if ref in result.issues)
    return {
        "summary": {
            "decisions": len(decisions),
            "by_status": dict(Counter(d["status"] for d in decisions)),
            "areas_created": len(new_areas),
            "mechanisms_created": mechanisms_created,
            "needs_review": sum(1 for d in decisions if d["needs_review"]),
            "issue_links": links,
            "issues_not_found": sum(len(d["issues"]) for d in decisions) - links,
        },
        "sources": dict(sources),
    }


def _write(ctx, result):
    counter = DecisionSettings.objects.select_for_update().get(project_id=ctx.project.id)
    # A number taken since the checks (a decision written meanwhile)
    taken = set(
        Decision.objects.filter(
            project_id=ctx.project.id, number__in=[d["number"] for d in result.decisions]
        ).values_list("number", flat=True)
    )
    if taken:
        raise DecisionError("a number of the file was taken meanwhile; check again", "number", min(taken))

    area_rows = {
        a.key: a
        for a in DecisionArea.objects.filter(project_id=ctx.project.id, parent__isnull=True).prefetch_related(
            "mechanisms"
        )
    }
    mechanism_rows = {(a.key, m.key): m for a in area_rows.values() for m in a.mechanisms.all()}
    order = max((a.sort_order for a in area_rows.values()), default=0)
    for key, area in result.areas.items():
        if key not in area_rows:
            order += 1
            area_rows[key] = DecisionArea.objects.create(
                workspace_id=ctx.project.workspace_id,
                project_id=ctx.project.id,
                key=key,
                name=area["name"],
                sort_order=order,
            )
        for position, (mechanism_key, name) in enumerate(area["mechanisms"].items(), start=1):
            if (key, mechanism_key) not in mechanism_rows:
                mechanism_rows[(key, mechanism_key)] = DecisionArea.objects.create(
                    workspace_id=ctx.project.workspace_id,
                    project_id=ctx.project.id,
                    parent=area_rows[key],
                    key=mechanism_key,
                    name=name,
                    sort_order=position,
                )

    rows = []
    for d in result.decisions:
        sources = list(d["sources"])
        for ref in d["issues"]:
            if ref not in result.issues and NOT_FOUND.format(ref) not in sources:
                sources.append(NOT_FOUND.format(ref))
        rows.append(
            Decision(
                workspace_id=ctx.project.workspace_id,
                project_id=ctx.project.id,
                number=d["number"],
                title=d["title"],
                rationale=d["rationale"],
                rejected=d["rejected"],
                note=d["note"],
                area=area_rows[d["area"]],
                mechanism=mechanism_rows[(d["area"], d["mechanism"])] if d["mechanism"] else None,
                area2=area_rows[d["area2"]] if d["area2"] else None,
                kind=d["kind"],
                status=d["status"],
                decided_by=d["decided_by"],
                confirmed=d["confirmed"],
                decided_on=d["decided_on"],
                review_on=d["review_on"],
                review_condition=d["review_condition"],
                sources=sources,
                pending_rollout=False,
                needs_review=d["needs_review"],
                estimated=d["estimated"],
                created_by=ctx.user,
                updated_by=ctx.user,
            )
        )
    Decision.objects.bulk_create(rows)
    numbers = {row.number: row for row in rows}
    numbers.update(
        {
            d.number: d
            for d in Decision.objects.filter(project_id=ctx.project.id, number__in=list(result.existing)).only(
                "id", "number"
            )
        }
    )

    chained = []
    for d in result.decisions:
        if d["supersedes"] is not None:
            row = numbers[d["number"]]
            row.supersedes = numbers[d["supersedes"]]
            chained.append(row)
    if chained:
        Decision.objects.bulk_update(chained, ["supersedes"])

    pairs = set()
    for d in result.decisions:
        for other in d["related"]:
            pairs.add((min(d["number"], other), max(d["number"], other)))
    DecisionRelation.objects.bulk_create(
        [DecisionRelation(low=numbers[low], high=numbers[high]) for low, high in sorted(pairs)], ignore_conflicts=True
    )
    DecisionIssue.objects.bulk_create(
        [
            DecisionIssue(decision=numbers[d["number"]], issue=result.issues[ref])
            for d in result.decisions
            for ref in d["issues"]
            if ref in result.issues
        ],
        ignore_conflicts=True,
    )
    DecisionEvent.objects.bulk_create(
        [
            DecisionEvent(
                decision=row,
                project_id=ctx.project.id,
                actor=ctx.user,
                channel=ctx.channel,
                kind="imported",
                changes={},
                occurred_at=ctx.now,
            )
            for row in rows
        ]
    )
    counter.last_number = max(counter.last_number, max(numbers_of(result)))
    counter.save(update_fields=["last_number", "updated_at"])
    return counter.last_number


def numbers_of(result):
    return [d["number"] for d in result.decisions]


def run(ctx, data, commit):
    """{"dry_run", "errors", "warnings", "summary", "sources", "last_number"}; `ok` False when errors."""
    result = check(ctx, data)
    response = {"dry_run": not commit, "errors": result.errors, "warnings": result.warnings}
    if result.errors:
        return False, response
    response.update(summary(result))
    try:
        with transaction.atomic():
            response["last_number"] = _write(ctx, result)
            if not commit:
                raise _DryRun()
    except _DryRun:
        pass
    except DecisionError as e:
        result.error(str(e), e.number, e.field)
        return False, response
    except DatabaseError:
        # Never the database's message: it may quote values of the file
        result.error("the database rejected the file; nothing was written")
        return False, response
    return True, response
