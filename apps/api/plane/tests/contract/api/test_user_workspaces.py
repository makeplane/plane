# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the current user's workspaces endpoint.

GET /api/v1/users/me/workspaces/
"""

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import Workspace, WorkspaceMember

URL = "/api/v1/users/me/workspaces/"


@pytest.fixture
def other_workspace(db, create_bot_user):
    """A workspace the requesting user is not a member of."""
    return Workspace.objects.create(
        name="Other Workspace",
        owner=create_bot_user,
        slug="other-workspace",
    )


@pytest.fixture
def inactive_workspace(db, create_user, create_bot_user):
    """A workspace the requesting user's membership has been deactivated on."""
    workspace = Workspace.objects.create(
        name="Inactive Workspace",
        owner=create_bot_user,
        slug="inactive-workspace",
    )
    WorkspaceMember.objects.create(
        workspace=workspace,
        member=create_user,
        role=20,
        is_active=False,
    )
    return workspace


@pytest.fixture
def deleted_workspace(db, create_user, create_bot_user):
    """A soft deleted workspace the requesting user still has an active membership row on."""
    workspace = Workspace.objects.create(
        name="Deleted Workspace",
        owner=create_bot_user,
        slug="deleted-workspace",
    )
    WorkspaceMember.objects.create(
        workspace=workspace,
        member=create_user,
        role=20,
        is_active=True,
    )
    # Stamp deleted_at directly instead of calling delete(), which queues a Celery
    # task to soft delete related objects.
    Workspace.all_objects.filter(id=workspace.id).update(deleted_at=timezone.now())
    return workspace


@pytest.mark.contract
class TestUserWorkspaces:
    @pytest.mark.django_db
    def test_returns_workspaces_of_the_current_user(self, api_key_client, workspace):
        response = api_key_client.get(URL)
        assert response.status_code == status.HTTP_200_OK
        slugs = {item["slug"] for item in response.data}
        assert workspace.slug in slugs

    @pytest.mark.django_db
    def test_returns_only_lite_fields(self, api_key_client, workspace):
        response = api_key_client.get(URL)
        assert response.status_code == status.HTTP_200_OK
        item = response.data[0]
        assert set(item.keys()) == {"id", "name", "slug"}

    @pytest.mark.django_db
    def test_excludes_workspaces_the_user_is_not_a_member_of(self, api_key_client, workspace, other_workspace):
        response = api_key_client.get(URL)
        assert response.status_code == status.HTTP_200_OK
        slugs = {item["slug"] for item in response.data}
        assert other_workspace.slug not in slugs

    @pytest.mark.django_db
    def test_excludes_inactive_memberships(self, api_key_client, workspace, inactive_workspace):
        response = api_key_client.get(URL)
        assert response.status_code == status.HTTP_200_OK
        slugs = {item["slug"] for item in response.data}
        assert inactive_workspace.slug not in slugs

    @pytest.mark.django_db
    def test_excludes_soft_deleted_workspaces(self, api_key_client, workspace, deleted_workspace):
        response = api_key_client.get(URL)
        assert response.status_code == status.HTTP_200_OK
        slugs = {item["slug"] for item in response.data}
        assert deleted_workspace.slug not in slugs

    @pytest.mark.django_db
    def test_requires_authentication(self, api_client, workspace):
        response = api_client.get(URL)
        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )
