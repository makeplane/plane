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

"""Unified fetchers for all entity types - no need for separate files per entity."""

from typing import Any
from typing import Callable
from typing import Dict
from typing import Optional

from pi.app.api.v1.helpers.plane_sql_queries import get_cycle_mention_context
from pi.app.api.v1.helpers.plane_sql_queries import get_initiative_mention_context
from pi.app.api.v1.helpers.plane_sql_queries import get_issue_view_mention_context
from pi.app.api.v1.helpers.plane_sql_queries import get_label_mention_context
from pi.app.api.v1.helpers.plane_sql_queries import get_module_mention_context
from pi.app.api.v1.helpers.plane_sql_queries import get_page_mention_context
from pi.app.api.v1.helpers.plane_sql_queries import get_project_mention_context
from pi.app.api.v1.helpers.plane_sql_queries import get_state_mention_context
from pi.app.api.v1.helpers.plane_sql_queries import get_teamspace_mention_context
from pi.app.api.v1.helpers.plane_sql_queries import get_user_mention_context
from pi.app.api.v1.helpers.plane_sql_queries import get_workitem_mention_context
from pi.services.mention_context.base import BaseEntityFetcher
from pi.services.mention_context.base import EntityContext
from pi.services.mention_context.helpers import construct_mention_entity_url  # For URL generation
from pi.services.mention_context.helpers import format_entity_list
from pi.services.mention_context.helpers import format_label_list
from pi.services.mention_context.helpers import format_priority
from pi.services.mention_context.helpers import format_state_counts
from pi.services.mention_context.helpers import truncate_with_ellipsis


class UnifiedEntityFetcher(BaseEntityFetcher):
    """
    Single fetcher for all entity types.
    Uses a mapping dict to call the right SQL query and formatter.
    """

    def __init__(self, entity_type: str):
        self.entity_type = entity_type
        self.query_func = ENTITY_QUERY_MAP.get(entity_type)
        self.formatter_func = ENTITY_FORMATTER_MAP.get(entity_type)

    async def fetch_context(self, entity_id: str, user_id: Optional[str] = None, workspace_id: Optional[str] = None) -> Optional[EntityContext]:
        """Fetch context using mapped query function."""
        if not self.query_func:
            return None

        # Call appropriate SQL query (pages need user_id for permissions)
        if self.entity_type == "pages":
            data = await self.query_func(entity_id, user_id)
        else:
            data = await self.query_func(entity_id)

        if not data:
            return None

        # Build entity name
        entity_name = self._build_entity_name(data)

        return EntityContext(entity_id=entity_id, entity_type=self.entity_type, entity_name=entity_name, context_data=data)

    def format_for_llm(self, context: EntityContext) -> str:
        """Format using mapped formatter function."""
        if not self.formatter_func:
            return f"**{context.entity_name}**"
        return self.formatter_func(context)

    def _build_entity_name(self, data: Dict[str, Any]) -> str:
        """Build entity name with identifier if available."""
        name = data.get("name", "Unknown")
        identifier = data.get("identifier")

        if identifier:
            return f"{identifier} - {name}"
        return name


# ==============================================================================
# FORMATTER FUNCTIONS - One per entity type
# ==============================================================================


