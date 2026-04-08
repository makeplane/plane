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

"""Helper functions for batch action execution."""

from datetime import datetime
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple
from uuid import UUID

from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi.app.schemas.chat import ArtifactData
from pi.services.chat.helpers.build_mode_helpers import TOOL_NAME_TO_CATEGORY_MAP
from pi.services.chat.helpers.tool_utils import classify_tool
from pi.services.retrievers.pg_store.action_artifact import create_action_artifact_version
from pi.services.retrievers.pg_store.action_artifact import get_action_artifacts_by_ids
from pi.services.retrievers.pg_store.action_artifact import update_action_artifact_version_execution_status

log = logger.getChild(__name__)

# Implicit dependency rules for action execution
# Format: (prerequisite_tool, dependent_tool)
# When both tools are present in planned actions, dependent must wait for prerequisite
IMPLICIT_DEPENDENCY_RULES = [
    # Project updates must complete before creating project-scoped features
    # (modules, cycles, pages, worklogs, views, intake all require project feature flags)
    ("projects_update", "modules_create"),
    ("projects_update", "cycles_create"),
    ("projects_update", "worklogs_create"),
    ("projects_update", "pages_create"),
    ("projects_update", "views_create"),
    ("projects_update", "intake_create"),
    # Entity creation must complete before adding items to it
    ("modules_create", "modules_add_work_items"),
    ("cycles_create", "cycles_add_work_items"),
]

# Entity type to ID field mapping for update operations
# Maps entity types to the parameter name used for their ID in update tools
ENTITY_ID_FIELD_MAP = {
    "workitem": "issue_id",
    "epic": "issue_id",
    "cycle": "cycle_id",
    "module": "module_id",
    "project": "project_id",
    "label": "label_id",
    "state": "state_id",
    "comment": "comment_id",
    "attachment": "attachment_id",
    "type": "type_id",
    "property": "property_id",
    "intake": "intake_id",
    "worklog": "worklog_id",
    "link": "link_id",
}


async def validate_and_resolve_ids(tool_args: Dict[str, Any], workspace_slug: Optional[str] = None) -> Dict[str, Any]:
    """
    Validate and resolve issue_id and project_id parameters before tool execution.

    Handles two cases:
    1. issue_id as work item identifier (e.g., 'CARB-1') instead of UUID
    2. project_id as non-UUID value (e.g., project identifier, URL, etc.)

    Args:
        tool_args: Tool arguments from planned action
        workspace_slug: Workspace context for lookups

    Returns:
        Updated tool_args with resolved UUIDs
    """
    import uuid as uuid_module

    resolved_args = tool_args.copy()
    issue_id = resolved_args.get("issue_id")
    project_id = resolved_args.get("project_id")

    # Step 1: Validate and resolve issue_id if it's a work item identifier (e.g., CARB-1)
    if issue_id:
        try:
            uuid_module.UUID(str(issue_id))
            # issue_id is already a valid UUID, no need to resolve
        except (ValueError, AttributeError):
            # issue_id is not a UUID, might be an identifier like CARB-1
            # Try to resolve it using search_workitem_by_identifier
            try:
                from pi.app.api.v1.helpers.plane_sql_queries import search_workitem_by_identifier

                workitem_info = await search_workitem_by_identifier(str(issue_id), workspace_slug)
                if workitem_info and workitem_info.get("id"):
                    log.debug(f"Resolved issue_id identifier '{issue_id}' to UUID: {workitem_info["id"]}")
                    resolved_args["issue_id"] = str(workitem_info["id"])  # Convert to string

                    # Also resolve project_id from workitem if not already set
                    if not project_id and workitem_info.get("project_id"):
                        resolved_args["project_id"] = str(workitem_info["project_id"])  # Convert to string
                        log.debug(f"Auto-resolved project_id from workitem: {workitem_info["project_id"]}")

            except Exception as e:
                log.warning(f"Failed to resolve issue_id '{issue_id}' from identifier: {e}")

    # Step 2: Validate and resolve project_id if it's not a valid UUID
    # Only resolve if we have an issue_id to resolve from
    if issue_id and project_id:
        try:
            uuid_module.UUID(str(project_id))
            # project_id is a valid UUID, no need to resolve
        except (ValueError, AttributeError):
            # project_id is not a UUID (might be URL, identifier, etc.)
            # Resolve from issue_id
            if resolved_args.get("issue_id"):  # Use potentially resolved issue_id
                try:
                    from pi.app.api.v1.helpers.plane_sql_queries import get_issue_identifier_for_artifact

                    issue_info = await get_issue_identifier_for_artifact(str(resolved_args["issue_id"]))
                    if issue_info and issue_info.get("project_id"):
                        log.debug(f"Resolved invalid project_id '{project_id}' to UUID: {issue_info["project_id"]}")
                        resolved_args["project_id"] = str(issue_info["project_id"])  # Convert to string
                except Exception as e:
                    log.warning(f"Failed to resolve project_id from issue_id: {e}")
    elif issue_id and not project_id:
        # project_id missing entirely, try to resolve from issue_id
        if resolved_args.get("issue_id"):
            try:
                from pi.app.api.v1.helpers.plane_sql_queries import get_issue_identifier_for_artifact

                issue_info = await get_issue_identifier_for_artifact(str(resolved_args["issue_id"]))
                if issue_info and issue_info.get("project_id"):
                    log.debug(f"Resolved missing project_id from issue_id: {issue_info["project_id"]}")
                    resolved_args["project_id"] = str(issue_info["project_id"])  # Convert to string
            except Exception as e:
                log.warning(f"Failed to resolve missing project_id from issue_id: {e}")

    return resolved_args


