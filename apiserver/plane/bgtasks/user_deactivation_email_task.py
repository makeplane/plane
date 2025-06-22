# Python imports
import logging

# Django imports
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import User
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.exception_logger import log_exception


@shared_task
def user_deactivation_email(current_site, user_id):
    try:
        # Send email to user when account is deactivated
        user = User.objects.get(id=user_id)
        subject = f"{user.first_name or user.display_name or user.email} has been deactivated on Plane"

        context = {"email": str(user.email), "login_url": current_site + "/login"}

        # Send email to user
        html_content = render_to_string("emails/user/user_deactivation.html", context)

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
            to=[user.email],
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
