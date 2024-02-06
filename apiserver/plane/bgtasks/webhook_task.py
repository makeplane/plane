import requests
import uuid
import hashlib
import json
import hmac

# Django imports
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception

from plane.db.models import (
    Webhook,
    WebhookLog,
    Project,
    Issue,
    Cycle,
    Module,
    ModuleIssue,
    CycleIssue,
    IssueComment,
    User,
)
from plane.api.serializers import (
    ProjectSerializer,
    CycleSerializer,
    ModuleSerializer,
    CycleIssueSerializer,
    ModuleIssueSerializer,
    IssueCommentSerializer,
    IssueExpandSerializer,
)

# Module imports
from plane.license.utils.instance_value import get_email_configuration

SERIALIZER_MAPPER = {
    "project": ProjectSerializer,
    "issue": IssueExpandSerializer,
    "cycle": CycleSerializer,
    "module": ModuleSerializer,
    "cycle_issue": CycleIssueSerializer,
    "module_issue": ModuleIssueSerializer,
    "issue_comment": IssueCommentSerializer,
}

MODEL_MAPPER = {
    "project": Project,
    "issue": Issue,
    "cycle": Cycle,
    "module": Module,
    "cycle_issue": CycleIssue,
    "module_issue": ModuleIssue,
    "issue_comment": IssueComment,
}


def get_model_data(event, event_id, many=False):
    model = MODEL_MAPPER.get(event)
    if many:
        queryset = model.objects.filter(pk__in=event_id)
    else:
        queryset = model.objects.get(pk=event_id)
    serializer = SERIALIZER_MAPPER.get(event)
    return serializer(queryset, many=many).data


@shared_task(
    bind=True,
    autoretry_for=(requests.RequestException,),
    retry_backoff=600,
    max_retries=5,
    retry_jitter=True,
)
def webhook_task(self, webhook, slug, event, event_data, action, current_site):
    try:
        webhook = Webhook.objects.get(id=webhook, workspace__slug=slug)

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Autopilot",
            "X-Plane-Delivery": str(uuid.uuid4()),
            "X-Plane-Event": event,
        }

        # # Your secret key
        event_data = (
            json.loads(json.dumps(event_data, cls=DjangoJSONEncoder))
            if event_data is not None
            else None
        )

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

        # Use HMAC for generating signature
        if webhook.secret_key:
            hmac_signature = hmac.new(
                webhook.secret_key.encode("utf-8"),
                json.dumps(payload).encode("utf-8"),
                hashlib.sha256,
            )
            signature = hmac_signature.hexdigest()
            headers["X-Plane-Signature"] = signature

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
            if webhook:
                # send email for the deactivation of the webhook
                send_webhook_deactivation_email(
                    webhook_id=webhook.id,
                    receiver_id=webhook.created_by_id,
                    reason=str(e),
                    current_site=current_site,
                )
            return
        raise requests.RequestException()

    except Exception as e:
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return


@shared_task()
def send_webhook(event, payload, kw, action, slug, bulk, current_site):
    try:
        webhooks = Webhook.objects.filter(workspace__slug=slug, is_active=True)

        if event == "project":
            webhooks = webhooks.filter(project=True)

        if event == "issue":
            webhooks = webhooks.filter(issue=True)

        if event == "module" or event == "module_issue":
            webhooks = webhooks.filter(module=True)

        if event == "cycle" or event == "cycle_issue":
            webhooks = webhooks.filter(cycle=True)

        if event == "issue_comment":
            webhooks = webhooks.filter(issue_comment=True)

        if webhooks:
            if action in ["POST", "PATCH"]:
                if bulk and event in ["cycle_issue", "module_issue"]:
                    event_data = IssueExpandSerializer(
                        Issue.objects.filter(
                            pk__in=[
                                str(event.get("issue")) for event in payload
                            ]
                        ).prefetch_related("issue_cycle", "issue_module"),
                        many=True,
                    ).data
                    event = "issue"
                    action = "PATCH"
                else:
                    event_data = [
                        get_model_data(
                            event=event,
                            event_id=payload.get("id")
                            if isinstance(payload, dict)
                            else None,
                            many=False,
                        )
                    ]

            if action == "DELETE":
                event_data = [{"id": kw.get("pk")}]

            for webhook in webhooks:
                for data in event_data:
                    webhook_task.delay(
                        webhook=webhook.id,
                        slug=slug,
                        event=event,
                        event_data=data,
                        action=action,
                        current_site=current_site,
                    )

    except Exception as e:
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return


@shared_task
def send_webhook_deactivation_email(webhook_id, receiver_id, current_site, reason):
    # Get email configurations
    (
        EMAIL_HOST,
        EMAIL_HOST_USER,
        EMAIL_HOST_PASSWORD,
        EMAIL_PORT,
        EMAIL_USE_TLS,
        EMAIL_FROM,
    ) = get_email_configuration()

    receiver = User.objects.get(pk=receiver_id)
    webhook = Webhook.objects.get(pk=webhook_id) 
    subject="Webhook Deactivated"
    message=f"Webhook {webhook.url} has been deactivated due to failed requests."

    # Send the mail
    context = {
        "email": receiver.email,
        "message": message,
        "webhook_url":f"{current_site}/{str(webhook.workspace.slug)}/settings/webhooks/{str(webhook.id)}",
    }
    html_content = render_to_string(
        "emails/notifications/webhook-deactivate.html", context
    )
    text_content = strip_tags(html_content)

    try:
        connection = get_connection(
            host=EMAIL_HOST,
            port=int(EMAIL_PORT),
            username=EMAIL_HOST_USER,
            password=EMAIL_HOST_PASSWORD,
            use_tls=EMAIL_USE_TLS == "1",
        )

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=EMAIL_FROM,
            to=[receiver.email],
            connection=connection,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()

        return
    except Exception as e:
        print(e)
        return
