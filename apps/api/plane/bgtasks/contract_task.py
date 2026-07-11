# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import logging

from celery import shared_task
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from plane.license.utils.instance_value import get_email_configuration
from plane.utils.exception_logger import log_exception
from plane.utils.worker_client import trigger_contract_pipeline, trigger_contract_query

logger = logging.getLogger(__name__)


@shared_task
def dispatch_contract_pipeline(job_id):
    """Asks the Cloudflare Worker to start (or retry) a contract pipeline run.
    Fire-and-forget from the request thread; failures mark the job FAILED so
    the UI can offer a retry.
    """
    from plane.db.models import ContractProcessingJob

    job = ContractProcessingJob.objects.select_related("contract").filter(id=job_id).first()
    if job is None:
        return

    try:
        instance_id = trigger_contract_pipeline(
            job_id=job.id,
            contract_id=job.contract_id,
            workspace_id=job.workspace_id,
            asset_id=job.contract.file_asset_id,
            mode=job.task_type,
            retry_options=(job.metadata or {}).get("retry_options"),
        )
        job.workflow_instance_id = instance_id
        job.save(update_fields=["workflow_instance_id"])
    except Exception as e:
        job.status = ContractProcessingJob.Status.FAILED
        job.error = {"message": str(e), "stage": "dispatch"}
        job.finished_at = timezone.now()
        job.save(update_fields=["status", "error", "finished_at"])
        log_exception(e)


@shared_task
def dispatch_contract_query(job_id, query_id):
    """Asks the Worker to start the NL query fan-out workflow."""
    from plane.db.models import ContractProcessingJob, ContractQuery

    job = ContractProcessingJob.objects.filter(id=job_id).first()
    query = ContractQuery.objects.filter(id=query_id).first()
    if job is None or query is None:
        return

    try:
        instance_id = trigger_contract_query(
            job_id=job.id,
            query_id=query.id,
            workspace_id=job.workspace_id,
            user_query=query.query,
        )
        job.workflow_instance_id = instance_id
        job.save(update_fields=["workflow_instance_id"])
    except Exception as e:
        job.status = ContractProcessingJob.Status.FAILED
        job.error = {"message": str(e), "stage": "dispatch"}
        job.finished_at = timezone.now()
        job.save(update_fields=["status", "error", "finished_at"])
        query.status = ContractProcessingJob.Status.FAILED
        query.save(update_fields=["status"])
        log_exception(e)


@shared_task
def send_contract_query_email(query_id):
    """Emails the NL query result to the requesting user via the instance SMTP
    configuration (same pattern as magic_link_code_task).
    """
    from plane.db.models import ContractQuery

    query = ContractQuery.objects.select_related("user", "workspace").filter(id=query_id).first()
    if query is None or query.result is None:
        return

    try:
        (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_USE_SSL,
            EMAIL_FROM,
        ) = get_email_configuration()

        result = query.result or {}
        subject = f"Resultado de tu consulta de contratos — {query.workspace.name}"
        context = {
            "query": query.query,
            "summary": result.get("summary", ""),
            "matches": result.get("matches", []),
            "scanned_count": result.get("scanned_count", 0),
            "workspace_name": query.workspace.name,
        }
        html_content = render_to_string("emails/contract_query_result.html", context)
        text_content = strip_tags(html_content)

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
            to=[query.user.email],
            connection=connection,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()

        query.emailed_at = timezone.now()
        query.save(update_fields=["emailed_at"])
        logger.info("Contract query result email sent to %s", query.user.email)
    except Exception as e:
        log_exception(e)
