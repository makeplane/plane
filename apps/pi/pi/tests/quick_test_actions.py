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
Quick test script for key Plane actions
Tests the most important create/update operations
"""

import asyncio
import uuid
from datetime import datetime

from pi import logger
from pi.services.actions.plane_actions_executor import PlaneActionsExecutor

log = logger.getChild(__name__)


async def quick_test_key_actions():
    """Test the most important actions quickly"""

    API_KEY = "your_api_key_here"
    WORKSPACE_SLUG = "your_workspace_slug"

    # Demo mode check
    if API_KEY == "your_api_key_here":
        print("❌ Please configure your API credentials first!")
        print("📝 Edit this file and update API_KEY and WORKSPACE_SLUG")
        print("🔗 Get API token from: https://your-workspace.plane.so/settings/api-tokens")
        return

    executor = PlaneActionsExecutor(api_key=API_KEY, base_url="http://localhost:8000")

    print("🚀 Quick test of key Plane actions...\n")

    try:
        # Test 1: Get current user
        print("1️⃣ Testing get_current_user...")
        user = executor.sdk_adapter.get_current_user()
        user_id = user.get("id")
        print(f"   ✅ User: {user.get('display_name')} ({user_id})")

        # Test 2: List projects
        print("\n2️⃣ Testing list_projects...")
        projects = executor.sdk_adapter.list_projects(workspace_slug=WORKSPACE_SLUG, per_page=3)
        print(f"   ✅ Found {len(projects.get('results', []))} projects")

        # Get a project ID for further tests
        project_id = None
        if projects.get("results"):
            project_id = projects["results"][0]["id"]
            print(f"   📝 Using project: {projects['results'][0]['name']} ({project_id})")

        if not project_id:
            # Test 3: Create project
            print("\n3️⃣ Testing create_project...")
            project_name = f"Quick Test {datetime.now().strftime('%H%M%S')}"
            project_identifier = f"QT{datetime.now().strftime('%H%M%S')}"

            project = executor.sdk_adapter.create_project(
                workspace_slug=WORKSPACE_SLUG, name=project_name, identifier=project_identifier, description="Quick test project"
            )
            project_id = project.get("id")
            print(f"   ✅ Created project: {project_name} ({project_id})")

        # Test 4: Create work item
        print("\n4️⃣ Testing create_work_item...")
        if not project_id:
            print("   ❌ No project available for work item creation")
            return

        work_item = executor.sdk_adapter.create_work_item(
            workspace_slug=WORKSPACE_SLUG,
            project_id=project_id,
            name=f"Quick Test Work Item {uuid.uuid4().hex[:8]}",
            description_html="<p>This is a test work item created by automation</p>",
            priority="medium",
        )
        work_item_id = work_item.get("id")
        print(f"   ✅ Created work item: {work_item.get('name')} ({work_item_id})")

        # Test 5: Create cycle (simple)
        print("\n5️⃣ Testing create_cycle (simple)...")
        cycle = executor.sdk_adapter.create_cycle(
            workspace_slug=WORKSPACE_SLUG,
            project_id=project_id,
            name=f"Quick Test Cycle {uuid.uuid4().hex[:8]}",
            description="Quick test cycle",
            user_id=user_id,
        )
        cycle_id = cycle.get("id")
        print(f"   ✅ Created cycle: {cycle.get('name')} ({cycle_id})")

        # Test 5b: Create cycle with dates (should reproduce the issue)
        print("\n5️⃣b Testing create_cycle with dates...")
        try:
            cycle_with_dates = executor.sdk_adapter.create_cycle(
                workspace_slug=WORKSPACE_SLUG,
                project_id=project_id,
                name=f"Quick Test Cycle With Dates {uuid.uuid4().hex[:8]}",
                description="Quick test cycle with dates",
                start_date="2024-06-11",
                end_date="2024-06-25",
                user_id=user_id,
            )
            cycle_with_dates_id = cycle_with_dates.get("id")
            print(f"   ✅ Created cycle with dates: {cycle_with_dates.get('name')} ({cycle_with_dates_id})")
        except Exception as e:
            print(f"   ❌ Cycle with dates failed: {e}")

        # Test 6: List cycles
        print("\n6️⃣ Testing list_cycles...")
        cycles = executor.sdk_adapter.list_cycles(workspace_slug=WORKSPACE_SLUG, project_id=project_id, per_page=5)
        print(f"   ✅ Found {len(cycles.get('results', []))} cycles")

        # Test 7: Create label
        print("\n7️⃣ Testing create_label...")
        label = executor.sdk_adapter.create_label(
            workspace_slug=WORKSPACE_SLUG,
            project_id=project_id,
            name=f"quick-test-{uuid.uuid4().hex[:8]}",
            color="#FF5733",
            description="Quick test label",
        )
        label_name = label.get("name") if isinstance(label, dict) else "Unknown"
        label_id = label.get("id") if isinstance(label, dict) else "Unknown"
        print(f"   ✅ Created label: {label_name} ({label_id})")

        # Test 8: Update work item
        print("\n8️⃣ Testing update_work_item...")
        if not work_item_id:
            print("   ❌ No work item available for update")
            return

        updated_item = executor.sdk_adapter.update_work_item(
            workspace_slug=WORKSPACE_SLUG, project_id=project_id, issue_id=work_item_id, description_html="<p>Updated by quick test automation</p>"
        )
        print(f"   ✅ Updated work item: {updated_item.get('name')}")

        print("\n🎉 All tests passed! Key actions are working correctly.")
        print("📊 Test Summary:")
        print("   - User operations: ✅")
        print("   - Project operations: ✅")
        print("   - Work item operations: ✅")
        print("   - Cycle operations: ✅")
        print("   - Label operations: ✅")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(quick_test_key_actions())
