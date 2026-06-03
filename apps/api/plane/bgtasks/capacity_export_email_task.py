# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils import timezone, translation
from django.utils.translation import gettext_lazy as _

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import CapacityExportJob
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.email import generate_plain_text_from_html, get_email_logo_url
from plane.utils.exception_logger import log_exception


def resolve_locale(user, workspace):
    """
    Resolve display locale using a 3-tier fallback chain:
      1. user.language  (user preference)
      2. settings.LANGUAGE_CODE  (instance default)
    Workspace has no locale field, so the middle tier is skipped.
    Returns a BCP-47 / Django locale string (e.g. "en", "ko", "vi").
    """
    for candidate in (
        getattr(user, "language", None),
        getattr(workspace, "default_locale", None),
        getattr(workspace, "language", None),
        settings.LANGUAGE_CODE,
    ):
        if candidate:
            return candidate
    return "en"


@shared_task
def capacity_export_email_task(job_id, is_failure=False):
    """
    Send a transactional email to the requester of a capacity export job.

    - is_failure=False  → "report ready" email with download link
    - is_failure=True   → "export failed" apology email

    Errors are swallowed via log_exception so the Celery worker never crashes.
    """
    try:
        job = CapacityExportJob.objects.select_related(
            "requested_by", "workspace"
        ).get(id=job_id)
    except CapacityExportJob.DoesNotExist:
        return

    try:
        locale = resolve_locale(job.requested_by, job.workspace)

        with translation.override(locale):
            logo_url = get_email_logo_url()

            if is_failure:
                subject = str(_("Capacity export failed"))
                template_path = "emails/capacity/export_failed.html"
                ctx = {
                    "workspace_name": job.workspace.name,
                    "job_id": str(job.id),
                    "error_message": job.error_message or "",
                    "date_from": job.date_from,
                    "date_to": job.date_to,
                    "logo_url": logo_url,
                }
            else:
                subject = str(
                    _("Your capacity report is ready ({date_from} – {date_to})").format(
                        date_from=job.date_from,
                        date_to=job.date_to,
                    )
                )
                template_path = "emails/capacity/export_ready.html"
                ctx = {
                    "workspace_name": job.workspace.name,
                    "date_from": job.date_from,
                    "date_to": job.date_to,
                    "member_count": len(job.member_ids or []),
                    "row_count": job.row_count or 0,
                    "download_url": job.file_url or "",
                    "expires_at": job.expires_at,
                    "generated_at": job.completed_at or timezone.now(),
                    "file_size_mb": round((job.file_size or 0) / (1024 * 1024), 2),
                    "logo_url": logo_url,
                }

            html_content = render_to_string(template_path, ctx)
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

            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=EMAIL_FROM,
                to=[job.requested_by.email],
                connection=connection,
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()

    except Exception as e:
        log_exception(e)
