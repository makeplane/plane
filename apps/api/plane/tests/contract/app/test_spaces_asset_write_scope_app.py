# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for public Spaces board asset writes.

Regression coverage for GHSA-3f69-fm43-rgvh.

The public Spaces asset write endpoints (``/api/public/assets/v2/anchor/<anchor>/...``)
resolved the target ``FileAsset`` from the anchor alone and mutated it without
ever consulting the caller's identity: any authenticated account on the instance
could overwrite, soft-delete, restore and create assets in a published board's
project, and re-parent COMMENT_DESCRIPTION assets onto an arbitrary comment id.

The fix gates asset creation on ``is_comments_enabled`` + COMMENT_DESCRIPTION,
scopes finalize (patch) to the asset's uploader, and requires uploader-or-project-
member authorization for delete/restore, with the bulk endpoint additionally
binding the target comment to the board and its actor.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    DeployBoard,
    FileAsset,
    Issue,
    IssueComment,
    Project,
    ProjectMember,
    State,
    User,
)


# --------------------------------------------------------------------------- #
# URL helpers
# --------------------------------------------------------------------------- #
def assets_url(anchor):
    return f"/api/public/assets/v2/anchor/{anchor}/"


def asset_detail_url(anchor, pk):
    return f"/api/public/assets/v2/anchor/{anchor}/{pk}/"


def asset_restore_url(anchor, pk):
    return f"/api/public/assets/v2/anchor/{anchor}/restore/{pk}/"


def assets_bulk_url(anchor, entity_id):
    return f"/api/public/assets/v2/anchor/{anchor}/{entity_id}/bulk/"


def make_user(db, prefix):
    uid = uuid4().hex[:8]
    user = User.objects.create(email=f"{prefix}-{uid}@plane.so", username=f"{prefix}_{uid}")
    user.set_password("test-password")
    user.save()
    return user


def make_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def make_asset(workspace, project, created_by, entity_type, **kwargs):
    # BaseModel.save() overrides created_by from crum's current user (None in
    # tests), so set it via update() which bypasses save()
    asset = FileAsset.objects.create(
        attributes={"name": "roadmap.png", "type": "image/png", "size": 10},
        asset=f"{workspace.id}/{uuid4().hex}-roadmap.png",
        size=10,
        workspace=workspace,
        project_id=project.id,
        entity_type=entity_type,
        **kwargs,
    )
    FileAsset.objects.filter(id=asset.id).update(created_by=created_by)
    asset.refresh_from_db()
    return asset


# --------------------------------------------------------------------------- #
# Fixtures
# --------------------------------------------------------------------------- #
@pytest.fixture
def board(db, workspace, create_user):
    """A published project board with comments enabled, carrying one fully
    uploaded ISSUE_DESCRIPTION file owned by the project owner.

    ``create_user`` (session_client) is an active member of this project.
    """
    project = Project.objects.create(
        name="Board Project", identifier="BRD", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20, is_active=True)
    state = State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    issue = Issue.objects.create(
        name="Board Issue", workspace=workspace, project=project, state=state, created_by=create_user
    )
    deploy_board = DeployBoard.objects.create(
        entity_name="project",
        entity_identifier=project.id,
        project=project,
        workspace=workspace,
        is_comments_enabled=True,
    )
    asset = make_asset(
        workspace,
        project,
        create_user,
        FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
        issue_id=issue.id,
        is_uploaded=True,
    )
    owner_comment = IssueComment.objects.create(
        issue=issue,
        project=project,
        workspace=workspace,
        comment_html="<p>owner comment</p>",
        access="EXTERNAL",
        created_by=create_user,
        actor=create_user,
    )
    return {
        "project": project,
        "issue": issue,
        "asset": asset,
        "owner_comment": owner_comment,
        "anchor": deploy_board.anchor,
    }


@pytest.fixture
def board_comments_disabled(db, workspace, create_user):
    """A published board with comments DISABLED, for the is_comments_enabled gate."""
    project = Project.objects.create(
        name="No-Comment Project", identifier="NCP", workspace=workspace, created_by=create_user
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20, is_active=True)
    deploy_board = DeployBoard.objects.create(
        entity_name="project",
        entity_identifier=project.id,
        project=project,
        workspace=workspace,
        is_comments_enabled=False,
    )
    return {"project": project, "anchor": deploy_board.anchor}


@pytest.fixture
def attacker_client(db):
    """An authenticated user with NO membership anywhere — the advisory's actor."""
    return make_client(make_user(db, "attacker"))


