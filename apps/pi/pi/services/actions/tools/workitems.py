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
Work Items API tools for Plane issue/task management operations.

MIGRATED TO AUTO-GENERATED TOOLS
Tool metadata defined in this file. Custom pre/post handlers for complex logic.
Special handling includes: state/type resolution, epic type injection, identifier enrichment, relation validation.
Old manual definitions kept below for comparison/rollback safety.
"""

import logging
import uuid
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple

from pi.services.actions.tool_generator import generate_tools_for_category
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tool_metadata import ToolParameter
from pi.services.chat.helpers.tool_utils import generate_success_message

log = logging.getLogger(__name__)

# Issue relation types as per Plane SDK documentation
RELATION_TYPES = {
    "blocking": "blocking",
    "blocked_by": "blocked_by",
    "duplicate": "duplicate",
    "relates_to": "relates_to",
    "start_before": "start_before",
    "start_after": "start_after",
    "finish_before": "finish_before",
    "finish_after": "finish_after",
}

STATE_GROUP_FALLBACKS: Dict[str, Tuple[str, ...]] = {
    "backlog": ("backlog",),
    "to do": ("unstarted", "backlog"),
    "todo": ("unstarted", "backlog"),
    "to-do": ("unstarted", "backlog"),
    "not started": ("unstarted",),
    "not-started": ("unstarted",),
    "unstarted": ("unstarted",),
    "in progress": ("started",),
    "in-progress": ("started",),
    "doing": ("started",),
    "started": ("started",),
    "done": ("completed",),
    "complete": ("completed",),
    "completed": ("completed",),
    "cancelled": ("cancelled",),
    "canceled": ("cancelled",),
}


# ============================================================================
# HELPER FUNCTIONS (Preserved from original)
# ============================================================================


async def resolve_state_to_uuid(state: Optional[str], project_id: Optional[str], workspace_slug: Optional[str] = None) -> Optional[str]:
    """
    Resolve state name to UUID with enhanced matching strategy.

    Args:
        state: State name or UUID
        project_id: Project ID for state resolution and default fallback
        workspace_slug: Optional workspace slug for filtering

    Returns:
        State UUID if resolved, None if state should use project default
    """
    if not state:
        return None

    normalized_state = " ".join(str(state).strip().lower().split())

    # Check if state is already a valid UUID
    try:
        uuid.UUID(state)
        return state
    except (ValueError, TypeError):
        log.debug(f"State '{state}' is not a UUID, will resolve as name")

    # Only attempt resolution if we have a project_id
    if not project_id:
        log.warning(f"Cannot resolve state '{state}' without project_id")
        return None

    try:
        from pi.app.api.v1.helpers.plane_sql_queries import search_state_by_group
        from pi.app.api.v1.helpers.plane_sql_queries import search_state_by_name

        state_result = await search_state_by_name(normalized_state, project_id, workspace_slug, raise_on_error=True)

        if state_result and "id" in state_result:
            return state_result["id"]

        for state_group in STATE_GROUP_FALLBACKS.get(normalized_state, ()):
            fallback_result = await search_state_by_group(state_group, project_id, workspace_slug, raise_on_error=True)
            if fallback_result and "id" in fallback_result:
                log.info(
                    "Resolved state intent '%s' to project state '%s' via group '%s'",
                    state,
                    fallback_result.get("name"),
                    state_group,
                )
                return fallback_result["id"]

        return None

    except Exception as e:
        log.error(f"Error resolving state '{state}': {e}")
        return None


async def resolve_type_to_uuid(type_id: Optional[str], project_id: Optional[str], workspace_slug: Optional[str] = None) -> Optional[str]:
    """
    Resolve issue type name to UUID with enhanced matching strategy.

    Args:
        type_id: Type name or UUID
        project_id: Project ID for type resolution
        workspace_slug: Optional workspace slug for filtering

    Returns:
        Type UUID if resolved, None if type should use project default or if resolution fails
    """
    if not type_id:
        return None

    # Check if type_id is already a valid UUID
    try:
        uuid.UUID(type_id)
        return type_id
    except (ValueError, TypeError):
        log.debug(f"Type '{type_id}' is not a UUID, will resolve as name")

    # Only attempt resolution if we have a project_id
    if not project_id:
        log.warning(f"Cannot resolve type '{type_id}' without project_id")
        return None

    try:
        from pi.app.api.v1.helpers.plane_sql_queries import search_type_by_name

        type_result = await search_type_by_name(type_id, project_id, workspace_slug)

        if type_result and "id" in type_result:
            resolved_uuid = type_result["id"]
            log.info(f"Resolved type '{type_id}' to UUID {resolved_uuid}")
            return resolved_uuid
        else:
            log.warning(f"Could not resolve type '{type_id}' to a valid UUID")
            return None

    except Exception as e:
        log.error(f"Error resolving type '{type_id}': {e}")
        return None


async def get_epic_type_id(method_executor, project_id: str, workspace_slug: str) -> Optional[str]:
    """Get the epic issue type ID for a project using direct SQL query.

    Args:
        method_executor: The method executor instance (unused, kept for compatibility)
        project_id: Project UUID
        workspace_slug: Workspace slug (unused, kept for compatibility)

    Returns:
        Epic type ID if found, None otherwise
    """
    try:
        # Import the SQL query function
        from pi.app.api.v1.helpers.plane_sql_queries import get_epic_type_id_for_project

        # Use direct SQL query instead of SDK method for better reliability
        epic_type_id = await get_epic_type_id_for_project(project_id)

        if epic_type_id:
            log.info(f"Found epic type ID {epic_type_id} for project {project_id}")
            return epic_type_id
        else:
            log.warning(f"No epic issue type found for project {project_id}")
            return None

    except Exception as e:
        log.error(f"Failed to get epic type ID for project {project_id}: {str(e)}")
        return None


# ============================================================================
# WORKITEMS-SPECIFIC HANDLER FUNCTIONS
# ============================================================================


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


async def fetch_available_types_for_project(method_executor, project_id: str, workspace_slug: str) -> Optional[str]:
    """Fetch available work item types for a project and format them for LLM consumption.

    This helper is used to enrich tool descriptions with project-specific type information
    during tool generation (at planning time), making types visible to the LLM.

    Args:
        method_executor: The method executor to call types API
        project_id: Project UUID
        workspace_slug: Workspace slug

    Returns:
        Formatted string of available types, or None if fetch fails
        Example: "- Bug (ID: 6e8fbc42...): Defects and regressions\\n- Feature (ID: 104eb637...): New functionality"
    """
    if not project_id or not workspace_slug or not method_executor:
        return None

    try:
        result = await method_executor.execute(
            "types",
            "list",
            project_id=project_id,
            workspace_slug=workspace_slug,
        )

        if not result or not result.get("success"):
            return None

        results = result.get("data", {}).get("results", [])
        if not results:
            return None

        # Build a human-readable list of types
        type_lines = []
        for t in results[:10]:  # Limit to 10 types to avoid overwhelming the description
            type_name = t.get("name", "Unknown")
            type_id = t.get("id", "")
            type_desc = t.get("description", "")

            # Format: "- Bug (ID: 6e8fbc42-2c07-4880-9b65-d3ef8258b784): For defects and issues"
            line = f"- {type_name}"
            if type_id:
                line += f" (ID: {type_id})"  # Full UUID so LLM can use it directly in tool args
            if type_desc:
                line += f": {type_desc[:80]}"  # Limit description length
            type_lines.append(line)

        if type_lines:
            formatted = "\\n".join(type_lines)
            log.info(f"Fetched {len(results)} types for project {project_id}")
            return formatted

    except Exception as e:
        log.warning(f"Failed to fetch types for project {project_id}: {e}")

    return None


def _sync_fetch_types(method_executor, project_id: str, workspace_slug: str) -> Optional[str]:
    """Synchronous wrapper to fetch types from async function.

    Bridges the sync/async boundary by running the async fetch function in the event loop.
    """
    import asyncio

    try:
        # Check if there's a running event loop
        try:
            asyncio.get_running_loop()
            # We're in a running async context - create a task and wait for it
            # Using asyncio.ensure_future + loop methods to avoid blocking
            import concurrent.futures

            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, fetch_available_types_for_project(method_executor, project_id, workspace_slug))
                return future.result(timeout=5)  # 5 second timeout
        except RuntimeError:
            # No running loop - safe to use asyncio.run()
            return asyncio.run(fetch_available_types_for_project(method_executor, project_id, workspace_slug))
    except Exception as e:
        log.warning(f"Failed to fetch types for project {project_id}: {e}")
        return None


def _enrich_type_id_descriptions(tool_definitions: Dict[str, "ToolMetadata"], types_text: str) -> None:
    """Inject available types into type_id parameter descriptions.

    Modifies tool definitions in-place to add project-specific type information.
    """
    create_desc = (
        f"Work item type to categorize this work item. Available types in this project:\\n{types_text}\\n"
        f"Provide the full type ID (UUID) from the list above. If not specified, project's default type will be used."
    )

    update_desc = (
        f"New work item type to categorize this work item. Available types in this project:\\n{types_text}\\n"
        f"Provide the full type ID (UUID) from the list above."
    )

    # Update create tool
    if "create" in tool_definitions:
        for param in tool_definitions["create"].parameters:
            if param.name == "type_id":
                param.description = create_desc
                break

    # Update update tool
    if "update" in tool_definitions:
        for param in tool_definitions["update"].parameters:
            if param.name == "type_id":
                param.description = update_desc
                break


# ============================================================================
# PRE/POST HANDLERS
# ============================================================================


async def _workitems_pre_handler(
    metadata: ToolMetadata,
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    category: str,
    method_key: str,
    method_executor: Any = None,
) -> Dict[str, Any]:
    """Pre-processing handler for workitems tools.

    Handles:
    - create/update/list: state and type resolution
    - create_epic: epic type injection
    - create_relation: relation type validation
    """
    tool_name = metadata.name
    project_id = kwargs.get("project_id")
    workspace_slug = kwargs.get("workspace_slug") or context.get("workspace_slug")

    # Handle epic tools: inject epic type_id
    if tool_name == "create_epic":
        if not project_id:
            raise ValueError("Project ID is required for epic creation. Please specify a project.")

        epic_type_id = await get_epic_type_id(method_executor, str(project_id), str(workspace_slug or ""))
        if not epic_type_id:
            raise ValueError("Could not find epic issue type for this project. Please ensure an epic issue type exists.")

        kwargs["type_id"] = epic_type_id
        log.debug(f"Injected epic type_id {epic_type_id} for create_epic")

    # State resolution for create/update/list/epic tools
    if tool_name in ["workitems_create", "workitems_update", "workitems_list", "create_epic", "update_epic"]:
        state = kwargs.get("state")
        if state:
            resolved_state = await resolve_state_to_uuid(state, project_id, workspace_slug)
            if resolved_state:
                kwargs["state"] = resolved_state
                log.debug(f"Resolved state '{state}' to {resolved_state}")
            else:
                if not project_id:
                    raise ValueError(f"Project ID is required to resolve state '{state}'.")
                raise ValueError(f"Could not resolve state '{state}' for this project. " "Please use an existing state name or UUID.")

    # Type resolution for create/update (but NOT epics which handle it themselves)
    if tool_name in ["workitems_create", "workitems_update"]:
        type_id = kwargs.get("type_id")
        if type_id:
            resolved_type_id = await resolve_type_to_uuid(type_id, project_id, workspace_slug)
            if resolved_type_id:
                kwargs["type_id"] = resolved_type_id
                log.debug(f"Resolved type_id '{type_id}' to {resolved_type_id}")

    # Relation type validation for create_relation
    if tool_name == "workitems_create_relation":
        relation_type = kwargs.get("relation_type")
        if not relation_type:
            raise ValueError(
                "Relation type is required.\n"
                "Please specify one of: blocking, blocked_by, duplicate, relates_to, start_before, start_after, finish_before, finish_after"
            )

        if relation_type not in RELATION_TYPES:
            valid_types = ", ".join(RELATION_TYPES.keys())
            raise ValueError(f"Relation type '{relation_type}' is not valid. Valid types are: {valid_types}")

        issues = kwargs.get("issues")
        if not issues:
            raise ValueError("At least one related issue ID must be provided in the 'issues' parameter")

    # Auto-resolve context from issue_id for retrieve/delete tools
    # This handles cases where LLM knows the issue_id (UUID) but lost the project/workspace context
    if tool_name in ["workitems_retrieve", "workitems_delete"] and kwargs.get("issue_id"):
        issue_id = kwargs.get("issue_id")
        need_project = not project_id
        need_workspace = not workspace_slug

        if (need_project or need_workspace) and issue_id:
            try:
                from pi.app.api.v1.helpers.plane_sql_queries import get_issue_identifier_for_artifact
                from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_slug
                from pi.app.api.v1.helpers.plane_sql_queries import resolve_workspace_id_from_project_id

                # 1. Try to get project_id from issue_id
                identifier_info = await get_issue_identifier_for_artifact(issue_id)
                if identifier_info and identifier_info.get("project_id"):
                    found_project_id = str(identifier_info["project_id"])

                    # Set project_id if missing
                    if need_project:
                        kwargs["project_id"] = found_project_id
                        project_id = found_project_id  # Update for workspace lookup below
                        log.info(f"Auto-resolved project_id {project_id} from issue_id {issue_id}")

                    # 2. Try to get workspace_slug using project_id
                    if need_workspace and project_id:
                        workspace_id = await resolve_workspace_id_from_project_id(project_id)
                        if workspace_id:
                            found_slug = await get_workspace_slug(workspace_id)
                            if found_slug:
                                kwargs["workspace_slug"] = found_slug
                                log.debug(f"Auto-resolved workspace_slug {found_slug} from issue_id {issue_id}")

            except Exception as e:
                log.warning(f"Failed to auto-resolve context from issue_id {issue_id}: {e}")

    #  Fix for list: Pass filter args to SDK (BUG FIX)
    if tool_name == "workitems_list":
        # Build filter arguments and merge them into kwargs
        filter_fields = [
            "priority",
            "assignees",
            "labels",
            "start_date",
            "target_date",
            "created_by",
            "updated_by",
            "type_id",
            "parent",
            "is_draft",
            "created_at",
            "updated_at",
            "completed_at",
            "archived_at",
        ]

        for field in filter_fields:
            if field in kwargs and kwargs[field] is not None:
                # These are already in kwargs, just ensure they're passed through
                pass

    return kwargs


async def _workitems_post_handler(
    metadata: ToolMetadata,
    result: Dict[str, Any],
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    method_executor: Any,
    category: str,
    method_key: str,
) -> Dict[str, Any]:
    """Post-processing handler for workitems tools.

    Handles:
    - create/update/create_epic/update_epic: identifier enrichment for URL construction
    - advanced_search: entity URL enrichment for multi-result responses
    """
    tool_name = metadata.name

    # Identifier enrichment for create/update operations
    if tool_name in ["workitems_create", "workitems_update", "create_epic", "update_epic"]:
        if result.get("success"):
            data = result.get("data")
            if data and isinstance(data, dict) and data.get("id"):
                try:
                    from pi.app.api.v1.helpers.plane_sql_queries import get_issue_identifier_for_artifact

                    # Get the missing project_identifier and sequence_id
                    identifier_info = await get_issue_identifier_for_artifact(str(data["id"]))
                    if identifier_info:
                        data["project_identifier"] = identifier_info.get("project_identifier")
                        data["sequence_id"] = identifier_info.get("sequence_id")
                        log.debug(f"Enriched workitem data with identifier info: {identifier_info.get("identifier")}")
                except Exception as e:
                    log.warning(f"Could not enrich workitem data with identifier info: {e}")

                # Generate user-friendly success message
                result["message"] = generate_success_message(tool_name, data.get("name"))

    # Entity URL enrichment for advanced_search (multi-result)
    elif tool_name == "workitems_advanced_search":
        if result.get("success"):
            data = result.get("data")
            if isinstance(data, dict):
                results_list: List[Dict[str, Any]] = data.get("results", [])
                issue_ids: List[str] = [str(item["id"]) for item in results_list if item.get("id")]
                if issue_ids:
                    try:
                        from pi.agents.sql_agent.helpers import construct_entity_urls_from_db

                        entity_urls = await construct_entity_urls_from_db(
                            entity_ids={"issues": issue_ids},
                            api_base_url="",  # Not used; URLs built from settings
                        )
                        if entity_urls:
                            data["entity_urls"] = entity_urls
                            log.debug(
                                "Enriched advanced_search results with %d entity URLs for %d work items",
                                len(entity_urls),
                                len(issue_ids),
                            )
                    except Exception as e:
                        log.warning("Could not enrich advanced_search results with entity URLs: %s", e)

    return result


# ============================================================================
# ADVANCED SEARCH FILTER SANITISATION
# ============================================================================

_LOGICAL_OPERATORS = frozenset({"and", "or", "not"})


def _sanitize_filter_node(node: Any) -> Any:
    """Recursively fix a filter dict so that logical operators are never mixed
    with field keys at the same level.

    The Plane API requires that if a node contains a logical operator
    (``and`` / ``or`` / ``not``), that operator must be the **only** key.
    LLMs frequently produce a hybrid like::

        {"priority": "high", "and": [{"state_group": "started"}]}

    This function restructures it into::

        {"and": [{"priority": "high"}, {"state_group": "started"}]}
    """
    if not isinstance(node, dict) or not node:
        return node

    logical_keys = [k for k in node if isinstance(k, str) and k.lower() in _LOGICAL_OPERATORS]
    field_keys = [k for k in node if k not in logical_keys]

    # Happy path: no logical operators → leaf node, nothing to fix
    if not logical_keys:
        return node

    # Happy path: single logical operator and no field keys → valid node
    if len(logical_keys) == 1 and not field_keys:
        op = logical_keys[0]
        op_lower = op.lower()
        value = node[op]
        if op_lower in ("and", "or") and isinstance(value, list):
            return {op_lower: [_sanitize_filter_node(child) for child in value]}
        if op_lower == "not" and isinstance(value, dict):
            return {"not": _sanitize_filter_node(value)}
        return node

    # ---- Fix: logical operator(s) mixed with field keys ----
    # Collect the field-key portion as a single leaf dict.
    field_leaf = {k: node[k] for k in field_keys}

    # Multiple logical operators mixed together is rare but possible;
    # wrap everything under an implicit AND.
    and_children: list = [field_leaf]

    for op in logical_keys:
        op_lower = op.lower()
        value = node[op]
        if op_lower in ("and", "or") and isinstance(value, list):
            # Flatten an "and" into the top-level AND; keep "or" as a nested node
            sanitized = [_sanitize_filter_node(child) for child in value]
            if op_lower == "and":
                and_children.extend(sanitized)
            else:
                and_children.append({"or": sanitized})
        elif op_lower == "not" and isinstance(value, dict):
            and_children.append({"not": _sanitize_filter_node(value)})
        else:
            # Unexpected shape — keep as-is so the API returns a clear error
            and_children.append({op_lower: value})

    log.info("Sanitised advanced_search filters: separated mixed field/operator keys into AND structure")
    return {"and": and_children}


async def _advanced_search_pre_handler(
    metadata: ToolMetadata,
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    category: str,
    method_key: str,
    method_executor: Any = None,
) -> Dict[str, Any]:
    """Pre-processing handler for workitems_advanced_search.

    Sanitises the ``filters`` dict produced by the LLM so it conforms to
    the Plane API's structural rules (no mixing of logical operators with
    field keys at the same level).
    """
    filters = kwargs.get("filters")
    log.debug("workitems_advanced_search pre-handler: raw kwargs from LLM: %s", kwargs)
    if isinstance(filters, dict) and filters:
        kwargs["filters"] = _sanitize_filter_node(filters)
        log.debug("workitems_advanced_search pre-handler: sanitised filters: %s", kwargs["filters"])
    return kwargs


# ============================================================================
# WORKITEMS TOOL METADATA
# ============================================================================

WORKITEMS_TOOL_DEFINITIONS: Dict[str, ToolMetadata] = {
    "create": ToolMetadata(
        name="workitems_create",
        description="Create a new work item/issue",
        sdk_method="create_work_item",
        returns_entity_type="workitem",
        pre_handler=_workitems_pre_handler,
        post_handler=_workitems_post_handler,
        parameters=[
            ToolParameter(name="name", type="str", required=True, description="Work item title (required)"),
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project ID (required - provide from conversation context or previous actions)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (required - provide from conversation context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="Workitem description in HTML format",
            ),
            ToolParameter(
                name="priority",
                type="Optional[str]",
                required=False,
                description="Priority level (high, medium, low, urgent, none)",
            ),
            ToolParameter(
                name="state",
                type="Optional[str]",
                required=False,
                description='State name or UUID for the workitem (e.g., "todo", "in progress", "done")',
            ),
            ToolParameter(
                name="assignees",
                type="List[str]",
                required=False,
                description="List of assignee user IDs",
            ),
            ToolParameter(
                name="labels",
                type="List[str]",
                required=False,
                description="List of label IDs",
            ),
            ToolParameter(
                name="start_date",
                type="Optional[str]",
                required=False,
                description="Start date (YYYY-MM-DD format)",
            ),
            ToolParameter(
                name="target_date",
                type="Optional[str]",
                required=False,
                description="Target completion date (YYYY-MM-DD format)",
            ),
            ToolParameter(
                name="type_id",
                type="Optional[str]",
                required=False,
                description="Workitem type ID (optional). MUST be the 'issue_types_id' (UUID of the issue type definition), "
                "NOT the 'project_issue_types_id'.",
            ),
            ToolParameter(
                name="parent",
                type="Optional[str]",
                required=False,
                description="Parent work-item ID (optional)",
            ),
            ToolParameter(
                name="external_id",
                type="Optional[str]",
                required=False,
                description="External system identifier (optional)",
            ),
            ToolParameter(
                name="external_source",
                type="Optional[str]",
                required=False,
                description="External system source name (optional)",
            ),
            ToolParameter(
                name="is_draft",
                type="Optional[bool]",
                required=False,
                description="Create as draft (optional)",
            ),
        ],
    ),
    "update": ToolMetadata(
        name="workitems_update",
        description="Update an existing work item/issue",
        sdk_method="update_work_item",
        returns_entity_type="workitem",
        pre_handler=_workitems_pre_handler,
        post_handler=_workitems_post_handler,
        parameters=[
            ToolParameter(name="issue_id", type="str", required=True, description="Work item ID to update (required)"),
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project ID (required - provide from conversation context or previous actions)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (required - provide from conversation context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="name",
                type="Optional[str]",
                required=False,
                description="New work item title",
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="New description in HTML format",
            ),
            ToolParameter(
                name="priority",
                type="Optional[str]",
                required=False,
                description="New priority level (high, medium, low, urgent, none)",
            ),
            ToolParameter(
                name="state",
                type="Optional[str]",
                required=False,
                description='New state name or UUID (e.g., "todo", "in progress", "done")',
            ),
            ToolParameter(
                name="assignees",
                type="List[str]",
                required=False,
                description="New list of assignee user IDs",
            ),
            ToolParameter(
                name="labels",
                type="List[str]",
                required=False,
                description="New list of label IDs",
            ),
            ToolParameter(
                name="start_date",
                type="Optional[str]",
                required=False,
                description="New start date (YYYY-MM-DD format)",
            ),
            ToolParameter(
                name="target_date",
                type="Optional[str]",
                required=False,
                description="New target completion date (YYYY-MM-DD format)",
            ),
            ToolParameter(
                name="type_id",
                type="Optional[str]",
                required=False,
                description="Workitem type ID (optional). MUST be the 'issue_types_id' (UUID of the issue type definition), "
                "NOT the 'project_issue_types_id'.",
            ),
            ToolParameter(
                name="parent",
                type="Optional[str]",
                required=False,
                description="Parent work-item ID (optional)",
            ),
            ToolParameter(
                name="external_id",
                type="Optional[str]",
                required=False,
                description="External system identifier (optional)",
            ),
            ToolParameter(
                name="external_source",
                type="Optional[str]",
                required=False,
                description="External system source name (optional)",
            ),
            ToolParameter(
                name="is_draft",
                type="Optional[bool]",
                required=False,
                description="Mark as draft (optional)",
            ),
        ],
    ),
    "delete": ToolMetadata(
        name="workitems_delete",
        description="Delete a work item/issue",
        sdk_method="delete_work_item",
        pre_handler=_workitems_pre_handler,
        parameters=[
            ToolParameter(name="issue_id", type="str", required=True, description="Work item ID to delete (required)"),
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project ID (required - provide from conversation context or previous actions)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "create_relation": ToolMetadata(
        name="workitems_create_relation",
        description="Create relationships between work items",
        sdk_method="create_work_item_relation",
        returns_entity_type="workitem",
        pre_handler=_workitems_pre_handler,
        parameters=[
            ToolParameter(name="issue_id", type="str", required=True, description="Source work item ID to create relations from (required)"),
            ToolParameter(
                name="relation_type",
                type="str",
                required=True,
                description="Type of relationship - one of: blocking, blocked_by, duplicate, relates_to, start_before, "
                "start_after, finish_before, finish_after (required)",
            ),
            ToolParameter(
                name="issues",
                type="List[str]",
                required=True,
                description="List of work item IDs to create relations with (required)",
            ),
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project ID (required - provide from conversation context or previous actions)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
        ],
    ),
    "create_epic": ToolMetadata(
        name="create_epic",
        description="Create a new epic",
        sdk_method="create_work_item",
        returns_entity_type="epic",
        pre_handler=_workitems_pre_handler,
        post_handler=_workitems_post_handler,
        parameters=[
            ToolParameter(name="name", type="str", required=True, description="Epic title (required)"),
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project ID (required - provide from conversation context or previous actions)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (required - provide from conversation context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="Epic description in HTML format",
            ),
            ToolParameter(
                name="priority",
                type="Optional[str]",
                required=False,
                description="Priority level (high, medium, low, urgent, none)",
            ),
            ToolParameter(
                name="state",
                type="Optional[str]",
                required=False,
                description='State name or ID for the epic (e.g., "done", "in progress", or UUID)',
            ),
            ToolParameter(
                name="assignees",
                type="List[str]",
                required=False,
                description="List of assignee user IDs",
            ),
            ToolParameter(
                name="labels",
                type="List[str]",
                required=False,
                description="List of label IDs",
            ),
            ToolParameter(
                name="start_date",
                type="Optional[str]",
                required=False,
                description="Start date (YYYY-MM-DD format)",
            ),
            ToolParameter(
                name="target_date",
                type="Optional[str]",
                required=False,
                description="Target completion date (YYYY-MM-DD format)",
            ),
            ToolParameter(
                name="external_id",
                type="Optional[str]",
                required=False,
                description="External system identifier (optional)",
            ),
            ToolParameter(
                name="external_source",
                type="Optional[str]",
                required=False,
                description="External system source name (optional)",
            ),
        ],
    ),
    "epic_list": ToolMetadata(
        name="epic_list",
        description="List epics in a project with filtering",
        sdk_method="list_epics",
        parameters=[
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project ID (required - provide from conversation context or previous actions)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="cursor",
                type="Optional[str]",
                required=False,
                description="Pagination cursor for next page",
            ),
            ToolParameter(
                name="per_page",
                type="Optional[int]",
                required=False,
                description="Number of epics per page (default: 20, max: 100)",
            ),
            ToolParameter(
                name="order_by",
                type="Optional[str]",
                required=False,
                description="Field to order results by. Prefix with '-' for descending order",
            ),
        ],
    ),
    "update_epic": ToolMetadata(
        name="update_epic",
        description="Update an existing epic",
        sdk_method="update_work_item",
        returns_entity_type="epic",
        pre_handler=_workitems_pre_handler,
        post_handler=_workitems_post_handler,
        parameters=[
            ToolParameter(name="issue_id", type="str", required=True, description="Epic ID to update (required)"),
            ToolParameter(
                name="project_id",
                type="Optional[str]",
                required=False,
                description="Project ID (optional - provide from conversation context)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (provide if known, otherwise auto-detected)",
                auto_fill_from_context=True,
            ),
            ToolParameter(
                name="name",
                type="Optional[str]",
                required=False,
                description="Epic title",
            ),
            ToolParameter(
                name="description_html",
                type="Optional[str]",
                required=False,
                description="Epic description in HTML format",
            ),
            ToolParameter(
                name="priority",
                type="Optional[str]",
                required=False,
                description="Priority level (high, medium, low, urgent, none)",
            ),
            ToolParameter(
                name="state",
                type="Optional[str]",
                required=False,
                description="State ID for the epic",
            ),
            ToolParameter(
                name="assignees",
                type="List[str]",
                required=False,
                description="List of assignee user IDs",
            ),
            ToolParameter(
                name="labels",
                type="List[str]",
                required=False,
                description="List of label IDs",
            ),
            ToolParameter(
                name="start_date",
                type="Optional[str]",
                required=False,
                description="Start date (YYYY-MM-DD format)",
            ),
            ToolParameter(
                name="target_date",
                type="Optional[str]",
                required=False,
                description="Target completion date (YYYY-MM-DD format)",
            ),
            ToolParameter(
                name="external_id",
                type="Optional[str]",
                required=False,
                description="External system identifier (optional)",
            ),
            ToolParameter(
                name="external_source",
                type="Optional[str]",
                required=False,
                description="External system source name (optional)",
            ),
            ToolParameter(
                name="type_id",
                type="Optional[str]",
                required=False,
                description="Work item type ID (set to empty string to convert epic to regular work item)",
            ),
        ],
    ),
    "advanced_search": ToolMetadata(
        name="workitems_advanced_search",
        description="PREFERRED tool for finding work items. Use this for: "
        "(1) text/name search — find work items by title keywords (e.g. query='capex', query='login bug'), "
        "(2) metadata filtering — filter by priority, state_group, assignee, project, cycle, module, labels, "
        "(3) combined — text search + filters together (e.g. query='capex' with filters={'priority': 'high'}). "
        "Faster and more accurate than structured_db_tool. Supports AND/OR/NOT filter logic.",
        sdk_method="advanced_search_work_items",
        pre_handler=_advanced_search_pre_handler,
        post_handler=_workitems_post_handler,
        parameters=[
            ToolParameter(
                name="query",
                type="Optional[str]",
                required=False,
                description="Free-text search query to match against work item name or description ONLY.\n"
                "Do NOT include filter logic here (e.g., avoid 'priority:high'). Use the 'filters' argument for that.",
            ),
            ToolParameter(
                name="filters",
                type="Dict[str, Any]",
                required=False,
                description="Filter dictionary for structured filtering.\n"
                "Scalar fields (use exact match):\n"
                "- priority: urgent, high, medium, low, none\n"
                "- state_group: backlog, unstarted, started, completed, cancelled\n"
                "- is_archived: true or false\n"
                "- is_draft: true or false\n"
                "UUID fields (use exact UUID string — always include the _id suffix):\n"
                "- assignee_id, project_id, cycle_id, module_id, label_id,\n"
                "  state_id, created_by_id, subscriber_id, mention_id\n"
                "Date fields (ISO 8601 strings):\n"
                "- start_date, target_date (exact match)\n"
                '- start_date__range, target_date__range, created_at__range, updated_at__range: ["YYYY-MM-DD", "YYYY-MM-DD"]\n'
                "Multi-value lookups (append __in to any UUID or scalar field):\n"
                "- priority__in, state_group__in, assignee_id__in, project_id__in,\n"
                "  cycle_id__in, module_id__in, label_id__in, state_id__in, created_by_id__in\n"
                "Logical operators (wrap field dicts in and/or/not):\n"
                "- {'and': [{'priority': 'high'}, {'state_group': 'started'}]}\n"
                "- {'or': [{'assignee_id': '<uuid>'}, {'created_by_id': '<uuid>'}]}\n"
                "- {'not': {'state_group': 'completed'}}\n"
                "Examples:\n"
                "- {'priority': 'urgent'}\n"
                "- {'created_by_id': '<uuid>', 'project_id': '<uuid>'}\n"
                "- {'priority__in': ['high', 'urgent']}\n"
                "- {'and': [{'project_id': '<uuid>'}, {'created_by_id': '<uuid>'}]}",
            ),
            ToolParameter(
                name="limit",
                type="int",
                required=False,
                description="Maximum number of results to return (default: 25)",
            ),
            ToolParameter(
                name="workspace_slug",
                type="Optional[str]",
                required=False,
                description="Workspace slug (required - provide from conversation context)",
                auto_fill_from_context=True,
            ),
        ],
    ),
}


# ============================================================================
# TOOL FACTORY
# ============================================================================


def get_workitem_tools(method_executor, context):
    """Return LangChain tools for the workitems category using auto-generation from metadata.

    Dynamically fetches available work item types for the current project and injects them
    into the type_id parameter descriptions, making types visible to the LLM during planning.
    """
    import copy

    # Make a deep copy to avoid modifying the global constant
    dynamic_tool_definitions = copy.deepcopy(WORKITEMS_TOOL_DEFINITIONS)

    # Fetch and inject available types if we have the necessary context
    project_id = context.get("project_id")
    workspace_slug = context.get("workspace_slug")

    if project_id and workspace_slug and method_executor:
        types_text = _sync_fetch_types(method_executor, project_id, workspace_slug)
        if types_text:
            _enrich_type_id_descriptions(dynamic_tool_definitions, types_text)
            log.info(f"Injected available types into workitem tool descriptions for project {project_id}")

    return generate_tools_for_category(
        category="workitems",
        method_executor=method_executor,
        context=context,
        tool_definitions=dynamic_tool_definitions,
    )
