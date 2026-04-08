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
Artifact followup processing service for Plane.

This module provides intelligent artifact modification capabilities through LLM-powered
query analysis, entity resolution, and field updates. It supports extensible entity types
and maintains clean separation between direct field modifications and entity resolution.

Key Components:
- EntityResolver: Handles search tool execution and entity UUID resolution
- ArtifactModifier: Applies field changes using extensible conventions
- ArtifactFollowupService: Main orchestration service
- ENTITY_FIELD_CONFIG: Extensible configuration for all entity types
"""

import json
import re
from datetime import date
from datetime import timedelta
from time import time
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from pydantic import UUID4
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.models.enums import MessageMetaStepType
from pi.services.actions.method_executor import MethodExecutor
from pi.services.actions.plane_actions_executor import PlaneActionsExecutor
from pi.services.actions.tools import get_tools_for_category
from pi.services.actions.tools.entity_search import get_entity_search_tools
from pi.services.chat.chat import PlaneChatBot
from pi.services.chat.prompts import plane_context
from pi.services.query_utils import _parse_query_internal
from pi.services.retrievers.pg_store.action_artifact import add_query_to_artifact
from pi.services.retrievers.pg_store.action_artifact import get_artifact_prompt_history_from_flow_steps

log = logger.getChild(__name__)

# Constants for maintainability and scalability
TOOL_ENTITY_MAPPING = {
    "search_module_by_name": "module",
    "search_workitem_by_name": "workitem",
    "search_project_by_name": "project",
    "search_cycle_by_name": "cycle",
    "search_label_by_name": "label",
    "search_state_by_name": "state",
    "search_user_by_name": "user",
    "search_workitem_by_identifier": "workitem",
}

SEARCH_CATEGORIES = ["users", "workitems", "states", "labels", "modules", "cycles", "projects"]

READONLY_PATTERNS = ("_list", "_retrieve", "_search", "_get_")


class ArtifactModificationResponse(BaseModel):
    """Structured response for artifact JSON modification."""

    modified_json: Dict[str, Any]
    change_summary: str
    success: bool = True


class EntityResolver:
    """Handles entity resolution using existing search tools infrastructure."""

    def __init__(self, chatbot: PlaneChatBot, context: Dict[str, Any]):
        self.chatbot = chatbot
        self.context = context

    async def get_search_tools(self, access_token: str) -> List[Any]:
        """Get entity search tools and read-only SDK tools for resolution.

        Uses the same direct approach as build mode (build_mode_helpers.py)
        to avoid the universal_tool_names whitelist in _build_planning_method_tools.
        """

        if access_token.startswith("plane_api_"):
            actions_executor = PlaneActionsExecutor(api_key=access_token, base_url=settings.plane_api.HOST)
        else:
            actions_executor = PlaneActionsExecutor(access_token=access_token, base_url=settings.plane_api.HOST)

        method_executor = MethodExecutor(actions_executor)
        tools: List[Any] = []
        seen_names: set[str] = set()

        def _add_unique(new_tools: List[Any]) -> int:
            added = 0
            for t in new_tools:
                name = getattr(t, "name", "")
                if name and name not in seen_names:
                    tools.append(t)
                    seen_names.add(name)
                    added += 1
            return added

        # 1. All entity search tools directly (same as build_mode_helpers.py line 361)
        try:
            entity_tools = get_entity_search_tools(method_executor, self.context) or []
            count = _add_unique(entity_tools)
            log.debug(f"Added {count} entity search tools")
        except Exception as e:
            log.error(f"Failed to load entity search tools: {e}")

        # 2. Read-only SDK tools per category as fallback for resolution
        for category in SEARCH_CATEGORIES:
            try:
                cat_tools = get_tools_for_category(category, method_executor, self.context) or []
                readonly_tools = [t for t in cat_tools if any(p in getattr(t, "name", "") for p in READONLY_PATTERNS)]
                count = _add_unique(readonly_tools)
                log.debug(f"Added {count} read-only tools for category: {category}")
            except Exception as e:
                log.error(f"Could not build read-only tools for category {category}: {e}")

        log.info(f"Total resolution tools available: {len(tools)}")

        return tools

    async def execute_tool_calls(self, tool_calls: List[Any], search_tools: List[Any]) -> Dict[str, Any]:
        """Execute tool calls and return results using existing patterns."""
        tool_results = {}

        for tool_call in tool_calls:
            tool_name = tool_call.get("name", "")
            tool_args = tool_call.get("args", {})

            # Find and execute tool (same pattern as action_executor.py line 708)
            tool_func = next((t for t in search_tools if t.name == tool_name), None)
            if not tool_func:
                log.warning(f"Tool {tool_name} not found")
                continue

            try:
                # Execute tool (same pattern as action_executor.py line 716)
                result = await tool_func.ainvoke(tool_args) if hasattr(tool_func, "ainvoke") else tool_func.invoke(tool_args)
                log.info(f"Tool {tool_name} executed successfully")

                # Extract entity info using existing patterns
                entity_info = self._extract_entity_info(tool_name, tool_args, result)
                if entity_info:
                    tool_results.update(entity_info)

            except Exception as e:
                log.error(f"Tool execution failed for {tool_name}: {e}")
                continue

        return tool_results

    def _extract_entity_info(self, tool_name: str, tool_args: Dict[str, Any], result: Any) -> Dict[str, Any]:
        """Extract entity information using standardized mapping."""
        entity_type = TOOL_ENTITY_MAPPING.get(tool_name)
        if not entity_type:
            return {}

        # Extract entity name using standardized patterns
        if tool_name == "search_user_by_name":
            entity_name = tool_args.get("display_name", "unknown")
        elif tool_name == "search_workitem_by_identifier":
            entity_name = tool_args.get("identifier", "unknown")
        else:
            entity_name = tool_args.get("name", "unknown")

        # Extract entity ID from result
        entity_id = self._extract_entity_id_from_result(result)
        if not entity_id:
            return {}

        # Return using standard field naming conventions
        result_key = f"{entity_type}_id" if entity_type != "workitem" else "issue_id"
        name_key = f"{entity_type}_name"

        return {result_key: entity_id, name_key: entity_name}

    def _extract_entity_id_from_result(self, result: Any) -> Optional[str]:
        """Extract entity ID from tool result using existing patterns."""
        # Handle structured dict payload (new format) - highest priority
        if isinstance(result, dict):
            # Check entity field first
            if "entity" in result and isinstance(result["entity"], dict):
                entity = result["entity"]
                if "entity_id" in entity:
                    return str(entity["entity_id"])
            # Check data field
            if "data" in result and isinstance(result["data"], dict):
                data = result["data"]
                if "id" in data:
                    return str(data["id"])
            # Check if result itself has entity_id
            if "entity_id" in result:
                return str(result["entity_id"])
            # Check if result itself has id
            if "id" in result:
                return str(result["id"])

        # Handle string results (legacy format)
        result_str = str(result)

        # Look for UUID patterns (standard Plane format)
        uuid_pattern = r"[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"
        uuid_matches = re.findall(uuid_pattern, result_str, re.IGNORECASE)

        if uuid_matches:
            return uuid_matches[0]

        # Try parsing JSON for id field
        try:
            json_match = re.search(r"\{.*\}", result_str, re.DOTALL)
            if json_match:
                parsed_data = json.loads(json_match.group(0))
                if isinstance(parsed_data, dict) and "id" in parsed_data:
                    return str(parsed_data["id"])
        except json.JSONDecodeError:
            pass

        return None


class ArtifactModifier:
    """Handles artifact JSON modification using existing field conventions."""

    def apply_entity_changes(self, modified_json: Dict[str, Any], tool_results: Dict[str, Any], entity_type: str) -> List[str]:
        """Apply entity changes using standard Plane field conventions."""
        changes_made: List[str] = []

        for result_key, entity_id in tool_results.items():
            if not result_key.endswith("_id") or not entity_id:
                continue

            # Get entity type (same pattern as main flow)
            resolved_entity_type = "workitem" if result_key == "issue_id" else result_key.replace("_id", "")
            entity_name = tool_results.get(f"{resolved_entity_type}_name", "unknown")

            # Apply field change using standard conventions
            if self._apply_field_change(modified_json, result_key, entity_id, resolved_entity_type, entity_type):
                changes_made.append(f"Applied {resolved_entity_type} change: {entity_name}")
                log.info(f"Applied {resolved_entity_type} change: {entity_id}")

        return changes_made

    def _apply_field_change(
        self, modified_json: Dict[str, Any], result_key: str, entity_id: str, resolved_entity_type: str, current_entity_type: str
    ) -> bool:
        """Apply single field change using extensible field conventions."""
        # Get field mapping from entity configuration
        if resolved_entity_type == "user":
            # Find the appropriate user assignment field for current entity
            entity_config = ENTITY_FIELD_CONFIG.get(current_entity_type, {})
            user_field = entity_config.get("user_assignment_field", "assignee_ids")

            # Ensure user_field is a string
            if isinstance(user_field, str) and user_field.endswith("_ids"):
                return self._add_to_array(modified_json, user_field, entity_id)
            elif isinstance(user_field, str):
                return self._set_field_if_different(modified_json, user_field, entity_id)
            else:
                return False

        elif resolved_entity_type == "label":
            return self._add_to_array(modified_json, "label_ids", entity_id)
        elif resolved_entity_type == "module":
            # Check for array field first, fallback to single field
            if "module_ids" in modified_json:
                return self._add_to_array(modified_json, "module_ids", entity_id)
            else:
                return self._set_field_if_different(modified_json, "module_id", entity_id)
        elif resolved_entity_type == "workitem":
            return self._set_field_if_different(modified_json, "parent_id", entity_id)
        else:
            # Direct field mapping for other entities (state_id, cycle_id, project_id, etc.)
            return self._set_field_if_different(modified_json, result_key, entity_id)

    def _add_to_array(self, modified_json: Dict[str, Any], field_name: str, entity_id: str) -> bool:
        """Add entity to array field if not already present."""
        if field_name not in modified_json:
            modified_json[field_name] = []
        if entity_id not in modified_json[field_name]:
            modified_json[field_name].append(entity_id)
            return True
        return False

    def _set_field_if_different(self, modified_json: Dict[str, Any], field_name: str, entity_id: str) -> bool:
        """Set field value if different from current value."""
        old_value = modified_json.get(field_name)
        if old_value != entity_id:
            modified_json[field_name] = entity_id
            return True
        return False


class ArtifactFollowupService:
    """Main service for handling artifact followup queries."""

    def __init__(self, chatbot: PlaneChatBot, workspace_slug: str, project_id: Optional[str] = None):
        self.chatbot = chatbot
        self.workspace_slug = workspace_slug
        self.project_id = project_id

    async def process_followup_query(
        self,
        current_artifact_data: Dict[str, Any],
        current_query: str,
        previous_queries: List[str],
        entity_type: str,
        user_id: str,
        db: AsyncSession,
        message_id: UUID4,
    ) -> Dict[str, Any]:
        """Process followup query using LLM with entity resolution tools."""
        try:
            context = self._build_context(current_artifact_data, current_query, previous_queries, entity_type, user_id)

            # Get access token (same pattern as main flow)
            access_token = await self.chatbot._get_oauth_token_for_user(db, context["user_id"], context["workspace_id"])

            if not access_token:
                log.warning("No access token available for entity resolution")
                return {"modified_json": current_artifact_data, "change_summary": "No access token available for entity resolution", "success": False}

            # Set up entity resolver
            resolver = EntityResolver(
                self.chatbot,
                {
                    "workspace_slug": self.workspace_slug,
                    "project_id": self.project_id,
                    "user_id": context["user_id"],
                },
            )

            # Get search tools and execute LLM with tools
            search_tools = await resolver.get_search_tools(access_token)
            if not search_tools:
                log.warning("No search tools available for entity resolution")
                return {"modified_json": current_artifact_data, "change_summary": "No search tools available for entity resolution", "success": False}

            # Execute LLM with tools
            modified_data = await self._execute_llm_with_tools(context, search_tools, resolver, db, message_id)

            return {"modified_json": modified_data.modified_json, "change_summary": modified_data.change_summary, "success": modified_data.success}

        except Exception as e:
            log.error(f"Error processing followup query: {e}")
            return {"modified_json": current_artifact_data, "change_summary": "Error processing followup query", "success": False}

    def _build_context(self, current_data: Dict[str, Any], query: str, previous_queries: List[str], entity_type: str, user_id: str) -> Dict[str, Any]:
        """Build context for LLM processing."""
        return {
            "current_json": current_data,
            "user_query": query,
            "previous_queries": previous_queries[-5:] if previous_queries else [],
            "entity_type": entity_type,
            "workspace_slug": self.workspace_slug,
            "project_id": self.project_id,
            "user_id": user_id,  # Explicitly pass user_id
            "workspace_id": self.chatbot.current_context.get("workspace_id"),
        }

    async def _execute_llm_with_tools(
        self, context: Dict[str, Any], search_tools: List[Any], resolver: EntityResolver, db: AsyncSession, message_id: UUID4
    ) -> ArtifactModificationResponse:
        """Execute LLM with search tools for entity resolution."""
        try:
            # Bind tools to LLM (same pattern as main flow)
            # deduplicate search tools
            search_tools = list({tool.name: tool for tool in search_tools}.values())
            llm_with_tools = self.chatbot.tool_llm.bind_tools(search_tools)
            llm_with_tools.set_tracking_context(message_id, db, MessageMetaStepType.ARTIFACT_MODIFICATION)

            # Format prompt
            formatted_context = self._format_context_for_llm(context)

            # Execute LLM
            start_time = time()
            response = await llm_with_tools.ainvoke([("system", ARTIFACT_MODIFICATION_PROMPT), ("human", formatted_context)])
            # Parse response and execute tools if needed
            end_time = time()
            log.info(f"Artifact modification LLM execution time: {end_time - start_time} seconds")
            return await self._parse_llm_response(response, context, search_tools, resolver, db, message_id)

        except Exception as e:
            log.error(f"Error executing LLM with tools: {e}")
            return ArtifactModificationResponse(
                modified_json=context["current_json"], change_summary=f"Error processing modification: {str(e)}", success=False
            )

    def _format_context_for_llm(self, context: Dict[str, Any]) -> str:
        """Format context for LLM prompt."""

        parts = [
            f"Current artifact JSON:\n{json.dumps(context['current_json'], indent=2)}",
            f"\nUser request: {context['user_query']}",
            f"\nEntity type: {context['entity_type']}",
            f"\nToday's date: {date.today().isoformat()}",
            f"\nWorkspace: {context['workspace_slug']}",
        ]

        # Add current user context for "me" references
        if context.get("user_id"):
            entity_type = context.get("entity_type", "workitem")
            entity_config = ENTITY_FIELD_CONFIG.get(entity_type, {})
            user_field = entity_config.get("user_assignment_field", "assignee_ids")

            parts.append(f"\nCurrent user ID: {context['user_id']}")
            parts.append(f"**CRITICAL**: When user says 'me', 'add me', 'assign me', 'assign it to me', use this user ID: {context['user_id']}")
            parts.append(f"For self-assignment: add '{context['user_id']}' to {user_field} field")
            parts.append(f"User assignment field for {context.get('entity_type', 'entity')}: {user_field}")
            parts.append(
                f"**MANDATORY**: If query contains 'assign it to me' or similar, "
                f'your JSON MUST include: {{"{user_field}": ["{context["user_id"]}"]}}'
            )
            parts.append(
                f"**WARNING**: In mixed queries, do NOT skip self-assignment - always include {user_field} with current user ID when requested"
            )

        # Add field classification info for this entity type
        entity_type = context.get("entity_type")
        entity_config = ENTITY_FIELD_CONFIG.get(entity_type, {}) if entity_type else {}
        if entity_config:
            direct_fields = entity_config.get("direct_fields", [])
            relation_fields = entity_config.get("relation_fields", [])
            parts.append(f"\nDirect modification fields: {', '.join(direct_fields)}")
            parts.append(f"Relation fields (need entity resolution): {', '.join(relation_fields)}")

        if context.get("project_id"):
            parts.append(f"Project ID: {context['project_id']}")

        if context.get("previous_queries"):
            prev_queries = "\n".join([f"- {q}" for q in context["previous_queries"]])
            parts.append(f"\nPrevious followup queries:\n{prev_queries}")

        return "\n".join(parts)

    async def _parse_llm_response(
        self, response, context: Dict[str, Any], search_tools: List[Any], resolver: EntityResolver, db: AsyncSession, message_id: UUID4
    ) -> ArtifactModificationResponse:
        """Parse LLM response and execute tool calls if present, or handle direct modifications."""
        try:
            modifier = ArtifactModifier()
            modified_json = context["current_json"].copy()
            changes_made = []

            # Handle entity resolution via tool calls
            if hasattr(response, "tool_calls") and response.tool_calls:
                log.info(f"Processing {len(response.tool_calls)} tool calls for entity resolution")
                tool_results = await resolver.execute_tool_calls(response.tool_calls, search_tools)
                if tool_results:
                    entity_changes = modifier.apply_entity_changes(modified_json, tool_results, context["entity_type"])
                    changes_made.extend(entity_changes)

            # Handle remaining modifications the tool calls didn't cover
            try:
                entity_config = ENTITY_FIELD_CONFIG.get(context["entity_type"], {})
                all_fields = list(entity_config.get("direct_fields", [])) + list(entity_config.get("relation_fields", []))

                # Exclude fields already resolved by tool calls so the extraction LLM doesn't overwrite UUIDs with names
                already_resolved = {k for k in modified_json if modified_json[k] != context["current_json"].get(k)}
                remaining_fields = [f for f in all_fields if f not in already_resolved]

                direct_changes = await _apply_direct_query_modifications(
                    modified_json,
                    context["user_query"],
                    context["entity_type"],
                    {"target_fields": remaining_fields, "operations": ["set", "change", "add", "remove", "clear"], "user_id": context.get("user_id")},
                    message_id,
                    db,
                )
                changes_made.extend(direct_changes)

            except Exception as e:
                log.debug(f"Error applying direct modifications in mixed query: {e}")

            # Also check if LLM provided direct content modifications (fallback)
            if hasattr(response, "content") and response.content:
                try:
                    # Try to extract JSON from the response content
                    json_match = re.search(r"\{.*\}", str(response.content), re.DOTALL)
                    if json_match:
                        llm_modifications = json.loads(json_match.group(0))
                        log.debug(f"Extracted JSON modifications from LLM response: {llm_modifications}")
                        # Apply any direct modifications from LLM
                        for field, value in llm_modifications.items():
                            if field in modified_json and modified_json[field] != value:
                                modified_json[field] = value
                                changes_made.append(f"Updated {field} via LLM content")
                            elif field not in modified_json:
                                # New field being added
                                modified_json[field] = value
                                changes_made.append(f"Added {field} via LLM content")
                    else:
                        log.warning("No JSON found in LLM response content - this may cause missing modifications")
                except Exception as e:
                    log.warning(f"Failed to parse JSON from LLM response: {e} - this may cause missing modifications")

            if not changes_made:
                return ArtifactModificationResponse(
                    modified_json=context["current_json"], change_summary="No changes could be applied to the artifact", success=False
                )

            return ArtifactModificationResponse(modified_json=modified_json, change_summary="; ".join(changes_made), success=True)

        except Exception as e:
            log.error(f"Error parsing LLM response: {e}")
            return ArtifactModificationResponse(
                modified_json=context["current_json"], change_summary=f"Error parsing response: {str(e)}", success=False
            )


ARTIFACT_MODIFICATION_PROMPT = f"""# Plane Artifact Modification Assistant

