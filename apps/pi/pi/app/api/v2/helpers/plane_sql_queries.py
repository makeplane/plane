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

from datetime import datetime
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple

from pi import logger
from pi.core.db.plane import PlaneDBPool

log = logger.getChild("helpers.db_queries")


async def get_issue_details(issue_id: str) -> Optional[Dict[str, Any]]:
    query = """
    SELECT id, name, description_html
    FROM issues
    WHERE id = $1 AND deleted_at IS NULL
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (issue_id,))
        return result
    except Exception as e:
        log.error(f"Error fetching issue details for {issue_id}: {e}")
        return None


async def get_user_current_time(user_id: str) -> Optional[Dict[str, str]]:
    """
    Fetch the current time in the user's timezone.

    Returns:
        Dict with 'timezone' and 'current_time' keys, or None if user not found or timezone invalid
    """
    query = """
    SELECT user_timezone
    FROM users
    WHERE id = $1
    """
    try:
        result = await PlaneDBPool.fetchrow(query, (user_id,))
        if not result or not result["user_timezone"]:
            return None

        user_timezone = result["user_timezone"]

        # Validate timezone and get current time
        try:
            # Try to use zoneinfo (Python 3.9+)
            try:
                from zoneinfo import ZoneInfo

                tz = ZoneInfo(user_timezone)
            except ImportError:
                # Fallback to pytz for older Python versions
                try:
                    import pytz  # type: ignore[import-untyped]

                    tz = pytz.timezone(user_timezone)
                except ImportError:
                    log.error("Neither zoneinfo nor pytz available for timezone handling")
                    return None

            current_time = datetime.now(tz)

            return {
                "timezone": user_timezone,
                "current_time": current_time.strftime("%Y-%m-%d %H:%M:%S %Z"),
                "current_time_iso": current_time.isoformat(),
                "current_time_readable": current_time.strftime("%A, %B %d, %Y at %I:%M %p %Z"),
            }
        except Exception as tz_error:
            log.warning(f"Invalid timezone '{user_timezone}' for user {user_id}: {tz_error}")
            return None

    except Exception as e:
        log.error(f"Error fetching user timezone for {user_id}: {e}")
        return None


async def get_user_timezone_context_for_prompt(user_id: str) -> str:
    """
    Get user timezone context formatted for LLM prompts.

    Returns a formatted string with current time information for use in prompts.
    """
    time_info = await get_user_current_time(user_id)
    if not time_info:
        return "User timezone information is not available."

    return f"""Current time for user: {time_info["current_time_readable"]}
Timezone: {time_info["timezone"]}
"""


async def get_issue_identifier_for_artifact(issue_id: str) -> Optional[Dict[str, Any]]:
    """Lightweight fetch for work-item identifier pieces.

    Returns project_identifier, sequence_id, identifier, project_id, and name for the issue.
    """
    query = """
    SELECT
        p.identifier AS project_identifier,
        i.sequence_id::text AS sequence_id,
        p.identifier || '-' || i.sequence_id::text AS identifier,
        i.project_id,
        i.name
    FROM issues i
    JOIN projects p ON p.id = i.project_id AND p.deleted_at IS NULL
    WHERE i.id = $1 AND i.deleted_at IS NULL
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (issue_id,))
        return dict(result) if result else None
    except Exception as e:
        log.error(f"Error fetching lightweight issue identifier for {issue_id}: {e}")
        return None


async def get_issue_assignees(issue_id: str) -> List[Dict[str, Any]]:
    query = """
    SELECT u.id, u.first_name, u.last_name, u.email
    FROM issue_assignees ia
    JOIN users u ON ia.assignee_id = u.id
    WHERE ia.issue_id = $1 AND ia.deleted_at IS NULL
    """

    try:
        return await PlaneDBPool.fetch(query, (issue_id,))
    except Exception as e:
        log.error(f"Error fetching assignees for issue {issue_id}: {e}")
        return []


async def get_mentioned_users(user_ids: List[str]) -> List[Dict[str, Any]]:
    if not user_ids:
        return []
    placeholders = ", ".join([f"${i + 1}" for i in range(len(user_ids))])
    query = f"""
    SELECT id, first_name, last_name, email
    FROM users
    WHERE id IN ({placeholders})
    """

    try:
        return await PlaneDBPool.fetch(query, tuple(user_ids))
    except Exception as e:
        log.error(f"Error fetching mentioned users {user_ids}: {e}")
        return []


async def list_recent_cycles(
    project_id: Optional[str] = None,
    workspace_id: Optional[str] = None,
    limit: int = 3,
    status: Optional[str] = "completed",
) -> List[Dict[str, Any]]:
    """Return recent cycles for a given project or workspace.

    Args:
        project_id: Scope to this project if provided
        workspace_id: Scope to this workspace if provided (used when project_id is absent)
        limit: Max number of cycles to return (default 3)
        status: Optional filter - one of ['completed', 'active', 'upcoming'] (case-insensitive). If None, no status filter

    Returns:
        List of cycles with id, name, project_id, workspace_id, workspace_slug, start_date, end_date, status
    """
    if not project_id and not workspace_id:
        return []

    filters: List[str] = [
        "c.deleted_at IS NULL",
        "c.archived_at IS NULL",
    ]

    params: List[Any] = []
    param_index = 1

    if project_id:
        filters.append(f"c.project_id = ${param_index}")
        params.append(project_id)
        param_index += 1
    if workspace_id:
        filters.append(f"c.workspace_id = ${param_index}")
        params.append(workspace_id)
        param_index += 1

    status_clause = ""
    if isinstance(status, str) and status:
        s = status.lower().strip()
        if s in {"completed", "complete", "closed", "past", "previous", "last"}:
            status_clause = " AND c.end_date::date < CURRENT_DATE"
        elif s in {"active", "current", "ongoing"}:
            status_clause = " AND CURRENT_DATE BETWEEN c.start_date::date AND c.end_date::date"
        elif s in {"upcoming", "future", "next"}:
            status_clause = " AND c.start_date::date > CURRENT_DATE"

    query = f"""
        SELECT
            c.id,
            c.name,
            c.project_id,
            c.workspace_id,
            w.slug AS workspace_slug,
            c.start_date::date AS start_date,
            c.end_date::date AS end_date,
            CASE
                WHEN CURRENT_DATE BETWEEN c.start_date::date AND c.end_date::date THEN 'active'
                WHEN c.end_date::date < CURRENT_DATE THEN 'completed'
                ELSE 'upcoming'
            END AS status
        FROM cycles c
        LEFT JOIN workspaces w ON w.id = c.workspace_id AND w.deleted_at IS NULL
        WHERE {" AND ".join(filters)}{status_clause}
        ORDER BY c.end_date::date DESC NULLS LAST, c.start_date::date DESC NULLS LAST
        LIMIT ${param_index}
    """

    try:
        params.append(int(limit or 3))
        rows = await PlaneDBPool.fetch(query, tuple(params))
        result: List[Dict[str, Any]] = []
        for r in rows:
            try:
                result.append({
                    "id": str(r["id"]),
                    "name": r["name"],
                    "project_id": str(r["project_id"]) if r.get("project_id") else None,
                    "workspace_id": str(r["workspace_id"]) if r.get("workspace_id") else None,
                    "workspace_slug": r.get("workspace_slug"),
                    "start_date": str(r["start_date"]) if r.get("start_date") else None,
                    "end_date": str(r["end_date"]) if r.get("end_date") else None,
                    "status": r.get("status"),
                })
            except Exception:
                # Best-effort row mapping; skip malformed rows
                continue
        return result
    except Exception as e:
        log.error(f"Error listing recent cycles (project_id={project_id}, workspace_id={workspace_id}): {e}")
        return []


async def get_workspace_slug(workspace_id: str) -> Optional[str]:
    query = """
    SELECT slug
    FROM workspaces
    WHERE id = $1
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (workspace_id,))
        return result["slug"] if result else None
    except Exception as e:
        log.error(f"Error fetching workspace slug for {workspace_id}: {e}")
        return None


async def resolve_workspace_id_from_project_id(project_id: str) -> Optional[str]:
    """
    Resolve workspace_id from project_id.

    Returns:
        workspace_id
    """
    query = """
    SELECT p.workspace_id
    FROM projects p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE p.id = $1
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (project_id,))
        if result:
            return str(result["workspace_id"])  # Convert UUID object to string
        return None
    except Exception as e:
        log.error(f"Error resolving workspace from project_id {project_id}: {e}")
        return None


async def get_issue_comments(issue_id: str) -> List[Dict[str, Any]]:
    query = """
    SELECT ic.id, ic.comment_html, ic.created_at, u.display_name, u.id as user_id
    FROM issue_comments ic
    JOIN users u ON ic.actor_id = u.id
    WHERE ic.issue_id = $1 AND ic.deleted_at IS NULL
    ORDER BY ic.created_at ASC
    """

    try:
        return await PlaneDBPool.fetch(query, (issue_id,))
    except Exception as e:
        log.error(f"Error fetching comments for issue {issue_id}: {e}")
        return []


