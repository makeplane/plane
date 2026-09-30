# Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

import pytest
from plane.bgtasks.issue_activities_task import track_duration


def run_track_duration(current, requested):
    """Call track_duration with throwaway ids and return the activities it produced."""
    activities = []
    track_duration(
        requested_data=requested,
        current_instance=current,
        issue_id=uuid.uuid4(),
        project_id=uuid.uuid4(),
        workspace_id=uuid.uuid4(),
        actor_id=uuid.uuid4(),
        issue_activities=activities,
        epoch=1767225600,
    )
    return activities


@pytest.mark.unit
class TestTrackDuration:
    def test_records_a_changed_duration(self):
        activities = run_track_duration({"duration": 5}, {"duration": 8})

        assert len(activities) == 1
        activity = activities[0]
        assert activity.field == "duration"
        assert activity.verb == "updated"
        assert activity.old_value == 5
        assert activity.new_value == 8

    def test_records_a_duration_being_set_for_the_first_time(self):
        activities = run_track_duration({"duration": None}, {"duration": 4})

        assert len(activities) == 1
        assert activities[0].old_value == ""
        assert activities[0].new_value == 4

    def test_records_a_duration_being_cleared(self):
        activities = run_track_duration({"duration": 4}, {"duration": None})

        assert len(activities) == 1
        assert activities[0].old_value == 4
        assert activities[0].new_value == ""

    def test_ignores_an_unchanged_duration(self):
        assert run_track_duration({"duration": 5}, {"duration": 5}) == []

    def test_ignores_a_payload_without_a_duration(self):
        assert run_track_duration({"duration": None}, {"name": "renamed"}) == []
