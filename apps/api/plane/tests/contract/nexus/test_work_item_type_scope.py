# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.db.models import IssueType, Workspace
from plane.db.models.issue_type import ProjectIssueType


@pytest.mark.contract
class TestWorkItemTypeMustBeEnabledInProject:
    def test_type_not_imported_is_refused(self, client, project_url, workspace):
        t = IssueType.objects.create(workspace=workspace, name="Bug")
        res = client.post(project_url("work-items/"), {"name": "x", "type_id": str(t.id)}, format="json")
        assert res.status_code == 400 and "type_id" in str(res.data)

    def test_type_from_another_workspace_is_refused(self, client, project_url, create_user):
        other = Workspace.objects.create(name="O", slug="o-scope", owner=create_user)
        t = IssueType.objects.create(workspace=other, name="Bug")
        res = client.post(project_url("work-items/"), {"name": "x", "type_id": str(t.id)}, format="json")
        assert res.status_code == 400

    def test_imported_type_is_accepted(self, client, project_url, project, workspace):
        t = IssueType.objects.create(workspace=workspace, name="Bug")
        ProjectIssueType.objects.create(project=project, issue_type=t)
        res = client.post(project_url("work-items/"), {"name": "x", "type_id": str(t.id)}, format="json")
        assert res.status_code == 201, res.data