async def get_agent_ids(workspace_id: str, source: str) -> Optional[Tuple[str, str]]:
    query = """
    SELECT connection_id, target_identifier
    FROM workspace_connections
    WHERE workspace_id = $1 AND connection_type = $2 AND deleted_at IS NULL
    LIMIT 1
    """

    try:
        result = await PlaneDBPool.fetchrow(
            query,
            (
                workspace_id,
                source,
            ),
        )
        if result:
            return result["connection_id"], result["target_identifier"]
        else:
            return None
    except Exception as e:
        log.error(f"Error fetching application id for {source} in workspace {workspace_id}: {e}")
        return None


# New functions for resolving IDs to names
async def get_project_name(project_id: str) -> Optional[str]:
    """Get project name from project ID."""
    query = """
    SELECT name
    FROM projects
    WHERE id = $1 AND deleted_at IS NULL
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (project_id,))
        return result["name"] if result else None
    except Exception as e:
        log.error(f"Error fetching project name for {project_id}: {e}")
        return None


async def get_module_name(module_id: str) -> Optional[str]:
    """Get module name from module ID."""
    query = """
    SELECT name
    FROM modules
    WHERE id = $1 AND deleted_at IS NULL
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (module_id,))
        return result["name"] if result else None
    except Exception as e:
        log.error(f"Error fetching module name for {module_id}: {e}")
        return None


async def get_cycle_name(cycle_id: str) -> Optional[str]:
    """Get cycle name from cycle ID."""
    query = """
    SELECT name
    FROM cycles
    WHERE id = $1 AND deleted_at IS NULL
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (cycle_id,))
        return result["name"] if result else None
    except Exception as e:
        log.error(f"Error fetching cycle name for {cycle_id}: {e}")
        return None


async def get_state_name(state_id: str) -> Optional[str]:
    """Get state name from state ID."""
    query = """
    SELECT name
    FROM states
    WHERE id = $1 AND deleted_at IS NULL
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (state_id,))
        return result["name"] if result else None
    except Exception as e:
        log.error(f"Error fetching state name for {state_id}: {e}")
        return None


async def get_state_details_by_id(state_id: str) -> Optional[Dict[str, Any]]:
    """Get full state details including group from state ID."""
    query = """
    SELECT id, name, "group", project_id
    FROM states
    WHERE id = $1 AND deleted_at IS NULL
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (state_id,))
        if result:
            return {"id": str(result["id"]), "name": result["name"], "group": result["group"], "project_id": str(result["project_id"])}
        return None
    except Exception as e:
        log.error(f"Error fetching state details for {state_id}: {e}")
        return None


async def get_label_name(label_id: str) -> Optional[str]:
    """Get label name from label ID."""
    query = """
    SELECT name
    FROM labels
    WHERE id = $1 AND deleted_at IS NULL
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (label_id,))
        return result["name"] if result else None
    except Exception as e:
        log.error(f"Error fetching label name for {label_id}: {e}")
        return None


async def get_user_name(user_id: str) -> Optional[str]:
    """Get user display name from user ID."""
    query = """
    SELECT display_name
    FROM users
    WHERE id = $1
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (user_id,))
        return result["display_name"] if result else None
    except Exception as e:
        log.error(f"Error fetching user name for {user_id}: {e}")
        return None


async def get_workspace_name(workspace_id: str) -> Optional[str]:
    """Get workspace name from workspace ID."""
    query = """
    SELECT name
    FROM workspaces
    WHERE id = $1
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (workspace_id,))
        return result["name"] if result else None
    except Exception as e:
        log.error(f"Error fetching workspace name for {workspace_id}: {e}")
        return None


async def get_project_id_from_identifier(identifier: str, workspace_id: str) -> Optional[str]:
    """
    Get project ID from project identifier and workspace ID.

    Args:
        identifier: Project identifier (e.g., 'HYDR', 'PARM')
        workspace_id: Workspace ID

    Returns:
        Project ID (UUID string) or None if not found
    """
    query = """
    SELECT id
    FROM projects
    WHERE identifier = $1 AND workspace_id = $2 AND deleted_at IS NULL
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (identifier, workspace_id))
        if result:
            return str(result["id"])  # Convert UUID object to string
        return None
    except Exception as e:
        log.error(f"Error fetching project ID for identifier {identifier} in workspace {workspace_id}: {e}")
        return None


async def get_epic_type_id_for_project(project_id: str) -> Optional[str]:
    """
    Get the epic issue type ID for a specific project.

    Args:
        project_id: Project UUID

    Returns:
        Epic issue type ID (UUID string) or None if not found
    """
    query = """
    SELECT it.id
    FROM issue_types it
    JOIN project_issue_types pit ON it.id = pit.issue_type_id
    WHERE pit.project_id = $1
    AND it.is_epic = true
    AND it.is_active = true
    AND it.deleted_at IS NULL
    AND pit.deleted_at IS NULL
    ORDER BY it.created_at ASC
    LIMIT 1
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (project_id,))
        if result:
            return str(result["id"])  # Convert UUID object to string

        else:
            return None

    except Exception as e:
        log.error(f"Error fetching epic type ID for project {project_id}: {e}")
        return None


async def resolve_id_to_name(entity_type: str, entity_id: str) -> Optional[str]:
    """
    Generic function to resolve any entity ID to its name.

    Args:
        entity_type: Type of entity (project, module, cycle, state, label, user, workspace)
        entity_id: The entity ID to resolve

    Returns:
        The entity name or None if not found
    """
    if not entity_id:
        return None

    # Map entity types to their resolver functions
    resolvers = {
        "project": get_project_name,
        "project_id": get_project_name,
        "module": get_module_name,
        "module_id": get_module_name,
        "cycle": get_cycle_name,
        "cycle_id": get_cycle_name,
        "state": get_state_name,
        "state_id": get_state_name,
        "label": get_label_name,
        "label_id": get_label_name,
        "user": get_user_name,
        "user_id": get_user_name,
        "assignee": get_user_name,
        "assignee_id": get_user_name,
        "workspace": get_workspace_name,
        "workspace_id": get_workspace_name,
    }

    resolver = resolvers.get(entity_type.lower())
    if resolver:
        return await resolver(entity_id)

    return None


