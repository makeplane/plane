# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Imported pytest fixtures are requested by parameter name, which F811 misreads as redefinition.
# ruff: noqa: F811

"""A restricted guest (``guest_view_all_features=False``) must not react to, or
remove a reaction from, an issue they did not create. Own issues, members and
unrestricted guests are unaffected.

Reuses the fixtures of the sibling sub-resource test module.
"""

from unittest.mock import patch

import pytest
from rest_framework import status

from plane.db.models import IssueReaction
from plane.tests.contract.app.test_guest_issue_subresource_scope_app import (  # noqa: F401
    foreign_issue,
    guest,
    guest_client,
    own_issue,
    project,
)

REACTIONS = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/reactions/"


def _url(workspace, project, issue, code=""):
    return REACTIONS.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id) + code


@pytest.fixture(autouse=True)
def _no_activity():
    with patch("plane.app.views.issue.reaction.issue_activity") as task:
        yield task


@pytest.mark.contract
@pytest.mark.django_db
class TestGuestIssueReactions:
    def test_guest_blocked_on_foreign_issue(self, guest, guest_client, workspace, project, foreign_issue, _no_activity):
        # A pre-existing own reaction must survive a blocked DELETE.
        IssueReaction.objects.create(
            issue=foreign_issue, project=project, workspace=workspace, actor=guest, reaction="128077"
        )
        post = guest_client.post(_url(workspace, project, foreign_issue), {"reaction": "128512"}, format="json")
        delete = guest_client.delete(_url(workspace, project, foreign_issue, "128077/"))
        assert (post.status_code, delete.status_code) == (status.HTTP_403_FORBIDDEN, status.HTTP_403_FORBIDDEN)
        assert list(IssueReaction.objects.filter(issue=foreign_issue).values_list("reaction", flat=True)) == ["128077"]
        _no_activity.delay.assert_not_called()

    def test_guest_allowed_own_issue(self, guest, guest_client, workspace, project, own_issue):
        response = guest_client.post(_url(workspace, project, own_issue), {"reaction": "128512"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert IssueReaction.objects.filter(issue=own_issue, actor=guest).count() == 1

    def test_member_unaffected(self, session_client, workspace, project, foreign_issue):
        response = session_client.post(_url(workspace, project, foreign_issue), {"reaction": "128512"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED

    def test_unrestricted_guest_unaffected(self, guest_client, workspace, project, foreign_issue):
        project.guest_view_all_features = True
        project.save(update_fields=["guest_view_all_features"])
        response = guest_client.post(_url(workspace, project, foreign_issue), {"reaction": "128512"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
