# Python imports
import logging

# Third party imports
from celery import shared_task

# Django imports
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# Module imports
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.exception_logger import log_exception


@shared_task
def mobile_user_deletion_task(current_site, user):
    try:
        user_details = {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "display_name": user.display_name,
            "mobile_number": user.mobile_number,
            "date_joined": user.date_joined,
            "masked_time": user.masked_time,
            "reason": user.reason,
        }

        admin_emails_string = settings.MOBILE_USER_DELETE_ADMIN_EMAILS or None
        if admin_emails_string is None or admin_emails_string == "":
            return

        admin_emails = admin_emails_string.split(",")
        if admin_emails is None or len(admin_emails) == 0:
            return

        # Send email to company admins when user is deleted
        subject = "[Account Deleted - Mobile] {user.full_name} ({user.email}) has been removed from the platform"  # noqa: E501
        context = {
            "user": user_details,
            "current_site": current_site,
        }

        # construct email content
        html_content = render_to_string("emails/mobile/user/user_delete.html", context)
        text_content = strip_tags(html_content)

        # Configure email connection from the database
        (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_USE_SSL,
            EMAIL_FROM,
        ) = get_email_configuration()

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
            to=admin_emails,
            connection=connection,
        )

        # Attach HTML content
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logging.getLogger("plane.worker").info("Email sent successfully.")
        return
    except Exception as e:
        log_exception(e)
        return
