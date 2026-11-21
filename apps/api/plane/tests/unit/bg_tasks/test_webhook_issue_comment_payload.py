# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""issue_comment webhook payloads carry the parent work item's name and sequence id."""

import pytest

from plane.bgtasks.webhook_task import get_model_data
from plane.db.models import Issue, IssueComment, Project

pytestmark = pytest.mark.unit


@pytest.fixture
def issue(db, workspace, create_user):
    project = Project.objects.create(name="Home", identifier="HOME", workspace=workspace, created_by=create_user)
    return Issue.objects.create(name="Fix the login page", project=project, workspace=workspace)


def _comment(issue, html):
    return IssueComment.objects.create(issue=issue, project=issue.project, workspace=issue.workspace, comment_html=html)


def test_issue_comment_payload_includes_issue_detail(issue):
    comment = _comment(issue, "<p>Looks good</p>")

    data = get_model_data(event="issue_comment", event_id=comment.id)

    assert data["issue"] == issue.id
    assert data["issue_detail"] == {"name": "Fix the login page", "sequence_id": issue.sequence_id}


def test_issue_comment_payload_includes_issue_detail_for_many(issue):
    other = Issue.objects.create(name="Other issue", project=issue.project, workspace=issue.workspace)
    first = _comment(issue, "<p>one</p>")
    second = _comment(other, "<p>two</p>")

    data = get_model_data(event="issue_comment", event_id=[first.id, second.id], many=True)

    details = {str(row["id"]): row["issue_detail"] for row in data}
    assert details[str(first.id)] == {"name": issue.name, "sequence_id": issue.sequence_id}
    assert details[str(second.id)] == {"name": "Other issue", "sequence_id": other.sequence_id}


def test_other_events_are_unchanged(issue):
    data = get_model_data(event="project", event_id=issue.project_id)

    assert "issue_detail" not in data
