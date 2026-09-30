# Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.utils.community_work_item_import import (
    is_community_work_item_export,
    map_community_export_rows,
)


def test_detects_community_export_headers():
    rows = [
        {
            "project_name": "Demo",
            "project_identifier": "DEM",
            "identifier": "DEM-1",
            "name": "Task",
            "state_name": "Todo",
            "priority": "high",
        }
    ]
    assert is_community_work_item_export(rows) is True


def test_rejects_full_project_work_item_rows():
    rows = [
        {
            "external_key": "WI-1",
            "name": "Task",
            "state": "Todo",
            "priority": "none",
        }
    ]
    assert is_community_work_item_export(rows) is False


def test_maps_community_columns_to_internal_rows():
    rows = [
        {
            "Project Name": "Demo",
            "identifier": "DEM-2",
            "name": "Child",
            "state_name": "In Progress",
            "priority": "medium",
            "parent": "DEM-1",
            "start_date": "2026-06-29",
            "due_date": "2026-07-01",
            "duration": 3,
            "assignees": ["Ada Lovelace", "bob@example.com"],
            "labels": ["bug"],
            "description": "Hello",
        }
    ]
    mapped = map_community_export_rows(rows)
    assert len(mapped) == 1
    assert mapped[0]["external_key"] == "DEM-2"
    assert mapped[0]["state"] == "In Progress"
    assert mapped[0]["parent_external_key"] == "DEM-1"
    assert mapped[0]["target_date"] == "2026-07-01"
    assert mapped[0]["duration"] == 3
    assert mapped[0]["assignee_names"] == ["Ada Lovelace"]
    assert mapped[0]["assignee_emails"] == ["bob@example.com"]


def test_maps_modules_cycles_subscribers_and_relations():
    rows = [
        {
            "identifier": "DEM-3",
            "name": "Full row",
            "state_name": "Todo",
            "modules": '["Kampania"]',
            "cycles": '["Sprint 1"]',
            "subscribers": '["watcher@example.com"]',
            "relations": '[{"type": "blocking", "issue": "DEM-1"}]',
            "estimate": "5",
        }
    ]
    mapped = map_community_export_rows(rows)

    assert mapped[0]["modules"] == '["Kampania"]'
    assert mapped[0]["cycles"] == '["Sprint 1"]'
    assert mapped[0]["subscriber_emails"] == ["watcher@example.com"]
    assert mapped[0]["relations"] == '[{"type": "blocking", "issue": "DEM-1"}]'
    assert mapped[0]["estimate"] == "5"
