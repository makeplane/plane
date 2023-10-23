import requests
import uuid
import hashlib

# Django imports
from django.conf import settings

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception

from plane.db.models import Webhook, WebhookLog

@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=60,
    retry_jitter=True,
    retry_kwargs={"max_retries": 5},
)
def webhook_task(self, webhook, slug, event, response, action):
    try:
        webhook = Webhook.objects.get(id=webhook, workspace__slug=slug)
        # Your secret key
        secret_key = webhook.secret_key

        # Data you want to sign
        data = response

        # Concatenate the data and the secret key
        message = data + secret_key

        # Create a SHA-256 hash of the message
        sha256 = hashlib.sha256()
        sha256.update(message.encode('utf-8'))
        signature = sha256.hexdigest()

        webhook_url = webhook.url
        webhook_logs = []

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Autopilot",
            "X-Plane-Delivery": str(uuid.uuid4()),
            "X-Plane-Event": event,
            "X-Plane-Signature": signature,
        }
        payload = {
            "event": event,
            "action": action,
            "webhook_id": str(webhook.id),
            "workspace_id": str(webhook.workspace_id),
            "data": response,
        }
        try:
            webhook_response = requests.post(
                webhook_url,
                headers=headers,
                json=payload,
            )

            # Record the response in the webhook log
            webhook_logs.append(
                WebhookLog(
                    workspace_id=str(webhook.workspace_id),
                    webhook_id=str(webhook.id),
                    event_type=str(event),
                    request_method=str(action),
                    request_headers=str(headers),
                    request_body=str(payload),
                    response_status=str(webhook_response.status_code),
                    response_headers=str(webhook_response.headers),
                    response_body=str(webhook_response.text),  # Use .text to get response content
                    retry_count=str(self.request.retries),
                )
            )
            WebhookLog.objects.bulk_create(webhook_logs, batch_size=10)

        except Exception as e:
            # Record the exception in the webhook log
            webhook_logs.append(
                WebhookLog(
                    workspace_id=str(webhook.workspace_id),
                    webhook_id=str(webhook.id),
                    event_type=str(event),
                    request_method=str(action),
                    request_headers=str(headers),
                    request_body=str(payload),
                    response_status=500,  # You can customize this based on the error
                    response_headers="",
                    response_body=str(e),  # Capture the exception message
                    retry_count=self.request.retries,
                )
            )
            WebhookLog.objects.bulk_create(webhook_logs, batch_size=10)

    except Exception as e:
        if self.request.retries >= self.max_retries:
            Webhook.objects.filter(pk=webhook.id).update(is_active=False)
        return


@shared_task()
def send_webhook(event, response, action, slug):
    try:
        webhooks = Webhook.objects.filter(workspace__slug=slug, is_active=True)

        if event == "Project":
            webhooks = webhooks.filter(project=True)

        if event == "Issue":
            webhooks = webhooks.filter(issue=True)

        if event == "Module":
            webhooks = webhooks.filter(module=True)

        if event == "Cycle":
            webhooks = webhooks.filter(cycle=True)

        if event == "IssueComment":
            webhooks = webhooks.filter(issue_comment=True)

        for webhook in webhooks:
            webhook_task.delay(webhook.id, slug, event, response, action)

    except Exception as e:
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return
