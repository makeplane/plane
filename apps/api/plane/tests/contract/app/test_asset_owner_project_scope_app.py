# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Imported pytest fixtures are requested by parameter name, which F811 misreads as redefinition.
# ruff: noqa: F811

"""Assets with an empty ``project_id`` (workspace uploads, bulk-bound comment/page
assets, legacy editor uploads) follow the project of the issue, comment or page they
are bound to. A workspace member outside that project must not read them; draft assets
are only for their creator, and a restricted guest only reaches its own issues' assets.
"""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import DraftIssue, FileAsset, Page, ProjectPage, User, WorkspaceMember
from plane.tests.contract.app.test_guest_asset_download_scope_app import CHECK_URL, _get_all, _url
from plane.tests.contract.app.test_guest_issue_subresource_scope_app import (  # noqa: F401
    _make_comment,
    foreign_issue,
    guest,
    guest_client,
    own_issue,
    project,
)

TYPES = FileAsset.EntityTypeContext
OK = [status.HTTP_302_FOUND] * 2
DENIED = [status.HTTP_403_FORBIDDEN] * 2


def _read(client, workspace, project, asset):
    # The two workspace-level read routes; the project-scoped ones 404 on a NULL project_id.
    return _get_all(client, workspace, project, asset)[::2]


def _asset(workspace, entity_type, creator=None, **bound):
    # No project: the shape of rows written by the workspace POST, the bulk bind and legacy uploads
    asset = FileAsset(
        attributes={"name": "a.png", "type": "image/png", "size": 100},
        asset=f"{workspace.id}/{uuid4().hex}-a.png",
        workspace=workspace,
        entity_type=entity_type,
        is_uploaded=True,
        **bound,
    )
    asset.save(created_by_id=creator.id if creator else None)
    return asset


@pytest.fixture
def outsider_client(db, workspace):
    user = User.objects.create(email=f"out-{uuid4().hex[:8]}@plane.so", username=f"out_{uuid4().hex[:8]}")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def page(workspace, project, create_user):
    page = Page.objects.create(name="Secret page", workspace=workspace, owned_by=create_user)
    ProjectPage.objects.create(workspace=workspace, project=project, page=page)
    return page


@pytest.fixture
def null_project_assets(workspace, foreign_issue, project, page, create_user):
    comment = _make_comment(foreign_issue, project, workspace, create_user)
    return [
        _asset(workspace, TYPES.ISSUE_DESCRIPTION, issue_id=foreign_issue.id),
        _asset(workspace, TYPES.COMMENT_DESCRIPTION, comment_id=comment.id),
        _asset(workspace, TYPES.PAGE_DESCRIPTION, page_id=page.id),
    ]


@pytest.mark.contract
@pytest.mark.django_db
class TestNullProjectAssets:
    def test_outsider_blocked(self, outsider_client, workspace, project, null_project_assets):
        for asset in null_project_assets:
            assert _read(outsider_client, workspace, project, asset) == DENIED, asset.entity_type
            assert outsider_client.get(_url(CHECK_URL, workspace, project, asset)).data == {"exists": False}

    def test_project_member_allowed(self, session_client, workspace, project, null_project_assets):
        for asset in null_project_assets:
            assert _read(session_client, workspace, project, asset) == OK, asset.entity_type

    def test_workspace_level_page_asset_stays_readable(self, outsider_client, workspace, project, create_user):
        page = Page.objects.create(name="Wiki", workspace=workspace, owned_by=create_user)
        asset = _asset(workspace, TYPES.PAGE_DESCRIPTION, page_id=page.id)
        assert _read(outsider_client, workspace, project, asset) == OK

    def test_restricted_guest(self, guest_client, workspace, project, own_issue, page):
        own = _asset(workspace, TYPES.ISSUE_DESCRIPTION, issue_id=own_issue.id)
        page_asset = _asset(workspace, TYPES.PAGE_DESCRIPTION, page_id=page.id)
        assert _read(guest_client, workspace, project, own) == OK
        assert _read(guest_client, workspace, project, page_asset) == DENIED


@pytest.mark.contract
@pytest.mark.django_db
class TestDraftAssets:
    def test_only_creator(self, session_client, guest_client, workspace, project, create_user):
        draft = DraftIssue.objects.create(name="d", workspace=workspace, project=project)
        asset = _asset(workspace, TYPES.DRAFT_ISSUE_DESCRIPTION, creator=create_user, draft_issue_id=draft.id)
        assert _read(session_client, workspace, project, asset) == OK
        assert _read(guest_client, workspace, project, asset) == DENIED

    def test_unbound_draft_asset_not_open_to_others(self, session_client, workspace, project, guest):
        asset = _asset(workspace, TYPES.DRAFT_ISSUE_DESCRIPTION, creator=guest)
        assert _read(session_client, workspace, project, asset) == DENIED


@pytest.mark.contract
@pytest.mark.django_db
class TestForwardFix:
    def test_workspace_post_records_project(self, session_client, workspace, foreign_issue, project):
        with mock.patch("plane.app.views.asset.v2.S3Storage") as storage:
            storage.return_value.generate_presigned_post.return_value = {"url": "u", "fields": {}}
            response = session_client.post(
                f"/api/assets/v2/workspaces/{workspace.slug}/",
                {
                    "name": "a.png",
                    "type": "image/png",
                    "size": 100,
                    "entity_type": TYPES.ISSUE_DESCRIPTION,
                    "entity_identifier": str(foreign_issue.id),
                },
                format="json",
            )
        assert response.status_code == status.HTTP_200_OK, response.data
        asset = FileAsset.objects.get(issue_id=foreign_issue.id, entity_type=TYPES.ISSUE_DESCRIPTION)
        assert asset.project_id == project.id
