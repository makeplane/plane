import requests
import uuid
import hashlib
import json

# Django imports
from django.conf import settings

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception

from plane.db.models import Webhook, WebhookLog


@shared_task(
    bind=True,
    autoretry_for=(requests.RequestException,),
    retry_backoff=600,
    max_retries=5,
    retry_jitter=True,
)
def webhook_task(self, webhook, slug, event, event_data, action):
    try:
        webhook = Webhook.objects.get(id=webhook, workspace__slug=slug)

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Autopilot",
            "X-Plane-Delivery": str(uuid.uuid4()),
            "X-Plane-Event": event,
        }

        # Your secret key
        if webhook.secret_key:
            # Concatenate the data and the secret key
            message = event_data + webhook.secret_key

            # Create a SHA-256 hash of the message
            sha256 = hashlib.sha256()
            sha256.update(message.encode("utf-8"))
            signature = sha256.hexdigest()
            headers["X-Plane-Signature"] = signature

        event_data = json.loads(event_data) if event_data is not None else None

        action = {
            "POST": "create",
            "PATCH": "update",
            "PUT": "update",
            "DELETE": "delete",
        }.get(action, action)

        payload = {
            "event": event,
            "action": action,
            "webhook_id": str(webhook.id),
            "workspace_id": str(webhook.workspace_id),
            "data": event_data,
        }

        # Send the webhook event
        response = requests.post(
            webhook.url,
            headers=headers,
            json=payload,
            timeout=30,
        )

        # Log the webhook request
        WebhookLog.objects.create(
            workspace_id=str(webhook.workspace_id),
            webhook_id=str(webhook.id),
            event_type=str(event),
            request_method=str(action),
            request_headers=str(headers),
            request_body=str(payload),
            response_status=str(response.status_code),
            response_headers=str(response.headers),
            response_body=str(response.text),
            retry_count=str(self.request.retries),
        )

    except requests.RequestException as e:
        # Log the failed webhook request
        WebhookLog.objects.create(
            workspace_id=str(webhook.workspace_id),
            webhook_id=str(webhook.id),
            event_type=str(event),
            request_method=str(action),
            request_headers=str(headers),
            request_body=str(payload),
            response_status=500,
            response_headers="",
            response_body=str(e),
            retry_count=str(self.request.retries),
        )

        # Retry logic
        if self.request.retries >= self.max_retries:
            Webhook.objects.filter(pk=webhook.id).update(is_active=False)
            return
        raise requests.RequestException()

    except Exception as e:
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return


@shared_task()
def send_webhook(event, event_data, action, slug):
    try:
        webhooks = Webhook.objects.filter(workspace__slug=slug, is_active=True)

        if event == "project":
            webhooks = webhooks.filter(project=True)

        if event == "issue":
            webhooks = webhooks.filter(issue=True)

        if event == "module":
            webhooks = webhooks.filter(module=True)

        if event == "cycle":
            webhooks = webhooks.filter(cycle=True)

        if event == "issue-comment":
            webhooks = webhooks.filter(issue_comment=True)

        for webhook in webhooks:
            webhook_task.delay(webhook.id, slug, event, event_data, action)

    except Exception as e:
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return
