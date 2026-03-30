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
Unified Retrieval Tools for Plane.

Provides consolidated entity_list, entity_retrieve, and entity_search tools that route
to appropriate SDK methods or direct DB queries based on entity_type, reducing tool count
while preserving all capabilities.
"""

import logging
import re
import uuid
from typing import Any
from typing import Dict
from typing import List
from typing import Literal
from typing import Optional

from langchain_core.tools import tool

from pi.core.db.plane import PlaneDBPool

from .base import PlaneToolBase

log = logging.getLogger(__name__)


# ============================================================================
# URL CONSTRUCTION HELPERS
# ============================================================================


def _construct_entity_url(
    item: Dict[str, Any],
    entity_type: str,
    workspace_slug: str,
    project_id: Optional[str] = None,
) -> Optional[Dict[str, str]]:
    """Construct a URL for an entity based on its type.

    Args:
        item: The entity data dictionary
        entity_type: Type of entity (workitems, projects, cycles, etc.)
        workspace_slug: Workspace slug for URL construction
        project_id: Project ID (required for project-scoped entities)

    Returns:
        Dict with url, name, id, type fields, or None if URL cannot be constructed
    """
    if not item or not workspace_slug:
        return None

    from pi.services.chat.helpers.url_builder import build_entity_url

    entity_id = item.get("id")
    entity_name = item.get("name", "")
    identifier = item.get("identifier")

    # Intake items use different field names after post-processing flattening
    if entity_type == "intake":
        entity_id = entity_id or item.get("intake_id")
        entity_name = entity_name or item.get("title", "")

    if not entity_id:
        return None

    # Get project_id from item if not provided
    item_project_id = project_id or item.get("project") or item.get("project_id")

    # Map complex types to base types for URL builder
    builder_type = entity_type
    if entity_type in ("archived_cycles", "cycle_workitems"):
        builder_type = "cycle"
    elif entity_type in ("archived_modules", "module_workitems"):
        builder_type = "module"
    elif entity_type in ("workspace_members", "project_members"):
        builder_type = "profile"

    url = build_entity_url(
        entity_type=builder_type,
        workspace_slug=workspace_slug,
        entity_id=str(entity_id),
        project_id=item_project_id,
        identifier=identifier,
        inbox_issue_id=str(item.get("issue") or entity_id) if entity_type == "intake" else None,
    )

    if not url:
        return None

    result = {
        "name": entity_name,
        "id": str(entity_id),
        "url": url,
        "type": entity_type.rstrip("s"),  # Singularize: "projects" -> "project"
    }

    if identifier:
        result["identifier"] = identifier

    return result


async def _enrich_with_workitem_identifiers(
    items: List[Dict[str, Any]],
    workspace_slug: str,
) -> None:
    """Enrich workitem items with project_identifier, sequence_id, and identifier.

    This is needed because workitem list responses may not include the full identifier.
    Modifies items in-place.
    """
    try:
        from pi.app.api.v1.helpers.plane_sql_queries import get_issue_identifier_for_artifact

        for item in items:
            if isinstance(item, dict) and item.get("id"):
                try:
                    identifier_info = await get_issue_identifier_for_artifact(str(item["id"]))
                    if identifier_info:
                        item["project_identifier"] = identifier_info.get("project_identifier")
                        item["sequence_id"] = identifier_info.get("sequence_id")
                        item["identifier"] = identifier_info.get("identifier")

                        # Add URL using the identifier
                        from pi.services.chat.helpers.url_builder import build_entity_url

                        if workspace_slug and identifier_info.get("identifier"):
                            item["url"] = build_entity_url("workitem", workspace_slug, identifier=identifier_info.get("identifier"))
                except Exception as e:
                    log.debug(f"Could not enrich workitem {item.get("id")}: {e}")
    except Exception as e:
        log.warning(f"Error enriching workitems with identifiers: {e}")


async def _enrich_intake_with_identifiers(
    items: List[Dict[str, Any]],
    workspace_slug: str,
) -> None:
    """Enrich intake items with identifiers using their issue_id.

    Intake items are flattened and have issue_id instead of id for the underlying
    work item. We look up the identifier via issue_id so URLs can use the
    /browse/identifier/ format.
    Modifies items in-place.
    """
    try:
        from pi.app.api.v1.helpers.plane_sql_queries import get_issue_identifier_for_artifact

        for item in items:
            if isinstance(item, dict) and item.get("issue_id"):
                try:
                    identifier_info = await get_issue_identifier_for_artifact(str(item["issue_id"]))
                    if identifier_info:
                        item["project_identifier"] = identifier_info.get("project_identifier")
                        item["sequence_id"] = identifier_info.get("sequence_id")
                        item["identifier"] = identifier_info.get("identifier")
                except Exception as e:
                    log.debug(f"Could not enrich intake item {item.get("intake_id")}: {e}")
    except Exception as e:
        log.warning(f"Error enriching intake items with identifiers: {e}")


# Mapping from entity_type to (category, method, container_type, container_id_param, allowed_params)
# category: The SDK category (e.g., 'modules', 'cycles')
# method: The method within that category (e.g., 'list')
# container_type: What scope this operates at ('workspace', 'project', 'cycle', 'module', 'workitem')
# container_id_param: None means no extra container ID, otherwise specifies which param name to use
# allowed_params: Dict mapping tool_param_name -> sdk_param_name. Only these params will be passed to SDK.
ENTITY_LIST_CONFIG = {
    # Workspace-scoped entities
    "projects": ("projects", "list", "workspace", None, {"per_page": "per_page", "cursor": "cursor", "slug": "slug"}),
    "initiatives": ("initiatives", "list", "workspace", None, {}),
    "teamspaces": ("teamspaces", "list", "workspace", None, {}),
    "stickies": ("stickies", "list", "workspace", None, {}),
    "customers": ("customers", "list", "workspace", None, {}),
    "workspace_members": ("members", "get_workspace_members", "workspace", None, {}),
    # Project-scoped entities
    "workitems": (
        "workitems",
        "list",
        "project",
        None,
        {
            "per_page": "per_page",
            "page": "page",
            "cursor": "cursor",
            "order_by": "order_by",
            "expand": "expand",
        },
    ),
    "epics": (
        "workitems",
        "list_epics",
        "project",
        None,
        {
            "per_page": "per_page",
            "cursor": "cursor",
            "order_by": "order_by",
            "expand": "expand",
        },
    ),
    "cycles": (
        "cycles",
        "list",
        "project",
        None,
        {"per_page": "per_page", "page": "page", "cursor": "cursor", "cycle_view": "cycle_view"},
    ),
    "labels": ("labels", "list", "project", None, {}),
    "states": ("states", "list", "project", None, {}),
    "modules": ("modules", "list", "project", None, {}),
    "intake": ("intake", "list", "project", None, {"per_page": "per_page", "cursor": "cursor"}),
    "types": ("types", "list", "project", None, {}),
    "project_members": ("members", "get_project_members", "project", None, {}),
    "archived_cycles": ("cycles", "list_archived", "project", None, {}),
    "archived_modules": ("modules", "list_archived", "project", None, {}),
    # Cycle-scoped entities
    "cycle_workitems": ("cycles", "list_work_items", "cycle", "cycle_id", {}),
    # Module-scoped entities
    "module_workitems": ("modules", "list_work_items", "module", "module_id", {}),
    # Work-item-scoped entities
    "activity": ("activity", "list", "workitem", "work_item_id", {}),
    "attachments": ("attachments", "list", "workitem", "work_item_id", {}),
    "comments": ("comments", "list", "workitem", "work_item_id", {}),
    "links": ("links", "list", "workitem", "work_item_id", {}),
    "worklogs": ("worklogs", "list", "workitem", "work_item_id", {}),
}

# All valid entity types
ENTITY_TYPES = list(ENTITY_LIST_CONFIG.keys())

# Entity types by scope for documentation
WORKSPACE_ENTITIES = ["projects", "initiatives", "teamspaces", "stickies", "customers"]
PROJECT_ENTITIES = [
    "workitems",
    "cycles",
    "labels",
    "states",
    "modules",
    "intake",
    "types",
    "archived_cycles",
    "archived_modules",
]
CYCLE_ENTITIES = ["cycle_workitems"]
MODULE_ENTITIES = ["module_workitems"]
WORKITEM_ENTITIES = ["activity", "attachments", "comments", "links", "worklogs"]


# ============================================================================
# ENTITY RETRIEVE CONFIGURATION
# ============================================================================

# Mapping from entity_type to (category, method, container_type, id_param_name)
# category: The SDK category (e.g., 'projects', 'cycles')
# method: The method within that category (e.g., 'retrieve')
# container_type: What scope this operates at ('workspace', 'project', 'workitem')
# id_param_name: The SDK parameter name for the entity's primary ID
ENTITY_RETRIEVE_CONFIG = {
    # Workspace-scoped entities (only need workspace_slug + entity_id)
    "projects": ("projects", "retrieve", "workspace", "project_id"),
    "initiatives": ("initiatives", "retrieve", "workspace", "initiative_id"),
    "teamspaces": ("teamspaces", "retrieve", "workspace", "teamspace_id"),
    "stickies": ("stickies", "retrieve", "workspace", "sticky_id"),
    "customers": ("customers", "retrieve", "workspace", "customer_id"),
    # Project-scoped entities (need workspace_slug + project_id + entity_id)
    "workitems": ("workitems", "retrieve", "project", "issue_id"),
    "cycles": ("cycles", "retrieve", "project", "cycle_id"),
    "labels": ("labels", "retrieve", "project", "label_id"),
    "states": ("states", "retrieve", "project", "state_id"),
    "modules": ("modules", "retrieve", "project", "module_id"),
    "intake": ("intake", "retrieve", "project", "intake_issue_id"),
    "types": ("types", "retrieve", "project", "type_id"),
    # Work-item-scoped entities (need workspace_slug + project_id + work_item_id + entity_id)
    "activity": ("activity", "retrieve", "workitem", "activity_id"),
    "comments": ("comments", "retrieve", "workitem", "comment_id"),
    "links": ("links", "retrieve", "workitem", "link_id"),
    "attachments": ("attachments", "retrieve", "workitem", "attachment_id"),
}

RETRIEVE_ENTITY_TYPES = list(ENTITY_RETRIEVE_CONFIG.keys())


def get_unified_retrieval_tools(method_executor, context: Dict[str, Any]) -> List:
    """Return unified retrieval tools for Ask mode.

    Args:
        method_executor: MethodExecutor instance for calling SDK methods
        context: Dict containing workspace_slug, workspace_id, project_id, user_id
    """

    @tool
    async def entity_list(
        entity_type: Literal[
            "workitems",
            "epics",
            "projects",
            "cycles",
            "labels",
            "states",
            "modules",
            "intake",
            "initiatives",
            "teamspaces",
            "stickies",
            "customers",
            "types",
            "archived_cycles",
            "archived_modules",
            "cycle_workitems",
            "module_workitems",
            "activity",
            "attachments",
            "comments",
            "links",
            "worklogs",
            "workspace_members",
            "project_members",
        ],
        project_id: Optional[str] = None,
        cycle_id: Optional[str] = None,
        module_id: Optional[str] = None,
        work_item_id: Optional[str] = None,
        per_page: int = 25,
        page: Optional[int] = None,
        cursor: Optional[str] = None,
        order_by: Optional[str] = None,
        expand: Optional[List[str]] = None,
        cycle_view: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List entities of a specific type from Plane.

        This unified tool handles listing for all entity types. It doesn't support any type of filtering - use other tools for that.

        Args:
            entity_type: Type of entity to list.
            project_id: Project ID (required for project/container scopes). Auto-filled from context.
            cycle_id: Cycle ID (required for cycle_workitems).
            module_id: Module ID (required for module_workitems).
            work_item_id: Work item ID (required for workitem-scoped entities).
            per_page: Number of items per page (default: 25).
            page: Page number (for page-based pagination).
            cursor: Cursor for next page (for cursor-based pagination).
            order_by: Sorting field (e.g. "-created_at"). Only for supported entities - workitems and epics.
            expand: List of fields to expand. Only for supported entities - workitems and epics.
            cycle_view: Filter cycles by view type (e.g., "active", "completed"). Only for cycles.

        Returns:
            Dict with list of entities and count
        """
        if not method_executor:
            return PlaneToolBase.format_error_payload(
                "SDK method executor not available",
                "OAuth authorization required to use this tool",
            )

        # Validate entity_type
        if entity_type not in ENTITY_LIST_CONFIG:
            return PlaneToolBase.format_error_payload(
                f"Invalid entity_type: {entity_type}",
                f"Valid entity types: {", ".join(ENTITY_TYPES)}",
            )

        (
            category,
            method,
            container_type,
            container_id_param,
            allowed_params_map,
        ) = ENTITY_LIST_CONFIG[entity_type]

        # Auto-fill from context
        workspace_slug = context.get("workspace_slug")

        if project_id is None and context.get("project_id"):
            project_id = str(context["project_id"])

        # Determine if project_id is required based on container type
        requires_project = container_type not in ["workspace"]

        # Validate required params
        if not workspace_slug:
            return PlaneToolBase.format_error_payload(
                "workspace_slug is required",
                "Context is missing workspace_slug",
            )

        # Ensure workspace_slug is a string for type checkers
        workspace_slug = str(workspace_slug)

        if requires_project and not project_id:
            return PlaneToolBase.format_error_payload(
                f"project_id is required for listing {entity_type}",
                "Provide project_id parameter or ensure project context is available",
            )

        # Validate container-specific ID params
        if container_id_param == "cycle_id" and not cycle_id:
            return PlaneToolBase.format_error_payload(
                f"cycle_id is required for listing {entity_type}",
                "Provide cycle_id to list work items in a specific cycle",
            )

        if container_id_param == "module_id" and not module_id:
            return PlaneToolBase.format_error_payload(
                f"module_id is required for listing {entity_type}",
                "Provide module_id to list work items in a specific module",
            )

        if container_id_param == "work_item_id" and not work_item_id:
            return PlaneToolBase.format_error_payload(
                f"work_item_id is required for listing {entity_type}",
                f"Provide work_item_id to list {entity_type} for a specific work item",
            )

        try:
            # Base params required by all methods (except workspace-only ones which don't need project_id)
            params: Dict[str, Any] = {"workspace_slug": workspace_slug}

            if requires_project:
                params["project_id"] = project_id

            # Add container-specific ID param
            if container_id_param == "cycle_id":
                params["cycle_id"] = cycle_id
            elif container_id_param == "module_id":
                params["module_id"] = module_id
            elif container_id_param == "work_item_id":
                # SDK adapter methods for work-item scoped entities expect "issue_id"
                # (not "work_item_id"). Map the tool's work_item_id to issue_id.
                params["issue_id"] = work_item_id

            # Collect potential optional params
            # We map tool_param_name -> value
            potential_params = {
                "per_page": per_page,
                "page": page,
                "cursor": cursor,
                "order_by": order_by,
                "expand": expand,
                "cycle_view": cycle_view,
            }

            # Only inject allowed params for this entity type
            for tool_param, value in potential_params.items():
                if value is not None and tool_param in allowed_params_map:
                    sdk_param_name = allowed_params_map[tool_param]

                    # Special handling for expand: SDK expects comma-separated string, tool receives list
                    if sdk_param_name == "expand" and isinstance(value, list):
                        value = ",".join(value)

                    params[sdk_param_name] = value

            # Call SDK method via method_executor (category, method, **kwargs)
            result = await method_executor.execute(category, method, **params)

            # Check for execution errors
            if isinstance(result, dict) and result.get("success") is False:
                error_msg = result.get("error", "Unknown error")
                return PlaneToolBase.format_error_payload(
                    f"Failed to list {entity_type}",
                    error_msg,
                )

            # Normalize result to standard format
            # The executor wraps results as: {"success": True, "data": {actual_result}}
            if isinstance(result, dict):
                # First, unwrap the executor wrapper if present
                if "success" in result and "data" in result:
                    result = result["data"]

                # Now extract items from the actual result
                if isinstance(result, dict):
                    if "results" in result:
                        items = result["results"]
                    elif "data" in result:
                        items = result["data"]
                    else:
                        items = result
                elif isinstance(result, list):
                    items = result
                else:
                    items = [result] if result else []
            elif isinstance(result, list):
                items = result
            else:
                items = [result] if result else []

            # Ensure items is a list
            if not isinstance(items, list):
                items = [items] if items else []

            # ====================================================================
            # POST-HANDLERS - Entity-specific post-processing
            # ====================================================================

            # Post-handler: Filter bot users from member lists
            # (Ported from members.py _filter_bots_handler)
            if entity_type in ["workspace_members", "project_members"]:
                pre_filter_count = len(items)
                items = [
                    member
                    for member in items
                    if not (
                        member.get("is_bot", False) or (isinstance(member.get("email"), str) and "_bot@plane.so" in member.get("email", "").lower())
                    )
                ]
                filtered_count = pre_filter_count - len(items)
                if filtered_count:
                    log.debug(f"Filtered {filtered_count} bot users from {entity_type}")

            # Post-handler: Flatten intake list items to expose intake_id/issue_id explicitly
            # (Ported from intake.py _intake_list_post_processor)
            if entity_type == "intake":
                flattened = []
                for item in items:
                    if isinstance(item, dict):
                        issue = item.get("issue_detail", {})
                        flattened.append(
                            {
                                "intake_id": item.get("id"),
                                "issue_id": issue.get("id"),
                                "title": issue.get("name"),
                                "identifier": issue.get("identifier"),
                                "priority": issue.get("priority"),
                                "state": issue.get("state"),
                                "status": item.get("status"),
                            }
                        )
                    else:
                        flattened.append(item)
                items = flattened

            # ====================================================================
            # URL ENRICHMENT - Add clickable URLs for LLM to use
            # ====================================================================
            entity_urls = []

            # For workitems, we need to fetch identifiers from DB (not in SDK response)
            if entity_type in ["workitems", "cycle_workitems", "module_workitems"]:
                await _enrich_with_workitem_identifiers(items, workspace_slug)

            # For intake items, enrich with identifiers using the issue_id field
            if entity_type == "intake":
                await _enrich_intake_with_identifiers(items, workspace_slug)

            # Construct URLs for each item
            for item in items:
                log.info(f"Processing item: {str(item)}")
                if isinstance(item, dict):
                    url_info = _construct_entity_url(
                        item=item,
                        entity_type=entity_type,
                        workspace_slug=workspace_slug,
                        project_id=project_id,
                    )
                    if url_info:
                        entity_urls.append(url_info)
                        # Also add URL directly to item for convenience
                        if "url" not in item:
                            item["url"] = url_info["url"]

            log.info(f"Enriched {len(entity_urls)} {entity_type} with URLs")

            # Build response with entity_urls for LLM
            response_data = {
                "entity_type": entity_type,
                "items": items,
                "count": len(items),
            }

            # Add entity_urls list if we have any
            if entity_urls:
                response_data["entity_urls"] = entity_urls

            return PlaneToolBase.format_success_payload(
                f"Listed {len(items)} {entity_type}",
                response_data,
            )

        except Exception as e:
            log.error(f"Failed to list {entity_type}: {str(e)}")
            return PlaneToolBase.format_error_payload(
                f"Failed to list {entity_type}",
                str(e),
            )

    @tool
    async def entity_retrieve(
        entity_type: Literal[
            "projects",
            "initiatives",
            "teamspaces",
            "stickies",
            "customers",
            "workitems",
            "cycles",
            "labels",
            "states",
            "modules",
            "intake",
            "types",
            "activity",
            "comments",
            "links",
            "attachments",
        ],
        entity_id: str = "",
        project_id: Optional[str] = None,
        work_item_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Retrieve a single entity by ID from Plane.

        This unified tool handles retrieval for all entity types.

        Args:
            entity_type: Type of entity to retrieve.
            entity_id: The ID of the entity to retrieve (required).
            project_id: Project ID (required for project-scoped and workitem-scoped entities). Auto-filled from context.
            work_item_id: Work item ID (required for workitem-scoped entities: activity, comments, links, attachments).

        Returns:
            Dict with the retrieved entity data
        """
        if not method_executor:
            return PlaneToolBase.format_error_payload(
                "SDK method executor not available",
                "OAuth authorization required to use this tool",
            )

        # Validate entity_id
        if not entity_id:
            return PlaneToolBase.format_error_payload(
                "entity_id is required",
                "Provide the ID of the entity to retrieve",
            )

        # Validate entity_type
        if entity_type not in ENTITY_RETRIEVE_CONFIG:
            return PlaneToolBase.format_error_payload(
                f"Invalid entity_type: {entity_type}",
                f"Valid entity types: {", ".join(RETRIEVE_ENTITY_TYPES)}",
            )

        category, method, container_type, id_param_name = ENTITY_RETRIEVE_CONFIG[entity_type]

        # Auto-fill from context
        workspace_slug = context.get("workspace_slug")

        if project_id is None and context.get("project_id"):
            project_id = str(context["project_id"])

        # Validate workspace_slug
        if not workspace_slug:
            return PlaneToolBase.format_error_payload(
                "workspace_slug is required",
                "Context is missing workspace_slug",
            )

        workspace_slug = str(workspace_slug)

        # For project-scoped and workitem-scoped entities, project_id is required
        requires_project = container_type in ["project", "workitem"]

        # For workitem-scoped entities, try to auto-resolve project_id from work_item_id
        if container_type == "workitem":
            if not work_item_id:
                return PlaneToolBase.format_error_payload(
                    f"work_item_id is required for retrieving {entity_type}",
                    f"Provide work_item_id to retrieve {entity_type} for a specific work item",
                )

            # Auto-resolve project_id from work_item_id if needed
            # Trigger if project_id is missing OR if it's not a valid UUID
            should_resolve_project = False
            if not project_id:
                should_resolve_project = True
            elif project_id:
                try:
                    uuid.UUID(str(project_id))
                except (ValueError, AttributeError):
                    should_resolve_project = True

            if should_resolve_project:
                try:
                    from pi.app.api.v1.helpers.plane_sql_queries import get_issue_identifier_for_artifact

                    issue_info = await get_issue_identifier_for_artifact(str(work_item_id))
                    if issue_info and issue_info.get("project_id"):
                        project_id = issue_info["project_id"]
                except Exception as e:
                    log.debug(f"Could not auto-resolve project_id from work_item_id: {e}")

        # For "projects" entity type, the entity_id IS the project_id
        if entity_type == "projects":
            # No separate project_id needed; the entity_id is the project_id
            requires_project = False

            # Pre-handler: Validate project_id is a real UUID, not a placeholder
            # (Ported from projects.py _project_pre_handler)
            if "<id of" in entity_id:
                return PlaneToolBase.format_error_payload(
                    "Invalid project_id: received a placeholder",
                    f"Resolve a real UUID using search_project_by_name or search_project_by_identifier "
                    f"before calling entity_retrieve. project_id={entity_id}",
                )

            _uuid_regex = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
            if not _uuid_regex.match(entity_id):
                return PlaneToolBase.format_error_payload(
                    "Invalid project_id format: expected UUID",
                    f"Use search_project_by_name or search_project_by_identifier to resolve the UUID, " f"then retry. project_id={entity_id}",
                )

        if requires_project and not project_id:
            return PlaneToolBase.format_error_payload(
                f"project_id is required for retrieving {entity_type}",
                "Provide project_id parameter or ensure project context is available",
            )

        try:
            # Build params
            params: Dict[str, Any] = {"workspace_slug": workspace_slug}

            # Add the entity's primary ID parameter
            params[id_param_name] = entity_id

            # Add project_id for project-scoped and workitem-scoped entities
            if requires_project:
                params["project_id"] = project_id

            # Add work_item_id (as issue_id) for workitem-scoped entities
            if container_type == "workitem":
                params["issue_id"] = work_item_id

            # Call SDK method
            result = await method_executor.execute(category, method, **params)

            # Check for execution errors
            if isinstance(result, dict) and result.get("success") is False:
                error_msg = result.get("error", "Unknown error")
                return PlaneToolBase.format_error_payload(
                    f"Failed to retrieve {entity_type}",
                    error_msg,
                )

            # Unwrap executor wrapper
            data = result
            if isinstance(result, dict) and "success" in result and "data" in result:
                data = result["data"]

            # ====================================================================
            # URL ENRICHMENT
            # ====================================================================
            entity_url = None

            if isinstance(data, dict):
                # For workitems, enrich with identifier
                if entity_type == "workitems":
                    await _enrich_with_workitem_identifiers([data], workspace_slug)

                entity_url = _construct_entity_url(
                    item=data,
                    entity_type=entity_type,
                    workspace_slug=workspace_slug,
                    project_id=project_id,
                )

                # Add URL directly to data for convenience
                if entity_url and "url" not in data:
                    data["url"] = entity_url["url"]

            # Build response
            response_data: Dict[str, Any] = {
                "entity_type": entity_type,
                "data": data,
            }

            if entity_url:
                response_data["entity_url"] = entity_url

            return PlaneToolBase.format_success_payload(
                f"Retrieved {entity_type} {entity_id}",
                response_data,
            )

        except Exception as e:
            log.error(f"Failed to retrieve {entity_type} {entity_id}: {str(e)}")
            return PlaneToolBase.format_error_payload(
                f"Failed to retrieve {entity_type}",
                str(e),
            )

    # ====================================================================
    # ENTITY SEARCH TOOL
    # ====================================================================

    async def _normalize_project_id(project_id: Optional[str], workspace_slug: Optional[str]) -> Optional[str]:
        """Return UUID string for project_id; if an identifier is provided, resolve it using workspace scope."""
        if not project_id:
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
            params: list = [str(project_id)]
            if workspace_slug:
                query += " AND w.slug = $2"
                params.append(workspace_slug)
            query += " LIMIT 1"
            row = await PlaneDBPool.fetchrow(query, tuple(params))
            return str(row["id"]) if row else None

    @tool
    async def entity_search(
        entity_type: Literal[
            "projects",
            "workitems",
            "cycles",
            "modules",
            "labels",
            "states",
            "users",
        ],
        search_mode: Literal[
            "by_name",
            "by_identifier",
            "list_member",
            "current",
            "recent",
        ] = "by_name",
        name: Optional[str] = None,
        identifier: Optional[str] = None,
        display_name: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        project_id: Optional[str] = None,
        workspace_slug: Optional[str] = None,
        count: Optional[int] = None,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Search for entities by name, identifier, or other criteria to resolve IDs.

        Use this tool BEFORE other tools when you need to resolve a human-readable name
        or identifier to a UUID. For example, resolve a project name to its UUID before
        listing work items in that project.

        Supported combinations:
        - projects + by_name: Search project by name. Provide `name`.
        - projects + by_identifier: Search project by short code (e.g., 'HYDR'). Provide `identifier`.
        - projects + list_member: List projects the current user belongs to. No extra params needed.
        - workitems + by_name: Search work item by name. Provide `name`, optionally `project_id`.
        - workitems + by_identifier: Search work item by identifier (e.g., 'WEB-821') or UUID. Provide `identifier`.
        - cycles + by_name: Search cycle by name. Provide `name`, optionally `project_id`.
        - cycles + current: Find the currently active cycle. Provide `project_id`.
        - cycles + recent: List recent cycles. Optionally provide `count` (default 3), `status` ('completed'|'active'|'upcoming').
        - modules + by_name: Search module by name. Provide `name`, optionally `project_id`.
        - labels + by_name: Search label by name. Provide `name`, optionally `project_id`.
        - states + by_name: Search state by name. Provide `name`, optionally `project_id`.
        - users + by_name: Search user by name. Provide `display_name`, or `first_name`/`last_name`.

        Args:
            entity_type: Type of entity to search for.
            search_mode: How to search. Default 'by_name'.
            name: Name to search for (for by_name mode on non-user entities).
            identifier: Identifier to search for (for by_identifier mode).
            display_name: User display name (for users + by_name).
            first_name: User first name (for users + by_name).
            last_name: User last name (for users + by_name).
            project_id: Project scope (auto-filled from context). Required for project-scoped entities.
            workspace_slug: Workspace scope (auto-filled from context).
            count: Number of results for 'recent' mode (default 3).
            status: Filter status for 'recent' mode ('completed'|'active'|'upcoming').

        Returns:
            Dict with search results including IDs for use in subsequent tool calls.
        """
        # Auto-fill from context
        if workspace_slug is None and context.get("workspace_slug"):
            workspace_slug = str(context["workspace_slug"])
        if project_id is None and context.get("project_id"):
            project_id = str(context["project_id"])
        user_id = context.get("user_id")
        workspace_id = context.get("workspace_id")

        # Validate search_mode against entity_type
        valid_modes = {
            "projects": ["by_name", "by_identifier", "list_member"],
            "workitems": ["by_name", "by_identifier"],
            "cycles": ["by_name", "current", "recent"],
            "modules": ["by_name"],
            "labels": ["by_name"],
            "states": ["by_name"],
            "users": ["by_name"],
        }

        if search_mode not in valid_modes.get(entity_type, []):
            return PlaneToolBase.format_error_payload(
                f"Invalid search_mode '{search_mode}' for entity_type '{entity_type}'",
                f"Valid search modes for {entity_type}: {", ".join(valid_modes.get(entity_type, []))}",
            )

        try:
            # ================================================================
            # PROJECTS
            # ================================================================
            if entity_type == "projects":
                if search_mode == "by_name":
                    if not name:
                        return PlaneToolBase.format_error_payload(
                            "name is required for project search by name",
                            "Provide the project name to search for",
                        )
                    from pi.app.api.v1.helpers.plane_sql_queries import search_project_by_name as _search_project_by_name

                    results = await _search_project_by_name(name, workspace_slug, member_id=user_id)
                    if results:
                        projects = list(results)
                        data: Dict[str, Any] = {
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
                        if len(projects) > 1:
                            message = f"MULTIPLE MATCHES: Found {len(projects)} projects matching '{name}'. Clarification needed to select the correct project."  # noqa: E501
                        else:
                            message = f"Found 1 project matching '{name}'"
                        return PlaneToolBase.format_success_payload(message, data)
                    else:
                        return PlaneToolBase.format_success_payload(f"No project found with name '{name}'", "Not found")

                elif search_mode == "by_identifier":
                    if not identifier:
                        return PlaneToolBase.format_error_payload(
                            "identifier is required for project search by identifier",
                            "Provide the project identifier (e.g., 'HYDR') to search for",
                        )
                    query = """
                        SELECT p.id, p.name, p.workspace_id, p.identifier
                        FROM projects p
                        JOIN workspaces w ON p.workspace_id = w.id
                        WHERE p.identifier = $1
                        AND p.deleted_at IS NULL
                    """
                    params: list = [identifier]
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

                elif search_mode == "list_member":
                    if not workspace_id or not user_id:
                        return PlaneToolBase.format_error_payload(
                            "Failed to list projects",
                            "Missing workspace_id/user_id in context",
                        )
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
                    rows = await PlaneDBPool.fetch(query, (uuid.UUID(str(workspace_id)), uuid.UUID(str(user_id)), int(count or 50)))
                    projects = [
                        {
                            "id": str(r["id"]),
                            "name": r["name"],
                            "identifier": r.get("identifier"),
                            "type": "project",
                        }
                        for r in rows
                    ]
                    return PlaneToolBase.format_success_payload(
                        "Successfully retrieved member projects",
                        {"projects": projects, "count": len(projects)},
                    )

            # ================================================================
            # WORKITEMS
            # ================================================================
            elif entity_type == "workitems":
                if search_mode == "by_name":
                    if not name:
                        return PlaneToolBase.format_error_payload(
                            "name is required for work item search by name",
                            "Provide the work item name to search for",
                        )
                    project_id = await _normalize_project_id(project_id, workspace_slug)
                    from pi.app.api.v1.helpers.plane_sql_queries import search_workitem_by_name as _search_workitem_by_name

                    result = await _search_workitem_by_name(name, project_id, workspace_slug)
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

                elif search_mode == "by_identifier":
                    if not identifier:
                        return PlaneToolBase.format_error_payload(
                            "identifier is required for work item search by identifier",
                            "Provide the work item identifier (e.g., 'WEB-821') to search for",
                        )
                    from pi.app.api.v1.helpers.plane_sql_queries import search_workitem_by_identifier as _search_workitem_by_identifier

                    result = await _search_workitem_by_identifier(identifier, workspace_slug)
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

            # ================================================================
            # CYCLES
            # ================================================================
            elif entity_type == "cycles":
                if search_mode == "by_name":
                    if not name:
                        return PlaneToolBase.format_error_payload(
                            "name is required for cycle search by name",
                            "Provide the cycle name to search for",
                        )
                    project_id = await _normalize_project_id(project_id, workspace_slug)
                    from pi.app.api.v1.helpers.plane_sql_queries import search_cycle_by_name as _search_cycle_by_name

                    result = await _search_cycle_by_name(name, project_id, workspace_slug)
                    if result:
                        response_data: Dict[str, Any] = {
                            "id": result["id"],
                            "name": result["name"],
                            "project_id": result["project_id"],
                        }
                        if result.get("start_date"):
                            response_data["start_date"] = result["start_date"]
                        if result.get("end_date"):
                            response_data["end_date"] = result["end_date"]
                        return PlaneToolBase.format_success_payload(f"Found cycle '{name}'", response_data)
                    else:
                        return PlaneToolBase.format_success_payload(f"No cycle found with name '{name}'", "Not found")

                elif search_mode == "current":
                    if not project_id:
                        return PlaneToolBase.format_error_payload(
                            "project_id is required to search for current cycle",
                            "Provide project_id or ensure project context is available",
                        )
                    normalized_pid = await _normalize_project_id(project_id, workspace_slug)
                    if not normalized_pid:
                        return PlaneToolBase.format_error_payload(
                            "Failed to resolve project_id for current cycle search",
                            "Could not resolve the provided project_id",
                        )
                    from pi.app.api.v1.helpers.plane_sql_queries import search_current_cycle as _search_current_cycle

                    results = await _search_current_cycle(normalized_pid, workspace_slug)
                    if results:
                        from pi.services.chat.helpers.url_builder import build_entity_url

                        cycles_data = []
                        cycle_names = []
                        for r in results:
                            cycle_data: Dict[str, Any] = {
                                "id": r["id"],
                                "name": r["name"],
                                "project_id": r["project_id"],
                                "start_date": r.get("start_date"),
                                "end_date": r.get("end_date"),
                                "is_current": True,
                            }
                            ws_slug = r.get("workspace_slug") or workspace_slug
                            if ws_slug and r.get("project_id") and r.get("id"):
                                cycle_url = build_entity_url(
                                    "cycle",
                                    ws_slug,
                                    entity_id=str(r["id"]),
                                    project_id=str(r["project_id"]),
                                )
                                if cycle_url:
                                    cycle_data["url"] = cycle_url
                            cycles_data.append(cycle_data)
                            cycle_names.append(r["name"])

                        if len(results) == 1:
                            message = f"Found current active cycle: '{cycle_names[0]}'"
                            if cycles_data[0].get("url"):
                                message += f"\nCycle URL: {cycles_data[0]["url"]}"
                            resp_data = cycles_data[0]
                        else:
                            cycle_names_str = ", ".join([f"'{n}'" for n in cycle_names])
                            message = f"Found {len(results)} current active cycles: {cycle_names_str}"
                            resp_data = {"cycles": cycles_data, "count": len(results)}
                        return PlaneToolBase.format_success_payload(message, resp_data)
                    else:
                        return PlaneToolBase.format_success_payload(
                            "No current active cycle found",
                            "No cycle is active today (no cycle where today falls between start_date and end_date)",
                        )

                elif search_mode == "recent":
                    project_id = await _normalize_project_id(project_id, workspace_slug)
                    resolved_workspace_id: Optional[str] = None
                    if not project_id and workspace_slug:
                        row = await PlaneDBPool.fetchrow("SELECT id FROM workspaces WHERE slug = $1", (workspace_slug,))
                        resolved_workspace_id = str(row["id"]) if row else None
                    if not project_id and not resolved_workspace_id:
                        return PlaneToolBase.format_error_payload(
                            "Failed to list recent cycles",
                            "Missing project context; provide project_id or ensure project chat context",
                        )
                    from pi.app.api.v1.helpers.plane_sql_queries import list_recent_cycles as _list_recent_cycles

                    rows = await _list_recent_cycles(
                        project_id=project_id,
                        workspace_id=resolved_workspace_id,
                        limit=int(count or 3),
                        status=status or "completed",
                    )
                    resp: Dict[str, Any] = {"cycles": rows, "count": len(rows)}
                    if rows:
                        resp["last_cycle_id"] = rows[0]["id"]
                    return PlaneToolBase.format_success_payload("Successfully retrieved recent cycles", resp)

            # ================================================================
            # MODULES
            # ================================================================
            elif entity_type == "modules":
                if not name:
                    return PlaneToolBase.format_error_payload(
                        "name is required for module search",
                        "Provide the module name to search for",
                    )
                project_id = await _normalize_project_id(project_id, workspace_slug)
                from pi.app.api.v1.helpers.plane_sql_queries import search_module_by_name as _search_module_by_name

                result = await _search_module_by_name(name, project_id, workspace_slug)
                if result:
                    return PlaneToolBase.format_success_payload(
                        f"Found module '{name}'",
                        {"id": result["id"], "name": result["name"], "project_id": result["project_id"]},
                    )
                else:
                    return PlaneToolBase.format_success_payload(f"No module found with name '{name}'", "Not found")

            # ================================================================
            # LABELS
            # ================================================================
            elif entity_type == "labels":
                if not name:
                    return PlaneToolBase.format_error_payload(
                        "name is required for label search",
                        "Provide the label name to search for",
                    )
                project_id = await _normalize_project_id(project_id, workspace_slug)
                from pi.app.api.v1.helpers.plane_sql_queries import search_label_by_name as _search_label_by_name

                result = await _search_label_by_name(name, project_id, workspace_slug)
                if result:
                    return PlaneToolBase.format_success_payload(
                        f"Found label '{name}'",
                        {"id": result["id"], "name": result["name"], "project_id": result["project_id"]},
                    )
                else:
                    return PlaneToolBase.format_success_payload(f"No label found with name '{name}'", "Not found")

            # ================================================================
            # STATES
            # ================================================================
            elif entity_type == "states":
                if not name:
                    return PlaneToolBase.format_error_payload(
                        "name is required for state search",
                        "Provide the state name to search for",
                    )
                project_id = await _normalize_project_id(project_id, workspace_slug)
                from pi.app.api.v1.helpers.plane_sql_queries import search_state_by_name as _search_state_by_name

                result = await _search_state_by_name(name, project_id, workspace_slug)
                if result:
                    return PlaneToolBase.format_success_payload(
                        f"Found state '{name}'",
                        {"id": result["id"], "name": result["name"], "project_id": result["project_id"]},
                    )
                else:
                    return PlaneToolBase.format_success_payload(f"No state found with name '{name}'", "Not found")

            # ================================================================
            # USERS
            # ================================================================
            elif entity_type == "users":
                if not any([display_name, first_name, last_name]):
                    return PlaneToolBase.format_error_payload(
                        "At least one of display_name, first_name, or last_name must be provided",
                        "Provide a name to search for",
                    )

                # Smart name splitting (ported from entity_search.py)
                _display_name = display_name
                _first_name = first_name
                _last_name = last_name
                if _display_name and not _first_name and not _last_name:
                    dn = str(_display_name).strip()
                    if "," in dn:
                        parts = [p.strip() for p in dn.split(",", 1)]
                        if len(parts) == 2 and parts[0] and parts[1]:
                            _last_name = parts[0]
                            _first_name = parts[1]
                    else:
                        tokens = [t for t in dn.split() if t]
                        if len(tokens) >= 2:
                            _first_name = tokens[0]
                            _last_name = " ".join(tokens[1:])
                        else:
                            _first_name = dn
                            _last_name = dn

                project_id = await _normalize_project_id(project_id, workspace_slug)
                from pi.app.api.v1.helpers.plane_sql_queries import search_user_by_name as _search_user_by_name

                user_results = await _search_user_by_name(
                    display_name=_display_name,
                    workspace_slug=workspace_slug,
                    project_id=project_id,
                    first_name=_first_name,
                    last_name=_last_name,
                )
                if user_results:
                    users_data: Dict[str, Any] = {
                        "total_matches": len(user_results),
                        "users": [
                            {
                                "id": user["id"],
                                "display_name": user["display_name"],
                                "first_name": user["first_name"],
                                "last_name": user["last_name"],
                                "email": user["email"],
                            }
                            for user in user_results
                        ],
                    }
                    if len(user_results) > 1:
                        message = f"MULTIPLE MATCHES: Found {len(user_results)} users matching '{display_name}'. Clarification needed to select the correct user."  # noqa: E501
                    else:
                        message = f"Found 1 user matching '{display_name}'"
                    return PlaneToolBase.format_success_payload(message, users_data)
                else:
                    return PlaneToolBase.format_success_payload(f"No user found with name '{display_name}'", "Not found")

            # Should not reach here
            return PlaneToolBase.format_error_payload(
                f"Unhandled entity_type/search_mode combination: {entity_type}/{search_mode}",
                "This combination is not yet implemented",
            )

        except Exception as e:
            log.error(f"Failed to search {entity_type} (mode={search_mode}): {str(e)}")
            return PlaneToolBase.format_error_payload(
                f"Failed to search {entity_type}",
                str(e),
            )

    return [entity_list, entity_retrieve, entity_search]