def extract_tool_params_from_artifact_data(artifact_data: Dict[str, Any], entity_type: str, action: str) -> Dict[str, Any]:
    """
    Extract tool-compatible parameters from artifact data for execution.

    This is the REVERSE of prepare_edited_workitem_artifact_data:
    - prepare_edited: enriches simple IDs → full objects (for display)
    - extract_tool_params: extracts/renames fields (for execution)

    Args:
        artifact_data: Raw data from frontend (uses artifact schema field names)
        entity_type: Type of entity (workitem, epic, project, etc.)
        action: Action type (create, update, delete)

    Returns:
        Tool-compatible parameters dictionary with renamed fields and unsupported fields removed
    """
    # Field mapping: artifact schema → tool parameter names
    ARTIFACT_TO_TOOL_MAPPING = {
        "assignee_ids": "assignees",
        "label_ids": "labels",
        "parent_id": "parent",
        "state_id": "state",  # SDK adapter handles state_id internally
        "lead_id": "lead",  # Module lead
        "member_ids": "members",  # Module members
        "cover_image_url": "cover_image",
        "logo_props": "logo_props",
        "icon_prop": "icon_prop",
    }

    # Fields that cannot be set during creation (require separate API calls after creation)
    CREATE_UNSUPPORTED_FIELDS = {
        "workitem": {"cycle_id", "module_ids"},
        "epic": {"cycle_id", "module_ids"},
    }

    # Fields that are auto-generated by SDK and should never be sent to any tool
    SDK_AUTO_GENERATED_FIELDS = {"logo_props", "icon_prop", "emoji"}

    # Fields that are project-specific and should not be sent to other entities
    PROJECT_ONLY_FIELDS = {"cover_image"}

    tool_params = {}
    unsupported = CREATE_UNSUPPORTED_FIELDS.get(entity_type, set()) if action == "create" else set()

    # Handle nested properties structure if present
    data_to_process = artifact_data.copy()
    if "properties" in data_to_process and isinstance(data_to_process["properties"], dict):
        # Merge properties into top level for processing
        properties = data_to_process.pop("properties")
        data_to_process.update(properties)

    for key, value in data_to_process.items():
        # Skip None values
        if value is None:
            continue

        # Skip empty lists (but allow empty strings for explicit clearing)
        if isinstance(value, list) and not value:
            continue

        # Skip empty description_html - API rejects empty string, use None instead
        if key == "description_html" and value == "":
            continue

        # Skip empty identifier values (Plane rejects empty identifiers on update)
        if key == "identifier" and isinstance(value, str) and value.strip() == "":
            continue

        # Skip metadata fields that shouldn't be sent to tools
        if key in {"entity_info", "artifact_sub_type"}:
            continue

        # Map artifact field names to tool parameter names FIRST (needed for subsequent checks)
        mapped_key = ARTIFACT_TO_TOOL_MAPPING.get(key, key)

        # Skip SDK auto-generated fields (logo_props, icon_prop, emoji) for all entities
        if key in SDK_AUTO_GENERATED_FIELDS or mapped_key in SDK_AUTO_GENERATED_FIELDS:
            log.debug(f"Skipping SDK auto-generated field '{key}' for {entity_type}")
            continue

        # Skip project-only fields for non-project entities
        if entity_type != "project" and (key in PROJECT_ONLY_FIELDS or mapped_key in PROJECT_ONLY_FIELDS):
            log.debug(f"Skipping project-only field '{key}' for {entity_type}")
            continue

        # Filter unsupported fields for this entity type and action
        if key in unsupported:
            log.warning(f"Field '{key}' cannot be set during {entity_type} {action}, skipping")
            continue

        if mapped_key == "project_lead" and isinstance(value, dict) and value.get("id"):
            value = value["id"]

        tool_params[mapped_key] = value

    log.debug(f"Extracted tool params for {entity_type} {action}: {list(tool_params.keys())}")
    return tool_params


