# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``IssueListEndpoint`` guest scoping.

Regression coverage for GHSA-32c7-84jc-4w67 (WEB-8074). ``IssueListEndpoint.get``
(``/workspaces/<slug>/projects/<project_id>/issues/list/``) returned any issue
whose id was passed in ``?issues=``, without applying the guest ``created_by``
restriction that its sibling ``IssueViewSet.list`` enforces. A project GUEST on a
project with ``guest_view_all_features=False`` could therefore read issues they
did not author by supplying their ids.

The fix scopes the queryset to ``created_by=request.user`` for such guests,
mirroring ``IssueViewSet.list``.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Issue,
    Project,
    ProjectMember,
    User,
    WorkspaceMember,
)

LIST_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/list/"


@pytest.fixture
def project(db, workspace, create_user):
    """A project (guest_view_all_features defaults to False); owner is a member."""
    project = Project.objects.create(
        name="Scoped Project",
        identifier="SP",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=20
    )
    return project


@pytest.fixture
def guest(db, workspace, project):
    """An active project GUEST (role=5)."""
    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"guest-{unique_id}@plane.so",
        username=f"guest_{unique_id}",
        first_name="Guest",
        last_name="User",
    )
    user.set_password("test-password")
    user.save()
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=5)
    ProjectMember.objects.create(
        project=project, member=user, workspace=workspace, role=5
    )
    return user


@pytest.fixture
def guest_client(guest):
    client = APIClient()
    client.force_authenticate(user=guest)
    return client


def _make_issue(name, project, workspace, author):
    """Create an issue with a deterministic ``created_by``.

    ``BaseModel.save`` auto-sets ``created_by`` from the current request user
    (None/anonymous under tests), so a ``created_by=`` kwarg to ``create`` is
    overwritten. Passing ``created_by_id`` to ``save`` sets it explicitly.
    """
    issue = Issue(name=name, project=project, workspace=workspace)
    issue.save(created_by_id=author.id)
    return issue


@pytest.fixture
def own_issue(db, workspace, project, guest):
    """An issue authored by the guest."""
    return _make_issue("Guest's own issue", project, workspace, guest)


@pytest.fixture
def foreign_issue(db, workspace, project, create_user):
    """An issue authored by someone other than the guest."""
    return _make_issue("Someone else's issue", project, workspace, create_user)


@pytest.mark.contract
class TestIssueListGuestScope:
    """A restricted guest must only get back issues they authored."""

    @pytest.mark.django_db
    def test_guest_cannot_read_foreign_issue(
        self, guest_client, workspace, project, own_issue, foreign_issue
    ):
        url = LIST_URL.format(slug=workspace.slug, project_id=project.id)
        response = guest_client.get(url, {"issues": f"{own_issue.id},{foreign_issue.id}"})

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        returned_ids = {str(row["id"]) for row in response.data}
        assert str(own_issue.id) in returned_ids
        assert str(foreign_issue.id) not in returned_ids, (
            f"Guest read a foreign issue: {response.data!r}"
        )

    @pytest.mark.django_db
    def test_project_member_reads_all_requested_issues(
        self, session_client, workspace, project, own_issue, foreign_issue
    ):
        """Positive control: a full member (owner) still gets every requested issue."""
        url = LIST_URL.format(slug=workspace.slug, project_id=project.id)
        response = session_client.get(url, {"issues": f"{own_issue.id},{foreign_issue.id}"})

        assert response.status_code == status.HTTP_200_OK
        returned_ids = {str(row["id"]) for row in response.data}
        assert {str(own_issue.id), str(foreign_issue.id)} <= returned_ids

    @pytest.mark.django_db
    def test_guest_with_view_all_reads_all_requested_issues(
        self, guest_client, workspace, project, own_issue, foreign_issue
    ):
        """When guest_view_all_features is enabled, the guest sees all requested issues."""
        project.guest_view_all_features = True
        project.save(update_fields=["guest_view_all_features"])

        url = LIST_URL.format(slug=workspace.slug, project_id=project.id)
        response = guest_client.get(url, {"issues": f"{own_issue.id},{foreign_issue.id}"})

        assert response.status_code == status.HTTP_200_OK
        returned_ids = {str(row["id"]) for row in response.data}
        assert {str(own_issue.id), str(foreign_issue.id)} <= returned_ids
