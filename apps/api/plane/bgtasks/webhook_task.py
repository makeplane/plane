import hashlib
import hmac
import json
import logging
import uuid

import requests
from typing import Any, Dict, List, Optional, Union

# Third party imports
from celery import shared_task

# Django imports
from django.conf import settings
from django.db.models import Prefetch
from django.core.mail import EmailMultiAlternatives, get_connection
from django.core.serializers.json import DjangoJSONEncoder
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.exceptions import ObjectDoesNotExist

# Module imports
from plane.api.serializers import (
    CycleIssueSerializer,
    CycleSerializer,
    IssueCommentSerializer,
    IssueExpandSerializer,
    ModuleIssueSerializer,
    ModuleSerializer,
    ProjectSerializer,
    UserLiteSerializer,
    IntakeIssueSerializer,
)
from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    IssueComment,
    Module,
    ModuleIssue,
    Project,
    User,
    Webhook,
    WebhookLog,
    IntakeIssue,
    IssueLabel,
    IssueAssignee,
)
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.exception_logger import log_exception

SERIALIZER_MAPPER = {
    "project": ProjectSerializer,
    "issue": IssueExpandSerializer,
    "cycle": CycleSerializer,
    "module": ModuleSerializer,
    "cycle_issue": CycleIssueSerializer,
    "module_issue": ModuleIssueSerializer,
    "issue_comment": IssueCommentSerializer,
    "user": UserLiteSerializer,
    "intake_issue": IntakeIssueSerializer,
}

MODEL_MAPPER = {
    "project": Project,
    "issue": Issue,
    "cycle": Cycle,
    "module": Module,
    "cycle_issue": CycleIssue,
    "module_issue": ModuleIssue,
    "issue_comment": IssueComment,
    "user": User,
    "intake_issue": IntakeIssue,
}


logger = logging.getLogger("plane.worker")


def get_issue_prefetches():
    return [
        Prefetch("label_issue", queryset=IssueLabel.objects.select_related("label")),
        Prefetch(
            "issue_assignee", queryset=IssueAssignee.objects.select_related("assignee")
        ),
    ]


def get_model_data(
    event: str, event_id: Union[str, List[str]], many: bool = False
) -> Dict[str, Any]:
    """
    Retrieve and serialize model data based on the event type.

    Args:
        event (str): The type of event/model to retrieve data for
        event_id (Union[str, List[str]]): The ID or list of IDs of the model instance(s)
        many (bool): Whether to retrieve multiple instances

    Returns:
        Dict[str, Any]: Serialized model data

    Raises:
        ValueError: If serializer is not found for the event
        ObjectDoesNotExist: If model instance is not found
    """
    model = MODEL_MAPPER.get(event)
    if model is None:
        raise ValueError(f"Model not found for event: {event}")

    try:
        if many:
            queryset = model.objects.filter(pk__in=event_id)
        else:
            queryset = model.objects.get(pk=event_id)

        serializer = SERIALIZER_MAPPER.get(event)

        if serializer is None:
            raise ValueError(f"Serializer not found for event: {event}")

        issue_prefetches = get_issue_prefetches()
        if event == "issue":
            if many:
                queryset = queryset.prefetch_related(*issue_prefetches)
            else:
                issue_id = queryset.id
                queryset = (
                    model.objects.filter(pk=issue_id)
                    .prefetch_related(*issue_prefetches)
                    .first()
                )

            return serializer(
                queryset, many=many, context={"expand": ["labels", "assignees"]}
            ).data
        else:
            return serializer(queryset, many=many).data
    except ObjectDoesNotExist:
        raise ObjectDoesNotExist(f"No {event} found with id: {event_id}")


@shared_task
def send_webhook_deactivation_email(
    webhook_id: str, receiver_id: str, current_site: str, reason: str
) -> None:
    """
    Send an email notification when a webhook is deactivated.

    Args:
        webhook_id (str): ID of the deactivated webhook
        receiver_id (str): ID of the user to receive the notification
        current_site (str): Current site URL
        reason (str): Reason for webhook deactivation
    """
    try:
        (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_USE_SSL,
            EMAIL_FROM,
        ) = get_email_configuration()

        receiver = User.objects.get(pk=receiver_id)
        webhook = Webhook.objects.get(pk=webhook_id)

        # Get the webhook payload
        subject = "Webhook Deactivated"
        message = f"Webhook {webhook.url} has been deactivated due to failed requests."

        # Send the mail
        context = {
            "email": receiver.email,
            "message": message,
            "webhook_url": f"{current_site}/{str(webhook.workspace.slug)}/settings/webhooks/{str(webhook.id)}",
        }
        html_content = render_to_string(
            "emails/notifications/webhook-deactivate.html", context
        )
        text_content = strip_tags(html_content)

        # Set the email connection
        connection = get_connection(
            host=EMAIL_HOST,
            port=int(EMAIL_PORT),
            username=EMAIL_HOST_USER,
            password=EMAIL_HOST_PASSWORD,
            use_tls=EMAIL_USE_TLS == "1",
            use_ssl=EMAIL_USE_SSL == "1",
        )

        # Create the email message
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=EMAIL_FROM,
            to=[receiver.email],
            connection=connection,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info("Email sent successfully.")
    except Exception as e:
        log_exception(e)
        logger.error(f"Failed to send email: {e}")