async def load_artifacts(
    request_data: List[ArtifactData],
    db: AsyncSession,
    message_id: Optional[UUID] = None,
    chat_id: Optional[UUID] = None,
) -> Tuple[List[Dict], str, str]:
    """Load and validate artifacts for execution.

    When is_edited=True, creates an ActionArtifactVersion to persist the edited data.
    """
    artifacts = await get_action_artifacts_by_ids(db, [a.artifact_id for a in request_data])

    # Create artifact ID lookup map to ensure correct pairing regardless of database return order
    artifact_map = {str(artifact.id): artifact for artifact in artifacts}

    if not artifacts:
        raise ValueError("No artifacts found for execution")

    # Get planning context from first artifact (shared across all artifacts in the batch)
    first_artifact = artifacts[0]
    original_query = first_artifact.data.get("planning_context", {}).get("original_query", "")
    conversation_context = first_artifact.data.get("planning_context", {}).get("conversation_context", {})

    # Extract workspace_slug from conversation_context for ID resolution
    workspace_slug = conversation_context.get("workspace_slug")

    planned_actions = []
    for req_item in request_data:
        # Match request item to its artifact by ID (critical for correct parameter extraction)
        artifact = artifact_map.get(str(req_item.artifact_id))
        if not artifact:
            log.error(f"Artifact {req_item.artifact_id} not found in loaded artifacts - skipping")
            continue

        entity_type = artifact.data.get("planning_data", {}).get("artifact_type", "")
        action = artifact.data.get("planning_data", {}).get("action", "")

        if req_item.is_edited:
            # Transform edited artifact data from frontend schema to tool parameters
            tool_args = extract_tool_params_from_artifact_data(req_item.action_data or {}, entity_type, action)

            # Get original tool args for preserving context fields
            original_tool_args = artifact.data.get("tool_args_raw", {})

            # PRESERVE CONTEXT FIELDS for all actions (these are never editable but required for execution)
            # workspace_slug and project_id are context, not user-editable fields
            if "workspace_slug" in original_tool_args and "workspace_slug" not in tool_args:
                tool_args["workspace_slug"] = original_tool_args["workspace_slug"]
                log.debug(f"Preserved workspace_slug={original_tool_args['workspace_slug']} for {entity_type} {action}")

            if "project_id" in original_tool_args and "project_id" not in tool_args:
                tool_args["project_id"] = original_tool_args["project_id"]
                log.debug(f"Preserved project_id={original_tool_args['project_id']} for {entity_type} {action}")

            # PRESERVE NON-EDITABLE PLANNING PARAMETERS
            # These are planning-time decisions that aren't exposed in the edit UI but are critical for execution
            NON_EDITABLE_PARAMS = {
                # Project feature flags (planning-time decisions)
                "cycle_view",
                "module_view",
                "page_view",
                "intake_view",
                "is_issue_type_enabled",
                "is_time_tracking_enabled",
                "issue_views_view",
                "guest_view_all_features",
                # Project update_features params (must be preserved from plan)
                "epics",
                "modules",
                "cycles",
                "views",
                "pages",
                "intakes",
                "work_item_types",
                # Other planning parameters
                "timezone",
                "archive_in",
                "close_in",
                "external_id",
                "external_source",
                # User/owner assignments that may be auto-set
                "owned_by",
                "project_lead",
                "default_assignee",
            }

            if "time_tracking_enabled" in original_tool_args and "is_time_tracking_enabled" not in tool_args:
                tool_args["is_time_tracking_enabled"] = original_tool_args["time_tracking_enabled"]
                log.debug(
                    "Normalized legacy param time_tracking_enabled=%s to is_time_tracking_enabled for %s %s",
                    original_tool_args["time_tracking_enabled"],
                    entity_type,
                    action,
                )

            for param in NON_EDITABLE_PARAMS:
                if param in original_tool_args and param not in tool_args:
                    tool_args[param] = original_tool_args[param]
                    log.debug(f"Preserved non-editable param {param}={original_tool_args[param]} for {entity_type} {action}")

            # For UPDATE actions, also preserve the entity ID being updated
            # The frontend edits fields but doesn't include the entity ID being updated
            if action == "update":
                # Preserve the entity's ID field (e.g., issue_id, cycle_id, module_id)
                id_field = ENTITY_ID_FIELD_MAP.get(entity_type)
                if id_field and id_field in original_tool_args and id_field not in tool_args:
                    tool_args[id_field] = original_tool_args[id_field]
                    log.debug(f"Preserved {id_field}={original_tool_args[id_field]} for {entity_type} update")
        else:
            # Use original planned tool arguments
            tool_args = artifact.data.get("tool_args_raw", {})

        # CENTRALIZED ID VALIDATION AND RESOLUTION
        # Resolve issue_id (if identifier like CARB-1) and project_id (if invalid UUID) before execution
        tool_args = await validate_and_resolve_ids(tool_args, workspace_slug)

        # Track version_id if we created a version for edited artifact
        version_id = None

        # Create ActionArtifactVersion when artifact was edited to persist the changes
        if req_item.is_edited and message_id and chat_id:
            # Build version data matching parent artifact structure
            version_data = {
                "tool_args_raw": tool_args,
                "planning_data": artifact.data.get("planning_data", {}),
                "planning_context": artifact.data.get("planning_context", {}),
            }

            version = await create_action_artifact_version(
                db=db,
                artifact_id=artifact.id,
                data=version_data,
                change_type="manual_edit",
                chat_id=chat_id,
                message_id=message_id,
            )

            if version:
                version_id = str(version.id)
                log.debug(f"Created ActionArtifactVersion {version_id} for edited artifact {artifact.id}")
            else:
                log.warning(f"Failed to create ActionArtifactVersion for edited artifact {artifact.id}")

        planned_actions.append(
            {
                "artifact_id": str(artifact.id),
                "tool_name": artifact.data.get("planning_data", {}).get("tool_name", ""),
                "args": tool_args,
                "entity_type": entity_type,
                "action": action,
                "version_id": version_id,  # Track version for execution status update
                "planning_data": artifact.data.get("planning_data", {}),  # Include for MCP raw_tool_name
            }
        )

    return planned_actions, original_query, conversation_context


