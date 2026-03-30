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
Tool metadata models for centralized tool definition and auto-generation.

This module defines Pydantic models that serve as the single source of truth
for all LangChain tool definitions. Tool metadata includes:
- Tool name and description
- All parameters with types, descriptions, and defaults
- SDK adapter method mapping
- Entity type for URL construction
"""

from typing import Any
from typing import List
from typing import Optional

from pydantic import BaseModel


class ToolParameter(BaseModel):
    """Metadata for a single tool parameter.

    Attributes:
        name: Parameter name (e.g., "project_id", "color", "assignees")
        type: Python type annotation as string (e.g., "str", "Optional[str]", "List[str]")
        required: Whether parameter is required
        description: Human-readable parameter description for LLM
        default: Default value if parameter is optional
        auto_fill_from_context: Whether to auto-fill from context (workspace_slug, project_id)
    """

    name: str
    type: str
    required: bool = True
    description: str
    default: Optional[Any] = None
    auto_fill_from_context: bool = False

    class Config:
        # Allow extra fields for future extensions
        extra = "allow"


class ToolMetadata(BaseModel):
    """Metadata for a single tool definition.

    This serves as the single source of truth for tool configuration,
    used to auto-generate LangChain tools and UI property mappings.
    """

    name: str
    description: str
    sdk_method: str
    parameters: List[ToolParameter] = []
    returns_entity_type: Optional[str] = None
    pre_handler: Optional[Any] = None  # Custom async function(metadata, kwargs, context, category, method_key) -> kwargs
    post_handler: Optional[Any] = None  # Custom async function(metadata, result, kwargs, context, method_executor, category, method_key) -> result

    class Config:
        arbitrary_types_allowed = True  # Allow function types

    def get_parameter(self, name: str) -> Optional[ToolParameter]:
        """Get parameter by name."""
        for param in self.parameters:
            if param.name == name:
                return param
        return None

    def get_required_parameters(self) -> List[ToolParameter]:
        """Get all required parameters."""
        return [p for p in self.parameters if p.required]

    def get_optional_parameters(self) -> List[ToolParameter]:
        """Get all optional parameters."""
        return [p for p in self.parameters if not p.required]

    def get_auto_fill_parameters(self) -> List[ToolParameter]:
        """Get parameters that should be auto-filled from context."""
        return [p for p in self.parameters if p.auto_fill_from_context]
