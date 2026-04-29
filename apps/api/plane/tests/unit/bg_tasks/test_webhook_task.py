from unittest.mock import MagicMock, patch

import pytest

from plane.bgtasks.webhook_task import webhook_activity


@pytest.mark.unit
class TestWebhookTask:
    def test_webhook_activity_uses_explicit_deleted_event_data(self):
        webhook_queryset = MagicMock()
        webhook_queryset.filter.return_value = webhook_queryset
        webhook_queryset.__iter__.return_value = iter([])

        with patch("plane.bgtasks.webhook_task.Webhook.objects.filter", return_value=webhook_queryset), patch(
            "plane.bgtasks.webhook_task.get_model_data",
            return_value={"id": "user-123"},
        ), patch("plane.bgtasks.webhook_task.service_gateway_event_sync") as mock_service_gateway_event_sync:
            webhook_activity(
                event="issue",
                verb="deleted",
                field=None,
                old_value=None,
                new_value=None,
                actor_id="user-123",
                slug="workspace-1",
                current_site="http://localhost:3000",
                event_id="issue-123",
                old_identifier=None,
                new_identifier=None,
                event_data={"id": "issue-123", "sg_event_id": 321},
            )

        mock_service_gateway_event_sync.assert_called_once_with(
            event="issue",
            verb="deleted",
            event_data={"id": "issue-123", "sg_event_id": 321},
        )

    def test_webhook_activity_can_skip_service_gateway(self):
        webhook_queryset = MagicMock()
        webhook_queryset.filter.return_value = webhook_queryset
        webhook_queryset.__iter__.return_value = iter([])

        with patch("plane.bgtasks.webhook_task.Webhook.objects.filter", return_value=webhook_queryset), patch(
            "plane.bgtasks.webhook_task.get_model_data",
            return_value={"id": "user-123"},
        ), patch("plane.bgtasks.webhook_task.service_gateway_event_sync") as mock_service_gateway_event_sync:
            webhook_activity(
                event="issue",
                verb="deleted",
                field=None,
                old_value=None,
                new_value=None,
                actor_id="user-123",
                slug="workspace-1",
                current_site="http://localhost:3000",
                event_id="issue-123",
                old_identifier=None,
                new_identifier=None,
                event_data={"id": "issue-123", "sg_event_id": 321},
                skip_service_gateway=True,
            )

        mock_service_gateway_event_sync.assert_not_called()
