# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import Project, ProjectMember, User, WorkspaceMember


def _user(prefix):
    uid = uuid4().hex[:8]
    return User.objects.create(email=f"{prefix}-{uid}@plane.so", username=f"{prefix}_{uid}")


@pytest.fixture
def outsider(db):
    return _user("outsider")


@pytest.fixture
def inactive_member(db, workspace):
    user = _user("inactive")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15, is_active=False)
    return user


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(name="P", identifier="PP", workspace=workspace)
    ProjectMember.objects.create(project=project, member=create_user, role=20)
    return project


@pytest.mark.contract
class TestProjectLeadMembership:
    @pytest.mark.django_db
    @pytest.mark.parametrize("field", ["project_lead", "default_assignee"])
    @pytest.mark.parametrize("who", ["outsider", "inactive_member"])
    def test_create_rejects_non_member(self, request, session_client, workspace, field, who):
        user = request.getfixturevalue(who)
        resp = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/",
            {"name": "X", "identifier": "XX", field: str(user.id)},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert field in resp.data
        assert not Project.objects.filter(identifier="XX").exists()
        assert not ProjectMember.objects.filter(member=user).exists()

    @pytest.mark.django_db
    @pytest.mark.parametrize("field", ["project_lead", "default_assignee"])
    def test_update_rejects_non_member(self, session_client, workspace, project, outsider, field):
        resp = session_client.patch(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/",
            {field: str(outsider.id)},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        project.refresh_from_db()
        assert getattr(project, f"{field}_id") is None

    @pytest.mark.django_db
    def test_create_accepts_active_member_lead(self, session_client, workspace):
        lead = _user("lead")
        WorkspaceMember.objects.create(workspace=workspace, member=lead, role=15)
        resp = session_client.post(
            f"/api/workspaces/{workspace.slug}/projects/",
            {"name": "Y", "identifier": "YY", "project_lead": str(lead.id)},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert ProjectMember.objects.filter(project_id=resp.data["id"], member=lead, role=20).exists()

    @pytest.mark.django_db
    def test_update_allows_unchanged_inactive_assignment(self, session_client, workspace, project, inactive_member):
        project.project_lead = inactive_member
        project.save()
        resp = session_client.patch(
            f"/api/workspaces/{workspace.slug}/projects/{project.id}/",
            {"project_lead": str(inactive_member.id), "name": "Renamed"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        project.refresh_from_db()
        assert project.name == "Renamed"
        assert project.project_lead_id == inactive_member.id
