# Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
import re
import uuid
from dataclasses import asdict, dataclass, fields
from datetime import date, datetime, time, timezone as dt_timezone

from django.db import transaction
from django.db.models import Max, Q

from plane.db.models import (
    Cycle,
    CycleIssue,
    EstimatePoint,
    Issue,
    IssueActivity,
    IssueAssignee,
    IssueLabel,
    IssuePropertyValue,
    IssueRelation,
    IssueSequence,
    IssueSubscriber,
    IssueType,
    Label,
    Module,
    ModuleIssue,
    Project,
    ProjectIssueType,
    ProjectMember,
    State,
    WorkspaceMember,
)
from plane.db.models.project import ROLE
from plane.utils.html_processor import strip_tags
from plane.utils.issue_relation_mapper import get_actual_relation
from plane.utils.issue_type_property import validate_property_value
from plane.utils.work_item_duration import (
    normalize_work_item_duration,
    reconcile_work_item_duration,
    to_work_item_date,
)

MAX_WORK_ITEMS_IMPORT = 500
ALLOWED_PRIORITIES = frozenset({"urgent", "high", "medium", "low", "none"})
DEFAULT_LABEL_COLOR = "#858585"
ISO_DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# Relation types whose canonical database row points the other way round
_MIRRORED_RELATIONS = frozenset({"blocking", "start_after", "finish_after", "implements"})
_ALLOWED_RELATIONS = frozenset(
    {"blocked_by", "blocking", "relates_to", "duplicate", "start_before", "start_after",
     "finish_before", "finish_after", "implemented_by", "implements"}
)
_IDENTIFIER_PATTERN = re.compile(r"^([A-Za-z0-9]+)-(\d+)$")

_TRUE_TOKENS = frozenset({"1", "true", "yes", "on"})
_FALSE_TOKENS = frozenset({"0", "false", "no", "off"})


def _coerce_optional_bool(value, *, default: bool = True) -> bool:
    """Read a form field that is allowed to be missing; anything unreadable keeps the default."""
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in _TRUE_TOKENS:
        return True
    if text in _FALSE_TOKENS:
        return False
    return default


@dataclass(frozen=True)
class WorkItemImportOptions:
    """
    What an import is allowed to bring in.

    Everything is on unless the caller opts out, so a file imports in full by default and a
    client that knows nothing about these options keeps working.
    """

    assignees: bool = True
    subscribers: bool = True
    relations: bool = True
    parents: bool = True
    dates: bool = True
    labels: bool = True
    modules: bool = True
    cycles: bool = True

    @classmethod
    def from_request_data(cls, data) -> "WorkItemImportOptions":
        """Multipart fields arrive as strings; an absent field means the option stays on."""
        return cls(**{field.name: _coerce_optional_bool(data.get(field.name)) for field in fields(cls)})

    def as_dict(self) -> dict:
        return asdict(self)


def _coerce_list(value) -> list:
    if value in [None, ""]:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return []
        if text.startswith("["):
            try:
                parsed = json.loads(text)
                return parsed if isinstance(parsed, list) else [text]
            except (json.JSONDecodeError, TypeError):
                pass
        return [part.strip() for part in text.split(",") if part.strip()]
    return []


def _coerce_dict(value) -> dict:
    if value in [None, ""]:
        return {}
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except (json.JSONDecodeError, TypeError):
            return {}
    return {}


def _parse_import_date(value):
    """Return an ISO date string, or None when the cell cannot be read as a date."""
    if value in [None, ""]:
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    text = str(value).strip()
    if not text:
        return None
    if ISO_DATE_PATTERN.match(text):
        try:
            return date.fromisoformat(text).isoformat()
        except ValueError:
            return None
    # Exports always write ISO dates; a spreadsheet may hand back a timestamp instead
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return None


def _coerce_relations(value) -> list[dict]:
    """Accept the export shape [{"type": ..., "issue": ...}] and tolerate bare identifiers."""
    entries = []
    raw = value
    if isinstance(raw, str):
        text = raw.strip()
        if not text:
            return []
        try:
            raw = json.loads(text)
        except (json.JSONDecodeError, TypeError):
            raw = [part.strip() for part in text.split(",") if part.strip()]
    if isinstance(raw, dict):
        raw = [raw]
    if not isinstance(raw, list):
        return []

    for item in raw:
        if isinstance(item, dict):
            target = str(item.get("issue") or item.get("identifier") or "").strip()
            relation_type = str(item.get("type") or "relates_to").strip().lower()
        else:
            target = str(item).strip()
            relation_type = "relates_to"
        if not target:
            continue
        entries.append({"type": relation_type, "issue": target})
    return entries