async def update_flow_steps(results, message_id, chat_id, db: AsyncSession):
    """Mark executed actions in database.

    Also updates ActionArtifactVersion execution status if version_id is present.
    """
    from pi.services.retrievers.pg_store.action_artifact import update_action_artifact_execution_status

    for r in results:
        artifact_id = r.get("artifact_id")
        if artifact_id:
            artifact_uuid = UUID(artifact_id)

            # Extract entity_id from entity_info if available
            entity_info = r.get("entity_info")
            entity_id = None
            if entity_info and isinstance(entity_info, dict):
                # Try to get entity_id from entity_info
                entity_id_str = entity_info.get("entity_id")
                if entity_id_str:
                    try:
                        entity_id = UUID(entity_id_str)
                    except (ValueError, TypeError):
                        log.warning(f"Invalid entity_id format in entity_info: {entity_id_str}")

            # For failed MCP actions, persist the error message into entity_info
            # so the artifacts list API can surface it later.
            if not r.get("success") and r.get("artifact_type") == "mcp":
                error_msg = r.get("message") or r.get("result") or r.get("error") or ""
                if error_msg:
                    if entity_info and isinstance(entity_info, dict):
                        entity_info = {**entity_info, "error": error_msg}
                    else:
                        entity_info = {"error": error_msg}

            execution_result = r.get("result", "") or r.get("message", "")
            await update_action_artifact_execution_status(
                db=db,
                message_id=message_id,
                chat_id=chat_id,
                artifact_id=artifact_uuid,
                is_executed=True,
                success=r.get("success", False),
                entity_id=entity_id,
                entity_info=entity_info,
                execution_result=execution_result,
                executed_at=r.get("executed_at"),
            )

            # Update ActionArtifactVersion execution status if this was an edited artifact
            version_id = r.get("version_id")
            if version_id:
                try:
                    version_uuid = UUID(version_id)
                    await update_action_artifact_version_execution_status(
                        db=db,
                        version_id=version_uuid,
                        is_executed=True,
                        success=r.get("success", False),
                        entity_info=entity_info,
                    )
                    log.debug(f"Updated ActionArtifactVersion {version_id} execution status: success={r.get("success", False)}")
                except (ValueError, TypeError) as e:
                    log.warning(f"Invalid version_id format: {version_id}, error: {e}")