def format_workitem(context: EntityContext) -> str:
    """Format work item with all enriched data INCLUDING the ID."""
    data = context.context_data
    lines = [
        f"**{context.entity_name}**",
        f"- ID: {context.entity_id}",  # 🔑 CRITICAL: Include ID for LLM to use in tools
    ]

    # Add URL if we have workspace_slug
    if data.get("workspace_slug") and data.get("identifier"):
        url = construct_mention_entity_url("issues", context.entity_id, data["workspace_slug"], issue_identifier=data["identifier"])
        if url:
            lines.append(f"- URL: {url}")

    # Status
    if data.get("state"):
        lines.append(f"- State: {data["state"]} ({data.get("state_group", "unknown")})")
    if data.get("priority") is not None:
        lines.append(f"- Priority: {format_priority(data["priority"])}")

    # People
    if data.get("assignees"):
        assignees_text = format_entity_list([{"name": a} for a in data["assignees"]] if isinstance(data["assignees"], list) else [], max_display=5)
        lines.append(f"- Assignees: {assignees_text}")

    # Organization
    if data.get("project_name"):
        lines.append(f"- Project: {data["project_name"]} ({data.get("project_identifier", "")})")
    if data.get("project_id"):
        lines.append(f"- Project ID: {data["project_id"]}")

    # Timeline
    if data.get("target_date"):
        lines.append(f"- Target Date: {data["target_date"]}")

    # Parent/Sub-issues
    if data.get("parent_name"):
        lines.append(f"- Parent: {data.get("parent_identifier", "")} - {data["parent_name"]}")

    sub_issues = data.get("sub_issues")
    if sub_issues:
        # Handle both list and JSON string formats
        if isinstance(sub_issues, str):
            import json

            try:
                sub_issues = json.loads(sub_issues)
            except Exception:
                sub_issues = []

        if isinstance(sub_issues, list) and len(sub_issues) > 0:
            lines.append(f"- Sub-Issues: {len(sub_issues)} total")
            # Show first few
            for i, sub in enumerate(sub_issues[:5]):
                lines.append(f"  • {sub.get("identifier")}: {sub.get("name")} ({sub.get("state")})")
            if len(sub_issues) > 5:
                lines.append(f"  ... and {len(sub_issues) - 5} more")

    # Labels
    labels = data.get("labels")
    if labels:
        # Handle both list and JSON string formats
        if isinstance(labels, str):
            import json

            try:
                labels = json.loads(labels)
            except Exception:
                labels = []
        if labels:
            lines.append(f"- Labels: {format_label_list(labels, max_display=10)}")

    # Cycles & Modules
    if data.get("cycles"):
        lines.append(f"- Cycles: {", ".join([c for c in data["cycles"] if c])}")
    if data.get("modules"):
        lines.append(f"- Modules: {", ".join([m for m in data["modules"] if m])}")

    # Metadata
    if data.get("estimate_point"):
        lines.append(f"- Estimate: {data["estimate_point"]} points")
    if data.get("description_preview"):
        lines.append(f"- Description: {truncate_with_ellipsis(data["description_preview"], 150)}")
    if data.get("is_draft"):
        lines.append("- Flag: Draft")
    if data.get("is_archived"):
        lines.append("- Flag: Archived")
    if data.get("is_epic"):
        lines.append("- Type: Epic")

    return "\n".join(lines)


def format_cycle(context: EntityContext) -> str:
    """Format cycle with state counts (NO issues list)."""
    data = context.context_data
    lines = [
        f"**Cycle: {context.entity_name}**",
        f"- ID: {context.entity_id}",  # 🔑 CRITICAL: Include ID
    ]

    # Add URL if we have workspace_slug and project_id
    if data.get("workspace_slug") and data.get("project_id"):
        url = construct_mention_entity_url("cycles", context.entity_id, data["workspace_slug"], project_id=data["project_id"])
        if url:
            lines.append(f"- URL: {url}")

    if data.get("status"):
        lines.append(f"- Status: {data["status"].capitalize()}")
    if data.get("start_date") and data.get("end_date"):
        lines.append(f"- Duration: {data["start_date"]} to {data["end_date"]}")
    if data.get("project_name"):
        lines.append(f"- Project: {data["project_name"]} ({data.get("project_identifier", "")})")
    if data.get("project_id"):
        lines.append(f"- Project ID: {data["project_id"]}")

    # Progress with state breakdown (counts only)
    total = data.get("total_issues", 0)
    completed = data.get("completed_issues", 0)
    if total > 0:
        lines.append(f"- Progress: {completed}/{total} issues completed")
        state_counts = {
            "backlog": data.get("backlog_count", 0),
            "todo": data.get("todo_count", 0),
            "in progress": data.get("in_progress_count", 0),
            "done": data.get("done_count", 0),
        }
        lines.append(f"- Breakdown: {format_state_counts(state_counts)}")

    return "\n".join(lines)


