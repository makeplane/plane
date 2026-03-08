# [FA-CUSTOM] Fuzzy matching for status and assignee mapping suggestions
from difflib import SequenceMatcher
from typing import Dict, List


# Keywords that help match file statuses to Plane state groups
_GROUP_KEYWORDS = {
    "backlog": ["backlog", "icebox", "later"],
    "unstarted": [
        "todo", "to do", "to-do", "open", "new",
        "not started", "unstarted",
    ],
    "started": [
        "in progress", "in-progress", "doing", "active",
        "working", "started",
    ],
    "completed": [
        "done", "completed", "closed", "finished",
        "resolved", "complete",
    ],
    "cancelled": [
        "cancelled", "canceled", "rejected",
        "won't do", "wontfix", "duplicate",
    ],
}


def suggest_status_mapping(
    unique_statuses: List[str],
    project_states: List[dict],
) -> Dict[str, dict]:
    """
    For each unique status value from the file, suggest the best matching
    project state using fuzzy string matching + group keyword matching.

    Returns: {
        "In Progress": {
            "state_id": "...", "state_name": "...", "confidence": 0.85
        }
    }
    """
    suggestions = {}

    for status_value in unique_statuses:
        if not status_value:
            continue

        best_match = None
        best_score = 0.0

        for state in project_states:
            # Direct name matching
            score = SequenceMatcher(
                None, status_value.lower(), state["name"].lower()
            ).ratio()

            if score > best_score:
                best_score = score
                best_match = state

            # Group keyword matching
            group = state.get("group", "")
            if group in _GROUP_KEYWORDS:
                for keyword in _GROUP_KEYWORDS[group]:
                    kw_score = SequenceMatcher(
                        None, status_value.lower(), keyword
                    ).ratio()
                    if kw_score > best_score:
                        best_score = kw_score
                        best_match = state

        if best_match and best_score >= 0.4:
            suggestions[status_value] = {
                "state_id": str(best_match["id"]),
                "state_name": best_match["name"],
                "confidence": round(best_score, 2),
            }

    return suggestions


def suggest_assignee_mapping(
    unique_assignees: List[str],
    project_members: List[dict],
) -> Dict[str, dict]:
    """
    For each unique assignee string from the file, suggest the best
    matching project member by display_name or email.

    Returns: {
        "John Doe": {
            "user_id": "...", "display_name": "...", "confidence": 0.92
        }
    }
    """
    suggestions = {}

    for assignee_value in unique_assignees:
        if not assignee_value:
            continue

        best_match = None
        best_score = 0.0

        for member in project_members:
            display_name = member.get("member__display_name", "")
            email = member.get("member__email", "")

            # Check display name
            name_score = SequenceMatcher(
                None, assignee_value.lower(), display_name.lower()
            ).ratio()

            # Check email
            email_score = SequenceMatcher(
                None, assignee_value.lower(), email.lower()
            ).ratio()

            # Check email prefix (before @)
            email_prefix = email.split("@")[0] if email else ""
            prefix_score = SequenceMatcher(
                None, assignee_value.lower(), email_prefix.lower()
            ).ratio()

            score = max(name_score, email_score, prefix_score)

            if score > best_score:
                best_score = score
                best_match = member

        if best_match and best_score >= 0.5:
            suggestions[assignee_value] = {
                "user_id": str(best_match["member__id"]),
                "display_name": best_match["member__display_name"],
                "confidence": round(best_score, 2),
            }

    return suggestions
