# Python imports
import logging

# Third party imports
from celery import shared_task

# Django imports
# Third party imports
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# Module imports
from plane.db.models import Project, ProjectMemberInvite, User
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.exception_logger import log_exception


@shared_task
def project_invitation(email, project_id, token, current_site, invitor):
    try:
        user = User.objects.get(email=invitor)
        project = Project.objects.get(pk=project_id)
        project_member_invite = ProjectMemberInvite.objects.get(token=token, email=email)

        relativelink = f"/project-invitations/?invitation_id={project_member_invite.id}&email={email}&slug={project.workspace.slug}&project_id={str(project_id)}"  # noqa: E501
        abs_url = current_site + relativelink

        subject = f"{user.first_name or user.display_name or user.email} invited you to join {project.name} on Plane"

        context = {
            "email": email,
            "first_name": user.first_name,
            "project_name": project.name,
            "invitation_url": abs_url,
        }

        html_content = render_to_string("emails/invitations/project_invitation.html", context)

        text_content = strip_tags(html_content)

        project_member_invite.message = text_content
        project_member_invite.save()

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

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=EMAIL_FROM,
            to=[email],
            connection=connection,
        )

        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logging.getLogger("plane.worker").info("Email sent successfully.")
        return
    except (Project.DoesNotExist, ProjectMemberInvite.DoesNotExist):
        return
    except Exception as e:
        log_exception(e)
        return