# Entity search functions for finding IDs by name
async def search_module_by_name(name: str, project_id: Optional[str] = None, workspace_slug: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Search for a module by name and return its details."""
    query = """
    SELECT m.id, m.name, m.project_id
    FROM modules m
    JOIN projects p ON m.project_id = p.id
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE m.name ILIKE $1
    AND m.deleted_at IS NULL
    """

    params = [f"%{name}%"]

    if project_id:
        query += " AND m.project_id = $2"
        params.append(project_id)

    if workspace_slug:
        query += " AND w.slug = $3"
        params.append(workspace_slug)

    query += " LIMIT 20"

    try:
        result = await PlaneDBPool.fetchrow(query, tuple(params))
        if result:
            return {"id": str(result["id"]), "name": result["name"], "project_id": str(result["project_id"])}
        return None
    except Exception as e:
        log.error(f"Error searching for module '{name}': {e}, query: {query}, project_id: {project_id}, workspace_slug: {workspace_slug}")
        return None


async def search_project_by_name(
    name: str,
    workspace_slug: Optional[str] = None,
    member_id: Optional[str] = None,
) -> Optional[List[Dict[str, Any]]]:
    """Search for projects by name and return a list of matching projects.

    Returns a list of up to 20 matches so upstream tools/LLM can disambiguate when needed.
    """
    query = """
    SELECT p.id, p.name, p.workspace_id, p.identifier
    FROM projects p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE p.name ILIKE $1
    AND p.deleted_at IS NULL
    AND p.archived_at IS NULL
    """

    params = [f"%{name}%"]
    param_index = 2

    if workspace_slug:
        query += f" AND w.slug = ${param_index}"
        params.append(workspace_slug)
        param_index += 1

    if member_id:
        # Only include projects where the user is an active member
        query += (
            f" AND EXISTS (SELECT 1 FROM project_members pm "
            f"WHERE pm.project_id = p.id AND pm.member_id = ${param_index} "
            f"AND pm.is_active IS TRUE AND pm.deleted_at IS NULL)"
        )
        params.append(member_id)
        param_index += 1

    query += " LIMIT 20"

    try:
        rows = await PlaneDBPool.fetch(query, tuple(params))
        if rows:
            return [
                {
                    "id": str(r["id"]),
                    "name": r["name"],
                    "workspace_id": str(r["workspace_id"]),
                    "identifier": r["identifier"],
                }
                for r in rows
            ]
        return []
    except Exception as e:
        log.error(f"Error searching for project '{name}': {e}, query: {query}, workspace_slug: {workspace_slug}")
        return None


async def search_cycle_by_name(name: str, project_id: Optional[str] = None, workspace_slug: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Search for a cycle by name and return its details."""
    query = """
    SELECT c.id, c.name, c.project_id, c.start_date, c.end_date
    FROM cycles c
    JOIN projects p ON c.project_id = p.id
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE c.name ILIKE $1
    AND c.deleted_at IS NULL
    """

    params = [f"%{name}%"]
    param_index = 2

    if project_id:
        query += f" AND c.project_id = ${param_index}"
        params.append(project_id)
        param_index += 1

    if workspace_slug:
        query += f" AND w.slug = ${param_index}"
        params.append(workspace_slug)
        param_index += 1

    query += " LIMIT 20"

    try:
        result = await PlaneDBPool.fetchrow(query, tuple(params))
        if result:
            return {
                "id": str(result["id"]),
                "name": result["name"],
                "project_id": str(result["project_id"]),
                "start_date": str(result["start_date"]) if result["start_date"] else None,
                "end_date": str(result["end_date"]) if result["end_date"] else None,
            }
        return None
    except Exception as e:
        log.error(f"Error searching for cycle '{name}': {e}, query: {query}, project_id: {project_id}, workspace_slug: {workspace_slug}")
        return None


async def search_current_cycle(project_id: str, workspace_slug: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Search for the current active cycle in a project (where today's date falls within start_date and end_date).

    Args:
        project_id: Project ID to search within (required)
        workspace_slug: Workspace slug (optional filter)

    Returns:
        Dictionary with cycle details if found, None otherwise
    """
    query = """
    SELECT c.id, c.name, c.project_id, c.workspace_id, c.start_date, c.end_date, w.slug AS workspace_slug
    FROM cycles c
    JOIN projects p ON c.project_id = p.id
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE c.project_id = $1
    AND c.deleted_at IS NULL
    AND c.archived_at IS NULL
    AND c.start_date <= CURRENT_DATE
    AND c.end_date >= CURRENT_DATE
    """

    params = [project_id]
    param_index = 2

    if workspace_slug:
        query += f" AND w.slug = ${param_index}"
        params.append(workspace_slug)
        param_index += 1

    query += " ORDER BY c.start_date DESC LIMIT 1"

    try:
        result = await PlaneDBPool.fetchrow(query, tuple(params))
        if result:
            return {
                "id": str(result["id"]),
                "name": result["name"],
                "project_id": str(result["project_id"]),
                "workspace_id": str(result["workspace_id"]) if result.get("workspace_id") else None,
                "workspace_slug": result.get("workspace_slug"),
                "start_date": str(result["start_date"]) if result["start_date"] else None,
                "end_date": str(result["end_date"]) if result["end_date"] else None,
            }
        return None
    except Exception as e:
        log.error(
            f"Error searching for current cycle in project '{project_id}': {e}, query: {query}, project_id: {project_id}, workspace_slug: {workspace_slug}"  # noqa E501
        )  # noqa: E501
        return None


async def search_label_by_name(name: str, project_id: Optional[str] = None, workspace_slug: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Search for a label by name and return its details."""
    query = """
    SELECT l.id, l.name, l.project_id, l.color
    FROM labels l
    JOIN projects p ON l.project_id = p.id
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE l.name ILIKE $1
    AND l.deleted_at IS NULL
    """

    params = [f"%{name}%"]

    if project_id:
        query += " AND l.project_id = $2"
        params.append(project_id)

    if workspace_slug:
        query += " AND w.slug = $3"
        params.append(workspace_slug)

    query += " LIMIT 20"

    try:
        result = await PlaneDBPool.fetchrow(query, tuple(params))
        if result:
            return {"id": str(result["id"]), "name": result["name"], "color": result.get("color"), "project_id": str(result["project_id"])}
        return None
    except Exception as e:
        log.error(f"Error searching for label '{name}': {e}, query: {query}, project_id: {project_id}, workspace_slug: {workspace_slug}")
        return None


async def search_state_by_name(name: str, project_id: Optional[str] = None, workspace_slug: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Search for a state by name and return its details."""
    query = """
    SELECT s.id, s.name, s.project_id, s."group"
    FROM states s
    JOIN projects p ON s.project_id = p.id
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE s.name ILIKE $1
    AND s.deleted_at IS NULL
    """

    params = [f"%{name}%"]

    if project_id:
        query += " AND s.project_id = $2"
        params.append(project_id)

    if workspace_slug:
        query += " AND w.slug = $3"
        params.append(workspace_slug)

    query += " LIMIT 20"

    try:
        result = await PlaneDBPool.fetchrow(query, tuple(params))
        if result:
            return {"id": str(result["id"]), "name": result["name"], "group": result["group"], "project_id": str(result["project_id"])}
        return None
    except Exception as e:
        log.error(f"Error searching for state '{name}': {e}, query: {query}, project_id: {project_id}, workspace_slug: {workspace_slug}")
        return None


async def search_user_by_name(
    display_name: Optional[str] = None,
    workspace_slug: Optional[str] = None,
    project_id: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Search for users by display, first, or last name and return details (up to 20).

    - Matches are case-insensitive and partial via ILIKE.
    - At least one of display_name, first_name, last_name should be provided.
    - If project_id is provided, searches within project members; otherwise searches workspace members.
    """
    # Build dynamic WHERE conditions (prefer AND when both first and last are provided)
    params: list[Any] = []
    param_index = 1

    log.info(f"Searching for user by name filters (display='{display_name}', first='{first_name}', last='{last_name}', project_id='{project_id}')")

    clauses: list[str] = []

    if display_name:
        clauses.append(f"u.display_name ILIKE ${param_index}")
        params.append(f"%{display_name}%")
        param_index += 1

    if first_name and last_name:
        # Strict match: both first and last should match their respective columns
        clauses.append(f"(u.first_name ILIKE ${param_index} AND u.last_name ILIKE ${param_index + 1})")
        params.append(f"%{first_name}%")
        params.append(f"%{last_name}%")
        param_index += 2

        # Forgiving variants to handle profiles where the full name is stored entirely in first_name
        # or last_name is empty. These are OR'ed with the overall where clause.
        # 1) Combined full-name match across first_name + last_name
        clauses.append(f"CONCAT_WS(' ', u.first_name, u.last_name) ILIKE ${param_index}")
        params.append(f"%{first_name} {last_name}%")
        param_index += 1

        # 2) Either field may match independently (helps when last_name is empty)
        clauses.append(f"u.first_name ILIKE ${param_index}")
        params.append(f"%{first_name}%")
        param_index += 1

        clauses.append(f"u.last_name ILIKE ${param_index}")
        params.append(f"%{last_name}%")
        param_index += 1
    else:
        if first_name:
            clauses.append(f"u.first_name ILIKE ${param_index}")
            params.append(f"%{first_name}%")
            param_index += 1
        if last_name:
            clauses.append(f"u.last_name ILIKE ${param_index}")
            params.append(f"%{last_name}%")
            param_index += 1

    # If no name filters provided, return empty list (avoid full scan)
    if not clauses:
        return []

    where_name = " OR ".join(clauses)

    # Choose between project-scoped or workspace-scoped search
    if project_id:
        # Project-scoped: search within project members
        query = f"""
        SELECT u.id, u.display_name, u.first_name, u.last_name, u.email
        FROM users u
        JOIN project_members pm ON u.id = pm.member_id
        WHERE ({where_name})
          AND pm.project_id = ${param_index}
          AND pm.deleted_at IS NULL
          AND pm.is_active = true
          AND u.is_active = true
        """
        params.append(project_id)
        param_index += 1
    else:
        # Workspace-scoped: search within workspace members
        query = f"""
        SELECT u.id, u.display_name, u.first_name, u.last_name, u.email
        FROM users u
        JOIN workspace_members wm ON u.id = wm.member_id
        JOIN workspaces w ON wm.workspace_id = w.id
        WHERE ({where_name})
          AND wm.deleted_at IS NULL
          AND wm.is_active IS TRUE
          AND u.is_active IS TRUE
        """

        if workspace_slug:
            query += f" AND w.slug = ${param_index}"
            params.append(workspace_slug)
            param_index += 1

    query += " LIMIT 20"
    log.info(f"Searching for user by name query: {query}, params: {params}")
    try:
        rows = await PlaneDBPool.fetch(query, tuple(params))
        log.info(f"Searching for user by name rows: {rows}")
        return [
            {
                "id": str(r["id"]),
                "display_name": r["display_name"],
                "first_name": r["first_name"],
                "last_name": r["last_name"],
                "email": r["email"],
            }
            for r in rows
        ]
    except Exception as e:
        log.error(
            f"Error searching for user by name filters (display='{display_name}', first='{first_name}', last='{last_name}'): {e}, workspace_slug: {workspace_slug}, project_id: {project_id}"  # noqa: E501
        )
        return []


async def search_workitem_by_name(name: str, project_id: Optional[str] = None, workspace_slug: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Search for a work item by name and return its details."""
    query = """
    SELECT i.id, i.name, i.project_id, it.id as type_id, it.name as type_name, it.is_epic as is_epic
    FROM issues i
    JOIN projects p ON i.project_id = p.id
    JOIN workspaces w ON p.workspace_id = w.id
    LEFT JOIN issue_types it ON i.type_id = it.id
    WHERE i.name ILIKE $1
    AND i.deleted_at IS NULL
    """

    params = [f"%{name}%"]

    # Dynamically assign parameter positions based on which optional filters are present
    next_param_index = 2
    if project_id:
        query += f" AND i.project_id = ${next_param_index}"
        params.append(project_id)
        next_param_index += 1

    if workspace_slug:
        query += f" AND w.slug = ${next_param_index}"
        params.append(workspace_slug)

    query += " LIMIT 20"

    try:
        result = await PlaneDBPool.fetchrow(query, tuple(params))
        if result:
            return {
                "id": str(result["id"]),
                "name": result["name"],
                "project_id": str(result["project_id"]),
                "type_id": str(result["type_id"]),
                "type_name": result["type_name"],
                "is_epic": result["is_epic"],
            }
        return None
    except Exception as e:
        log.error(f"Error searching for work item '{name}': {e}, query: {query}, project_id: {project_id}, workspace_slug: {workspace_slug}")
        return None


async def get_pro_business_workspaces() -> List[str]:
    """
    Get all Pro/Business workspace IDs from the Plane database.

    Simple logic: Just check if plan = PRO/BUSINESS (ignore is_cancelled since
    plan changes happen at the end of subscription period).

    Returns:
        List of workspace IDs (as strings) that have Pro/Business plans
    """
    query = """
    SELECT DISTINCT workspace_id::text as workspace_id
    FROM workspace_licenses
    WHERE UPPER(plan) IN ('PRO', 'BUSINESS')
    ORDER BY workspace_id
    """

    try:
        results = await PlaneDBPool.fetch(query)
        workspace_ids = [row["workspace_id"] for row in results]
        return workspace_ids
    except Exception as e:
        log.error(f"Error fetching Pro/Business workspaces: {e}")
        return []


async def check_workspace_plan(workspace_id: str) -> Optional[str]:
    """
    Check the current plan for a specific workspace.

    Args:
        workspace_id: Workspace ID to check

    Returns:
        Plan name (PRO, BUSINESS, FREE, etc.) or None if not found
    """
    query = """
    SELECT UPPER(plan) as plan
    FROM workspace_licenses
    WHERE workspace_id = $1
    LIMIT 1
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (workspace_id,))
        return result["plan"] if result else None
    except Exception as e:
        log.error(f"Error checking plan for workspace {workspace_id}: {e}")
        return None


async def get_workspace_plans_batch(workspace_ids: List[str]) -> Dict[str, str]:
    """
    Get current plans for multiple workspaces in a single query.

    Args:
        workspace_ids: List of workspace IDs to check

    Returns:
        Dictionary mapping workspace_id -> plan name
    """
    if not workspace_ids:
        return {}

    placeholders = ", ".join([f"${i + 1}" for i in range(len(workspace_ids))])
    query = f"""
    SELECT workspace_id::text as workspace_id, UPPER(plan) as plan
    FROM workspace_licenses
    WHERE workspace_id IN ({placeholders})
    """

    try:
        results = await PlaneDBPool.fetch(query, tuple(workspace_ids))
        return {row["workspace_id"]: row["plan"] for row in results}
    except Exception as e:
        log.error(f"Error fetching workspace plans for {len(workspace_ids)} workspaces: {e}")
        return {}


async def get_all_workspace_ids() -> List[str]:
    """
    Get all workspace IDs from the Plane database.

    Returns:
        List of workspace IDs (as strings)
    """
    query = """
    SELECT id::text as workspace_id
    FROM workspaces
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    """

    try:
        results = await PlaneDBPool.fetch(query)
        workspace_ids = [row["workspace_id"] for row in results]
        log.info(f"Fetched {len(workspace_ids)} workspace IDs")
        return workspace_ids
    except Exception as e:
        log.error(f"Error fetching all workspace IDs: {e}")
        return []


async def search_workitem_by_identifier(identifier: str, workspace_slug: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Search for a work item by its unique identifier (e.g., 'WEB-821').

    Args:
        identifier: The unique identifier in format 'PROJECT-SEQUENCE' (e.g., 'WEB-821')
        workspace_slug: Optional workspace slug for filtering

    Returns:
        Dictionary with work item details or None if not found
    """
    try:
        # Parse the identifier (e.g., 'WEB-821' -> project_identifier='WEB', sequence_id=821)
        if "-" not in identifier:
            log.error(f"Invalid identifier format '{identifier}'. Expected format: 'PROJECT-SEQUENCE'")
            return None

        project_identifier, sequence_str = identifier.split("-", 1)

        try:
            sequence_id = int(sequence_str)
        except ValueError:
            log.error(f"Invalid sequence number '{sequence_str}' in identifier '{identifier}'")
            return None

        # Build the query with workspace filtering if provided
        workspace_filter = ""
        params = [project_identifier, sequence_id]

        if workspace_slug:
            workspace_filter = "AND w.slug = $3"
            params.append(workspace_slug)

        query = f"""
        SELECT
            i.id,
            i.name,
            i.project_id,
            p.identifier as project_identifier,
            i.sequence_id,
            i.state_id,
            i.priority,
            i.workspace_id,
            i.created_at,
            i.updated_at,
            i.description_stripped,
            i.start_date,
            i.target_date,
            i.completed_at,
            i.point,
            i.is_draft,
            i.archived_at,
            i.type_id,
            it.name as type_name,
            it.is_epic as is_epic
        FROM issues i
        JOIN projects p ON i.project_id = p.id
        JOIN workspaces w ON i.workspace_id = w.id
        LEFT JOIN issue_types it ON i.type_id = it.id
        WHERE p.identifier = $1
        AND i.sequence_id = $2
        AND i.deleted_at IS NULL
        AND p.deleted_at IS NULL
        {workspace_filter}
        LIMIT 1
        """

        result = await PlaneDBPool.fetchrow(query, tuple(params))

        if result:
            log.info(f"Found work item with identifier '{identifier}': {result["name"]}")
            return dict(result)
        else:
            log.info(f"No work item found with identifier '{identifier}'")
            return None

    except Exception as e:
        log.error(f"Error searching for work item '{identifier}': {e}")
        return None


async def get_workitem_details_for_artifact(workitem_id: str) -> Optional[Dict[str, Any]]:
    """
    Get work item details for artifact generation.

    Args:
        workitem_id: The ID of the work item to fetch details for

    Returns:
        Dictionary with work item details or None if not found
    """
    query = """
    SELECT
        i.id,
        i.name,
        i.description_stripped AS description,
        i.priority,
        i.start_date,
        i.target_date,
        i.project_id,
        p.name AS project_name,
        p.identifier || '-' || i.sequence_id::text AS identifier,
        ist.name AS state,
        ist.group AS state_group,
        i.state_id,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT c.id ORDER BY c.id), NULL::uuid)
            FROM cycle_issues ci
            JOIN cycles c ON ci.cycle_id = c.id AND c.deleted_at IS NULL
            WHERE ci.issue_id = i.id AND ci.deleted_at IS NULL
        ), ARRAY[]::uuid[]
        ) AS cycle_ids,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT c.name ORDER BY c.name), NULL::text)
            FROM cycle_issues ci
            JOIN cycles c ON ci.cycle_id = c.id AND c.deleted_at IS NULL
            WHERE ci.issue_id = i.id AND ci.deleted_at IS NULL
        ), ARRAY[]::text[]
        ) AS cycles,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT m.id ORDER BY m.id), NULL::uuid)
            FROM module_issues mi
            JOIN modules m ON mi.module_id = m.id AND m.deleted_at IS NULL
            WHERE mi.issue_id = i.id AND mi.deleted_at IS NULL
        ), ARRAY[]::uuid[]
        ) AS module_ids,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT m.name ORDER BY m.name), NULL::text)
            FROM module_issues mi
            JOIN modules m ON mi.module_id = m.id AND m.deleted_at IS NULL
            WHERE mi.issue_id = i.id AND mi.deleted_at IS NULL
        ), ARRAY[]::text[]
        ) AS modules,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT u.id ORDER BY u.id), NULL::uuid)
            FROM issue_assignees ia
            JOIN users u ON ia.assignee_id = u.id AND u.is_active = true AND u.is_bot = false
            WHERE ia.issue_id = i.id AND ia.deleted_at IS NULL
        ), ARRAY[]::uuid[]
        ) AS assignee_ids,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT u.display_name ORDER BY u.display_name), NULL::text)
            FROM issue_assignees ia
            JOIN users u ON ia.assignee_id = u.id AND u.is_active = true AND u.is_bot = false
            WHERE ia.issue_id = i.id AND ia.deleted_at IS NULL
        ), ARRAY[]::text[]
        ) AS assignees,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT l.id ORDER BY l.id), NULL::uuid)
            FROM issue_labels il
            JOIN labels l ON il.label_id = l.id AND l.deleted_at IS NULL
            WHERE il.issue_id = i.id AND il.deleted_at IS NULL
        ), ARRAY[]::uuid[]
        ) AS label_ids,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT l.name ORDER BY l.name), NULL::text)
            FROM issue_labels il
            JOIN labels l ON il.label_id = l.id AND l.deleted_at IS NULL
            WHERE il.issue_id = i.id AND il.deleted_at IS NULL
        ), ARRAY[]::text[]
        ) AS labels,
        parent_i.name AS parent,
        i.parent_id
    FROM issues i
    LEFT JOIN projects p ON i.project_id = p.id AND p.deleted_at IS NULL
    LEFT JOIN states ist ON i.state_id = ist.id AND ist.deleted_at IS NULL
    LEFT JOIN issues parent_i ON i.parent_id = parent_i.id AND parent_i.deleted_at IS NULL
    WHERE i.id = $1
    AND i.deleted_at IS NULL;
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (workitem_id,))
        return dict(result) if result else None
    except Exception as e:
        log.error(f"Error fetching workitem details for {workitem_id}: {e}")
        return None