def format_module(context: EntityContext) -> str:
    """Format module with state counts (NO issues list)."""
    data = context.context_data
    lines = [
        f"**Module: {context.entity_name}**",
        f"- ID: {context.entity_id}",  # 🔑 CRITICAL: Include ID
    ]

    # Add URL if we have workspace_slug and project_id
    if data.get("workspace_slug") and data.get("project_id"):
        url = construct_mention_entity_url("modules", context.entity_id, data["workspace_slug"], project_id=data["project_id"])
        if url:
            lines.append(f"- URL: {url}")

    if data.get("status"):
        lines.append(f"- Status: {data["status"].capitalize()}")
    if data.get("start_date") and data.get("target_date"):
        lines.append(f"- Timeline: {data["start_date"]} to {data["target_date"]}")
    if data.get("project_name"):
        lines.append(f"- Project: {data["project_name"]} ({data.get("project_identifier", "")})")
    if data.get("project_id"):
        lines.append(f"- Project ID: {data["project_id"]}")
    if data.get("lead_by"):
        lines.append(f"- Lead: {data["lead_by"]}")

    # Progress with state breakdown (counts only)
    total = data.get("total_issues", 0)
    completed = data.get("completed_issues", 0)
    if total > 0:
        lines.append(f"- Progress: {completed}/{total} issues completed")
        state_counts = {
            "backlog": data.get("backlog_count", 0),
            "todo": data.get("todo_count", 0),
            "in progress": data.get("in_progress_count", 0),
            "done": data.get("done_count", 0),
        }
        lines.append(f"- Breakdown: {format_state_counts(state_counts)}")

    return "\n".join(lines)


def format_page(context: EntityContext) -> str:
    """Format page context."""
    data = context.context_data
    lines = [
        f"**Page: {context.entity_name}**",
        f"- ID: {context.entity_id}",  # 🔑 CRITICAL: Include ID
    ]

    # Add URL if we have workspace_slug
    if data.get("workspace_slug"):
        # Pages may or may not have project_id
        url = construct_mention_entity_url(
            "pages",
            context.entity_id,
            data["workspace_slug"],
            project_id=data.get("project_id"),  # May be None for global pages
        )
        if url:
            lines.append(f"- URL: {url}")

    access_map = {0: "Public", 1: "Private", 2: "Internal"}
    if data.get("access_level") is not None:
        lines.append(f"- Access: {access_map.get(data["access_level"], "Unknown")}")
    if data.get("is_locked"):
        lines.append("- Status: Locked")
    if data.get("is_archived"):
        lines.append("- Status: Archived")
    if data.get("workspace_name"):
        lines.append(f"- Workspace: {data["workspace_name"]}")
    if data.get("owned_by"):
        lines.append(f"- Owner: {data["owned_by"]}")

    return "\n".join(lines)


def format_project(context: EntityContext) -> str:
    """Format project context with comprehensive statistics."""
    data = context.context_data
    lines = [
        f"**Project: {context.entity_name}**",
        f"- ID: {context.entity_id}",  # 🔑 CRITICAL: Include ID
    ]

    # Add URL if we have workspace_slug
    if data.get("workspace_slug"):
        url = construct_mention_entity_url("projects", context.entity_id, data["workspace_slug"])
        if url:
            lines.append(f"- URL: {url}")

    if data.get("is_archived"):
        lines.append("- Status: Archived")
    if data.get("workspace_name"):
        lines.append(f"- Workspace: {data["workspace_name"]}")
    if data.get("project_lead"):
        lines.append(f"- Lead: {data["project_lead"]}")
    if data.get("default_assignee"):
        lines.append(f"- Default Assignee: {data["default_assignee"]}")

    # Stats
    total_workitems = data.get("total_workitems", 0)
    if total_workitems > 0:
        lines.append(f"- Total Work-items: {total_workitems}")

        # State distribution
        state_counts = {
            "backlog": data.get("backlog_count", 0),
            "unstarted": data.get("unstarted_count", 0),
            "started": data.get("started_count", 0),
            "completed": data.get("completed_count", 0),
            "cancelled": data.get("cancelled_count", 0),
        }
        lines.append(f"- State Distribution: {format_state_counts(state_counts)}")

    # Entity counts
    member_count = data.get("member_count", 0)
    if member_count > 0:
        lines.append(f"- Members: {member_count}")

    cycle_count = data.get("cycle_count", 0)
    if cycle_count > 0:
        lines.append(f"- Cycles: {cycle_count}")

    module_count = data.get("module_count", 0)
    if module_count > 0:
        lines.append(f"- Modules: {module_count}")

    epic_count = data.get("epic_count", 0)
    if epic_count > 0:
        lines.append(f"- Epics: {epic_count}")

    return "\n".join(lines)


