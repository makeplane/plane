# Python import
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

# Module imports
from plane.license.models import InstanceConfiguration, Instance
from plane.license.utils.instance_value import get_email_configuration


@shared_task
def forgot_password(first_name, email, uidb64, token, current_site):
    try:
        relative_link = (
            f"/accounts/password/?uidb64={uidb64}&token={token}&email={email}"
        )
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

            # headers
            headers = {
                "Content-Type": "application/json",
                "x-instance-id": instance.instance_id,
                "x-api-key": instance.api_key,
            }

            payload = {
                "abs_url": abs_url,
                "first_name": first_name,
                "email": email,
            }

            _ = requests.post(
                f"{license_engine_base_url}/api/instances/users/forgot-password/",
                headers=headers,
                data=json.dumps(payload),
            )

            return

        subject = "A new password to your Plane account has been requested"

        context = {
            "first_name": first_name,
            "forgot_password_url": abs_url,
            "email": email,
        }

        html_content = render_to_string("emails/auth/forgot_password.html", context)

        text_content = strip_tags(html_content)

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
        return
    except Exception as e:
        # Print logs if in DEBUG mode
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return
