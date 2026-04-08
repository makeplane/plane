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
MCP Client Service.

Discovery-phase tool loader. Connects to MCP servers via
``langchain_mcp_adapters.MultiServerMCPClient``, converts tools to
LangChain ``StructuredTool`` objects, and prefixes names as
``mcp_<slug>__<toolname>``.

Each tool is created with ``session=None`` so invocations during planning
create a fresh MCP session automatically. Silo handles authentication.
"""

import asyncio
from datetime import timedelta
from typing import Any
from typing import Dict
from typing import List

from langchain_core.tools import BaseTool

from pi import logger
from pi.services.mcp.utils import MCP_TOOL_PREFIX

log = logger.getChild(__name__)

MCP_DISCOVER_TIMEOUT = timedelta(seconds=15)


class MCPClientService:
    """
    Loads LangChain tools from MCP servers.

    Responsibilities:
    - Build server configs from connector data (from Silo)
    - Load tools from MCP servers concurrently (per-connector fault isolation)
    - Prefix tool names with ``mcp_<slug>__``

    Authentication is handled by Silo (tokens come ready-to-use in headers).
    """

    async def load_tools_from_connectors(
        self,
        connectors: List[Dict[str, Any]],
    ) -> List[BaseTool]:
        """
        Load tools from MCP connectors.

        Args:
            connectors: Connector dicts from Silo with format:
                        {id, slug, url, headers: {Authorization: ...}}

        Returns:
            List of LangChain tools with ``mcp_<slug>__<toolname>`` names.
        """
        if not connectors:
            log.debug("No MCP connectors provided")
            return []

        # Build server configs
        server_configs: Dict[str, Dict[str, Any]] = {}
        for connector in connectors:
            slug = connector.get("slug")
            if not slug:
                connector_id = connector.get("id", "unknown")
                log.warning(f"Connector missing slug: {connector_id}")
                continue

            config = self._build_server_config(connector)
            if config:
                server_configs[slug] = config

        if not server_configs:
            log.warning("No valid MCP connector configs built")
            return []

        try:
            tools = await self._load_tools_from_servers(server_configs)
        except Exception as e:
            log.error(f"Failed to load MCP tools: {e}", exc_info=True)
            return []

        log.info(f"Loaded {len(tools)} MCP tools from {len(server_configs)} connectors")
        return tools

    @staticmethod
    def _build_server_config(connector: Dict[str, Any]) -> Dict[str, Any]:
        """Build server config from connector data."""
        url = connector.get("url")
        if not url:
            slug = connector.get("slug", "unknown")
            log.error(f"Connector '{slug}' missing URL")
            return {}

        config: Dict[str, Any] = {
            "transport": "streamable_http",
            "url": url,
            "timeout": MCP_DISCOVER_TIMEOUT,
        }

        if connector.get("headers"):
            config["headers"] = connector["headers"]

        return config

    async def _load_tools_from_servers(
        self,
        server_configs: Dict[str, Any],
    ) -> List[BaseTool]:
        """Load tools from each MCP server; failures are isolated per connector."""
        from langchain_mcp_adapters.client import MultiServerMCPClient

        client = MultiServerMCPClient(server_configs, tool_name_prefix=True)
        slugs = list(server_configs.keys())
        load_tasks = [client.get_tools(server_name=s) for s in slugs]
        outcomes = await asyncio.gather(*load_tasks, return_exceptions=True)

        tools: List[BaseTool] = []
        failed_slugs: List[str] = []
        for slug, outcome in zip(slugs, outcomes, strict=True):
            if isinstance(outcome, BaseException):
                failed_slugs.append(slug)
                log.warning(
                    "Failed to load MCP tools from connector %r: %s",
                    slug,
                    outcome,
                )
            else:
                tools.extend(outcome)

        if failed_slugs:
            log.info(
                "MCP tool discovery: loaded from %d/%d connectors; skipped: %s",
                len(server_configs) - len(failed_slugs),
                len(server_configs),
                failed_slugs,
            )

        # Rename "{slug}_{tool}" → "mcp_{slug}__{tool}".
        # Match against known slugs (slugs may contain underscores).
        sorted_slugs = sorted(server_configs, key=len, reverse=True)
        for tool in tools:
            renamed = False
            for slug in sorted_slugs:
                prefix = f"{slug}_"
                if tool.name.startswith(prefix):
                    tool_base = tool.name[len(prefix) :]
                    tool.name = f"{MCP_TOOL_PREFIX}{slug}__{tool_base}"
                    renamed = True
                    break
            if not renamed:
                tool.name = f"{MCP_TOOL_PREFIX}{tool.name}"

        return tools


# Singleton
_mcp_client_service = MCPClientService()


def get_mcp_client_service() -> MCPClientService:
    """Get singleton MCP client service."""
    return _mcp_client_service
