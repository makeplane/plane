# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for public Space comment-image assets.

Uploads through a published board are only for comment images: the board must
have comments enabled, the entity type must be COMMENT_DESCRIPTION, and any
comment binding must be the caller's own EXTERNAL comment on that board. The
bulk endpoint binds only the caller's own comment images to such a comment.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import DeployBoard, FileAsset, Issue, IssueComment, Project, State, User

UPLOAD_URL = "/api/public/assets/v2/anchor/{anchor}/"
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


def _project_with_issue(workspace, owner, identifier):
    project = Project.objects.create(name=identifier, identifier=identifier, workspace=workspace, created_by=owner)
    state = State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    issue = Issue.objects.create(name="Issue", workspace=workspace, project=project, state=state, created_by=owner)
    return project, issue


def _comment(issue, actor):
    return IssueComment.objects.create(
        issue=issue,
        project=issue.project,
        workspace=issue.workspace,
        comment_html="<p>comment</p>",
        access="EXTERNAL",
        actor=actor,
    )


def _asset(project, owner, entity_type=FileAsset.EntityTypeContext.COMMENT_DESCRIPTION):
    # BaseModel.save resets created_by from the request user, so set it via created_by_id.
    asset = FileAsset(
        attributes={"name": "image.png", "type": "image/png", "size": 10},
        asset=f"{project.workspace_id}/{uuid4().hex}-image.png",
        size=10,
        workspace=project.workspace,
        project_id=project.id,
        entity_type=entity_type,
        is_uploaded=True,
    )
    asset.save(created_by_id=owner.id)
    return asset


def _upload_payload(**overrides):
    payload = {
        "name": "image.png",
        "type": "image/png",
        "size": 10,
        "entity_type": FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
        "entity_identifier": "",
    }
    payload.update(overrides)
    return payload


@pytest.fixture(autouse=True)
def _no_storage():
    with mock.patch("plane.space.views.asset.S3Storage") as storage:
        storage.return_value.generate_presigned_post.return_value = {"url": "https://storage.test/", "fields": {}}
        yield


@pytest.fixture
def setup(db, workspace, create_user):
    project, issue = _project_with_issue(workspace, create_user, "PUB")
    other_project, other_issue = _project_with_issue(workspace, create_user, "OTH")
    board = DeployBoard.objects.create(
        workspace=workspace,
        project=project,
        entity_name="project",
        entity_identifier=project.id,
        is_comments_enabled=True,
    )
    commenter = _user("commenter")
    return {
        "board": board,
        "project": project,
        "issue": issue,
        "other_issue": other_issue,
        "commenter": commenter,
        "own_comment": _comment(issue, commenter),
    }


