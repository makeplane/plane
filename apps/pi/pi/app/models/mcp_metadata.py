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

"""MCP server metadata model for caching connector descriptions and tool classifications."""

from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from sqlalchemy import JSON
from sqlalchemy import Index
from sqlmodel import Field

from pi.app.models.base import BaseModel


class MCPServerMetadata(BaseModel, table=True):
    """Cached MCP server description and tool classifications.

    Keyed by ``tools_hash`` — a SHA-256 digest of the sorted
    (tool_name, tool_description) pairs discovered from the MCP server.
    Same hash means the tool surface hasn't changed, so cached
    descriptions and classifications remain valid.
    """

    __tablename__ = "mcp_server_metadata"
    __table_args__ = (Index("ix_mcp_server_metadata_tools_hash", "tools_hash", unique=True),)

    # Lookup key — SHA-256 hex digest of sorted tool signatures
    tools_hash: str = Field(nullable=False, max_length=64)

    # Debugging / admin fields
    name: str = Field(nullable=False, max_length=255)
    slug: Optional[str] = Field(default=None, nullable=True, max_length=255)

    # LLM-generated description of the MCP server
    description: str = Field(nullable=False)

    # Snapshot of all tools with their classifications
    # Each entry: {"name": str, "description": str, "classification": "retrieval"|"action"}
    tools_json: List[Dict[str, Any]] = Field(sa_type=JSON, default_factory=list)
