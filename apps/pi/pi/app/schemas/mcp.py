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

"""Pydantic schemas for MCP connector responses from Silo API."""

from typing import Dict
from typing import Optional

from pydantic import BaseModel
from pydantic import Field


class MCPConnector(BaseModel):
    """
    MCP connector from Silo API with ready-to-use authentication headers.

    Silo handles token storage, encryption, OAuth flows, and refresh.
    PI just passes headers directly to the MCP SDK's streamablehttp_client.
    """

    id: str = Field(..., description="Unique connector ID (UUID)")
    name: str = Field(..., description="Display name for frontend")
    description: Optional[str] = Field(None, description="Connector description")
    slug: Optional[str] = Field(None, description="Unique slug (used for tool name prefixes and server identification)")
    url: str = Field(..., description="MCP server URL")
    auth_type: str = Field(..., description="Auth type: none, header, oauth")
    headers: Dict[str, str] = Field(default_factory=dict, description="Ready-to-use HTTP headers with tokens (managed by Silo)")
