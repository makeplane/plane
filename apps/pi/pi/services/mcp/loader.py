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
MCP Loader.

Fetches MCP connector configurations from Silo API and loads tools.

Architecture
------------
Silo handles all authentication, token refresh, and decryption.
The loader forwards the user's session cookie to the Silo endpoint
and receives ready-to-use connector configs with auth headers.
"""

from typing import List
from typing import Optional

import httpx
from langchain_core.tools import BaseTool

from pi import logger
from pi import settings
from pi.app.schemas.mcp import MCPConnector
from pi.services.mcp.client import get_mcp_client_service

log = logger.getChild(__name__)

# Timeout for Silo API calls
SILO_API_TIMEOUT = 10.0


class MCPLoader:
    """
    Loads MCP connectors from Silo and provides tool loading.

    Silo handles all authentication, token refresh, and decryption.
    The loader forwards the user's session cookie to the Silo endpoint
    and receives ready-to-use connector configs with auth headers.
    """

    def __init__(self) -> None:
        self._api_base_url: str = settings.plane_api.HOST
        self._session_cookie_name: str = settings.plane_api.SESSION_COOKIE_NAME

    async def fetch_connectors_from_silo(
        self,
        workspace_slug: str,
        session_cookie: str,
        connector_ids: Optional[List[str]] = None,
    ) -> List[MCPConnector]:
        """
        Fetch MCP connectors from Silo's active-connectors endpoint.

        Args:
            workspace_slug: Workspace slug for URL path.
            session_cookie: The user's session cookie value for auth.
            connector_ids: Optional filter for specific connector IDs/slugs.

        Returns:
            List of MCPConnector instances with ready-to-use headers.
        """
        if not workspace_slug:
            log.warning("Cannot fetch MCP connectors: workspace_slug is empty")
            return []

        if not session_cookie:
            log.warning("Cannot fetch MCP connectors: session_cookie is empty")
            return []

        endpoint = f"{self._api_base_url}/api/silo/workspaces/{workspace_slug}/mcp-applications/internal/"

        try:
            cookies = {self._session_cookie_name: session_cookie}

            async with httpx.AsyncClient(timeout=SILO_API_TIMEOUT) as client:
                response = await client.get(endpoint, cookies=cookies)

                if response.status_code != 200:
                    log.error(f"Silo active-connectors API error: " f"status={response.status_code}, " f"body={response.text[:300]}")
                    return []

                data = response.json()

            if not isinstance(data, list):
                log.error(f"Silo returned unexpected type: {type(data).__name__} " f"(expected list)")
                return []

            # Parse and validate connector data
            all_connectors: List[MCPConnector] = []
            for raw in data:
                try:
                    all_connectors.append(MCPConnector.model_validate(raw))
                except Exception as e:
                    connector_id = raw.get("id", "unknown") if isinstance(raw, dict) else "?"
                    log.warning(f"Skipping invalid connector {connector_id}: {e}")

            # Filter by connector_ids if provided
            if connector_ids:
                id_set = set(connector_ids)
                all_connectors = [c for c in all_connectors if c.id in id_set or (c.slug and c.slug in id_set)]

            log.info(f"Fetched {len(all_connectors)} active MCP connectors " f"from Silo (workspace={workspace_slug})")
            return all_connectors

        except httpx.TimeoutException:
            log.error(f"Timeout calling Silo active-connectors API " f"(workspace={workspace_slug})")
            return []
        except httpx.ConnectError as e:
            log.error(f"Connection error to Silo API " f"(workspace={workspace_slug}): {e}")
            return []
        except Exception as e:
            log.error(f"Error fetching MCP connectors from Silo: {e}")
            return []

    async def load_mcp_tools(
        self,
        workspace_slug: str,
        session_cookie: str,
        connector_ids: List[str],
    ) -> List[BaseTool]:
        """
        Load MCP tools for a workspace.

        Delegates to ``load_mcp_tools_with_connector_map`` and discards
        the slug→id mapping.

        Args:
            workspace_slug: Workspace slug.
            session_cookie: The user's session cookie to forward to Silo.
            connector_ids: List of connector IDs or slugs to load.

        Returns:
            List of LangChain tools from MCP servers.
        """
        tools, _, _ = await self.load_mcp_tools_with_connector_map(
            workspace_slug=workspace_slug,
            session_cookie=session_cookie,
            connector_ids=connector_ids,
        )
        return tools

    async def load_mcp_tools_with_connector_map(
        self,
        workspace_slug: str,
        session_cookie: str,
        connector_ids: List[str],
    ):
        """Like load_mcp_tools but also returns a slug→connector_id mapping
        and the raw connector objects.

        Used by build mode to populate mcp_connector_id in flow steps
        and to run osmosis absorption.

        Returns:
            (tools, connector_slug_to_id, connectors) where connector_slug_to_id maps
            connector slug strings to their UUIDs (as strings), and connectors
            is the list of MCPConnector schema objects.
        """
        if not connector_ids:
            return [], {}, []

        connectors = await self.fetch_connectors_from_silo(
            workspace_slug=workspace_slug,
            session_cookie=session_cookie,
            connector_ids=connector_ids,
        )

        if not connectors:
            log.warning(f"No MCP connectors found for IDs {connector_ids}")
            return [], {}, []

        # Build slug→id map from the fetched connectors
        connector_slug_to_id = {}
        for c in connectors:
            if c.slug:
                connector_slug_to_id[c.slug] = str(c.id)

        connector_dicts = [c.model_dump() for c in connectors]
        client_service = get_mcp_client_service()
        tools = await client_service.load_tools_from_connectors(connector_dicts)

        log.info(f"Loaded {len(tools)} MCP tools from {len(connectors)} connectors")
        return tools, connector_slug_to_id, connectors


# Singleton
_mcp_loader: Optional[MCPLoader] = None


def get_mcp_loader() -> MCPLoader:
    """Get singleton MCP loader instance."""
    global _mcp_loader
    if _mcp_loader is None:
        _mcp_loader = MCPLoader()
    return _mcp_loader
