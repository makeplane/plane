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
Tool generator for auto-generating LangChain tools from centralized metadata.

This module provides functionality to dynamically create LangChain tools
from ToolMetadata definitions, eliminating manual tool duplication.
"""

import inspect
from typing import Any
from typing import Callable
from typing import Dict
from typing import List
from typing import Optional

from langchain_core.tools import tool
from pydantic import BaseModel
from pydantic import Field
from pydantic import create_model

from pi import logger
from pi.services.actions.tool_metadata import ToolMetadata
from pi.services.actions.tools.base import PlaneToolBase
from pi.services.chat.helpers.tool_utils import generate_error_message
from pi.services.chat.helpers.tool_utils import is_uuid_like

# Parameters that represent workspace-level identity and must always be
# hard-overridden from context to prevent cross-workspace data leaks.
# The LLM is never trusted for these values.
_WORKSPACE_PARAMS = frozenset({"workspace_slug", "workspace_id"})

log = logger.getChild(__name__)


# Complete type mapping - no string parsing needed
_TYPE_MAP = {
    # Basic types
    "str": str,
    "int": int,
    "float": float,
    "bool": bool,
    "dict": dict,
    "list": list,
    # Optional types
    "Optional[str]": Optional[str],
    "Optional[int]": Optional[int],
    "Optional[float]": Optional[float],
    "Optional[bool]": Optional[bool],
    "Optional[dict]": Optional[dict],
    "Optional[list]": Optional[list],
    # Container types
    "List[str]": list,
    "List[int]": list,
    "List[dict]": list,
    "Dict[str, Any]": dict,
    "Dict[str, str]": dict,
}


class WorkItemFilterSchema(BaseModel):
    """Schema for work item filters."""

    priority: Optional[str] = Field(
        default=None,
        description="Filter by priority (urgent, high, medium, low, none)",
    )
    state_group: Optional[str] = Field(
        default=None,
        description="Filter by state group (backlog, unstarted, started, completed, cancelled)",
    )
    assignee_id: Optional[str] = Field(default=None, description="Filter by assignee UUID")
    project_id: Optional[str] = Field(default=None, description="Filter by project UUID")
    cycle_id: Optional[str] = Field(default=None, description="Filter by cycle UUID")
    module_id: Optional[str] = Field(default=None, description="Filter by module UUID")
    label_id: Optional[str] = Field(default=None, description="Filter by label UUID")

    class Config:
        extra = "allow"


def _parse_type_annotation(type_str: str) -> Any:
    """Parse type annotation string into actual Python type.

    Args:
        type_str: Type as string (e.g., "str", "Optional[str]", "List[str]")

    Returns:
        Python type object or typing generic
    """
    return _TYPE_MAP.get(type_str, str)


def _build_function_signature(metadata: ToolMetadata) -> Dict[str, inspect.Parameter]:
    """Build function signature from metadata parameters.

    Args:
        metadata: Tool metadata

    Returns:
        Dictionary of parameter name to inspect.Parameter objects
    """
    sig_params = {}

    for param in metadata.parameters:
        # Determine default value
        if param.required:
            default = inspect.Parameter.empty
        else:
            default = param.default  # type: ignore[assignment]

        # Create parameter
        sig_params[param.name] = inspect.Parameter(
            name=param.name,
            kind=inspect.Parameter.KEYWORD_ONLY,
            default=default,
            annotation=_parse_type_annotation(param.type),
        )

    return sig_params


def _build_type_annotations(metadata: ToolMetadata) -> Dict[str, Any]:
    """Build type annotations dictionary for function.

    Args:
        metadata: Tool metadata

    Returns:
         Dictionary of parameter names to types
    """
    annotations = {}

    for param in metadata.parameters:
        annotations[param.name] = _parse_type_annotation(param.type)

    # Add return type
    annotations["return"] = Dict[str, Any]

    return annotations


def _build_docstring(metadata: ToolMetadata) -> str:
    """Generate Google-style docstring from metadata.

    Args:
        metadata: Tool metadata

    Returns:
        Formatted docstring
    """
    lines = [metadata.description, ""]

    if metadata.parameters:
        lines.append("Args:")
        for param in metadata.parameters:
            # Format: param_name: Description
            required_marker = "(required)" if param.required else ""
            lines.append(f"    {param.name}: {param.description} {required_marker}".strip())
        lines.append("")

    return "\n".join(lines)


def _build_args_schema(metadata: ToolMetadata) -> type[BaseModel]:
    """Build a dynamic Pydantic model with per-field descriptions.

    This ensures the OpenAI function-calling JSON schema includes a
    ``description`` key for every parameter, so the LLM has structured
    guidance on what each field expects — not just a bare ``{"type": "object"}``.

    Args:
        metadata: Tool metadata

    Returns:
        A dynamically created Pydantic model class
    """
    field_definitions: Dict[str, Any] = {}

    for param in metadata.parameters:
        python_type = _parse_type_annotation(param.type)

        # Special handling for workitems_advanced_search filters
        # Inject a detailed model schema so the LLM knows exactly what fields to use
        if metadata.name == "workitems_advanced_search" and param.name == "filters":
            python_type = WorkItemFilterSchema

        if param.required:
            # Required: no default → Pydantic marks it as required in the schema
            field_definitions[param.name] = (
                python_type,
                Field(description=param.description),
            )
        else:
            # Optional: use param.default (usually None)
            field_definitions[param.name] = (
                python_type,
                Field(default=param.default, description=param.description),
            )

    # Sanitise name for valid Python identifier
    model_name = metadata.name.replace("-", "_").replace(" ", "_") + "Schema"
    return create_model(model_name, **field_definitions)  # type: ignore[call-overload]


async def _apply_pre_processing(
    metadata: ToolMetadata,
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    category: str,
    method_key: str,
    method_executor: Any = None,
) -> Dict[str, Any]:
    """Apply pre-processing via custom handler if provided.

    Args:
        metadata: Tool metadata
        kwargs: Tool arguments
        context: Execution context
        category: API category
        method_key: Method key
        method_executor: Method executor instance (for making additional API calls)

    Returns:
        Modified kwargs
    """
    if metadata.pre_handler:
        return await metadata.pre_handler(metadata, kwargs, context, category, method_key, method_executor)
    return kwargs


async def _apply_post_processing(
    metadata: ToolMetadata,
    result: Dict[str, Any],
    kwargs: Dict[str, Any],
    context: Dict[str, Any],
    method_executor: Any,
    category: str,
    method_key: str,
) -> Dict[str, Any]:
    """Apply post-processing via custom handler if provided.

    Args:
        metadata: Tool metadata
        result: Execution result
        kwargs: Original tool arguments
        context: Execution context
        method_executor: Method executor instance
        category: API category
        method_key: Method key

    Returns:
        Modified result
    """
    if metadata.post_handler:
        return await metadata.post_handler(metadata, result, kwargs, context, method_executor, category, method_key)
    return result


def generate_tool_from_metadata(
    category: str,
    method_key: str,
    metadata: ToolMetadata,
    method_executor: Any,
    context: Dict[str, Any],
) -> Callable:
    """Generate a LangChain tool function from metadata.

    This function creates a fully functional LangChain tool that:
    - Has the correct signature and type annotations
    - Auto-fills context parameters (workspace_slug, project_id)
    - Calls method_executor.execute() with the right category/method
    - Formats responses using PlaneToolBase helpers

    Args:
        category: API category (e.g., "labels")
        method_key: Simplified method name (e.g., "create")
        metadata: Complete tool metadata
        method_executor: MethodExecutor instance for calling SDK adapter
        context: Execution context with workspace_slug, project_id, etc.

    Returns:
        Decorated LangChain tool function
    """

    # Create async function dynamically
    async def tool_func(**kwargs):
        """Dynamically generated tool function."""

        # Auto-fill context values for parameters marked as auto_fill_from_context.
        for param in metadata.parameters:
            if not param.auto_fill_from_context or param.name not in context:
                continue

            context_value = context[param.name]
            llm_provided = kwargs.get(param.name)

            if param.name in _WORKSPACE_PARAMS:
                # Workspace-level params are always hard-overridden from context
                # to prevent cross-workspace data leaks.  The LLM sometimes
                # confuses workspace_id (UUID) with workspace_slug (string);
                # if a UUID is sent where a slug is expected, resolve it from
                # context rather than allowing a mis-typed value through.
                if llm_provided is not None and llm_provided != context_value:
                    extra = ""
                    if param.name == "workspace_slug" and is_uuid_like(str(llm_provided)):
                        extra = " (LLM sent a UUID where a slug was expected)"
                    log.warning(
                        "Hard-overriding LLM-provided %s=%r with context value %r for %s%s",
                        param.name,
                        llm_provided,
                        context_value,
                        metadata.name,
                        extra,
                    )
                kwargs[param.name] = context_value
            else:
                # Non-workspace params (e.g. project_id) use soft-default:
                # only fill when the LLM did not provide a value, since the
                # LLM may legitimately switch to a different project
                # mentioned in the conversation.
                if llm_provided is None or param.name not in kwargs:
                    kwargs[param.name] = context_value

            log.debug("Auto-filled %s = %s for %s", param.name, kwargs[param.name], metadata.name)

        # Convert any Pydantic model instances to plain dicts.
        # The args_schema may use Pydantic models (e.g. WorkItemFilterSchema)
        # for structured LLM guidance, but the SDK expects plain dicts.
        for key, value in kwargs.items():
            if isinstance(value, BaseModel):
                kwargs[key] = value.model_dump(exclude_none=True)

        # PRE-PROCESSING: Apply custom handler if provided
        if metadata.pre_handler:
            try:
                kwargs = await _apply_pre_processing(metadata, kwargs, context, category, method_key, method_executor)
            except ValueError as e:
                # Pre-processing validation failed
                return PlaneToolBase.format_error_payload(str(e), "")

        # Execute via method_executor
        result = await method_executor.execute(category, method_key, **kwargs)

        # POST-PROCESSING: Apply custom handler if provided
        if metadata.post_handler:
            result = await _apply_post_processing(metadata, result, kwargs, context, method_executor, category, method_key)

        # Format response based on whether it returns an entity
        if result["success"]:
            if metadata.returns_entity_type:
                # Use custom message from post-handler if available, otherwise generate from tool metadata
                if "message" not in result or result["message"].startswith("Successfully executed"):
                    # Extract entity name from response data
                    from pi.services.chat.helpers.tool_utils import generate_success_message

                    entity_name = None
                    data = result.get("data", {})
                    if isinstance(data, dict):
                        # Try to get name from different possible locations
                        entity_name = data.get("name")
                        if not entity_name and "issue_detail" in data:
                            entity_name = data.get("issue_detail", {}).get("name")
                    message = generate_success_message(metadata.name, entity_name)
                else:
                    message = result.get("message")

                # Merge top-level keys into data for context (e.g. customer_id)
                data = result.get("data", {})
                if isinstance(data, dict):
                    # Copy top-level keys that aren't in data (excluding standard wrapper keys)
                    exclude_keys = {"success", "message", "data", "error", "workitem_entity"}
                    for key, value in result.items():
                        if key not in exclude_keys and key not in data:
                            data[key] = value

                # Format with entity URL
                formatted_result = await PlaneToolBase.format_success_payload_with_url(message, data, metadata.returns_entity_type, context)
                # Preserve workitem_entity if present (e.g., from intake post-processor)
                if "workitem_entity" in result:
                    formatted_result["workitem_entity"] = result["workitem_entity"]
                return formatted_result
            else:
                # Simple success payload
                return PlaneToolBase.format_success_payload("Action successfully executed", result["data"])
        else:
            entity_name = None
            # Try to extract entity name from kwargs for better error messages
            if "name" in kwargs:
                entity_name = kwargs.get("name")

            error_message = generate_error_message(metadata.name, entity_name)
            return PlaneToolBase.format_error_payload(error_message, result["error"])

    # Set function metadata
    tool_func.__name__ = metadata.name
    tool_func.__doc__ = _build_docstring(metadata)
    tool_func.__annotations__ = _build_type_annotations(metadata)

    # Build signature (for inspect.signature compatibility)
    sig_params = _build_function_signature(metadata)
    tool_func.__signature__ = inspect.Signature(parameters=list(sig_params.values()))  # type: ignore[attr-defined]

    # Apply @tool decorator
    decorated_tool = tool(tool_func)

    # Override the auto-generated args_schema with one that includes
    # per-parameter descriptions so the LLM sees them in the JSON schema.
    try:
        decorated_tool.args_schema = _build_args_schema(metadata)  # type: ignore[assignment]
    except Exception as e:
        log.warning(f"Failed to build args_schema for {metadata.name}: {e}")

    log.debug(f"Generated tool: {metadata.name} (category={category}, method={method_key})")

    return decorated_tool  # type: ignore[return-value]


def generate_tools_for_category(
    category: str,
    method_executor: Any,
    context: Dict[str, Any],
    tool_definitions: Dict[str, ToolMetadata],
) -> List[Callable]:
    """Generate all tools for a category from metadata.

    Args:
        category: API category (e.g., "labels")
        method_executor: MethodExecutor instance
        context: Execution context
        tool_definitions: Dictionary of method_key -> ToolMetadata for this category

    Returns:
        List of generated LangChain tools
    """
    tools = []

    for method_key, metadata in tool_definitions.items():
        try:
            tool_func = generate_tool_from_metadata(
                category=category,
                method_key=method_key,
                metadata=metadata,
                method_executor=method_executor,
                context=context,
            )
            tools.append(tool_func)
        except Exception as e:
            log.error(f"Error generating tool for {category}.{method_key}: {e}", exc_info=True)
            # Continue generating other tools

    log.debug(f"Generated {len(tools)} tools for category '{category}'")
    return tools
