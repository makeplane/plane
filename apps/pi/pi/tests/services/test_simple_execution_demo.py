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
Simple demonstration of how to execute Plane API methods.

This test shows the basic usage pattern for executing Plane API methods
through the MethodExecutor -> PlaneActionsExecutor -> PlaneSDKAdapter chain.
"""

from unittest.mock import AsyncMock
from unittest.mock import patch

import pytest

from pi.services.actions.method_executor import MethodExecutor
from pi.services.actions.plane_actions_executor import PlaneActionsExecutor
from pi.services.actions.plane_sdk_adapter import PlaneSDKAdapter


class TestSimpleExecutionDemo:
    """Simple demonstration of API method execution."""

    @pytest.mark.asyncio
    async def test_simple_execution_demo(self):
        """Demonstrate how to execute a Plane API method."""

        # Step 1: Create the execution chain
        # This is the typical setup you'd use in your application
        with patch("pi.plane_sdk_compat.ApiClient") as mock_api_client:
            # Mock the API client to avoid actual network calls
            mock_api_client.return_value = AsyncMock()

            # Create the full execution chain
            adapter = PlaneSDKAdapter(access_token="your-token-here")
            executor = PlaneActionsExecutor(access_token="your-token-here")
            executor.sdk_adapter = adapter
            method_executor = MethodExecutor(executor)

            # Step 2: Mock the SDK method response
            # In real usage, this would be an actual API call
            setattr(
                adapter,
                "get_current_user",
                AsyncMock(
                    return_value={
                        "id": "user-123",
                        "email": "john.doe@example.com",
                        "first_name": "John",
                        "last_name": "Doe",
                        "display_name": "John Doe",
                    }
                ),
            )

            # Step 3: Execute the method
            # This is how you'd call it in your application
            result = await method_executor.execute("users", "get_current_user")

            # Step 4: Verify the result
            assert result["success"] is True
            assert "data" in result
            assert result["data"]["id"] == "user-123"
            assert result["data"]["email"] == "john.doe@example.com"
            assert result["data"]["first_name"] == "John"
            assert result["data"]["last_name"] == "Doe"

            print("✅ Successfully executed get_current_user method!")
            print(f"   User ID: {result['data']['id']}")
            print(f"   Email: {result['data']['email']}")
            print(f"   Name: {result['data']['first_name']} {result['data']['last_name']}")

    @pytest.mark.asyncio
    async def test_list_projects_demo(self):
        """Demonstrate how to list projects."""

        with patch("pi.plane_sdk_compat.ApiClient") as mock_api_client:
            mock_api_client.return_value = AsyncMock()

            # Create the execution chain
            adapter = PlaneSDKAdapter(access_token="your-token-here")
            executor = PlaneActionsExecutor(access_token="your-token-here")
            executor.sdk_adapter = adapter
            method_executor = MethodExecutor(executor)

            # Mock the response
            setattr(
                adapter,
                "list_projects",
                AsyncMock(
                    return_value={
                        "results": [
                            {"id": "project-1", "name": "My First Project", "description": "A sample project", "workspace": "my-workspace"},
                            {"id": "project-2", "name": "My Second Project", "description": "Another sample project", "workspace": "my-workspace"},
                        ],
                        "count": 2,
                    }
                ),
            )

            # Execute the method
            result = await method_executor.execute("projects", "list", workspace_slug="my-workspace")

            # Verify the result
            assert result["success"] is True
            assert "data" in result
            assert "results" in result["data"]
            assert len(result["data"]["results"]) == 2
            assert result["data"]["results"][0]["name"] == "My First Project"
            assert result["data"]["results"][1]["name"] == "My Second Project"

            print("✅ Successfully executed list_projects method!")
            print(f"   Found {len(result['data']['results'])} projects")
            for project in result["data"]["results"]:
                print(f"   - {project['name']} (ID: {project['id']})")

    @pytest.mark.asyncio
    async def test_error_handling_demo(self):
        """Demonstrate error handling."""

        with patch("pi.plane_sdk_compat.ApiClient") as mock_api_client:
            mock_api_client.return_value = AsyncMock()

            # Create the execution chain
            adapter = PlaneSDKAdapter(access_token="your-token-here")
            executor = PlaneActionsExecutor(access_token="your-token-here")
            executor.sdk_adapter = adapter
            method_executor = MethodExecutor(executor)

            # Mock an error response
            setattr(adapter, "get_current_user", AsyncMock(side_effect=Exception("API Error: Invalid token")))

            # Execute the method
            result = await method_executor.execute("users", "get_current_user")

            # Verify error handling
            assert result["success"] is False
            assert "error" in result
            assert "API Error" in result["error"]

            print("✅ Successfully handled API error!")
            print(f"   Error: {result['error']}")

    def test_available_methods_demo(self):
        """Demonstrate how to see available methods."""

        # Create a method executor (we don't need the full chain for this)
        mock_executor = AsyncMock()
        MethodExecutor(mock_executor)

        # Get available methods for a category
        # Show available categories
        from pi.services.actions.registry import get_available_categories
        from pi.services.actions.registry import get_category_methods

        categories = get_available_categories()

        print("✅ Available API categories:")
        for category in sorted(categories.keys()):
            methods = get_category_methods(category)
            print(f"   {category}: {len(methods)} methods")
            for method, description in methods.items():
                print(f"     - {method}: {description}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
