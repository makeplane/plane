# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""The live server asks this endpoint on every collaboration socket whether the user may open the page."""

import uuid

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Page, Project, ProjectMember, ProjectPage, User, Workspace, WorkspaceMember


def _url(slug, page_id, action="view"):
    return f"/api/workspaces/{slug}/pages/{page_id}/live-access/?action={action}"


def _other_user():
    return User.objects.create(email=f"o-{uuid.uuid4().hex[:8]}@plane.so", username=uuid.uuid4().hex[:8])


def _project(workspace, identifier, guest_view_all_features=False):
    return Project.objects.create(
        name=identifier, identifier=identifier, workspace=workspace, guest_view_all_features=guest_view_all_features
    )


def _page(workspace, project, owner, access=Page.PUBLIC_ACCESS):
    page = Page.objects.create(workspace=workspace, owned_by=owner, access=access, name="Page")
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    return page


def _join(workspace, project, user, role):
    ProjectMember.objects.create(workspace=workspace, project=project, member=user, role=role)


@pytest.mark.contract
@pytest.mark.django_db
class TestPageLiveAccess:
    @pytest.mark.parametrize("role,read_only", [(20, False), (15, False), (5, True)])
    def test_member_of_public_page(self, session_client, workspace, create_user, role, read_only):
        project = _project(workspace, "LVA")
        _join(workspace, project, create_user, role)
        page = _page(workspace, project, _other_user())
        # guests need guest_view_all_features to see someone else's page
        Project.objects.filter(pk=project.pk).update(guest_view_all_features=True)

        response = session_client.get(_url(workspace.slug, page.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"project_id": str(project.id), "read_only": read_only}

    def test_non_member_denied(self, session_client, workspace, create_user):
        project = _project(workspace, "LVB")
        page = _page(workspace, project, _other_user())

        response = session_client.get(_url(workspace.slug, page.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_member_of_other_project_denied(self, session_client, workspace, create_user):
        mine, theirs = _project(workspace, "LVC"), _project(workspace, "LVD")
        _join(workspace, mine, create_user, 20)
        page = _page(workspace, theirs, _other_user())

        assert session_client.get(_url(workspace.slug, page.id)).status_code == status.HTTP_404_NOT_FOUND

    def test_inactive_member_denied(self, session_client, workspace, create_user):
        project = _project(workspace, "LVE")
        _join(workspace, project, create_user, 20)
        ProjectMember.objects.filter(project=project, member=create_user).update(is_active=False)
        page = _page(workspace, project, _other_user())

        assert session_client.get(_url(workspace.slug, page.id)).status_code == status.HTTP_404_NOT_FOUND

    def test_soft_deleted_project_denied(self, session_client, workspace, create_user):
        project = _project(workspace, "LVQ")
        _join(workspace, project, create_user, 20)
        page = _page(workspace, project, _other_user())
        Project.objects.filter(pk=project.pk).update(deleted_at=timezone.now())

        assert session_client.get(_url(workspace.slug, page.id)).status_code == status.HTTP_404_NOT_FOUND

    def test_soft_deleted_membership_denied(self, session_client, workspace, create_user):
        project = _project(workspace, "LVR")
        _join(workspace, project, create_user, 20)
        page = _page(workspace, project, _other_user())
        ProjectMember.objects.filter(project=project, member=create_user).update(deleted_at=timezone.now())

        assert session_client.get(_url(workspace.slug, page.id)).status_code == status.HTTP_404_NOT_FOUND

    def test_view_prefers_the_writable_link_of_a_multi_project_page(self, session_client, workspace, create_user):
        guest_project = _project(workspace, "LVS", guest_view_all_features=True)
        admin_project = _project(workspace, "LVT")
        _join(workspace, guest_project, create_user, 5)
        _join(workspace, admin_project, create_user, 20)
        page = _page(workspace, guest_project, _other_user())
        ProjectPage.objects.create(workspace=workspace, project=admin_project, page=page)

        response = session_client.get(_url(workspace.slug, page.id))

        assert response.json() == {"project_id": str(admin_project.id), "read_only": False}

    def test_other_workspace_slug_denied(self, session_client, workspace, create_user):
        project = _project(workspace, "LVF")
        _join(workspace, project, create_user, 20)
        page = _page(workspace, project, _other_user())
        other = Workspace.objects.create(name="Other", slug="other-ws", owner=create_user)
        WorkspaceMember.objects.create(workspace=other, member=create_user, role=20)

        assert session_client.get(_url(other.slug, page.id)).status_code == status.HTTP_404_NOT_FOUND

    def test_private_page_of_another_user_denied(self, session_client, workspace, create_user):
        project = _project(workspace, "LVG")
        _join(workspace, project, create_user, 20)
        page = _page(workspace, project, _other_user(), access=Page.PRIVATE_ACCESS)

        assert session_client.get(_url(workspace.slug, page.id)).status_code == status.HTTP_404_NOT_FOUND

    def test_owner_of_private_page_allowed_and_can_edit(self, session_client, workspace, create_user):
        project = _project(workspace, "LVH")
        _join(workspace, project, create_user, 5)
        page = _page(workspace, project, create_user, access=Page.PRIVATE_ACCESS)

        response = session_client.get(_url(workspace.slug, page.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["read_only"] is False

    def test_guest_denied_other_users_page_without_guest_view_all(self, session_client, workspace, create_user):
        project = _project(workspace, "LVI")
        _join(workspace, project, create_user, 5)
        page = _page(workspace, project, _other_user())

        assert session_client.get(_url(workspace.slug, page.id)).status_code == status.HTTP_404_NOT_FOUND

    def test_soft_deleted_project_link_denied(self, session_client, workspace, create_user):
        project = _project(workspace, "LVJ")
        _join(workspace, project, create_user, 20)
        page = _page(workspace, project, _other_user())
        ProjectPage.objects.filter(page=page).delete()

        assert session_client.get(_url(workspace.slug, page.id)).status_code == status.HTTP_404_NOT_FOUND

    def test_guest_with_view_all_may_view_read_only_but_not_edit(self, session_client, workspace, create_user):
        project = _project(workspace, "LVK", guest_view_all_features=True)
        _join(workspace, project, create_user, 5)
        page = _page(workspace, project, _other_user())

        view = session_client.get(_url(workspace.slug, page.id))
        edit = session_client.get(_url(workspace.slug, page.id, "edit"))

        assert view.json() == {"project_id": str(project.id), "read_only": True}
        assert edit.status_code == status.HTTP_404_NOT_FOUND

    def test_edit_answers_project_only_for_a_user_who_may_change_the_page(self, session_client, workspace, create_user):
        project = _project(workspace, "LVL")
        _join(workspace, project, create_user, 15)
        page = _page(workspace, project, _other_user())

        response = session_client.get(_url(workspace.slug, page.id, "edit"))

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"project_id": str(project.id)}

    def test_edit_denied_for_private_page_of_another_user(self, session_client, workspace, create_user):
        project = _project(workspace, "LVM")
        _join(workspace, project, create_user, 20)
        page = _page(workspace, project, _other_user(), access=Page.PRIVATE_ACCESS)

        assert session_client.get(_url(workspace.slug, page.id, "edit")).status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.parametrize("action", ["", "bogus", "EDIT"])
    def test_invalid_or_missing_action_is_a_400(self, session_client, workspace, create_user, action):
        project = _project(workspace, "LVN")
        _join(workspace, project, create_user, 20)
        page = _page(workspace, project, create_user)

        assert session_client.get(_url(workspace.slug, page.id, action)).status_code == status.HTTP_400_BAD_REQUEST
        bare = f"/api/workspaces/{workspace.slug}/pages/{page.id}/live-access/"
        assert session_client.get(bare).status_code == status.HTTP_400_BAD_REQUEST
