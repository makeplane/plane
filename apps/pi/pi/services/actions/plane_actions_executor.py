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
Plane Actions Executor
Main orchestrator class that provides unified access to all Plane API categories.
Designed for hierarchical LLM-based action execution.
"""

from typing import Any
from typing import Callable
from typing import Dict
from typing import List
from typing import Optional
from typing import Union

from plane.errors import HttpError  # type: ignore[attr-defined]

from pi import logger

from .plane_sdk_adapter import PlaneSDKAdapter
from .registry import get_available_categories
from .registry import get_category_methods
from .registry import get_method_name_map
from .registry import resolve_actual_method_name

log = logger.getChild(__name__)

# Type alias for methods that can return various types including bool for delete operations
SyncMethod = Callable[..., Union[Dict[str, Any], List[Any], Any, bool]]


class PlaneActionsExecutor:
    """
    Main executor for Plane API actions.
    Provides hierarchical access to all API categories for LLM-based action execution.
    """

    def __init__(self, access_token: Optional[str] = None, api_key: Optional[str] = None, base_url: str = "https://api.plane.so"):
        """
        Initialize with OAuth access token or API key.

        Args:
            access_token: OAuth Bearer token (preferred)
            api_key: Legacy API key (fallback)
            base_url: Plane API base URL
        """
        # Initialize SDK adapter which handles pydantic v1/v2 compatibility
        self.sdk_adapter = PlaneSDKAdapter(access_token=access_token, api_key=api_key, base_url=base_url)

        # Map categories to SDK adapter for backward compatibility
        self.assets = self.sdk_adapter
        self.cycles = self.sdk_adapter
        self.labels = self.sdk_adapter
        self.modules = self.sdk_adapter
        self.projects = self.sdk_adapter
        self.states = self.sdk_adapter
        self.users = self.sdk_adapter
        self.workitems = self.sdk_adapter
        self.workspaces = self.sdk_adapter
        self.initiatives = self.sdk_adapter
        self.teamspaces = self.sdk_adapter
        self.stickies = self.sdk_adapter
        self.customers = self.sdk_adapter

    def get_api_categories(self) -> Dict[str, str]:
        """
        Get available API categories with descriptions.
        Used by LLM for hierarchical category selection.
        """
        return get_available_categories()

    def get_category_methods(self, category: str) -> Dict[str, str]:
        """
        Get available methods for a specific API category.
        Used by LLM for method selection within chosen categories.
        """
        return get_category_methods(category)

    async def execute_method(self, category: str, method: str, **kwargs) -> Dict[str, Any]:
        """
        Execute a specific method within a category.
        Used by LLM tool calling in the second stage.
        """
        try:
            # Resolve the actual adapter method name via centralized registry
            category_map = get_method_name_map(category)
            if not category_map:
                available_categories = list(get_available_categories().keys())
                raise ValueError(f"Unknown API category: {category}. Available: {available_categories}")

            actual_method_name = resolve_actual_method_name(category, method)
            if actual_method_name is None:
                available_categories = list(get_available_categories().keys())
                raise ValueError(f"Unknown API category: {category}. Available: {available_categories}")

            # Build function from adapter using getattr; this avoids duplicating mappings
            method_func: Optional[SyncMethod] = getattr(self.sdk_adapter, actual_method_name, None)  # type: ignore[assignment]
            if method_func is None:
                available_methods = list(category_map.values())
                raise ValueError(f"Unknown method '{method}' for category '{category}'. Available methods: {available_methods}")

            # Execute the method - SDK adapter returns plain dicts
            result = method_func(**kwargs)

            return {"success": True, "category": category, "method": method, "data": result}

        except HttpError as e:
            # Centralized handling for auth errors (401/403)
            status_code = getattr(e, "status_code", None)
            if status_code in (401, 403):
                log.warning(f"Auth error ({status_code}) in {category}.{method}: {e}")
                return {
                    "success": False,
                    "error": "unauthorized",
                    "message": "Authentication or authorization failed. Please check your credentials and try again.",
                    "status_code": status_code,
                    "category": category,
                    "method": method,
                }
            # Non-auth HTTP errors
            error_msg = f"HTTP error executing {category}.{method}: {str(e)}"
            log.error(error_msg)
            return {
                "success": False,
                "category": category,
                "method": method,
                "error": error_msg,
                "error_type": "HttpError",
                "status_code": status_code,
            }

        except Exception as e:
            error_msg = f"Error executing {category}.{method}: {str(e)}"
            log.error(error_msg)

            return {"success": False, "category": category, "method": method, "error": error_msg, "error_type": type(e).__name__}

    async def health_check(self) -> Dict[str, Any]:
        """Check if the API client is working properly."""
        try:
            # Test authentication by getting current user
            user = self.sdk_adapter.get_current_user()
            return {"success": True, "message": "API client is healthy", "auth_test": "passed", "user_email": user.get("email")}
        except Exception as e:
            return {"success": False, "message": f"API client health check failed: {str(e)}"}
