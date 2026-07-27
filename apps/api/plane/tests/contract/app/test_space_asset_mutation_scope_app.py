# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for public Space asset mutation ownership scoping.

Regression coverage for GHSA-5q33-2766-fprm. The public Space asset
delete/restore/bulk (and patch) endpoints require only authentication and scoped
assets to the deploy board's workspace/project — but not to
``created_by=request.user``. Any authenticated public-site user who knew the
anchor and an asset UUID could delete/restore another user's asset, or rebind
others' comment-description assets to a caller-controlled entity id.

The fix scopes every mutation to ``created_by=request.user`` (a public-site user
may mutate only assets they created).
"""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import DeployBoard, FileAsset, Project, User

DELETE_URL = "/api/public/assets/v2/anchor/{anchor}/{pk}/"
RESTORE_URL = "/api/public/assets/v2/anchor/{anchor}/restore/{pk}/"
BULK_URL = "/api/public/assets/v2/anchor/{anchor}/{entity_id}/bulk/"


def _user(prefix):
    unique = uuid4().hex[:8]
    user = User.objects.create(email=f"{prefix}-{unique}@plane.so", username=f"{prefix}_{unique}")
    user.set_password("test-password")
    user.save()
    return user


def _client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def project(db, workspace, create_user):
    return Project.objects.create(
        name="Published Project", identifier="PUB", workspace=workspace, created_by=create_user
    )


@pytest.fixture
def board(db, workspace, project):
    return DeployBoard.objects.create(
        workspace=workspace, project=project, entity_name="project", entity_identifier=project.id
    )


@pytest.fixture
def owner(db):
    return _user("owner")


def _asset(workspace, project, owner, *, is_deleted=False):
    # BaseModel.save nulls created_by from the request user (None under tests), so a
    # created_by= kwarg to create() is dropped; set it explicitly via created_by_id.
    asset = FileAsset(
        attributes={"name": "owned.pdf", "type": "application/pdf", "size": 10},
        asset=f"{workspace.id}/{uuid4().hex}-owned.pdf",
        size=10,
        workspace=workspace,
        project_id=project.id,
        entity_type=FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
        is_uploaded=True,
        is_deleted=is_deleted,
    )
    asset.save(created_by_id=owner.id)
    return asset


@pytest.mark.contract
@pytest.mark.django_db
class TestSpaceAssetMutationScope:
    """A public-site user must not mutate another user's assets."""

    def test_attacker_cannot_delete_others_asset(self, workspace, project, board, owner):
        asset = _asset(workspace, project, owner)
        attacker = _user("attacker")
        response = _client(attacker).delete(DELETE_URL.format(anchor=board.anchor, pk=asset.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        asset.refresh_from_db()
        assert asset.is_deleted is False, "Another user's asset was deleted"

    def test_attacker_cannot_restore_others_asset(self, workspace, project, board, owner):
        asset = _asset(workspace, project, owner, is_deleted=True)
        attacker = _user("attacker")
        response = _client(attacker).post(RESTORE_URL.format(anchor=board.anchor, pk=asset.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        asset.refresh_from_db()
        assert asset.is_deleted is True, "Another user's asset was restored"

    def test_attacker_cannot_rebind_others_asset(self, workspace, project, board, owner):
        asset = _asset(workspace, project, owner)
        original_comment = asset.comment_id
        attacker = _user("attacker")
        response = _client(attacker).post(
            BULK_URL.format(anchor=board.anchor, entity_id=str(uuid4())),
            {"asset_ids": [str(asset.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        asset.refresh_from_db()
        assert asset.comment_id == original_comment, "Another user's asset was rebound"

    def test_owner_can_delete_own_asset(self, workspace, project, board, owner):
        """Positive control: the asset's creator may delete it."""
        asset = _asset(workspace, project, owner)
        response = _client(owner).delete(DELETE_URL.format(anchor=board.anchor, pk=asset.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        asset.refresh_from_db()
        assert asset.is_deleted is True
