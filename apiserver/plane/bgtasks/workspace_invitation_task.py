# Django imports
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

# Third party imports
from django_rq import job
from sentry_sdk import capture_exception
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

# Module imports
from plane.db.models import Workspace, User, WorkspaceMemberInvite


@job("default")
def workspace_invitation(email, workspace_id, token, current_site, invitor):
    try:
        workspace = Workspace.objects.get(pk=workspace_id)
        workspace_member_invite = WorkspaceMemberInvite.objects.get(
            token=token, email=email
        )

        realtivelink = (
            f"/workspace-member-invitation/{workspace_member_invite.id}?email={email}"
        )
        abs_url = "http://" + current_site + realtivelink

        from_email_string = f"Team Plane <team@mailer.plane.so>"

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

        msg = EmailMultiAlternatives(subject, text_content, from_email_string, [email])
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
        capture_exception(e)
        return