@shared_task(
    bind=True,
    autoretry_for=(requests.RequestException,),
    retry_backoff=600,
    max_retries=5,
    retry_jitter=True,
)
def webhook_send_task(
    self,
    webhook_id: str,
    slug: str,
    event: str,
    event_data: Optional[Dict[str, Any]],
    action: str,
    current_site: str,
    activity: Optional[Dict[str, Any]],
) -> None:
    """
    Send webhook notifications to configured endpoints.

    Args:
        webhook (str): Webhook ID
        slug (str): Workspace slug
        event (str): Event type
        event_data (Optional[Dict[str, Any]]): Event data to be sent
        action (str): HTTP method/action
        current_site (str): Current site URL
        activity (Optional[Dict[str, Any]]): Activity data
    """
    try:
        webhook = Webhook.objects.get(id=webhook_id, workspace__slug=slug)

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

        activity = (
            json.loads(json.dumps(activity, cls=DjangoJSONEncoder))
            if activity is not None
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
            "activity": activity,
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
    except Exception as e:
        log_exception(e)
        logger.error(f"Failed to send webhook: {e}")
        return

    try:
        # Send the webhook event
        response = requests.post(webhook.url, headers=headers, json=payload, timeout=30)

        # Log the webhook request
        WebhookLog.objects.create(
            workspace_id=str(webhook.workspace_id),
            webhook=str(webhook.id),
            event_type=str(event),
            request_method=str(action),
            request_headers=str(headers),
            request_body=str(payload),
            response_status=str(response.status_code),
            response_headers=str(response.headers),
            response_body=str(response.text),
            retry_count=str(self.request.retries),
        )
        logger.info(f"Webhook {webhook.id} sent successfully")
    except requests.RequestException as e:
        # Log the failed webhook request
        WebhookLog.objects.create(
            workspace_id=str(webhook.workspace_id),
            webhook=str(webhook.id),
            event_type=str(event),
            request_method=str(action),
            request_headers=str(headers),
            request_body=str(payload),
            response_status=500,
            response_headers="",
            response_body=str(e),
            retry_count=str(self.request.retries),
        )
        logger.error(f"Webhook {webhook.id} failed with error: {e}")
        # Retry logic
        if self.request.retries >= self.max_retries:
            Webhook.objects.filter(pk=webhook.id).update(is_active=False)
            if webhook:
                # send email for the deactivation of the webhook
                send_webhook_deactivation_email.delay(
                    webhook_id=webhook.id,
                    receiver_id=webhook.created_by_id,
                    reason=str(e),
                    current_site=current_site,
                )
            return
        raise requests.RequestException()

    except Exception as e:
        log_exception(e)
        return


@shared_task
def webhook_activity(
    event: str,
    verb: str,
    field: Optional[str],
    old_value: Any,
    new_value: Any,
    actor_id: str | uuid.UUID,
    slug: str,
    current_site: str,
    event_id: str | uuid.UUID,
    old_identifier: Optional[str],
    new_identifier: Optional[str],
) -> None:
    """
    Process and send webhook notifications for various activities in the system.

    This task filters relevant webhooks based on the event type and sends notifications
    to all active webhooks for the workspace.

    Args:
        event (str): Type of event (project, issue, module, cycle, issue_comment)
        verb (str): Action performed (created, updated, deleted)
        field (Optional[str]): Name of the field that was changed
        old_value (Any): Previous value of the field
        new_value (Any): New value of the field
        actor_id (str | uuid.UUID): ID of the user who performed the action
        slug (str): Workspace slug
        current_site (str): Current site URL
        event_id (str | uuid.UUID): ID of the event object
        old_identifier (Optional[str]): Previous identifier if any
        new_identifier (Optional[str]): New identifier if any

    Returns:
        None

    Note:
        The function silently returns on ObjectDoesNotExist exceptions to handle
        race conditions where objects might have been deleted.
    """
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

        for webhook in webhooks:
            webhook_send_task.delay(
                webhook_id=webhook.id,
                slug=slug,
                event=event,
                event_data=(
                    {"id": event_id}
                    if verb == "deleted"
                    else get_model_data(event=event, event_id=event_id)
                ),
                action=verb,
                current_site=current_site,
                activity={
                    "field": field,
                    "new_value": new_value,
                    "old_value": old_value,
                    "actor": get_model_data(event="user", event_id=actor_id),
                    "old_identifier": old_identifier,
                    "new_identifier": new_identifier,
                },
            )
        return
    except Exception as e:
        # Return if a does not exist error occurs
        if isinstance(e, ObjectDoesNotExist):
            return
        if settings.DEBUG:
            print(e)
        log_exception(e)
        return


@shared_task
def model_activity(
    model_name, model_id, requested_data, current_instance, actor_id, slug, origin=None
):
    """Function takes in two json and computes differences between keys of both the json"""
    if current_instance is None:
        webhook_activity.delay(
            event=model_name,
            verb="created",
            field=None,
            old_value=None,
            new_value=None,
            actor_id=actor_id,
            slug=slug,
            current_site=origin,
            event_id=model_id,
            old_identifier=None,
            new_identifier=None,
        )
        return

    # Load the current instance
    current_instance = (
        json.loads(current_instance) if current_instance is not None else None
    )

    # Loop through all keys in requested data and check the current value and requested value
    for key in requested_data:
        # Check if key is present in current instance or not
        if key in current_instance:
            current_value = current_instance.get(key, None)
            requested_value = requested_data.get(key, None)
            if current_value != requested_value:
                webhook_activity.delay(
                    event=model_name,
                    verb="updated",
                    field=key,
                    old_value=current_value,
                    new_value=requested_value,
                    actor_id=actor_id,
                    slug=slug,
                    current_site=origin,
                    event_id=model_id,
                    old_identifier=None,
                    new_identifier=None,
                )

    return
