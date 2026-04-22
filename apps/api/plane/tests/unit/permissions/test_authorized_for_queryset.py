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

"""Tests for QuerySet.authorized_for(request, permission) and
QuerySet.authorization_not_required(request).

Relies on the existing conftest fixtures (perm_workspace, perm_project,
project_contributor, project_guest, project_admin, member_user, guest_user,
admin_user, outsider_user, test_issue, default_state).
"""

from types import SimpleNamespace

import pytest
from crum import impersonate

from plane.db.models import Issue
from plane.permissions import WorkitemPermissions
from plane.permissions.exceptions import PermissionConfigurationError


def _fake_request(user, workspace_id):
    """Build a minimal request-like object carrying user + workspace_id.

    SimpleNamespace matches request.user / request.workspace_id attribute
    access and also accepts setattr for _authorized_for_called.
    """
    return SimpleNamespace(user=user, workspace_id=workspace_id)


@pytest.mark.unit
@pytest.mark.django_db
class TestAuthorizedFor:
    def test_workspace_owner_sees_all_rows(
        self, perm_workspace, perm_project, ws_owner_member, test_issue, owner_user,
    ):
        """Workspace owner holds workitem:* at workspace scope → fast path, queryset unchanged."""
        request = _fake_request(user=owner_user, workspace_id=perm_workspace.id)
        qs = Issue.issue_objects.filter(workspace=perm_workspace)
        authorized = qs.authorized_for(request, WorkitemPermissions.VIEW)
        ids = set(authorized.values_list("id", flat=True))
        assert test_issue.id in ids
        assert getattr(request, "_authorized_for_called", False) is True

    def test_contributor_sees_issues_in_their_projects(
        self, perm_workspace, perm_project, project_contributor, test_issue, member_user,
    ):
        request = _fake_request(user=member_user, workspace_id=perm_workspace.id)
        qs = Issue.issue_objects.filter(workspace=perm_workspace)
        authorized = qs.authorized_for(request, WorkitemPermissions.VIEW)
        ids = set(authorized.values_list("id", flat=True))
        assert test_issue.id in ids

    def test_guest_sees_only_own_issues(
        self, perm_workspace, perm_project, project_guest, default_state, guest_user, member_user,
    ):
        """Project guest holds workitem:view+creator — sees only their own issues."""
        # Issue created by someone else — guest should NOT see.
        with impersonate(member_user):
            other_issue = Issue.objects.create(
                project=perm_project, workspace=perm_workspace,
                name="Other's issue", state=default_state,
            )
        # Issue created by the guest — should see.
        with impersonate(guest_user):
            own_issue = Issue.objects.create(
                project=perm_project, workspace=perm_workspace,
                name="Guest's own issue", state=default_state,
            )
        request = _fake_request(user=guest_user, workspace_id=perm_workspace.id)
        qs = Issue.issue_objects.filter(workspace=perm_workspace)
        authorized = qs.authorized_for(request, WorkitemPermissions.VIEW)
        ids = set(authorized.values_list("id", flat=True))
        assert own_issue.id in ids
        assert other_issue.id not in ids

    def test_no_membership_returns_empty(
        self, perm_workspace, perm_project, test_issue, outsider_user,
    ):
        request = _fake_request(user=outsider_user, workspace_id=perm_workspace.id)
        qs = Issue.issue_objects.filter(workspace=perm_workspace)
        authorized = qs.authorized_for(request, WorkitemPermissions.VIEW)
        assert authorized.count() == 0

    def test_sets_authorized_for_called_flag(
        self, perm_workspace, outsider_user,
    ):
        request = _fake_request(user=outsider_user, workspace_id=perm_workspace.id)
        Issue.issue_objects.filter(workspace=perm_workspace).authorized_for(
            request, WorkitemPermissions.VIEW,
        )
        assert request._authorized_for_called is True

    def test_admin_hits_config_validation(
        self, perm_workspace, ws_owner_member, owner_user,
    ):
        """Misconfiguration (unknown permission for this model) must raise
        even when the caller is a workspace owner/admin. Otherwise admin
        requests silently pass while non-admin requests fail — making the
        misconfig invisible until a non-admin happens to hit the endpoint.
        """
        from plane.permissions import WorkspacePermissions  # not in Issue.scope_map
        request = _fake_request(user=owner_user, workspace_id=perm_workspace.id)
        qs = Issue.issue_objects.filter(workspace=perm_workspace)
        with pytest.raises(PermissionConfigurationError):
            qs.authorized_for(request, WorkspacePermissions.VIEW)


@pytest.mark.unit
@pytest.mark.django_db
class TestAuthorizationNotRequired:
    def test_sets_request_flag(self, perm_workspace, outsider_user):
        request = _fake_request(user=outsider_user, workspace_id=perm_workspace.id)
        qs = Issue.issue_objects.filter(workspace=perm_workspace)
        result = qs.authorization_not_required(request)
        assert request._authorized_for_called is True
        # Returned queryset is unchanged.
        assert str(result.query) == str(qs.query)
