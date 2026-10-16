# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for project membership on workspace drafts (INFRA-1125, INFRA-1136).

``WorkspaceDraftIssueViewSet`` checks workspace membership only, while the
draft's project comes from the request. Creating or updating a draft with a
project, and converting a draft to an issue, now require the caller to be an
active ADMIN/MEMBER of that project in the URL workspace — the same rule
``IssueViewSet.create`` enforces.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import DraftIssue, Issue, Project, ProjectMember, User, Workspace, WorkspaceMember


def drafts_url(slug):
    return f"/api/workspaces/{slug}/draft-issues/"


def draft_url(slug, draft_id):
    return f"/api/workspaces/{slug}/draft-issues/{draft_id}/"


def draft_to_issue_url(slug, draft_id):
    return f"/api/workspaces/{slug}/draft-to-issue/{draft_id}/"


@pytest.fixture(autouse=True)
def _no_activity(db):
    with (
        mock.patch("plane.app.views.workspace.draft.issue_activity"),
        mock.patch("plane.app.views.workspace.draft.base_host", return_value="http://testserver"),
        mock.patch("plane.db.mixins.soft_delete_related_objects"),
    ):
        yield


def _project(workspace, identifier, owner):
    project = Project(name=f"Project {identifier}", identifier=identifier, workspace=workspace)
    project.save(created_by_id=owner.id)
    return project


@pytest.fixture
def member(db, workspace):
    """A workspace MEMBER (role 15)."""
    uid = uuid4().hex[:8]
    user = User.objects.create(email=f"member-{uid}@plane.so", username=f"member_{uid}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    return user


@pytest.fixture
def member_client(member):
    client = APIClient()
    client.force_authenticate(user=member)
    return client


@pytest.fixture
def projects(db, workspace, create_user, member):
    """``own``: member is a project MEMBER. ``guest``: project GUEST.
    ``other``: not a member. ``foreign``: a project MEMBER, but in another workspace."""
    own = _project(workspace, "OWN", create_user)
    ProjectMember.objects.create(project=own, member=member, workspace=workspace, role=15)
    guest = _project(workspace, "GST", create_user)
    ProjectMember.objects.create(project=guest, member=member, workspace=workspace, role=5)
    other = _project(workspace, "OTH", create_user)

    other_ws = Workspace.objects.create(name="Other", slug=f"other-{uuid4().hex[:8]}", owner=create_user)
    WorkspaceMember.objects.create(workspace=other_ws, member=member, role=15)
    foreign = _project(other_ws, "FOR", create_user)
    ProjectMember.objects.create(project=foreign, member=member, workspace=other_ws, role=15)
    return {"own": own, "guest": guest, "other": other, "foreign": foreign}


def _draft(workspace, project, author, name="Draft"):
    draft = DraftIssue(name=name, workspace=workspace, project=project)
    draft.save(created_by_id=author.id)
    return draft


@pytest.mark.contract
class TestDraftCreateProjectMembership:
    @pytest.mark.django_db
    @pytest.mark.parametrize("key", ["guest", "other", "foreign"])
    def test_cannot_create_draft_in_project_without_write_access(self, member_client, workspace, projects, key):
        response = member_client.post(
            drafts_url(workspace.slug), {"name": "x", "project_id": str(projects[key].id)}, format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not DraftIssue.objects.filter(name="x").exists()

    @pytest.mark.django_db
    def test_can_create_draft_in_own_project(self, member_client, workspace, projects):
        response = member_client.post(
            drafts_url(workspace.slug), {"name": "x", "project_id": str(projects["own"].id)}, format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert DraftIssue.objects.get(name="x").project_id == projects["own"].id


@pytest.mark.contract
class TestDraftUpdateProjectMembership:
    @pytest.mark.django_db
    def test_cannot_update_draft_with_other_project_id(self, member_client, workspace, member, projects):
        draft = _draft(workspace, projects["own"], member)

        response = member_client.patch(
            draft_url(workspace.slug, draft.id), {"name": "y", "project_id": str(projects["other"].id)}, format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        draft.refresh_from_db()
        assert draft.name == "Draft"

    @pytest.mark.django_db
    def test_project_key_cannot_move_draft(self, member_client, workspace, member, projects):
        draft = _draft(workspace, projects["own"], member)

        response = member_client.patch(
            draft_url(workspace.slug, draft.id), {"project": str(projects["other"].id)}, format="json"
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        draft.refresh_from_db()
        assert draft.project_id == projects["own"].id

    @pytest.mark.django_db
    def test_can_update_draft_in_own_project(self, member_client, workspace, member, projects):
        draft = _draft(workspace, projects["own"], member)

        response = member_client.patch(draft_url(workspace.slug, draft.id), {"name": "y"}, format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        draft.refresh_from_db()
        assert draft.name == "y"


@pytest.mark.contract
class TestDraftToIssueProjectMembership:
    @pytest.mark.django_db
    @pytest.mark.parametrize("key", ["guest", "other"])
    def test_cannot_convert_draft_into_project_without_write_access(
        self, member_client, workspace, member, projects, key
    ):
        # e.g. a draft saved before this check, or membership since revoked
        draft = _draft(workspace, projects[key], member)

        response = member_client.post(draft_to_issue_url(workspace.slug, draft.id), {"name": "Issue"}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not Issue.objects.filter(name="Issue").exists()
        assert DraftIssue.objects.filter(pk=draft.id).exists()

    @pytest.mark.django_db
    def test_can_convert_draft_in_own_project(self, member_client, workspace, member, projects):
        draft = _draft(workspace, projects["own"], member)

        response = member_client.post(draft_to_issue_url(workspace.slug, draft.id), {"name": "Issue"}, format="json")

        assert response.status_code == status.HTTP_201_CREATED, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert Issue.objects.get(name="Issue").project_id == projects["own"].id
