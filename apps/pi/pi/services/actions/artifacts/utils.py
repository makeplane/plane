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

import asyncio
import uuid
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from pi import logger
from pi.app.api.v1.helpers.plane_sql_queries import get_comment_details_for_artifact
from pi.app.api.v1.helpers.plane_sql_queries import get_cycle_details_for_artifact
from pi.app.api.v1.helpers.plane_sql_queries import get_cycle_name
from pi.app.api.v1.helpers.plane_sql_queries import get_issue_identifier_for_artifact
from pi.app.api.v1.helpers.plane_sql_queries import get_label_details_for_artifact
from pi.app.api.v1.helpers.plane_sql_queries import get_label_name
from pi.app.api.v1.helpers.plane_sql_queries import get_module_details_for_artifact
from pi.app.api.v1.helpers.plane_sql_queries import get_module_name
from pi.app.api.v1.helpers.plane_sql_queries import get_page_details_for_artifact
from pi.app.api.v1.helpers.plane_sql_queries import get_project_details_for_artifact
from pi.app.api.v1.helpers.plane_sql_queries import get_state_details_by_id
from pi.app.api.v1.helpers.plane_sql_queries import get_state_details_for_artifact
from pi.app.api.v1.helpers.plane_sql_queries import get_user_name
from pi.app.api.v1.helpers.plane_sql_queries import get_workitem_details_for_artifact
from pi.config import settings
from pi.services.retrievers.pg_store.action_artifact import batch_get_latest_artifact_versions
from pi.services.retrievers.pg_store.action_artifact import get_latest_artifact_data_for_display

log = logger.getChild(__name__)


class FieldType:
    """Constants for different field categories."""

    LIST_RELATIONSHIP = "list_relationship"  # Fields like assignees, labels (list of objects with id/name)
    SINGLE_RELATIONSHIP = "single_relationship"  # Fields like state, priority (single object with id/name)
    DATE_FIELD = "date"  # Date fields (start_date, target_date)
    STRUCTURED_VALUE = "structured"  # Fields with special structure (state, priority)
    SIMPLE_STRING = "simple_string"  # Plain string fields
    ID_ARRAY = "id_array"  # Arrays of IDs (assignee_ids, label_ids)


# Constants for field lists used throughout the module
TOP_LEVEL_FIELDS_CONSTANT = ["name", "description", "project", "project_id", "id"]
SPECIAL_FIELDS_CONSTANT = ["state", "priority"]


# Field configuration mapping - defines how each field should be processed
FIELD_CONFIGS: Dict[str, Dict[str, str]] = {
    # List relationships (arrays of objects with id/name)
    "assignees": {"type": FieldType.LIST_RELATIONSHIP},
    "labels": {"type": FieldType.LIST_RELATIONSHIP},
    "modules": {"type": FieldType.LIST_RELATIONSHIP},
    "cycles": {"type": FieldType.LIST_RELATIONSHIP},
    "members": {"type": FieldType.LIST_RELATIONSHIP},
    # Single relationships (single object with id/name)
    "state": {"type": FieldType.STRUCTURED_VALUE},
    "priority": {"type": FieldType.STRUCTURED_VALUE},
    "parent": {"type": FieldType.SINGLE_RELATIONSHIP},
    "cycle": {"type": FieldType.SINGLE_RELATIONSHIP},
    "module": {"type": FieldType.SINGLE_RELATIONSHIP},
    "owned_by": {"type": FieldType.SINGLE_RELATIONSHIP},
    "lead": {"type": FieldType.SINGLE_RELATIONSHIP},
    # Date fields
    "start_date": {"type": FieldType.DATE_FIELD},
    "target_date": {"type": FieldType.DATE_FIELD},
    "end_date": {"type": FieldType.DATE_FIELD},
    "created_at": {"type": FieldType.DATE_FIELD},
    "updated_at": {"type": FieldType.DATE_FIELD},
    # ID arrays
    "assignee_ids": {"type": FieldType.ID_ARRAY},
    "label_ids": {"type": FieldType.ID_ARRAY},
    "module_ids": {"type": FieldType.ID_ARRAY},
    "cycle_ids": {"type": FieldType.ID_ARRAY},
    "member_ids": {"type": FieldType.ID_ARRAY},
    # Single ID fields (FIXED: Changed from ID_ARRAY to SINGLE_RELATIONSHIP)
    "parent_id": {"type": FieldType.SINGLE_RELATIONSHIP},
    "project_lead_id": {"type": FieldType.SINGLE_RELATIONSHIP},
    "issue_id": {"type": FieldType.SINGLE_RELATIONSHIP},
    "actor_id": {"type": FieldType.SINGLE_RELATIONSHIP},
    # Simple strings
    "name": {"type": FieldType.SIMPLE_STRING},
    "description": {"type": FieldType.SIMPLE_STRING},
    "description_html": {"type": FieldType.SIMPLE_STRING},
}


class FieldProcessor:
    """Utility class for processing field values based on their type."""

    @staticmethod
    def _is_valid_list_relationship(llm_value: Any) -> bool:
        """Helper to validate list relationship items."""
        if not isinstance(llm_value, list) or len(llm_value) == 0:
            return False
        return all(isinstance(item, dict) and item.get("id") for item in llm_value)

    @staticmethod
    def has_meaningful_update(field: str, llm_value: Any) -> bool:
        """Check if LLM provided a meaningful update for a field.

        Design principle: Explicit updates from the LLM are always meaningful, including:
        - Empty arrays [] for clearing list relationships
        - None/null for clearing single relationships and dates
        - Empty strings are NOT meaningful (they're often LLM mistakes)
        """
        config: Dict[str, Any] = FIELD_CONFIGS.get(field, {})
        field_type = config.get("type")

        if field_type == FieldType.LIST_RELATIONSHIP:
            if not isinstance(llm_value, list):
                return False
            if len(llm_value) == 0:
                return True
            return FieldProcessor._is_valid_list_relationship(llm_value)

        elif field_type == FieldType.ID_ARRAY:
            if not isinstance(llm_value, list):
                return False
            return True

        elif field_type == FieldType.SINGLE_RELATIONSHIP:
            if llm_value is None:
                return True
            if not isinstance(llm_value, dict):
                return False
            name = llm_value.get("name")
            return bool(name and name not in ["", "None"])

        elif field_type == FieldType.DATE_FIELD:
            if llm_value is None:
                return True
            return llm_value not in ["", {}]

        elif field_type == FieldType.STRUCTURED_VALUE:
            if field == "state":
                if not isinstance(llm_value, dict):
                    return False
                name = llm_value.get("name")
                return bool(name and name != "Unknown" and llm_value.get("id"))
            elif field == "priority":
                if not isinstance(llm_value, dict):
                    return False
                name = llm_value.get("name")
                return bool(name and name not in ["none", "None", ""])

        # Default check for other field types
        return llm_value is not None and llm_value != "" and llm_value != {}

    @staticmethod
    def transform_existing_value(field: str, value: Any, existing_data: dict) -> Any:
        """Transform existing database value to the expected format."""
        config: Dict[str, Any] = FIELD_CONFIGS.get(field, {})
        field_type = config.get("type")

        if field_type == FieldType.LIST_RELATIONSHIP:
            # Transform to list of {id, name} objects
            id_field = f"{field[:-1]}_ids" if field.endswith("s") else f"{field}_ids"
            if id_field in existing_data and existing_data[id_field]:
                ids = existing_data[id_field]
                names = existing_data.get(field, [])
                return [{"id": str(ids[i]), "name": names[i] if i < len(names) else "Unknown"} for i in range(len(ids))]
            return []

        elif field_type == FieldType.ID_ARRAY:
            # Return array of ID strings
            return [str(item_id) for item_id in value] if isinstance(value, list) else []

        elif field_type == FieldType.STRUCTURED_VALUE:
            if field == "state":
                return {
                    "id": str(existing_data.get("state_id", "")),
                    "name": existing_data.get("state", "Unknown"),
                    "group": existing_data.get("state_group", "unknown"),
                }
            elif field == "priority":
                return {"name": value} if isinstance(value, str) else value

        elif field_type == FieldType.DATE_FIELD:
            return {"name": str(value)} if value else None

        elif field_type == FieldType.SINGLE_RELATIONSHIP:
            # For single relationships, return the value as-is if it's already structured
            if isinstance(value, dict):
                return value
            # Otherwise, convert to string (for IDs)
            return str(value) if value else None

        # Default: return as-is
        return value


