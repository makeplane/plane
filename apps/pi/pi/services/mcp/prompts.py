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
MCP-specific LLM prompts.

Used by the osmosis absorption layer for connector description
generation and tool classification.
"""

from langchain_core.prompts import ChatPromptTemplate

# ---------------------------------------------------------------------------
# Connector description generation
# ---------------------------------------------------------------------------

DESCRIPTION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You generate concise descriptions of MCP (Model Context Protocol) servers "
            "for use in an AI assistant's routing layer. "
            "Given the server name and its list of tools, write a 1-2 sentence description "
            "of what this MCP server does. Focus on the capabilities it provides. "
            "Return ONLY the description text, no JSON or markdown.",
        ),
        (
            "human",
            "MCP Server: {name}\n\nTools:\n{tools_list}",
        ),
    ]
)

# ---------------------------------------------------------------------------
# Tool classification (retrieval vs action)
# ---------------------------------------------------------------------------

CLASSIFICATION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You classify MCP tools as either 'retrieval' (read-only: listing, searching, "
            "getting, fetching, querying data) or 'action' (modifying state: creating, "
            "updating, deleting, sending, posting, executing commands).\n\n"
            "Return a JSON object mapping each tool name to its classification.\n"
            'Example: {{"list_repos": "retrieval", "create_issue": "action"}}\n\n'
            "Rules:\n"
            "- If a tool could be both, classify as 'action' (safer).\n"
            "- Tools that only read/list/search/get/fetch data are 'retrieval'.\n"
            "- Tools that create/update/delete/send/post/execute are 'action'.\n"
            "Return ONLY valid JSON, no markdown or explanation.",
        ),
        (
            "human",
            "Classify these tools:\n{tools_list}",
        ),
    ]
)
