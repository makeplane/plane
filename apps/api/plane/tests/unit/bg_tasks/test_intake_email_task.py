# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid

import pytest

from plane.bgtasks.intake_email_task import (
    DEFAULT_ISSUE_NAME,
    ISSUE_NAME_MAX_LENGTH,
    build_email_description_html,
    create_intake_issue_from_email,
)
from plane.db.models import Intake, IntakeIssue, Project
from plane.db.models.intake import SourceType
from plane.db.models.state import StateGroup


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


@pytest.mark.unit
@pytest.mark.django_db
class TestCreateIntakeIssueFromEmail:
    def test_creates_issue_and_intake_issue_in_triage(self, intake):
        create_intake_issue_from_email(
            intake_id=str(intake.id),
            sender="reporter@example.com",
            subject="  Crash on login  ",
            body_text="Steps to reproduce",
            body_html="<p>Steps to <script>alert('x')</script>reproduce</p>",
        )

        intake_issue = IntakeIssue.objects.get(intake_id=intake.id)
        assert intake_issue.source == SourceType.EMAIL
        assert intake_issue.source_email == "reporter@example.com"
        assert intake_issue.status == -2

        issue = intake_issue.issue
        assert issue.name == "Crash on login"
        assert issue.state.group == StateGroup.TRIAGE.value
        assert "<script" not in issue.description_html
        assert "reproduce" in issue.description_html

    def test_subject_is_truncated_to_issue_name_max_length(self, intake):
        create_intake_issue_from_email(
            intake_id=str(intake.id),
            sender="reporter@example.com",
            subject="a" * (ISSUE_NAME_MAX_LENGTH + 100),
            body_text="body",
            body_html="",
        )

        intake_issue = IntakeIssue.objects.get(intake_id=intake.id)
        assert len(intake_issue.issue.name) == ISSUE_NAME_MAX_LENGTH

    def test_empty_subject_falls_back_to_default_name(self, intake):
        create_intake_issue_from_email(
            intake_id=str(intake.id),
            sender="reporter@example.com",
            subject="",
            body_text="body",
            body_html="",
        )

        intake_issue = IntakeIssue.objects.get(intake_id=intake.id)
        assert intake_issue.issue.name == DEFAULT_ISSUE_NAME

    def test_unknown_intake_creates_nothing(self, intake):
        create_intake_issue_from_email(
            intake_id=str(uuid.uuid4()),
            sender="reporter@example.com",
            subject="Subject",
            body_text="body",
            body_html="",
        )

        assert IntakeIssue.objects.count() == 0

    def test_disabled_intake_view_creates_nothing(self, project, intake):
        project.intake_view = False
        project.save()

        create_intake_issue_from_email(
            intake_id=str(intake.id),
            sender="reporter@example.com",
            subject="Subject",
            body_text="body",
            body_html="",
        )

        assert IntakeIssue.objects.count() == 0


@pytest.mark.unit
class TestBuildEmailDescriptionHtml:
    def test_sanitizes_html_body(self):
        description = build_email_description_html("<p>hello <script>alert('x')</script>world</p>", "fallback")
        assert "<script" not in description
        assert "hello" in description

    def test_falls_back_to_escaped_text_body(self):
        description = build_email_description_html("", "<b>hi</b>\nline two")
        assert description == "<p>&lt;b&gt;hi&lt;/b&gt;<br>line two</p>"

    def test_defaults_to_empty_paragraph(self):
        assert build_email_description_html("", "") == "<p></p>"