def _resolve_people(
    *,
    emails,
    names,
    members_by_email: dict,
    members_by_name: dict,
    project_member_ids: set,
    warnings: list[str],
    row_number: int,
    role: str,
    assignable_member_ids: set | None = None,
) -> list:
    """Resolve a people column to user ids, preferring e-mail over name.

    Only members of the target project are returned; anyone else is reported as a warning.
    When assignable_member_ids is given, guests are dropped on top of that: the work item API
    refuses to assign them, so an import must not create what the rest of Plane would reject.
    """
    resolved = []
    # The value each id came from, so a skipped person can be named in the warning
    source_text: dict = {}
    pending_names = _coerce_list(names)

    for entry in _coerce_list(emails):
        text = str(entry).strip()
        if not text:
            continue
        if "@" not in text:
            pending_names.append(text)
            continue
        member = members_by_email.get(text.lower())
        if member is None:
            warnings.append(f'Row {row_number}: {role} "{text}" is not a member of this workspace, skipped')
            continue
        if member.id not in resolved:
            resolved.append(member.id)
        source_text.setdefault(member.id, text)

    for entry in pending_names:
        text = str(entry).strip()
        if not text or "@" in text:
            continue
        member = members_by_name.get(text.lower())
        if member is None:
            warnings.append(f'Row {row_number}: {role} "{text}" was not matched to a person, skipped')
            continue
        if member.id not in resolved:
            resolved.append(member.id)
        source_text.setdefault(member.id, text)

    # Someone who only belongs to the workspace cannot open the project, so assigning them would
    # leave the work item pointing at a person the project does not know.
    kept = [member_id for member_id in resolved if member_id in project_member_ids]
    outsiders = sorted(
        source_text.get(member_id, str(member_id))
        for member_id in resolved
        if member_id not in project_member_ids
    )
    if outsiders:
        warnings.append(
            f'Row {row_number}: {role}(s) {", ".join(outsiders)} belong to the workspace '
            "but not to this project, skipped"
        )

    if assignable_member_ids is not None:
        guests = sorted(
            source_text.get(member_id, str(member_id))
            for member_id in kept
            if member_id not in assignable_member_ids
        )
        kept = [member_id for member_id in kept if member_id in assignable_member_ids]
        if guests:
            warnings.append(
                f'Row {row_number}: {role}(s) {", ".join(guests)} are guests in this project '
                "and cannot be assigned, skipped"
            )
    return kept


def _member_values_to_ids(
    value,
    members_by_email: dict,
    members_by_name: dict,
    project_member_keys: set[str],
    assignable_member_keys: set[str],
) -> tuple[list[str], list[str], list[str], list[str]]:
    """
    Turn member picker values written as e-mails back into user ids.

    Returns the ids to store, the values that matched nobody, the people who belong to the
    workspace but not to this project, and the guests. The last two groups are reported rather
    than stored: the member dropdown offers neither, so an import must not write a value the
    rest of Plane would never produce.

    Both id sets hold strings, because a picker value is stored and compared as text.
    """
    entries = value if isinstance(value, list) else [value]
    resolved: list[str] = []
    unknown: list[str] = []
    outsiders: list[str] = []
    guests: list[str] = []
    for entry in entries:
        text = str(entry).strip()
        if not text:
            continue
        member = members_by_email.get(text.lower()) if "@" in text else members_by_name.get(text.lower())
        if member:
            candidate = str(member.id)
        else:
            candidate = _canonical_uuid(text)
            if candidate is None:
                unknown.append(text)
                continue
        if candidate not in project_member_keys:
            outsiders.append(text)
            continue
        if candidate not in assignable_member_keys:
            guests.append(text)
            continue
        resolved.append(candidate)
    return resolved, unknown, outsiders, guests


