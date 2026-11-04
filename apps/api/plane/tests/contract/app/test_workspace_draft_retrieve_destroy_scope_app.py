# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``WorkspaceDraftIssueViewSet.retrieve`` / ``destroy``.

Drafts are private to their creator: ``list``, ``partial_update`` and
``create_draft_to_issue`` all scope the lookup to ``created_by=request.user``.
Two sibling actions did not follow the same rule:

* ``retrieve`` was decorated with ``allowed_roles=[ROLE.ADMIN]`` and a creator
  check against the ``Issue`` model. A draft id never exists in the ``Issue``
  table, so the creator shortcut never matched and a workspace MEMBER got a
  403 when opening their *own* draft.
* ``destroy`` looked the draft up with only ``workspace__slug`` + ``pk``, so a
  workspace ADMIN could delete another user's private draft (one they cannot
  even list or open).

Both actions now mirror ``partial_update``: ADMIN and MEMBER are allowed, and
the lookup is scoped to the requesting user's own drafts (404 otherwise).
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import DraftIssue, User, WorkspaceMember


def draft_url(slug, draft_id):
    return f"/api/workspaces/{slug}/draft-issues/{draft_id}/"


@pytest.fixture(autouse=True)
def _no_soft_delete_task(db):
    """``draft.delete()`` cascades via a Celery task (soft-delete); stub the broker."""
    with mock.patch("plane.db.mixins.soft_delete_related_objects"):
        yield


@pytest.fixture
def member(db, workspace):
    """A workspace MEMBER (role 15)."""
    uid = uuid4().hex[:8]
    user = User.objects.create(email=f"member-{uid}@plane.so", username=f"member_{uid}")
    user.set_password("test-password")
    user.save()
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    return user


@pytest.fixture
def member_client(member):
    client = APIClient()
    client.force_authenticate(user=member)
    return client


def _make_draft(name, workspace, author):
    """Create a draft with a deterministic ``created_by``.

    ``BaseModel.save`` auto-sets ``created_by`` from the current request user
    (None under tests), so pass ``created_by_id`` to ``save`` explicitly.
    """
    draft = DraftIssue(name=name, workspace=workspace)
    draft.save(created_by_id=author.id)
    return draft


@pytest.fixture
def member_draft(db, workspace, member):
    return _make_draft("Member's private draft", workspace, member)


@pytest.fixture
def admin_draft(db, workspace, create_user):
    return _make_draft("Admin's private draft", workspace, create_user)


@pytest.mark.contract
class TestWorkspaceDraftRetrieve:
    @pytest.mark.django_db
    def test_member_can_retrieve_own_draft(self, member_client, workspace, member_draft):
        response = member_client.get(draft_url(workspace.slug, member_draft.id))

        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert str(response.data["id"]) == str(member_draft.id)

    @pytest.mark.django_db
    def test_member_cannot_retrieve_another_users_draft(self, member_client, workspace, admin_draft):
        response = member_client.get(draft_url(workspace.slug, admin_draft.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_admin_can_retrieve_own_draft(self, session_client, workspace, admin_draft):
        response = session_client.get(draft_url(workspace.slug, admin_draft.id))

        assert response.status_code == status.HTTP_200_OK
        assert str(response.data["id"]) == str(admin_draft.id)


@pytest.mark.contract
class TestWorkspaceDraftDestroy:
    @pytest.mark.django_db
    def test_admin_cannot_delete_another_users_draft(self, session_client, workspace, member_draft):
        response = session_client.delete(draft_url(workspace.slug, member_draft.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert DraftIssue.objects.filter(pk=member_draft.id).exists()

    @pytest.mark.django_db
    def test_member_can_delete_own_draft(self, member_client, workspace, member_draft):
        response = member_client.delete(draft_url(workspace.slug, member_draft.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not DraftIssue.objects.filter(pk=member_draft.id).exists()

    @pytest.mark.django_db
    def test_member_cannot_delete_another_users_draft(self, member_client, workspace, admin_draft):
        response = member_client.delete(draft_url(workspace.slug, admin_draft.id))

        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert DraftIssue.objects.filter(pk=admin_draft.id).exists()
