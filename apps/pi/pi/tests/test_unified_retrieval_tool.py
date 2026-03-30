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

import sys
import types
import unittest
from unittest.mock import AsyncMock
from unittest.mock import MagicMock
from unittest.mock import patch

# 1. Prepare Mock Modules for sys.modules
# Mock langchain_core.tools and pi.services.actions.tools.base
mock_langchain_core = types.ModuleType("langchain_core")
mock_lc_tools = types.ModuleType("langchain_core.tools")
mock_pi_services = types.ModuleType("pi.services.actions.tools.base")


# Define mock @tool decorator
def mock_tool_decorator(func):
    func.coroutine = func
    return func


setattr(mock_lc_tools, "tool", mock_tool_decorator)

# Define mock PlaneToolBase
mock_tool_base_cls = MagicMock()
mock_tool_base_cls.format_error_payload = lambda msg, detail: {"error": msg, "message": detail}
mock_tool_base_cls.format_success_payload = lambda msg, data: {"ok": True, "message": msg, "data": data}
setattr(mock_pi_services, "PlaneToolBase", mock_tool_base_cls)


# Mock plane_sql_queries
mock_queries = types.ModuleType("pi.app.api.v1.helpers.plane_sql_queries")
mock_queries.get_issue_identifier_for_artifact = AsyncMock(return_value={"project_id": "resolved-project-id"})  # type: ignore[attr-defined]


# 2. Patch sys.modules context manager
@patch.dict(
    sys.modules,
    {
        "langchain_core": mock_langchain_core,
        "langchain_core.tools": mock_lc_tools,
        "pi.services.actions.tools.base": mock_pi_services,
        "pi.app.api.v1.helpers.plane_sql_queries": mock_queries,
        # Also mock logging to avoid noise
        "logging": MagicMock(),
    },
)
def load_unified_module():
    """Load the module in an isolated namespace/globals using exec."""
    # We still need a namespace for globals
    module_namespace = {"__name__": "pi.services.actions.tools.unified_retrieval"}

    with open("pi/services/actions/tools/unified_retrieval.py", "r") as f:
        code = f.read()

    # exec will trigger imports, which will pick up our patched sys.modules
    exec(code, module_namespace)
    return module_namespace


# Load module ONCE
loaded_module = load_unified_module()
get_unified_retrieval_tools = loaded_module["get_unified_retrieval_tools"]
ENTITY_LIST_CONFIG = loaded_module["ENTITY_LIST_CONFIG"]
ENTITY_RETRIEVE_CONFIG = loaded_module["ENTITY_RETRIEVE_CONFIG"]
RETRIEVE_ENTITY_TYPES = loaded_module["RETRIEVE_ENTITY_TYPES"]