class EntityDataFetcher:
    """Centralized entity data fetching."""

    @staticmethod
    async def fetch_existing_data(entity_type: str, entity_id: str) -> Optional[dict]:
        """Fetch existing entity data from database."""
        if entity_type in ["workitem", "epic"]:
            return await get_workitem_details_for_artifact(entity_id)
        elif entity_type == "project":
            return await get_project_details_for_artifact(entity_id)
        elif entity_type == "cycle":
            return await get_cycle_details_for_artifact(entity_id)
        elif entity_type == "module":
            return await get_module_details_for_artifact(entity_id)
        return None


# ============================================================================
# HELPER FUNCTIONS FOR MERGE LOGIC
# ============================================================================


def _merge_top_level_fields(merged_data: dict, existing_data: dict) -> None:
    """Merge top-level fields (name, description) from existing data if not in LLM updates."""
    for field in ["name", "description"]:
        if field not in merged_data and field in existing_data:
            merged_data[field] = existing_data[field]


async def _merge_properties_fields(properties: dict, existing_data: dict, required_fields: List[str]) -> None:
    """Merge properties fields, handling special cases and transformations."""
    # Process all required fields
    for field in required_fields:
        if field in TOP_LEVEL_FIELDS_CONSTANT:
            continue  # Top-level fields

        if field in SPECIAL_FIELDS_CONSTANT:
            await _handle_special_fields(properties, existing_data, field)
            continue

        # Skip if LLM already provided this field
        if field in properties:
            # Check if it's a meaningful update
            if not FieldProcessor.has_meaningful_update(field, properties[field]):
                # LLM provided empty/default value, use existing data instead
                if field in existing_data and existing_data[field] is not None:
                    properties[field] = FieldProcessor.transform_existing_value(field, existing_data[field], existing_data)
            continue

        # Add from existing data if available
        if field in existing_data and existing_data[field] is not None:
            properties[field] = FieldProcessor.transform_existing_value(field, existing_data[field], existing_data)


async def _handle_special_fields(properties: dict, existing_data: dict, field: str) -> None:
    """Handle special fields like state and priority."""
    if field == "state" and "state" not in properties:
        if "state_id" in existing_data:
            properties["state"] = {
                "id": str(existing_data["state_id"]),
                "name": existing_data.get("state", "Unknown"),
                "group": existing_data.get("state_group", "unknown"),
            }
    elif field == "priority" and "priority" not in properties:
        if "priority" in existing_data:
            properties["priority"] = {"name": existing_data["priority"]}


def _fix_parent_field_format(properties: dict) -> None:
    """Fix parent field format - convert to parent_id as plain UUID string."""
    if "parent" in properties:
        parent_value = properties.pop("parent")
        if isinstance(parent_value, dict):
            parent_id = parent_value.get("id") or parent_value.get("name")
        elif isinstance(parent_value, str):
            parent_id = parent_value
        else:
            parent_id = None

        if parent_id:
            properties["parent_id"] = str(parent_id)
            log.info(f"Converted parent to parent_id: {parent_id}")


async def _ensure_project_info(merged_data: dict, existing_data: dict) -> None:
    """Ensure project information is included in merged data."""
    if "project" not in merged_data and "project_id" in existing_data:
        project_details = await get_project_details_for_artifact(str(existing_data["project_id"]))
        if project_details:
            merged_data["project"] = {
                "id": str(existing_data["project_id"]),
                "identifier": project_details.get("identifier", ""),
                "name": project_details.get("name", ""),
            }


async def merge_llm_updates_with_existing_data(entity_type: str, entity_id: str, llm_updates: dict) -> dict:
    """
    Merge LLM updates with existing entity data to provide complete artifact response.

    This ensures that for update operations, the UI gets both:
    1. The fields updated by the LLM
    2. All other existing fields needed for proper display/editing

    Args:
        entity_type: Type of entity (workitem, epic, project, etc.)
        entity_id: ID of the entity to fetch existing data for
        llm_updates: The updates provided by the LLM (partial data)

    Returns:
        Complete merged data with both updates and existing fields
    """
    try:
        # Import schemas for field definitions
        from pi.services.actions.artifacts.schemas import get_base_fields_for_entity

        # Get existing entity data from database using centralized fetcher
        existing_data = await EntityDataFetcher.fetch_existing_data(entity_type, entity_id)

        if not existing_data:
            log.warning(f"Could not fetch existing data for {entity_type} {entity_id}")
            return llm_updates

        # Get the fields that should be included for this entity type
        required_fields = get_base_fields_for_entity(entity_type)

        # Start with LLM updates as the base
        merged_data = llm_updates.copy() if isinstance(llm_updates, dict) else {}

        # Ensure we have the basic structure
        if "properties" not in merged_data:
            merged_data["properties"] = {}

        # Merge top-level fields using helper
        _merge_top_level_fields(merged_data, existing_data)

        # Merge properties using helper
        properties = merged_data.get("properties", {})

        # Use refactored helper to merge properties fields
        await _merge_properties_fields(properties, existing_data, required_fields)

        # Fix parent field format if present
        _fix_parent_field_format(properties)

        # Update merged_data with processed properties
        merged_data["properties"] = properties

        # Ensure project information is included using helper
        await _ensure_project_info(merged_data, existing_data)

        log.info(f"Successfully merged LLM updates with existing data for {entity_type} {entity_id}")
        return merged_data

    except Exception as e:
        log.error(f"Error merging LLM updates with existing data for {entity_type} {entity_id}: {e}")
        return llm_updates


def construct_entity_url(entity_type: str, entity_id: str, entity_details: dict) -> Optional[str]:
    """
    Unified function to construct entity URLs based on entity type and details.

    Args:
        entity_type: Type of entity (workitem, project, cycle, module, label, state, comment)
        entity_id: ID of the entity
        entity_details: Dictionary containing entity details including project_identifier

    Returns:
        Constructed URL string or None if unable to construct
    """
    try:
        if entity_type == "workitem":
            issue_identifier = entity_details.get("identifier")
            project_identifier = entity_details.get("project_identifier")
            if project_identifier and issue_identifier:
                return f"/projects/{project_identifier}/issues/{issue_identifier}"

        elif entity_type == "project":
            entity_identifier = entity_details.get("identifier")
            if entity_identifier:
                return f"/projects/{entity_identifier}"

        elif entity_type == "cycle":
            project_identifier = entity_details.get("project_identifier")
            if project_identifier:
                return f"/projects/{project_identifier}/cycles/{entity_id}"

        elif entity_type == "module":
            project_identifier = entity_details.get("project_identifier")
            if project_identifier:
                return f"/projects/{project_identifier}/modules/{entity_id}"

        elif entity_type == "label":
            project_identifier = entity_details.get("project_identifier")
            if project_identifier:
                return f"/projects/{project_identifier}/settings/labels"

        elif entity_type == "state":
            project_identifier = entity_details.get("project_identifier")
            if project_identifier:
                return f"/projects/{project_identifier}/settings/states"

        elif entity_type == "intake":
            project_id = entity_details.get("project_id") or entity_details.get("project")
            if project_id:
                return f"/projects/{project_id}/intake/?currentTab=open&inboxIssueId={entity_id}"

        elif entity_type == "comment":
            project_identifier = entity_details.get("project_identifier")
            workitem_identifier = entity_details.get("workitem_identifier")
            if project_identifier and workitem_identifier:
                return f"/projects/{project_identifier}/issues/{workitem_identifier}"

    except Exception as e:
        log.warning(f"Error constructing URL for {entity_type} {entity_id}: {e}")

    return None