def format_user(context: EntityContext) -> str:
    """Format user context."""
    data = context.context_data
    lines = [
        f"**User: {context.entity_name}**",
        f"- ID: {context.entity_id}",  # 🔑 CRITICAL: Include ID
    ]

    if not data.get("is_active", True):
        lines.append("- Status: Inactive")
    if data.get("first_name"):
        lines.append(f"- First Name: {data["first_name"]}")
    if data.get("last_name"):
        lines.append(f"- Last Name: {data["last_name"]}")
    if data.get("display_name"):
        lines.append(f"- Display Name: {data["display_name"]}")
    return "\n".join(lines)


def format_label(context: EntityContext) -> str:
    """Format label context."""
    data = context.context_data
    lines = [
        f"**Label: {context.entity_name}**",
        f"- ID: {context.entity_id}",  # 🔑 CRITICAL: Include ID
    ]

    if data.get("color"):
        lines.append(f"- Color: {data["color"]}")
    if data.get("project_name"):
        lines.append(f"- Project: {data["project_name"]} ({data.get("project_identifier", "")})")
        if data.get("project_id"):
            lines.append(f"- Project ID: {data["project_id"]}")
    else:
        lines.append("- Scope: Workspace-level")

    return "\n".join(lines)


def format_state(context: EntityContext) -> str:
    """Format state context."""
    data = context.context_data
    lines = [
        f"**State: {context.entity_name}**",
        f"- ID: {context.entity_id}",  # 🔑 CRITICAL: Include ID
    ]

    if data.get("state_group"):
        lines.append(f"- Type: {data["state_group"].capitalize()}")
    if data.get("color"):
        lines.append(f"- Color: {data["color"]}")
    if data.get("project_name"):
        lines.append(f"- Project: {data["project_name"]} ({data.get("project_identifier", "")})")
    if data.get("project_id"):
        lines.append(f"- Project ID: {data["project_id"]}")

    return "\n".join(lines)


def format_issue_view(context: EntityContext) -> str:
    """Format issue view context."""
    data = context.context_data
    lines = [
        f"**Issue View: {context.entity_name}**",
        f"- ID: {context.entity_id}",  # 🔑 CRITICAL: Include ID
    ]

    # Add URL if we have workspace_slug and project_id
    if data.get("workspace_slug") and data.get("project_id"):
        url = construct_mention_entity_url("issue_views", context.entity_id, data["workspace_slug"], project_id=data["project_id"])
        if url:
            lines.append(f"- URL: {url}")

    access_map = {0: "Public", 1: "Private", 2: "Internal"}
    if data.get("access") is not None:
        lines.append(f"- Access: {access_map.get(data["access"], "Unknown")}")
    if data.get("is_locked"):
        lines.append("- Status: Locked")
    if data.get("project_name"):
        lines.append(f"- Project: {data["project_name"]} ({data.get("project_identifier", "")})")
    else:
        lines.append("- Scope: Workspace-level")
    if data.get("created_by"):
        lines.append(f"- Created By: {data["created_by"]}")
    if data.get("owned_by"):
        lines.append(f"- Owner: {data["owned_by"]}")

    return "\n".join(lines)


