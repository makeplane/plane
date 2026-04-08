#!/usr/bin/env python3
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
Comprehensive test script for Plane Actions
Tests all create/update tools directly without frontend
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from pi import logger
from pi.services.actions.method_executor import MethodExecutor
from pi.services.actions.plane_actions_executor import PlaneActionsExecutor

# Configure logging
log = logger.getChild(__name__)


class PlaneActionsTestSuite:
    """Comprehensive test suite for Plane actions"""

    def __init__(self, api_key: str, workspace_slug: str):
        self.api_key = api_key
        self.workspace_slug = workspace_slug
        self.executor = PlaneActionsExecutor(api_key=api_key)
        self.method_executor = MethodExecutor(self.executor)

        # Test context - will be populated during tests
        self.test_context = {
            "workspace_slug": workspace_slug,
            "user_id": None,
            "project_id": None,
            "cycle_id": None,
            "module_id": None,
            "work_item_id": None,
            "label_id": None,
            "state_id": None,
        }

        # Test results tracking
        self.results: Dict[str, List[Any]] = {"passed": [], "failed": [], "skipped": []}

    async def setup_test_context(self):
        """Setup test context by creating necessary resources"""
        log.info("🔧 Setting up test context...")

        try:
            # Get current user
            user_result = self.executor.sdk_adapter.get_current_user()
            self.test_context["user_id"] = user_result.get("id")
            log.info(f"✅ Got user ID: {self.test_context['user_id']}")

            # Create test project
            project_name = f"Test Project {datetime.now().strftime('%Y%m%d_%H%M%S')}"
            project_identifier = f"TEST{datetime.now().strftime('%H%M%S')}"

            project_result = self.executor.sdk_adapter.create_project(
                workspace_slug=self.workspace_slug, name=project_name, identifier=project_identifier, description="Automated test project"
            )
            self.test_context["project_id"] = project_result.get("id")
            log.info(f"✅ Created test project: {self.test_context['project_id']}")

        except Exception as e:
            log.error(f"❌ Failed to setup test context: {e}")
            raise

    async def test_category(self, category: str) -> Dict[str, Any]:
        """Test all create/update methods in a category"""
        log.info(f"🧪 Testing category: {category}")

        category_results: Dict[str, Any] = {"passed": 0, "failed": 0, "tests": []}

        try:
            # Get methods for this category
            methods = self.executor.get_category_methods(category)

            for method_name in methods.keys():
                if any(action in method_name for action in ["create", "update", "list"]):
                    result = await self.test_method(category, method_name)
                    category_results["tests"].append(result)

                    if result["status"] == "passed":
                        category_results["passed"] += 1
                    else:
                        category_results["failed"] += 1

        except Exception as e:
            log.error(f"❌ Failed to test category {category}: {e}")
            category_results["tests"].append({"method": f"{category}_error", "status": "failed", "error": str(e)})
            category_results["failed"] += 1

        return category_results

    async def test_method(self, category: str, method_name: str) -> Dict[str, Any]:
        """Test a specific method with appropriate test data"""
        log.info(f"  🔍 Testing {category}.{method_name}")

        try:
            # Get test parameters for this method
            test_params = self.get_test_parameters(category, method_name)

            if not test_params:
                return {"method": f"{category}.{method_name}", "status": "skipped", "reason": "No test parameters defined"}

            # Execute the method
            result = await self.method_executor.execute(category=category, method=method_name, **test_params)

            # Validate result
            if result and isinstance(result, dict):
                log.info(f"    ✅ {category}.{method_name} - Success")

                # Store important IDs for future tests
                self.update_test_context(category, method_name, result)

                return {
                    "method": f"{category}.{method_name}",
                    "status": "passed",
                    "result_keys": list(result.keys()) if isinstance(result, dict) else "non-dict",
                    "has_id": "id" in result if isinstance(result, dict) else False,
                }
            else:
                log.warning(f"    ⚠️  {category}.{method_name} - Unexpected result format")
                return {"method": f"{category}.{method_name}", "status": "failed", "error": "Unexpected result format", "result": str(result)[:200]}

        except Exception as e:
            log.error(f"    ❌ {category}.{method_name} - Failed: {e}")
            return {"method": f"{category}.{method_name}", "status": "failed", "error": str(e)}

    def get_test_parameters(self, category: str, method_name: str) -> Optional[Dict[str, Any]]:
        """Get appropriate test parameters for each method"""

        # Base parameters that most methods need
        base_params = {
            "workspace_slug": self.test_context["workspace_slug"],
            "project_id": self.test_context["project_id"],
            "user_id": self.test_context["user_id"],
        }

        # Method-specific parameters
        method_params = {
            # Projects
            "projects.create_project": {
                "name": f"Test Project {uuid.uuid4().hex[:8]}",
                "identifier": f"TP{uuid.uuid4().hex[:6].upper()}",
                "description": "Test project created by automation",
            },
            "projects.list_projects": {"per_page": 5},
            "projects.update_project": {"project_id": self.test_context["project_id"], "description": "Updated by automation test"},
            # Work Items
            "workitems.create_work_item": {
                "name": f"Test Work Item {uuid.uuid4().hex[:8]}",
                "description_html": "<p>Test work item created by automation</p>",
                "priority": "medium",
            },
            "workitems.list_work_items": {"per_page": 5},
            "workitems.update_work_item": {"work_item_id": self.test_context.get("work_item_id"), "description_html": "<p>Updated by automation</p>"}
            if self.test_context.get("work_item_id")
            else None,
            # Cycles
            "cycles.create_cycle": {
                "name": f"Test Cycle {uuid.uuid4().hex[:8]}",
                "description": "Test cycle created by automation",
                "start_date": datetime.now().isoformat(),
                "end_date": (datetime.now().replace(day=28)).isoformat(),
            },
            "cycles.list_cycles": {"per_page": 5},
            "cycles.update_cycle": {"cycle_id": self.test_context.get("cycle_id"), "description": "Updated by automation"}
            if self.test_context.get("cycle_id")
            else None,
            # Labels
            "labels.create_label": {
                "name": f"test-label-{uuid.uuid4().hex[:8]}",
                "color": "#FF5733",
                "description": "Test label created by automation",
            },
            "labels.list_labels": {},
            "labels.update_label": {"label_id": self.test_context.get("label_id"), "description": "Updated by automation"}
            if self.test_context.get("label_id")
            else None,
            # States
            "states.create_state": {
                "name": f"Test State {uuid.uuid4().hex[:8]}",
                "color": "#28A745",
                "description": "Test state created by automation",
            },
            "states.list_states": {},
            "states.update_state": {"state_id": self.test_context.get("state_id"), "description": "Updated by automation"}
            if self.test_context.get("state_id")
            else None,
            # Modules
            "modules.create_module": {"name": f"Test Module {uuid.uuid4().hex[:8]}", "description": "Test module created by automation"},
            "modules.list_modules": {},
            "modules.update_module": {"module_id": self.test_context.get("module_id"), "description": "Updated by automation"}
            if self.test_context.get("module_id")
            else None,
        }

        method_key = f"{category}.{method_name}"
        specific_params = method_params.get(method_key)

        if specific_params is None:
            return None

        # Merge base params with specific params
        assert isinstance(specific_params, dict), "specific_params should be a dict"
        return {**base_params, **specific_params}

    def update_test_context(self, category: str, method_name: str, result: Dict[str, Any]):
        """Update test context with IDs from successful operations"""
        if not isinstance(result, dict) or "id" not in result:
            return

        result_id = result["id"]

        # Map results to context keys
        context_mapping = {
            ("projects", "create_project"): "project_id",
            ("workitems", "create_work_item"): "work_item_id",
            ("cycles", "create_cycle"): "cycle_id",
            ("modules", "create_module"): "module_id",
            ("labels", "create_label"): "label_id",
            ("states", "create_state"): "state_id",
        }

        context_key = context_mapping.get((category, method_name))
        if context_key:
            self.test_context[context_key] = result_id
            log.info(f"    📝 Updated context: {context_key} = {result_id}")

    async def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run comprehensive test of all action categories"""
        log.info("🚀 Starting comprehensive Plane actions test...")

        # Setup test environment
        await self.setup_test_context()

        # Get all categories
        categories = self.executor.get_api_categories()

        # Test results
        overall_results: Dict[str, Any] = {
            "total_categories": len(categories),
            "categories_tested": 0,
            "total_passed": 0,
            "total_failed": 0,
            "category_results": {},
            "test_context": self.test_context,
            "timestamp": datetime.now().isoformat(),
        }

        # Test each category
        for category_name, category_description in categories.items():
            try:
                category_result = await self.test_category(category_name)
                overall_results["category_results"][category_name] = category_result
                overall_results["categories_tested"] += 1
                overall_results["total_passed"] += category_result["passed"]
                overall_results["total_failed"] += category_result["failed"]

                log.info(f"📊 {category_name}: {category_result['passed']} passed, {category_result['failed']} failed")

            except Exception as e:
                log.error(f"❌ Failed to test category {category_name}: {e}")
                overall_results["category_results"][category_name] = {"error": str(e), "passed": 0, "failed": 1}
                overall_results["total_failed"] += 1

        return overall_results

    def generate_report(self, results: Dict[str, Any]) -> str:
        """Generate a comprehensive test report"""
        report = f"""