async def populate_entity_info_from_artifact(
    artifact,
) -> tuple[Optional[str], Optional[str], Optional[str], Optional[str], Optional[str], Optional[str]]:
    """
    Unified function to populate entity info from artifact entity_id.

    Returns:
        Tuple of (entity_id, entity_url, entity_name, entity_type, issue_identifier, entity_identifier)
    """
    if not artifact.entity_id:
        return None, None, None, None, None, None

    entity_id = str(artifact.entity_id)
    entity_type = artifact.entity
    entity_name = None
    entity_url = None
    issue_identifier = None
    entity_identifier = None

    def _extract_issue_id_from_tool_args() -> Optional[str]:
        try:
            raw = getattr(artifact, "data", {}) or {}
            tool_args = raw.get("tool_args_raw", {}) if isinstance(raw, dict) else {}
            if isinstance(tool_args, dict) and tool_args.get("issue_id"):
                return str(tool_args["issue_id"])
        except Exception:
            return None
        return None

    async def _populate_issue_link(issue_id: str) -> None:
        nonlocal entity_url, issue_identifier, entity_identifier
        issue_info = await get_issue_identifier_for_artifact(str(issue_id))
        if issue_info and isinstance(issue_info, dict):
            ident = issue_info.get("identifier")
            if ident:
                issue_identifier = str(ident)
                entity_identifier = issue_identifier
                project_identifier = issue_info.get("project_identifier")
                if project_identifier:
                    entity_url = f"/projects/{project_identifier}/issues/{issue_identifier}"

    try:
        entity_details = None

        if artifact.entity == "workitem":
            entity_details = await get_workitem_details_for_artifact(entity_id)
            if entity_details:
                entity_name = entity_details.get("name")
                issue_identifier = entity_details.get("identifier")
                entity_identifier = issue_identifier

        elif artifact.entity == "project":
            entity_details = await get_project_details_for_artifact(entity_id)
            if entity_details:
                entity_name = entity_details.get("name")
                entity_identifier = entity_details.get("identifier")

        elif artifact.entity == "cycle":
            entity_details = await get_cycle_details_for_artifact(entity_id)
            if entity_details:
                entity_name = entity_details.get("name")

        elif artifact.entity == "module":
            entity_details = await get_module_details_for_artifact(entity_id)
            if entity_details:
                entity_name = entity_details.get("name")

        elif artifact.entity == "label":
            entity_details = await get_label_details_for_artifact(entity_id)
            if entity_details:
                entity_name = entity_details.get("name")

        elif artifact.entity == "state":
            entity_details = await get_state_details_for_artifact(entity_id)
            if entity_details:
                entity_name = entity_details.get("name")

        elif artifact.entity == "comment":
            # Comment entity: keep entity_type as "comment" but link to the parent issue URL.
            entity_type = "comment"
            entity_name = None
            issue_id = _extract_issue_id_from_tool_args()
            if issue_id:
                await _populate_issue_link(issue_id)

        elif artifact.entity == "worklog":
            # Worklog entity: keep entity_type as "worklog" but link to the parent issue URL.
            entity_type = "worklog"
            entity_name = None
            issue_id = _extract_issue_id_from_tool_args()
            if issue_id:
                await _populate_issue_link(issue_id)

        elif artifact.entity == "page":
            entity_details = await get_page_details_for_artifact(entity_id)
            if entity_details:
                entity_name = entity_details.get("name")
                # For pages, construct a simple URL (pages don't have project-specific URLs in the same way)
                workspace_id = entity_details.get("workspace_id")
                if workspace_id:
                    entity_url = f"/pages/{entity_id}"

        # Construct URL using unified function (if not already set by page handling)
        if entity_details and not entity_url:
            entity_url = construct_entity_url(artifact.entity, entity_id, entity_details)

    except Exception as e:
        log.warning(f"Error fetching entity details for {artifact.entity} {artifact.entity_id}: {e}")

    return entity_id, entity_url, entity_name, entity_type, issue_identifier, entity_identifier


def serialize_for_json(obj: Any) -> Any:
    """
    Convert objects to JSON-serializable format.

    Recursively converts UUID objects to strings in any data structure.
    This ensures that data can be properly serialized to JSON/JSONB.

    Args:
        obj: Any data structure that may contain UUID objects

    Returns:
        The same data structure with UUID objects converted to strings
    """
    if isinstance(obj, uuid.UUID):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: serialize_for_json(value) for key, value in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [serialize_for_json(item) for item in obj]
    else:
        return obj


# Alias for backward compatibility
convert_uuids_to_strings = serialize_for_json


async def resolve_project_id_to_object(data: dict) -> dict:
    """
    Helper function to resolve project_id to full project object in artifact data.

    Handles both old format (project_id at top level) and new format (project.id).

    Args:
        data: Dictionary that may contain project_id or project.id

    Returns:
        Dictionary with project_id replaced by project object if resolution was successful
    """

    try:
        project_id = None

        # Check for old format: project_id at top level
        if "project_id" in data and data["project_id"]:
            project_id = str(data["project_id"])

        # Check for new format: project.id
        elif "project" in data and isinstance(data["project"], dict) and "id" in data["project"]:
            project_id = str(data["project"]["id"])

        if not project_id:
            return data

        # Skip resolution if project_id is a placeholder (not yet resolved from execution)
        if project_id.startswith("<id of"):
            log.debug(f"Skipping resolution for placeholder project_id: {project_id}")
            return data

        project_details = await get_project_details_for_artifact(project_id)
        if project_details:
            # Create a copy to avoid modifying the original
            resolved_data = data.copy()
            # Replace with full project object
            resolved_data["project"] = {
                "id": str(project_details["id"]),
                "name": project_details["name"],
                "identifier": project_details["identifier"],
            }
            # Remove the old project_id if it exists
            resolved_data.pop("project_id", None)
            return resolved_data
        else:
            log.warning(f"Could not resolve project_id {project_id}")
            return data
    except Exception as e:
        log.error(f"Error resolving project_id: {e}")
        return data