@pytest.fixture
def commenter(db, workspace, board):
    """An authenticated visitor with no membership who comments on the published
    board — the only legitimate public-write actor. Owns a comment and a
    not-yet-uploaded COMMENT_DESCRIPTION asset."""
    user = make_user(db, "commenter")
    comment = IssueComment.objects.create(
        issue=board["issue"],
        project=board["project"],
        workspace=workspace,
        comment_html="<p>visitor comment</p>",
        access="EXTERNAL",
        created_by=user,
        actor=user,
    )
    asset = make_asset(
        workspace,
        board["project"],
        user,
        FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
        is_uploaded=False,
    )
    return {"user": user, "client": make_client(user), "comment": comment, "asset": asset}


@pytest.fixture
def member_client(db, workspace, board):
    """An active project member who did NOT create the board's asset — exercises
    the membership branch of the delete/restore authorization."""
    user = make_user(db, "member")
    ProjectMember.objects.create(project=board["project"], member=user, workspace=workspace, role=15, is_active=True)
    return make_client(user)


# --------------------------------------------------------------------------- #
# Cross-tenant WRITE — must be rejected
# --------------------------------------------------------------------------- #
@pytest.mark.contract
class TestSpacesAssetWriteScope:
    # ----------------------------------------------------------------------- #
    # EntityAssetEndpoint.patch — only the uploader finalises their own asset
    # ----------------------------------------------------------------------- #
    @pytest.mark.django_db
    def test_outsider_cannot_finalize_others_asset(self, attacker_client, board):
        response = attacker_client.patch(
            asset_detail_url(board["anchor"], board["asset"].id),
            {"attributes": {"name": "OWNED.png", "type": "image/png", "size": 1}},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        board["asset"].refresh_from_db()
        assert board["asset"].attributes["name"] == "roadmap.png"

    @pytest.mark.django_db
    def test_uploader_can_finalize_own_comment_asset(self, commenter, board):
        with mock.patch("plane.space.views.asset.get_asset_object_metadata") as mock_metadata:
            response = commenter["client"].patch(asset_detail_url(board["anchor"], commenter["asset"].id))
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        commenter["asset"].refresh_from_db()
        assert commenter["asset"].is_uploaded is True
        mock_metadata.delay.assert_called_once()

    # ----------------------------------------------------------------------- #
    # EntityAssetEndpoint.delete — uploader or project member only
    # ----------------------------------------------------------------------- #
    @pytest.mark.django_db
    def test_outsider_cannot_delete_project_file(self, attacker_client, board):
        response = attacker_client.delete(asset_detail_url(board["anchor"], board["asset"].id))
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        board["asset"].refresh_from_db()
        assert board["asset"].is_deleted is False

    @pytest.mark.django_db
    def test_uploader_can_delete_own_comment_asset(self, commenter, board):
        response = commenter["client"].delete(asset_detail_url(board["anchor"], commenter["asset"].id))
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        commenter["asset"].refresh_from_db()
        assert commenter["asset"].is_deleted is True

    @pytest.mark.django_db
    def test_project_member_can_delete_project_file(self, member_client, board):
        response = member_client.delete(asset_detail_url(board["anchor"], board["asset"].id))
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        board["asset"].refresh_from_db()
        assert board["asset"].is_deleted is True

    @pytest.mark.django_db
    def test_project_guest_cannot_delete_others_project_file(self, db, workspace, board):
        # In-app a guest may not delete another's asset; the public route must not widen that
        guest = make_user(db, "guest")
        ProjectMember.objects.create(
            project=board["project"], member=guest, workspace=workspace, role=5, is_active=True
        )
        response = make_client(guest).delete(asset_detail_url(board["anchor"], board["asset"].id))
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        board["asset"].refresh_from_db()
        assert board["asset"].is_deleted is False

    @pytest.mark.django_db
    def test_former_member_cannot_delete_own_project_file(self, db, workspace, board):
        # Only comment images pass on uploader alone; other uploads need active membership, as in-app
        former = make_user(db, "former")
        ProjectMember.objects.create(
            project=board["project"], member=former, workspace=workspace, role=15, is_active=False
        )
        asset = make_asset(
            workspace,
            board["project"],
            former,
            FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
            issue_id=board["issue"].id,
            is_uploaded=True,
        )
        response = make_client(former).delete(asset_detail_url(board["anchor"], asset.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        asset.refresh_from_db()
        assert asset.is_deleted is False

    @pytest.mark.django_db
    def test_project_cover_not_reachable_through_board(self, member_client, workspace, board):
        # A board only shows description assets; nothing else is reachable through its anchor
        cover = make_asset(
            workspace, board["project"], board["asset"].created_by, FileAsset.EntityTypeContext.PROJECT_COVER
        )
        response = member_client.delete(asset_detail_url(board["anchor"], cover.id))
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        cover.refresh_from_db()
        assert cover.is_deleted is False

    # ----------------------------------------------------------------------- #
    # AssetRestoreEndpoint.post — uploader or project member only, even though
    # the asset is resolved through all_objects (soft-deleted rows included)
    # ----------------------------------------------------------------------- #
    @pytest.mark.django_db
    def test_outsider_cannot_restore_project_file(self, attacker_client, board):
        board["asset"].is_deleted = True
        board["asset"].save(update_fields=["is_deleted"])
        response = attacker_client.post(asset_restore_url(board["anchor"], board["asset"].id))
        assert response.status_code == status.HTTP_403_FORBIDDEN, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        board["asset"].refresh_from_db()
        assert board["asset"].is_deleted is True

    @pytest.mark.django_db
    def test_uploader_can_restore_own_comment_asset(self, commenter, board):
        commenter["asset"].is_deleted = True
        commenter["asset"].save(update_fields=["is_deleted"])
        response = commenter["client"].post(asset_restore_url(board["anchor"], commenter["asset"].id))
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        commenter["asset"].refresh_from_db()
        assert commenter["asset"].is_deleted is False

    # ----------------------------------------------------------------------- #
    # EntityAssetEndpoint.post — only comment assets, only where the publisher
    # enabled comments
    # ----------------------------------------------------------------------- #
    @pytest.mark.django_db
    def test_outsider_cannot_create_non_comment_asset(self, attacker_client, board):
        response = attacker_client.post(
            assets_url(board["anchor"]),
            {
                "name": "evil.png",
                "type": "image/png",
                "size": 10,
                "entity_type": FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
                "entity_identifier": str(board["issue"].id),
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        assert not FileAsset.objects.filter(attributes__name="evil.png").exists()

    @pytest.mark.django_db
    def test_cannot_create_asset_when_comments_disabled(self, attacker_client, board_comments_disabled):
        response = attacker_client.post(
            assets_url(board_comments_disabled["anchor"]),
            {
                "name": "evil.png",
                "type": "image/png",
                "size": 10,
                "entity_type": FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )

    @pytest.mark.django_db
    def test_visitor_can_create_comment_asset_when_comments_enabled(self, commenter, board):
        with mock.patch("plane.space.views.asset.S3Storage") as mock_storage:
            mock_storage.return_value.generate_presigned_post.return_value = {"url": "x", "fields": {}}
            response = commenter["client"].post(
                assets_url(board["anchor"]),
                {
                    "name": "comment-image.png",
                    "type": "image/png",
                    "size": 10,
                    "entity_type": FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
                    "entity_identifier": str(commenter["comment"].id),
                },
                format="json",
            )
        assert response.status_code == status.HTTP_200_OK, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        asset = FileAsset.objects.get(id=response.data["asset_id"])
        assert asset.created_by_id == commenter["user"].id
        assert asset.entity_type == FileAsset.EntityTypeContext.COMMENT_DESCRIPTION

    # ----------------------------------------------------------------------- #
    # EntityBulkAssetEndpoint.post — caller's own assets onto caller's own
    # comment on this board only
    # ----------------------------------------------------------------------- #
    @pytest.mark.django_db
    def test_outsider_cannot_reparent_others_assets(self, attacker_client, board, commenter):
        response = attacker_client.post(
            assets_bulk_url(board["anchor"], commenter["comment"].id),
            {"asset_ids": [str(board["asset"].id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        board["asset"].refresh_from_db()
        assert board["asset"].comment_id is None

    @pytest.mark.django_db
    def test_cannot_reparent_onto_others_comment(self, commenter, board):
        response = commenter["client"].post(
            assets_bulk_url(board["anchor"], board["owner_comment"].id),
            {"asset_ids": [str(commenter["asset"].id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        commenter["asset"].refresh_from_db()
        assert commenter["asset"].comment_id is None

    @pytest.mark.django_db
    def test_can_reparent_own_assets_onto_own_comment(self, commenter, board):
        response = commenter["client"].post(
            assets_bulk_url(board["anchor"], commenter["comment"].id),
            {"asset_ids": [str(commenter["asset"].id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT, (
            f"Got {response.status_code}: {getattr(response, 'data', None)!r}"
        )
        commenter["asset"].refresh_from_db()
        assert str(commenter["asset"].comment_id) == str(commenter["comment"].id)
