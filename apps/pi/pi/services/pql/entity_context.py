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

"""Workspace/project entity context for PQL translation.

Provides two capabilities:
1. **Pre-LLM context** — fetch entities and format them as a prompt section so the
   LLM can use correct UUIDs.
2. **Post-LLM placeholder resolution** — resolve ``<<field:name>>`` placeholders the
   LLM emits when it cannot find a UUID in the provided context.
"""

from __future__ import annotations

import asyncio
import re
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple

from pi import logger
from pi.app.api.v1.helpers.plane_sql_queries import search_cycle_by_name
from pi.app.api.v1.helpers.plane_sql_queries import search_label_by_name
from pi.app.api.v1.helpers.plane_sql_queries import search_module_by_name
from pi.app.api.v1.helpers.plane_sql_queries import search_project_by_name
from pi.app.api.v1.helpers.plane_sql_queries import search_state_by_name
from pi.app.api.v1.helpers.plane_sql_queries import search_type_by_name
from pi.app.api.v1.helpers.plane_sql_queries import search_user_by_name
from pi.core.db.plane import PlaneDBPool

log = logger.getChild(__name__)

PLACEHOLDER_RE = re.compile(r"<<(\w+):(.+?)>>")

# PQL field → entity type label used in the entities response map
FIELD_TO_ENTITY_TYPE = {
    "state": "state",
    "assignee": "user",
    "label": "label",
    "cycle": "cycle",
    "module": "module",
    "project": "project",
    "createdBy": "user",
    "type": "type",
    "milestone": "milestone",
    "mention": "user",
    "subscriber": "user",
    "teamspaceProject": "project",
}


# ---------------------------------------------------------------------------
# Pre-LLM: fetch workspace/project entities and format as prompt context
# ---------------------------------------------------------------------------


async def _fetch_members(workspace_slug: str, project_id: Optional[str]) -> List[Dict[str, Any]]:
    scope = "AND pm.project_id = $2" if project_id else ""
    params: tuple = (workspace_slug, project_id) if project_id else (workspace_slug,)
    query = f"""
    SELECT DISTINCT u.id, u.display_name
    FROM workspace_members wm
    JOIN users u ON wm.member_id = u.id
    JOIN workspaces w ON wm.workspace_id = w.id
    {"JOIN project_members pm ON pm.member_id = u.id" if project_id else ""}
        WHERE w.slug = $1
            AND wm.deleted_at IS NULL
            AND wm.is_active = true
            AND u.is_active = true
            AND u.is_bot = false
        {scope}
        {"AND pm.deleted_at IS NULL AND pm.is_active = true" if project_id else ""}
    ORDER BY u.display_name
    LIMIT 50
    """
    try:
        return await PlaneDBPool.fetch(query, params) or []
    except Exception as e:
        log.warning("[PQL] Failed to fetch members: %s", e)
        return []


async def _fetch_cycles(workspace_slug: str, project_id: Optional[str]) -> List[Dict[str, Any]]:
    scope = "AND c.project_id = $2" if project_id else ""
    params: tuple = (workspace_slug, project_id) if project_id else (workspace_slug,)
    query = f"""
    SELECT c.id, c.name
    FROM cycles c
    JOIN projects p ON c.project_id = p.id
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.slug = $1 AND c.deleted_at IS NULL
    {scope}
    ORDER BY c.start_date DESC NULLS LAST
    LIMIT 20
    """
    try:
        return await PlaneDBPool.fetch(query, params) or []
    except Exception as e:
        log.warning("[PQL] Failed to fetch cycles: %s", e)
        return []