async def get_project_details_for_artifact(project_id: str) -> Optional[Dict[str, Any]]:
    """
    Get project details for artifact generation.

    Args:
        project_id: The ID of the project to fetch details for

    Returns:
        Dictionary with project details or None if not found
    """
    query = """
    SELECT
        p.id,
        p.name,
        p.description,
        p.identifier,
        pa.priority,
        pa.start_date,
        pa.target_date,
        ps.name AS state,
        u.display_name AS lead,
        p.project_lead_id,
        array_remove(array_agg(DISTINCT u2.id) FILTER (WHERE u2.id IS NOT NULL), NULL) AS member_ids,
        array_remove(array_agg(DISTINCT u2.display_name) FILTER (WHERE u2.display_name IS NOT NULL), NULL) AS members
    FROM projects p
    LEFT JOIN project_attributes pa ON p.id = pa.project_id
    LEFT JOIN project_states ps ON pa.state_id = ps.id AND ps.deleted_at IS NULL
    LEFT JOIN users u ON p.project_lead_id = u.id
                    AND u.is_active = true
                    AND u.is_bot = false
    LEFT JOIN project_members pm ON p.id = pm.project_id
                                AND pm.deleted_at IS NULL
                                AND pm.is_active = true
    LEFT JOIN users u2 ON pm.member_id = u2.id
                    AND u2.is_active = true
                    AND u2.is_bot = false
    WHERE
        p.id = $1
        AND p.deleted_at IS NULL
    GROUP BY
        p.id, pa.priority, pa.start_date, pa.target_date, ps.name, u.display_name;
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (project_id,))
        return dict(result) if result else None
    except Exception as e:
        log.error(f"Error fetching project details for {project_id}: {e}")
        return None


async def get_cycle_details_for_artifact(cycle_id: str) -> Optional[Dict[str, Any]]:
    """
    Get cycle details for artifact generation.

    Args:
        cycle_id: The ID of the cycle to fetch details for

    Returns:
        Dictionary with cycle details or None if not found
    """
    query = """
    SELECT
        c.id,
        c.name,
        c.description,
        c.start_date,
        c.end_date,
        c.project_id,
        p.name AS project,
        p.identifier AS project_identifier
    FROM cycles c
    LEFT JOIN projects p ON c.project_id = p.id AND p.deleted_at IS NULL
    WHERE
        c.id = $1
        AND c.deleted_at IS NULL;
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (cycle_id,))
        return dict(result) if result else None
    except Exception as e:
        log.error(f"Error fetching cycle details for {cycle_id}: {e}")
        return None


