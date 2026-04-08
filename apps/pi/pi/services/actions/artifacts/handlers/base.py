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
Base classes for external tool handlers (MCP, future integrations).

Provides ``ExternalArtifact`` (planning) and ``ExecutionResult`` (execution)
dataclasses, plus the ``ExternalHandler`` ABC that concrete handlers implement.
"""

from abc import ABC
from abc import abstractmethod
from dataclasses import dataclass
from dataclasses import field
from datetime import datetime
from typing import Any
from typing import Dict
from typing import Optional

# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------


@dataclass
class ExternalArtifact:
    """Artifact created during planning — stored in DB and shown in UI."""

    artifact_type: str  # "mcp", etc.
    action: str  # "create", "update", "delete", "execute"
    tool_name: str  # Display-friendly name
    parameters: Dict[str, Any]  # User-visible params
    artifact_id: str  # UUID
    sequence: int  # Order in multi-action plans
    message_id: str  # Parent message UUID

    # Internal fields (for execution only, not sent to UI)
    raw_tool_name: str = ""
    tool_args: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Serialise for streaming / UI (excludes internal fields)."""
        return {
            "artifact_type": self.artifact_type,
            "action": self.action,
            "tool_name": self.tool_name,
            "parameters": self.parameters,
            "artifact_id": self.artifact_id,
            "sequence": self.sequence,
            "message_id": self.message_id,
        }

    def to_internal_dict(self) -> Dict[str, Any]:
        """Serialise for DB storage (includes internal fields)."""
        d = self.to_dict()
        d["_internal"] = {
            "raw_tool_name": self.raw_tool_name,
            "args": self.tool_args,
        }
        return d


@dataclass
class ExecutionResult:
    """Result from executing an external tool."""

    success: bool
    message: str
    tool_name: str
    artifact_id: str

    # Entity info for UI
    entity_name: Optional[str] = None  # e.g. "Github MCP"
    entity_type: Optional[str] = None
    entity_url: Optional[str] = None
    entity_id: Optional[str] = None

    # Metadata
    sequence: int = 1
    version_id: Optional[str] = None
    executed_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    action: str = "execute"
    artifact_type: str = "mcp"

    # Raw structured data for template substitution
    raw_mcp_result: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Serialise for API response."""
        result: Dict[str, Any] = {
            "action": self.action,
            "artifact_type": self.artifact_type,
            "tool_name": self.tool_name,
            "artifact_id": self.artifact_id,
            "sequence": self.sequence,
            "success": self.success,
            "message": self.message,
            "executed_at": self.executed_at,
        }

        if self.version_id:
            result["version_id"] = self.version_id

        # Nested entity info (matches Plane artifact format)
        entity_info: Dict[str, Any] = {}
        if self.entity_name:
            entity_info["entity_name"] = self.entity_name
        if self.entity_type:
            entity_info["entity_type"] = self.entity_type
        if self.entity_url:
            entity_info["entity_url"] = self.entity_url
        if self.entity_id:
            entity_info["entity_id"] = self.entity_id
        if entity_info:
            result["entity_info"] = entity_info

        if self.raw_mcp_result:
            result["raw_mcp_result"] = self.raw_mcp_result

        return result


# ---------------------------------------------------------------------------
# Abstract handler
# ---------------------------------------------------------------------------


class ExternalHandler(ABC):
    """Base class for external tool handlers.

    Subclass this, implement the three abstract methods, and register
    the instance in ``handlers/__init__.py``.
    """

    @abstractmethod
    def can_handle(self, tool_name: str) -> bool:
        """Return ``True`` if this handler recognises *tool_name*."""

    @abstractmethod
    async def create_artifact(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        context: Dict[str, Any],
    ) -> ExternalArtifact:
        """Create an artifact during the planning phase."""

    @abstractmethod
    async def execute(
        self,
        artifact: Dict[str, Any],
        context: Dict[str, Any],
    ) -> ExecutionResult:
        """Execute the tool and return a result."""

    # ------------------------------------------------------------------
    # DB persistence (shared by all handlers)
    # ------------------------------------------------------------------

    async def save_to_db(
        self,
        artifact: ExternalArtifact,
        context: Dict[str, Any],
    ) -> Optional[str]:
        """Persist *artifact* to the database; return its ID or ``None``."""
        from pi import logger

        log = logger.getChild(__name__)

        try:
            import datetime as dt
            import uuid

            from pi.services.retrievers.pg_store.action_artifact import create_action_artifact

            db = context.get("db")
            chat_id = context.get("chat_id")
            query_id = context.get("query_id")
            tool_id = context.get("tool_id")
            combined_tool_query = context.get("combined_tool_query", "")

            if not db or not chat_id or not query_id:
                log.warning("Missing required context for DB save")
                return None

            artifact_data = {
                "planning_data": {
                    "action": artifact.action,
                    "artifact_type": artifact.artifact_type,
                    "tool_name": artifact.tool_name,
                    "raw_tool_name": artifact.raw_tool_name,
                    "parameters": artifact.parameters,
                },
                "tool_args_raw": artifact.tool_args,
                "planning_context": {
                    "original_query": combined_tool_query,
                    "planning_timestamp": dt.datetime.now(dt.timezone.utc).isoformat(),
                },
                "tool_id": tool_id,
            }

            result = await create_action_artifact(
                db=db,
                chat_id=uuid.UUID(str(chat_id)),
                entity=artifact.artifact_type,
                action=artifact.action,
                data=artifact_data,
                message_id=uuid.UUID(str(query_id)),
                sequence=artifact.sequence,
                is_executed=False,
            )

            if result and result.get("message") == "success":
                artifact_obj = result.get("artifact")
                if artifact_obj and hasattr(artifact_obj, "id"):
                    artifact_id = str(artifact_obj.id)
                    log.info(f"Created external artifact in DB: {artifact_id}")
                    return artifact_id

            log.warning(f"Failed to create artifact: {result}")
            return None

        except Exception as e:
            log.error(f"Exception saving artifact to DB: {e}", exc_info=True)
            return None