async def _fetch_states(workspace_slug: str, project_id: Optional[str]) -> List[Dict[str, Any]]:
    scope = "AND s.project_id = $2" if project_id else ""
    params: tuple = (workspace_slug, project_id) if project_id else (workspace_slug,)
    query = f"""
    SELECT DISTINCT s.id, s.name, s."group"
    FROM states s
    JOIN projects p ON s.project_id = p.id
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.slug = $1 AND s.deleted_at IS NULL
    {scope}
    ORDER BY s.name
    LIMIT 30
    """
    try:
        return await PlaneDBPool.fetch(query, params) or []
    except Exception as e:
        log.warning("[PQL] Failed to fetch states: %s", e)
        return []


async def _fetch_labels(workspace_slug: str, project_id: Optional[str]) -> List[Dict[str, Any]]:
    scope = "AND l.project_id = $2" if project_id else ""
    params: tuple = (workspace_slug, project_id) if project_id else (workspace_slug,)
    query = f"""
    SELECT DISTINCT l.id, l.name
    FROM labels l
    JOIN projects p ON l.project_id = p.id
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.slug = $1 AND l.deleted_at IS NULL
    {scope}
    ORDER BY l.name
    LIMIT 30
    """
    try:
        return await PlaneDBPool.fetch(query, params) or []
    except Exception as e:
        log.warning("[PQL] Failed to fetch labels: %s", e)
        return []


async def _fetch_modules(workspace_slug: str, project_id: Optional[str]) -> List[Dict[str, Any]]:
    scope = "AND m.project_id = $2" if project_id else ""
    params: tuple = (workspace_slug, project_id) if project_id else (workspace_slug,)
    query = f"""
    SELECT m.id, m.name
    FROM modules m
    JOIN projects p ON m.project_id = p.id
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.slug = $1 AND m.deleted_at IS NULL
    {scope}
    ORDER BY m.name
    LIMIT 20
    """
    try:
        return await PlaneDBPool.fetch(query, params) or []
    except Exception as e:
        log.warning("[PQL] Failed to fetch modules: %s", e)
        return []


async def _fetch_projects(workspace_slug: str, project_id: Optional[str]) -> List[Dict[str, Any]]:
    params: tuple = (workspace_slug,)
    query = """
    SELECT p.id, p.name, p.identifier
    FROM projects p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.slug = $1 AND p.deleted_at IS NULL AND p.archived_at IS NULL
    ORDER BY p.name
    LIMIT 20
    """
    try:
        return await PlaneDBPool.fetch(query, params) or []
    except Exception as e:
        log.warning("[PQL] Failed to fetch projects: %s", e)
        return []


async def _fetch_types(workspace_slug: str, project_id: Optional[str]) -> List[Dict[str, Any]]:
    scope = "AND pit.project_id = $2" if project_id else ""
    params: tuple = (workspace_slug, project_id) if project_id else (workspace_slug,)
    query = f"""
    SELECT DISTINCT it.id, it.name
    FROM issue_types it
    JOIN project_issue_types pit ON it.id = pit.issue_type_id
    JOIN projects p ON pit.project_id = p.id
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.slug = $1 AND it.deleted_at IS NULL AND pit.deleted_at IS NULL
    {scope}
    ORDER BY it.name
    LIMIT 20
    """
    try:
        return await PlaneDBPool.fetch(query, params) or []
    except Exception as e:
        log.warning("[PQL] Failed to fetch issue types: %s", e)
        return []


async def _fetch_milestones(workspace_slug: str, project_id: Optional[str]) -> List[Dict[str, Any]]:
    scope = "AND ms.project_id = $2" if project_id else ""
    params: tuple = (workspace_slug, project_id) if project_id else (workspace_slug,)
    query = f"""
    SELECT ms.id, ms.title
    FROM milestones ms
    JOIN projects p ON ms.project_id = p.id
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.slug = $1 AND ms.deleted_at IS NULL AND ms.archived_at IS NULL
    {scope}
    ORDER BY ms.target_date DESC NULLS LAST
    LIMIT 20
    """
    try:
        return await PlaneDBPool.fetch(query, params) or []
    except Exception as e:
        log.warning("[PQL] Failed to fetch milestones: %s", e)
        return []


