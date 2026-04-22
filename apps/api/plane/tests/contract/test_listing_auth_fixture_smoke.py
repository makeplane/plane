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

"""Smoke test — verifies the listing-auth fixture builds correctly and
the role → expected-IDs lookup works.
"""

import pytest


@pytest.mark.contract
@pytest.mark.django_db
def test_fixture_builds(listing_auth):
    assert listing_auth.workspace is not None
    assert listing_auth.project_a.workspace_id == listing_auth.workspace.id
    assert listing_auth.project_b.workspace_id == listing_auth.workspace.id
    assert len(listing_auth.all_issue_ids) == 5
    assert len(listing_auth.project_a_issue_ids) == 3
    assert len(listing_auth.project_b_issue_ids) == 2
    assert len(listing_auth.guest_a_own_issue_ids) == 1
    assert listing_auth.all_issue_ids == (
        listing_auth.project_a_issue_ids | listing_auth.project_b_issue_ids
    )
    assert listing_auth.guest_a_own_issue_ids.issubset(listing_auth.project_a_issue_ids)
    # Users present — both workspace-member users (pass @can gate) and the
    # outsider (fails @can gate, tests the scope-membership path explicitly).
    for slug in (
        "owner", "admin", "contributor_a",
        "guest_a_created_some", "guest_a_created_none",
        "workspace_member_no_project", "outsider",
    ):
        assert slug in listing_auth.users