You are a specialized AI assistant for modifying Plane project management artifacts.
Your role is to process user requests and generate precise JSON modifications.

## Context about Plane
{plane_context}

## Your Task

Process user modification requests through a two-phase approach:

### Phase 1: Entity Resolution
- Execute search tools to resolve entity names to UUIDs
- Search tools run automatically without user approval
- Gather all required UUIDs for proper JSON modification

### Phase 2: JSON Construction
- Apply resolved UUIDs and direct field changes
- Preserve existing JSON structure
- Output complete modification JSON

## Field Classification

**Direct Fields** (modify values directly):
- Text: name, description_html
- Dates: start_date, target_date
- Values: priority, estimate_point

**Relation Fields** (require UUID resolution):
- Users: assignee_ids, member_ids, lead_id
- Entities: state_id, label_ids, cycle_id, module_ids
- Relationships: parent_id, project_id

## Self-Assignment Rules

When user references "me", "myself", "assign to me", or "assign it to me":
1. Use the current user ID provided in context (NEVER use the word "me")
2. Apply to the appropriate user field for the entity type
3. NO search tool needed - direct assignment with actual user ID
4. Always include in final JSON response with proper array format
5. **CRITICAL**: Use actual UUID, not the word "me"

## Processing Workflow

1. **Identify Requirements**
   - Parse user request for entity references
   - Determine which fields need modification
   - Check for self-assignment patterns

