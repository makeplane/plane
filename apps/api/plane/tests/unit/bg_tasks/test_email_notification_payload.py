# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Unit tests for email notification payload assembly.

Reproduces the broken Comments section where deleted comments and
str(None) → "None" values rendered as empty form-like boxes.
"""

from plane.bgtasks.email_notification_task import (
    create_payload,
    is_meaningful_activity_value,
    process_email_html,
    process_html_content,
)


class TestIsMeaningfulActivityValue:
    def test_rejects_none_and_none_string(self):
        assert is_meaningful_activity_value(None) is False
        assert is_meaningful_activity_value("None") is False
        assert is_meaningful_activity_value("null") is False
        assert is_meaningful_activity_value("") is False
        assert is_meaningful_activity_value("   ") is False

    def test_accepts_real_content(self):
        assert is_meaningful_activity_value("UPDATE") is True
        assert is_meaningful_activity_value("<p><strong>UPDATE</strong></p>") is True
        assert is_meaningful_activity_value("none of the above") is True  # not exact match


class TestCreatePayloadFiltersNoneAndDeletedComments:
    def test_eqa6_regression_deleted_comment_none_string(self):
        """Exact payload shape from production EQA-6 email at 2026-08-01 13:05 UTC.

        Before fix: new_value = [UPDATE html, "None"] → two broken comment boxes.
        After fix: only the real created comment remains.
        """
        notification_data = {
            "608cad9a-0fb4-47a3-8b1f-47057f34ca49": [
                {
                    "issue_activity": {
                        "verb": "created",
                        "field": "comment",
                        "new_value": (
                            '<p class="editor-paragraph-block" '
                            'data-id="c826262e-0789-43b4-900d-af536160231a">'
                            "<strong>UPDATE</strong></p>"
                        ),
                        "old_value": "None",
                        "activity_time": "2026-08-01T13:03:31.729455Z",
                    }
                },
                {
                    "issue_activity": {
                        "verb": "deleted",
                        "field": "comment",
                        "new_value": "None",
                        "old_value": "None",
                        "activity_time": "2026-08-01T13:03:34.682665Z",
                    }
                },
            ]
        }

        payload = create_payload(notification_data)
        actor = payload["608cad9a-0fb4-47a3-8b1f-47057f34ca49"]
        assert "comment" in actor
        assert actor["comment"]["new_value"] == [
            '<p class="editor-paragraph-block" data-id="c826262e-0789-43b4-900d-af536160231a">'
            "<strong>UPDATE</strong></p>"
        ]
        # old_value "None" must not appear
        assert "old_value" not in actor["comment"] or actor["comment"].get("old_value") == []

    def test_skips_deleted_comment_only_batch(self):
        notification_data = {
            "actor-1": [
                {
                    "issue_activity": {
                        "verb": "deleted",
                        "field": "comment",
                        "new_value": "None",
                        "old_value": "None",
                        "activity_time": "2026-08-01T13:03:34.682665Z",
                    }
                }
            ]
        }
        payload = create_payload(notification_data)
        assert payload == {}

    def test_keeps_real_assignee_change(self):
        notification_data = {
            "actor-1": [
                {
                    "issue_activity": {
                        "verb": "updated",
                        "field": "assignees",
                        "new_value": "office",
                        "old_value": "",
                        "activity_time": "2026-08-01T13:09:28.906563Z",
                    }
                }
            ]
        }
        payload = create_payload(notification_data)
        assert payload["actor-1"]["assignees"]["new_value"] == ["office"]
        assert "old_value" not in payload["actor-1"]["assignees"]


class TestProcessEmailHtml:
    def test_strips_image_component(self):
        html = (
            '<p>See screenshot</p>'
            '<image-component src="fda9bf23-aedf-4d20-b7fd-d876cbed150e" '
            'status="uploaded" width="232px"></image-component>'
        )
        out = process_email_html(html)
        assert "image-component" not in out
        assert "[Image]" in out
        assert "See screenshot" in out

    def test_rejects_none_string(self):
        assert process_email_html("None") is None
        assert process_email_html(None) is None

    def test_process_html_content_filters_list(self):
        result = process_html_content(
            [
                "<p><strong>UPDATE</strong></p>",
                "None",
                None,
                "",
            ]
        )
        assert result == ["<p><strong>UPDATE</strong></p>"]