# ---------------------------------------------------------------------------
# Cycle analytics helpers (summary, breakdowns, burndown, scope, issues)
# ---------------------------------------------------------------------------


async def get_cycle_core(cycle_id: str) -> Optional[Dict[str, Any]]:
    """Return core cycle details for a given cycle_id."""
    query = """
    SELECT c.id, c.name, c.description, c.project_id, c.workspace_id, c.owned_by_id,
           c.start_date::date AS start_date, c.end_date::date AS end_date, c.timezone,
           u.display_name AS owner_name, w.slug AS workspace_slug
    FROM cycles c
    LEFT JOIN users u ON u.id = c.owned_by_id AND u.is_active = TRUE AND u.is_bot = FALSE
    LEFT JOIN workspaces w ON w.id = c.workspace_id AND w.deleted_at IS NULL
    WHERE c.id = $1 AND c.deleted_at IS NULL AND c.archived_at IS NULL
    """
    try:
        row = await PlaneDBPool.fetchrow(query, (cycle_id,))
        if not row:
            return None
        return {
            "id": str(row["id"]),
            "name": row["name"],
            "description": row.get("description"),
            "project_id": str(row["project_id"]) if row["project_id"] else None,
            "workspace_id": str(row["workspace_id"]) if row.get("workspace_id") else None,
            "workspace_slug": row.get("workspace_slug"),
            "owned_by_id": str(row["owned_by_id"]) if row.get("owned_by_id") else None,
            "owner_name": row.get("owner_name"),
            "start_date": str(row["start_date"]) if row["start_date"] else None,
            "end_date": str(row["end_date"]) if row["end_date"] else None,
            "timezone": row.get("timezone"),
        }
    except Exception as e:
        log.error(f"Error fetching core cycle details for {cycle_id}: {e}")
        return None


async def get_cycle_summary_metrics(cycle_id: str) -> Optional[Dict[str, Any]]:
    """Return summary metrics for a cycle based on current membership (non-removed items)."""
    query = """
    WITH c AS (
        SELECT id, start_date::date AS start_date, end_date::date AS end_date
        FROM cycles
        WHERE id = $1 AND deleted_at IS NULL
    )
    SELECT
        COUNT(i.id)                                  AS total_issues,
        COALESCE(SUM(COALESCE(i.point, 0)), 0)      AS total_points,
        COUNT(*) FILTER (
            WHERE i.completed_at IS NOT NULL AND i.completed_at::date <= (SELECT end_date FROM c)
        )                                            AS completed_issues,
        COALESCE(SUM(CASE WHEN i.completed_at IS NOT NULL AND i.completed_at::date <= (SELECT end_date FROM c)
                          THEN COALESCE(i.point, 0) ELSE 0 END), 0) AS completed_points,
        COUNT(*) FILTER (
            WHERE i.completed_at IS NULL OR i.completed_at::date > (SELECT end_date FROM c)
        )                                            AS open_issues
    FROM cycle_issues ci
    JOIN c ON ci.cycle_id = c.id
    JOIN issues i ON i.id = ci.issue_id AND i.deleted_at IS NULL
    WHERE ci.deleted_at IS NULL
    """
    try:
        row = await PlaneDBPool.fetchrow(query, (cycle_id,))
        if not row:
            return None

        # Compute duration and throughput in Python for simplicity
        core = await get_cycle_core(cycle_id)
        duration_days: Optional[int] = None
        throughput_per_day: Optional[float] = None
        if core and core.get("start_date") and core.get("end_date"):
            try:
                start_date = datetime.fromisoformat(str(core["start_date"]))
                end_date = datetime.fromisoformat(str(core["end_date"]))
                duration_days = (end_date - start_date).days + 1
                if duration_days > 0:
                    throughput_per_day = (row["completed_issues"] or 0) / duration_days
            except Exception:
                pass

        # Determine is_current
        is_current = False
        try:
            if core and core.get("start_date") and core.get("end_date"):
                from datetime import date

                today = date.today()
                start_date_obj = date.fromisoformat(str(core["start_date"]))
                end_date_obj = date.fromisoformat(str(core["end_date"]))
                is_current = start_date_obj <= today <= end_date_obj
        except Exception:
            is_current = False

        return {
            "total_issues": int(row["total_issues"] or 0),
            "completed_issues": int(row["completed_issues"] or 0),
            "open_issues": int(row["open_issues"] or 0),
            "total_points": int(row["total_points"] or 0),
            "completed_points": int(row["completed_points"] or 0),
            "duration_days": duration_days,
            "throughput_per_day": throughput_per_day,
            "is_current": is_current,
        }
    except Exception as e:
        log.error(f"Error computing cycle summary for {cycle_id}: {e}")
        return None


async def get_cycle_breakdown_by_state(cycle_id: str) -> List[Dict[str, Any]]:
    query = """
    SELECT s."group" AS state_group,
           COUNT(i.id) AS issues,
           COALESCE(SUM(COALESCE(i.point, 0)), 0) AS points
    FROM cycle_issues ci
    JOIN issues i ON i.id = ci.issue_id AND i.deleted_at IS NULL
    LEFT JOIN states s ON s.id = i.state_id AND s.deleted_at IS NULL
    WHERE ci.cycle_id = $1 AND ci.deleted_at IS NULL
    GROUP BY s."group"
    ORDER BY s."group" NULLS LAST
    """
    try:
        rows = await PlaneDBPool.fetch(query, (cycle_id,))
        return [
            {
                "state_group": r["state_group"],
                "issues": int(r["issues"] or 0),
                "points": int(r["points"] or 0),
            }
            for r in rows
        ]
    except Exception as e:
        log.error(f"Error computing breakdown by state for cycle {cycle_id}: {e}")
        return []