class TestUnifiedRetrievalTool(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Mock MethodExecutor (unchanged)
        self.method_executor = AsyncMock()
        self.method_executor.execute = AsyncMock(return_value={"results": []})

        # Default context
        self.context = {"workspace_slug": "test-workspace", "project_id": "test-project-id", "user_id": "test-user-id"}

        # Initialize tools
        self.tools = get_unified_retrieval_tools(self.method_executor, self.context)
        self.entity_list = self.tools[0]

    async def test_list_projects(self):
        """Test listing projects (Workspace scope)."""
        # Projects support per_page and cursor
        await self.entity_list.coroutine(entity_type="projects", per_page=50, cursor="abc")

        # Verify SDK Call
        self.method_executor.execute.assert_called_with(
            "projects",
            "list",
            workspace_slug="test-workspace",
            per_page=50,
            cursor="abc",
            # Note: project_id should NOT be passed for workspace entity
        )

    async def test_list_workitems_all_params(self):
        """Test listing workitems with all supported filtering params."""
        await self.entity_list.coroutine(entity_type="workitems", per_page=10, page=2, cursor="xyz", order_by="-created_at", expand=["assignees"])

        self.method_executor.execute.assert_called_with(
            "workitems",
            "list",
            workspace_slug="test-workspace",
            project_id="test-project-id",
            per_page=10,
            page=2,
            cursor="xyz",
            order_by="-created_at",
            expand="assignees",
        )

    async def test_list_modules_strict_filtering(self):
        """Test listing modules ensures unsupported params (per_page, cursor) are FILTERED OUT."""
        # Modules config: allowed_params = {}
        await self.entity_list.coroutine(
            entity_type="modules",
            per_page=100,  # Should be ignored
            cursor="ignored",  # Should be ignored
            page=5,  # Should be ignored
        )

        # Verify execution
        self.method_executor.execute.assert_called_with(
            "modules",
            "list",
            workspace_slug="test-workspace",
            project_id="test-project-id",
            # NO per_page, NO cursor, NO page
        )

    async def test_list_cycles_params(self):
        """Test listing cycles supports specific params."""
        # Cycles config: allowed_params = {per_page, page, cursor, cycle_view}
        await self.entity_list.coroutine(
            entity_type="cycles",
            per_page=20,
            cycle_view="active",
            order_by="-name",  # Should be ignored (not in allowed_params for cycles)
        )

        self.method_executor.execute.assert_called_with(
            "cycles", "list", workspace_slug="test-workspace", project_id="test-project-id", per_page=20, cycle_view="active"
        )

    async def test_cycle_workitems_container_id(self):
        """Test listing work items in a cycle (Container scope)."""
        await self.entity_list.coroutine(
            entity_type="cycle_workitems",
            cycle_id="test-cycle-id",
            per_page=100,  # Should be ignored (cycle_workitems allowed_params={})
        )

        self.method_executor.execute.assert_called_with(
            "cycles", "list_work_items", workspace_slug="test-workspace", project_id="test-project-id", cycle_id="test-cycle-id"
        )

    async def test_workitem_scoped_entities_use_issue_id(self):
        """Test listing work-item scoped entities maps work_item_id to issue_id."""
        await self.entity_list.coroutine(
            entity_type="comments",
            work_item_id="test-issue-id",
        )

        self.method_executor.execute.assert_called_with(
            "comments",
            "list",
            workspace_slug="test-workspace",
            project_id="test-project-id",
            issue_id="test-issue-id",
        )

    async def test_error_missing_project_id(self):
        """Test error when project_id is missing for project-scoped entity."""
        # Reset context to have no project_id
        no_project_ops = get_unified_retrieval_tools(self.method_executor, {"workspace_slug": "ws"})
        tool = no_project_ops[0]

        result = await tool.coroutine(entity_type="workitems")

        self.assertIn("error", result)
        self.assertIn("project_id is required", result["error"])

    async def test_list_project_members(self):
        """Test listing project members."""
        await self.entity_list.coroutine(entity_type="project_members", project_id="test-project-id")

        self.method_executor.execute.assert_called_with(
            "members", "get_project_members", workspace_slug="test-workspace", project_id="test-project-id"
        )

    async def test_error_missing_container_id(self):
        """Test error when cycle_id is missing for cycle_workitems."""
        result = await self.entity_list.coroutine(
            entity_type="cycle_workitems",
            # cycle_id missing
        )

        self.assertIn("error", result)
        self.assertIn("cycle_id is required", result["error"])


class TestEntityRetrieveTool(unittest.IsolatedAsyncioTestCase):
    """Tests for the unified entity_retrieve tool."""

    async def asyncSetUp(self):
        self.method_executor = AsyncMock()
        self.method_executor.execute = AsyncMock(return_value={"success": True, "data": {"id": "test-id", "name": "Test Entity"}})

        self.context = {"workspace_slug": "test-workspace", "project_id": "test-project-id", "user_id": "test-user-id"}

        self.tools = get_unified_retrieval_tools(self.method_executor, self.context)
        self.entity_retrieve = self.tools[1]

    # ------------------------------------------------------------------
    # Config integrity
    # ------------------------------------------------------------------
    async def test_retrieve_config_has_expected_entity_types(self):
        """Verify ENTITY_RETRIEVE_CONFIG contains all expected entity types."""
        expected_types = {
            "projects",
            "initiatives",
            "teamspaces",
            "stickies",
            "customers",
            "workitems",
            "cycles",
            "labels",
            "states",
            "modules",
            "intake",
            "types",
            "activity",
            "comments",
            "links",
            "attachments",
        }
        self.assertEqual(set(ENTITY_RETRIEVE_CONFIG.keys()), expected_types)

    # ------------------------------------------------------------------
    # Workspace-scoped retrieves
    # ------------------------------------------------------------------
    async def test_retrieve_project(self):
        """Test retrieving a project (workspace scope)."""
        await self.entity_retrieve.coroutine(entity_type="projects", entity_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890")

        self.method_executor.execute.assert_called_with(
            "projects",
            "retrieve",
            workspace_slug="test-workspace",
            project_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            # No separate project_id param — entity_id IS the project_id
        )

    async def test_retrieve_initiative(self):
        """Test retrieving an initiative (workspace scope)."""
        await self.entity_retrieve.coroutine(entity_type="initiatives", entity_id="init-id-456")

        self.method_executor.execute.assert_called_with(
            "initiatives",
            "retrieve",
            workspace_slug="test-workspace",
            initiative_id="init-id-456",
        )

    async def test_retrieve_customer(self):
        """Test retrieving a customer (workspace scope)."""
        await self.entity_retrieve.coroutine(entity_type="customers", entity_id="cust-id-789")

        self.method_executor.execute.assert_called_with(
            "customers",
            "retrieve",
            workspace_slug="test-workspace",
            customer_id="cust-id-789",
        )

    async def test_retrieve_teamspace(self):
        """Test retrieving a teamspace (workspace scope)."""
        await self.entity_retrieve.coroutine(entity_type="teamspaces", entity_id="ts-id-111")

        self.method_executor.execute.assert_called_with(
            "teamspaces",
            "retrieve",
            workspace_slug="test-workspace",
            teamspace_id="ts-id-111",
        )

    async def test_retrieve_sticky(self):
        """Test retrieving a sticky (workspace scope)."""
        await self.entity_retrieve.coroutine(entity_type="stickies", entity_id="sticky-id-222")

        self.method_executor.execute.assert_called_with(
            "stickies",
            "retrieve",
            workspace_slug="test-workspace",
            sticky_id="sticky-id-222",
        )

    # ------------------------------------------------------------------
    # Project-scoped retrieves
    # ------------------------------------------------------------------
    async def test_retrieve_workitem(self):
        """Test retrieving a workitem (project scope, auto-fill project_id)."""
        await self.entity_retrieve.coroutine(entity_type="workitems", entity_id="wi-id-333")

        self.method_executor.execute.assert_called_with(
            "workitems",
            "retrieve",
            workspace_slug="test-workspace",
            issue_id="wi-id-333",
            project_id="test-project-id",
        )

    async def test_retrieve_cycle(self):
        """Test retrieving a cycle with explicit project_id."""
        await self.entity_retrieve.coroutine(entity_type="cycles", entity_id="cycle-id-444", project_id="proj-abc")

        self.method_executor.execute.assert_called_with(
            "cycles",
            "retrieve",
            workspace_slug="test-workspace",
            cycle_id="cycle-id-444",
            project_id="proj-abc",
        )

    async def test_retrieve_module(self):
        """Test retrieving a module (project scope, auto-fill project_id)."""
        await self.entity_retrieve.coroutine(entity_type="modules", entity_id="mod-id-555")

        self.method_executor.execute.assert_called_with(
            "modules",
            "retrieve",
            workspace_slug="test-workspace",
            module_id="mod-id-555",
            project_id="test-project-id",
        )

    async def test_retrieve_label(self):
        """Test retrieving a label (project scope)."""
        await self.entity_retrieve.coroutine(entity_type="labels", entity_id="lbl-id-666")

        self.method_executor.execute.assert_called_with(
            "labels",
            "retrieve",
            workspace_slug="test-workspace",
            label_id="lbl-id-666",
            project_id="test-project-id",
        )

    async def test_retrieve_state(self):
        """Test retrieving a state (project scope)."""
        await self.entity_retrieve.coroutine(entity_type="states", entity_id="st-id-777")

        self.method_executor.execute.assert_called_with(
            "states",
            "retrieve",
            workspace_slug="test-workspace",
            state_id="st-id-777",
            project_id="test-project-id",
        )

    async def test_retrieve_type(self):
        """Test retrieving a type (project scope)."""
        await self.entity_retrieve.coroutine(entity_type="types", entity_id="type-id-888")

        self.method_executor.execute.assert_called_with(
            "types",
            "retrieve",
            workspace_slug="test-workspace",
            type_id="type-id-888",
            project_id="test-project-id",
        )

    async def test_retrieve_intake(self):
        """Test retrieving an intake item (project scope)."""
        await self.entity_retrieve.coroutine(entity_type="intake", entity_id="intake-id-999")

        self.method_executor.execute.assert_called_with(
            "intake",
            "retrieve",
            workspace_slug="test-workspace",
            intake_issue_id="intake-id-999",
            project_id="test-project-id",
        )

    # ------------------------------------------------------------------
    # Workitem-scoped retrieves
    # ------------------------------------------------------------------
    async def test_retrieve_comment(self):
        """Test retrieving a comment (workitem scope)."""
        await self.entity_retrieve.coroutine(entity_type="comments", entity_id="comment-id-aaa", work_item_id="wi-id-bbb")

        self.method_executor.execute.assert_called_with(
            "comments",
            "retrieve",
            workspace_slug="test-workspace",
            comment_id="comment-id-aaa",
            project_id="test-project-id",
            issue_id="wi-id-bbb",
        )

    async def test_retrieve_link(self):
        """Test retrieving a link (workitem scope)."""
        await self.entity_retrieve.coroutine(entity_type="links", entity_id="link-id-ccc", work_item_id="wi-id-ddd")

        self.method_executor.execute.assert_called_with(
            "links",
            "retrieve",
            workspace_slug="test-workspace",
            link_id="link-id-ccc",
            project_id="test-project-id",
            issue_id="wi-id-ddd",
        )

    async def test_retrieve_activity(self):
        """Test retrieving an activity (workitem scope)."""
        await self.entity_retrieve.coroutine(entity_type="activity", entity_id="act-id-eee", work_item_id="wi-id-fff")

        self.method_executor.execute.assert_called_with(
            "activity",
            "retrieve",
            workspace_slug="test-workspace",
            activity_id="act-id-eee",
            project_id="test-project-id",
            issue_id="wi-id-fff",
        )

    async def test_retrieve_attachment(self):
        """Test retrieving an attachment (workitem scope)."""
        await self.entity_retrieve.coroutine(entity_type="attachments", entity_id="att-id-ggg", work_item_id="wi-id-hhh")

        self.method_executor.execute.assert_called_with(
            "attachments",
            "retrieve",
            workspace_slug="test-workspace",
            attachment_id="att-id-ggg",
            project_id="test-project-id",
            issue_id="wi-id-hhh",
        )

    # ------------------------------------------------------------------
    # Error handling
    # ------------------------------------------------------------------
    async def test_error_missing_entity_id(self):
        """Test error when entity_id is empty."""
        result = await self.entity_retrieve.coroutine(entity_type="projects", entity_id="")

        self.assertIn("error", result)
        self.assertIn("entity_id is required", result["error"])

    async def test_error_missing_project_id_for_project_scope(self):
        """Test error when project_id is missing for project-scoped entity."""
        no_project_tools = get_unified_retrieval_tools(self.method_executor, {"workspace_slug": "ws"})
        retrieve = no_project_tools[1]

        result = await retrieve.coroutine(entity_type="cycles", entity_id="cycle-123")

        self.assertIn("error", result)
        self.assertIn("project_id is required", result["error"])

    async def test_error_missing_work_item_id(self):
        """Test error when work_item_id is missing for workitem-scoped entity."""
        result = await self.entity_retrieve.coroutine(entity_type="comments", entity_id="comment-123")

        self.assertIn("error", result)
        self.assertIn("work_item_id is required", result["error"])

    async def test_error_no_method_executor(self):
        """Test error when method_executor is None."""
        tools = get_unified_retrieval_tools(None, self.context)
        retrieve = tools[1]

        result = await retrieve.coroutine(entity_type="projects", entity_id="p-123")

        self.assertIn("error", result)
        self.assertIn("SDK method executor not available", result["error"])

    async def test_error_missing_workspace_slug(self):
        """Test error when workspace_slug is missing from context."""
        tools = get_unified_retrieval_tools(self.method_executor, {})
        retrieve = tools[1]

        result = await retrieve.coroutine(entity_type="projects", entity_id="p-123")

        self.assertIn("error", result)
        self.assertIn("workspace_slug is required", result["error"])

    # ------------------------------------------------------------------
    # Response format
    # ------------------------------------------------------------------
    async def test_response_format(self):
        """Test that response contains expected structure."""
        self.method_executor.execute.return_value = {
            "success": True,
            "data": {"id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "name": "My Project"},
        }

        result = await self.entity_retrieve.coroutine(entity_type="projects", entity_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890")

        self.assertTrue(result.get("ok"))
        self.assertEqual(result["data"]["entity_type"], "projects")
        self.assertIn("data", result["data"])
        self.assertEqual(result["data"]["data"]["id"], "a1b2c3d4-e5f6-7890-abcd-ef1234567890")

    async def test_sdk_error_propagated(self):
        """Test that SDK errors are properly propagated."""
        self.method_executor.execute.return_value = {
            "success": False,
            "error": "Entity not found",
        }

        result = await self.entity_retrieve.coroutine(entity_type="projects", entity_id="a1b2c3d4-e5f6-7890-abcd-000000000000")

        self.assertIn("error", result)
        self.assertIn("Failed to retrieve", result["error"])

    async def test_sdk_exception_handled(self):
        """Test that SDK exceptions are caught and returned as errors."""
        self.method_executor.execute.side_effect = Exception("Network timeout")

        result = await self.entity_retrieve.coroutine(entity_type="projects", entity_id="a1b2c3d4-e5f6-7890-abcd-111111111111")

        self.assertIn("error", result)
        self.assertIn("Failed to retrieve", result["error"])

    # ------------------------------------------------------------------
    # ID Resolution Logic
    # ------------------------------------------------------------------
    async def test_auto_resolve_missing_project_id(self):
        """Test resolving project_id from work_item_id when project_id is missing."""
        # Use context WITHOUT project_id
        tools = get_unified_retrieval_tools(self.method_executor, {"workspace_slug": "ws"})
        retrieve = tools[1]

        # Prepare mock for query
        mock_queries = MagicMock()
        mock_queries.get_issue_identifier_for_artifact = AsyncMock(return_value={"project_id": "resolved-project-id"})

        # Patch sys.modules so the local import inside entity_retrieve picks up our mock
        with patch.dict(sys.modules, {"pi.app.api.v1.helpers.plane_sql_queries": mock_queries}):
            # Call with work_item_id but NO project_id
            await retrieve.coroutine(entity_type="activity", entity_id="act-123", work_item_id="wi-resolved")

        # Should have called execute with "resolved-project-id" (from mock)
        self.method_executor.execute.assert_called_with(
            "activity", "retrieve", workspace_slug="ws", activity_id="act-123", issue_id="wi-resolved", project_id="resolved-project-id"
        )

    async def test_auto_resolve_invalid_project_id(self):
        """Test resolving project_id when provided project_id is not a valid UUID."""
        # Prepare mock for query
        mock_queries = MagicMock()
        mock_queries.get_issue_identifier_for_artifact = AsyncMock(return_value={"project_id": "resolved-project-id"})

        # Patch sys.modules
        with patch.dict(sys.modules, {"pi.app.api.v1.helpers.plane_sql_queries": mock_queries}):
            # Call with INVALID project_id
            await self.entity_retrieve.coroutine(
                entity_type="comments",
                entity_id="com-123",
                work_item_id="wi-resolved",
                project_id="current",  # Not a UUID
            )

        # Should have called execute with "resolved-project-id" (from mock), OVERRIDING "current"
        self.method_executor.execute.assert_called_with(
            "comments",
            "retrieve",
            workspace_slug="test-workspace",  # from setup context
            comment_id="com-123",
            issue_id="wi-resolved",
            project_id="resolved-project-id",
        )


if __name__ == "__main__":
    unittest.main()
