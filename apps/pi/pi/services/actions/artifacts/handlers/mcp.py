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
MCP Handler.

Artifact creation (planning) and tool execution with session management.

Stateful servers (GitHub, WordPress) assign a ``Mcp-Session-Id`` and can
invalidate concurrent sessions, so we serialise per-URL with an
``asyncio.Lock`` and retry once on transient session errors.
Stateless servers (DeepWiki) work without any special handling.
"""

import asyncio
import json
import uuid
from datetime import timedelta
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple

from pi import logger
from pi import settings
from pi.services.actions.artifacts.handlers.base import ExecutionResult
from pi.services.actions.artifacts.handlers.base import ExternalArtifact
from pi.services.actions.artifacts.handlers.base import ExternalHandler
from pi.services.mcp.loader import get_mcp_loader
from pi.services.mcp.utils import MCP_TOOL_PREFIX
from pi.services.mcp.utils import extract_action
from pi.services.mcp.utils import format_connector_display
from pi.services.mcp.utils import parse_tool_name
from pi.services.mcp.utils import strip_slug_suffix

log = logger.getChild(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MCP_CONNECTOR_DISCOVERY_TIMEOUT = settings.MCP_CONNECTOR_DISCOVERY_TIMEOUT
MCP_TOOL_EXECUTION_TIMEOUT = settings.MCP_TOOL_EXECUTION_TIMEOUT
MAX_SESSION_RETRIES = 1

# ---------------------------------------------------------------------------
# Per-URL locks (shared across handler instances)
# ---------------------------------------------------------------------------

_url_locks: Dict[str, asyncio.Lock] = {}


def _get_url_lock(url: str) -> asyncio.Lock:
    """Return a per-URL lock, creating one atomically if needed."""
    return _url_locks.setdefault(url, asyncio.Lock())


# ---------------------------------------------------------------------------
# Handler
# ---------------------------------------------------------------------------


class MCPHandler(ExternalHandler):
    """
    Handler for MCP tools (WordPress, DeepWiki, GitHub, Slack, etc.).

    Tool name format: ``mcp_<connector>__<tool_name>``
    Example: ``mcp_deepwiki__ask_question``
    """

    def can_handle(self, tool_name: str) -> bool:
        """Check if tool is an MCP tool."""
        return bool(tool_name and tool_name.startswith(MCP_TOOL_PREFIX))

    # -------------------------------------------------------------------------
    # Planning phase
    # -------------------------------------------------------------------------

    async def create_artifact(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        context: Dict[str, Any],
    ) -> ExternalArtifact:
        """Create MCP artifact for planning phase."""
        connector_slug, tool_base = parse_tool_name(tool_name)
        connector_display = format_connector_display(connector_slug)
        action = extract_action(tool_base)
        clean_slug = strip_slug_suffix(connector_slug)
        display_name = f"{clean_slug}_{tool_base}"

        return ExternalArtifact(
            artifact_type="mcp",
            action=action,
            tool_name=display_name,
            parameters={"name": f"Execute {connector_display} tool {tool_base}", "mcp_name": connector_display, "tool_name": tool_base},
            artifact_id=str(uuid.uuid4()),
            sequence=context.get("step_order", 1),
            message_id=str(context.get("query_id", "")),
            raw_tool_name=tool_name,
            tool_args=tool_args,
        )

    # -------------------------------------------------------------------------
    # Execution phase
    # -------------------------------------------------------------------------

    async def execute(
        self,
        artifact: Dict[str, Any],
        context: Dict[str, Any],
    ) -> ExecutionResult:
        """Execute MCP tool."""
        tool_name = artifact.get("tool_name", "")
        raw_tool_name = self._get_raw_tool_name(artifact)
        args = self._get_tool_args(artifact)

        try:
            log.info(f"Executing MCP tool: {raw_tool_name}")
            call_result = await self._execute_tool(raw_tool_name, args, context)
            log.info(f"MCP tool completed: {raw_tool_name}")

            content = call_result.content
            is_mcp_error = getattr(call_result, "isError", False)

            message, success, url = self._parse_result(content)
            connector_slug, tool_base = parse_tool_name(raw_tool_name)

            if is_mcp_error:
                success = False
                log.warning(f"MCP server flagged error for {raw_tool_name}: {message}")

            raw_mcp_result = self._extract_structured_data(content)

            return ExecutionResult(
                success=success,
                message=message,
                tool_name=tool_name,
                artifact_id=artifact.get("artifact_id", ""),
                entity_name=format_connector_display(connector_slug),
                entity_type=tool_base,
                entity_url=url,
                version_id=artifact.get("version_id"),
                sequence=artifact.get("sequence", 1),
                action=artifact.get("action", "execute"),
                artifact_type="mcp",
                raw_mcp_result=raw_mcp_result,
            )

        except Exception as e:
            log.error(f"MCP execution failed: {e}", exc_info=True)
            return ExecutionResult(
                success=False,
                message=self._extract_user_facing_error(e),
                tool_name=tool_name,
                artifact_id=artifact.get("artifact_id", ""),
            )

    # -----------------------------------------------------------------
    # Execution internals
    # -----------------------------------------------------------------

    async def _execute_tool(
        self,
        raw_tool_name: str,
        args: Dict[str, Any],
        context: Dict[str, Any],
    ) -> Any:
        """Resolve config, acquire per-URL lock, call tool with retry."""
        connector_slug, tool_base = parse_tool_name(raw_tool_name)
        server_config = await self._get_server_config(connector_slug, context)

        url = server_config["url"]
        headers = server_config.get("headers", {})
        lock = _get_url_lock(url)

        last_error: Optional[Exception] = None
        for attempt in range(1 + MAX_SESSION_RETRIES):
            try:
                async with lock:
                    return await self._call_tool_with_session(
                        url,
                        headers,
                        tool_base,
                        args,
                    )
            except Exception as exc:
                real_error = self._unwrap_exception(exc)
                if self._is_transient_session_error(real_error) and attempt < MAX_SESSION_RETRIES:
                    log.warning(f"MCP session error on attempt {attempt + 1}, " f"retrying: {real_error}")
                    last_error = exc
                    continue
                raise

        # Should not reach here, but safety net
        raise last_error  # type: ignore[misc]

    async def _call_tool_with_session(
        self,
        url: str,
        headers: Dict[str, str],
        tool_name: str,
        args: Dict[str, Any],
    ) -> Any:
        """Open a fresh session, call the tool, return ``CallToolResult``."""
        from langchain_mcp_adapters.sessions import create_session

        connection_config = {
            "transport": "streamable_http",
            "url": url,
            "headers": headers,
            "timeout": timedelta(seconds=MCP_CONNECTOR_DISCOVERY_TIMEOUT),
        }

        async with create_session(connection_config) as session:  # type: ignore
            await session.initialize()
            result = await asyncio.wait_for(
                session.call_tool(tool_name, args),
                timeout=MCP_TOOL_EXECUTION_TIMEOUT,
            )
            return result

    # -----------------------------------------------------------------
    # Server config resolution
    # -----------------------------------------------------------------

    async def _get_server_config(
        self,
        connector_slug: str,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Return server config for a connector, reading from context."""
        connectors = context.get("mcp_connectors")

        # Fallback: fetch directly if not pre-populated
        if connectors is None:
            workspace_slug = context.get("workspace_slug") or ""
            session_cookie = context.get("session_cookie", "")

            if workspace_slug and session_cookie:
                loader = get_mcp_loader()
                connectors = await loader.fetch_connectors_from_silo(
                    workspace_slug=str(workspace_slug),
                    session_cookie=session_cookie,
                )
            else:
                connectors = []

        return self._find_connector_config(connectors, connector_slug)

    @staticmethod
    def _find_connector_config(
        connectors: List,
        connector_slug: str,
    ) -> Dict[str, Any]:
        """Find a connector by slug and return its config dict."""
        for connector in connectors:
            if connector.slug == connector_slug:
                config: Dict[str, Any] = {
                    "transport": "streamable_http",
                    "url": connector.url,
                }
                if connector.headers:
                    config["headers"] = connector.headers
                return config

        available = [c.slug for c in connectors if c.slug]
        raise ValueError(f"Connector '{connector_slug}' not found. " f"Available: {available}")

    # -----------------------------------------------------------------
    # Error handling
    # -----------------------------------------------------------------

    @staticmethod
    def _unwrap_exception(exc: BaseException) -> BaseException:
        """Unwrap ExceptionGroups to find the real error."""
        current = exc
        for _ in range(5):  # max depth to prevent infinite loops
            if isinstance(current, BaseExceptionGroup) and current.exceptions:
                current = current.exceptions[0]
            else:
                break
        return current

    @staticmethod
    def _is_transient_session_error(exc: BaseException) -> bool:
        """Check if an error is a transient MCP session error worth retrying."""
        msg = str(exc).lower()
        return any(
            phrase in msg
            for phrase in [
                "invalid or expired session",
                "session not found",
                "session expired",
            ]
        )

    @staticmethod
    def _extract_user_facing_error(exc: BaseException) -> str:
        """Extract a clean, user-facing error message."""
        real = MCPHandler._unwrap_exception(exc)
        msg = str(real)

        for prefix in ["Invalid params: ", "McpError: "]:
            if msg.startswith(prefix):
                msg = msg[len(prefix) :]

        # Also try to parse JSON-encoded error payloads from MCP servers
        msg = MCPHandler._extract_clean_error_message(msg)

        return msg or str(exc)

    @staticmethod
    def _extract_clean_error_message(msg: str) -> str:
        """Attempt to extract a clean string from a JSON-encoded error payload."""
        try:
            if msg.strip().startswith("{") and msg.strip().endswith("}"):
                data = json.loads(msg)
                if isinstance(data, dict):
                    if "message" in data:
                        return str(data["message"])
                    if "error" in data and isinstance(data["error"], dict) and "message" in data["error"]:
                        return str(data["error"]["message"])
        except Exception:
            pass
        return msg

    # -----------------------------------------------------------------
    # Artifact data extraction
    # -----------------------------------------------------------------

    def _get_raw_tool_name(self, artifact: Dict[str, Any]) -> str:
        """Extract raw tool name from artifact."""
        internal = artifact.get("_internal", {})
        if isinstance(internal, dict) and "raw_tool_name" in internal:
            return internal["raw_tool_name"]

        planning_data = artifact.get("planning_data", {})
        if isinstance(planning_data, dict) and "raw_tool_name" in planning_data:
            return planning_data["raw_tool_name"]

        tool_name = artifact.get("tool_name", "")
        if not tool_name.startswith(MCP_TOOL_PREFIX):
            log.warning(
                f"raw_tool_name missing from artifact; falling back to display name '{tool_name}'. "
                "Connector lookup may fail. Ensure raw_tool_name is persisted in planning_data."
            )
            return f"{MCP_TOOL_PREFIX}{tool_name}"
        return tool_name

    def _get_tool_args(self, artifact: Dict[str, Any]) -> Dict[str, Any]:
        """Extract tool arguments from artifact."""
        internal = artifact.get("_internal", {})
        if isinstance(internal, dict) and "args" in internal:
            return internal["args"]

        if "tool_args_raw" in artifact:
            return artifact["tool_args_raw"]

        return artifact.get("args", {})

    # -----------------------------------------------------------------
    # Result parsing
    # -----------------------------------------------------------------

    # Heuristic error phrases (servers that don't set isError=True).
    _ERROR_PHRASES = (
        "is not enabled",
        "is disabled",
        "not allowed",
        "not supported",
        "permission denied",
        "unauthorized",
        "forbidden",
        "upgrade to",
        "please upgrade",
        "quota exceeded",
        "rate limit",
    )

    def _parse_result(self, result: Any) -> Tuple[str, bool, Optional[str]]:
        """Parse MCP result into ``(message, success, url)``."""
        message: str = ""
        success: bool = True
        url: Optional[str] = None

        try:
            if isinstance(result, list) and len(result) > 0:
                first = result[0]

                if hasattr(first, "text"):
                    text = first.text
                elif isinstance(first, dict) and "text" in first:
                    text = first["text"]
                else:
                    return str(result), success, url

                try:
                    parsed = json.loads(text)
                    if isinstance(parsed, dict):
                        url = parsed.get("url") or parsed.get("html_url")
                        entity_id = parsed.get("id") or parsed.get("number")
                        if url:
                            message = f"Created successfully: {url}"
                        elif entity_id:
                            message = f"Action completed (ID: {entity_id})"
                        else:
                            message = text
                        success = bool(parsed.get("ok", parsed.get("success", True)))
                    else:
                        message = text
                except json.JSONDecodeError:
                    message = text

            elif isinstance(result, dict):
                url = result.get("url") or result.get("html_url")
                message = result.get("message") or result.get("content") or json.dumps(result)
                success = bool(result.get("ok", result.get("success", True)))

            elif isinstance(result, str):
                message = result
            else:
                message = str(result)

        except Exception as e:
            log.warning(f"Result parse error: {e}")
            message = str(result)

        if success and message:
            lower_msg = message.lower()
            if any(phrase in lower_msg for phrase in self._ERROR_PHRASES):
                success = False
                log.info(f"Detected error phrase in MCP result, marking as failed: " f"{message[:120]}")

        return message, success, url

    def _extract_structured_data(self, result: Any) -> Optional[Dict[str, Any]]:
        """Extract structured JSON data from MCP result for template variables."""
        try:
            if isinstance(result, list) and len(result) > 0:
                first = result[0]
                if hasattr(first, "text"):
                    text = first.text
                elif isinstance(first, dict) and "text" in first:
                    text = first["text"]
                else:
                    return None
                return json.loads(text)
            elif isinstance(result, dict):
                return result
        except Exception as e:
            log.debug(f"Could not extract structured data from MCP result: {e}")
            return None
        return None