async def get_cycle_breakdown_by_priority(cycle_id: str) -> List[Dict[str, Any]]:
    query = """
    SELECT i.priority, COUNT(i.id) AS issues, COALESCE(SUM(COALESCE(i.point, 0)), 0) AS points
    FROM cycle_issues ci
    JOIN issues i ON i.id = ci.issue_id AND i.deleted_at IS NULL
    WHERE ci.cycle_id = $1 AND ci.deleted_at IS NULL
    GROUP BY i.priority
    ORDER BY CASE i.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
    END
    """
    try:
        rows = await PlaneDBPool.fetch(query, (cycle_id,))
        return [
            {
                "priority": r["priority"],
                "issues": int(r["issues"] or 0),
                "points": int(r["points"] or 0),
            }
            for r in rows
        ]
    except Exception as e:
        log.error(f"Error computing breakdown by priority for cycle {cycle_id}: {e}")
        return []


async def get_cycle_breakdown_by_assignee(cycle_id: str) -> List[Dict[str, Any]]:
    query = """
    SELECT u.id AS assignee_id, u.display_name AS assignee_name,
           COUNT(i.id) AS issues,
           COALESCE(SUM(COALESCE(i.point, 0)), 0) AS points
    FROM cycle_issues ci
    JOIN issues i ON i.id = ci.issue_id AND i.deleted_at IS NULL
    JOIN issue_assignees ia ON ia.issue_id = i.id AND ia.deleted_at IS NULL
    JOIN users u ON u.id = ia.assignee_id AND u.is_active = TRUE AND u.is_bot = FALSE
    WHERE ci.cycle_id = $1 AND ci.deleted_at IS NULL
    GROUP BY u.id, u.display_name
    ORDER BY assignee_name
    LIMIT 100
    """
    try:
        rows = await PlaneDBPool.fetch(query, (cycle_id,))
        result = [
            {
                "assignee_id": str(r["assignee_id"]),
                "assignee_name": r["assignee_name"],
                "issues": int(r["issues"] or 0),
                "points": int(r["points"] or 0),
            }
            for r in rows
        ]
        log.info(f"get_cycle_breakdown_by_assignee for cycle {cycle_id}: returned {len(result)} assignees")
        return result
    except Exception as e:
        log.error(f"Error computing breakdown by assignee for cycle {cycle_id}: {e}")
        return []


async def get_cycle_breakdown_by_label(cycle_id: str) -> List[Dict[str, Any]]:
    query = """
    SELECT l.id AS label_id, l.name AS label_name,
           COUNT(DISTINCT i.id) AS issues,
           COALESCE(SUM(COALESCE(i.point, 0)), 0) AS points
    FROM cycle_issues ci
    JOIN issues i ON i.id = ci.issue_id AND i.deleted_at IS NULL
    JOIN issue_labels il ON il.issue_id = i.id AND il.deleted_at IS NULL
    JOIN labels l ON l.id = il.label_id AND l.deleted_at IS NULL
    WHERE ci.cycle_id = $1 AND ci.deleted_at IS NULL
    GROUP BY l.id, l.name
    ORDER BY label_name
    LIMIT 100
    """
    try:
        rows = await PlaneDBPool.fetch(query, (cycle_id,))
        return [
            {
                "label_id": str(r["label_id"]),
                "label_name": r["label_name"],
                "issues": int(r["issues"] or 0),
                "points": int(r["points"] or 0),
            }
            for r in rows
        ]
    except Exception as e:
        log.error(f"Error computing breakdown by label for cycle {cycle_id}: {e}")
        return []


async def get_cycle_breakdown_by_type(cycle_id: str) -> List[Dict[str, Any]]:
    """Return breakdown of issues by issue type (epic vs task vs bug, etc)."""
    query = """
    SELECT it.id AS type_id, it.name AS type_name, it.is_epic,
           COUNT(i.id) AS issues,
           COALESCE(SUM(COALESCE(i.point, 0)), 0) AS points
    FROM cycle_issues ci
    JOIN issues i ON i.id = ci.issue_id AND i.deleted_at IS NULL
    LEFT JOIN issue_types it ON it.id = i.type_id AND it.deleted_at IS NULL
    WHERE ci.cycle_id = $1 AND ci.deleted_at IS NULL
    GROUP BY it.id, it.name, it.is_epic
    ORDER BY it.is_epic DESC, it.name
    LIMIT 100
    """
    try:
        rows = await PlaneDBPool.fetch(query, (cycle_id,))
        return [
            {
                "type_id": str(r["type_id"]) if r.get("type_id") else None,
                "type_name": r.get("type_name"),
                "is_epic": bool(r.get("is_epic", False)),
                "issues": int(r["issues"] or 0),
                "points": int(r["points"] or 0),
            }
            for r in rows
        ]
    except Exception as e:
        log.error(f"Error computing breakdown by type for cycle {cycle_id}: {e}")
        return []


async def get_cycle_burndown(cycle_id: str, bucket: str = "day") -> List[Dict[str, Any]]:
    """Return a simple burndown timeseries per day or week."""
    date_trunc_unit = "day" if bucket not in {"day", "week"} else bucket
    query = f"""
    WITH c AS (
        SELECT id, start_date::date AS start_date, end_date::date AS end_date
        FROM cycles
        WHERE id = $1 AND deleted_at IS NULL AND archived_at IS NULL
    ), series AS (
        SELECT generate_series((SELECT start_date FROM c), (SELECT end_date FROM c), INTERVAL '1 day')::date AS d
    ), facts AS (
        SELECT i.id AS issue_id,
               COALESCE(i.point, 0) AS points,
               i.completed_at::date AS completed_date,
               ci.created_at::date AS added_date,
               ci.deleted_at::date AS removed_date
        FROM cycle_issues ci
        JOIN c ON c.id = ci.cycle_id
        JOIN issues i ON i.id = ci.issue_id AND i.deleted_at IS NULL
    )
    SELECT date_trunc('{date_trunc_unit}', s.d)::date AS bucket_date,
           -- Daily events
           COUNT(DISTINCT f.issue_id) FILTER (WHERE f.added_date = s.d) AS added,
           COUNT(DISTINCT f.issue_id) FILTER (WHERE f.removed_date = s.d) AS removed,
           COUNT(DISTINCT f.issue_id) FILTER (WHERE f.completed_date = s.d) AS completed_issues,
           COALESCE(SUM(f.points) FILTER (WHERE f.completed_date = s.d), 0) AS completed_points,
           -- Remaining at end of bucket_date (in scope, not removed, not completed)
           COUNT(DISTINCT f.issue_id) FILTER (
               WHERE f.added_date <= s.d
                 AND (f.removed_date IS NULL OR f.removed_date > s.d)
                 AND (f.completed_date IS NULL OR f.completed_date > s.d)
           ) AS remaining_issues,
           COALESCE(SUM(f.points) FILTER (
               WHERE f.added_date <= s.d
                 AND (f.removed_date IS NULL OR f.removed_date > s.d)
                 AND (f.completed_date IS NULL OR f.completed_date > s.d)
           ), 0) AS remaining_points
    FROM series s
    LEFT JOIN facts f ON TRUE
    GROUP BY bucket_date
    ORDER BY bucket_date
    """
    try:
        rows = await PlaneDBPool.fetch(query, (cycle_id,))
        return [
            {
                "date": str(r["bucket_date"]),
                "remaining_issues": int(r["remaining_issues"] or 0),
                "remaining_points": int(r["remaining_points"] or 0),
                "added": int(r["added"] or 0),
                "removed": int(r["removed"] or 0),
                "completed_issues": int(r["completed_issues"] or 0),
                "completed_points": int(r["completed_points"] or 0),
            }
            for r in rows
        ]
    except Exception as e:
        log.error(f"Error computing burndown for cycle {cycle_id}: {e}")
        return []


async def get_cycle_scope_change(cycle_id: str) -> Optional[Dict[str, Any]]:
    query = """
    WITH c AS (
        SELECT id, start_date::date AS start_date, end_date::date AS end_date
        FROM cycles
        WHERE id = $1 AND deleted_at IS NULL
    )
    SELECT
        -- Baseline: in cycle at start (added on/before start AND not removed before start)
        (SELECT COUNT(*)
         FROM cycle_issues ci
         JOIN c ON c.id = ci.cycle_id
         WHERE (ci.created_at::date IS NULL OR ci.created_at::date <= c.start_date)
           AND (ci.deleted_at::date IS NULL OR ci.deleted_at::date > c.start_date))  AS baseline_issues,
        (SELECT COUNT(*)
         FROM cycle_issues ci
         JOIN c ON c.id = ci.cycle_id
         WHERE ci.created_at::date BETWEEN c.start_date AND c.end_date) AS added_during_cycle,
        (SELECT COUNT(*)
         FROM cycle_issues ci
         JOIN c ON c.id = ci.cycle_id
         WHERE ci.deleted_at::date BETWEEN c.start_date AND c.end_date) AS removed_during_cycle
    """
    try:
        row = await PlaneDBPool.fetchrow(query, (cycle_id,))
        if not row:
            return None
        return {
            "baseline_issues": int(row["baseline_issues"] or 0),
            "added_during_cycle": int(row["added_during_cycle"] or 0),
            "removed_during_cycle": int(row["removed_during_cycle"] or 0),
            "net_scope_change": int(row["added_during_cycle"] or 0) - int(row["removed_during_cycle"] or 0),
        }
    except Exception as e:
        log.error(f"Error computing scope change for cycle {cycle_id}: {e}")
        return None


