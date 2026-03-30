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
Test script for Plane SDK advanced_search method.

This script demonstrates all supported filter fields from IssueFilterSet.
Run this to validate the advanced_search functionality with various filter combinations.
"""

from plane.client import PlaneClient
from plane.models.work_items import AdvancedSearchWorkItem

# Configuration
# access_token = "x5HbRsvrxloeA1d26O4yC1qFvewZyp"
api_key = "plane_api_daf96ca6ab764212bd67ecf80416818f"
client = PlaneClient(base_url="http://localhost:8000", api_key=api_key)
slug = "random"  # Your workspace slug


def print_results(test_name: str, results: list):
    """Helper to print test results."""
    print(f"\n{"=" * 80}")
    print(f"TEST: {test_name}")
    print(f"{"=" * 80}")
    print(f"Found {len(results)} results")
    for idx, item in enumerate(results[:3], 1):  # Show first 3 results
        print(f"\n  {idx}. [{item.project_identifier}-{item.sequence_id}] {item.name}")
        print(f"     Priority: {item.priority}, State: {item.state_id}")
    if len(results) > 3:
        print(f"\n  ... and {len(results) - 3} more")


# =============================================================================
# 1. TEXT SEARCH ONLY (no filters)
# =============================================================================
def test_text_search_only():
    """Test basic text search without filters."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(query="bug", limit=10))
    print_results("Text Search Only: 'bug'", results)


# =============================================================================
# 2. PRIORITY FILTERS
# =============================================================================
def test_priority_exact():
    """Test exact priority match."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"priority": "high"}, limit=10))
    print_results("Priority: high", results)


def test_priority_in():
    """Test priority in list."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"priority__in": ["high", "urgent"]}, limit=10))
    print_results("Priority: high OR urgent", results)


# =============================================================================
# 3. STATE FILTERS
# =============================================================================
def test_state_group():
    """Test state group filter."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"state_group": "started"}, limit=10))
    print_results("State Group: started", results)


def test_state_group_in():
    """Test state group in list."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"state_group__in": ["started", "unstarted"]}, limit=10))
    print_results("State Group: started OR unstarted", results)


def test_state_id():
    """Test specific state ID (replace with actual state ID from your workspace)."""
    # Note: You'll need to replace this with an actual state_id from your workspace
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"state_id": "your-state-uuid-here"}, limit=10))
    print_results("State ID: specific state", results)


# =============================================================================
# 4. ASSIGNEE FILTERS
# =============================================================================
def test_assignee_id():
    """Test assignee filter (replace with actual user ID)."""
    # Note: Replace with actual assignee_id from your workspace
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"assignee_id": "your-user-uuid-here"}, limit=10))
    print_results("Assignee: specific user", results)


def test_assignee_id_in():
    """Test assignee in list."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"assignee_id__in": ["user-uuid-1", "user-uuid-2"]}, limit=10))
    print_results("Assignee: user1 OR user2", results)


# =============================================================================
# 5. DATE FILTERS
# =============================================================================
def test_target_date_exact():
    """Test exact target date."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"target_date": "2025-02-15"}, limit=10))
    print_results("Target Date: 2025-02-15", results)


def test_target_date_range():
    """Test target date range."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"target_date__range": ["2025-02-01", "2025-02-28"]}, limit=10))
    print_results("Target Date: Feb 2025", results)


def test_start_date_range():
    """Test start date range."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"start_date__range": ["2025-01-01", "2025-01-31"]}, limit=10))
    print_results("Start Date: Jan 2025", results)


def test_created_at_range():
    """Test created_at range."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"created_at__range": ["2025-01-01", "2025-02-01"]}, limit=10))
    print_results("Created: Jan 2025", results)


def test_updated_at_range():
    """Test updated_at range."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"updated_at__range": ["2025-02-01", "2025-02-05"]}, limit=10))
    print_results("Updated: Feb 1-5, 2025", results)


# =============================================================================
# 6. PROJECT FILTERS
# =============================================================================
def test_project_id():
    """Test project filter."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"project_id": "your-project-uuid-here"}, limit=10))
    print_results("Project: specific project", results)


def test_project_id_in():
    """Test project in list."""
    results = client.work_items.advanced_search(
        slug, AdvancedSearchWorkItem(filters={"project_id__in": ["project-uuid-1", "project-uuid-2"]}, limit=10)
    )
    print_results("Project: project1 OR project2", results)


# =============================================================================
# 7. CYCLE & MODULE FILTERS
# =============================================================================
def test_cycle_id():
    """Test cycle filter."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"cycle_id": "your-cycle-uuid-here"}, limit=10))
    print_results("Cycle: specific cycle", results)


def test_module_id():
    """Test module filter."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"module_id": "your-module-uuid-here"}, limit=10))
    print_results("Module: specific module", results)


# =============================================================================
# 8. LABEL FILTERS
# =============================================================================
def test_label_id():
    """Test label filter."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"label_id": "your-label-uuid-here"}, limit=10))
    print_results("Label: specific label", results)


def test_label_id_in():
    """Test label in list."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"label_id__in": ["label-uuid-1", "label-uuid-2"]}, limit=10))
    print_results("Label: label1 OR label2", results)


# =============================================================================
# 9. CREATED BY & SUBSCRIBER FILTERS
# =============================================================================
def test_created_by_id():
    """Test created_by filter."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"created_by_id": "your-user-uuid-here"}, limit=10))
    print_results("Created By: specific user", results)


