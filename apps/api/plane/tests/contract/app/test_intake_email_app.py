# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import hashlib
import hmac
import json
import uuid

import pytest
from rest_framework import status

from plane.bgtasks.intake_email_task import create_intake_issue_from_email
from plane.db.models import Intake, IntakeIssue, Project
from plane.db.models.intake import SourceType
from plane.db.models.state import StateGroup

WEBHOOK_URL = "/api/intake/email/"
WEBHOOK_SECRET = "test-intake-email-secret"


def sign(body: str, secret: str = WEBHOOK_SECRET) -> str:
    return hmac.new(secret.encode("utf-8"), body.encode("utf-8"), hashlib.sha256).hexdigest()


def build_payload(recipient: str, **overrides) -> str:
    payload = {
        "recipient": recipient,
        "sender": "reporter@example.com",
        "subject": "Bug report from email",
        "body_text": "Something is broken",
        "body_html": "<p>Something is <strong>broken</strong></p>",
    }
    payload.update(overrides)
    return json.dumps(payload)


class _EagerTask:
    """Stand-in for the celery task that runs it synchronously on delay()."""

    def delay(self, **kwargs):
        create_intake_issue_from_email(**kwargs)


@pytest.fixture
def project(db, workspace, create_user):
    """Create a test project with intake enabled"""
    return Project.objects.create(
        name="Intake Email Project",
        identifier="IEP",
        workspace=workspace,
        intake_view=True,
        created_by=create_user,
    )


@pytest.fixture
def intake(project):
    """Create the default intake of the test project"""
    return Intake.objects.create(name="Intake", project=project, is_default=True)


@pytest.mark.contract
class TestIntakeEmailWebhook:
    def post_webhook(self, api_client, body: str, signature: str = None):
        extra = {}
        if signature is not None:
            extra["HTTP_X_PLANE_SIGNATURE"] = signature
        return api_client.post(WEBHOOK_URL, data=body, content_type="application/json", **extra)

    @pytest.mark.django_db
    def test_secret_not_configured_returns_403(self, api_client, settings, intake):
        settings.INTAKE_EMAIL_WEBHOOK_SECRET = ""

        body = build_payload(f"{intake.id}@intake.example.com")
        response = self.post_webhook(api_client, body, signature=sign(body))

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert IntakeIssue.objects.count() == 0

    @pytest.mark.django_db
    def test_invalid_signature_returns_403(self, api_client, settings, intake):
        settings.INTAKE_EMAIL_WEBHOOK_SECRET = WEBHOOK_SECRET

        body = build_payload(f"{intake.id}@intake.example.com")
        response = self.post_webhook(api_client, body, signature="0" * 64)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert IntakeIssue.objects.count() == 0

    @pytest.mark.django_db
    def test_missing_signature_returns_403(self, api_client, settings, intake):
        settings.INTAKE_EMAIL_WEBHOOK_SECRET = WEBHOOK_SECRET

        body = build_payload(f"{intake.id}@intake.example.com")
        response = self.post_webhook(api_client, body)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_unknown_intake_returns_404(self, api_client, settings, intake):
        settings.INTAKE_EMAIL_WEBHOOK_SECRET = WEBHOOK_SECRET

        body = build_payload(f"{uuid.uuid4()}@intake.example.com")
        response = self.post_webhook(api_client, body, signature=sign(body))

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert IntakeIssue.objects.count() == 0

    @pytest.mark.django_db
    def test_non_uuid_recipient_returns_404(self, api_client, settings, intake):
        settings.INTAKE_EMAIL_WEBHOOK_SECRET = WEBHOOK_SECRET

        body = build_payload("support@intake.example.com")
        response = self.post_webhook(api_client, body, signature=sign(body))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_intake_disabled_on_project_returns_404(self, api_client, settings, project, intake):
        settings.INTAKE_EMAIL_WEBHOOK_SECRET = WEBHOOK_SECRET
        project.intake_view = False
        project.save()

        body = build_payload(f"{intake.id}@intake.example.com")
        response = self.post_webhook(api_client, body, signature=sign(body))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_invalid_json_returns_400(self, api_client, settings, intake):
        settings.INTAKE_EMAIL_WEBHOOK_SECRET = WEBHOOK_SECRET

        body = "not-a-json-payload"
        response = self.post_webhook(api_client, body, signature=sign(body))

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_valid_payload_creates_intake_issue(self, api_client, settings, intake, monkeypatch):
        settings.INTAKE_EMAIL_WEBHOOK_SECRET = WEBHOOK_SECRET
        monkeypatch.setattr("plane.app.views.intake.base.create_intake_issue_from_email", _EagerTask())

        body = build_payload(f"{intake.id}@intake.example.com")
        response = self.post_webhook(api_client, body, signature=sign(body))

        assert response.status_code == status.HTTP_202_ACCEPTED
        intake_issue = IntakeIssue.objects.get(intake_id=intake.id)
        assert intake_issue.source == SourceType.EMAIL
        assert intake_issue.source_email == "reporter@example.com"
        assert intake_issue.status == -2
        assert intake_issue.issue.name == "Bug report from email"
        assert intake_issue.issue.state.group == StateGroup.TRIAGE.value

    @pytest.mark.django_db
    def test_valid_payload_with_intake_prefixed_recipient(self, api_client, settings, intake, monkeypatch):
        settings.INTAKE_EMAIL_WEBHOOK_SECRET = WEBHOOK_SECRET
        monkeypatch.setattr("plane.app.views.intake.base.create_intake_issue_from_email", _EagerTask())

        body = build_payload(f"intake+{intake.id}@intake.example.com")
        response = self.post_webhook(api_client, body, signature=sign(body))

        assert response.status_code == status.HTTP_202_ACCEPTED
        assert IntakeIssue.objects.filter(intake_id=intake.id, source=SourceType.EMAIL).exists()
