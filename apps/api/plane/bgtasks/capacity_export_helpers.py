# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Helper functions for the capacity XLSX export Celery task.

Kept separate to stay under the 200-line limit in capacity_export_task.py.
"""

import re
from django.db.models import Count, Prefetch, Sum
from django.utils import timezone

from plane.db.models import IssueAssignee, IssueWorkLog, User


# ---------------------------------------------------------------------------
# Sheet name sanitization
# ---------------------------------------------------------------------------

_ILLEGAL_SHEET_CHARS = re.compile(r"[:\\/?\*\[\]]")
_MAX_SHEET_NAME_LEN = 31

DETAIL_HEADERS = [
    "Date",
    "Project",
    "Work Item ID",
    "Work Item",
    "Main Category",
    "Sub Category",
    "State",
    "Assignees",
    "Priority",
    "Time Spent (h)",
]
EMPTY_ROW_PLACEHOLDER = "No data for the selected range."


def sanitize_sheet_name(name: str, used: set) -> str:
    """Return an Excel-safe sheet name (≤31 chars, no illegal chars, unique)."""
    clean = _ILLEGAL_SHEET_CHARS.sub("", (name or "Sheet").strip()) or "Sheet"
    base = clean[:_MAX_SHEET_NAME_LEN]
    candidate = base
    suffix = 2
    while candidate.lower() in {s.lower() for s in used}:
        suffix_str = f"-{suffix}"
        candidate = base[: _MAX_SHEET_NAME_LEN - len(suffix_str)] + suffix_str
        suffix += 1
    used.add(candidate)
    return candidate


# ---------------------------------------------------------------------------
# Queryset builder
# ---------------------------------------------------------------------------

def build_worklog_queryset(job):
    """Return an IssueWorkLog QuerySet scoped to the job's workspace + date range."""
    filters = {
        "workspace__slug": job.workspace.slug,
        "logged_at__range": [job.date_from, job.date_to],
    }
    if job.member_ids:
        filters["logged_by_id__in"] = job.member_ids

    assignee_prefetch = Prefetch(
        "issue__issue_assignee",
        queryset=IssueAssignee.objects.select_related("assignee").order_by("assignee__display_name"),
    )

    qs = (
        IssueWorkLog.objects.filter(**filters)
        .select_related(
            "logged_by",
            "issue",
            "issue__project",
            "issue__state",
            "issue__main_task_category",
            "issue__sub_task_category",
        )
        .prefetch_related(assignee_prefetch)
        .order_by("logged_by_id", "logged_at", "id")
    )
    return qs


# ---------------------------------------------------------------------------
# Roster builder (so empty members still get a sheet)
# ---------------------------------------------------------------------------

def build_member_roster(job, totals):
    """
    Return ordered list of {logged_by_id, logged_by__display_name, total_minutes, entries}.

    Includes every member in job.member_ids even when they have zero worklogs in
    the selected range, so each selected member gets a sheet.
    """
    by_id = {str(row["logged_by_id"]): row for row in totals}

    if not job.member_ids:
        return sorted(totals, key=lambda r: (r.get("logged_by__display_name") or "").lower())

    users = User.objects.filter(id__in=job.member_ids).values("id", "display_name")
    roster = []
    for u in users:
        uid = str(u["id"])
        if uid in by_id:
            roster.append(by_id[uid])
        else:
            roster.append({
                "logged_by_id": u["id"],
                "logged_by__display_name": u.get("display_name") or "",
                "total_minutes": 0,
                "entries": 0,
            })
    roster.sort(key=lambda r: (r.get("logged_by__display_name") or "").lower())
    return roster


# ---------------------------------------------------------------------------
# Aggregation for Summary sheet
# ---------------------------------------------------------------------------

def compute_member_totals(qs):
    """Aggregate total minutes and entry count per member."""
    return list(
        qs.values("logged_by_id", "logged_by__display_name")
        .annotate(total_minutes=Sum("duration_minutes"), entries=Count("id"))
        .order_by("logged_by__display_name")
    )


# ---------------------------------------------------------------------------
# Summary sheet writer
# ---------------------------------------------------------------------------

def write_summary_sheet(wb, roster):
    """Append a 'Summary' sheet listing every selected member (zeros included)."""
    ws = wb.create_sheet(title="Summary")
    ws.append(["Member", "Total Hours", "Entry Count"])

    grand_minutes = 0
    grand_entries = 0

    for row in roster:
        member_name = row.get("logged_by__display_name") or "Unknown"
        minutes = row.get("total_minutes") or 0
        entries = row.get("entries") or 0
        ws.append([member_name, round(minutes / 60.0, 2), entries])
        grand_minutes += minutes
        grand_entries += entries

    if roster:
        ws.append(["TOTAL", round(grand_minutes / 60.0, 2), grand_entries])
    else:
        ws.append([EMPTY_ROW_PLACEHOLDER, "", ""])


# ---------------------------------------------------------------------------
# Per-member detail sheet writer
# ---------------------------------------------------------------------------

def _issue_identifier(issue) -> str:
    if not issue:
        return ""
    proj = getattr(issue, "project", None)
    code = getattr(proj, "identifier", "") if proj else ""
    seq = getattr(issue, "sequence_id", "")
    if code and seq:
        return f"{code}-{seq}"
    return str(seq or "")


def _assignees_str(issue) -> str:
    if not issue:
        return ""
    try:
        rows = list(issue.issue_assignee.all())
    except Exception:
        return ""
    names = [
        (getattr(r.assignee, "display_name", "") or getattr(r.assignee, "email", "") or "")
        for r in rows
        if r.assignee_id
    ]
    return ", ".join(n for n in names if n)


def write_member_sheet(wb, member_dict, qs, used_names, requester_email):
    """
    Append one sheet per member. Header is always written, even when the member
    has zero worklogs in the range (a single placeholder row is emitted instead).
    """
    member_id = member_dict["logged_by_id"]
    display_name = member_dict.get("logged_by__display_name") or f"Member-{str(member_id)[:8]}"

    sheet_name = sanitize_sheet_name(display_name, used_names)
    ws = wb.create_sheet(title=sheet_name)

    ts = timezone.now().isoformat(timespec="seconds")
    ws.append([f"Generated for {requester_email} on {ts}"] + [""] * (len(DETAIL_HEADERS) - 1))
    ws.append(DETAIL_HEADERS)

    row_count = 0
    member_qs = qs.filter(logged_by_id=member_id).iterator(chunk_size=2000)
    for entry in member_qs:
        issue = entry.issue if entry.issue_id else None
        project_name = getattr(getattr(issue, "project", None), "name", "") if issue else ""
        main_cat = ""
        sub_cat = ""
        if issue:
            if issue.main_task_category_id and issue.main_task_category:
                main_cat = issue.main_task_category.name or ""
            if issue.sub_task_category_id and issue.sub_task_category:
                sub_cat = issue.sub_task_category.name or ""
        state_name = getattr(getattr(issue, "state", None), "name", "") if issue else ""
        priority = getattr(issue, "priority", "") if issue else ""
        ws.append([
            str(entry.logged_at),
            project_name,
            _issue_identifier(issue),
            getattr(issue, "name", "") if issue else "",
            main_cat,
            sub_cat,
            state_name,
            _assignees_str(issue),
            priority,
            round((entry.duration_minutes or 0) / 60.0, 2),
        ])
        row_count += 1

    if row_count == 0:
        ws.append([EMPTY_ROW_PLACEHOLDER] + [""] * (len(DETAIL_HEADERS) - 1))

    return row_count
