# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""Contract tests for WorkspaceViewIssuesViewSet post-migration.

Endpoint: GET /api/workspaces/<slug>/issues/ (the workspace-view issues
listing previously broken by the same `get_accessible_resources` /
rel == "guest" bug as WorkItemListWorkspaceEndpoint).
"""

import pytest

from plane.tests.contract.conftest_listing_authorization import (
    EXPECTED_FORBIDDEN,
    authorized_listing_roles,
    expected_ids_from_fixtures,
)


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceViewIssuesAuthorized:
    @authorized_listing_roles
    def test_role_matrix(
        self, role, expected_ids_key, listing_auth, api_client,
    ):
        user = listing_auth.users[role]
        api_client.force_authenticate(user=user)
        url = f"/api/workspaces/{listing_auth.workspace.slug}/issues/"
        response = api_client.get(url)

        if expected_ids_key == EXPECTED_FORBIDDEN:
            assert response.status_code == 403, (
                f"Role {role!r}: expected 403, got {response.status_code}: {response.data!r}"
            )
            return

        assert response.status_code == 200, (
            f"Expected 200 for role {role!r}, got {response.status_code}: {response.data!r}"
        )
        expected = expected_ids_from_fixtures(listing_auth, expected_ids_key)
        # This endpoint's response uses issue_on_results which returns raw
        # UUID objects (vs string UUIDs elsewhere). Normalize both sides.
        results = response.data.get("results", [])
        returned = {str(row["id"]) for row in results}
        expected_str = {str(i) for i in expected}
        assert returned == expected_str, (
            f"Role {role!r}: expected {expected_str} got {returned}"
        )
        assert response.data["total_count"] == len(expected)
        assert response.data["total_results"] == len(expected)
