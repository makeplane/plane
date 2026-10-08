# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the public REST API ``GenericAssetEndpoint``.

Regression coverage for the cross-workspace asset IDOR (the unfixed
external-API sibling of CVE-2026-46558 / GHSA-qw87-v5w3-6vxx). The endpoint
must reject any caller that is not an active member of the workspace named in
the URL slug, regardless of the workspace their Personal Access Token came
from.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import FileAsset, User, Workspace, WorkspaceMember


@pytest.fixture
def victim_user(db):
    """A user that owns a separate workspace the attacker is not part of."""
    unique_id = uuid4().hex[:8]
    user = User.objects.create(
        email=f"victim-{unique_id}@plane.so",
        username=f"victim_{unique_id}",
        first_name="Victim",
        last_name="User",
    )
    user.set_password("test-password")
    user.save()
    return user


@pytest.fixture
def victim_workspace(db, victim_user):
    """A workspace whose only active member is ``victim_user``.

    The attacker (``create_user``, who authenticates ``api_key_client``) is
    deliberately NOT a member here.
    """
    workspace = Workspace.objects.create(
        name="Victim Workspace",
        owner=victim_user,
        slug="victim-workspace",
    )
    WorkspaceMember.objects.create(workspace=workspace, member=victim_user, role=20)
    return workspace


@pytest.fixture
def victim_asset(db, victim_workspace, victim_user):
    """An uploaded attachment that lives inside the victim workspace.

    ``storage_metadata`` is pre-populated so the PATCH handler does not enqueue
    the metadata Celery task during the test.
    """
    return FileAsset.objects.create(
        attributes={"name": "secret.pdf", "type": "application/pdf", "size": 1024},
        asset=f"{victim_workspace.id}/secret.pdf",
        size=1024,
        workspace=victim_workspace,
        created_by=victim_user,
        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
        is_uploaded=True,
        storage_metadata={"size": 1024},
    )


@pytest.mark.contract
class TestGenericAssetCrossWorkspaceIDOR:
    """A PAT holder must not reach assets in a workspace they don't belong to."""

    def detail_url(self, slug, asset_id):
        return f"/api/v1/workspaces/{slug}/assets/{asset_id}/"

    def list_url(self, slug):
        return f"/api/v1/workspaces/{slug}/assets/"

    @pytest.mark.django_db
    def test_get_cross_workspace_asset_returns_403(self, api_key_client, victim_workspace, victim_asset):
        """GET on another workspace's asset must be forbidden, not return a
        presigned download URL."""
        url = self.detail_url(victim_workspace.slug, victim_asset.id)

        with mock.patch("plane.api.views.asset.S3Storage") as mock_storage:
            mock_storage.return_value.generate_presigned_url.return_value = "https://signed.example/download"
            response = api_key_client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN, f"Got {response.status_code}: {response.data!r}"
        # The S3 download URL must never be minted for a non-member.
        mock_storage.return_value.generate_presigned_url.assert_not_called()

    @pytest.mark.django_db
    def test_post_cross_workspace_asset_returns_403(self, api_key_client, victim_workspace):
        """POST (upload) into another workspace must be forbidden and must not
        plant an asset row in the victim workspace."""
        url = self.list_url(victim_workspace.slug)
        payload = {"name": "evil.pdf", "type": "application/pdf", "size": 1024}

        with mock.patch("plane.api.views.asset.S3Storage") as mock_storage:
            mock_storage.return_value.generate_presigned_post.return_value = {"url": "x", "fields": {}}
            response = api_key_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN, f"Got {response.status_code}: {response.data!r}"
        assert FileAsset.objects.filter(workspace=victim_workspace).count() == 0

    @pytest.mark.django_db
    def test_patch_cross_workspace_asset_returns_403(self, api_key_client, victim_workspace, victim_asset):
        """PATCH on another workspace's asset must be forbidden and must leave
        the asset untouched."""
        url = self.detail_url(victim_workspace.slug, victim_asset.id)

        response = api_key_client.patch(url, {"is_uploaded": False}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN, f"Got {response.status_code}: {response.data!r}"
        victim_asset.refresh_from_db()
        assert victim_asset.is_uploaded is True

    @pytest.mark.django_db
    def test_member_can_patch_own_workspace_asset(self, api_key_client, workspace, create_user):
        """Positive control: an active member of the workspace can still update
        their own asset, so the fix does not over-block legitimate callers."""
        asset = FileAsset.objects.create(
            attributes={"name": "mine.pdf", "type": "application/pdf", "size": 10},
            asset=f"{workspace.id}/mine.pdf",
            size=10,
            workspace=workspace,
            created_by=create_user,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            is_uploaded=False,
            storage_metadata={"size": 10},
        )
        url = self.detail_url(workspace.slug, asset.id)

        response = api_key_client.patch(url, {"is_uploaded": True}, format="json")

        assert response.status_code == status.HTTP_204_NO_CONTENT, f"Got {response.status_code}: {response.data!r}"
        asset.refresh_from_db()
        assert asset.is_uploaded is True