async def list_scope_added_issues(cycle_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """List work-items added to the cycle AFTER it started (cycle_issues.created_at between start and end).

    Returns list of issues with id, name, identifier, state_group, priority, created_at (when added to cycle).
    """
    query = """
    SELECT
        i.id,
        i.name,
        i.sequence_id,
        p.identifier AS project_identifier,
        i.priority,
        i.state_id,
        s."group" AS state_group,
        ci.created_at
    FROM cycle_issues ci
    JOIN cycles c ON c.id = ci.cycle_id AND c.deleted_at IS NULL AND c.archived_at IS NULL
    JOIN issues i ON i.id = ci.issue_id AND i.deleted_at IS NULL
    JOIN projects p ON p.id = i.project_id AND p.deleted_at IS NULL
    LEFT JOIN states s ON s.id = i.state_id AND s.deleted_at IS NULL
    WHERE ci.cycle_id = $1
      AND ci.deleted_at IS NULL
      AND ci.created_at::date BETWEEN c.start_date::date AND c.end_date::date
    ORDER BY ci.created_at DESC
    LIMIT $2
    """
    try:
        rows = await PlaneDBPool.fetch(query, (cycle_id, limit))
        results: List[Dict[str, Any]] = []
        for r in rows:
            identifier = None
            if r.get("project_identifier") and r.get("sequence_id"):
                identifier = f"{r["project_identifier"]}-{r["sequence_id"]}"
            results.append({
                "id": str(r["id"]),
                "name": r["name"],
                "identifier": identifier,
                "priority": r.get("priority"),
                "state_group": r.get("state_group"),
                "added_at": str(r["created_at"]) if r.get("created_at") else None,
            })
        return results
    except Exception as e:
        log.error(f"Error listing scope-added issues for cycle {cycle_id}: {e}")
        return []


async def list_scope_removed_issues(cycle_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """List work-items removed from the cycle DURING the cycle (cycle_issues.deleted_at between start and end).

    Returns list of issues with id, name, identifier, state_group, priority, removed_at (when removed from cycle).
    """
    query = """
    SELECT
        i.id,
        i.name,
        i.sequence_id,
        p.identifier AS project_identifier,
        i.priority,
        i.state_id,
        s."group" AS state_group,
        ci.deleted_at
    FROM cycle_issues ci
    JOIN cycles c ON c.id = ci.cycle_id AND c.deleted_at IS NULL AND c.archived_at IS NULL
    JOIN issues i ON i.id = ci.issue_id AND i.deleted_at IS NULL
    JOIN projects p ON p.id = i.project_id AND p.deleted_at IS NULL
    LEFT JOIN states s ON s.id = i.state_id AND s.deleted_at IS NULL
    WHERE ci.cycle_id = $1
      AND ci.deleted_at IS NOT NULL
      AND ci.deleted_at::date BETWEEN c.start_date::date AND c.end_date::date
    ORDER BY ci.deleted_at DESC
    LIMIT $2
    """
    try:
        rows = await PlaneDBPool.fetch(query, (cycle_id, limit))
        results: List[Dict[str, Any]] = []
        for r in rows:
            identifier = None
            if r.get("project_identifier") and r.get("sequence_id"):
                identifier = f"{r["project_identifier"]}-{r["sequence_id"]}"
            results.append({
                "id": str(r["id"]),
                "name": r["name"],
                "identifier": identifier,
                "priority": r.get("priority"),
                "state_group": r.get("state_group"),
                "removed_at": str(r["deleted_at"]) if r.get("deleted_at") else None,
            })
        return results
    except Exception as e:
        log.error(f"Error listing scope-removed issues for cycle {cycle_id}: {e}")
        return []


async def get_cycle_carryover(cycle_id: str) -> Optional[Dict[str, Any]]:
    query = """
    WITH c AS (
        SELECT id, end_date::date AS end_date
        FROM cycles
        WHERE id = $1 AND deleted_at IS NULL
    )
    SELECT
        COUNT(i.id) AS open_issues,
        COALESCE(SUM(COALESCE(i.point, 0)), 0) AS open_points
    FROM cycle_issues ci
    JOIN c ON c.id = ci.cycle_id
    JOIN issues i ON i.id = ci.issue_id AND i.deleted_at IS NULL
    WHERE ci.deleted_at IS NULL
      AND (i.completed_at IS NULL OR i.completed_at::date > c.end_date)
    """
    try:
        row = await PlaneDBPool.fetchrow(query, (cycle_id,))
        if not row:
            return None
        return {
            "open_issues": int(row["open_issues"] or 0),
            "open_points": int(row["open_points"] or 0),
        }
    except Exception as e:
        log.error(f"Error computing carryover for cycle {cycle_id}: {e}")
        return None


async def list_cycle_issues_filtered(
    cycle_id: str,
    filters: Optional[Dict[str, Any]] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """List issues currently in the cycle with optional filters and pagination.

    Supported filters: include_completed(bool), state_groups(list[str]), priority_in(list[str]),
    assignee_ids(list[str]), label_ids(list[str]), search_text(str), created_within_cycle_only(bool)
    """
    filters = filters or {}

    base = [
        'SELECT i.id, i.name, i.priority, i.point, i.state_id, s."group" AS state_group, i.completed_at, i.created_at, i.updated_at, '
        "i.sequence_id, p.identifier AS project_identifier",
        "FROM cycle_issues ci",
        "JOIN issues i ON i.id = ci.issue_id AND i.deleted_at IS NULL",
        "JOIN projects p ON p.id = i.project_id AND p.deleted_at IS NULL",
        "LEFT JOIN states s ON s.id = i.state_id AND s.deleted_at IS NULL",
    ]
    joins: List[str] = []
    where: List[str] = ["ci.cycle_id = $1", "ci.deleted_at IS NULL"]
    params: List[Any] = [cycle_id]
    param_index = 2

    # Optional filter for states group (states already joined in base)
    state_groups = filters.get("state_groups")
    if state_groups:
        placeholders = ", ".join([f"${param_index + idx}" for idx in range(len(state_groups))])
        where.append(f's."group" IN ({placeholders})')
        params.extend(state_groups)
        param_index += len(state_groups)

    # Optional join for assignee filter
    assignee_ids = filters.get("assignee_ids")
    if assignee_ids:
        joins.append("JOIN issue_assignees ia ON ia.issue_id = i.id AND ia.deleted_at IS NULL")
        placeholders = ", ".join([f"${param_index + idx}" for idx in range(len(assignee_ids))])
        where.append(f"ia.assignee_id IN ({placeholders})")
        params.extend(assignee_ids)
        param_index += len(assignee_ids)

    # Optional join for label filter
    label_ids = filters.get("label_ids")
    if label_ids:
        joins.append("JOIN issue_labels il ON il.issue_id = i.id AND il.deleted_at IS NULL")
        placeholders = ", ".join([f"${param_index + idx}" for idx in range(len(label_ids))])
        where.append(f"il.label_id IN ({placeholders})")
        params.extend(label_ids)
        param_index += len(label_ids)

    # Priority filter
    priority_in = filters.get("priority_in")
    if priority_in:
        placeholders = ", ".join([f"${param_index + idx}" for idx in range(len(priority_in))])
        where.append(f"i.priority IN ({placeholders})")
        params.extend(priority_in)
        param_index += len(priority_in)

    # Include/exclude completed
    include_completed = bool(filters.get("include_completed", False))
    if not include_completed:
        where.append("(i.completed_at IS NULL)")

    # Created within cycle only
    created_within_cycle_only = bool(filters.get("created_within_cycle_only", False))
    if created_within_cycle_only:
        joins.append("JOIN cycles c ON c.id = ci.cycle_id")
        where.append("i.created_at::date BETWEEN c.start_date::date AND c.end_date::date")

    # Search text
    search_text = filters.get("search_text")
    if search_text:
        where.append(f"i.name ILIKE ${param_index}")
        params.append(f"%{search_text}%")
        param_index += 1

    sql = "\n".join(
        base + joins + ["WHERE " + " AND ".join(where), "ORDER BY i.created_at DESC", f"LIMIT ${param_index}", f"OFFSET ${param_index + 1}"]
    )
    params.extend([limit, offset])

    try:
        rows = await PlaneDBPool.fetch(sql, tuple(params))
        results: List[Dict[str, Any]] = []
        for r in rows:
            # Build unique identifier (e.g., SOLO-123)
            identifier = None
            if r.get("project_identifier") and r.get("sequence_id"):
                identifier = f"{r["project_identifier"]}-{r["sequence_id"]}"
            results.append({
                "id": str(r["id"]),
                "name": r["name"],
                "identifier": identifier,
                "priority": r.get("priority"),
                "points": int(r.get("point") or 0),
                "state_id": str(r["state_id"]) if r.get("state_id") else None,
                "state_group": r.get("state_group"),
                "completed_at": str(r["completed_at"]) if r.get("completed_at") else None,
                "created_at": str(r.get("created_at")) if r.get("created_at") else None,
                "updated_at": str(r.get("updated_at")) if r.get("updated_at") else None,
            })
        return results
    except Exception as e:
        log.error(f"Error listing cycle issues for {cycle_id}: {e}. SQL: {sql}")
        return []


async def get_module_details_for_artifact(module_id: str) -> Optional[Dict[str, Any]]:
    """
    Get module details for artifact generation.

    Args:
        module_id: The ID of the module to fetch details for

    Returns:
        Dictionary with module details or None if not found
    """
    query = """
    SELECT
        m.id,
        m.name,
        m.description,
        m.start_date,
        m.target_date,
        m.status,
        m.project_id,
        p.name AS project,
        p.identifier AS project_identifier,
        u.display_name AS lead,
        array_remove(array_agg(DISTINCT u2.id) FILTER (WHERE u2.id IS NOT NULL), NULL) AS member_ids,
        array_remove(array_agg(DISTINCT u2.display_name) FILTER (WHERE u2.display_name IS NOT NULL), NULL) AS members
    FROM modules m
    LEFT JOIN projects p ON m.project_id = p.id AND p.deleted_at IS NULL
    LEFT JOIN users u ON m.lead_id = u.id AND u.is_active = true AND u.is_bot = false
    LEFT JOIN module_members mm ON m.id = mm.module_id AND mm.deleted_at IS NULL
    LEFT JOIN users u2 ON mm.member_id = u2.id AND u2.is_active = true AND u2.is_bot = false
    WHERE
        m.id = $1
        AND m.deleted_at IS NULL
    GROUP BY
        m.id, m.name, m.description, m.start_date, m.target_date, m.status, m.project_id, p.name, p.identifier, u.display_name;
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (module_id,))
        return dict(result) if result else None
    except Exception as e:
        log.error(f"Error fetching module details for {module_id}: {e}")
        return None


async def get_comment_details_for_artifact(comment_id: str) -> Optional[Dict[str, Any]]:
    """
    Get comment details for artifact generation.

    Args:
        comment_id: The ID of the comment to fetch details for

    Returns:
        Dictionary with comment details or None if not found
    """
    query = """
    SELECT
        i.id,
        i.name,
        i.description_stripped AS description,
        i.priority,
        i.start_date,
        i.target_date,
        i.project_id,
        p.name AS project_name,
        p.identifier || '-' || i.sequence_id::text AS identifier,
        ist.name AS state,
        ist.group AS state_group,
        i.state_id,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT c.id ORDER BY c.id), NULL::uuid)
            FROM cycle_issues ci
            JOIN cycles c ON ci.cycle_id = c.id AND c.deleted_at IS NULL
            WHERE ci.issue_id = i.id AND ci.deleted_at IS NULL
        ), ARRAY[]::uuid[]
        ) AS cycle_ids,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT c.name ORDER BY c.name), NULL::text)
            FROM cycle_issues ci
            JOIN cycles c ON ci.cycle_id = c.id AND c.deleted_at IS NULL
            WHERE ci.issue_id = i.id AND ci.deleted_at IS NULL
        ), ARRAY[]::text[]
        ) AS cycles,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT m.id ORDER BY m.id), NULL::uuid)
            FROM module_issues mi
            JOIN modules m ON mi.module_id = m.id AND m.deleted_at IS NULL
            WHERE mi.issue_id = i.id AND mi.deleted_at IS NULL
        ), ARRAY[]::uuid[]
        ) AS module_ids,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT m.name ORDER BY m.name), NULL::text)
            FROM module_issues mi
            JOIN modules m ON mi.module_id = m.id AND m.deleted_at IS NULL
            WHERE mi.issue_id = i.id AND mi.deleted_at IS NULL
        ), ARRAY[]::text[]
        ) AS modules,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT u.id ORDER BY u.id), NULL::uuid)
            FROM issue_assignees ia
            JOIN users u ON ia.assignee_id = u.id AND u.is_active = true AND u.is_bot = false
            WHERE ia.issue_id = i.id AND ia.deleted_at IS NULL
        ), ARRAY[]::uuid[]
        ) AS assignee_ids,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT u.display_name ORDER BY u.display_name), NULL::text)
            FROM issue_assignees ia
            JOIN users u ON ia.assignee_id = u.id AND u.is_active = true AND u.is_bot = false
            WHERE ia.issue_id = i.id AND ia.deleted_at IS NULL
        ), ARRAY[]::text[]
        ) AS assignees,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT l.id ORDER BY l.id), NULL::uuid)
            FROM issue_labels il
            JOIN labels l ON il.label_id = l.id AND l.deleted_at IS NULL
            WHERE il.issue_id = i.id AND il.deleted_at IS NULL
        ), ARRAY[]::uuid[]
        ) AS label_ids,
        COALESCE(
        (
            SELECT array_remove(array_agg(DISTINCT l.name ORDER BY l.name), NULL::text)
            FROM issue_labels il
            JOIN labels l ON il.label_id = l.id AND l.deleted_at IS NULL
            WHERE il.issue_id = i.id AND il.deleted_at IS NULL
        ), ARRAY[]::text[]
        ) AS labels,
        parent_i.name AS parent,
        i.parent_id,
        (
        SELECT json_agg(
                json_build_object(
                    'id', ic.id,
                    'comment', ic.comment_stripped,
                    'actor_id', ic.actor_id,
                    'actor', u.display_name,
                    'created_at', ic.created_at,
                    'updated_at', ic.updated_at
                )
                ORDER BY ic.created_at
                )
        FROM issue_comments ic
        LEFT JOIN users u ON ic.actor_id = u.id AND u.is_active = true
        WHERE ic.issue_id = i.id AND ic.deleted_at IS NULL
        ) AS comments
    FROM issues i
    LEFT JOIN projects p ON i.project_id = p.id AND p.deleted_at IS NULL
    LEFT JOIN states ist ON i.state_id = ist.id AND ist.deleted_at IS NULL
    LEFT JOIN issues parent_i ON i.parent_id = parent_i.id AND parent_i.deleted_at IS NULL
    WHERE i.id = $1
    AND i.deleted_at IS NULL;
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (comment_id,))
        return dict(result) if result else None
    except Exception as e:
        log.error(f"Error fetching comment details for {comment_id}: {e}")
        return None


