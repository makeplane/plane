# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
ExportIssuesEndpoint.get sanitizes the order_by query param against
EXPORTER_HISTORY_ORDER_BY_ALLOWLIST: only plain export-history fields are used
for ordering; anything else falls back to -created_at.
"""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status

from plane.db.models import ExporterHistory, Workspace, WorkspaceMember


def _export_url(slug):
    return f"/api/workspaces/{slug}/export-issues/"


def _create_export(workspace, user):
    return ExporterHistory.objects.create(
        workspace=workspace, project=[], initiated_by=user, provider="csv", type="issue_exports"
    )


@pytest.mark.contract
class TestExportOrderByAllowlist:
    @pytest.mark.django_db
    @pytest.mark.parametrize(
        "order_by",
        [
            "bogus_field",
            "bogus__field__x",
            "initiated_by__member_workspace__workspace__name",
            "-initiated_by__member_workspace__workspace__name",
        ],
    )
    def test_non_allowlisted_order_by_falls_back_to_default(self, session_client, workspace, create_user, order_by):
        """Non-allowlisted values must not reach the ORM: the response is the
        plain export list (one row per export) in default order."""
        other_workspace = Workspace.objects.create(name="Other", owner=create_user, slug="other-workspace")
        WorkspaceMember.objects.create(workspace=other_workspace, member=create_user, role=20)
        export = _create_export(workspace, create_user)

        response = session_client.get(
            _export_url(workspace.slug), {"per_page": 10, "cursor": "10:0:0", "order_by": order_by}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_count"] == 1
        assert [str(row["id"]) for row in response.data["results"]] == [str(export.id)]

    @pytest.mark.django_db
    def test_allowlisted_order_by_orders_results(self, session_client, workspace, create_user):
        older = _create_export(workspace, create_user)
        newer = _create_export(workspace, create_user)
        ExporterHistory.objects.filter(pk=older.pk).update(created_at=timezone.now() - timedelta(days=1))

        params = {"per_page": 10, "cursor": "10:0:0"}
        asc = session_client.get(_export_url(workspace.slug), {**params, "order_by": "created_at"})
        desc = session_client.get(_export_url(workspace.slug), {**params, "order_by": "-created_at"})
        default = session_client.get(_export_url(workspace.slug), params)

        assert asc.status_code == status.HTTP_200_OK
        assert [str(r["id"]) for r in asc.data["results"]] == [str(older.id), str(newer.id)]
        assert [str(r["id"]) for r in desc.data["results"]] == [str(newer.id), str(older.id)]
        assert [str(r["id"]) for r in default.data["results"]] == [str(newer.id), str(older.id)]