2. **Execute Entity Resolution**
   - Call search tools for entity names (users, states, labels, etc.)
   - Extract UUIDs from tool responses
   - Skip search for "me" references - use context user ID

3. **Generate Final JSON**
   - Combine resolved UUIDs with direct field changes
   - Include ALL requested modifications
   - Use proper field names and data types

## Search Tools Available

- `search_user_by_name(display_name="username")` - Find users
- `search_state_by_name(name="state_name")` - Find workflow states
- `search_label_by_name(name="label_name")` - Find labels
- `search_module_by_name(name="module_name")` - Find modules
- `search_cycle_by_name(name="cycle_name")` - Find cycles
- `search_project_by_name(name="project_name")` - Find projects
- `search_workitem_by_identifier(identifier="PROJ-123")` - Find work items

## Response Format

After executing any necessary search tools, provide a complete JSON object with all modifications:

```json
{{"field_name": "value",
  "relation_field_ids": ["uuid1", "uuid2"],
  "single_relation_id": "uuid"
}}
```

## Examples

**Simple Assignment:**
Request: "assign it to me"
Response: `{{"assignee_ids": ["actual-user-uuid-here"]}}`  (NOT "me")

**Mixed Operations:**
Request: "set state to done, priority to high, assign to me, add dev label"
Process:
1. Call `search_state_by_name("done")` → get state UUID
2. Call `search_label_by_name("dev")` → get label UUID
3. Use current user ID for self-assignment
4. Response:
```json
{{"state_id": "state-uuid",
  "priority": "high",
  "assignee_ids": ["actual-user-uuid-here"],
  "label_ids": ["label-uuid"]
}}
```

