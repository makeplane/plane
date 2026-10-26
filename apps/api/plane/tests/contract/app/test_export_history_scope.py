# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Export history lists only the exports the requesting user initiated."""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import ExporterHistory, User, WorkspaceMember

pytestmark = pytest.mark.contract


def _make_user(prefix):
    unique = uuid4().hex[:8]
    user = User.objects.create(email=f"{prefix}-{unique}@plane.so", username=f"{prefix}_{unique}")
    user.set_password("test-password")
    user.save()
    return user


def _client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _export_url(slug):
    return f"/api/workspaces/{slug}/export-issues/?per_page=10&cursor=10:0:0"


@pytest.fixture
def other_member(db, workspace):
    """A second, active workspace MEMBER (role 15) — a different user than
    the workspace fixture's own admin/creator."""
    user = _make_user("other-member")
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=15, is_active=True)
    return user


def _make_export(workspace, user):
    return ExporterHistory.objects.create(
        workspace=workspace,
        project=[],
        initiated_by=user,
        provider="csv",
        type="issue_exports",
        url=f"https://example-bucket.s3.amazonaws.com/{uuid4().hex}.csv?X-Amz-Signature=test",
    )


def _result_ids(response):
    return {str(row["id"]) for row in response.data["results"]}


@pytest.mark.django_db
class TestExportHistoryScope:
    def test_member_sees_only_own_exports(self, workspace, create_user, other_member):
        admin_export = _make_export(workspace, create_user)
        member_export = _make_export(workspace, other_member)

        response = _client_for(other_member).get(_export_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK, response.data
        assert _result_ids(response) == {str(member_export.id)}
        assert response.data["results"][0]["url"] == member_export.url
        assert str(admin_export.id) not in _result_ids(response)

    def test_admin_sees_only_own_exports(self, workspace, create_user, other_member):
        admin_export = _make_export(workspace, create_user)
        member_export = _make_export(workspace, other_member)

        response = _client_for(create_user).get(_export_url(workspace.slug))

        assert response.status_code == status.HTTP_200_OK, response.data
        assert _result_ids(response) == {str(admin_export.id)}
        assert str(member_export.id) not in _result_ids(response)