def _format_rows(rows: List[Dict[str, Any]], name_key: str = "name") -> str:
    """Format entity rows as  Name = "uuid", ...  for the prompt."""
    return ", ".join(f'{r[name_key]} = "{r["id"]}"' for r in rows if r.get(name_key))


async def fetch_entity_context(
    workspace_slug: str,
    project_id: Optional[str] = None,
) -> Tuple[str, Dict[str, Dict[str, str]]]:
    """Fetch workspace/project entities and return (prompt_section, entities_map).

    The prompt_section is appended to the LLM system prompt.
    The entities_map is keyed by UUID → {"type": ..., "name": ...} for the API response.
    """
    members, cycles, states, labels, modules, projects, types, milestones = await asyncio.gather(
        _fetch_members(workspace_slug, project_id),
        _fetch_cycles(workspace_slug, project_id),
        _fetch_states(workspace_slug, project_id),
        _fetch_labels(workspace_slug, project_id),
        _fetch_modules(workspace_slug, project_id),
        _fetch_projects(workspace_slug, project_id),
        _fetch_types(workspace_slug, project_id),
        _fetch_milestones(workspace_slug, project_id),
    )

    entities_map: Dict[str, Dict[str, str]] = {}
    for r in members:
        entities_map[str(r["id"])] = {"type": "user", "name": r["display_name"]}
    for r in cycles:
        entities_map[str(r["id"])] = {"type": "cycle", "name": r["name"]}
    for r in states:
        entities_map[str(r["id"])] = {"type": "state", "name": r["name"]}
    for r in labels:
        entities_map[str(r["id"])] = {"type": "label", "name": r["name"]}
    for r in modules:
        entities_map[str(r["id"])] = {"type": "module", "name": r["name"]}
    for r in projects:
        entities_map[str(r["id"])] = {"type": "project", "name": r["name"]}
    for r in types:
        entities_map[str(r["id"])] = {"type": "type", "name": r["name"]}
    for r in milestones:
        entities_map[str(r["id"])] = {"type": "milestone", "name": r["title"]}

    scope_label = f"project {project_id}" if project_id else f"workspace {workspace_slug}"
    log.debug(
        "[PQL] Fetched entity context for %s — %d members, %d cycles, %d states, %d labels, %d modules, %d projects, %d types, %d milestones",
        scope_label,
        len(members),
        len(cycles),
        len(states),
        len(labels),
        len(modules),
        len(projects),
        len(types),
        len(milestones),
    )

    sections = []
    if members:
        sections.append(f"Members: {_format_rows(members, 'display_name')}")
    if cycles:
        sections.append(f"Cycles: {_format_rows(cycles)}")
    if states:
        sections.append(f"States: {_format_rows(states)}")
    if labels:
        sections.append(f"Labels: {_format_rows(labels)}")
    if modules:
        sections.append(f"Modules: {_format_rows(modules)}")
    if projects:
        sections.append(f"Projects: {_format_rows(projects)}")
    if types:
        sections.append(f"Issue Types: {_format_rows(types)}")
    if milestones:
        sections.append(f"Milestones: {_format_rows(milestones, 'title')}")

    if not sections:
        return "", entities_map

    prompt_section = "\n\n## Available Workspace Entities\nUse these UUIDs when the user refers to these entities by name.\n\n"
    prompt_section += "\n".join(sections)

    return prompt_section, entities_map


# ---------------------------------------------------------------------------
# Post-LLM: resolve <<field:name>> placeholders via DB search
# ---------------------------------------------------------------------------


