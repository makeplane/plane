# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests: a public Space anchor only serves assets of content the board shows."""

from unittest import mock
from uuid import uuid4

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import DeployBoard, FileAsset, Issue, IssueComment, Project, State

URL = "/api/public/assets/v2/anchor/{anchor}/{pk}/"
DESC = FileAsset.EntityTypeContext.ISSUE_DESCRIPTION
COMMENT = FileAsset.EntityTypeContext.COMMENT_DESCRIPTION


def _asset(project, entity_type, **bound):
    return FileAsset.objects.create(
        attributes={"name": "image.png", "type": "image/png", "size": 10},
        asset=f"{project.workspace_id}/{uuid4().hex}-image.png",
        size=10,
        workspace=project.workspace,
        project_id=project.id,
        entity_type=entity_type,
        is_uploaded=True,
        **bound,
    )


@pytest.fixture(autouse=True)
def _no_storage():
    with mock.patch("plane.space.views.asset.S3Storage") as storage:
        storage.return_value.generate_presigned_url.return_value = "https://storage.test/signed"
        yield


@pytest.fixture
def setup(db, workspace, create_user):
    project = Project.objects.create(name="PUB", identifier="PUB", workspace=workspace, created_by=create_user)
    state = State.objects.create(name="Todo", project=project, workspace=workspace, group="backlog", default=True)
    board = DeployBoard.objects.create(
        workspace=workspace, project=project, entity_name="project", entity_identifier=project.id
    )

    def issue(**extra):
        return Issue.objects.create(
            **{"name": "Issue", "workspace": workspace, "project": project, "state": state, **extra}
        )

    return {"project": project, "board": board, "issue": issue, "workspace": workspace, "user": create_user}


def _get(board, asset):
    return APIClient().get(URL.format(anchor=board.anchor, pk=asset.id))


@pytest.mark.contract
@pytest.mark.django_db
class TestSpaceAssetBinding:
    def test_published_issue_asset_is_served(self, setup):
        asset = _asset(setup["project"], DESC, issue=setup["issue"]())
        assert _get(setup["board"], asset).status_code == status.HTTP_302_FOUND

    def test_external_comment_asset_is_served(self, setup):
        issue = setup["issue"]()
        comment = IssueComment.objects.create(
            issue=issue,
            project=setup["project"],
            workspace=setup["workspace"],
            comment_html="<p>c</p>",
            access="EXTERNAL",
        )
        asset = _asset(setup["project"], COMMENT, comment=comment)
        assert _get(setup["board"], asset).status_code == status.HTTP_302_FOUND

    def test_internal_comment_asset_is_404(self, setup):
        comment = IssueComment.objects.create(
            issue=setup["issue"](),
            project=setup["project"],
            workspace=setup["workspace"],
            comment_html="<p>c</p>",
            access="INTERNAL",
        )
        asset = _asset(setup["project"], COMMENT, comment=comment)
        assert _get(setup["board"], asset).status_code == status.HTTP_404_NOT_FOUND

    def test_archived_issue_asset_is_404(self, setup):
        asset = _asset(setup["project"], DESC, issue=setup["issue"](archived_at=timezone.now().date()))
        assert _get(setup["board"], asset).status_code == status.HTTP_404_NOT_FOUND

    def test_draft_issue_asset_is_404(self, setup):
        asset = _asset(setup["project"], DESC, issue=setup["issue"](is_draft=True))
        assert _get(setup["board"], asset).status_code == status.HTTP_404_NOT_FOUND

    def test_intake_pending_issue_asset_is_404(self, setup):
        triage = State.objects.create(
            name="Triage", project=setup["project"], workspace=setup["workspace"], group="triage"
        )
        issue = setup["issue"](state=triage)
        asset = _asset(setup["project"], DESC, issue=issue)
        assert _get(setup["board"], asset).status_code == status.HTTP_404_NOT_FOUND

    def test_unbound_asset_is_404(self, setup):
        asset = _asset(setup["project"], DESC)
        assert _get(setup["board"], asset).status_code == status.HTTP_404_NOT_FOUND

    def test_non_project_board_is_404(self, setup):
        board = setup["board"]
        board.entity_name = "page"
        board.save()
        asset = _asset(setup["project"], DESC, issue=setup["issue"]())
        assert _get(board, asset).status_code == status.HTTP_404_NOT_FOUND