async def prepare_artifact_data(entity_type: str, artifact_data: dict, action: Optional[str] = None, entity_id: Optional[str] = None) -> dict:
    """Route to appropriate preparation function based on entity type."""

    # Enhance artifact_data with action and entity_id for preparation functions
    enhanced_artifact_data = artifact_data.copy() if isinstance(artifact_data, dict) else artifact_data
    if isinstance(enhanced_artifact_data, dict):
        if action:
            enhanced_artifact_data["action"] = action
        if entity_id:
            enhanced_artifact_data["entity_id"] = entity_id

    preparation_functions = {
        "workitem": prepare_workitem_artifact_data,
        "epic": prepare_epic_artifact_data,  # Epics have their own preparation function
        "project": prepare_project_artifact_data,
        "cycle": prepare_cycle_artifact_data,
        "module": prepare_module_artifact_data,
        "page": prepare_page_artifact_data,
        "comment": prepare_comment_artifact_data,
        "state": prepare_state_artifact_data,
        "label": prepare_label_artifact_data,
    }

    preparation_function = preparation_functions.get(entity_type, prepare_unknown_artifact_data)
    prepared_data = await preparation_function(enhanced_artifact_data)

    # Resolve project_id to full project object if present
    resolved_data = await resolve_project_id_to_object(prepared_data)

    return resolved_data


async def prepare_edited_artifact_data(entity_type: str, artifact_data: dict) -> dict:
    """Route to appropriate edited artifact preparation function based on entity type."""
    edited_preparation_functions = {
        "workitem": prepare_edited_workitem_artifact_data,
        "epic": prepare_edited_workitem_artifact_data,
        "project": prepare_edited_project_artifact_data,
        "cycle": prepare_edited_cycle_artifact_data,
        # TODO: Add other entity types later
        # "module": prepare_edited_module_artifact_data,
        # "comment": prepare_edited_comment_artifact_data,
        # "state": prepare_edited_state_artifact_data,
        # "label": prepare_edited_label_artifact_data,
    }

    preparation_function = edited_preparation_functions.get(entity_type, prepare_edited_unknown_artifact_data)
    prepared_data = await preparation_function(artifact_data)

    return prepared_data


async def prepare_edited_cycle_artifact_data(artifact_data: dict) -> dict:
    """Prepare edited cycle artifact data for execution."""
    clean_data: dict = {}
    properties: dict[str, Any] = {}

    # Essential top-level fields for cycles (from CYCLE_FIELDS schema)
    # Note: start_date and end_date should be at top level for tool execution
    essential_fields = {"name", "description", "project", "project_id", "start_date", "end_date"}

    # Extract and preserve entity_info first (for executed artifacts)
    entity_info = None
    if isinstance(artifact_data, dict) and "entity_info" in artifact_data:
        entity_info = artifact_data.get("entity_info")
        log.info(f"Found entity_info in edited cycle artifact data: {entity_info}")

    for key, value in artifact_data.items():
        # Skip null/empty values
        if value is None or (isinstance(value, list) and not value):
            continue

        if key in essential_fields:
            # For dates, ensure they're strings (not objects)
            if key in ["start_date", "end_date"] and isinstance(value, dict):
                # Extract the date string from object format {"name": "2025-11-11"}
                clean_data[key] = str(value.get("name", value))
            else:
                clean_data[key] = value
        elif key == "owned_by" and value:
            # Handle owned_by field (user who owns the cycle)
            if isinstance(value, dict):
                properties["owned_by"] = value
            else:
                # If it's just an ID, keep it as string
                properties["owned_by"] = str(value)
        elif key not in {"entity_info"}:  # Skip entity_info
            properties[key] = value

    # Convert project object to project_id string (frontend sends project as object)
    if "project" in clean_data and isinstance(clean_data["project"], dict):
        project_obj = clean_data.pop("project")
        if "id" in project_obj:
            clean_data["project_id"] = str(project_obj["id"])
            log.info(f"Converted project object to project_id: {clean_data["project_id"]}")

    # Add properties if any
    if properties:
        clean_data["properties"] = properties

    # Restore entity_info if it was present
    if entity_info:
        clean_data["entity_info"] = entity_info
        log.info(f"Restored entity_info to clean cycle data: {entity_info}")

    return clean_data


async def prepare_edited_workitem_artifact_data(artifact_data: dict) -> dict:
    # Start with basic fields
    clean_data: dict = {}
    properties: dict[str, Any] = {}

    # Essential top-level fields
    essential_fields = {"name", "description", "description_html", "artifact_sub_type", "project", "project_id"}

    # Extract and preserve entity_info first (this is crucial for executed artifacts)
    entity_info = None
    if isinstance(artifact_data, dict) and "entity_info" in artifact_data:
        entity_info = artifact_data.get("entity_info")
        log.info(f"Found entity_info in edited workitem artifact data: {entity_info}")

    # Collect all async tasks for parallel execution
    tasks: list[Any] = []
    task_keys: list[tuple[str, Any]] = []

    for key, value in artifact_data.items():
        # Skip null/empty values
        if value is None or (isinstance(value, list) and not value):
            continue

        if key in essential_fields:
            clean_data[key] = value
        elif key == "assignee_ids" and isinstance(value, list) and value:
            # Fetch all user names in parallel
            for user_id in value:
                tasks.append(get_user_name(user_id))
                task_keys.append(("assignee", user_id))
        elif key == "module_ids" and isinstance(value, list) and value:
            # Fetch all module names in parallel
            for module_id in value:
                tasks.append(get_module_name(module_id))
                task_keys.append(("module", module_id))
        elif key == "label_ids" and isinstance(value, list) and value:
            # Fetch all label names in parallel
            for label_id in value:
                tasks.append(get_label_name(label_id))
                task_keys.append(("label", label_id))
        elif key == "parent_id" and value:
            # Fetch parent workitem name using workitem details query
            tasks.append(get_workitem_details_for_artifact(value))
            task_keys.append(("parent", value))
        elif key == "state_id" and value:
            # Fetch full state details (id, name, group)
            tasks.append(get_state_details_by_id(value))
            task_keys.append(("state", value))
        elif key == "type_id" and value:
            # Fetch state details (type_id refers to state)
            tasks.append(get_state_details_by_id(value))
            task_keys.append(("type", value))
        elif key == "cycle_id" and value:
            # Fetch cycle name
            tasks.append(get_cycle_name(value))
            task_keys.append(("cycle", value))
        elif key == "priority" and isinstance(value, str):
            # Transform string priority to object
            properties["priority"] = {"name": value}
        elif key in ["start_date", "target_date"] and value:
            # Transform date to object
            properties[key] = {"name": str(value)}
        elif key not in {"entity_info"}:  # Skip entity_info
            properties[key] = value

    # Execute all queries in parallel
    if tasks:
        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results and group by type
            assignees = []
            modules = []
            labels = []
            parent = None
            state_obj = None
            type_obj = None
            cycle = None

            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    log.warning(f"Query failed for {task_keys[i]}: {result}")
                    continue

                task_type, task_id = task_keys[i]

                if task_type == "assignee" and result:
                    assignees.append({"id": task_id, "name": result})
                elif task_type == "module" and result:
                    modules.append({"id": task_id, "name": result})
                elif task_type == "label" and result:
                    labels.append({"id": task_id, "name": result})
                elif task_type == "parent" and result and isinstance(result, dict):
                    parent = {"id": task_id, "name": result.get("name", "Unknown")}
                elif task_type == "state" and result and isinstance(result, dict):
                    state_obj = {"id": task_id, "name": result.get("name", "Unknown"), "group": result.get("group", "unstarted")}
                elif task_type == "type" and result and isinstance(result, dict):
                    type_obj = {"id": task_id, "name": result.get("name", "Unknown"), "group": result.get("group", "unstarted")}
                elif task_type == "cycle" and result:
                    cycle = {"id": task_id, "name": result}

            # Add transformed properties
            if assignees:
                properties["assignees"] = assignees
            if modules:
                properties["modules"] = modules
            if labels:
                properties["labels"] = labels
            if parent:
                # Only store parent_id as plain UUID string (no parent object)
                properties["parent_id"] = parent.get("id") if isinstance(parent, dict) else str(parent)
            if state_obj:
                properties["state"] = state_obj
            if type_obj:
                properties["type"] = type_obj
            if cycle:
                properties["cycle"] = cycle

        except Exception as e:
            log.error(f"Error executing parallel queries: {e}")

    # Add properties if any
    if properties:
        clean_data["properties"] = properties

    # Restore entity_info if it was present in the original data
    if entity_info:
        clean_data["entity_info"] = entity_info
        log.info(f"Restored entity_info to clean workitem data: {entity_info}")

    return clean_data


