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
Base classes and shared utilities for Plane API tools.
"""

import time
from typing import Any
from typing import Dict
from typing import Optional
from typing import Tuple

from pi import logger

# Lazy imports to avoid circular dependency
# from pi.agents.sql_agent.tools import construct_action_entity_url
# from pi.agents.sql_agent.tools import extract_entity_from_api_response
from pi.config import settings

log = logger.getChild(__name__)


class PlaneToolBase:
    """Base class for Plane API tools with common functionality."""

    @staticmethod
    def get_context_value(context: Dict[str, Any], key: str, default=None):
        """Safely get value from context."""
        return context.get(key, default) if context else default

    @staticmethod
    def auto_fill_context(context: Dict[str, Any], **kwargs):
        """Auto-fill common parameters from context."""
        if kwargs.get("workspace_slug") is None and context:
            kwargs["workspace_slug"] = context.get("workspace_slug")
        if kwargs.get("project_id") is None and context:
            kwargs["project_id"] = context.get("project_id")
        if kwargs.get("user_id") is None and context:
            kwargs["user_id"] = context.get("user_id")
        return kwargs

    @staticmethod
    def format_success_response(message: str, data: Any) -> str:
        """Format successful operation response."""
        return f"✅ {message}\n\nResult: {data}"

    @staticmethod
    def format_success_payload(
        message: str, data: Any = None, entity: Optional[Dict[str, Any]] = None, meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Structured success payload for API/consumers. Intended long-term replacement for string responses.
        """
        payload: Dict[str, Any] = {
            "ok": True,
            "message": f"✅ {message}",
        }
        if entity is not None:
            payload["entity"] = entity
        if data is not None:
            payload["data"] = data
        if meta is not None:
            payload["meta"] = meta
        return payload

    @staticmethod
    async def format_success_response_with_url(message: str, data: Any, entity_type: str, context: Dict[str, Any]) -> str:
        """
        Format successful operation response with entity URL information.

        Args:
            message: Success message
            data: API response data
            entity_type: Type of entity (module, cycle, workitem, project, page)
            context: Context containing workspace_slug and other info

        Returns:
            Formatted response string with URL information
        """

        # Lazy import to avoid circular dependency
        from pi.agents.sql_agent.helpers import extract_entity_from_api_response

        # Extract entity data from response
        entity_data = extract_entity_from_api_response(data, entity_type)

        if entity_data:
            # Get workspace slug and frontend URL from context
            workspace_slug = context.get("workspace_slug")
            frontend_url = settings.plane_api.FRONTEND_URL

            # Add workspace_id to context for project ID resolution
            if context.get("workspace_id"):
                entity_data["workspace"] = str(context["workspace_id"])

            # Only proceed if workspace_slug is available
            if workspace_slug:
                # Construct entity URL
                try:
                    # Lazy import to avoid circular dependency
                    from pi.agents.sql_agent.helpers import construct_action_entity_url

                    # Since this method is now async, we can directly await the async function
                    url_info = await construct_action_entity_url(entity_data, entity_type, workspace_slug, frontend_url)

                    if url_info:
                        # Include URL information in the response
                        url_section = f"\n\nEntity URL: {url_info["entity_url"]}"
                        url_section += f"\nEntity Name: {url_info["entity_name"]}"
                        url_section += f"\nEntity Type: {url_info["entity_type"]}"
                        url_section += f"\nEntity ID: {url_info["entity_id"]}"

                        # Add human-friendly identifier when available
                        try:
                            identifier_value = None
                            # Work-item unique key
                            if isinstance(url_info, dict) and url_info.get("entity_type") == "workitem" and url_info.get("issue_identifier"):
                                identifier_value = url_info.get("issue_identifier")
                            # Project identifier from entity_data
                            elif entity_type == "project" and isinstance(entity_data, dict) and entity_data.get("identifier"):
                                identifier_value = entity_data.get("identifier")
                            if identifier_value:
                                url_section += f"\nEntity Identifier: {identifier_value}"
                        except Exception:
                            pass

                        return f"✅ {message}\n\nResult: {data}{url_section}"

                except Exception as e:
                    # Log error but continue with fallback entity info
                    log.error(f"Error constructing entity URL: {e}")
                    # Still provide entity info even if URL construction fails
                    if entity_data and entity_data.get("id"):
                        fallback_section = f"\n\nEntity ID: {entity_data["id"]}"
                        fallback_section += f"\nEntity Name: {entity_data.get("name", "")}"
                        fallback_section += f"\nEntity Type: {entity_type}"
                        return f"✅ {message}\n\nResult: {data}{fallback_section}"
            else:
                log.warning(f"No workspace_slug found in context: {context}")
                # Still provide entity info even without workspace_slug
                if entity_data and entity_data.get("id"):
                    fallback_section = f"\n\nEntity ID: {entity_data["id"]}"
                    fallback_section += f"\nEntity Name: {entity_data.get("name", "")}"
                    fallback_section += f"\nEntity Type: {entity_type}"
                    return f"✅ {message}\n\nResult: {data}{fallback_section}"
        else:
            log.warning(f"Failed to extract entity data for entity_type: {entity_type}")

        # Final fallback to basic response if entity extraction completely fails
        return PlaneToolBase.format_success_response(message, data)

    @staticmethod
    async def format_success_payload_with_url(message: str, data: Any, entity_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Structured success payload that also includes constructed entity URL information when available.
        """
        # Lazy import to avoid circular dependency
        from pi.agents.sql_agent.helpers import extract_entity_from_api_response
        from pi.config import settings as _settings

        entity: Dict[str, Any] = {}
        try:
            entity_data = extract_entity_from_api_response(data, entity_type)
            if entity_data:
                workspace_slug = context.get("workspace_slug")
                frontend_url = _settings.plane_api.FRONTEND_URL
                if context.get("workspace_id"):
                    entity_data["workspace"] = str(context["workspace_id"])
                if workspace_slug:
                    try:
                        from pi.agents.sql_agent.helpers import construct_action_entity_url

                        url_info = await construct_action_entity_url(entity_data, entity_type, workspace_slug, frontend_url)
                        if url_info:
                            # Normalize keys to entity_* for consumers
                            entity["entity_url"] = url_info.get("entity_url")
                            entity["entity_name"] = url_info.get("entity_name")
                            entity["entity_type"] = url_info.get("entity_type") or entity_type
                            entity["entity_id"] = url_info.get("entity_id")

                            # Carry identifier fields where applicable
                            if url_info.get("issue_identifier"):
                                entity["issue_identifier"] = url_info["issue_identifier"]
                            if url_info.get("entity_identifier"):
                                entity["entity_identifier"] = url_info["entity_identifier"]
                    except Exception as e:
                        log.error(f"Error constructing entity URL: {e}")
                # Ensure id/name/type present even if URL creation failed
                if entity_data.get("id") and "entity_id" not in entity:
                    entity["entity_id"] = str(entity_data["id"])
                if entity_data.get("name") and "entity_name" not in entity:
                    entity["entity_name"] = str(entity_data["name"])
                if "entity_type" not in entity:
                    entity["entity_type"] = entity_type
        except Exception as e:
            log.warning(f"Failed to build structured entity payload: {e}")

        return PlaneToolBase.format_success_payload(message, data=data, entity=entity or None)

    @staticmethod
    def format_error_response(message: str, error: Any) -> str:
        """Format error response."""
        return f"❌ {message}\n\nError: {error}"

    @staticmethod
    def format_error_payload(message: str, error: Any = None, data: Any = None, meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Structured error payload for API/consumers. Intended long-term replacement for string responses.
        """
        payload: Dict[str, Any] = {
            "ok": False,
            "message": f"❌ {message}",
        }
        if error is not None:
            payload["error"] = error
        if data is not None:
            payload["data"] = data
        if meta is not None:
            payload["meta"] = meta
        return payload

    @staticmethod
    def generate_project_identifier(name: str) -> str:
        """Generate a project identifier from name."""
        # Take first 3-4 characters, remove spaces, convert to uppercase
        base_identifier = "".join(name.split())[:4].upper()
        if len(base_identifier) < 3:
            # If name is too short, pad with 'X' to meet minimum length
            base_identifier = base_identifier.ljust(3, "X")
        return base_identifier

    @staticmethod
    def generate_fallback_identifier(base_identifier: str) -> str:
        """Generate a fallback identifier when the base identifier is already taken.

        Keeps length stable and uses uppercase alphanumerics to match Plane identifier conventions.
        """
        if not base_identifier:
            base_identifier = "PROJ"

        ident = "".join(ch for ch in str(base_identifier).upper() if ch.isalnum() or ch == "_")
        if not ident:
            ident = "PROJ"

        alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        idx = int(time.time()) % len(alphabet)
        replacement = alphabet[idx]

        if len(ident) == 1:
            return replacement
        return ident[:-1] + replacement

    @staticmethod
    def generate_fallback_name_identifier(base_name: str, base_identifier: str) -> Tuple[str, str]:
        """Generate fallback name and identifier with timestamp."""
        timestamp = str(int(time.time()))[-5:]  # Last 5 digits of timestamp
        name = f"{base_name}{timestamp}"
        identifier = f"{base_identifier}{timestamp}"
        return name, identifier


def get_workspace_slug_from_context(context: Dict[str, Any]) -> Optional[str]:
    """Extract workspace_slug from context."""
    return context.get("workspace_slug") if context else None


def get_project_id_from_context(context: Dict[str, Any]) -> Optional[str]:
    """Extract project_id from context."""
    return context.get("project_id") if context else None


def get_user_id_from_context(context: Dict[str, Any]) -> Optional[str]:
    """Extract user_id from context."""
    return context.get("user_id") if context else None


def auto_fill_parameters(context: Dict[str, Any], **kwargs) -> Dict[str, Any]:
    """Auto-fill common parameters from context if not provided."""
    result = kwargs.copy()

    if result.get("workspace_slug") is None:
        result["workspace_slug"] = get_workspace_slug_from_context(context)
    if result.get("project_id") is None:
        result["project_id"] = get_project_id_from_context(context)
    if result.get("user_id") is None:
        result["user_id"] = get_user_id_from_context(context)

    return result
