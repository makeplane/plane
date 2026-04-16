# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""Helper utilities for mention context formatting."""

from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from pi.config import settings


def format_issue_list(issues: Optional[List[Dict[str, Any]]], max_display: int = 15, compact: bool = False) -> str:
    """
    Format a list of issues for LLM consumption.

    Args:
        issues: List of issue dicts with identifier, name, state, priority, assignees
        max_display: Maximum number of issues to display before truncating
        compact: If True, use single-line format per issue

    Returns:
        Formatted string for LLM
    """
    if not issues:
        return "None"

    if len(issues) <= max_display:
        lines = []
        for issue in issues:
            if compact:
                state = issue.get("state", "Unknown")
                lines.append(f"  • {issue.get("identifier", "N/A")}: {issue.get("name", "Untitled")} ({state})")
            else:
                assignees = issue.get("assignees", [])
                if assignees:
                    assignees_text = ", ".join(assignees) if isinstance(assignees, list) else str(assignees)
                else:
                    assignees_text = "Unassigned"

                priority = format_priority(issue.get("priority"))
                lines.append(
                    f"  • {issue.get("identifier", "N/A")}: {issue.get("name", "Untitled")}\n"
                    f"    State: {issue.get("state", "Unknown")}, Priority: {priority}, "
                    f"Assignees: {assignees_text}"
                )
        return "\n".join(lines)
    else:
        # Show first N and indicate more
        lines = []
        for issue in issues[:max_display]:
            state = issue.get("state", "Unknown")
            lines.append(f"  • {issue.get("identifier", "N/A")}: {issue.get("name", "Untitled")} ({state})")
        remaining = len(issues) - max_display
        lines.append(f"  ... and {remaining} more issue{"s" if remaining > 1 else ""}")
        return "\n".join(lines)


def format_priority(priority: Optional[int]) -> str:
    """
    Convert priority integer to readable string.

    Args:
        priority: Integer 0-4 representing priority level

    Returns:
        Human-readable priority string
    """
    if priority is None:
        return "None"
    priority_map = {0: "None", 1: "Urgent", 2: "High", 3: "Medium", 4: "Low"}
    return priority_map.get(priority, f"Unknown ({priority})")


def format_state_counts(counts: Dict[str, int]) -> str:
    """
    Format state group counts into readable string.

    Args:
        counts: Dict mapping state group names to counts

    Returns:
        Comma-separated string like "3 backlog, 5 todo, 5 in progress, 12 done"
    """
    if not counts:
        return "No issues"

    parts = []
    for state, count in counts.items():
        if count > 0:
            parts.append(f"{count} {state}")
    return ", ".join(parts) if parts else "No issues"


def truncate_with_ellipsis(text: Optional[str], max_length: int = 200) -> str:
    """
    Truncate text with ellipsis, trying to break at word boundaries.

    Args:
        text: Text to truncate
        max_length: Maximum length before truncation

    Returns:
        Truncated text with "..." suffix if needed
    """
    if not text:
        return ""
    if len(text) <= max_length:
        return text
    # Try to break at last space before max_length
    truncated = text[:max_length].rsplit(" ", 1)[0]
    return truncated + "..."


def format_entity_list(entities: Optional[List[Dict[str, Any]]], name_key: str = "name", max_display: int = 10) -> str:
    """
    Format a generic list of entities (projects, labels, etc.).

    Args:
        entities: List of entity dicts
        name_key: Key to use for entity name
        max_display: Maximum to display before truncating

    Returns:
        Formatted string
    """
    if not entities:
        return "None"

    if len(entities) <= max_display:
        names = [e.get(name_key, "Unknown") for e in entities]
        return ", ".join(names)
    else:
        names = [e.get(name_key, "Unknown") for e in entities[:max_display]]
        remaining = len(entities) - max_display
        return ", ".join(names) + f" (+{remaining} more)"


def format_label_list(labels: Optional[List[Dict[str, Any]]], max_display: int = 10) -> str:
    """
    Format labels with colors.

    Args:
        labels: List of label dicts with name and color
        max_display: Maximum to display

    Returns:
        Formatted string like "backend (blue), security (red)"
    """
    if not labels:
        return "None"

    if len(labels) <= max_display:
        formatted = [f"{l.get("name", "Unknown")} ({l.get("color", "no color")})" for l in labels]
        return ", ".join(formatted)
    else:
        formatted = [f"{l.get("name", "Unknown")} ({l.get("color", "no color")})" for l in labels[:max_display]]
        remaining = len(labels) - max_display
        return ", ".join(formatted) + f" (+{remaining} more)"


def construct_mention_entity_url(
    entity_type: str, entity_id: str, workspace_slug: Optional[str], project_id: Optional[str] = None, issue_identifier: Optional[str] = None
) -> Optional[str]:
    """
    Construct frontend URL for a mentioned entity.

    Args:
        entity_type: Type of entity (issues, projects, cycles, modules, pages, etc.)
        entity_id: Entity UUID
        workspace_slug: Workspace slug (required)
        project_id: Project UUID (required for some entity types)
        issue_identifier: Issue identifier like "PROJ-123" (for issues)

    Returns:
        Full frontend URL or None if unable to construct
    """
    if not workspace_slug:
        return None

    frontend_url = settings.plane_api.FRONTEND_URL
    base = f"{frontend_url}/{workspace_slug}"

    try:
        if entity_type in ("issues", "workitems", "epics"):
            if issue_identifier:
                return f"{base}/browse/{issue_identifier}/"

        elif entity_type == "projects":
            return f"{base}/projects/{entity_id}/overview/"

        elif entity_type == "cycles":
            if project_id:
                return f"{base}/projects/{project_id}/cycles/{entity_id}/"

        elif entity_type == "modules":
            if project_id:
                return f"{base}/projects/{project_id}/modules/{entity_id}/"

        elif entity_type == "pages":
            if project_id:
                return f"{base}/projects/{project_id}/pages/{entity_id}/"
            else:
                # Global page
                return f"{base}/wiki/{entity_id}/"

        elif entity_type == "issue_views":
            # Views are typically at project level
            if project_id:
                return f"{base}/projects/{project_id}/views/{entity_id}/"

        elif entity_type in ("teams", "teamspaces"):
            # Teamspaces might not have direct URLs, skip for now
            return None

        elif entity_type == "initiatives":
            # Initiatives URL pattern (might vary)
            return f"{base}/initiatives/{entity_id}/"

    except Exception:
        pass

    return None