## Critical Requirements

- **Completeness**: Include ALL requested modifications in final JSON
- **Accuracy**: Use proper field names and UUIDs (never entity names in ID fields)
- **Self-Assignment**: Always handle "me" references using context user ID
- **Array Handling**: Add to existing arrays unless replacement specified
- **Precision**: Only modify explicitly requested fields

Your success is measured by providing complete, accurate JSON modifications that fulfill every aspect of the user's request."""

# Entity field configuration - extensible for all entity types
ENTITY_FIELD_CONFIG = {
    "workitem": {
        "direct_fields": ["name", "description_html", "priority", "start_date", "target_date", "estimate_point"],
        "relation_fields": ["assignee_ids", "label_ids", "state_id", "type_id", "parent_id", "cycle_id", "module_ids"],
        "user_assignment_field": "assignee_ids",
    },
    "epic": {
        "direct_fields": ["name", "description_html", "priority", "start_date", "target_date"],
        "relation_fields": ["assignee_ids", "label_ids", "state_id"],
        "user_assignment_field": "assignee_ids",
    },
    "project": {
        "direct_fields": ["name", "description", "emoji", "icon_prop", "cover_image"],
        "relation_fields": ["lead_id", "default_assignee_id", "project_lead_ids", "member_ids"],
        "user_assignment_field": "member_ids",
    },
    "cycle": {
        "direct_fields": ["name", "description", "start_date", "end_date"],
        "relation_fields": ["owned_by_id", "assignee_ids"],
        "user_assignment_field": "assignee_ids",
    },
    "module": {
        "direct_fields": ["name", "description", "start_date", "target_date"],
        "relation_fields": ["lead_id", "member_ids"],
        "user_assignment_field": "member_ids",
    },
    "page": {
        "direct_fields": ["name", "description_html"],
        "relation_fields": ["owned_by_id", "access"],
        "user_assignment_field": "owned_by_id",
    },
}


