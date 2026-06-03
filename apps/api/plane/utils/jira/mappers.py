# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Pure, side-effect-free mapping helpers between Jira and Plane.

These are unit tested without a database or network.
"""

# Module imports
from plane.db.models.state import StateGroup


def normalize_domain(domain: str) -> str:
    """Strip scheme and trailing slashes from a Jira domain.

    "https://acme.atlassian.net/" -> "acme.atlassian.net"
    """
    if not domain:
        return ""
    domain = domain.strip()
    for prefix in ("https://", "http://"):
        if domain.startswith(prefix):
            domain = domain[len(prefix):]
    return domain.strip("/")


# Jira priority name (lowercased) -> Plane priority
_PRIORITY_MAP = {
    "highest": "urgent",
    "p1": "urgent",
    "critical": "urgent",
    "blocker": "urgent",
    "high": "high",
    "p2": "high",
    "major": "high",
    "medium": "medium",
    "p3": "medium",
    "normal": "medium",
    "low": "low",
    "p4": "low",
    "minor": "low",
    "lowest": "low",
    "p5": "low",
    "trivial": "low",
}


def map_priority(jira_priority_name) -> str:
    """Map a Jira priority name to a Plane priority. Defaults to 'none'."""
    if not jira_priority_name:
        return "none"
    return _PRIORITY_MAP.get(str(jira_priority_name).strip().lower(), "none")


# Jira status category key -> Plane StateGroup value
_STATUS_CATEGORY_MAP = {
    "new": StateGroup.UNSTARTED.value,
    "undefined": StateGroup.BACKLOG.value,
    "indeterminate": StateGroup.STARTED.value,
    "done": StateGroup.COMPLETED.value,
}


def map_status_group(status_category_key) -> str:
    """Map a Jira status category key to a Plane state group.

    Jira status categories: To Do (key 'new'), In Progress ('indeterminate'),
    Done ('done'). Defaults to 'backlog'.
    """
    if not status_category_key:
        return StateGroup.BACKLOG.value
    return _STATUS_CATEGORY_MAP.get(str(status_category_key).strip().lower(), StateGroup.BACKLOG.value)


# Jira issue link type name (lowercased) -> Plane IssueRelation.relation_type
_RELATION_MAP = {
    "blocks": "blocked_by",
    "is blocked by": "blocked_by",
    "duplicate": "duplicate",
    "duplicates": "duplicate",
    "is duplicated by": "duplicate",
    "relates": "relates_to",
    "relates to": "relates_to",
}


def map_relation_type(jira_link_name) -> str:
    """Map a Jira issue link type to a Plane relation type. Defaults to 'relates_to'."""
    if not jira_link_name:
        return "relates_to"
    return _RELATION_MAP.get(str(jira_link_name).strip().lower(), "relates_to")
