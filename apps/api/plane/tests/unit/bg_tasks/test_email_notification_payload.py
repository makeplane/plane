# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.bgtasks.email_notification_task import create_payload


def _change(field, old_value, new_value, activity_time):
    return {
        "issue_activity": {
            "field": field,
            "old_value": old_value,
            "new_value": new_value,
            "activity_time": activity_time,
        }
    }


@pytest.mark.unit
class TestCreatePayloadActivityTime:
    """Each actor keeps the time of their first activity in the batch."""

    def test_keeps_first_activity_time_for_an_actor(self):
        payload = create_payload(
            {
                "actor-1": [
                    _change("state", "Todo", "In Progress", "2026-11-27T21:14:05Z"),
                    _change("priority", "low", "high", "2026-11-27T21:20:40Z"),
                ]
            }
        )
        assert payload["actor-1"]["activity_time"] == "2026-11-27 21:14:05"

    def test_each_actor_keeps_their_own_first_time(self):
        payload = create_payload(
            {
                "actor-1": [
                    _change("state", "Todo", "Done", "2026-11-27T21:14:05Z"),
                    _change("name", "a", "b", "2026-11-27T21:30:00Z"),
                ],
                "actor-2": [
                    _change("priority", "low", "high", "2026-11-27T22:00:00Z"),
                    _change("state", "Done", "Todo", "2026-11-27T22:05:00Z"),
                ],
            }
        )
        assert payload["actor-1"]["activity_time"] == "2026-11-27 21:14:05"
        assert payload["actor-2"]["activity_time"] == "2026-11-27 22:00:00"

    def test_changes_are_still_collected(self):
        payload = create_payload(
            {
                "actor-1": [
                    _change("state", "Todo", "In Progress", "2026-11-27T21:14:05Z"),
                    _change("state", "In Progress", "Done", "2026-11-27T21:20:40Z"),
                ]
            }
        )
        assert payload["actor-1"]["state"]["old_value"] == ["Todo", "In Progress"]
        assert payload["actor-1"]["state"]["new_value"] == ["In Progress", "Done"]
