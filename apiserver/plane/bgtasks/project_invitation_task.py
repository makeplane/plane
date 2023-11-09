# Django imports
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception

# Module imports
from plane.db.models import Project, User, ProjectMemberInvite
from plane.license.models import InstanceConfiguration


@shared_task
def project_invitation(email, project_id, token, current_site):
    try:
        project = Project.objects.get(pk=project_id)
        project_member_invite = ProjectMemberInvite.objects.get(
            token=token, email=email
        )

        relativelink = f"/project-member-invitation/{project_member_invite.id}"
        abs_url = current_site + relativelink

        from_email_string = settings.EMAIL_FROM

        subject = f"{project.created_by.first_name or project.created_by.email} invited you to join {project.name} on Plane"

        context = {
            "email": email,
            "first_name": project.created_by.first_name,
            "project_name": project.name,
            "invitation_url": abs_url,
        }

        html_content = render_to_string(
            "emails/invitations/project_invitation.html", context
        )

        text_content = strip_tags(html_content)

        project_member_invite.message = text_content
        project_member_invite.save()

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
    except (Project.DoesNotExist, ProjectMemberInvite.DoesNotExist) as e:
        return
    except Exception as e:
        # Print logs if in DEBUG mode
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return
