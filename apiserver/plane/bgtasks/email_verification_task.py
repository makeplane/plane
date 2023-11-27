# Python imports
import os

# Django imports
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

# Third party imports
from celery import shared_task


from sentry_sdk import capture_exception

# Module imports
from plane.license.models import InstanceConfiguration
from plane.license.utils.instance_value import get_configuration_value


@shared_task
def email_verification(first_name, email, token, current_site):
    try:
        realtivelink = "/request-email-verification/" + "?token=" + str(token)
        abs_url = current_site + realtivelink

        subject = "Verify your Email!"

        context = {
            "first_name": first_name,
            "verification_url": abs_url,
        }

        html_content = render_to_string("emails/auth/email_verification.html", context)

        text_content = strip_tags(html_content)

        # Configure email connection from the database
        instance_configuration = InstanceConfiguration.objects.filter(
            key__startswith="EMAIL_"
        ).values("key", "value")
        connection = get_connection(
            host=get_configuration_value(
                instance_configuration, "EMAIL_HOST", os.environ.get("EMAIL_HOST")
            ),
            port=int(
                get_configuration_value(
                    instance_configuration, "EMAIL_PORT", os.environ.get("EMAIL_PORT")
                )
            ),
            username=get_configuration_value(
                instance_configuration,
                "EMAIL_HOST_USER",
                os.environ.get("EMAIL_HOST_USER"),
            ),
            password=get_configuration_value(
                instance_configuration,
                "EMAIL_HOST_PASSWORD",
                os.environ.get("EMAIL_HOST_PASSWORD"),
            ),
            use_tls=bool(
                get_configuration_value(
                    instance_configuration,
                    "EMAIL_USE_TLS",
                    os.environ.get("EMAIL_USE_TLS", "1"),
                )
            ),
        )

        # Initiate email alternatives
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=get_configuration_value(
                instance_configuration,
                "EMAIL_FROM",
                os.environ.get("EMAIL_FROM", "Team Plane <team@mailer.plane.so>"),
            ),
            to=[email],
            connection=connection,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        return
    except Exception as e:
        # Print logs if in DEBUG mode
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return
