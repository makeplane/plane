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

"""
Entity Search Tools for Plane
Provides search functionality for all major entities using database queries.
"""

import re
import uuid
from typing import Any
from typing import Dict
from typing import Optional

from langchain_core.tools import tool

from pi.core.db.plane import PlaneDBPool

from .base import PlaneToolBase

# Factory wired via CATEGORY_TO_PROVIDER in tools/__init__.py
# Returns LangChain tools implementing entity search helpers


def get_entity_search_tools(method_executor, context):
    """Return LangChain tools for entity search helpers using method_executor and context."""

    def _parse_placeholder_reference(value: Optional[str]) -> tuple[Optional[str], Optional[str]]:
        """Extract placeholder entity info from a value like '<id of project: My Project>'."""
        if not isinstance(value, str):
            return None, None

        match = re.match(r"<id of (\w+): (.+)>", value.strip())
        if not match:
            return None, None

        return match.group(1), match.group(2).strip()

    def _build_placeholder_skip_payload(tool_name: str, project_id: Optional[str], target_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Return a structured skipped payload when a project-scoped search references an unresolved project placeholder."""
        entity_type, entity_name = _parse_placeholder_reference(project_id)
        if entity_type != "project" or not entity_name:
            return None

        object_suffix = f" for '{target_name}'" if target_name else ""
        if tool_name == "search_state_by_name":
            message = (
                f"{tool_name}{object_suffix} was skipped because project '{entity_name}' is being created in this plan. "
                "Project-scoped state lookup can only run after the project exists."
            )
        else:
            message = (
                f"{tool_name}{object_suffix} was skipped because project '{entity_name}' is being created in this plan. "
                "Project-scoped retrieval can only run after the project exists."
            )

        return PlaneToolBase.format_skipped_payload(
            message,
            meta={
                "status": "skipped",
                "reason": "unresolved_project_placeholder",
                "project_name": entity_name,
                "tool_name": tool_name,
            },
        )

    async def _normalize_project_id(project_id: Optional[str], workspace_slug: Optional[str]) -> Optional[str]:
        """Return UUID string for project_id; if an identifier is provided, resolve it using workspace scope."""
        if not project_id:
            return None
        entity_type, _entity_name = _parse_placeholder_reference(project_id)
        if entity_type == "project":
            return None
        try:
            uuid.UUID(str(project_id))
            return str(project_id)
        except Exception:
            query = """
                SELECT p.id
                FROM projects p
                JOIN workspaces w ON p.workspace_id = w.id
                WHERE p.identifier = $1 AND p.deleted_at IS NULL
                """
            params = [str(project_id)]
            if workspace_slug:
                query += " AND w.slug = $2"
                params.append(workspace_slug)
            query += " LIMIT 1"
            row = await PlaneDBPool.fetchrow(query, tuple(params))
            return str(row["id"]) if row else None

    @tool
    async def search_module_by_name(name: str, project_id: Optional[str] = None, workspace_slug: Optional[str] = None) -> Dict[str, Any]:
        """Search for a module by name and return its ID.

        Args:
            name: Module name to search for (required)
            project_id: Project ID to search within (optional, auto-filled from context)
            workspace_slug: Workspace slug (optional, auto-filled from context)
        """
        # Auto-fill from context if not provided
        if workspace_slug is None and "workspace_slug" in context:
            workspace_slug = context["workspace_slug"]
        if project_id is None and "project_id" in context:
            project_id = str(context["project_id"]) if context["project_id"] else None

        skipped = _build_placeholder_skip_payload("search_module_by_name", project_id, name)
        if skipped:
            return skipped

        try:
            # Normalize project_id if an identifier like 'OGX' was passed
            project_id = await _normalize_project_id(project_id, workspace_slug)
            from pi.app.api.v1.helpers.plane_sql_queries import search_module_by_name

            result = await search_module_by_name(name, project_id, workspace_slug, raise_on_error=True)

            if result:
                return PlaneToolBase.format_success_payload(
                    f"Found module '{name}'", {"id": result["id"], "name": result["name"], "project_id": result["project_id"]}
                )
            else:
                return PlaneToolBase.format_success_payload(f"No module found with name '{name}'", "Not found")

        except Exception as e:
            return PlaneToolBase.format_error_payload(f"Error searching for module '{name}': {str(e)}", str(e))

    @tool
    async def list_member_projects(workspace_id: Optional[str] = None, user_id: Optional[str] = None, limit: Optional[int] = 50) -> Dict[str, Any]:
        """List active projects the current user is a member of (archived/deleted excluded).

        Args:
            workspace_id: Workspace UUID (auto-filled from context)
            user_id: Current user UUID (auto-filled from context)
            limit: Max number of projects to return (default 50)
        """
        # Auto-fill from context if not provided
        if workspace_id is None and "workspace_id" in context:
            workspace_id = context["workspace_id"]
        if user_id is None and "user_id" in context:
            user_id = context["user_id"]

        try:
            if not workspace_id or not user_id:
                return PlaneToolBase.format_error_payload(
                    "Failed to list projects",
                    "Missing workspace_id/user_id in context",
                )

            # Membership-filtered, active (non-archived, non-deleted) projects only
            query = """
                SELECT p.id, p.name, p.identifier
                FROM projects p
                JOIN project_members pm ON p.id = pm.project_id
                WHERE p.workspace_id = $1
                AND pm.member_id = $2
                AND p.deleted_at IS NULL
                AND p.archived_at IS NULL
                AND pm.deleted_at IS NULL
                AND pm.is_active = true
                ORDER BY p.name
                LIMIT $3
            """
            rows = await PlaneDBPool.fetch(query, (uuid.UUID(workspace_id), uuid.UUID(user_id), int(limit or 50)))
            projects = [
                {
                    "id": str(r["id"]),
                    "name": r["name"],
                    "identifier": r.get("identifier"),
                    "type": "project",
                }
                for r in rows
            ]
            return PlaneToolBase.format_success_payload("Successfully retrieved member projects", {"projects": projects, "count": len(projects)})
        except Exception as e:
            return PlaneToolBase.format_error_payload("Failed to list member projects", str(e))

    @tool
    async def search_project_by_name(name: str, workspace_slug: Optional[str] = None, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Search for a project by name.

        Args:
            name: Project name to search for (required)
            workspace_slug: Workspace slug (optional, auto-filled from context)
        """
        # Auto-fill from context if not provided
        if workspace_slug is None and "workspace_slug" in context:
            workspace_slug = context["workspace_slug"]
        if user_id is None and "user_id" in context:
            user_id = context["user_id"]

        try:
            from pi.app.api.v1.helpers.plane_sql_queries import search_project_by_name

            results = await search_project_by_name(name, workspace_slug, member_id=user_id, raise_on_error=True)

            if results:
                # Normalize to list
                projects = list(results)
                data = {
                    "total_matches": len(projects),
                    "projects": [
                        {
                            "id": p["id"],
                            "name": p["name"],
                            "identifier": p.get("identifier"),
                            "workspace_id": p.get("workspace_id"),
                            "type": "project",
                        }
                        for p in projects
                    ],
                }

                # If multiple matches, make it explicit to trigger clarification per prompt
                if len(projects) > 1:
                    message = (
                        f"MULTIPLE MATCHES: Found {len(projects)} projects matching '{name}'. Clarification needed to select the correct project."
                    )
                else:
                    message = f"Found 1 project matching '{name}'"

                return PlaneToolBase.format_success_payload(message, data)
            else:
                return PlaneToolBase.format_success_payload(f"No project found with name '{name}'", "Not found")

        except Exception as e:
            return PlaneToolBase.format_error_payload(f"Error searching for project '{name}': {str(e)}", str(e))

    @tool
    async def search_project_by_identifier(identifier: str, workspace_slug: Optional[str] = None) -> Dict[str, Any]:
        """Search for a project by its identifier (e.g., 'HYDR', 'PARM') and return its UUID.

        CRITICAL: Project identifiers are short uppercase codes (like 'HYDR', 'PARM'), NOT UUIDs.
        This tool resolves the identifier to the actual project UUID that must be used in all API calls.

        Args:
            identifier: Project identifier to search for (required, e.g., 'HYDR', 'PARM')
            workspace_slug: Workspace slug (optional, auto-filled from context)
        """
        # Auto-fill from context if not provided
        if "workspace_slug" in context and context.get("workspace_slug"):
            workspace_slug = context["workspace_slug"]

        try:
            from pi.core.db.plane import PlaneDBPool

            # Query to get project by identifier, optionally scoped to workspace
            query = """
            SELECT p.id, p.name, p.workspace_id, p.identifier
            FROM projects p
            JOIN workspaces w ON p.workspace_id = w.id
            WHERE p.identifier = $1
            AND p.deleted_at IS NULL
            """

            params = [identifier]

            if workspace_slug:
                query += " AND w.slug = $2"
                params.append(workspace_slug)

            query += " LIMIT 1"

            result = await PlaneDBPool.fetchrow(query, tuple(params))

            if result:
                return PlaneToolBase.format_success_payload(
                    f"Found project with identifier '{identifier}'",
                    {
                        "id": str(result["id"]),
                        "name": result["name"],
                        "identifier": result["identifier"],
                        "workspace_id": str(result["workspace_id"]),
                    },
                )
            else:
                return PlaneToolBase.format_success_payload(f"No project found with identifier '{identifier}'", "Not found")

        except Exception as e:
            return PlaneToolBase.format_error_payload(f"Error searching for project '{identifier}': {str(e)}", str(e))

    @tool
    async def search_cycle_by_name(name: str, project_id: Optional[str] = None, workspace_slug: Optional[str] = None) -> Dict[str, Any]:
        """Search for a cycle by name and return its ID.

        Args:
            name: Cycle name to search for (required)
            project_id: Project ID to search within (optional, auto-filled from context)
            workspace_slug: Workspace slug (optional, auto-filled from context)
        """
        # Auto-fill from context if not provided
        if "workspace_slug" in context and context.get("workspace_slug"):
            workspace_slug = context["workspace_slug"]
        if project_id is None and "project_id" in context:
            project_id = str(context["project_id"]) if context["project_id"] else None

        skipped = _build_placeholder_skip_payload("search_cycle_by_name", project_id, name)
        if skipped:
            return skipped

        try:
            # Normalize project_id if an identifier like 'OGX' was passed
            project_id = await _normalize_project_id(project_id, workspace_slug)
            from pi.app.api.v1.helpers.plane_sql_queries import search_cycle_by_name

            result = await search_cycle_by_name(name, project_id, workspace_slug, raise_on_error=True)

            if result:
                response_data = {"id": result["id"], "name": result["name"], "project_id": result["project_id"]}
                if result.get("start_date"):
                    response_data["start_date"] = result["start_date"]
                if result.get("end_date"):
                    response_data["end_date"] = result["end_date"]
                return PlaneToolBase.format_success_payload(f"Found cycle '{name}'", response_data)
            else:
                return PlaneToolBase.format_success_payload(f"No cycle found with name '{name}'", "Not found")

        except Exception as e:
            return PlaneToolBase.format_error_payload(f"Error searching for cycle '{name}': {str(e)}", str(e))

    @tool
    async def search_current_cycle(project_id: Optional[str] = None, workspace_slug: Optional[str] = None) -> Dict[str, Any]:
        """Search for the current active cycle in a project (where today's date falls within the cycle's start and end dates).

        IMPORTANT: Use this tool when the user asks about the "current cycle", "active cycle", "ongoing cycle", or "this cycle".
        This searches for cycles where today's date is between start_date and end_date.

        Args:
            project_id: Project ID to search within (optional, auto-filled from context)
            workspace_slug: Workspace slug (optional, auto-filled from context)
        """
        # Auto-fill from context if not provided
        if "workspace_slug" in context and context.get("workspace_slug"):
            workspace_slug = context["workspace_slug"]
        if project_id is None and "project_id" in context:
            project_id = str(context["project_id"]) if context["project_id"] else None

        skipped = _build_placeholder_skip_payload("search_current_cycle", project_id)
        if skipped:
            return skipped

        try:
            if not project_id:
                return PlaneToolBase.format_error_payload(
                    "Failed to search for current cycle",
                    "project_id is required to search for current cycle",
                )

            # Normalize project_id if an identifier like 'OGX' was passed
            normalized_project_id = await _normalize_project_id(project_id, workspace_slug)
            if not normalized_project_id:
                return PlaneToolBase.format_error_payload(
                    "Failed to search for current cycle",
                    "project_id is required to search for current cycle",
                )

            from pi.app.api.v1.helpers.plane_sql_queries import search_current_cycle

            results = await search_current_cycle(normalized_project_id, workspace_slug, raise_on_error=True)

            if results:
                cycles_data = []
                cycle_names = []
                from pi.services.chat.helpers.url_builder import build_entity_url

                for result in results:
                    cycle_data = {
                        "id": result["id"],
                        "name": result["name"],
                        "project_id": result["project_id"],
                        "start_date": result.get("start_date"),
                        "end_date": result.get("end_date"),
                        "is_current": True,
                    }

                    # Build cycle URL and include in response message
                    ws_slug = result.get("workspace_slug") or workspace_slug
                    if ws_slug and result.get("project_id") and result.get("id"):
                        cycle_url = build_entity_url(
                            "cycle",
                            ws_slug,
                            entity_id=str(result["id"]),
                            project_id=str(result["project_id"]),
                        )
                        if cycle_url:
                            cycle_data["url"] = cycle_url

                    cycles_data.append(cycle_data)
                    cycle_names.append(result["name"])

                # Build response message
                if len(results) == 1:
                    message = f"Found current active cycle: '{cycle_names[0]}'"
                    if cycles_data[0].get("url"):
                        message += f"\nCycle URL: {cycles_data[0]['url']}"
                    response_data = cycles_data[0]
                else:
                    cycle_names_str = ", ".join([f"'{name}'" for name in cycle_names])
                    message = f"Found {len(results)} current active cycles: {cycle_names_str}"
                    response_data = {"cycles": cycles_data, "count": len(results)}

                return PlaneToolBase.format_success_payload(message, response_data)
            else:
                return PlaneToolBase.format_success_payload(
                    "No current active cycle found",
                    "No cycle is active today (no cycle where today falls between start_date and end_date)",
                )

        except Exception as e:
            return PlaneToolBase.format_error_payload(f"Error searching for current cycle: {str(e)}", str(e))

    @tool
    async def list_recent_cycles(
        count: Optional[int] = 3,
        status: Optional[str] = "completed",
        project_id: Optional[str] = None,
        workspace_slug: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List recent cycles in the current project/workspace context.

        Use this to resolve "last cycle" or "previous cycle" in project chats.

        Args:
            count: How many cycles to return (default 3)
            status: Filter by 'completed' | 'active' | 'upcoming' (default 'completed')
            project_id: Project scope (auto-filled from context; identifier will be resolved)
            workspace_slug: Workspace scope (auto-filled from context)
        """
        # Auto-fill from context if not provided
        if workspace_slug is None and "workspace_slug" in context:
            workspace_slug = context["workspace_slug"]
        if project_id is None and "project_id" in context:
            project_id = str(context["project_id"]) if context["project_id"] else None

        skipped = _build_placeholder_skip_payload("list_recent_cycles", project_id)
        if skipped:
            return skipped

        try:
            # Normalize project_id if identifier was provided
            project_id = await _normalize_project_id(project_id, workspace_slug)

            workspace_id: Optional[str] = None
            if not project_id and workspace_slug:
                # Resolve workspace_id from slug
                row = await PlaneDBPool.fetchrow("SELECT id FROM workspaces WHERE slug = $1", (workspace_slug,))
                workspace_id = str(row["id"]) if row else None

            if not project_id and not workspace_id:
                return PlaneToolBase.format_error_payload(
                    "Failed to list recent cycles",
                    "Missing project context; provide project_id or ensure project chat context",
                )

            from pi.app.api.v1.helpers.plane_sql_queries import list_recent_cycles as _list_recent_cycles

            rows = await _list_recent_cycles(
                project_id=project_id,
                workspace_id=workspace_id,
                limit=int(count or 3),
                status=status or "completed",
            )

            data = {"cycles": rows, "count": len(rows)}
            if rows:
                data["last_cycle_id"] = rows[0]["id"]

            return PlaneToolBase.format_success_payload("Successfully retrieved recent cycles", data)
        except Exception as e:
            return PlaneToolBase.format_error_payload("Failed to list recent cycles", str(e))

    @tool
    async def search_label_by_name(name: str, project_id: Optional[str] = None, workspace_slug: Optional[str] = None) -> Dict[str, Any]:
        """Search for a label by name and return its ID.

        Args:
            name: Label name to search for (required)
            project_id: Project ID to search within (optional, auto-filled from context)
            workspace_slug: Workspace slug (optional, auto-filled from context)
        """
        # Auto-fill from context if not provided
        if workspace_slug is None and "workspace_slug" in context:
            workspace_slug = context["workspace_slug"]
        if project_id is None and "project_id" in context:
            project_id = str(context["project_id"]) if context["project_id"] else None

        skipped = _build_placeholder_skip_payload("search_label_by_name", project_id, name)
        if skipped:
            return skipped

        try:
            # Normalize project_id if an identifier like 'OGX' was passed
            project_id = await _normalize_project_id(project_id, workspace_slug)
            from pi.app.api.v1.helpers.plane_sql_queries import search_label_by_name

            result = await search_label_by_name(name, project_id, workspace_slug, raise_on_error=True)

            if result:
                return PlaneToolBase.format_success_payload(
                    f"Found label '{name}'", {"id": result["id"], "name": result["name"], "project_id": result["project_id"]}
                )
            else:
                return PlaneToolBase.format_success_payload(f"No label found with name '{name}'", "Not found")

        except Exception as e:
            return PlaneToolBase.format_error_payload(f"Error searching for label '{name}': {str(e)}", str(e))

    @tool
    async def search_state_by_name(name: str, project_id: Optional[str] = None, workspace_slug: Optional[str] = None) -> Dict[str, Any]:
        """Search for a state by name and return its ID.

        Args:
            name: State name to search for (required)
            project_id: Project ID to search within (optional, auto-filled from context)
            workspace_slug: Workspace slug (optional, auto-filled from context)
        """
        # Auto-fill from context if not provided
        if workspace_slug is None and "workspace_slug" in context:
            workspace_slug = context["workspace_slug"]
        if project_id is None and "project_id" in context:
            project_id = str(context["project_id"]) if context["project_id"] else None

        skipped = _build_placeholder_skip_payload("search_state_by_name", project_id, name)
        if skipped:
            return skipped

        try:
            # Normalize project_id if an identifier like 'OGX' was passed
            project_id = await _normalize_project_id(project_id, workspace_slug)
            from pi.app.api.v1.helpers.plane_sql_queries import search_state_by_name

            result = await search_state_by_name(name, project_id, workspace_slug, raise_on_error=True)

            if result:
                return PlaneToolBase.format_success_payload(
                    f"Found state '{name}'", {"id": result["id"], "name": result["name"], "project_id": result["project_id"]}
                )
            else:
                return PlaneToolBase.format_success_payload(f"No state found with name '{name}'", "Not found")

        except Exception as e:
            return PlaneToolBase.format_error_payload(f"Error searching for state '{name}': {str(e)}", str(e))

    @tool
    async def search_user_by_name(
        display_name: Optional[str] = None,
        workspace_slug: Optional[str] = None,
        project_id: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Search for a user by display, first, or last name and return matches.

        Args:
            display_name: User display name to search for (required)
            workspace_slug: Workspace slug (optional, auto-filled from context)
            project_id: Project ID to search within (optional, auto-filled from context)
        """
        # Auto-fill from context if not provided
        if workspace_slug is None and "workspace_slug" in context:
            workspace_slug = context["workspace_slug"]
        if project_id is None and "project_id" in context:
            project_id = str(context["project_id"]) if context["project_id"] else None

        try:
            from pi.app.api.v1.helpers.plane_sql_queries import search_user_by_name

            # Ensure at least one name parameter is present
            if not any([display_name, first_name, last_name]):
                return PlaneToolBase.format_error_payload(
                    "At least one of display_name, first_name, or last_name must be provided",
                    "missing_parameters",
                )

            # Fallback broadening with smart splitting: if only display_name is provided
            # - If it looks like a full name (contains space or comma), split into first/last
            if display_name and not first_name and not last_name:
                dn = str(display_name).strip()
                if "," in dn:
                    parts = [p.strip() for p in dn.split(",", 1)]
                    # Format: Last, First
                    if len(parts) == 2 and parts[0] and parts[1]:
                        last_name = parts[0]
                        first_name = parts[1]
                else:
                    tokens = [t for t in dn.split() if t]
                    if len(tokens) >= 2:
                        first_name = tokens[0]
                        last_name = " ".join(tokens[1:])
                    else:
                        # Single token: broaden to both first and last
                        first_name = dn
                        last_name = dn

            # Normalize project_id if an identifier like 'OGX' was passed
            project_id = await _normalize_project_id(project_id, workspace_slug)

            result = await search_user_by_name(
                display_name=display_name,
                workspace_slug=workspace_slug,
                project_id=project_id,
                first_name=first_name,
                last_name=last_name,
            )

            if result:
                # Return all matching users with clear structure for LLM
                users_data = {
                    "total_matches": len(result),
                    "users": [
                        {
                            "id": user["id"],
                            "display_name": user["display_name"],
                            "first_name": user["first_name"],
                            "last_name": user["last_name"],
                            "email": user["email"],
                        }
                        for user in result
                    ],
                }

                # Make multiple matches explicit for LLM to trigger clarification
                if len(result) > 1:
                    message = (
                        f"MULTIPLE MATCHES: Found {len(result)} users matching '{display_name}'. Clarification needed to select the correct user."
                    )
                else:
                    message = f"Found 1 user matching '{display_name}'"

                return PlaneToolBase.format_success_payload(message, users_data)
            else:
                return PlaneToolBase.format_success_payload(f"No user found with display name '{display_name}'", "Not found")

        except Exception as e:
            return PlaneToolBase.format_error_payload(f"Error searching for user '{display_name}': {str(e)}", str(e))

    @tool
    async def search_workitem_by_name(name: str, project_id: Optional[str] = None, workspace_slug: Optional[str] = None) -> Dict[str, Any]:
        """Search for a work item by name and return its ID.

        Args:
            name: Work item name to search for (required)
            project_id: Project ID to search within (optional, auto-filled from context)
            workspace_slug: Workspace slug (optional, auto-filled from context)
        """
        # Auto-fill from context if not provided
        if workspace_slug is None and "workspace_slug" in context:
            workspace_slug = context["workspace_slug"]
        if project_id is None and "project_id" in context:
            project_id = str(context["project_id"]) if context["project_id"] else None

        try:
            # Normalize project_id if an identifier like 'OGX' was passed
            project_id = await _normalize_project_id(project_id, workspace_slug)
            from pi.app.api.v1.helpers.plane_sql_queries import search_workitem_by_name

            result = await search_workitem_by_name(name, project_id, workspace_slug)

            if result:
                return PlaneToolBase.format_success_payload(
                    f"Found work item '{name}'",
                    {
                        "id": result["id"],
                        "name": result["name"],
                        "project_id": result["project_id"],
                        "is_epic": result["is_epic"],
                        "type_id": result["type_id"],
                        "type_name": result["type_name"],
                    },
                )
            else:
                return PlaneToolBase.format_success_payload(f"No work item found with name '{name}'", "Not found")

        except Exception as e:
            return PlaneToolBase.format_error_payload(f"Error searching for work item '{name}': {str(e)}", str(e))

    @tool
    async def search_workitem_by_identifier(identifier: str, workspace_slug: Optional[str] = None) -> Dict[str, Any]:
        """Search for a work item by its unique identifier or UUID and return its details.

        This tool accepts two formats:
        1. PROJECT-SEQUENCE format (e.g., 'WEB-821', 'NEWDESIGNS-2')
        2. UUID format (e.g., 'dd65d302-5714-49f3-af4f-2fe84d8010d0')

        Use this tool when the user provides a work item identifier in either format.

        Args:
            identifier: Work item identifier to search for (required, e.g., 'WEB-821' or UUID)
            workspace_slug: Workspace slug (optional, auto-filled from context)
        """
        # Auto-fill from context if not provided
        if workspace_slug is None and "workspace_slug" in context:
            workspace_slug = context["workspace_slug"]

        try:
            from pi.app.api.v1.helpers.plane_sql_queries import search_workitem_by_identifier

            result = await search_workitem_by_identifier(identifier, workspace_slug)

            if result:
                return PlaneToolBase.format_success_payload(
                    f"Found work item '{identifier}'",
                    {
                        "id": result["id"],
                        "name": result["name"],
                        "project_id": result["project_id"],
                        "project_identifier": result["project_identifier"],
                        "sequence_id": result["sequence_id"],
                        "identifier": identifier,
                        "state_id": result.get("state_id"),
                        "priority": result.get("priority"),
                        "workspace_id": result["workspace_id"],
                        "is_epic": result["is_epic"],
                        "type_id": result["type_id"],
                        "type_name": result["type_name"],
                    },
                )
            else:
                return PlaneToolBase.format_success_payload(f"No work item found with identifier '{identifier}'", "Not found")

        except Exception as e:
            return PlaneToolBase.format_error_payload(f"Error searching for work item '{identifier}': {str(e)}", str(e))

    return [
        list_member_projects,
        search_module_by_name,
        search_project_by_name,
        search_project_by_identifier,
        search_cycle_by_name,
        search_current_cycle,
        list_recent_cycles,
        search_label_by_name,
        search_state_by_name,
        search_user_by_name,
        search_workitem_by_name,
        search_workitem_by_identifier,
    ]