def format_teamspace(context: EntityContext) -> str:
    """Format teamspace context."""
    data = context.context_data
    lines = [
        f"**Teamspace: {context.entity_name}**",
        f"- ID: {context.entity_id}",  # 🔑 CRITICAL: Include ID
    ]

    # Add URL if we have workspace_slug (teamspaces don't have direct URLs in current design, skip for now)
    # if data.get("workspace_slug"):
    #     url = construct_mention_entity_url("teams", context.entity_id, data["workspace_slug"])
    #     if url:
    #         lines.append(f"- URL: {url}")

    if data.get("workspace_name"):
        lines.append(f"- Workspace: {data["workspace_name"]}")
    if data.get("created_by"):
        lines.append(f"- Created By: {data["created_by"]}")
    member_count = data.get("member_count")
    if member_count is not None:
        lines.append(f"- Members: {member_count}")

    # Projects linked to this teamspace
    project_names = data.get("project_names") or []
    project_ids = data.get("project_ids") or []
    if project_names:
        project_parts = []
        for name, pid in zip(project_names, project_ids):
            project_parts.append(f"{name} (ID: {pid})" if pid else name)
        lines.append(f"- Projects: {', '.join(project_parts)}")

    return "\n".join(lines)


def format_initiative(context: EntityContext) -> str:
    """Format initiative context."""
    data = context.context_data
    lines = [
        f"**Initiative: {context.entity_name}**",
        f"- ID: {context.entity_id}",  # 🔑 CRITICAL: Include ID
    ]

    # Add URL if we have workspace_slug
    if data.get("workspace_slug"):
        url = construct_mention_entity_url("initiatives", context.entity_id, data["workspace_slug"])
        if url:
            lines.append(f"- URL: {url}")

    if data.get("state"):
        lines.append(f"- State: {data["state"].capitalize()}")
    if data.get("start_date") and data.get("end_date"):
        lines.append(f"- Timeline: {data["start_date"]} to {data["end_date"]}")
    if data.get("workspace_name"):
        lines.append(f"- Workspace: {data["workspace_name"]}")
    if data.get("lead_by"):
        lines.append(f"- Lead: {data["lead_by"]}")
    if data.get("created_by"):
        lines.append(f"- Created By: {data["created_by"]}")

    # Projects linked to this initiative
    project_names = data.get("project_names") or []
    project_ids = data.get("project_ids") or []
    project_identifiers = data.get("project_identifiers") or []
    if project_names:
        project_parts = []
        for name, pid, identifier in zip(project_names, project_ids, project_identifiers or [None] * len(project_names)):
            label = f"{identifier} - {name}" if identifier else name
            project_parts.append(f"{label} (ID: {pid})" if pid else label)
        lines.append(f"- Projects: {', '.join(project_parts)}")

    return "\n".join(lines)


# ==============================================================================
# MAPPING DICTS - Configuration only
# ==============================================================================

# Map entity type to SQL query function
ENTITY_QUERY_MAP: Dict[str, Callable] = {
    "issues": get_workitem_mention_context,
    "workitems": get_workitem_mention_context,
    "epics": get_workitem_mention_context,
    "pages": get_page_mention_context,
    "cycles": get_cycle_mention_context,
    "modules": get_module_mention_context,
    "projects": get_project_mention_context,
    "users": get_user_mention_context,
    "labels": get_label_mention_context,
    "states": get_state_mention_context,
    "issue_views": get_issue_view_mention_context,
    "teams": get_teamspace_mention_context,
    "initiatives": get_initiative_mention_context,
}

# Map entity type to formatter function
ENTITY_FORMATTER_MAP: Dict[str, Callable[[EntityContext], str]] = {
    "issues": format_workitem,
    "workitems": format_workitem,
    "epics": format_workitem,
    "pages": format_page,
    "cycles": format_cycle,
    "modules": format_module,
    "projects": format_project,
    "users": format_user,
    "labels": format_label,
    "states": format_state,
    "issue_views": format_issue_view,
    "teams": format_teamspace,
    "initiatives": format_initiative,
}