async def generate_followup_artifact_data(
    current_artifact_data: Dict[str, Any],
    current_query: str,
    previous_followup_queries: List[str],
    entity_type: str,
    workspace_id: UUID4,
    user_id: str,
    user_message_id: UUID4,
    project_id: Optional[UUID4] = None,
    db: Optional[AsyncSession] = None,
) -> Dict[str, Any]:
    """Generate updated artifact data based on followup query using AI assistance."""
    if db is None:
        log.warning("Database session is required but not provided")
        return {"modified_json": current_artifact_data, "change_summary": "Database session is required but not provided", "success": False}

    try:
        # Initialize chatbot and context
        chatbot = PlaneChatBot()
        chatbot.current_context = {"user_id": user_id, "workspace_id": str(workspace_id), "project_id": str(project_id) if project_id else None}

        # Get workspace slug
        from pi.app.api.v1.helpers.plane_sql_queries import get_workspace_slug

        workspace_slug = await get_workspace_slug(str(workspace_id))

        if not workspace_slug:
            log.warning(f"Could not resolve workspace slug for workspace {workspace_id}")
            return {
                "modified_json": current_artifact_data,
                "change_summary": f"Could not resolve workspace slug for workspace {workspace_id}",
                "success": False,
            }

        # Create and execute followup service
        followup_service = ArtifactFollowupService(chatbot=chatbot, workspace_slug=workspace_slug, project_id=str(project_id) if project_id else None)

        result = await followup_service.process_followup_query(
            current_artifact_data=current_artifact_data,
            current_query=current_query,
            previous_queries=previous_followup_queries,
            entity_type=entity_type,
            user_id=user_id,
            db=db,
            message_id=user_message_id,
        )

        return result.get("modified_json", current_artifact_data)

    except Exception as e:
        log.error(f"Error generating followup artifact data: {e}")
        return {"modified_json": current_artifact_data, "change_summary": "Error generating followup artifact data", "success": False}


