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

import pytest

from plane.db.models import Issue, IssueView
from plane.permissions import (
    WorkitemPermissions,
    WorkitemViewPermissions,
    WorkspaceWorkitemViewPermissions,
)
from plane.permissions.meta import resolve_condition_field, resolve_scope_spec


@pytest.mark.unit
class TestIssuePermissionMeta:
    def test_issue_has_permission_meta(self):
        assert hasattr(Issue, "PermissionMeta")

    def test_scope_spec_for_workitem_view(self):
        spec = resolve_scope_spec(Issue, WorkitemPermissions.VIEW)
        assert spec.resource_type == "project"
        assert spec.fk == "project_id"

    def test_creator_condition_field(self):
        field = resolve_condition_field(Issue, "creator")
        assert field == "created_by"


@pytest.mark.unit
class TestIssueViewPermissionMeta:
    def test_issueview_has_permission_meta(self):
        assert hasattr(IssueView, "PermissionMeta")

    def test_project_scope_spec(self):
        spec = resolve_scope_spec(IssueView, WorkitemViewPermissions.VIEW)
        assert spec.resource_type == "project"
        assert spec.fk == "project_id"

    def test_workspace_scope_spec(self):
        spec = resolve_scope_spec(IssueView, WorkspaceWorkitemViewPermissions.VIEW)
        assert spec.resource_type == "workspace"
        assert spec.fk == "workspace_id"

    def test_creator_condition_field(self):
        field = resolve_condition_field(IssueView, "creator")
        assert field == "created_by"
