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

# Django imports
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import Page, User
from plane.ee.models import PageUser
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.email import generate_plain_text_from_html
from plane.utils.exception_logger import log_exception
from plane.utils.host import base_host


logger = logging.getLogger("plane.worker")


def get_page_access(page_access):
    match page_access:
        case 0:
            return "View"
        case 1:
            return "Comment"
        case 2:
            return "Edit"


@shared_task
def share_page_notification(page_id, user_id, newly_shared_user_ids, slug):
    try:
        page = Page.objects.get(id=page_id, workspace__slug=slug)
        user = User.objects.get(id=user_id)

        # Get email configurations
        (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_USE_SSL,
            EMAIL_FROM,
        ) = get_email_configuration()

        # Get workspace URL (assuming it follows the pattern)
        base_url = settings.APP_BASE_URL or settings.WEB_URL
        page_url = f"{base_url}/{slug}/wiki/{page_id}"

        for newly_shared_user_id in newly_shared_user_ids:
            newly_shared_user = User.objects.get(id=newly_shared_user_id)

            page_access = PageUser.objects.get(page=page, user=newly_shared_user).access
            workspace = page.workspace.name
            # Prepare context for email template
            context = {
                "page": page,
                "user": user,
                "shared_to": newly_shared_user,
                "slug": slug,
                "page_url": page_url,
                "workspace": workspace,
                "page_name": page.name,
                "page_description": page.description_stripped or "No description available",
                "shared_by_name": f"{user.first_name} {user.last_name}".strip() or user.display_name or user.email,
                "shared_to_name": (
                    f"{newly_shared_user.first_name} {newly_shared_user.last_name}".strip()  # noqa: E501
                    or newly_shared_user.display_name
                    or newly_shared_user.email
                ),
                "page_access": get_page_access(page_access),
                "email_preference_url": f"{base_host(request=None, is_app=True)}/{slug}/settings/account/notifications/",  # noqa: E501
            }

            # Create email subject and content
            subject = f"{context['shared_by_name']} shared a page with you"
            html_content = render_to_string("emails/notifications/share_page.html", context)
            text_content = generate_plain_text_from_html(html_content)

            # Configure email connection
            connection = get_connection(
                host=EMAIL_HOST,
                port=int(EMAIL_PORT),
                username=EMAIL_HOST_USER,
                password=EMAIL_HOST_PASSWORD,
                use_tls=EMAIL_USE_TLS == "1",
                use_ssl=EMAIL_USE_SSL == "1",
            )

            # Send email
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=EMAIL_FROM,
                to=[newly_shared_user.email],
                connection=connection,
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()

        logger.info("Page share notification emails sent successfully.")
        return
    except Exception as e:
        log_exception(e)
        return
