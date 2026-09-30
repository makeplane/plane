# Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.utils.project_template_payload import WORK_ITEM_EXPORT_HINT_KEYS
from plane.utils.project_work_item_import import (
    WorkItemImportOptions,
    _coerce_list,
    import_work_items_into_project,
)

COMMUNITY_EXPORT_REQUIRED_KEYS = frozenset({"name"})
COMMUNITY_EXPORT_STRONG_HINTS = frozenset({"state_name", "project_name", "project_identifier", "identifier"})


def _normalize_key(key: str) -> str:
    return str(key).strip().lower().replace(" ", "_")


def is_community_work_item_export(rows: list[dict]) -> bool:
    if not rows:
        return False
    sample = next((row for row in rows if isinstance(row, dict)), None)
    if not sample:
        return False
    keys = {_normalize_key(key) for key in sample.keys()}
    if "external_key" in keys and "state" in keys and "state_name" not in keys:
        return False
    if keys.intersection(WORK_ITEM_EXPORT_HINT_KEYS):
        return True
    return bool(keys.intersection(COMMUNITY_EXPORT_STRONG_HINTS) and "name" in keys)


def _pick(row: dict, *keys: str):
    for key in keys:
        if key in row and row[key] not in [None, ""]:
            return row[key]
        wanted = _normalize_key(key)
        for existing, value in row.items():
            if _normalize_key(existing) == wanted and value not in [None, ""]:
                return value
    return None


def _split_people(value) -> tuple[list[str], list[str]]:
    """Split a people column into e-mails and plain names; exports carry e-mails, older files names."""
    emails: list[str] = []
    names: list[str] = []
    for entry in _coerce_list(value):
        text = str(entry).strip()
        if not text:
            continue
        if "@" in text:
            emails.append(text)
        else:
            names.append(text)
    return emails, names


def map_community_export_rows(rows: list[dict]) -> list[dict]:
    mapped: list[dict] = []
    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            continue
        name = str(_pick(row, "name") or "").strip()
        if not name:
            continue

        identifier = str(_pick(row, "identifier") or "").strip()
        sequence_id = _pick(row, "sequence_id")
        external_key = identifier or (f"SEQ-{sequence_id}" if sequence_id not in [None, ""] else f"ROW-{index + 1}")

        parent = str(_pick(row, "parent") or "").strip()
        state = _pick(row, "state_name", "state")
        description_html = _pick(row, "description_html")
        description = _pick(row, "description") or description_html
        target_date = _pick(row, "target_date", "due_date")
        start_date = _pick(row, "start_date")
        duration = _pick(row, "duration")
        issue_type = _pick(row, "issue_type")
        labels = _pick(row, "labels")
        assignee_emails, assignee_names = _split_people(_pick(row, "assignees", "assignee_emails"))
        subscriber_emails, subscriber_names = _split_people(_pick(row, "subscribers", "subscriber_emails"))

        mapped.append(
            {
                "external_key": external_key,
                "name": name,
                "state": state,
                "priority": _pick(row, "priority") or "none",
                "description": description,
                "description_html": description_html or description,
                "start_date": start_date,
                "target_date": target_date,
                "duration": duration,
                "estimate": _pick(row, "estimate", "estimate_point"),
                "labels": labels,
                "modules": _pick(row, "modules"),
                "cycles": _pick(row, "cycles", "cycle"),
                "relations": _pick(row, "relations"),
                "assignee_emails": assignee_emails,
                "assignee_names": assignee_names,
                "subscriber_emails": subscriber_emails,
                "subscriber_names": subscriber_names,
                "parent_external_key": parent,
                "issue_type": issue_type,
                "is_draft": _pick(row, "is_draft"),
                "custom_properties": _pick(row, "custom_properties") or {},
            }
        )
    return mapped


def import_community_work_items_into_project(
    *,
    project,
    user,
    rows: list[dict],
    warnings: list[str] | None = None,
    options: WorkItemImportOptions | None = None,
):
    if not is_community_work_item_export(rows):
        raise ValueError(
            {
                "error": (
                    "This file does not look like a Plane work-items export (CSV/XLSX/JSON). "
                    "Use the file produced by “Export work items” in workspace settings."
                )
            }
        )

    mapped = map_community_export_rows(rows)
    if not mapped:
        raise ValueError({"error": "No work item rows with a name were found in the file."})

    return import_work_items_into_project(
        project=project,
        user=user,
        rows=mapped,
        warnings=warnings,
        options=options,
    )
