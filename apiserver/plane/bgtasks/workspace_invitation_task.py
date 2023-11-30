# Python imports
import os
import requests
import json

# Django imports
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

# Module imports
from plane.db.models import Workspace, WorkspaceMemberInvite, User
from plane.license.models import InstanceConfiguration, Instance
from plane.license.utils.instance_value import get_email_configuration


@shared_task
def workspace_invitation(email, workspace_id, token, current_site, invitor):
    try:
        user = User.objects.get(email=invitor)

        workspace = Workspace.objects.get(pk=workspace_id)
        workspace_member_invite = WorkspaceMemberInvite.objects.get(
            token=token, email=email
        )

        # Relative link
        relative_link = f"/workspace-invitations/?invitation_id={workspace_member_invite.id}&email={email}&slug={workspace.slug}"

        # The complete url including the domain
        abs_url = str(current_site) + relative_link

        instance_configuration = InstanceConfiguration.objects.filter(
            key__startswith="EMAIL_"
        ).values("key", "value")

        (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_FROM,
        ) = get_email_configuration(instance_configuration=instance_configuration)

        # Send the email if the users don't have smtp configured
        if not EMAIL_HOST or not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
            # Check the instance registration
            instance = Instance.objects.first()

            # send the emails through control center
            license_engine_base_url = os.environ.get("LICENSE_ENGINE_BASE_URL", False)
            if not license_engine_base_url:
                raise Exception("License engine base url is required")

            headers = {
                "Content-Type": "application/json",
                "x-instance-id": instance.instance_id,
                "x-api-key": instance.api_key,
            }

            payload = {
                "user": user.first_name or user.display_name or user.email,
                "workspace_name": workspace.name,
                "invitation_url": abs_url,
                "email": email,
            }
            _ = requests.post(
                f"{license_engine_base_url}/api/instances/users/workspace-invitation/",
                headers=headers,
                data=json.dumps(payload),
            )

            return

        # Subject of the email
        subject = f"{user.first_name or user.display_name or user.email} has invited you to join them in {workspace.name} on Plane"

        context = {
            "email": email,
            "first_name": user.first_name or user.display_name or user.email,
            "workspace_name": workspace.name,
            "abs_url": abs_url,
        }

        html_content = render_to_string(
            "emails/invitations/workspace_invitation.html", context
        )

        text_content = strip_tags(html_content)

        workspace_member_invite.message = text_content
        workspace_member_invite.save()

        instance_configuration = InstanceConfiguration.objects.filter(
            key__startswith="EMAIL_"
        ).values("key", "value")
        connection = get_connection(
            host=EMAIL_HOST,
            port=int(EMAIL_PORT),
            username=EMAIL_HOST_USER,
            password=EMAIL_HOST_PASSWORD,
            use_tls=bool(EMAIL_USE_TLS),
        )

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=EMAIL_FROM,
            to=[email],
            connection=connection,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()

        # Send message on slack as well
        if settings.SLACK_BOT_TOKEN:
            client = WebClient(token=settings.SLACK_BOT_TOKEN)
            try:
                _ = client.chat_postMessage(
                    channel="#trackers",
                    text=f"{workspace_member_invite.email} has been invited to {workspace.name} as a {workspace_member_invite.role}",
                )
            except SlackApiError as e:
                print(f"Got an error: {e.response['error']}")

        return
    except (Workspace.DoesNotExist, WorkspaceMemberInvite.DoesNotExist) as e:
        print("Workspace or WorkspaceMember Invite Does not exists")
        return
    except Exception as e:
        # Print logs if in DEBUG mode
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return
