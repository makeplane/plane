# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import Cycle, Module, Project, ProjectMember, User, WorkspaceMember


def make_user(email=None, role_ws=None, workspace=None, project=None, role_project=15):
    user = User.objects.create_user(
        email=email or f"{uuid4().hex[:12]}@example.com",
        username=f"u-{uuid4().hex[:12]}",
    )
    if workspace is not None:
        WorkspaceMember.objects.create(
            workspace=workspace, member=user, role=role_ws if role_ws is not None else 15, is_active=True
        )
    if project is not None:
        ProjectMember.objects.create(project=project, member=user, role=role_project, is_active=True)
    return user


def make_project(workspace, owner):
    project = Project.objects.create(
        name=f"Project {uuid4().hex[:6]}",
        identifier=uuid4().hex[:6].upper(),
        workspace=workspace,
        created_by=owner,
    )
    ProjectMember.objects.create(project=project, member=owner, role=20, is_active=True)
    return project


def cycles_url(slug):
    return f"/api/workspaces/{slug}/cycles/"


def modules_url(slug):
    return f"/api/workspaces/{slug}/modules/"


@pytest.fixture
def project(db, workspace, create_user):
    return make_project(workspace, create_user)


@pytest.fixture
def foreign_project(db, workspace):
    """A project of the same workspace the session user is NOT a member of."""
    outsider = make_user(workspace=workspace)
    return make_project(workspace, outsider)


@pytest.mark.contract
class TestWorkspaceCyclesScoping:
    @pytest.mark.django_db
    def test_hides_cycles_of_projects_the_user_is_not_member_of(
        self, session_client, workspace, project, foreign_project, create_user
    ):
        mine = Cycle.objects.create(name="mine", project=project, workspace=workspace, owned_by=create_user)
        # owned_by is just a user FK — membership is what gates visibility
        Cycle.objects.create(name="foreign", project=foreign_project, workspace=workspace, owned_by=create_user)

        response = session_client.get(cycles_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert [str(c["id"]) for c in response.data] == [str(mine.id)]

    @pytest.mark.django_db
    def test_inactive_membership_hides_project_cycles(self, session_client, workspace, project, create_user):
        Cycle.objects.create(name="c", project=project, workspace=workspace, owned_by=create_user)
        ProjectMember.objects.filter(project=project, member=create_user).update(is_active=False)

        response = session_client.get(cycles_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    @pytest.mark.django_db
    def test_project_guest_still_sees_their_project_cycles(self, session_client, workspace, project, create_user):
        cycle = Cycle.objects.create(name="c", project=project, workspace=workspace, owned_by=create_user)
        guest = make_user(workspace=workspace, role_ws=5, project=project, role_project=5)
        session_client.force_authenticate(user=guest)

        response = session_client.get(cycles_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert [str(c["id"]) for c in response.data] == [str(cycle.id)]


@pytest.mark.contract
class TestWorkspaceModulesScoping:
    @pytest.mark.django_db
    def test_hides_modules_of_projects_the_user_is_not_member_of(
        self, session_client, workspace, project, foreign_project, create_user
    ):
        mine = Module.objects.create(name="mine", project=project, workspace=workspace)
        Module.objects.create(name="foreign", project=foreign_project, workspace=workspace)

        response = session_client.get(modules_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert [str(m["id"]) for m in response.data] == [str(mine.id)]

    @pytest.mark.django_db
    def test_inactive_membership_hides_project_modules(self, session_client, workspace, project, create_user):
        Module.objects.create(name="m", project=project, workspace=workspace)
        ProjectMember.objects.filter(project=project, member=create_user).update(is_active=False)

        response = session_client.get(modules_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    @pytest.mark.django_db
    def test_project_member_still_sees_their_project_modules(self, session_client, workspace, project, create_user):
        module = Module.objects.create(name="m", project=project, workspace=workspace)

        response = session_client.get(modules_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK
        assert [str(m["id"]) for m in response.data] == [str(module.id)]
