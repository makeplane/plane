# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for webhook model_activity background task.

Verifies that model_activity correctly detects changes across:
1. Relation fields where API requests use noun keys ('state', 'assignees', 'labels', 'parent')
   and serialized instances use ID keys ('state_id', 'assignee_ids', 'label_ids', 'parent_id')
   or vice-versa.
2. List relations with unordered/reordered items (preventing false-positive updates).
3. Clearing relations (empty list for assignees/labels, None for parent/state).
4. Mixed UUID string and uuid.UUID types.
5. Non-relation scalar fields ('name', 'priority', 'description').
6. Duplicate representations in the same request payload.
7. Initial creation events (current_instance is None).
"""

import json
import uuid
from unittest.mock import patch

import pytest

from plane.bgtasks.webhook_task import model_activity

pytestmark = pytest.mark.unit


MODEL_NAME = "issue"
MODEL_ID = str(uuid.uuid4())
ACTOR_ID = str(uuid.uuid4())
SLUG = "test-workspace"
ORIGIN = "https://app.plane.so"


@pytest.fixture
def mock_webhook_delay():
    with patch("plane.bgtasks.webhook_task.webhook_activity.delay") as mock_delay:
        yield mock_delay


class TestModelActivityCreation:
    """Verifies behavior when current_instance is None (creation event)."""

    def test_creation_event_triggers_created_webhook(self, mock_webhook_delay):
        requested_data = {"name": "New Issue", "priority": "high"}
        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=None,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="created",
            field=None,
            old_value=None,
            new_value=None,
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )


class TestModelActivityStateRelation:
    """Verifies state relation mapping and change detection."""

    def test_state_change_api_key_to_instance_id_key(self, mock_webhook_delay):
        old_state_id = str(uuid.uuid4())
        new_state_id = str(uuid.uuid4())

        current_instance = json.dumps({"state_id": old_state_id, "name": "Test Issue"})
        requested_data = {"state": new_state_id}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="state",
            old_value=old_state_id,
            new_value=new_state_id,
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_state_change_same_value_no_webhook(self, mock_webhook_delay):
        state_id = str(uuid.uuid4())
        current_instance = json.dumps({"state_id": state_id})
        requested_data = {"state": state_id}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_not_called()

    def test_state_id_in_request_and_state_id_in_instance(self, mock_webhook_delay):
        old_state_id = str(uuid.uuid4())
        new_state_id = str(uuid.uuid4())
        current_instance = json.dumps({"state_id": old_state_id})
        requested_data = {"state_id": new_state_id}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="state",
            old_value=old_state_id,
            new_value=new_state_id,
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_state_id_in_request_and_state_in_instance(self, mock_webhook_delay):
        """Bidirectional check: instance has 'state' (e.g. public API serializer), request has 'state_id'."""
        old_state_id = str(uuid.uuid4())
        new_state_id = str(uuid.uuid4())
        current_instance = json.dumps({"state": old_state_id})
        requested_data = {"state_id": new_state_id}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="state",
            old_value=old_state_id,
            new_value=new_state_id,
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )


class TestModelActivityAssigneesRelation:
    """Verifies assignees list relation mapping, set-based comparison, and clearing."""

    def test_assignee_addition_triggers_webhook(self, mock_webhook_delay):
        u1 = str(uuid.uuid4())
        u2 = str(uuid.uuid4())

        current_instance = json.dumps({"assignee_ids": [u1]})
        requested_data = {"assignees": [u1, u2]}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="assignees",
            old_value=[u1],
            new_value=[u1, u2],
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_assignee_removal_triggers_webhook(self, mock_webhook_delay):
        u1 = str(uuid.uuid4())
        u2 = str(uuid.uuid4())

        current_instance = json.dumps({"assignee_ids": [u1, u2]})
        requested_data = {"assignees": [u1]}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="assignees",
            old_value=[u1, u2],
            new_value=[u1],
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_clearing_assignees_triggers_webhook(self, mock_webhook_delay):
        """Clearing assignees (passing empty list) must trigger webhook."""
        u1 = str(uuid.uuid4())
        current_instance = json.dumps({"assignee_ids": [u1]})
        requested_data = {"assignees": []}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="assignees",
            old_value=[u1],
            new_value=[],
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_assignees_unchanged_does_not_trigger_webhook(self, mock_webhook_delay):
        """Identical assignees list must not trigger webhook."""
        u1 = str(uuid.uuid4())
        u2 = str(uuid.uuid4())
        current_instance = json.dumps({"assignee_ids": [u1, u2]})
        requested_data = {"assignees": [u1, u2]}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_not_called()

    def test_assignees_reordered_does_not_trigger_webhook(self, mock_webhook_delay):
        u1 = str(uuid.uuid4())
        u2 = str(uuid.uuid4())

        current_instance = json.dumps({"assignee_ids": [u1, u2]})
        requested_data = {"assignees": [u2, u1]}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_not_called()

    def test_assignees_empty_to_nonempty(self, mock_webhook_delay):
        u1 = str(uuid.uuid4())
        current_instance = json.dumps({"assignee_ids": []})
        requested_data = {"assignees": [u1]}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="assignees",
            old_value=[],
            new_value=[u1],
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_assignees_both_empty_does_not_trigger_webhook(self, mock_webhook_delay):
        current_instance = json.dumps({"assignee_ids": []})
        requested_data = {"assignees": []}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_not_called()


class TestModelActivityLabelsRelation:
    """Verifies labels list relation mapping, set-based comparison, and clearing."""

    def test_label_addition_triggers_webhook(self, mock_webhook_delay):
        l1 = str(uuid.uuid4())
        l2 = str(uuid.uuid4())

        current_instance = json.dumps({"label_ids": [l1]})
        requested_data = {"labels": [l1, l2]}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="labels",
            old_value=[l1],
            new_value=[l1, l2],
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_label_removal_triggers_webhook(self, mock_webhook_delay):
        l1 = str(uuid.uuid4())
        l2 = str(uuid.uuid4())

        current_instance = json.dumps({"label_ids": [l1, l2]})
        requested_data = {"labels": [l1]}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="labels",
            old_value=[l1, l2],
            new_value=[l1],
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_clearing_labels_triggers_webhook(self, mock_webhook_delay):
        """Clearing labels (passing empty list) must trigger webhook."""
        l1 = str(uuid.uuid4())
        current_instance = json.dumps({"label_ids": [l1]})
        requested_data = {"labels": []}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="labels",
            old_value=[l1],
            new_value=[],
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_labels_unchanged_does_not_trigger_webhook(self, mock_webhook_delay):
        """Identical labels list must not trigger webhook."""
        l1 = str(uuid.uuid4())
        current_instance = json.dumps({"label_ids": [l1]})
        requested_data = {"labels": [l1]}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_not_called()

    def test_labels_bidirectional_instance_has_labels_key(self, mock_webhook_delay):
        l1 = str(uuid.uuid4())
        l2 = str(uuid.uuid4())

        current_instance = json.dumps({"labels": [l1]})
        requested_data = {"label_ids": [l1, l2]}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="labels",
            old_value=[l1],
            new_value=[l1, l2],
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_labels_reordered_does_not_trigger_webhook(self, mock_webhook_delay):
        l1 = str(uuid.uuid4())
        l2 = str(uuid.uuid4())
        l3 = str(uuid.uuid4())

        current_instance = json.dumps({"label_ids": [l1, l2, l3]})
        requested_data = {"labels": [l3, l1, l2]}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_not_called()

    def test_labels_both_empty_does_not_trigger_webhook(self, mock_webhook_delay):
        current_instance = json.dumps({"label_ids": []})
        requested_data = {"labels": []}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_not_called()


class TestModelActivityParentRelation:
    """Verifies parent relation mapping, unsetting (None), setting from None, and no-op comparisons."""

    def test_parent_change_triggers_webhook(self, mock_webhook_delay):
        p1 = str(uuid.uuid4())
        p2 = str(uuid.uuid4())

        current_instance = json.dumps({"parent_id": p1})
        requested_data = {"parent": p2}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="parent",
            old_value=p1,
            new_value=p2,
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_unsetting_parent_triggers_webhook(self, mock_webhook_delay):
        """Unsetting parent (passing None) must trigger webhook with new_value=None."""
        p1 = str(uuid.uuid4())
        current_instance = json.dumps({"parent_id": p1})
        requested_data = {"parent": None}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="parent",
            old_value=p1,
            new_value=None,
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_setting_parent_from_none_triggers_webhook(self, mock_webhook_delay):
        """Setting parent on an issue with no parent must trigger webhook with old_value=None."""
        p1 = str(uuid.uuid4())
        current_instance = json.dumps({"parent_id": None})
        requested_data = {"parent": p1}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="parent",
            old_value=None,
            new_value=p1,
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_parent_unchanged_does_not_trigger_webhook(self, mock_webhook_delay):
        """Unchanged parent must not trigger webhook."""
        p1 = str(uuid.uuid4())
        current_instance = json.dumps({"parent_id": p1})
        requested_data = {"parent": p1}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_not_called()

    def test_parent_both_none_does_not_trigger_webhook(self, mock_webhook_delay):
        """When both current and requested parent are None, no webhook must fire."""
        current_instance = json.dumps({"parent_id": None})
        requested_data = {"parent": None}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_not_called()


class TestModelActivityNormalizationAndDeduplication:
    """Verifies UUID normalization, casing, object vs string, and deduplication."""

    def test_uuid_casing_and_object_normalization(self, mock_webhook_delay):
        uid = uuid.uuid4()
        current_instance = json.dumps({"state_id": str(uid).upper()})
        requested_data = {"state": str(uid).lower()}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_not_called()

    def test_dict_with_id_normalization(self, mock_webhook_delay):
        uid = str(uuid.uuid4())
        current_instance = json.dumps({"state_id": uid})
        # Client passes nested dict e.g. {"id": uid}
        requested_data = {"state": {"id": uid}}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_not_called()

    def test_duplicate_key_and_alias_in_requested_data_only_fires_once(self, mock_webhook_delay):
        old_state_id = str(uuid.uuid4())
        new_state_id = str(uuid.uuid4())

        current_instance = json.dumps({"state_id": old_state_id})
        # Both 'state' and 'state_id' present in requested_data
        requested_data = {"state": new_state_id, "state_id": new_state_id}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        # Should only call delay once for state
        assert mock_webhook_delay.call_count == 1
        call_kwargs = mock_webhook_delay.call_args.kwargs
        assert call_kwargs["field"] == "state"


class TestModelActivityScalarFields:
    """Verifies standard scalar fields (name, priority, description) behave unchanged."""

    def test_scalar_field_change(self, mock_webhook_delay):
        current_instance = json.dumps({"name": "Old Title", "priority": "low"})
        requested_data = {"name": "New Title", "priority": "low"}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_called_once_with(
            event=MODEL_NAME,
            verb="updated",
            field="name",
            old_value="Old Title",
            new_value="New Title",
            actor_id=ACTOR_ID,
            slug=SLUG,
            current_site=ORIGIN,
            event_id=MODEL_ID,
            old_identifier=None,
            new_identifier=None,
        )

    def test_unrelated_requested_key_not_in_instance_ignored(self, mock_webhook_delay):
        current_instance = json.dumps({"name": "Same Title"})
        requested_data = {"non_existent_field": "some_value"}

        model_activity(
            model_name=MODEL_NAME,
            model_id=MODEL_ID,
            requested_data=requested_data,
            current_instance=current_instance,
            actor_id=ACTOR_ID,
            slug=SLUG,
            origin=ORIGIN,
        )

        mock_webhook_delay.assert_not_called()