async def handle_artifact_prompt_followup(
    db: AsyncSession,
    artifact_id: UUID4,
    current_query: str,
    workspace_id: UUID4,
    chat_id: UUID4,
    user_id: str,
    user_message_id: UUID4,
    current_artifact_data: Dict[str, Any],
    entity_type: str,
    project_id: Optional[UUID4] = None,
) -> Dict[str, Any]:
    """Handle artifact prompt followup with intelligent query decomposition."""
    try:
        # Strip HTML so all downstream LLM calls receive plain text
        clean_query = _parse_query_internal(current_query).parsed_content

        # Step 1: Decompose query to understand what needs to be done
        query_analysis = await _analyze_query_requirements(clean_query, entity_type, db, user_id, workspace_id, user_message_id)

        # Step 2: Route based on analysis
        if query_analysis["needs_entity_resolution"]:
            log.debug(f"Using LLM path for query requiring entity resolution: {current_query}")

            # Get previous queries
            previous_followup_queries = await get_artifact_prompt_history_from_flow_steps(db=db, artifact_id=artifact_id, message_id=user_message_id)

            # Generate updated artifact data via LLM
            updated_artifact_data = await generate_followup_artifact_data(
                current_artifact_data=current_artifact_data,
                current_query=clean_query,
                previous_followup_queries=previous_followup_queries,
                entity_type=entity_type,
                workspace_id=workspace_id,
                user_id=user_id,
                user_message_id=user_message_id,
                project_id=project_id,
                db=db,
            )
        else:
            log.debug(f"Using direct modification for simple query: {current_query}")
            # Apply direct modifications
            updated_artifact_data = current_artifact_data.copy()
            changes = await _apply_direct_query_modifications(updated_artifact_data, clean_query, entity_type, query_analysis, user_message_id, db)
            if not changes:
                return {"artifact_data": current_artifact_data, "change_summary": "No modifications could be applied", "success": True}

        # Store the original HTML query for history, not the stripped version
        await add_query_to_artifact(db=db, artifact_id=artifact_id, message_id=user_message_id, new_query=current_query, chat_id=chat_id)

        return {"artifact_data": updated_artifact_data, "success": True}

    except Exception as e:
        log.error(f"Error handling artifact prompt followup: {e}")
        return {"artifact_data": current_artifact_data, "change_summary": "Error handling artifact prompt followup", "success": False}