@pytest.mark.contract
@pytest.mark.django_db
class TestSpaceAssetUploadScope:
    def test_upload_refused_when_comments_disabled(self, setup):
        board = setup["board"]
        board.is_comments_enabled = False
        board.save()
        response = _client(setup["commenter"]).post(
            UPLOAD_URL.format(anchor=board.anchor), _upload_payload(), format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not FileAsset.objects.filter(project=setup["project"]).exists()

    def test_upload_rejects_non_comment_entity_type(self, setup):
        response = _client(setup["commenter"]).post(
            UPLOAD_URL.format(anchor=setup["board"].anchor),
            _upload_payload(entity_type=FileAsset.EntityTypeContext.PROJECT_COVER),
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not FileAsset.objects.filter(project=setup["project"]).exists()

    @pytest.mark.parametrize("target", ["others_comment", "outside_board_comment"])
    def test_upload_rejects_comment_not_owned_on_board(self, setup, target):
        if target == "others_comment":
            comment = _comment(setup["issue"], _user("other"))
        else:
            comment = _comment(setup["other_issue"], setup["commenter"])
        response = _client(setup["commenter"]).post(
            UPLOAD_URL.format(anchor=setup["board"].anchor),
            _upload_payload(entity_identifier=str(comment.id)),
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not FileAsset.objects.filter(project=setup["project"]).exists()

    def test_upload_with_empty_comment_id_is_unbound(self, setup):
        """The Spaces client sends entity_identifier="" before the comment exists."""
        response = _client(setup["commenter"]).post(
            UPLOAD_URL.format(anchor=setup["board"].anchor),
            _upload_payload(entity_identifier=""),
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert FileAsset.objects.get(id=response.data["asset_id"]).comment_id is None

    def test_comment_image_upload_and_bind(self, setup):
        """The Spaces comment-image flow: upload, then bind to the caller's new comment."""
        client = _client(setup["commenter"])
        anchor = setup["board"].anchor
        response = client.post(UPLOAD_URL.format(anchor=anchor), _upload_payload(), format="json")
        assert response.status_code == status.HTTP_200_OK
        asset = FileAsset.objects.get(id=response.data["asset_id"])
        assert asset.created_by_id == setup["commenter"].id

        own_comment = setup["own_comment"]
        response = client.post(
            BULK_URL.format(anchor=anchor, entity_id=own_comment.id), {"asset_ids": [str(asset.id)]}, format="json"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        asset.refresh_from_db()
        assert asset.comment_id == own_comment.id

        # Editing an existing own comment binds the upload directly
        response = client.post(
            UPLOAD_URL.format(anchor=anchor), _upload_payload(entity_identifier=str(own_comment.id)), format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert FileAsset.objects.get(id=response.data["asset_id"]).comment_id == own_comment.id


@pytest.mark.contract
@pytest.mark.django_db
class TestSpaceAssetBulkBindScope:
    def test_bulk_refused_when_comments_disabled(self, setup):
        board = setup["board"]
        board.is_comments_enabled = False
        board.save()
        asset = _asset(setup["project"], setup["commenter"])
        response = _client(setup["commenter"]).post(
            BULK_URL.format(anchor=board.anchor, entity_id=setup["own_comment"].id),
            {"asset_ids": [str(asset.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        asset.refresh_from_db()
        assert asset.comment_id is None

    def test_bulk_does_not_bind_others_asset(self, setup):
        asset = _asset(setup["project"], _user("owner"))
        response = _client(setup["commenter"]).post(
            BULK_URL.format(anchor=setup["board"].anchor, entity_id=setup["own_comment"].id),
            {"asset_ids": [str(asset.id)]},
            format="json",
        )
        assert response.status_code in (status.HTTP_204_NO_CONTENT, status.HTTP_404_NOT_FOUND)
        asset.refresh_from_db()
        assert asset.comment_id is None

    def test_bulk_does_not_bind_non_comment_asset(self, setup):
        commenter = setup["commenter"]
        other = _asset(setup["project"], commenter, FileAsset.EntityTypeContext.ISSUE_DESCRIPTION)
        image = _asset(setup["project"], commenter)
        response = _client(commenter).post(
            BULK_URL.format(anchor=setup["board"].anchor, entity_id=setup["own_comment"].id),
            {"asset_ids": [str(image.id), str(other.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        image.refresh_from_db()
        other.refresh_from_db()
        assert image.comment_id == setup["own_comment"].id
        assert other.comment_id is None

    @pytest.mark.parametrize("target", ["others_comment", "outside_board_comment", "missing_comment"])
    def test_bulk_rejects_comment_not_owned_on_board(self, setup, target):
        commenter = setup["commenter"]
        if target == "others_comment":
            entity_id = _comment(setup["issue"], _user("other")).id
        elif target == "outside_board_comment":
            entity_id = _comment(setup["other_issue"], commenter).id
        else:
            entity_id = uuid4()
        asset = _asset(setup["project"], commenter)
        response = _client(commenter).post(
            BULK_URL.format(anchor=setup["board"].anchor, entity_id=entity_id),
            {"asset_ids": [str(asset.id)]},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        asset.refresh_from_db()
        assert asset.comment_id is None
