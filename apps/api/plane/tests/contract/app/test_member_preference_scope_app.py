# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ProjectMemberPreferenceEndpoint ownership scoping.

Regression coverage for GHSA-gx67-r6wp-3357. The endpoint takes a ``member_id``
URL parameter and loaded the ``ProjectMember`` by ``(project_id, member_id,
workspace__slug)`` with no check that ``member_id`` is the caller — so any project
member (including a Guest) could read and modify any other member's per-project
preferences.

The fix rejects any request where ``member_id != request.user.id`` (403);
preferences are personal.
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import Project, ProjectMember, User, WorkspaceMember

PREF_URL = "/api/workspaces/{slug}/projects/{project_id}/preferences/member/{member_id}/"


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
        attacker = _member(workspace, project, role=15)
        # attacker requests the admin (create_user)'s preferences
        response = _client(attacker).get(
            PREF_URL.format(slug=workspace.slug, project_id=project.id, member_id=create_user.id)
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    def test_member_cannot_modify_others_preferences(self, workspace, project, create_user):
        attacker = _member(workspace, project, role=15)
        victim_member = ProjectMember.objects.get(project=project, member=create_user)
        original = victim_member.preferences

        response = _client(attacker).patch(
            PREF_URL.format(slug=workspace.slug, project_id=project.id, member_id=create_user.id),
            {"pinned": ["hacked"]},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        victim_member.refresh_from_db()
        assert victim_member.preferences == original, "Another member's preferences were modified"

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
