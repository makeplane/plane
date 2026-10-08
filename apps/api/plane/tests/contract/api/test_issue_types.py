# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for the Work Item Types REST API.

GET/POST /api/v1/workspaces/<slug>/projects/<project_id>/issue-types/
"""

import pytest


@pytest.mark.unit
def test_issue_type_urls_are_registered():
    from django.urls import reverse

    url = reverse(
        "external-issue-type",
        kwargs={"slug": "ws", "project_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert url.endswith("/issue-types/")