async def prepare_edited_project_artifact_data(artifact_data: dict) -> dict:
    """Prepare edited project artifact data for execution.

    Handles fields from edit modal:
    - name
    - description (always included, even if empty)
    - cover_image_url → cover_image
    - identifier
    - network
    - project_lead
    """
    result: dict[str, Any] = {}

    # Process name (required)
    if "name" in artifact_data:
        result["name"] = artifact_data["name"]

    # Process description (always include, even if empty - API requirement)
    # Also handle description_html for UI compatibility
    if "description" in artifact_data:
        desc = artifact_data["description"] if artifact_data["description"] is not None else ""
        result["description"] = desc
        if "description_html" in artifact_data:
            result["description_html"] = artifact_data["description_html"]
        elif desc:
            result["description_html"] = f"<p>{desc}</p>"
        else:
            result["description_html"] = ""
    elif "description_html" in artifact_data:
        result["description_html"] = artifact_data["description_html"]
        result["description"] = artifact_data["description_html"]

    # Process cover_image_url → cover_image
    if "cover_image_url" in artifact_data and artifact_data["cover_image_url"]:
        result["cover_image"] = artifact_data["cover_image_url"]

    # Process identifier (only if not empty)
    if "identifier" in artifact_data and artifact_data["identifier"]:
        result["identifier"] = artifact_data["identifier"]

    # Process network
    if "network" in artifact_data and artifact_data["network"] is not None:
        result["network"] = artifact_data["network"]

    # Handle project_lead
    if "project_lead" in artifact_data and artifact_data["project_lead"]:
        project_lead = artifact_data["project_lead"]
        if isinstance(project_lead, dict) and "id" in project_lead:
            result["project_lead"] = project_lead["id"]
        elif isinstance(project_lead, str):
            result["project_lead"] = project_lead

    if "logo_props" in artifact_data and artifact_data["logo_props"]:
        result["logo_props"] = artifact_data["logo_props"]
        result["icon_prop"] = artifact_data["logo_props"]

    return result


async def prepare_edited_unknown_artifact_data(artifact_data: dict) -> dict:
    """Fallback for unknown edited artifact entity types."""
    log.warning("No edited preparation function found for unknown entity type, returning data as-is")
    return artifact_data


async def prepare_state_artifact_data(state_data: dict):
    """Prepare state artifact data for enhanced UI display."""
    try:
        # For create operations, use the planning data
        if "planning_data" in state_data:
            planning_data = state_data["planning_data"]
            parameters = planning_data.get("parameters", {})
            # Use unified normalizer instead of old flattening logic
            return normalize_parameters_structure(parameters, flatten_entities=False)

        # For update operations, fetch existing state details
        elif "entity_id" in state_data and state_data["entity_id"]:
            return await get_state_details_for_artifact(state_data["entity_id"])

        return state_data
    except Exception as e:
        log.error(f"Error preparing state artifact data: {e}")
        return state_data


async def prepare_label_artifact_data(label_data: dict):
    """Prepare label artifact data for enhanced UI display."""
    try:
        # For create operations, use the planning data
        if "planning_data" in label_data:
            planning_data = label_data["planning_data"]
            parameters = planning_data.get("parameters", {})
            return normalize_parameters_structure(parameters, flatten_entities=False)

        # For update operations, fetch existing label details
        elif "entity_id" in label_data and label_data["entity_id"]:
            return await get_label_details_for_artifact(label_data["entity_id"])

        return label_data
    except Exception as e:
        log.error(f"Error preparing label artifact data: {e}")
        return label_data


async def prepare_page_artifact_data(page_data: dict):
    """Prepare page artifact data for enhanced UI display."""
    try:
        # Determine if we have planning_data or if page_data IS the planning data
        if "planning_data" in page_data:
            planning_data = page_data["planning_data"]
        elif "parameters" in page_data:
            # page_data IS the planning data (artifact.data stored directly)
            planning_data = page_data
        else:
            planning_data = None

        # For create operations, use the planning data
        if planning_data:
            parameters = planning_data.get("parameters", {})
            # normalize_parameters_structure now handles description_html -> description conversion
            result = normalize_parameters_structure(parameters, flatten_entities=False)
            return result

        # For update operations, fetch existing page details
        elif "entity_id" in page_data and page_data["entity_id"]:
            entity_id = str(page_data["entity_id"])
            page_details = await get_page_details_for_artifact(entity_id)

            if page_details:
                result = {
                    "name": page_details.get("name", ""),
                    "description": page_details.get("description_stripped", ""),
                    "project": {"id": str(page_details.get("project_id", "")), "identifier": page_details.get("project_identifier", "")},
                    "properties": {
                        "access": page_details.get("access"),
                        "is_locked": page_details.get("is_locked"),
                        "is_global": page_details.get("is_global"),
                        "owned_by": {"id": str(page_details.get("owned_by_id", "")), "name": page_details.get("owned_by", "")}
                        if page_details.get("owned_by_id")
                        else None,
                        "logo_props": page_details.get("logo_props"),
                        "view_props": page_details.get("view_props"),
                    },
                }

                # Add parent_id if present
                if page_details.get("parent_id"):
                    result["properties"]["parent_id"] = str(page_details["parent_id"])

                return result

        return page_data
    except Exception as e:
        log.error(f"Error preparing page artifact data: {e}")
        return page_data


async def prepare_user_artifact_data(user_data: dict):
    """Prepare user artifact data for enhanced UI display."""
    return user_data


async def prepare_epic_artifact_data(epic_data: dict):
    """Prepare epic artifact data for enhanced UI display."""
    try:
        # Preserve entity_info if it exists (for executed artifacts)
        original_entity_info = epic_data.get("entity_info") if isinstance(epic_data, dict) else None

        # For create operations, use the planning data
        if "planning_data" in epic_data:
            planning_data = epic_data["planning_data"]
            parameters = planning_data.get("parameters", {})
            # Use same normalization as workitems - epics just have fewer fields
            result = normalize_parameters_structure(parameters, flatten_entities=True)

            # Note: Epics don't have parent_id field, so no parent resolution needed

        # For other operations, fetch existing epic details if entity_id present
        elif "entity_id" in epic_data and epic_data["entity_id"]:
            # Use the existing workitem details function since epics are workitems
            fetched_result = await get_workitem_details_for_artifact(epic_data["entity_id"])
            result = fetched_result if fetched_result is not None else epic_data

        else:
            result = epic_data

        # Restore entity_info if it was present in the original data
        if original_entity_info and isinstance(result, dict):
            result["entity_info"] = original_entity_info

        return result

    except Exception as e:
        log.error(f"Error preparing epic artifact data: {e}")
        return epic_data


