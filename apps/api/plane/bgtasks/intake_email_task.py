# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json
import logging

# Third party imports
from celery import shared_task

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone
from django.utils.html import escape

# Module imports
from plane.db.models import Intake, IntakeIssue, Issue, State, StateGroup
from plane.db.models.intake import SourceType
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.issue_description_version_task import issue_description_version_task
from plane.utils.content_validator import validate_html_content
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")

ISSUE_NAME_MAX_LENGTH = 255
DEFAULT_ISSUE_NAME = "(No subject)"
EMAIL_EXTERNAL_SOURCE = "EMAIL"


def build_email_description_html(body_html, body_text):
    """Sanitize the HTML body of an email, falling back to the escaped text body."""
    if body_html:
        is_valid, _, sanitized_html = validate_html_content(body_html)
        if is_valid and sanitized_html:
            return sanitized_html
    if body_text:
        escaped_lines = [escape(line) for line in body_text.splitlines()]
        return "<p>" + "<br>".join(escaped_lines) + "</p>"
    return "<p></p>"


@shared_task
def create_intake_issue_from_email(intake_id, sender, subject, body_text, body_html, message_id=None):
    try:
        intake = Intake.objects.filter(pk=intake_id, project__intake_view=True).select_related("project").first()
        if intake is None:
            logger.warning(f"Intake {intake_id} not found or intake is disabled for the project")
            return

        # Idempotency: a provider retry (or a replayed webhook) carrying the same
        # email Message-ID must not create a duplicate intake work item.
        if message_id and IntakeIssue.objects.filter(
            intake_id=intake.id, source=SourceType.EMAIL, external_source=EMAIL_EXTERNAL_SOURCE, external_id=message_id
        ).exists():
            return

        project = intake.project

        # get the triage state
        triage_state = State.triage_objects.filter(project_id=project.id, workspace_id=project.workspace_id).first()
        if not triage_state:
            triage_state = State.objects.create(
                name="Triage",
                group=StateGroup.TRIAGE.value,
                project_id=project.id,
                workspace_id=project.workspace_id,
                color="#4E5355",
                sequence=65000,
                default=False,
            )

        name = (subject or "").strip()[:ISSUE_NAME_MAX_LENGTH] or DEFAULT_ISSUE_NAME
        description_html = build_email_description_html(body_html, body_text)

        # create an issue in the triage state
        issue = Issue.objects.create(
            name=name,
            description_html=description_html,
            priority="none",
            project_id=project.id,
            state_id=triage_state.id,
        )

        # create an intake issue
        intake_issue = IntakeIssue.objects.create(
            intake_id=intake.id,
            project_id=project.id,
            issue=issue,
            source=SourceType.EMAIL,
            source_email=sender,
            external_source=EMAIL_EXTERNAL_SOURCE if message_id else None,
            external_id=message_id,
        )

        # Emit the creation activity (and notify subscribers) as the in-app
        # intake flow does; there is no request user, so the actor is the system.
        activity_data = {"name": name, "description_html": description_html}
        issue_activity.delay(
            type="issue.activity.created",
            requested_data=json.dumps(activity_data, cls=DjangoJSONEncoder),
            actor_id=None,
            issue_id=str(issue.id),
            project_id=str(project.id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            intake=str(intake_issue.id),
        )
        # capture the initial description version
        issue_description_version_task.delay(
            updated_issue=json.dumps(activity_data, cls=DjangoJSONEncoder),
            issue_id=str(issue.id),
            user_id=None,
            is_creating=True,
        )
    except Exception as e:
        log_exception(e)
        return
