# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.urls import reverse


@pytest.mark.unit
def test_workspace_issue_types_route():
    assert reverse("workspace-issue-types", kwargs={"slug": "ws"}) == "/api/workspaces/ws/issue-types/"


@pytest.mark.unit
@pytest.mark.django_db
def test_issue_type_accessible_to_returns_queryset():
    from uuid import uuid4
    from django.db.models import QuerySet
    from plane.db.models import IssueType

    qs = IssueType.objects.accessible_to(uuid4(), "no-such-workspace")
    assert isinstance(qs, QuerySet)
    assert list(qs) == []
