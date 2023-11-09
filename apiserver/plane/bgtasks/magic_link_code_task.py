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

@shared_task
def magic_link(email, key, token, current_site):
    try:
        realtivelink = f"/magic-sign-in/?password={token}&key={key}"
        abs_url = current_site + realtivelink

        from_email_string = settings.EMAIL_FROM

        subject = "Login for Plane"

        context = {"magic_url": abs_url, "code": token}

        html_content = render_to_string("emails/auth/magic_signin.html", context)

        text_content = strip_tags(html_content)

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
        return
    except Exception as e:
        capture_exception(e)
        # Print logs if in DEBUG mode
        if settings.DEBUG:
            print(e)
        return
