# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for project member preference ownership.

Preferences are personal: only the member who owns them may read or change
them, through the preferences endpoint or the member-detail endpoint.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, User, WorkspaceMember

PREF_URL = "/api/workspaces/{slug}/projects/{project_id}/preferences/member/{member_id}/"
MEMBER_URL = "/api/workspaces/{slug}/projects/{project_id}/members/{pk}/"
PERSONAL_FIELDS = ("preferences", "view_props", "default_props")


def _member(workspace, project, *, role):
    unique = uuid4().hex[:8]
    user = User.objects.create(email=f"pref-{role}-{unique}@plane.so", username=f"pref_{role}_{unique}")
    user.set_password("test-password")
    user.save()
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role, is_active=True)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=role, is_active=True)
    return user


def _client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Pref Project", identifier="PR", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20, is_active=True)
    return project


@pytest.mark.contract
@pytest.mark.django_db
class TestMemberPreferenceScope:
    """A member may only read/modify their OWN project preferences."""

    def test_member_cannot_read_others_preferences(self, workspace, project, create_user):
        other = _member(workspace, project, role=15)
        response = _client(other).get(
            PREF_URL.format(slug=workspace.slug, project_id=project.id, member_id=create_user.id)
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_member_cannot_modify_others_preferences(self, workspace, project, create_user):
        other = _member(workspace, project, role=15)
        owner_member = ProjectMember.objects.get(project=project, member=create_user)
        original = owner_member.preferences

        response = _client(other).patch(
            PREF_URL.format(slug=workspace.slug, project_id=project.id, member_id=create_user.id),
            {"pinned": ["changed"]},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        owner_member.refresh_from_db()
        assert owner_member.preferences == original, "Another member's preferences were modified"

    def test_member_can_read_own_preferences(self, workspace, project):
        member = _member(workspace, project, role=15)
        member_record = ProjectMember.objects.get(project=project, member=member)
        member_record.preferences = {"pinned": ["existing"]}
        member_record.save(update_fields=["preferences"])

        response = _client(member).get(
            PREF_URL.format(slug=workspace.slug, project_id=project.id, member_id=member.id)
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        # Assert the seeded value is actually served, not just that the route 200s —
        # a queryset regression that returned the wrong member would still pass on
        # status alone.
        assert response.data["preferences"] == {"pinned": ["existing"]}
        assert str(response.data["member_id"]) == str(member.id)

    def test_member_can_modify_own_preferences(self, workspace, project):
        member = _member(workspace, project, role=15)
        member_record = ProjectMember.objects.get(project=project, member=member)
        original = dict(member_record.preferences)

        response = _client(member).patch(
            PREF_URL.format(slug=workspace.slug, project_id=project.id, member_id=member.id),
            {"pinned": ["my-view"]},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert response.data["preferences"]["pinned"] == ["my-view"]

        # The write must actually persist — a no-op PATCH would still return 200.
        member_record.refresh_from_db()
        assert member_record.preferences["pinned"] == ["my-view"]

        # ProjectMemberPreferenceSerializer.validate_preferences merges into the
        # existing dict rather than replacing it, so the untouched default keys
        # must survive. Pins that semantic against a wholesale-replace regression.
        for key, value in original.items():
            assert member_record.preferences[key] == value


@pytest.mark.contract
@pytest.mark.django_db
class TestMemberDetailPreferenceScope:
    """The member-detail endpoint only exposes and accepts personal fields for the caller's own row."""

    def test_member_detail_omits_other_members_personal_fields(self, workspace, project, create_user):
        other = _member(workspace, project, role=15)
        owner_member = ProjectMember.objects.get(project=project, member=create_user)

        response = _client(other).get(MEMBER_URL.format(slug=workspace.slug, project_id=project.id, pk=owner_member.id))
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        for field in PERSONAL_FIELDS:
            assert field not in response.data

    def test_member_detail_returns_own_preferences(self, workspace, project):
        member = _member(workspace, project, role=15)
        member_record = ProjectMember.objects.get(project=project, member=member)

        response = _client(member).get(
            MEMBER_URL.format(slug=workspace.slug, project_id=project.id, pk=member_record.id)
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["preferences"] == member_record.preferences

    @pytest.mark.parametrize("field", PERSONAL_FIELDS)
    def test_admin_cannot_update_other_members_personal_fields(self, workspace, project, create_user, field):
        member = _member(workspace, project, role=15)
        member_record = ProjectMember.objects.get(project=project, member=member)
        original = getattr(member_record, field)

        response = _client(create_user).patch(
            MEMBER_URL.format(slug=workspace.slug, project_id=project.id, pk=member_record.id),
            {field: {"pinned": ["changed"]}, "role": 5},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        member_record.refresh_from_db()
        assert getattr(member_record, field) == original
        assert member_record.role == 15

    def test_member_detail_update_omits_other_members_personal_fields(self, workspace, project, create_user):
        member = _member(workspace, project, role=15)
        member_record = ProjectMember.objects.get(project=project, member=member)

        response = _client(create_user).patch(
            MEMBER_URL.format(slug=workspace.slug, project_id=project.id, pk=member_record.id),
            {"role": 5},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert response.data["role"] == 5
        for field in PERSONAL_FIELDS:
            assert field not in response.data