async def prepare_workitem_artifact_data(workitem_data: dict):
    """Prepare workitem artifact data for enhanced UI display."""
    try:
        # Preserve entity_info if it exists (for executed artifacts)
        original_entity_info = workitem_data.get("entity_info") if isinstance(workitem_data, dict) else None

        # For create operations, use the planning data
        if "planning_data" in workitem_data:
            planning_data = workitem_data["planning_data"]
            parameters = planning_data.get("parameters", {})
            # Use unified normalizer with entity flattening to merge project details
            result = normalize_parameters_structure(parameters, flatten_entities=True)

            # Resolve parent field if present (convert from {"name": "uuid"} or parent object to plain parent_id string)
            if "properties" in result and "parent" in result["properties"]:
                parent_data = result["properties"].pop("parent")  # Remove parent object
                if isinstance(parent_data, dict):
                    parent_id = parent_data.get("id") or parent_data.get("name")
                elif isinstance(parent_data, str):
                    parent_id = parent_data
                else:
                    parent_id = None

                if parent_id:
                    # Store only parent_id as plain UUID string
                    result["properties"]["parent_id"] = str(parent_id)

        # For other operations, fetch existing workitem details if entity_id present
        elif "entity_id" in workitem_data and workitem_data["entity_id"]:
            fetched_result = await get_workitem_details_for_artifact(workitem_data["entity_id"])
            result = fetched_result if fetched_result is not None else workitem_data

        else:
            result = workitem_data

        # Restore entity_info if it was present in the original data
        if original_entity_info and isinstance(result, dict):
            result["entity_info"] = original_entity_info

        return result

    except Exception as e:
        log.error(f"Error preparing workitem artifact data: {e}")
        return workitem_data


async def prepare_project_artifact_data(project_data: dict):
    """Prepare project artifact data for enhanced UI display."""
    try:
        # Preserve entity_info if it exists (for executed artifacts)
        original_entity_info = project_data.get("entity_info") if isinstance(project_data, dict) else None

        # For create operations, use the planning data
        if "planning_data" in project_data:
            planning_data = project_data["planning_data"]
            parameters = planning_data.get("parameters", {})
            # Use unified normalizer instead of old flattening logic
            result = normalize_parameters_structure(parameters, flatten_entities=False)

        # For update operations, fetch existing project details
        elif "entity_id" in project_data and project_data["entity_id"]:
            fetched_result = await get_project_details_for_artifact(project_data["entity_id"])
            result = fetched_result if fetched_result is not None else project_data

        else:
            result = project_data

        # Restore entity_info if it was present in the original data
        if original_entity_info and isinstance(result, dict):
            result["entity_info"] = original_entity_info

        return result

    except Exception as e:
        log.error(f"Error preparing project artifact data: {e}")
        return project_data


async def prepare_cycle_artifact_data(cycle_data: dict):
    """Prepare cycle artifact data for enhanced UI display."""
    try:
        # For create operations, use the planning data
        if "planning_data" in cycle_data:
            planning_data = cycle_data["planning_data"]
            parameters = planning_data.get("parameters", {})
            return normalize_parameters_structure(parameters, flatten_entities=False)

        # For update operations, fetch existing cycle details
        elif "entity_id" in cycle_data and cycle_data["entity_id"]:
            return await get_cycle_details_for_artifact(cycle_data["entity_id"])

        return cycle_data

    except Exception as e:
        log.error(f"Error preparing cycle artifact data: {e}")
        return cycle_data


async def prepare_module_artifact_data(module_data: dict):
    """Prepare module artifact data for enhanced UI display."""
    try:
        # For create operations, use the planning data
        if "planning_data" in module_data:
            planning_data = module_data["planning_data"]
            parameters = planning_data.get("parameters", {})
            return normalize_parameters_structure(parameters, flatten_entities=False)

        # For update operations, fetch existing module details
        elif "entity_id" in module_data and module_data["entity_id"]:
            return await get_module_details_for_artifact(module_data["entity_id"])

        return module_data

    except Exception as e:
        log.error(f"Error preparing module artifact data: {e}")
        return module_data


async def prepare_comment_artifact_data(comment_data: dict) -> Optional[Dict[str, Any]]:
    """Prepare comment artifact data for enhanced UI display."""
    try:
        original_entity_info = comment_data.get("entity_info") if isinstance(comment_data, dict) else None

        # For create operations, use the planning data
        if "planning_data" in comment_data:
            planning_data = comment_data["planning_data"]
            parameters = planning_data.get("parameters", {})
            result: Optional[Dict[str, Any]] = normalize_parameters_structure(parameters, flatten_entities=False)
        # For update operations, fetch existing comment details
        elif "entity_id" in comment_data and comment_data["entity_id"]:
            result = await get_comment_details_for_artifact(comment_data["entity_id"])
        else:
            result = comment_data

        if original_entity_info and isinstance(result, dict):
            result["entity_info"] = original_entity_info

        return result

    except Exception as e:
        log.error(f"Error preparing comment artifact data: {e}")
        return comment_data


async def prepare_unknown_artifact_data(artifact_data: dict):
    """Prepare unknown entity artifact data for enhanced UI display."""
    log.info(f"Artifact data received in unknown type function: {artifact_data}")
    try:
        original_entity_info = artifact_data.get("entity_info") if isinstance(artifact_data, dict) else None

        if "planning_data" in artifact_data:
            planning_data = artifact_data["planning_data"]
            parameters = planning_data.get("parameters", {})
            result = normalize_parameters_structure(parameters, flatten_entities=False) if isinstance(parameters, dict) else artifact_data
        else:
            result = artifact_data

        if original_entity_info and isinstance(result, dict):
            result["entity_info"] = original_entity_info

        return result

    except Exception as e:
        log.error(f"Error preparing unknown artifact data: {e}")
        return artifact_data