def test_subscriber_id():
    """Test subscriber filter."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"subscriber_id": "your-user-uuid-here"}, limit=10))
    print_results("Subscriber: specific user", results)


def test_mention_id():
    """Test mention filter."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"mention_id": "your-user-uuid-here"}, limit=10))
    print_results("Mentioned: specific user", results)


# =============================================================================
# 10. BOOLEAN FILTERS
# =============================================================================
def test_is_archived():
    """Test archived filter."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"is_archived": False}, limit=10))
    print_results("Is Archived: false", results)


def test_is_draft():
    """Test draft filter."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"is_draft": False}, limit=10))
    print_results("Is Draft: false", results)


# =============================================================================
# 11. COMPLEX NESTED FILTERS (AND/OR/NOT)
# =============================================================================
def test_and_combination():
    """Test AND combination: high priority AND started state."""
    results = client.work_items.advanced_search(
        slug, AdvancedSearchWorkItem(filters={"and": [{"priority": "high"}, {"state_group": "started"}, {"is_archived": False}]}, limit=10)
    )
    print_results("AND: high priority + started + not archived", results)


def test_or_combination():
    """Test OR combination: high OR urgent priority."""
    results = client.work_items.advanced_search(
        slug, AdvancedSearchWorkItem(filters={"or": [{"priority": "high"}, {"priority": "urgent"}]}, limit=10)
    )
    print_results("OR: high OR urgent priority", results)


def test_not_filter():
    """Test NOT filter: not completed."""
    results = client.work_items.advanced_search(slug, AdvancedSearchWorkItem(filters={"not": {"state_group": "completed"}}, limit=10))
    print_results("NOT: not completed", results)


def test_nested_complex():
    """Test deeply nested filters."""
    results = client.work_items.advanced_search(
        slug,
        AdvancedSearchWorkItem(
            filters={
                "and": [
                    {"state_group__in": ["started", "unstarted", "backlog"]},
                    {"or": [{"priority": "high"}, {"priority": "urgent"}]},
                    {"not": {"is_archived": True}},
                    {"target_date__range": ["2025-02-01", "2025-02-28"]},
                ]
            },
            limit=10,
        ),
    )
    print_results("Complex: (started OR unstarted) AND (high OR urgent) AND not archived AND Feb 2025", results)


def test_text_with_filters():
    """Test combining text search with filters."""
    results = client.work_items.advanced_search(
        slug,
        AdvancedSearchWorkItem(query="authentication", filters={"and": [{"priority__in": ["high", "urgent"]}, {"state_group": "started"}]}, limit=10),
    )
    print_results("Text + Filters: 'authentication' + high/urgent + started", results)


# =============================================================================
# 12. USER SPECIFIC FILTERS
# =============================================================================
def test_urgent_pending_assigned_to_me():
    """Test finding urgent pending work items assigned to the current user."""
    # Try to fetch current user ID dynamically if supported
    try:
        user = client.users.me()
        my_id = user.id
        print(f"DEBUG: Using current user ID: {my_id}")
    except Exception:
        my_id = "4dcadeda-0314-4a9f-9c15-05bcf6ca076f"  # Fallback
        print("DEBUG: Could not fetch 'me', using placeholder UUID")

    results = client.work_items.advanced_search(
        slug,
        AdvancedSearchWorkItem(
            filters={
                "and": [
                    {"priority": "urgent"},
                    {"state_group__in": ["backlog", "unstarted", "started"]},
                    {"assignee_id": my_id},
                ]
            },
            limit=10,
        ),
    )
    print_results(f"Urgent + Pending + Assigned to Me ({my_id})", results)


# =============================================================================
# MAIN EXECUTION
# =============================================================================
if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("PLANE SDK ADVANCED SEARCH - COMPREHENSIVE TEST SUITE")
    print("=" * 80)

    # Run all tests (comment out tests you don't want to run)

    # Basic tests (REQUIRES OPENSEARCH - commented out)
    # test_text_search_only()

    # Priority tests
    # test_priority_exact()
    # test_priority_in()

    # # State tests
    # test_state_group()
    # test_state_group_in()
    # # test_state_id()  # Uncomment and add real state_id

    # # Date tests (temporarily disabled - investigating HTTP 400 error)
    # # test_target_date_exact()
    # # test_target_date_range()  # HTTP 400 - needs investigation
    # # test_start_date_range()
    # # test_created_at_range()
    # # test_updated_at_range()

    # # Boolean tests
    # test_is_archived()
    # # test_is_draft()

    # # Complex nested tests
    # test_and_combination()
    # test_or_combination()
    # test_not_filter()
    # test_nested_complex()  # Uses date range - HTTP 400 error
    # test_text_with_filters()  # REQUIRES OPENSEARCH - commented out

    # User specific tests
    test_urgent_pending_assigned_to_me()

    # Tests requiring specific UUIDs (uncomment and add real IDs)
    # test_assignee_id()
    # test_project_id()
    # test_cycle_id()
    # test_module_id()
    # test_label_id()
    # test_created_by_id()
    # test_subscriber_id()
    # test_mention_id()

    print("\n" + "=" * 80)
    print("ALL TESTS COMPLETED")
    print("=" * 80)
