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

"""Contract tests for WorkItemListWorkspaceEndpoint post-migration.

Covers the full role matrix via the shared listing-auth fixture — if
.authorized_for() is ever missed or the filter regresses, this fixture
catches it. Assertions include total_count / total_results (not `count`,
which is current-page length) to catch total_count_queryset divergence.
"""

import pytest

from plane.tests.contract.conftest_listing_authorization import (
    EXPECTED_FORBIDDEN,
    authorized_listing_roles,
    expected_ids_from_fixtures,
)


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkItemListWorkspaceAuthorized:
    @authorized_listing_roles
    def test_role_matrix(
        self, role, expected_ids_key, listing_auth, api_client,
    ):
        user = listing_auth.users[role]
        api_client.force_authenticate(user=user)
        url = f"/api/workspaces/{listing_auth.workspace.slug}/work-items/"
        response = api_client.get(url)

        if expected_ids_key == EXPECTED_FORBIDDEN:
            # Scope-membership gate: callers outside the workspace fail
            # @can(WorkspacePermissions.VIEW) → 403. This exercises the
            # decorator path separately from .authorized_for()'s row filter.
            assert response.status_code == 403, (
                f"Role {role!r}: expected 403, got {response.status_code}: {response.data!r}"
            )
            return

        assert response.status_code == 200, (
            f"Expected 200 for role {role!r}, got {response.status_code}: {response.data!r}"
        )
        expected = expected_ids_from_fixtures(listing_auth, expected_ids_key)
        returned = {row["id"] for row in response.data["results"]}
        expected_str = {str(i) for i in expected}
        assert returned == expected_str, (
            f"Role {role!r}: expected {expected_str} got {returned}"
        )
        # total_count / total_results are the authorization-sensitive totals
        # (count is just current-page length). Both must reflect the
        # authorized row set.
        assert response.data["total_count"] == len(expected), (
            f"Role {role!r}: total_count {response.data['total_count']} != expected {len(expected)}"
        )
        assert response.data["total_results"] == len(expected)
