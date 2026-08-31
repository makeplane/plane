# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Internal addition (not part of upstream makeplane/plane): emails a project's
# custom field data to selected project members on demand. The calling view
# (ProjectCustomFieldDataEmailEndpoint) validates the recipient list against
# active project membership before queuing this task, but the task re-validates
# again immediately before sending: on a backlogged queue, a recipient can be
# removed from the project between enqueue time and send time, and re-checking
# here closes that window instead of trusting a point-in-time list.

# Python imports
import logging
from decimal import Decimal

# Third party imports
from celery import shared_task
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string

# Module imports
from plane.db.models import Project, ProjectCustomField, ProjectCustomFieldValue, ProjectMember, User
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.email import generate_plain_text_from_html
from plane.utils.exception_logger import log_exception


def _format_decimal(value: Decimal) -> str:
    # Fixed-point (never scientific notation) with trailing zeros trimmed, so
    # 1000.0000 reads as "1000" and 12.5000 reads as "12.5".
    text = f"{value:f}"
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text


def _field_display_value(value: ProjectCustomFieldValue):
    if value is None:
        return None
    if value.value_decimal is not None:
        return _format_decimal(value.value_decimal)
    if value.value_text:
        return value.value_text
    if value.value_date is not None:
        return value.value_date.strftime("%Y-%m-%d")
    if value.value_option_id is not None:
        return value.value_option.name
    if value.value_member_id is not None:
        return value.value_member.display_name or value.value_member.email
    return None


@shared_task
def send_project_custom_field_data_email(current_site, project_id, recipient_ids, sender_id):
    try:
        project = Project.objects.select_related("workspace").get(pk=project_id)
        sender = User.objects.get(pk=sender_id)

        custom_fields = ProjectCustomField.objects.filter(project_id=project_id, is_active=True).order_by(
            "sort_order"
        )
        values_by_field = {
            value.custom_field_id: value
            for value in ProjectCustomFieldValue.objects.filter(project_id=project_id).select_related(
                "value_option", "value_member"
            )
        }
        fields = [
            {"name": field.name, "value": _field_display_value(values_by_field.get(field.id))}
            for field in custom_fields
        ]

        project_url = f"{current_site}/{project.workspace.slug}/projects/{project.id}/settings/custom-fields/"
        subject = f"{project.name} 项目数据"
        context = {
            "project_name": project.name,
            "workspace_name": project.workspace.name,
            "sender_name": sender.display_name or sender.email,
            "project_url": project_url,
            "fields": fields,
        }
        html_content = render_to_string("emails/project_data/custom_field_data.html", context)
        text_content = generate_plain_text_from_html(html_content)

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

        # Re-validate against current active membership rather than trusting the
        # point-in-time list the task was queued with (see module docstring).
        still_valid_recipient_ids = ProjectMember.objects.filter(
            project_id=project_id, member_id__in=recipient_ids, is_active=True
        ).values_list("member_id", flat=True)
        recipient_emails = User.objects.filter(pk__in=still_valid_recipient_ids).values_list("email", flat=True)

        # One email per recipient (not a single CC'd send) so recipients don't see
        # who else this project's data was shared with. Each send is isolated: one
        # recipient's failure (bad address, SMTP rejection) must not stop the rest
        # of the batch from being sent.
        sent_count = 0
        for email in recipient_emails:
            try:
                msg = EmailMultiAlternatives(
                    subject=subject, body=text_content, from_email=EMAIL_FROM, to=[email], connection=connection
                )
                msg.attach_alternative(html_content, "text/html")
                msg.send()
                sent_count += 1
            except Exception as send_error:
                log_exception(send_error)

        logging.getLogger("plane.worker").info(
            f"Project custom field data email sent to {sent_count}/{len(recipient_emails)} recipient(s)."
        )
        return
    except Exception as e:
        log_exception(e)
        return
