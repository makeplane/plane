# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Imported pytest fixtures are requested by parameter name, which F811 misreads as redefinition.
# ruff: noqa: F811

"""A restricted guest (``guest_view_all_features=False``) must not read, by asset id,
the files of issues they did not create: attachments, description images and
comment images. ``FileAsset.is_project_accessible_to`` applies the rule for every
asset read route. Own issues, members and unrestricted guests are unaffected.

Reuses the fixtures of the sibling sub-resource test module.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status

from plane.db.models import FileAsset
from plane.tests.contract.app.test_guest_issue_subresource_scope_app import (  # noqa: F401
    _make_comment,
    foreign_issue,
    guest,
    guest_client,
    own_issue,
    project,
)

S3_STORAGE_PATH = "plane.app.views.asset.v2.S3Storage"

READ_URLS = [
    "/api/assets/v2/workspaces/{slug}/download/{asset_id}/",
    "/api/assets/v2/workspaces/{slug}/projects/{project_id}/download/{asset_id}/",
    "/api/assets/v2/workspaces/{slug}/{asset_id}/",
    "/api/assets/v2/workspaces/{slug}/projects/{project_id}/{asset_id}/",
]
CHECK_URL = "/api/assets/v2/workspaces/{slug}/check/{asset_id}/"
DUPLICATE_URL = "/api/assets/v2/workspaces/{slug}/duplicate-assets/{asset_id}/"


def _url(tpl, workspace, project, asset):
    return tpl.format(slug=workspace.slug, project_id=project.id, asset_id=asset.id)


def _attachment(issue):
    return FileAsset.objects.get(issue=issue, entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT)


def _get_all(client, workspace, project, asset):
    """Status codes of every read route for ``asset``; storage is mocked."""
    with mock.patch(S3_STORAGE_PATH) as storage:
        storage.return_value.generate_presigned_url.return_value = "https://example.com/s"
        return [client.get(_url(tpl, workspace, project, asset)).status_code for tpl in READ_URLS]


@pytest.fixture
def foreign_description_asset(workspace, project, foreign_issue):
    return FileAsset.objects.create(
        attributes={"name": "diagram.png", "type": "image/png", "size": 100},
        asset=f"{workspace.id}/{uuid4().hex}-diagram.png",
        workspace=workspace,
        project=project,
        issue_id=foreign_issue.id,
        entity_type=FileAsset.EntityTypeContext.ISSUE_DESCRIPTION,
        is_uploaded=True,
    )


@pytest.fixture
def foreign_comment_asset(workspace, project, foreign_issue, create_user):
    # Comment images carry the comment, not the issue (ProjectBulkAssetEndpoint).
    comment = _make_comment(foreign_issue, project, workspace, create_user)
    return FileAsset.objects.create(
        attributes={"name": "screenshot.png", "type": "image/png", "size": 100},
        asset=f"{workspace.id}/{uuid4().hex}-screenshot.png",
        workspace=workspace,
        project=project,
        comment_id=comment.id,
        entity_type=FileAsset.EntityTypeContext.COMMENT_DESCRIPTION,
        is_uploaded=True,
    )


@pytest.mark.contract
@pytest.mark.django_db
class TestGuestHiddenIssueAssets:
    def test_guest_blocked_from_foreign_issue_assets(
        self, guest_client, workspace, project, foreign_issue, foreign_description_asset, foreign_comment_asset
    ):
        for asset in (_attachment(foreign_issue), foreign_description_asset, foreign_comment_asset):
            assert _get_all(guest_client, workspace, project, asset) == [status.HTTP_403_FORBIDDEN] * 4, (
                asset.entity_type
            )

    def test_guest_check_and_duplicate_blocked(self, guest_client, workspace, project, foreign_issue):
        asset = _attachment(foreign_issue)
        assert guest_client.get(_url(CHECK_URL, workspace, project, asset)).data == {"exists": False}

        before = FileAsset.objects.count()
        with mock.patch(S3_STORAGE_PATH) as storage:
            response = guest_client.post(
                _url(DUPLICATE_URL, workspace, project, asset),
                {"entity_type": FileAsset.EntityTypeContext.ISSUE_ATTACHMENT, "project_id": str(project.id)},
                format="json",
            )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        storage.return_value.copy_object.assert_not_called()
        assert FileAsset.objects.count() == before

    def test_guest_allowed_own_issue_assets(self, guest_client, workspace, project, own_issue):
        assert _get_all(guest_client, workspace, project, _attachment(own_issue)) == [status.HTTP_302_FOUND] * 4

    def test_member_unaffected(self, session_client, workspace, project, foreign_issue, foreign_comment_asset):
        for asset in (_attachment(foreign_issue), foreign_comment_asset):
            assert _get_all(session_client, workspace, project, asset) == [status.HTTP_302_FOUND] * 4

    def test_unrestricted_guest_unaffected(self, guest_client, workspace, project, foreign_issue):
        project.guest_view_all_features = True
        project.save(update_fields=["guest_view_all_features"])
        assert _get_all(guest_client, workspace, project, _attachment(foreign_issue)) == [status.HTTP_302_FOUND] * 4
