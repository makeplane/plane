from unittest.mock import MagicMock, patch

import pytest
import requests

from plane.bgtasks.service_gateway_webhook_task import (
    _sync_deleted_event,
    _trigger_event_send,
    _trigger_event_send_for_ids,
)


@pytest.mark.unit
class TestServiceGatewayWebhookTask:
    def test_trigger_event_send_uses_derived_send_url(self):
        session = MagicMock()

        with patch("plane.bgtasks.service_gateway_webhook_task._send_request") as mock_send_request:
            _trigger_event_send(
                session=session,
                event_api="http://drake.in:1437/api/event",
                event_send_api="",
                service_gateway_event_id=321,
                issue_id="issue-123",
                timeout=30,
            )

        mock_send_request.assert_called_once_with(
            session=session,
            method="POST",
            url="http://drake.in:1437/api/event/send",
            payload={
                "table": "event",
                "criteria": [
                    {"field": "id", "type": 0, "value": 321},
                ],
            },
            timeout=30,
        )

    def test_trigger_event_send_uses_explicit_send_url(self):
        session = MagicMock()

        with patch("plane.bgtasks.service_gateway_webhook_task._send_request") as mock_send_request:
            _trigger_event_send(
                session=session,
                event_api="http://drake.in:1437/api/event",
                event_send_api="http://drake.in:1437/api/event/send-now",
                service_gateway_event_id=654,
                issue_id="issue-456",
                timeout=45,
            )

        mock_send_request.assert_called_once_with(
            session=session,
            method="POST",
            url="http://drake.in:1437/api/event/send-now",
            payload={
                "table": "event",
                "criteria": [
                    {"field": "id", "type": 0, "value": 654},
                ],
            },
            timeout=45,
        )

    def test_trigger_event_send_swallow_errors(self):
        session = MagicMock()

        with patch(
            "plane.bgtasks.service_gateway_webhook_task._send_request",
            side_effect=requests.HTTPError("boom"),
        ):
            _trigger_event_send(
                session=session,
                event_api="http://drake.in:1437/api/event",
                event_send_api="",
                service_gateway_event_id=999,
                issue_id="issue-789",
                timeout=30,
            )

    def test_trigger_event_send_for_ids_calls_each_unique_event_id(self):
        session = MagicMock()

        with patch("plane.bgtasks.service_gateway_webhook_task._trigger_event_send") as mock_trigger_event_send:
            _trigger_event_send_for_ids(
                session=session,
                event_api="http://drake.in:1437/api/event",
                event_send_api="",
                service_gateway_event_ids=[321, None, 0, 321, 654],
                issue_id="issue-999",
                timeout=30,
            )

        assert mock_trigger_event_send.call_count == 2
        mock_trigger_event_send.assert_any_call(
            session=session,
            event_api="http://drake.in:1437/api/event",
            event_send_api="",
            service_gateway_event_id=321,
            issue_id="issue-999",
            timeout=30,
        )
        mock_trigger_event_send.assert_any_call(
            session=session,
            event_api="http://drake.in:1437/api/event",
            event_send_api="",
            service_gateway_event_id=654,
            issue_id="issue-999",
            timeout=30,
        )

    def test_sync_deleted_event_uses_sg_event_id_without_mapping(self):
        session = MagicMock()

        with patch(
            "plane.bgtasks.service_gateway_webhook_task._resolve_existing_gateway_rows",
            return_value=[],
        ), patch(
            "plane.bgtasks.service_gateway_webhook_task._trigger_event_send_for_ids"
        ) as mock_trigger_event_send_for_ids, patch(
            "plane.bgtasks.service_gateway_webhook_task._send_request"
        ) as mock_send_request, patch(
            "plane.bgtasks.service_gateway_webhook_task._set_issue_sg_event_id"
        ) as mock_set_issue_sg_event_id:
            _sync_deleted_event(
                session=session,
                event_api="http://drake.in:1437/api/event",
                event_send_api="http://drake.in:1437/api/event/send",
                scheduled_event_api="",
                timeout=30,
                event_data={"id": "issue-111", "sg_event_id": 777},
            )

        mock_trigger_event_send_for_ids.assert_called_once_with(
            session=session,
            event_api="http://drake.in:1437/api/event",
            event_send_api="http://drake.in:1437/api/event/send",
            service_gateway_event_ids=[777],
            issue_id="issue-111",
            timeout=30,
        )
        mock_send_request.assert_called_once_with(
            session=session,
            method="DELETE",
            url="http://drake.in:1437/api/event",
            payload={
                "table": "event",
                "criteria": [
                    {"field": "id", "type": 0, "value": 777},
                ],
            },
            timeout=30,
        )
        mock_set_issue_sg_event_id.assert_called_once_with({"id": "issue-111", "sg_event_id": 777}, None)