async def get_page_details_for_artifact(page_id: str) -> Optional[Dict[str, Any]]:
    """
    Get page details for artifact generation.

    Args:
        page_id: The ID of the page to fetch details for

    Returns:
        Dictionary with page details or None if not found
    """
    query = """
    SELECT
        p.id,
        p.name,
        p.description_stripped,
        p.access,
        p.workspace_id,
        p.owned_by_id,
        p.parent_id,
        p.is_global,
        p.is_locked,
        p.logo_props,
        p.view_props,
        u.display_name AS owned_by,
        proj.id AS project_id,
        proj.identifier AS project_identifier
    FROM pages p
    LEFT JOIN users u ON p.owned_by_id = u.id AND u.is_active = true AND u.is_bot = false
    LEFT JOIN projects proj ON p.workspace_id = proj.workspace_id
    WHERE
        p.id = $1
        AND p.deleted_at IS NULL
    LIMIT 1;
    """

    try:
        result = await PlaneDBPool.fetchrow(query, (page_id,))
        return dict(result) if result else None
    except Exception as e:
        log.error(f"Error fetching page details for {page_id}: {e}")
        return None


async def get_state_details_for_artifact(state_id: str) -> Optional[Dict[str, Any]]:
    """
    Get state details for artifact generation.

    Args:
        state_id: The ID of the state to fetch details for

    Returns:
        Dictionary with state details or None if not found
    """
    query = """
    SELECT
        s.id,
        s.name,
        s.description,
        s.project_id,
        s.group,
        s.sequence,
        s.default,
        s.is_triage,
        p.identifier AS project_identifier
    FROM states s
    LEFT JOIN projects p ON s.project_id = p.id AND p.deleted_at IS NULL
    WHERE s.id = $1 AND s.deleted_at IS NULL
    """
    try:
        result = await PlaneDBPool.fetchrow(query, (state_id,))
        return dict(result) if result else None
    except Exception as e:
        log.error(f"Error fetching state details for {state_id}: {e}")
        return None


async def get_label_details_for_artifact(label_id: str) -> Optional[Dict[str, Any]]:
    """
    Get label details for artifact generation.

    Args:
        label_id: The ID of the label to fetch details for

    Returns:
        Dictionary with label details or None if not found
    """
    query = """
    SELECT
        l.id,
        l.name,
        l.project_id,
        l.description,
        l.workspace_id,
        l.parent_id,
        p.identifier AS project_identifier
    FROM labels l
    LEFT JOIN projects p ON l.project_id = p.id AND p.deleted_at IS NULL
    WHERE l.id = $1 AND l.deleted_at IS NULL
    """
    try:
        result = await PlaneDBPool.fetchrow(query, (label_id,))
        return dict(result) if result else None
    except Exception as e:
        log.error(f"Error fetching label details for {label_id}: {e}")
        return None