🧪 PLANE ACTIONS TEST REPORT
{"=" * 50}

📊 SUMMARY:
- Total Categories: {results["total_categories"]}
- Categories Tested: {results["categories_tested"]}
- Total Tests Passed: {results["total_passed"]}
- Total Tests Failed: {results["total_failed"]}
- Success Rate: {(results["total_passed"] / (results["total_passed"] + results["total_failed"]) * 100):.1f}%

🔧 TEST CONTEXT:
- Workspace: {results["test_context"]["workspace_slug"]}
- User ID: {results["test_context"]["user_id"]}
- Test Project: {results["test_context"]["project_id"]}

📋 CATEGORY BREAKDOWN:
"""

        for category, result in results["category_results"].items():
            if "error" in result:
                report += f"❌ {category}: ERROR - {result['error']}\n"
            else:
                report += f"{'✅' if result['failed'] == 0 else '⚠️'} {category}: {result['passed']} passed, {result['failed']} failed\n"

                # Show failed tests
                if result["failed"] > 0:
                    failed_tests = [t for t in result.get("tests", []) if t["status"] == "failed"]
                    for test in failed_tests:
                        report += f"    ❌ {test['method']}: {test.get('error', 'Unknown error')}\n"

        report += f"\n⏰ Test completed at: {results['timestamp']}\n"

        return report


async def main():
    """Main test execution"""

    # Configuration - UPDATE THESE VALUES
    API_KEY = "your_api_key_here"
    WORKSPACE_SLUG = "your_workspace_slug"
    BASE_URL = "http://localhost:8000"

    if API_KEY == "your_api_key_here":
        print("❌ Please update API_KEY and WORKSPACE_SLUG in the script")
        return

    # Run tests
    test_suite = PlaneActionsTestSuite(API_KEY, WORKSPACE_SLUG)
    test_suite.executor = PlaneActionsExecutor(api_key=API_KEY, base_url=BASE_URL)

    try:
        results = await test_suite.run_comprehensive_test()

        # Generate and save report
        report = test_suite.generate_report(results)

        # Save detailed results
        with open("plane_actions_test_results.json", "w") as f:
            json.dump(results, f, indent=2, default=str)

        # Save readable report
        with open("plane_actions_test_report.txt", "w") as f:
            f.write(report)

        print(report)
        print("\n📁 Detailed results saved to: plane_actions_test_results.json")
        print("📁 Readable report saved to: plane_actions_test_report.txt")

    except Exception as e:
        log.error(f"❌ Test suite failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