def _canonical_uuid(text: str) -> str | None:
    """Rewrite an id the way str(UUID) writes it, so a hand-typed value still matches."""
    try:
        return str(uuid.UUID(str(text)))
    except (ValueError, AttributeError, TypeError):
        return None


def _create_missing_cycles(*, project: Project, user, prepared: list[dict], cycles_by_name: dict) -> dict:
    """
    Create the cycles named in the file but absent from the project.

    A cycle stores a period, which the work item export does not carry, so the period is
    derived from the work items assigned to it. Plane treats a cycle without dates as a
    draft, which is what an undated cycle becomes.
    """
    spans: dict[str, dict] = {}
    for item in prepared:
        name = item.get("cycle_name")
        if not name:
            continue
        key = name.lower()
        if key in cycles_by_name:
            continue
        span = spans.setdefault(key, {"name": name, "start": None, "end": None})
        for field, bound, pick in (("start_date", "start", min), ("target_date", "end", max)):
            value = item.get(field)
            if not value:
                continue
            span[bound] = value if span[bound] is None else pick(span[bound], value)

    created = {}
    for key, span in spans.items():
        created[key] = Cycle.objects.create(
            name=span["name"][:255],
            project=project,
            workspace=project.workspace,
            owned_by=user,
            created_by=user,
            start_date=_to_cycle_datetime(span["start"]),
            end_date=_to_cycle_datetime(span["end"]),
        )
    return created


def _to_cycle_datetime(value):
    """Cycles store timestamps while work items store plain dates."""
    parsed = to_work_item_date(value)
    if parsed is None:
        return None
    return datetime.combine(parsed, time.min, tzinfo=dt_timezone.utc)


def _lookup_existing_targets(project: Project, prepared: list[dict], key_to_issue: dict) -> dict:
    """Resolve PROJ-123 references that the file itself does not contain."""
    wanted: set[str] = set()
    for item in prepared:
        parent_key = item.get("parent_external_key") or ""
        if parent_key and parent_key.lower() not in key_to_issue:
            wanted.add(parent_key)
        for relation in item.get("relations") or []:
            target = relation.get("issue") or ""
            if target and target.lower() not in key_to_issue:
                wanted.add(target)

    sequences_by_identifier: dict[str, set[int]] = {}
    for text in wanted:
        match = _IDENTIFIER_PATTERN.match(str(text).strip())
        if match:
            sequences_by_identifier.setdefault(match.group(1).upper(), set()).add(int(match.group(2)))

    if not sequences_by_identifier:
        return {}

    lookup = Q()
    for identifier, sequences in sequences_by_identifier.items():
        lookup |= Q(project__identifier=identifier, sequence_id__in=sequences)

    found = {}
    for issue in (
        Issue.objects.filter(workspace_id=project.workspace_id, deleted_at__isnull=True)
        .filter(lookup)
        .select_related("project")
    ):
        found[f"{issue.project.identifier}-{issue.sequence_id}".lower()] = issue
    return found


def _normalize_description_html(raw) -> str:
    if raw in [None, ""]:
        return "<p></p>"
    text = str(raw).strip()
    if not text:
        return "<p></p>"
    if "<" in text and ">" in text:
        return text
    return f"<p>{text}</p>"