async def _analyze_query_requirements(
    query: str, entity_type: str, db: AsyncSession, user_id: str, workspace_id: UUID4, message_id: UUID4
) -> Dict[str, Any]:
    """Use LLM to analyze what the query needs - direct fields vs entity resolution."""

    # Get field configuration for this entity
    entity_config = ENTITY_FIELD_CONFIG.get(entity_type, {})
    direct_fields = entity_config.get("direct_fields", [])
    relation_fields = entity_config.get("relation_fields", [])

    # Get current date context
    today = date.today().isoformat()

    analysis_prompt = f"""Analyze this {entity_type} modification request. Determine whether it can be handled by setting literal values on direct fields, or whether it requires looking up entities (users, states, labels, modules, cycles, projects, work items) by name.

Query: "{query}"
Today: {today}

Direct fields (literal values — text, dates, priority, numbers): {", ".join(direct_fields)}
Relation fields (require entity lookup to resolve UUIDs): {", ".join(relation_fields)}

Set needs_entity_resolution = true when:
- The query references an entity by name (e.g. state "done", label "urgent", user "john")
- The query implies an entity lookup (e.g. "mark as done" → state_id, "add me" → assignee_ids)

Set needs_entity_resolution = false when:
- The query only sets literal values on direct fields (e.g. "rename to X", "set priority to high", "set start date to today")

Return the specific target_fields from the lists above that the query intends to modify.

Examples:
- "rename to Lake" → false, target_fields=["name"], operations=["set"]
- "set priority to high" → false, target_fields=["priority"], operations=["set"]
- "set start date to today" → false, target_fields=["start_date"], operations=["set"]
- "change state to done" → true, target_fields=["state_id"], operations=["set"]
- "mark it as done" → true, target_fields=["state_id"], operations=["set"]
- "assign to john" → true, target_fields=["assignee_ids"], operations=["add"]
- "assign it to me" → true, target_fields=["assignee_ids"], operations=["add"]
- "add urgent label" → true, target_fields=["label_ids"], operations=["add"]
- "set priority to high and assign to me" → true, target_fields=["priority", "assignee_ids"], operations=["set", "add"]

Respond with JSON only:
{{"needs_entity_resolution": true/false, "target_fields": [...], "operations": [...]}}"""  # noqa: E501
    try:
        # Initialize chatbot for analysis
        chatbot = PlaneChatBot()
        chatbot.current_context = {"user_id": user_id, "workspace_id": str(workspace_id)}

        # Set tracking context for query analysis
        chatbot.llm.set_tracking_context(message_id, db, MessageMetaStepType.ARTIFACT_MODIFICATION)

        # Get LLM analysis
        response = await chatbot.llm.ainvoke([("system", analysis_prompt)])

        # Parse JSON response
        # Extract JSON from response
        json_match = re.search(r"\{.*\}", str(response.content), re.DOTALL)
        if json_match:
            analysis = json.loads(json_match.group(0))
            return analysis
        else:
            # Fallback: assume needs entity resolution if can't parse
            return {"needs_entity_resolution": True, "target_fields": [], "operations": []}

    except Exception as e:
        log.debug(f"Query analysis failed: {e}")
        # Fallback: assume needs entity resolution
        return {"needs_entity_resolution": True, "target_fields": [], "operations": []}


async def _apply_direct_query_modifications(
    modified_json: Dict[str, Any], query: str, entity_type: str, analysis: Dict[str, Any], message_id: UUID4, db: AsyncSession
) -> List[str]:
    """Apply direct modifications using LLM-generated field values."""

    # Let LLM extract the actual field values and modifications with current context
    field_values = await _extract_field_values_via_llm(query, entity_type, analysis, current_data=modified_json, message_id=message_id, db=db)

    changes_made = []
    for field_name, new_value in field_values.items():
        if _update_field_if_different(modified_json, field_name, new_value):
            changes_made.append(f"Updated {field_name} to {new_value}")

    return changes_made


