# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import logging

# Third party imports
from celery import shared_task
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

# Django imports
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string

# Module imports
from plane.db.models import User, Workspace, WorkspaceMemberInvite
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.email import generate_plain_text_from_html
from plane.utils.exception_logger import log_exception


def push_updated_to_slack(workspace, workspace_member_invite):
    # Send message on slack as well
    client = WebClient(token=settings.SLACK_BOT_TOKEN)
    try:
        email = workspace_member_invite.email
        role = workspace_member_invite.role
        workspace_name = workspace.name
        text = f"{email} has been invited to {workspace_name} as a {role}"
        _ = client.chat_postMessage(channel="#trackers", text=text)
    except SlackApiError as e:
        print(f"Got an error: {e.response['error']}")


@shared_task
def workspace_invitation(email, workspace_id, token, current_site, inviter):
    try:
        user = User.objects.get(email=inviter)

        workspace = Workspace.objects.get(pk=workspace_id)
        workspace_member_invite = WorkspaceMemberInvite.objects.get(token=token, email=email)

        # Relative link
        relative_link = (
            f"/workspace-invitations/?invitation_id={workspace_member_invite.id}&slug={workspace.slug}&token={token}"  # noqa: E501
        )

        # The complete url including the domain
        abs_url = str(current_site) + relative_link

        (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_USE_SSL,
            EMAIL_FROM,
        ) = get_email_configuration()

        # Subject of the email
        subject = f"{user.first_name or user.display_name or user.email} has invited you to join them in {workspace.name} on Plane"  # noqa: E501

        context = {
            "email": email,
            "first_name": user.first_name or user.display_name or user.email,
            "workspace_name": workspace.name,
            "abs_url": abs_url,
        }

        html_content = render_to_string("emails/invitations/workspace_invitation.html", context)

        text_content = generate_plain_text_from_html(html_content)

        workspace_member_invite.message = text_content
        workspace_member_invite.save()

        connection = get_connection(
            host=EMAIL_HOST,
            port=int(EMAIL_PORT),
            username=EMAIL_HOST_USER,
            password=EMAIL_HOST_PASSWORD,
            use_tls=EMAIL_USE_TLS == "1",
            use_ssl=EMAIL_USE_SSL == "1",
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
        logging.getLogger("plane.worker").info("Email sent successfully")

        # Send message on slack as well
        if settings.SLACK_BOT_TOKEN:
            push_updated_to_slack(workspace, workspace_member_invite)
        return

    except (Workspace.DoesNotExist, WorkspaceMemberInvite.DoesNotExist):
        return
    except Exception as e:
        log_exception(e)
        return