@transaction.atomic
def import_work_items_into_project(
    *,
    project: Project,
    user,
    rows: list[dict],
    warnings: list[str] | None = None,
    options: WorkItemImportOptions | None = None,
) -> dict:
    """
    Create work items from export rows.

    Runs in one transaction so labels and modules created along the way are rolled back
    together with the work items if anything fails.

    Every option is applied while the rows are prepared, so the prepared payload never holds
    data the caller asked to leave out and the writing phase needs no knowledge of the options.
    """
    warnings = warnings if warnings is not None else []
    options = options or WorkItemImportOptions()

    if not rows:
        return {"created_work_items": 0, "warnings": warnings}

    if len(rows) > MAX_WORK_ITEMS_IMPORT:
        raise ValueError(
            {
                "error": (
                    f"Import contains more than {MAX_WORK_ITEMS_IMPORT} work items. "
                    "Reduce the file size or split the import."
                )
            }
        )

    states_by_name = {
        state.name.lower(): state
        for state in State.objects.filter(project_id=project.id, deleted_at__isnull=True, is_triage=False)
    }
    default_state = next((s for s in states_by_name.values() if s.default), None)
    if default_state is None and states_by_name:
        default_state = next(iter(states_by_name.values()))

    labels_by_name = {
        label.name.lower(): label
        for label in Label.objects.filter(project_id=project.id, deleted_at__isnull=True)
    }

    issue_type_ids = ProjectIssueType.objects.filter(
        project_id=project.id,
        deleted_at__isnull=True,
    ).values_list("issue_type_id", flat=True)
    types_by_name = {
        issue_type.name.lower(): issue_type
        for issue_type in IssueType.objects.filter(id__in=issue_type_ids, deleted_at__isnull=True)
    }

    modules_by_name = {
        module.name.strip().lower(): module
        for module in Module.objects.filter(project_id=project.id, deleted_at__isnull=True)
    }
    cycles_by_name = {
        cycle.name.strip().lower(): cycle
        for cycle in Cycle.objects.filter(project_id=project.id, deleted_at__isnull=True)
    }
    estimate_points_by_value = {}
    if project.estimate_id:
        estimate_points_by_value = {
            str(point.value).strip().lower(): point
            for point in EstimatePoint.objects.filter(
                estimate_id=project.estimate_id,
                deleted_at__isnull=True,
            )
        }

    members_by_email = {}
    members_by_name = {}
    project_member_ids = set()
    # Guests belong to the project but Plane never lets them hold a work item
    assignable_member_ids = set()

    def _index_member(member, *, in_project: bool, can_be_assigned: bool = False) -> None:
        if not member:
            return
        if in_project:
            project_member_ids.add(member.id)
            if can_be_assigned:
                assignable_member_ids.add(member.id)
        email = (member.email or "").strip().lower()
        if email:
            members_by_email.setdefault(email, member)
        # Exports write full names, the UI shows display names; index both so either matches
        for candidate in (member.display_name, member.full_name):
            key = (candidate or "").strip().lower()
            if key:
                members_by_name.setdefault(key, member)

    for project_member in ProjectMember.objects.filter(
        project_id=project.id,
        is_active=True,
        deleted_at__isnull=True,
    ).select_related("member"):
        _index_member(
            project_member.member,
            in_project=True,
            can_be_assigned=project_member.role >= ROLE.MEMBER.value,
        )

    # Fallback: workspace members (may not be project members yet)
    for wm in WorkspaceMember.objects.filter(
        workspace_id=project.workspace_id,
        is_active=True,
    ).select_related("member"):
        _index_member(wm.member, in_project=False)

    # _index_member keys on UUID objects while member picker values are text, so both sets are
    # written out once here instead of once per property per row.
    project_member_keys = {str(member_id) for member_id in project_member_ids}
    assignable_member_keys = {str(member_id) for member_id in assignable_member_ids}

    type_properties_by_type: dict = {}
    for issue_type in types_by_name.values():
        props = {
            prop.title.lower(): prop
            for prop in issue_type.properties.filter(deleted_at__isnull=True, is_active=True)
        }
        type_properties_by_type[str(issue_type.id)] = props

    prepared: list[dict] = []
    seen_keys: set[str] = set()
    created_labels: list[str] = []
    created_modules: list[str] = []
    created_cycles: list[str] = []
    # Counted per kind instead of per row, so turning an option off cannot flood the response
    skipped_by_option: dict[str, int] = {}

    def _note_skipped(kind: str, present) -> None:
        if present not in [None, "", [], {}]:
            skipped_by_option[kind] = skipped_by_option.get(kind, 0) + 1

    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            continue
        name = str(row.get("name", "")).strip()
        if not name:
            warnings.append(f"Row {index + 1}: skipped work item without name")
            continue

        external_key = str(row.get("external_key", "")).strip() or f"ROW-{index + 1}"
        if external_key.lower() in seen_keys:
            warnings.append(f'Row {index + 1}: duplicate external_key "{external_key}", using ROW-{index + 1}')
            external_key = f"ROW-{index + 1}"
        seen_keys.add(external_key.lower())

        state_name = str(row.get("state", "")).strip().lower()
        state = states_by_name.get(state_name) if state_name else default_state
        if state_name and state is None:
            warnings.append(f'Row {index + 1}: unknown state "{row.get("state")}", using default')
            state = default_state
        if state is None:
            raise ValueError({"error": "Project has no states to attach work items to."})

        raw_priority = row.get("priority")
        priority = str(raw_priority if raw_priority not in [None, ""] else "none").strip().lower()
        if priority not in ALLOWED_PRIORITIES:
            warnings.append(f'Row {index + 1}: unknown priority "{raw_priority}", set to none')
            priority = "none"

        issue_type_name = str(row.get("issue_type", "")).strip().lower()
        issue_type = types_by_name.get(issue_type_name) if issue_type_name else None
        if issue_type_name and issue_type is None:
            warnings.append(f'Row {index + 1}: unknown issue type "{row.get("issue_type")}", left empty')

        # Labels missing from the project are created, so a file imports the same way into
        # a fresh project as into one that was prepared by hand.
        label_ids = []
        if options.labels:
            for label_name in _coerce_list(row.get("labels")):
                clean_name = str(label_name).strip()
                if not clean_name:
                    continue
                label = labels_by_name.get(clean_name.lower())
                if label is None:
                    label = Label.objects.create(
                        name=clean_name[:255],
                        color=DEFAULT_LABEL_COLOR,
                        project=project,
                        workspace=project.workspace,
                        created_by=user,
                    )
                    labels_by_name[clean_name.lower()] = label
                    created_labels.append(clean_name)
                if label.id not in label_ids:
                    label_ids.append(label.id)
        else:
            _note_skipped("label", row.get("labels"))

        # Modules only need a name, so missing ones are created alongside labels
        module_ids = []
        if options.modules:
            for module_name in _coerce_list(row.get("modules")):
                clean_name = str(module_name).strip()
                if not clean_name:
                    continue
                module = modules_by_name.get(clean_name.lower())
                if module is None:
                    module = Module.objects.create(
                        name=clean_name[:255],
                        project=project,
                        workspace=project.workspace,
                        created_by=user,
                    )
                    modules_by_name[clean_name.lower()] = module
                    created_modules.append(clean_name)
                if module.id not in module_ids:
                    module_ids.append(module.id)
        else:
            _note_skipped("module", row.get("modules"))

        # A work item belongs to at most one cycle; the cycle itself is created after the
        # loop, once the dates of all its work items are known.
        cycle_name = None
        if options.cycles:
            for raw_cycle_name in _coerce_list(row.get("cycles")):
                clean_name = str(raw_cycle_name).strip()
                if not clean_name:
                    continue
                if cycle_name is None:
                    cycle_name = clean_name
                elif clean_name.lower() != cycle_name.lower():
                    warnings.append(f'Row {index + 1}: a work item can belong to one cycle, "{clean_name}" skipped')
        else:
            _note_skipped("cycle", row.get("cycles"))

        assignee_ids = []
        if options.assignees:
            assignee_ids = _resolve_people(
                emails=row.get("assignee_emails"),
                names=row.get("assignee_names") or row.get("assignees"),
                members_by_email=members_by_email,
                members_by_name=members_by_name,
                project_member_ids=project_member_ids,
                assignable_member_ids=assignable_member_ids,
                warnings=warnings,
                row_number=index + 1,
                role="assignee",
            )
        else:
            _note_skipped(
                "assignee",
                row.get("assignee_emails") or row.get("assignee_names") or row.get("assignees"),
            )

        subscriber_ids = []
        if options.subscribers:
            subscriber_ids = _resolve_people(
                emails=row.get("subscriber_emails"),
                names=row.get("subscriber_names") or row.get("subscribers"),
                members_by_email=members_by_email,
                members_by_name=members_by_name,
                project_member_ids=project_member_ids,
                warnings=warnings,
                row_number=index + 1,
                role="subscriber",
            )
        else:
            _note_skipped(
                "subscriber",
                row.get("subscriber_emails") or row.get("subscriber_names") or row.get("subscribers"),
            )

        estimate_point_id = None
        raw_estimate = row.get("estimate")
        if raw_estimate not in [None, ""]:
            point = estimate_points_by_value.get(str(raw_estimate).strip().lower())
            if point:
                estimate_point_id = point.id
            else:
                warnings.append(
                    f'Row {index + 1}: estimate "{raw_estimate}" is not part of this project\'s estimate, skipped'
                )

        description_html = _normalize_description_html(row.get("description_html") or row.get("description"))
        custom_properties = _coerce_dict(row.get("custom_properties"))

        raw_start_date = row.get("start_date")
        raw_target_date = row.get("target_date")
        start_date = None
        target_date = None
        duration = None
        if options.dates:
            start_date = _parse_import_date(raw_start_date)
            target_date = _parse_import_date(raw_target_date)
            if raw_start_date not in [None, ""] and start_date is None:
                warnings.append(f'Row {index + 1}: could not read start date "{raw_start_date}", left empty')
            if raw_target_date not in [None, ""] and target_date is None:
                warnings.append(f'Row {index + 1}: could not read target date "{raw_target_date}", left empty')

            raw_duration = row.get("duration")
            duration = normalize_work_item_duration(raw_duration)
            if raw_duration not in [None, ""] and duration is None:
                warnings.append(f'Row {index + 1}: invalid duration "{raw_duration}", derived from the dates instead')

            # Run the same reconciliation the work item API runs on create, so an imported item keeps
            # duration, start date and target date consistent with one another.
            duration_payload = {"start_date": start_date, "target_date": target_date}
            if duration is not None:
                duration_payload["duration"] = duration
            derived = reconcile_work_item_duration(None, duration_payload)
            duration = derived.get("duration", duration)
            if "start_date" in derived:
                start_date = derived["start_date"]
            if "target_date" in derived:
                target_date = derived["target_date"]
            # Reconciliation may hand back ISO strings; keep one type so the values can be
            # compared when a cycle derives its period from them.
            start_date = to_work_item_date(start_date)
            target_date = to_work_item_date(target_date)
        else:
            _note_skipped("date", raw_start_date or raw_target_date or row.get("duration"))

        is_draft = row.get("is_draft")
        if isinstance(is_draft, str):
            is_draft = is_draft.strip().lower() in {"1", "true", "yes", "on"}
        else:
            is_draft = bool(is_draft)

        raw_parent_key = str(row.get("parent_external_key", "") or "").strip()
        if not options.parents:
            _note_skipped("parent", raw_parent_key)
            raw_parent_key = ""

        raw_relations = _coerce_relations(row.get("relations")) if options.relations else []
        if not options.relations:
            _note_skipped("relation", row.get("relations"))

        prepared.append(
            {
                "external_key": external_key,
                "name": name[:255],
                "description_html": description_html,
                "description_stripped": strip_tags(description_html)[:3000],
                "state": state,
                "priority": priority,
                "start_date": start_date,
                "target_date": target_date,
                "duration": duration,
                "is_draft": is_draft,
                "parent_external_key": raw_parent_key,
                "issue_type": issue_type,
                "estimate_point_id": estimate_point_id,
                "label_ids": label_ids,
                "module_ids": module_ids,
                "cycle_name": cycle_name,
                "assignee_ids": assignee_ids,
                "subscriber_ids": subscriber_ids,
                "relations": raw_relations,
                "custom_properties": custom_properties,
            }
        )

    if not prepared:
        return {"created_work_items": 0, "warnings": warnings}

    # Cycles are created once the whole file is read, so a new cycle can take its period
    # from the work items that land in it. Without any dated work item it stays a draft.
    if options.cycles:
        for name, cycle in _create_missing_cycles(
            project=project,
            user=user,
            prepared=prepared,
            cycles_by_name=cycles_by_name,
        ).items():
            cycles_by_name[name] = cycle
            created_cycles.append(cycle.name)

    last_id = IssueSequence.objects.filter(project=project).aggregate(largest=Max("sequence"))["largest"]
    next_sequence = 1 if last_id is None else int(last_id) + 1

    largest_sort = (
        Issue.objects.filter(project=project, deleted_at__isnull=True).aggregate(largest=Max("sort_order"))["largest"]
    )
    next_sort = 65535 if largest_sort is None else float(largest_sort) + 10000

    key_to_issue: dict[str, Issue] = {}

    with transaction.atomic():
        issues_to_create: list[Issue] = []
        for item in prepared:
            issues_to_create.append(
                Issue(
                    project=project,
                    workspace=project.workspace,
                    name=item["name"],
                    description_html=item["description_html"],
                    description_stripped=item["description_stripped"],
                    state=item["state"],
                    priority=item["priority"],
                    start_date=item["start_date"],
                    target_date=item["target_date"],
                    duration=item["duration"],
                    is_draft=item["is_draft"],
                    type=item["issue_type"],
                    estimate_point_id=item["estimate_point_id"],
                    sequence_id=next_sequence,
                    sort_order=next_sort,
                    created_by=user,
                )
            )
            next_sequence += 1
            next_sort += 10000

        created_issues = Issue.objects.bulk_create(issues_to_create, batch_size=200)
        for item, issue in zip(prepared, created_issues):
            key_to_issue[item["external_key"].lower()] = issue

        IssueSequence.objects.bulk_create(
            [
                IssueSequence(
                    issue=issue,
                    sequence=issue.sequence_id,
                    project=project,
                    workspace=project.workspace,
                )
                for issue in created_issues
            ],
            batch_size=200,
        )

        IssueActivity.objects.bulk_create(
            [
                IssueActivity(
                    issue=issue,
                    actor=user,
                    project=project,
                    workspace=project.workspace,
                    comment="created the issue",
                    verb="created",
                    created_by=user,
                )
                for issue in created_issues
            ],
            batch_size=200,
        )

        # Targets that the file references but does not contain are looked up in the workspace,
        # so a partial import can still hang off work items that already exist.
        existing_by_identifier = _lookup_existing_targets(project, prepared, key_to_issue)

        def _resolve_target(text: str):
            key = str(text).strip().lower()
            return key_to_issue.get(key) or existing_by_identifier.get(key)

        # Pass 2: parent links
        parent_updates = []
        for item, issue in zip(prepared, created_issues):
            parent_key = item["parent_external_key"]
            if not parent_key:
                continue
            parent = _resolve_target(parent_key)
            if parent is None:
                warnings.append(
                    f'Work item "{item["external_key"]}": parent "{parent_key}" was not found, skipped'
                )
                continue
            if parent.id == issue.id:
                continue
            issue.parent = parent
            parent_updates.append(issue)
        if parent_updates:
            Issue.objects.bulk_update(parent_updates, ["parent"], batch_size=200)

        label_rows = []
        assignee_rows = []
        subscriber_rows = []
        module_rows = []
        cycle_rows = []
        relation_rows = []
        property_rows = []
        seen_relations: set[tuple] = set()

        for item, issue in zip(prepared, created_issues):
            for label_id in item["label_ids"]:
                label_rows.append(
                    IssueLabel(
                        issue=issue,
                        label_id=label_id,
                        project=project,
                        workspace=project.workspace,
                    )
                )
            for assignee_id in item["assignee_ids"]:
                assignee_rows.append(
                    IssueAssignee(
                        issue=issue,
                        assignee_id=assignee_id,
                        project=project,
                        workspace=project.workspace,
                    )
                )
            for subscriber_id in item["subscriber_ids"]:
                subscriber_rows.append(
                    IssueSubscriber(
                        issue=issue,
                        subscriber_id=subscriber_id,
                        project=project,
                        workspace=project.workspace,
                    )
                )
            for module_id in item["module_ids"]:
                module_rows.append(
                    ModuleIssue(
                        issue=issue,
                        module_id=module_id,
                        project=project,
                        workspace=project.workspace,
                    )
                )
            if item["cycle_name"]:
                cycle = cycles_by_name.get(item["cycle_name"].lower())
                if cycle:
                    cycle_rows.append(
                        CycleIssue(
                            issue=issue,
                            cycle_id=cycle.id,
                            project=project,
                            workspace=project.workspace,
                        )
                    )

            for relation in item["relations"]:
                relation_type = relation["type"]
                if relation_type not in _ALLOWED_RELATIONS:
                    warnings.append(
                        f'Work item "{item["external_key"]}": unknown relation "{relation_type}", skipped'
                    )
                    continue
                target = _resolve_target(relation["issue"])
                if target is None:
                    warnings.append(
                        f'Work item "{item["external_key"]}": related item "{relation["issue"]}" '
                        "was not found, skipped"
                    )
                    continue
                if target.id == issue.id:
                    continue

                # The database keeps one row per relation, on the canonical side; a mirrored
                # type such as "blocking" is stored as the opposite row with the sides swapped.
                canonical_type = get_actual_relation(relation_type)
                source, related = (target, issue) if relation_type in _MIRRORED_RELATIONS else (issue, target)
                if canonical_type in {"relates_to", "duplicate"}:
                    dedupe_key = (canonical_type, *sorted([str(source.id), str(related.id)]))
                else:
                    dedupe_key = (canonical_type, str(source.id), str(related.id))
                if dedupe_key in seen_relations:
                    continue
                seen_relations.add(dedupe_key)
                relation_rows.append(
                    IssueRelation(
                        issue=source,
                        related_issue=related,
                        relation_type=canonical_type,
                        project=project,
                        workspace=project.workspace,
                        created_by=user,
                    )
                )

            if item["issue_type"] and item["custom_properties"]:
                props = type_properties_by_type.get(str(item["issue_type"].id), {})
                for title, raw_value in item["custom_properties"].items():
                    prop = props.get(str(title).strip().lower())
                    if not prop:
                        warnings.append(
                            f'Work item "{item["external_key"]}": unknown custom property "{title}", skipped'
                        )
                        continue
                    if prop.property_type == "member_picker":
                        raw_value, unknown, outsiders, guests = _member_values_to_ids(
                            raw_value,
                            members_by_email,
                            members_by_name,
                            project_member_keys,
                            assignable_member_keys,
                        )
                        for missing in unknown:
                            warnings.append(
                                f'Work item "{item["external_key"]}": property "{title}" '
                                f'refers to unknown person "{missing}", skipped'
                            )
                        for outsider in outsiders:
                            warnings.append(
                                f'Work item "{item["external_key"]}": property "{title}" refers to '
                                f'"{outsider}", who is not a member of this project, skipped'
                            )
                        for guest in guests:
                            warnings.append(
                                f'Work item "{item["external_key"]}": property "{title}" refers to '
                                f'"{guest}", who is a guest in this project and cannot be picked, skipped'
                            )
                    try:
                        cleaned_value = validate_property_value(
                            property_type=prop.property_type,
                            value=raw_value,
                            select_mode=prop.select_mode or "single",
                            options=prop.options or [],
                        )
                    except ValueError as exc:
                        warnings.append(
                            f'Work item "{item["external_key"]}": property "{title}" invalid ({exc}), skipped'
                        )
                        continue
                    property_rows.append(
                        IssuePropertyValue(
                            issue=issue,
                            property=prop,
                            value=cleaned_value,
                            project=project,
                            workspace=project.workspace,
                        )
                    )

        if label_rows:
            IssueLabel.objects.bulk_create(label_rows, batch_size=500, ignore_conflicts=True)
        if assignee_rows:
            IssueAssignee.objects.bulk_create(assignee_rows, batch_size=500, ignore_conflicts=True)
        if subscriber_rows:
            IssueSubscriber.objects.bulk_create(subscriber_rows, batch_size=500, ignore_conflicts=True)
        if module_rows:
            ModuleIssue.objects.bulk_create(module_rows, batch_size=500, ignore_conflicts=True)
        if cycle_rows:
            CycleIssue.objects.bulk_create(cycle_rows, batch_size=500, ignore_conflicts=True)
        if relation_rows:
            IssueRelation.objects.bulk_create(relation_rows, batch_size=500, ignore_conflicts=True)
        if property_rows:
            IssuePropertyValue.objects.bulk_create(property_rows, batch_size=500, ignore_conflicts=True)

    if created_labels:
        warnings.append(f"Created {len(created_labels)} new label(s): {', '.join(sorted(set(created_labels)))}")
    if created_modules:
        warnings.append(f"Created {len(created_modules)} new module(s): {', '.join(sorted(set(created_modules)))}")
    if created_cycles:
        warnings.append(f"Created {len(created_cycles)} new cycle(s): {', '.join(sorted(set(created_cycles)))}")
        if not options.dates:
            warnings.append("New cycles were created without a period because dates were not imported.")

    for kind, count in sorted(skipped_by_option.items()):
        warnings.append(f"{count} work item(s) carried {kind} data that this import was asked to leave out")

    return {"created_work_items": len(created_issues), "warnings": warnings}