async def _extract_field_values_via_llm(
    query: str,
    entity_type: str,
    analysis: Dict[str, Any],
    current_data: Optional[Dict[str, Any]] = None,
    message_id: Optional[UUID4] = None,
    db: Optional[AsyncSession] = None,
) -> Dict[str, Any]:
    """Use LLM to extract exact field values from the query with intelligent content generation."""

    # Get entity configuration
    entity_config = ENTITY_FIELD_CONFIG.get(entity_type, {})
    direct_fields = entity_config.get("direct_fields", [])
    target_fields = analysis.get("target_fields", [])
    operations = analysis.get("operations", [])
    user_id = analysis.get("user_id")
    user_field = entity_config.get("user_assignment_field")

    # Get current context for better generation
    current_name = current_data.get("name", "") if current_data else ""
    current_description = current_data.get("description_html", "") if current_data else ""
    current_priority = current_data.get("priority", "") if current_data else ""

    # Build user context section for self-assignment
    user_context = ""
    if user_id and user_field:
        user_context = f"""
### Self-Assignment ({user_field})
- When the user says "me", "myself", "assign to me", "assign it to me", "add me": use user ID "{user_id}"
- For array fields like assignee_ids: return ["{user_id}"]
- For single fields like lead_id: return "{user_id}"
"""

    # Create intelligent value extraction prompt
    extraction_prompt = f"""# Field Value Extraction for {entity_type.title()}

Extract precise field values from the user request with intelligent content generation.

**User Request:** "{query}"

**Current Artifact State:**
- Name: "{current_name}"
- Description: "{current_description}"
- Priority: "{current_priority}"

**Processing Context:**
- Date: {date.today().isoformat()}
- Tomorrow: {(date.today() + timedelta(days=1)).isoformat()}
- Target Fields: {target_fields}
- Operations: {operations}
- Available Fields: {direct_fields}

## Value Generation Rules

### Text Fields (name, description_html)
- **Specific Values**: Use exact text when provided ("set name to X" → "X")
- **Enhancement Requests**: Improve existing content ("make title better")
- **Generation Requests**: Create professional content when empty
- **Preservation**: Extend existing content, don't replace unless specified

### Priority Field
- **Escalation**: "urgent" > "high" > "medium" > "low"
- **Keywords**: "urgent", "critical" → "urgent" | "important", "high priority" → "high"
- **Relative**: "increase priority" → upgrade current level

### Date Fields (start_date, target_date)
- **Today**: "today", "now" → {date.today().isoformat()}
- **Tomorrow**: "tomorrow" → {(date.today() + timedelta(days=1)).isoformat()}
- **Specific**: "2025-10-15" → "2025-10-15"
- **Format**: Always YYYY-MM-DD

### Numeric Fields (estimate_point)
- **Direct**: "5 points", "estimate 3" → integer value
- **Story Points**: "make it a 3 point task" → 3
{user_context}
## Content Generation Examples

```
Current: "Bug fix" + "make title descriptive"
→ {{"name": "Fix critical authentication bug in user login system"}}

Current: "" + "add description"
→ {{"description_html": "This task requires careful analysis and implementation with proper testing."}}

Current: "medium" + "increase priority"
→ {{"priority": "high"}}

Current: "" + "set start date to today"
→ {{"start_date": "{date.today().isoformat()}"}}
```

## Special Cases
- **Clear/Remove text fields**: "none", "empty", "clear" → ""
- **Clear/Remove relation fields** (any field ending in _id or _ids): "remove", "clear", "none" → null
  - Example: "remove the cycle" → {{"cycle_id": null}}
  - Example: "clear the parent" → {{"parent_id": null}}
  - Example: "remove assignees" → {{"assignee_ids": []}}
- **Preserve**: Don't modify fields not mentioned in request
- **Context-Aware**: Generate content based on existing artifact data

## Required Output

Respond with JSON containing only the fields to modify:
```json
{{
  "field_name": "generated_value",
  "another_field": "another_value"
}}
```"""

    try:
        # Initialize chatbot for extraction
        chatbot = PlaneChatBot()

        # Set tracking context if available
        if message_id and db:
            chatbot.llm.set_tracking_context(message_id, db, MessageMetaStepType.ARTIFACT_MODIFICATION)

        # Get LLM extraction
        response = await chatbot.llm.ainvoke([("system", extraction_prompt)])

        # Parse JSON response
        # Extract JSON from response
        json_match = re.search(r"\{.*\}", str(response.content), re.DOTALL)
        if json_match:
            field_values = json.loads(json_match.group(0))
            log.debug(f"Generated field values for query '{query}': {field_values}")
            return field_values
        else:
            log.warning(f"No JSON found in LLM response for query: {query}")
            return {}

    except Exception as e:
        log.error(f"Field value extraction failed: {e}")
        return {}


def _update_field_if_different(json_data: Dict[str, Any], field: str, new_value: Any) -> bool:
    """Update field if the new value is different from current value."""
    if new_value == "" and (field.endswith("_id") or field.endswith("_ids")):
        new_value = None if field.endswith("_id") else []

    current_value = json_data.get(field)
    if current_value != new_value:
        json_data[field] = new_value
        return True
    return False
