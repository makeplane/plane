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
from plane.db.models import Workspace, WorkspaceMemberInvite
from plane.license.models import InstanceConfiguration

@shared_task
def workspace_invitation(email, workspace_id, token, current_site, invitor):
    try:
        workspace = Workspace.objects.get(pk=workspace_id)
        workspace_member_invite = WorkspaceMemberInvite.objects.get(
            token=token, email=email
        )

        realtivelink = (
            f"/workspace-member-invitation/?invitation_id={workspace_member_invite.id}&email={email}"
        )
        abs_url = current_site + realtivelink

        from_email_string = settings.EMAIL_FROM

        subject = f"{invitor or email} invited you to join {workspace.name} on Plane"

        context = {
            "email": email,
            "first_name": invitor,
            "workspace_name": workspace.name,
            "invitation_url": abs_url,
        }

        html_content = render_to_string(
            "emails/invitations/workspace_invitation.html", context
        )

        text_content = strip_tags(html_content)

        workspace_member_invite.message = text_content
        workspace_member_invite.save()

        # Configure email connection from the database
        instance_configuration = InstanceConfiguration.objects.filter(key__startswith='EMAIL_').values()
        connection = get_connection(
            host=instance_configuration.get("EMAIL_HOST", ""),
            port=int(instance_configuration.get("EMAIL_PORT", "587")),
            username=instance_configuration.get("EMAIL_HOST_USER", ""),
            password=instance_configuration.get("EMAIL_HOST_PASSWORD", ""),
            use_tls=bool(instance_configuration.get("EMAIL_USE_TLS", "")),
            use_ssl=bool(instance_configuration.get("EMAIL_USE_SSL", ""))
        )
        # Initiate email alternatives
        msg = EmailMultiAlternatives(subject=subject, text_content=text_content, from_email=settings.EMAIL_FROM, to=[email], connection=connection)
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
        return
    except Exception as e:
        # Print logs if in DEBUG mode
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return