def format_response(planned_actions, results, start_time) -> Dict[str, Any]:
    """Format the execution response with clean, non-redundant structure."""
    log.debug(f"\n\nResults in format_response: {results}\n")
    try:
        total_planned = len(planned_actions)
        completed_count = sum(1 for r in results if r.get("success"))
        failed_count = sum(1 for r in results if r.get("success") is False)
        response: Dict[str, Any] = {
            "action_summary": {
                "total_planned": total_planned,
                "completed": completed_count,
                "failed": failed_count,
                "duration_seconds": round((datetime.utcnow() - start_time).total_seconds(), 2),
            },
        }

        if results:
            response["actions"] = create_clean_actions_response(results)

        log.debug(f"\n\nRESPONSE: {response}\n\n")

        return response

    except Exception as e:
        log.error(f"Error formatting execution response: {e}")
        return {
            "action_summary": {
                "total_planned": len(planned_actions),
                "completed": 0,
                "failed": len(planned_actions),
                "duration_seconds": round((datetime.utcnow() - start_time).total_seconds(), 2),
            },
            "actions": [],
        }


def create_clean_actions_response(executed_actions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Create clean action results without duplicate entity information.

    Filters out retrieval/search tools and only includes actual modifying actions.
    """

    clean_actions = []

    log.debug(f"\n\nEXECUTED ACTIONS in create_clean_actions_response: {executed_actions}\n\n")

    for action in executed_actions:
        # Extract action from tool name (e.g., "workitems_create" -> "create")
        tool_name = action.get("tool_name", "")

        # Filter out retrieval tools - only show actual actions to frontend
        # BUT never filter MCP tools: they were explicitly planned/approved in build mode
        if tool_name and action.get("artifact_type") != "mcp":
            is_retrieval, is_action = classify_tool(tool_name)
            if is_retrieval and not is_action:
                log.debug(f"Filtering out retrieval tool from actions response: {tool_name}")
                continue

        # For MCP/external tools, use action field directly from ExecutionResult
        # For Plane tools, use TOOL_NAME_TO_CATEGORY_MAP
        action_type = action.get("action") or TOOL_NAME_TO_CATEGORY_MAP.get(tool_name, {}).get("action_type", "")

        action_data = {
            "action": action_type,
            "artifact_type": action.get("artifact_type"),
            "success": action.get("success"),
            "executed_at": action.get("executed_at"),
            "artifact_id": action.get("artifact_id"),  # NEW: Include artifact ID
            "sequence": action.get("sequence"),  # NEW: Include planned step order
            "version_number": action.get("version_number"),  # NEW: Include version sequence number
        }

        if action.get("success"):
            # For successful actions, include essential entity info
            entity_info = action.get("entity_info")
            if entity_info and isinstance(entity_info, dict):
                # Only include the most important entity fields
                essential_entity = {}
                for field in ["entity_url", "entity_name", "entity_type", "entity_id"]:
                    if field in entity_info and entity_info[field]:
                        essential_entity[field] = entity_info[field]

                # Include issue_identifier when available (for work-items)
                if entity_info.get("issue_identifier"):
                    essential_entity["issue_identifier"] = entity_info["issue_identifier"]

                if essential_entity:
                    action_data["entity"] = essential_entity

                # Add project_identifier at the action root when derivable
                project_identifier = None
                try:
                    # Prefer deriving from identifiers present in entity_info
                    if entity_info.get("entity_type") == "project":
                        project_identifier = entity_info.get("entity_identifier") or entity_info.get("project_identifier")
                    elif entity_info.get("issue_identifier") and isinstance(entity_info.get("issue_identifier"), str):
                        ident = entity_info.get("issue_identifier")
                        if "-" in ident:
                            project_identifier = ident.split("-", 1)[0]
                    elif entity_info.get("entity_url") and isinstance(entity_info.get("entity_url"), str):
                        url = entity_info.get("entity_url")
                        # Attempt to parse /browse/PROJECT-SEQ/ pattern
                        if "/browse/" in url:
                            after = url.split("/browse/", 1)[1]
                            ident = after.split("/", 1)[0]
                            if "-" in ident:
                                project_identifier = ident.split("-", 1)[0]
                except Exception:
                    project_identifier = None

                if project_identifier:
                    action_data["project_identifier"] = project_identifier

            result = action.get("result", "") or action.get("message", "")
            if result:
                # Extract the nice message that comes after "✅ " and before "\n\n"
                nice_message = extract_success_message(result)
                if nice_message:
                    action_data["message"] = nice_message
                else:
                    # Fallback to generic messages
                    if "created" in result.lower():
                        action_data["message"] = "Created successfully"
                    elif "updated" in result.lower():
                        action_data["message"] = "Updated successfully"
                    else:
                        action_data["message"] = "Action completed successfully"
        else:
            # For failed MCP actions, also include entity info (entity_name + entity_type)
            # so the caller knows which connector/tool failed.
            if action.get("artifact_type") == "mcp":
                entity_info = action.get("entity_info")
                if entity_info and isinstance(entity_info, dict):
                    essential_entity = {}
                    for field in ["entity_url", "entity_name", "entity_type", "entity_id"]:
                        if field in entity_info and entity_info[field]:
                            essential_entity[field] = entity_info[field]
                    # Combine entity_name + entity_type (e.g. "Supaseb create_project")
                    if essential_entity.get("entity_name") and essential_entity.get("entity_type"):
                        essential_entity["entity_name"] = f"{essential_entity['entity_name']} {essential_entity['entity_type']}"
                    if essential_entity:
                        action_data["entity"] = essential_entity

            # For failed actions, send user-friendly message in error field.
            # MCP ExecutionResult stores the error in "message"; Plane tools use "result".
            result = action.get("result", "")
            if result:
                # Use the user-friendly message (e.g., "❌ Failed to create module")
                action_data["error"] = result
            else:
                # Fallback: MCP errors are stored in the "message" field of ExecutionResult
                msg = action.get("message", "")
                if msg:
                    action_data["error"] = msg
                else:
                    error = action.get("error", "")
                    if error:
                        action_data["error"] = error[:100] + "..." if len(error) > 100 else error

        clean_actions.append(action_data)

    return clean_actions


def extract_success_message(result: str) -> str:
    """Extract the nice success message from the tool result."""
    if not result or not isinstance(result, str):
        return ""

    # Look for the pattern: "✅ [message]\n\n"
    if "✅" in result:
        lines = result.split("\n")
        for line in lines:
            line = line.strip()
            if line.startswith("✅"):
                # Remove the "✅ " prefix and return the message
                message = line[2:].strip()  # Remove "✅ " (2 characters)
                return message

    return ""