class ParameterNormalizer:
    """Encapsulates parameter normalization logic for consistent frontend format."""

    # Fields that should always stay at top level (FIXED: Added project_id)
    TOP_LEVEL_FIELDS = {"name", "description", "project", "identifier", "id", "project_id"}

    # Fields that should be converted to description at top level
    DESCRIPTION_FIELDS = {"description_html", "description_stripped"}

    @staticmethod
    def _extract_string_value(value: Any) -> str:
        """Extract string value from various formats."""
        if isinstance(value, dict):
            if "name" in value and isinstance(value["name"], str):
                return value["name"]
            elif "description" in value and isinstance(value["description"], str):
                return value["description"]
            elif "value" in value and isinstance(value["value"], str):
                return value["value"]
        elif isinstance(value, str):
            return value
        return str(value) if value is not None else ""

    @staticmethod
    def _flatten_entity_blocks(working_params: dict) -> None:
        """Flatten entity blocks and merge with related ID fields."""
        entity_keys = ["project", "workitem", "module", "cycle", "state", "label", "comment", "page"]
        for entity_key in entity_keys:
            if entity_key in working_params and isinstance(working_params[entity_key], dict):
                entity_data = working_params.pop(entity_key)

                # Look for related ID field (e.g., project_id for project)
                id_field = f"{entity_key}_id"
                if id_field in working_params:
                    entity_id = working_params.pop(id_field)
                    # Add the ID to the entity data
                    entity_data["id"] = entity_id

                # Keep the full entity object at top level
                working_params[entity_key] = entity_data

            # Also check if ID field exists without the entity object
            elif f"{entity_key}_id" in working_params:
                entity_id = working_params.pop(f"{entity_key}_id")
                # Create entity object with just the ID
                working_params[entity_key] = {"id": entity_id}

    @staticmethod
    def _handle_description_conversion(working_params: dict) -> None:
        """Convert description_html/description_stripped to description."""
        for desc_field in ParameterNormalizer.DESCRIPTION_FIELDS:
            if desc_field in working_params:
                desc_value = working_params.pop(desc_field)
                # Only set description if not already present
                if "description" not in working_params:
                    if isinstance(desc_value, dict) and "name" in desc_value:
                        working_params["description"] = desc_value["name"]
                    elif isinstance(desc_value, str):
                        working_params["description"] = desc_value

    @staticmethod
    def _process_field(key: str, value: Any, normalized: Dict[str, Any], properties: Dict[str, Any], flatten_entities: bool) -> None:
        """Process a single field and place it in the correct location."""
        # Handle HTML field mappings to their base equivalents
        if key == "description_html":
            normalized["description"] = ParameterNormalizer._extract_string_value(value)
        elif key in ParameterNormalizer.TOP_LEVEL_FIELDS:
            # Handle nested description objects - extract string value
            if key == "description" and isinstance(value, dict):
                extracted = ParameterNormalizer._extract_string_value(value)
                if extracted:
                    normalized[key] = extracted
                else:
                    # Can't extract string, put in properties
                    properties[key] = value
            else:
                normalized[key] = value
        elif key.endswith("_id") and key not in ["entity_id", "parent_id"]:
            # Skip standalone ID fields that should be merged with entities
            # Exception: parent_id is a legitimate property field that should be preserved
            pass
        elif key == "properties":
            # Merge existing properties
            ParameterNormalizer._merge_existing_properties(value, normalized, properties, flatten_entities)
        else:
            # All other fields go to properties
            ParameterNormalizer._add_to_properties(key, value, properties)

    @staticmethod
    def _merge_existing_properties(value: Any, normalized: Dict[str, Any], properties: Dict[str, Any], flatten_entities: bool) -> None:
        """Merge existing properties dict into the properties being built."""
        if isinstance(value, dict):
            for prop_key, prop_value in value.items():
                # Handle description fields in properties - move to top level
                if prop_key in ParameterNormalizer.DESCRIPTION_FIELDS:
                    if "description" not in normalized:
                        normalized["description"] = ParameterNormalizer._extract_string_value(prop_value)
                    continue

                # Skip ID fields that should be merged with entities
                # Exception: parent_id is a legitimate property field
                if prop_key.endswith("_id") and prop_key != "parent_id" and flatten_entities:
                    continue

                # Add to properties
                ParameterNormalizer._add_to_properties(prop_key, prop_value, properties)

    @staticmethod
    def _add_to_properties(key: str, value: Any, properties: Dict[str, Any]) -> None:
        """Add a field to properties, converting strings to structured objects."""
        # Convert plain string values to structured objects with "name" field
        # EXCEPTION: parent_id must remain as plain UUID string
        if isinstance(value, str):
            if key == "parent_id":
                # Keep parent_id as plain string UUID
                properties[key] = value
            else:
                # Convert other strings to {"name": value} format
                properties[key] = {"name": value}
        else:
            properties[key] = value

    @staticmethod
    def normalize_parameters_structure(parameters: dict, flatten_entities: bool = True) -> Dict[str, Any]:
        """
        Unified function to normalize parameter structure for consistent frontend format.

        This ensures ALL pipelines (streaming, action planning, artifact responses)
        produce the same consistent structure with description at top level.

        Args:
            parameters: Input parameters dictionary
            flatten_entities: Whether to flatten entity blocks and merge related fields

        Returns:
            Normalized parameters with consistent structure
        """
        normalized: Dict[str, Any] = {}
        properties: Dict[str, Any] = {}

        # First pass: handle entity flattening if requested
        working_params = parameters.copy()

        # Handle description_html -> description conversion
        ParameterNormalizer._handle_description_conversion(working_params)

        if flatten_entities:
            # Flatten entity blocks
            ParameterNormalizer._flatten_entity_blocks(working_params)

        # Process each field
        for key, value in working_params.items():
            ParameterNormalizer._process_field(key, value, normalized, properties, flatten_entities)

        # Add properties if any exist
        if properties:
            normalized["properties"] = properties

        return normalized


def normalize_parameters_structure(parameters: dict, flatten_entities: bool = True) -> Dict[str, Any]:
    """
    Unified function to normalize parameter structure for consistent frontend format.

    This is a backward-compatible wrapper around ParameterNormalizer.normalize_parameters_structure.

    Args:
        parameters: Input parameters dictionary
        flatten_entities: Whether to flatten entity blocks and merge related fields

    Returns:
        Normalized parameters with consistent structure
    """
    return ParameterNormalizer.normalize_parameters_structure(parameters, flatten_entities)


def restructure_parameters_for_frontend(parameters: dict) -> dict:
    """
    Legacy function - now uses the unified normalizer.

    Kept for backward compatibility.
    """
    return normalize_parameters_structure(parameters, flatten_entities=False)


async def prepare_artifact_response_data(db, artifact, is_latest=False) -> dict:
    """
    Centralized function to prepare artifact data for API response.

    Handles data preparation, entity info extraction, and parameter restructuring
    for consistent response format across all endpoints.
    """

    artifact_data_to_use, is_edited, actual_is_executed, actual_success = await get_latest_artifact_data_for_display(db, artifact)

    tool_name: Optional[str] = None
    if isinstance(artifact_data_to_use, dict):
        pd = artifact_data_to_use.get("planning_data")
        if isinstance(pd, dict):
            tn = pd.get("tool_name")
            if isinstance(tn, str) and tn:
                tool_name = tn

    try:
        if is_edited and artifact.entity in ["workitem", "project"]:
            # Use special handling for edited artifacts
            enhanced_data = await prepare_edited_artifact_data(artifact.entity, artifact_data_to_use)
        else:
            # Use existing logic for unedited artifacts - pass action and entity_id for update operations
            enhanced_data = await prepare_artifact_data(
                entity_type=artifact.entity,
                artifact_data=artifact_data_to_use,
                action=artifact.action,
                entity_id=str(artifact.entity_id) if artifact.entity_id else None,
            )
    except Exception as e:
        log.warning(f"Error preparing artifact data for {artifact.id}: {e}")
        enhanced_data = artifact_data_to_use

    # Extract entity info from parameters if available
    entity_id = None
    entity_url = None
    entity_name = None
    entity_type = None
    issue_identifier = None
    entity_identifier = None

    # Create a copy of enhanced_data to avoid modifying the original
    clean_parameters = enhanced_data.copy() if isinstance(enhanced_data, dict) else enhanced_data

    # First, try to extract entity_info from the artifact data
    if isinstance(enhanced_data, dict) and "entity_info" in enhanced_data:
        entity_info = enhanced_data.get("entity_info", {})
        if isinstance(entity_info, dict):
            entity_id = entity_info.get("entity_id")
            entity_url = entity_info.get("entity_url")
            entity_name = entity_info.get("entity_name")
            entity_type = entity_info.get("entity_type")
            issue_identifier = entity_info.get("issue_identifier")
            entity_identifier = entity_info.get("entity_identifier")

        # Remove entity_info from parameters since we're extracting it to top level
        clean_parameters.pop("entity_info", None)

    # If no entity_info found but artifact is executed and has entity_id, populate entity info
    elif actual_is_executed and artifact.entity_id:
        entity_id, entity_url, entity_name, entity_type, issue_identifier, entity_identifier = await populate_entity_info_from_artifact(artifact)

    # Always return absolute entity_url (FE expects domain included)
    if isinstance(entity_url, str) and entity_url.startswith("/"):
        base = str(getattr(settings.plane_api, "FRONTEND_URL", "") or "").rstrip("/")
        if base:
            entity_url = f"{base}{entity_url}"

    if isinstance(clean_parameters, dict):
        if (
            "action" in clean_parameters
            and "tool_name" in clean_parameters
            and "parameters" in clean_parameters
            and isinstance(clean_parameters.get("parameters"), dict)
        ):
            tn = clean_parameters.get("tool_name")
            if tool_name is None and isinstance(tn, str) and tn:
                tool_name = tn
            clean_parameters = clean_parameters["parameters"].copy()
        elif "planning_data" in clean_parameters and isinstance(clean_parameters.get("planning_data"), dict):
            pd = clean_parameters.get("planning_data", {})
            tn = pd.get("tool_name")
            if tool_name is None and isinstance(tn, str) and tn:
                tool_name = tn
            inner = pd.get("parameters")
            if isinstance(inner, dict):
                clean_parameters = inner.copy()

    return {
        "artifact_id": str(artifact.id),
        "sequence": artifact.sequence,
        "artifact_type": artifact.entity,
        "action": artifact.action,
        "tool_name": tool_name,
        "parameters": serialize_for_json(clean_parameters),
        "message_id": str(artifact.message_id) if artifact.message_id else None,
        "is_executed": actual_is_executed,  # Use actual source
        "success": actual_success,  # Use actual source
        "is_editable": (artifact.entity == "workitem" and is_latest and not actual_is_executed),  # Use actual is_executed
        "entity_id": entity_id,
        "entity_url": entity_url,
        "entity_name": entity_name,
        "entity_type": entity_type,
        "issue_identifier": issue_identifier,
        "entity_identifier": entity_identifier,
    }


