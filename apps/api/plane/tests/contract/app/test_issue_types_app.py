# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.urls import reverse


@pytest.mark.unit
def test_workspace_issue_types_route():
    assert reverse("workspace-issue-types", kwargs={"slug": "ws"}) == "/api/workspaces/ws/issue-types/"
