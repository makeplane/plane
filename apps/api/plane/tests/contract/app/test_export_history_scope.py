# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Regression test for cross-member export-history disclosure.

Root cause: ExportIssuesEndpoint.get filtered ExporterHistory by
workspace__slug only, with no initiated_by filter — so any workspace
ADMIN/MEMBER could list every other member's export history.
ExporterHistorySerializer includes `url` (a presigned S3 link, 7-day expiry,
no auth required to use) and `token`. Since an export defaults to the
initiator's own projects (including fully private ones) when no project list
is supplied, this let any workspace member read another member's private
project data by listing exports and using the disclosed url — no crafted
request needed, no revocation possible once disclosed.

Fixed by adding initiated_by=request.user to the queryset filter.
"""

from uuid import uuid4

import pytest
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


@pytest.fixture
def own_export(db, workspace, create_user):
    """An export initiated by create_user (the workspace admin)."""
    return ExporterHistory.objects.create(
        workspace=workspace,
        project=[],
        initiated_by=create_user,
        provider="csv",
        type="issue_exports",
        url="https://example-bucket.s3.amazonaws.com/secret-export.csv?X-Amz-Signature=forged",
    )


@pytest.mark.django_db
class TestExportHistoryScope:
    def test_member_cannot_see_another_members_export(self, workspace, own_export, other_member):
        """other_member did not initiate own_export (create_user's) — must
        not see it, and therefore must never receive its presigned url."""
        response = _client_for(other_member).get(_export_url(workspace.slug))

        assert response.status_code == 200, response.data
        result_ids = [str(row["id"]) for row in response.data["results"]]
        assert str(own_export.id) not in result_ids, "a workspace member must not see another member's export history"

    def test_member_can_still_see_their_own_export(self, workspace, create_user, own_export):
        """Positive control: the initiator must still see their own export."""
        response = _client_for(create_user).get(_export_url(workspace.slug))

        assert response.status_code == 200, response.data
        result_ids = [str(row["id"]) for row in response.data["results"]]
        assert str(own_export.id) in result_ids
        own_row = next(row for row in response.data["results"] if str(row["id"]) == str(own_export.id))
        assert own_row["url"] == own_export.url
