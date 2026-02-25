# [FA-CUSTOM] Import preset system for auto-detecting source tools
#
# To add a new source tool, add one entry to the PRESETS dict below.
# No other code changes are needed — detection and mapping are fully generic.
from typing import Dict, List


# Each preset defines:
#   fingerprint_columns — columns whose presence identifies this tool's export
#   column_aliases      — mapping from Plane field → possible column names in the file
#   priority_map        — tool-specific priority values → Plane priorities
PRESETS: Dict[str, dict] = {
    "clickup": {
        "fingerprint_columns": [
            "Task ID",
            "Task Name",
            "Status",
            "List Name",
        ],
        "column_aliases": {
            "title": ["Task Name", "Name"],
            "description": ["Task Content", "Description"],
            "status": ["Status"],
            "priority": ["Priority"],
            "assignee": ["Assignees", "Assignee"],
            "due_date": ["Due Date", "Due date"],
            "start_date": ["Start Date", "Start date"],
            "labels": ["Tags"],
            "parent_task_id": ["Parent ID", "Parent Task ID"],
            "external_id": ["Task ID"],
        },
        "priority_map": {
            "urgent": "urgent",
            "high": "high",
            "normal": "medium",
            "low": "low",
        },
    },
    "jira": {
        "fingerprint_columns": ["Issue key", "Issue id", "Summary"],
        "column_aliases": {
            "title": ["Summary"],
            "description": ["Description"],
            "status": ["Status"],
            "priority": ["Priority"],
            "assignee": ["Assignee"],
            "due_date": ["Due date", "Due Date"],
            "start_date": ["Created"],
            "labels": ["Labels"],
            "parent_task_id": ["Parent id", "Parent"],
            "external_id": ["Issue key", "Issue id"],
        },
        "priority_map": {
            "highest": "urgent",
            "high": "high",
            "medium": "medium",
            "low": "low",
            "lowest": "none",
        },
    },
    "trello": {
        "fingerprint_columns": ["Card ID", "Card Name", "List Name"],
        "column_aliases": {
            "title": ["Card Name", "Name"],
            "description": ["Card Description", "Description"],
            "status": ["List Name"],
            "priority": ["Priority"],
            "assignee": ["Members"],
            "due_date": ["Due Date"],
            "start_date": [],
            "labels": ["Labels"],
            "parent_task_id": [],
            "external_id": ["Card ID"],
        },
        "priority_map": {},
    },
    "notion": {
        "fingerprint_columns": ["Name", "Status", "Assign"],
        "column_aliases": {
            "title": ["Name", "Title", "Task"],
            "description": ["Description", "Notes"],
            "status": ["Status"],
            "priority": ["Priority"],
            "assignee": ["Assign", "Assignee", "Person"],
            "due_date": ["Due", "Due Date", "Deadline"],
            "start_date": ["Start Date", "Date"],
            "labels": ["Tags", "Labels", "Category"],
            "parent_task_id": ["Parent"],
            "external_id": [],
        },
        "priority_map": {},
    },
    "generic": {
        "fingerprint_columns": [],
        "column_aliases": {
            "title": [
                "Title", "Name", "Task", "Task Name", "Summary",
                "Issue", "Subject", "Work Item",
            ],
            "description": [
                "Description", "Details", "Notes", "Body", "Content",
            ],
            "status": [
                "Status", "State", "Stage", "Phase", "Column",
            ],
            "priority": [
                "Priority", "Urgency", "Importance", "Severity",
            ],
            "assignee": [
                "Assignee", "Assigned To", "Owner", "Responsible",
                "Assigned", "Member",
            ],
            "due_date": [
                "Due Date", "Deadline", "Target Date", "End Date", "Due",
            ],
            "start_date": [
                "Start Date", "Start", "Begin Date", "Created",
            ],
            "labels": [
                "Labels", "Tags", "Categories", "Type",
            ],
            "parent_task_id": [
                "Parent", "Parent ID", "Parent Task",
            ],
            "external_id": [
                "ID", "External ID", "Task ID", "Issue ID",
            ],
        },
        "priority_map": {},
    },
}


def detect_preset(headers: List[str]) -> str:
    """
    Detect which source tool exported this file based on column headers.
    Returns preset key (e.g., "clickup", "jira") or "generic" as fallback.
    """
    headers_lower = {h.lower().strip() for h in headers}

    best_match = "generic"
    best_score = 0.0

    for preset_key, preset in PRESETS.items():
        if preset_key == "generic":
            continue
        fingerprints = preset["fingerprint_columns"]
        if not fingerprints:
            continue
        matches = sum(
            1 for fp in fingerprints if fp.lower() in headers_lower
        )
        score = matches / len(fingerprints)
        if score > best_score and score >= 0.5:
            best_score = score
            best_match = preset_key

    return best_match


def get_auto_mapping(preset_key: str, headers: List[str]) -> Dict[str, str]:
    """
    Given a preset and file headers, return the best auto-mapping.
    Returns: {"title": "Task Name", "status": "Status", ...}
    Only Plane fields with a matching header column are included.
    """
    preset = PRESETS.get(preset_key, PRESETS["generic"])
    aliases = preset["column_aliases"]
    headers_lower = {h.lower().strip(): h for h in headers}

    mapping: Dict[str, str] = {}
    for plane_field, possible_names in aliases.items():
        for name in possible_names:
            if name.lower() in headers_lower:
                mapping[plane_field] = headers_lower[name.lower()]
                break

    # Fallback: if no title mapped, use the first column
    if "title" not in mapping and headers:
        mapping["title"] = headers[0]

    return mapping


def get_priority_map(preset_key: str) -> Dict[str, str]:
    """Return the priority normalization map for a given preset."""
    preset = PRESETS.get(preset_key, PRESETS["generic"])
    return preset.get("priority_map", {})