async def batch_prepare_artifact_response_data(db, artifacts: List[Any], latest_message_ids: Dict[str, Any]) -> List[dict]:
    """
    Batch version of prepare_artifact_response_data.

    Args:
        db: Database session
        artifacts: List of artifact objects
        latest_message_ids: Dictionary mapping chat_id (str) to latest message_id

    Returns:
        List of prepared artifact response dictionaries
    """
    if not artifacts:
        return []

    try:
        # Step 1: Batch load all latest executed versions for all artifacts
        artifact_ids = [artifact.id for artifact in artifacts]
        version_map = await batch_get_latest_artifact_versions(db, artifact_ids)

        # Step 2: Process each artifact with pre-loaded version data
        artifacts_data = []
        for artifact in artifacts:
            # Determine if this is the latest query for editability
            chat_id_str = str(artifact.chat_id)
            is_latest_query = artifact.message_id == latest_message_ids.get(chat_id_str)

            # Get version data from pre-loaded map
            latest_version = version_map.get(artifact.id)

            if latest_version and latest_version.data:
                artifact_data_to_use = latest_version.data
                is_edited = True
                actual_is_executed = latest_version.is_executed
                actual_success = latest_version.success
            else:
                # No executed versions, use original artifact data
                artifact_data_to_use = artifact.data
                is_edited = False
                actual_is_executed = artifact.is_executed
                actual_success = artifact.success

            # Extract tool_name
            tool_name: Optional[str] = None
            if isinstance(artifact_data_to_use, dict):
                pd = artifact_data_to_use.get("planning_data")
                if isinstance(pd, dict):
                    tn = pd.get("tool_name")
                    if isinstance(tn, str) and tn:
                        tool_name = tn

            try:
                if is_edited and artifact.entity in ["workitem", "project"]:
                    # Use special handling for edited artifacts
                    enhanced_data = await prepare_edited_artifact_data(artifact.entity, artifact_data_to_use)
                else:
                    # Use existing logic for unedited artifacts
                    enhanced_data = await prepare_artifact_data(
                        entity_type=artifact.entity,
                        artifact_data=artifact_data_to_use,
                        action=artifact.action,
                        entity_id=str(artifact.entity_id) if artifact.entity_id else None,
                    )
            except Exception as e:
                log.warning(f"Error preparing artifact data for {artifact.id}: {e}")
                enhanced_data = artifact_data_to_use

            # Extract entity info
            entity_id = None
            entity_url = None
            entity_name = None
            entity_type = None
            issue_identifier = None
            entity_identifier = None

            clean_parameters = enhanced_data.copy() if isinstance(enhanced_data, dict) else enhanced_data

            if isinstance(enhanced_data, dict) and "entity_info" in enhanced_data:
                entity_info = enhanced_data.get("entity_info", {})
                if isinstance(entity_info, dict):
                    entity_id = entity_info.get("entity_id")
                    entity_url = entity_info.get("entity_url")
                    entity_name = entity_info.get("entity_name")
                    entity_type = entity_info.get("entity_type")
                    issue_identifier = entity_info.get("issue_identifier")
                    entity_identifier = entity_info.get("entity_identifier")
                clean_parameters.pop("entity_info", None)
            elif actual_is_executed and artifact.entity_id:
                entity_id, entity_url, entity_name, entity_type, issue_identifier, entity_identifier = await populate_entity_info_from_artifact(
                    artifact
                )

            # Make entity_url absolute
            if isinstance(entity_url, str) and entity_url.startswith("/"):
                base = str(getattr(settings.plane_api, "FRONTEND_URL", "") or "").rstrip("/")
                if base:
                    entity_url = f"{base}{entity_url}"

            # Extract clean parameters
            if isinstance(clean_parameters, dict):
                if (
                    "action" in clean_parameters
                    and "tool_name" in clean_parameters
                    and "parameters" in clean_parameters
                    and isinstance(clean_parameters.get("parameters"), dict)
                ):
                    tn = clean_parameters.get("tool_name")
                    if tool_name is None and isinstance(tn, str) and tn:
                        tool_name = tn
                    clean_parameters = clean_parameters["parameters"].copy()
                elif "planning_data" in clean_parameters and isinstance(clean_parameters.get("planning_data"), dict):
                    pd = clean_parameters.get("planning_data", {})
                    tn = pd.get("tool_name")
                    if tool_name is None and isinstance(tn, str) and tn:
                        tool_name = tn
                    inner = pd.get("parameters")
                    if isinstance(inner, dict):
                        clean_parameters = inner.copy()

            artifact_dict = {
                "artifact_id": str(artifact.id),
                "sequence": artifact.sequence,
                "artifact_type": artifact.entity,
                "action": artifact.action,
                "tool_name": tool_name,
                "parameters": serialize_for_json(clean_parameters),
                "message_id": str(artifact.message_id) if artifact.message_id else None,
                "is_executed": actual_is_executed,
                "success": actual_success,
                "is_editable": (artifact.entity == "workitem" and is_latest_query and not actual_is_executed),
                "entity_id": entity_id,
                "entity_url": entity_url,
                "entity_name": entity_name,
                "entity_type": entity_type,
                "issue_identifier": issue_identifier,
                "entity_identifier": entity_identifier,
            }
            artifacts_data.append(artifact_dict)

        log.debug(f"Batch prepared {len(artifacts_data)} artifacts with optimized queries")
        return artifacts_data

    except Exception as e:
        log.error(f"Error in batch_prepare_artifact_response_data: {e}")
        # Fallback to individual processing
        artifacts_data = []
        for artifact in artifacts:
            chat_id_str = str(artifact.chat_id)
            is_latest_query = artifact.message_id == latest_message_ids.get(chat_id_str)
            artifact_dict = await prepare_artifact_response_data(db, artifact, is_latest_query)
            artifacts_data.append(artifact_dict)
        return artifacts_data
