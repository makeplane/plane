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

from enum import Enum
from typing import List
from typing import Literal
from typing import Optional
from typing import TypeAlias
from typing import TypedDict

from langchain_core.messages import BaseMessage
from pydantic import BaseModel
from pydantic import Field


class RetrievalTools(str, Enum):
    """Enumeration of available retrieval tools (formerly called agents)."""

    STRUCTURED_DB_TOOL = "structured_db_tool"
    VECTOR_SEARCH_TOOL = "vector_search_tool"
    PAGES_SEARCH_TOOL = "pages_search_tool"
    DOCS_SEARCH_TOOL = "docs_search_tool"
    WEB_SEARCH_TOOL = "web_search_tool"
    ACTION_EXECUTOR_TOOL = "action_executor_tool"


# Legacy alias for backward compatibility during migration
Agents = RetrievalTools


class ToolQuery(BaseModel):
    """A query targeted at a specific retrieval tool."""

    tool: RetrievalTools
    query: str = Field(..., description="The decomposed query for this specific tool")


# Legacy alias for backward compatibility during migration
AgentQuery = ToolQuery


class RouteQuery(BaseModel):
    """Route a user query to the most relevant retrieval tool(s) with decomposed queries."""

    decomposed_queries: list[ToolQuery] = Field(..., description="List of tools with their corresponding decomposed queries")


class RoutingResult(TypedDict):
    raw: BaseMessage
    parsed: RouteQuery | None
    parsing_error: Exception | None


ToolQueryList: TypeAlias = list[ToolQuery]

# Legacy alias for backward compatibility during migration
AgentQueryList = ToolQueryList


class ToolOrder(BaseModel):
    """Provide the order in which the selected data retrieval tools should be executed."""

    ordered_tools: List[str] = Field(..., description="List of ordered tool names")


# Legacy alias for backward compatibility during migration
AgentOrder = ToolOrder


class QueryFlowStore(TypedDict):
    is_new: bool
    query: str
    llm: str
    chat_id: str
    user_id: str
    is_temp: bool
    is_reasoning: bool
    router_result: str
    tool_response: str
    parsed_query: str
    rewritten_query: str  # Kept for backward compatibility - now always equal to parsed_query
    answer: str
    workspace_in_context: bool
    websearch_enabled: bool
    project_id: str
    workspace_id: str
    # Optional: current step order to align sub-step persistence without DB lookups
    step_order: int


# --- Action Category Routing (for hierarchical actions) ---


class ActionCategorySelection(BaseModel):
    """One selected action category with optional rationale and priority."""

    category: Literal[
        "workitems",
        "projects",
        "cycles",
        "labels",
        "states",
        "modules",
        "pages",
        "users",
        "intake",
        "members",
        "activity",
        "comments",
        "links",
        "properties",
        "types",
        "worklogs",
        "initiatives",
        "teamspaces",
        "stickies",
        "customers",
        "workspaces",
        "retrieval_tools",
    ]
    rationale: Optional[str] = None


class ActionCategoryRouting(BaseModel):
    """Structured output for action category router allowing multiple selections."""

    selections: List[ActionCategorySelection]