async def _search_milestone_by_name(
    name: str,
    workspace_slug: Optional[str] = None,
    project_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Search for a milestone by title (the milestones table uses 'title', not 'name')."""
    query = """
    SELECT ms.id, ms.title, ms.project_id
    FROM milestones ms
    JOIN projects p ON ms.project_id = p.id
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE ms.title ILIKE $1
    AND ms.deleted_at IS NULL AND ms.archived_at IS NULL
    """
    params: list = [f"%{name}%"]
    idx = 2
    if project_id:
        query += f" AND ms.project_id = ${idx}"
        params.append(project_id)
        idx += 1
    if workspace_slug:
        query += f" AND w.slug = ${idx}"
        params.append(workspace_slug)
    query += " LIMIT 1"
    try:
        result = await PlaneDBPool.fetchrow(query, tuple(params))
        if result:
            return {"id": str(result["id"]), "name": result["title"], "project_id": str(result["project_id"])}
        return None
    except Exception as e:
        log.warning("[PQL] Milestone search failed for %r: %s", name, e)
        return None


async def _resolve_single(
    field: str,
    name: str,
    workspace_slug: Optional[str],
    project_id: Optional[str],
) -> Optional[Dict[str, Any]]:
    """Resolve a single placeholder to an entity dict with at least 'id' and 'name'."""
    kwargs: Dict[str, Any] = {"workspace_slug": workspace_slug}
    if project_id:
        kwargs["project_id"] = project_id

    try:
        if field in ("assignee", "createdBy", "mention", "subscriber"):
            results = await search_user_by_name(display_name=name, **kwargs)
            return results[0] if results else None
        elif field == "cycle":
            return await search_cycle_by_name(name, **kwargs)
        elif field == "state":
            return await search_state_by_name(name, **kwargs)
        elif field == "label":
            return await search_label_by_name(name, **kwargs)
        elif field == "module":
            return await search_module_by_name(name, **kwargs)
        elif field in ("project", "teamspaceProject"):
            project_results = await search_project_by_name(name, workspace_slug=workspace_slug)
            return project_results[0] if project_results else None
        elif field == "type":
            return await search_type_by_name(name, **kwargs)
        elif field == "milestone":
            return await _search_milestone_by_name(name, workspace_slug, project_id)
        else:
            log.debug("[PQL] No search handler for placeholder field %r", field)
            return None
    except Exception as e:
        log.warning("[PQL] Placeholder resolution failed for <<%s:%s>>: %s", field, name, e)
        return None


async def resolve_placeholders(
    pql: str,
    workspace_slug: Optional[str] = None,
    project_id: Optional[str] = None,
) -> Tuple[str, Dict[str, Dict[str, str]]]:
    """Find all ``<<field:name>>`` placeholders in *pql*, resolve them via DB, and return
    (resolved_pql, resolved_entities).

    Unresolvable placeholders are replaced with ``"<UNRESOLVED:name>"`` so the PQL
    syntax validator rejects them cleanly rather than passing through garbage.
    """
    matches = list(PLACEHOLDER_RE.finditer(pql))
    if not matches:
        return pql, {}

    log.info("[PQL] Resolving %d placeholder(s) in PQL", len(matches))

    resolutions = await asyncio.gather(*[_resolve_single(m.group(1), m.group(2), workspace_slug, project_id) for m in matches])

    resolved_entities: Dict[str, Dict[str, str]] = {}
    resolved_pql = pql

    for match, result in zip(reversed(matches), reversed(resolutions)):
        field = match.group(1)
        name = match.group(2)
        if result and result.get("id"):
            uuid = str(result["id"])
            display = result.get("display_name") or result.get("name") or name
            entity_type = FIELD_TO_ENTITY_TYPE.get(field, field)
            resolved_entities[uuid] = {"type": entity_type, "name": display}
            replacement = f'"{uuid}"'
            log.debug("[PQL] Resolved <<%s:%s>> → %s (%s)", field, name, uuid, display)
        else:
            replacement = f'"<UNRESOLVED:{name}>"'
            log.warning("[PQL] Could not resolve <<%s:%s>>", field, name)
        resolved_pql = resolved_pql[: match.start()] + replacement + resolved_pql[match.end() :]

    return resolved_pql, resolved_entities
